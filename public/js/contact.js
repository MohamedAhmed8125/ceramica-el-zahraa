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
  return mobile.test(s) || landline.test(s) ? s : null;
}

(function () {
  const C = FOOTER_CONFIG; // البيانات من footer.js
  const frame = document.getElementById('mapFrame');
  frame.src = C.mapEmbed || 'https://www.google.com/maps?q=' + encodeURIComponent(C.mapQuery) + '&output=embed';
  document.getElementById('mapLink').href = C.mapLink;
  const info = document.getElementById('contactInfo');
  const form = document.getElementById('contactForm');
  const box = document.getElementById('formMsg');
  const btn = document.getElementById('sendBtn');
  const icons = { whatsapp: 'fa-whatsapp', facebook: 'fa-facebook-f', instagram: 'fa-instagram', tiktok: 'fa-tiktok', youtube: 'fa-youtube' };

  function renderInfo() {
    const phones = C.phones.map(p => `<a href="tel:${p}" dir="ltr">${p}</a>`).join(' - ');
    const social = Object.entries(C.social).filter(([, u]) => u)
      .map(([k, u]) => `<a href="${u}" target="_blank" rel="noopener" aria-label="${k}"><i class="fa-brands ${icons[k]}"></i></a>`).join('');
    info.innerHTML = `
      <h2>${t('contactInfo')}</h2>
      <div class="row"><i class="fa-solid fa-phone"></i><div><small>${t('callUs')}</small>${phones}</div></div>
      <div class="row"><i class="fa-regular fa-envelope"></i><div><small>${t('emailUs')}</small><a href="${mailHref(C.email)}" target="_blank" rel="noopener">${C.email}</a></div></div>
      <div class="row"><i class="fa-solid fa-location-dot"></i><div><small>${t('addressLabel')}</small><a href="${C.mapLink}" target="_blank" rel="noopener">${C.address[lang]}</a></div></div>
      <div class="social">${social}</div>`;
  }

  function showMsg(code, ok) {
    box.textContent = t(code);
    box.dataset.code = code;
    box.classList.toggle('ok', !!ok);
    box.hidden = false;
  }

  document.addEventListener('langchange', () => {
    renderInfo();
    btn.textContent = t('sendMsg');
    if (!box.hidden) box.textContent = t(box.dataset.code);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    box.hidden = true;
    const body = Object.fromEntries(new FormData(form));
    const phone = normalizePhone(body.phone);
    if (phone === null) {
      showMsg('invalid_phone', false);
      form.phone.focus();
      return;
    }
    body.phone = phone;
    btn.disabled = true;
    btn.textContent = t('wait');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) { form.reset(); showMsg('msgSent', true); }
      else showMsg(data.error || 'network', false);
    } catch { showMsg('network', false); }
    btn.disabled = false;
    btn.textContent = t('sendMsg');
  });
})();