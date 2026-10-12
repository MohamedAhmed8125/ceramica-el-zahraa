(function () {
  const section = document.getElementById('heroSlider');
  if (!section) return;
  const track = document.getElementById('heroTrack');
  const dots = document.getElementById('heroDots');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');

  let banners = null; // لسه ما اتحملتش
  let current = 0;
  let timer = null;
  let paused = false;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (ar, en) => (lang === 'en' ? (en || ar) : ar) || '';
  const items = () => (banners && banners.length ? banners : [null]); // null = البانر الافتراضي

     function slideHTML(b) {
    if (!b) { // البانر الافتراضي لحد ما تضيف بانرات من اللوحة
      return `
        <div class="hero-slide no-img has-text">
          <div class="hero__text">
            <h2 class="hero-title">${t('heroTitle')}</h2>
            <p>${t('heroText')}</p>
            <a href="#" class="btn btn--primary">${t('shopNow')}</a>
          </div>
        </div>`;
    }
    const mobile = b.mobile ? `<source media="(max-width: 700px)" srcset="${esc(b.mobile)}">` : '';
    return `
      <div class="hero-slide">
        <picture>${mobile}<img src="${esc(b.desktop)}" alt="${esc(t('taglineName'))}"></picture>
      </div>`;
  }

  function show(i) {
    current = i;
    track.querySelectorAll('.hero-slide').forEach((s, n) => s.classList.toggle('is-active', n === i));
    dots.querySelectorAll('button').forEach((d, n) => d.classList.toggle('is-active', n === i));
  }

  function restart() {
    clearInterval(timer);
    if (items().length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = setInterval(() => { if (!document.hidden && !paused) go(1); }, 5000);
  }

  function go(step) {
    const n = items().length;
    show((current + step + n) % n);
    restart();
  }

  function render() {
    if (banners === null) return;
    const list = items();
    const rtl = document.dir === 'rtl';
    track.innerHTML = list.map(slideHTML).join('');
    dots.innerHTML = list.length > 1 ? list.map((_, i) => `<button type="button" aria-label="${i + 1}" data-i="${i}"></button>`).join('') : '';
    prevBtn.textContent = rtl ? '›' : '‹';
    nextBtn.textContent = rtl ? '‹' : '›';
    section.classList.toggle('single', list.length < 2);
    if (current >= list.length) current = 0;
    show(current);
    restart();
  }

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  dots.addEventListener('click', e => {
    const d = e.target.closest('[data-i]');
    if (d) { show(Number(d.dataset.i)); restart(); }
  });

  section.addEventListener('mouseenter', () => { paused = true; });
  section.addEventListener('mouseleave', () => { paused = false; });

  // السحب بالإصبع على الموبايل
  let startX = null;
  section.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 50) return;
    const rtl = document.dir === 'rtl';
    go((rtl ? dx > 0 : dx < 0) ? 1 : -1);
  });

  document.addEventListener('langchange', render);

  fetch('/api/banners')
    .then(r => r.json())
    .then(d => { banners = d.banners || []; })
    .catch(() => { banners = []; })
    .then(render);
})();