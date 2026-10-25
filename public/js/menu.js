(function () {
  const nav = document.getElementById('mainNav');
  const overlay = document.getElementById('navOverlay');
  const btn = document.getElementById('menuBtn');
  if (!nav || !overlay || !btn) return;

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', () => setMenu(true));
  overlay.addEventListener('click', () => setMenu(false));
  document.getElementById('navClose').addEventListener('click', () => setMenu(false));
  // أي رابط عادي جوه القايمة بيقفلها (إلا زراير فتح الأقسام الفرعية)
  nav.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && !a.dataset.toggle) setMenu(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });
})();