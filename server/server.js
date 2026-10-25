require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error('JWT_SECRET ناقص أو قصير (لازم 32 حرف على الأقل). راجع ملف .env');
  process.exit(1);
}
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const MAIL_USER = process.env.MAIL_USER || '';
const MAIL_PASS = (process.env.MAIL_APP_PASSWORD || '').replace(/\s/g, '');
const mailer = MAIL_USER && MAIL_PASS
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_PASS } })
  : null;
const isAdmin = u => !!ADMIN_EMAIL && u.email === ADMIN_EMAIL;
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
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: isAdmin(u) ? 'admin' : 'user' });
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
  if (email === ADMIN_EMAIL) return res.status(409).json({ error: 'email_exists' });

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
  const ok = await bcrypt.compare(password, user && user.passwordHash ? user.passwordHash : DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) return res.status(401).json({ error: 'invalid_credentials' });
  setCookie(res, user);
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get('/api/config', (req, res) => res.json({ googleClientId: GOOGLE_CLIENT_ID }));

app.post('/api/auth/google', limiter, async (req, res) => {
  if (!googleClient) return res.status(503).json({ error: 'google_failed' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: String(req.body.credential || ''),
      audience: GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('Google verify failed:', err.message);
    return res.status(401).json({ error: 'google_failed' });
  }
  if (!payload || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({ error: 'google_unverified' });
  }

  const email = payload.email.toLowerCase();
  const name = String(payload.name || email.split('@')[0]).trim().slice(0, 60);

  const user = await updateUsers(users => {
    let u = users.find(x => x.email === email);
    if (!u) {
      u = { id: crypto.randomUUID(), name, email, passwordHash: null, googleId: payload.sub, createdAt: new Date().toISOString() };
      users.push(u);
    } else if (!u.googleId) {
      u.googleId = payload.sub;
    }
    return u;
  });

  setCookie(res, user);
  res.json({ user: publicUser(user) });
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

/* ---------- لوحة الأدمن ---------- */
const readMessages = async () => {
  try { return JSON.parse(await fs.readFile(MSG_FILE, 'utf8')); }
  catch { return []; }
};
const updateMessages = fn => {
  const run = msgQueue.catch(() => {}).then(async () => {
    const list = await readMessages();
    const result = await fn(list);
    await fs.writeFile(MSG_FILE, JSON.stringify(list, null, 2));
    return result;
  });
  msgQueue = run.catch(() => {});
  return run;
};

const requireAdmin = (req, res, next) =>
  isAdmin(req.user) ? next() : res.status(403).json({ error: 'forbidden' });
const adminOnly = [auth, requireAdmin];

app.get('/api/admin/stats', adminOnly, async (req, res) => {
  const [users, msgs] = await Promise.all([readUsers(), readMessages()]);
  res.json({ users: users.length, messages: msgs.length, unread: msgs.filter(m => !m.read).length });
});

app.get('/api/admin/messages', adminOnly, async (req, res) => {
  res.json({ messages: (await readMessages()).reverse() }); // الأحدث الأول
});

app.patch('/api/admin/messages/:id', adminOnly, async (req, res) => {
  const read = req.body.read !== false;
  const ok = await updateMessages(list => {
    const m = list.find(x => x.id === req.params.id);
    if (!m) return false;
    m.read = read;
    return true;
  });
  ok ? res.json({ ok: true }) : res.status(404).json({ error: 'not_found' });
});

app.delete('/api/admin/messages/:id', adminOnly, async (req, res) => {
  const ok = await updateMessages(list => {
    const i = list.findIndex(x => x.id === req.params.id);
    if (i < 0) return false;
    list.splice(i, 1);
    return true;
  });
  ok ? res.json({ ok: true }) : res.status(404).json({ error: 'not_found' });
});

app.get('/api/admin/users', adminOnly, async (req, res) => {
  const users = (await readUsers()).map(u => ({
    id: u.id, name: u.name, email: u.email, role: isAdmin(u) ? 'admin' : 'user', createdAt: u.createdAt
  }));
  res.json({ users: users.reverse() });
});

app.delete('/api/admin/users/:id', adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'cannot_delete_self' });
  const result = await updateUsers(users => {
    const i = users.findIndex(u => u.id === req.params.id);
    if (i < 0) return 'not_found';
    if (isAdmin(users[i])) return 'is_admin';
    users.splice(i, 1);
    return 'ok';
  });
  if (result === 'ok') return res.json({ ok: true });
  res.status(result === 'not_found' ? 404 : 400).json({ error: result });
});

