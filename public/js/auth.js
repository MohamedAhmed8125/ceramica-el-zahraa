let mode = 'login';
const form = document.getElementById('authForm');
const errorBox = document.getElementById('formError');
const submitBtn = document.getElementById('submitBtn');
const nameField = document.getElementById('nameField');

function refresh() {
  const reg = mode === 'register';
  nameField.hidden = !reg;
  form.password.autocomplete = reg ? 'new-password' : 'current-password';
  submitBtn.textContent = t(reg ? 'submitRegister' : 'submitLogin');
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('is-active', b.dataset.tab === mode));
  document.getElementById('forgotLink').hidden = reg;
}

function showError(code) {
  errorBox.textContent = t(code);
  errorBox.dataset.code = code;
  errorBox.hidden = false;
}

document.querySelectorAll('.tab').forEach(b =>
  b.addEventListener('click', () => { mode = b.dataset.tab; errorBox.hidden = true; refresh(); }));

document.addEventListener('langchange', () => {
  refresh();
  if (!errorBox.hidden) errorBox.textContent = t(errorBox.dataset.code);
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  errorBox.hidden = true;
  const body = { email: form.email.value, password: form.password.value };
  if (mode === 'register') body.name = form.name.value;

  submitBtn.disabled = true;
  submitBtn.textContent = t('wait');
  try {
    const r = await fetch('/api/' + mode, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) { location.href = '/'; return; }
    showError(data.error || 'network');
  } catch { showError('network'); }
  submitBtn.disabled = false;
  refresh();
});

applyLang();

/* ---------- الدخول بجوجل ---------- */
let googleReady = false;

function renderGoogleButton() {
  const box = document.getElementById('googleBtn');
  box.innerHTML = '';
  google.accounts.id.renderButton(box, {
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    text: 'continue_with',
    locale: lang === 'ar' ? 'ar' : 'en',
    width: Math.min(box.offsetWidth || 320, 400)
  });
}

async function onGoogle(resp) {
  errorBox.hidden = true;
  try {
    const r = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: resp.credential })
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) { location.href = '/'; return; }
    showError(data.error || 'network');
  } catch { showError('network'); }
}

async function initGoogle() {
  let clientId = '';
  try { clientId = (await (await fetch('/api/config')).json()).googleClientId; } catch {}
  if (!clientId) return; // من غير Client ID الزرار مش بيظهر

  const start = () => {
    google.accounts.id.initialize({ client_id: clientId, callback: onGoogle });
    document.getElementById('googleBox').hidden = false;
    renderGoogleButton();
    googleReady = true;
  };
  if (window.google && google.accounts) start();
  else window.addEventListener('load', start);
}

document.addEventListener('langchange', () => { if (googleReady) renderGoogleButton(); });
initGoogle();