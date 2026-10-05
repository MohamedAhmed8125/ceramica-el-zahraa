require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error('JWT_SECRET ناقص أو قصير (لازم 32 حرف على الأقل). راجع ملف .env');
  process.exit(1);
}
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_FILE = path.join(__dirname, '..', 'data', 'users.json');
const COOKIE = 'token';
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12); // لتقليل الفرق الزمني عند إيميل غير موجود

/* ---------- تخزين بسيط في ملف JSON (للإنتاج الكبير استخدم قاعدة بيانات) ---------- */
let queue = Promise.resolve();
const readUsers = async () => {
  try { return JSON.parse(await fs.readFile(DB_FILE, 'utf8')); }
  catch { return []; }
};
const updateUsers = fn => (queue = queue.then(async () => {
  const users = await readUsers();
  const result = await fn(users);
  const tmp = DB_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(users, null, 2));
  await fs.rename(tmp, DB_FILE);
  return result;
}));

/* ---------- Helpers ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = u => ({ id: u.id, name: u.name, email: u.email });
const setCookie = (res, user) => {
  const token = jwt.sign({ sub: user.id }, SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: 7 * 24 * 3600 * 1000
  });
};
const auth = async (req, res, next) => {
  try {
    const { sub } = jwt.verify(req.cookies[COOKIE] || '', SECRET);
    const user = (await readUsers()).find(u => u.id === sub);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'unauthorized' }); }
};

/* ---------- App ---------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: 'too_many_requests' }
});

app.post('/api/register', limiter, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 60) return res.status(400).json({ error: 'invalid_name' });
  if (!EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: 'invalid_email' });
  if (password.length < 8 || password.length > 100) return res.status(400).json({ error: 'weak_password' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await updateUsers(users => {
    if (users.some(u => u.email === email)) return null;
    const u = { id: crypto.randomUUID(), name, email, passwordHash, createdAt: new Date().toISOString() };
    users.push(u);
    return u;
  });
  if (!user) return res.status(409).json({ error: 'email_exists' });
  setCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/login', limiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = (await readUsers()).find(u => u.email === email);
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'invalid_credentials' });
  setCookie(res, user);
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

/* ---------- رسائل "اتصل بنا" ---------- */
const MSG_FILE = path.join(__dirname, '..', 'data', 'messages.json');
let msgQueue = Promise.resolve();
const saveMessage = m => (msgQueue = msgQueue.then(async () => {
  let list = [];
  try { list = JSON.parse(await fs.readFile(MSG_FILE, 'utf8')); } catch {}
  list.push(m);
  await fs.writeFile(MSG_FILE, JSON.stringify(list, null, 2));
}));

function normalizePhone(input) {
  let s = String(input || '').trim()
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[\s\-().]/g, '');
  if (!s) return '';
  if (s.startsWith('+20')) s = '0' + s.slice(3);
  else if (s.startsWith('0020')) s = '0' + s.slice(4);
  else if (/^20\d{9,10}$/.test(s)) s = '0' + s.slice(2);
  const mobile = /^01[0125]\d{8}$/;
  const landline = /^(02\d{8}|03\d{7}|0[4-9]\d{8})$/;
  return mobile.test(s) || landline.test(s) ? s : null; // null = غير صحيح
}

app.post('/api/contact', limiter, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
    const phone = normalizePhone(req.body.phone);
  const message = String(req.body.message || '').trim();
  if (name.length < 2 || name.length > 60) return res.status(400).json({ error: 'invalid_name' });
  if (!EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: 'invalid_email' });
  if (phone === null) return res.status(400).json({ error: 'invalid_phone' });
  if (message.length < 5 || message.length > 2000) return res.status(400).json({ error: 'invalid_message' });
  try {
    await saveMessage({ id: crypto.randomUUID(), name, email, phone, message, createdAt: new Date().toISOString() });
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'server_error' });
  }
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => console.log(`الموقع شغال على http://localhost:${PORT}`));