app.post('/api/admin/password', limiter, adminOnly, async (req, res) => {
  const current = String(req.body.current || '');
  const next = String(req.body.next || '');
  if (next.length < 8 || next.length > 100) return res.status(400).json({ error: 'weak_password' });
  if (!req.user.passwordHash || !(await bcrypt.compare(current, req.user.passwordHash))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const passwordHash = await bcrypt.hash(next, 12);
  await updateUsers(users => {
    const u = users.find(x => x.id === req.user.id);
    if (u) u.passwordHash = passwordHash;
  });
  res.json({ ok: true });
});

/* ---------- البانر ---------- */
const BANNERS_FILE = path.join(__dirname, '..', 'data', 'banners.json');
const BANNER_DIR = path.join(__dirname, '..', 'public', 'uploads', 'banners');
let bannerQueue = Promise.resolve();
const readBanners = async () => {
  try { return JSON.parse(await fs.readFile(BANNERS_FILE, 'utf8')); }
  catch { return []; }
};
const updateBanners = fn => {
  const run = bannerQueue.catch(() => {}).then(async () => {
    const list = await readBanners();
    const result = await fn(list);
    await fs.writeFile(BANNERS_FILE, JSON.stringify(list, null, 2));
    return result;
  });
  bannerQueue = run.catch(() => {});
  return run;
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 2 } });
const bannerFiles = upload.fields([{ name: 'desktop', maxCount: 1 }, { name: 'mobile', maxCount: 1 }]);
const handleUpload = (req, res, next) => bannerFiles(req, res, err =>
  err ? res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : 'upload_failed' }) : next());

// بنتأكد من نوع الصورة من محتواها مش من اسمها
function detectExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}
const validImages = files => [files.desktop?.[0], files.mobile?.[0]].every(f => !f || detectExt(f.buffer));
async function saveImage(file) {
  const ext = detectExt(file.buffer);
  await fs.mkdir(BANNER_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(BANNER_DIR, name), file.buffer);
  return `/uploads/banners/${name}`;
}
async function removeImage(url) {
  if (!url || !url.startsWith('/uploads/banners/')) return;
  await fs.unlink(path.join(BANNER_DIR, path.basename(url))).catch(() => {});
}

app.get('/api/admin/banners', adminOnly, async (req, res) => {
  res.json({ banners: await readBanners() });
});

// للزوار: البانرات الظاهرة فقط
app.get('/api/banners', async (req, res) => {
  const list = (await readBanners())
    .filter(b => b.active && b.desktop)
    .map(({ id, desktop, mobile }) => ({ id, desktop, mobile }));
  res.json({ banners: list });
});

