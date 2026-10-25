const $ = id => document.getElementById(id);
const box = $('formMsg');

function msg(code, ok) {
  box.textContent = t(code);
  box.dataset.code = code;
  box.classList.toggle('ok', !!ok);
  box.hidden = false;
}

document.addEventListener('langchange', () => {
  if (!box.hidden) box.textContent = t(box.dataset.code);
});

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, error: data.error };
}

/* ---------- نسيت كلمة المرور ---------- */
const forgot = $('forgotForm');
if (forgot) {
  forgot.addEventListener('submit', async e => {
    e.preventDefault();
    box.hidden = true;
    const btn = forgot.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const r = await post('/api/forgot', { email: forgot.elements.email.value, lang });
      if (r.ok) { forgot.reset(); msg('forgotSent', true); }
      else msg(r.error || 'network');
    } catch { msg('network'); }
    btn.disabled = false;
  });
}

/* ---------- كلمة مرور جديدة ---------- */
const reset = $('resetForm');
if (reset) {
  const token = new URLSearchParams(location.search).get('token') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) { reset.hidden = true; msg('invalid_token'); }

  reset.addEventListener('submit', async e => {
    e.preventDefault();
    box.hidden = true;
    const pw = reset.elements.password.value;
    if (pw.length < 8) return msg('weak_password');
    if (pw !== reset.elements.confirm.value) return msg('password_mismatch');
    const btn = reset.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const r = await post('/api/reset', { token, password: pw });
      if (r.ok) { reset.hidden = true; msg('resetDone', true); }
      else msg(r.error || 'network');
    } catch { msg('network'); }
    btn.disabled = false;
  });
}

applyLang();