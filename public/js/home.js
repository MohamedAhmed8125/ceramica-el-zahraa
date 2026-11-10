(function () {
  const root = document.getElementById('homeSections');
  if (!root) return;

  Object.assign(I18N.ar, { hm_ceramic: 'السيراميك والبورسلين', hm_sanitary: 'الأدوات الصحية والخلاطات' });
  Object.assign(I18N.en, { hm_ceramic: 'Ceramic & porcelain', hm_sanitary: 'Sanitary ware & mixers' });

  const discOf = p => (p.old > p.price ? 1 - p.price / p.old : 0);
  const SECTIONS = [
    { key: 'dealsTitle', href: 'category.html?deals=1', pick: all => all.filter(p => p.old > p.price).sort((a, b) => discOf(b) - discOf(a)) },
    { key: 'hm_ceramic', href: catHref('ceramic'), pick: all => all.filter(p => p.cat === 'ceramic') },
    { key: 'hm_sanitary', href: catHref('sanitary'), pick: all => all.filter(p => ['sanitary', 'mixers', 'basins'].includes(p.cat)) }
  ];

  let ALL = null;

  function render() {
    if (!ALL) return;
    const rtl = document.dir === 'rtl';
    root.innerHTML = SECTIONS.map(s => {
      const items = s.pick(ALL).slice(0, 8);
      if (!items.length) return '';
      return `
        <section class="container home-sec">
          <div class="products__head">
            <h2>${t(s.key)}</h2>
            <div class="products__tools">
              <button type="button" class="arrow" data-dir="1">${rtl ? '‹' : '›'}</button>
              <button type="button" class="arrow" data-dir="-1">${rtl ? '›' : '‹'}</button>
              <a href="${s.href}" class="btn--outline">${t('viewAll')}</a>
            </div>
          </div>
          <div class="products__track">${items.map(ProductCard.html).join('')}</div>
        </section>`;
    }).join('');
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('.arrow');
    if (!b) return;
    const track = b.closest('.home-sec').querySelector('.products__track');
    const sign = document.dir === 'rtl' ? -1 : 1;
    track.scrollBy({ left: sign * b.dataset.dir * track.clientWidth * 0.8, behavior: 'smooth' });
  });

  document.addEventListener('langchange', render);
  Catalog.all().then(list => { ALL = list; render(); });
})();