// للأدمن
app.post('/api/admin/banners', adminOnly, handleUpload, async (req, res) => {
  const files = req.files || {};
  if (!files.desktop) return res.status(400).json({ error: 'banner_empty' });
  if (!validImages(files)) return res.status(400).json({ error: 'bad_image' });
  try {
    const desktop = await saveImage(files.desktop[0]);
    const mobile = files.mobile ? await saveImage(files.mobile[0]) : '';
    const banner = await updateBanners(list => {
      const b = { id: crypto.randomUUID(), active: req.body.active !== 'false', desktop, mobile, createdAt: new Date().toISOString() };
      list.push(b);
      return b;
    });
    res.status(201).json({ banner });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

app.put('/api/admin/banners/:id', adminOnly, handleUpload, async (req, res) => {
  const files = req.files || {};
  if (!validImages(files)) return res.status(400).json({ error: 'bad_image' });
  try {
    const desktop = files.desktop ? await saveImage(files.desktop[0]) : null;
    const mobile = files.mobile ? await saveImage(files.mobile[0]) : null;
    const removed = [];
    const banner = await updateBanners(list => {
      const b = list.find(x => x.id === req.params.id);
      if (!b) return null;
      b.active = req.body.active !== 'false';
      if (desktop) { removed.push(b.desktop); b.desktop = desktop; }
      if (mobile) { removed.push(b.mobile); b.mobile = mobile; }
      else if (req.body.removeMobile === 'true') { removed.push(b.mobile); b.mobile = ''; }
      return b;
    });
    if (!banner) {
      await removeImage(desktop); await removeImage(mobile);
      return res.status(404).json({ error: 'not_found' });
    }
    await Promise.all(removed.map(removeImage));
    res.json({ banner });
  } catch { res.status(500).json({ error: 'server_error' }); }
});

app.patch('/api/admin/banners/:id', adminOnly, async (req, res) => {
  const ok = await updateBanners(list => {
    const b = list.find(x => x.id === req.params.id);
    if (!b) return false;
    b.active = req.body.active === true;
    return true;
  });
  ok ? res.json({ ok: true }) : res.status(404).json({ error: 'not_found' });
});

app.patch('/api/admin/banners/:id/move', adminOnly, async (req, res) => {
  const dir = req.body.dir === -1 ? -1 : 1;
  const ok = await updateBanners(list => {
    const i = list.findIndex(x => x.id === req.params.id);
    if (i < 0) return false;
    const j = i + dir;
    if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
    return true;
  });
  ok ? res.json({ ok: true }) : res.status(404).json({ error: 'not_found' });
});

app.delete('/api/admin/banners/:id', adminOnly, async (req, res) => {
  const removed = await updateBanners(list => {
    const i = list.findIndex(x => x.id === req.params.id);
    return i < 0 ? null : list.splice(i, 1)[0];
  });
  if (!removed) return res.status(404).json({ error: 'not_found' });
  await removeImage(removed.desktop);
  await removeImage(removed.mobile);
  res.json({ ok: true });
});

/* ---------- نسيت كلمة المرور ---------- */
function makeStore(file) {
  let queue = Promise.resolve();
  const read = async () => {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); }
    catch { return []; }
  };
  const update = fn => {
    const run = queue.catch(() => {}).then(async () => {
      const list = await read();
      const result = await fn(list);
      await fs.writeFile(file, JSON.stringify(list, null, 2));
      return result;
    });
    queue = run.catch(() => {});
    return run;
  };
  return { read, update };
}
const resets = makeStore(path.join(__dirname, '..', 'data', 'resets.json'));
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

async function sendResetMail(user, link, lng) {
  if (!mailer) {
    if (!IS_PROD) console.log(`\n[تجربة] رابط استرجاع كلمة المرور لـ ${user.email}:\n${link}\n`);
    else console.warn('إعدادات الإيميل ناقصة، مفيش إيميل اتبعت.');
    return;
  }
  const ar = lng !== 'en';
  await mailer.sendMail({
    from: `"سيراميكا الزهراء | Ceramica El-Zahraa" <${MAIL_USER}>`,
    to: user.email,
    subject: ar ? 'استرجاع كلمة المرور' : 'Reset your password',
    text: ar
      ? `أهلاً ${user.name}،\n\nعشان تغيّر كلمة المرور افتح الرابط ده (صالح لمدة ساعة واحدة):\n${link}\n\nلو أنت ماطلبتش ده، تجاهل الرسالة وحسابك في أمان.`
      : `Hello ${user.name},\n\nOpen this link to choose a new password (valid for one hour):\n${link}\n\nIf you did not request this, ignore this email and your account stays safe.`
  });
}

app.post('/api/forgot', limiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const lng = req.body.lang === 'en' ? 'en' : 'ar';
  if (!EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: 'invalid_email' });

  res.json({ ok: true }); // نفس الرد دايماً، سواء الإيميل مسجل أو لأ

  try {
    const user = (await readUsers()).find(u => u.email === email);
    if (!user) return;
    const token = crypto.randomBytes(32).toString('hex');
    await resets.update(list => {
      const keep = list.filter(r => r.userId !== user.id && r.expires > Date.now());
      list.length = 0;
      list.push(...keep, { hash: sha256(token), userId: user.id, expires: Date.now() + 60 * 60 * 1000 });
    });
    await sendResetMail(user, `${SITE_URL}/reset.html?token=${token}`, lng);
  } catch (err) {
    console.error('forgot failed:', err.message);
  }
});

app.post('/api/reset', limiter, async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (password.length < 8 || password.length > 100) return res.status(400).json({ error: 'weak_password' });
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'invalid_token' });

  const hash = sha256(token);
  const userId = await resets.update(list => {
    const i = list.findIndex(r => r.hash === hash && r.expires > Date.now());
    if (i < 0) return null;
    const { userId } = list[i];
    for (let k = list.length - 1; k >= 0; k--) if (list[k].userId === userId) list.splice(k, 1);
    return userId;
  });
  if (!userId) return res.status(400).json({ error: 'invalid_token' });

  const passwordHash = await bcrypt.hash(password, 12);
  await updateUsers(users => {
    const u = users.find(x => x.id === userId);
    if (u) u.passwordHash = passwordHash;
  });
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html')));

async function seedAdmin() {
  if (!ADMIN_EMAIL) return;
  const exists = (await readUsers()).some(u => u.email === ADMIN_EMAIL);
  if (exists) return;
  if (ADMIN_PASSWORD.length < 8) {
    console.warn('ADMIN_PASSWORD ناقص أو أقل من 8 أحرف، فمش هيتعمل حساب الأدمن.');
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await updateUsers(users => {
    users.push({
      id: crypto.randomUUID(),
      name: 'سيراميكا الزهراء',
      email: ADMIN_EMAIL,
      passwordHash,
      createdAt: new Date().toISOString()
    });
  });
  console.log('تم إنشاء حساب الأدمن:', ADMIN_EMAIL);
}

seedAdmin()
  .catch(err => console.error('فشل إنشاء حساب الأدمن:', err))
  .then(() => app.listen(PORT, () => console.log(`الموقع شغال على http://localhost:${PORT}`)));
