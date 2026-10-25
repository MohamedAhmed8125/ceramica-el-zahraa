(function () {
  const row = document.getElementById('navRow');
  const nav = document.getElementById('mainNav');
  if (!row || !nav) return;

  const page = location.pathname.split('/').pop();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // العنصر ممكن يكون [عربي, إنجليزي] أو { ar, en }
  const nm = x => (Array.isArray(x) ? x[lang === 'en' ? 1 : 0] : (lang === 'en' ? x.en : x.ar));
  // لما نعمل صفحة القسم نغيّر السطر ده لـ: id => 'category.html?c=' + id
  const href = id => '#';

  const isDesktop = () => matchMedia('(hover: hover) and (pointer: fine)').matches && innerWidth > 900;
  const mega = () => document.getElementById('mega');

  const backdrop = document.createElement('div');
  backdrop.className = 'mega-backdrop';
  document.body.appendChild(backdrop);
  let closeTimer;

  function setOpen(open) {
    const m = mega();
    if (!m) return;
    m.classList.toggle('is-open', open);
    document.getElementById('megaBtn').setAttribute('aria-expanded', open);
    backdrop.classList.toggle('is-on', open && innerWidth > 900);
    if (!open) m.querySelectorAll('.mega__item.is-open').forEach(li => li.classList.remove('is-open'));
  }

  const colHTML = c => `
    <div class="mega__col">
      <a class="mega__head" href="#">${esc(nm(c))}</a>
      ${c.items.length ? `<ul>${c.items.map(i => `<li><a href="#">${esc(nm(i))}</a></li>`).join('')}</ul>` : ''}
    </div>`;

  function render() {
    const items = CATEGORIES.map(c => {
      const has = c.cols.length > 0;
      return `
        <li class="mega__item">
          <a class="mega__link" href="${href(c.id)}" ${has ? 'data-toggle="1"' : ''}>
            <span>${esc(nm(c))}${c.badge ? ` <em class="mega__badge">${esc(nm(c.badge))}</em>` : ''}</span>
            ${has ? '<i class="chev"></i>' : ''}
          </a>
          ${has ? `<div class="mega__panel"><div class="mega__cols">${c.cols.map(colHTML).join('')}</div></div>` : ''}
        </li>`;
    }).join('');

    const quick = CATEGORIES.map(c => `
      <li><a href="${href(c.id)}" class="${c.id === 'offers' ? 'is-hot' : ''}">${c.badge ? `<em class="nav__badge">${esc(nm(c.badge))}</em>` : ''}${esc(nm(c))}</a></li>`).join('');

    row.innerHTML = `
      <div class="mega" id="mega">
        <button type="button" class="mega__btn" id="megaBtn" aria-expanded="false">
          <span class="mega__icon" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>${t('allCategories')}</span>
          <i class="chev chev--down"></i>
        </button>
        <div class="mega__drop"><ul class="mega__list">${items}</ul></div>
      </div>
      <ul class="nav__list">
        ${quick}
        <li><a href="about.html" class="${page === 'about.html' ? 'is-active' : ''}">${t('navAbout')}</a></li>
      </ul>`;
    backdrop.classList.remove('is-on');
  }

  // فتح وقفل بالماوس على الكمبيوتر
  nav.addEventListener('mouseover', e => {
    if (isDesktop() && e.target.closest('#mega')) { clearTimeout(closeTimer); setOpen(true); }
  });
  nav.addEventListener('mouseout', e => {
    if (!isDesktop() || !e.target.closest('#mega')) return;
    const to = e.relatedTarget;
    if (to && to.closest && to.closest('#mega')) return;
    closeTimer = setTimeout(() => setOpen(false), 120);
  });

  // الضغط: الموبايل والتابلت وكمان الكيبورد
  nav.addEventListener('click', e => {
    if (e.target.closest('a[href="#"]')) e.preventDefault(); // روابط مؤقتة لحد ما نعمل صفحات الأقسام

    if (e.target.closest('#megaBtn')) { setOpen(!mega().classList.contains('is-open')); return; }

    const link = e.target.closest('.mega__link[data-toggle]');
    if (link && !isDesktop()) {
      e.preventDefault();
      const li = link.parentElement;
      const wasOpen = li.classList.contains('is-open');
      li.parentElement.querySelectorAll('.mega__item.is-open').forEach(x => x.classList.remove('is-open'));
      li.classList.toggle('is-open', !wasOpen);
    }
  });

  document.addEventListener('click', e => { if (!e.target.closest('#mega')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => setOpen(false));
  document.addEventListener('langchange', render);

  render();
})();