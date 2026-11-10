const ProductCard = (() => {
  Object.assign(I18N.ar, {
    sh_out: 'نفدت الكمية', sh_perM2: '/ م²', sh_cm: 'سم', sh_box: 'سعر الكرتونة', sh_choose: 'اختر الكمية',
    sh_details: 'التفاصيل', sh_fav: 'المفضلة', sh_favAdded: 'اتضافت للمفضلة ♥', sh_favRemoved: 'اتشالت من المفضلة',
    sh_added: 'تمت الإضافة إلى السلة ✓'
  });
  Object.assign(I18N.en, {
    sh_out: 'Out of stock', sh_perM2: '/ m²', sh_cm: 'cm', sh_box: 'Price per box', sh_choose: 'Choose quantity',
    sh_details: 'Details', sh_fav: 'Favorites', sh_favAdded: 'Added to favorites ♥', sh_favRemoved: 'Removed from favorites',
    sh_added: 'Added to cart ✓'
  });

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nm = o => (typeof o === 'string' ? o : (lang === 'en' ? o.en : o.ar));
  const fmt = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }

  function html(p) {
    const tile = p.type === 'tile';
    const out = p.stock <= 0;
    const disc = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
    const link = `product.html?id=${encodeURIComponent(p.id)}`;
    const fav = Favs.has(p.id);
    const img = p.images && p.images[0]
      ? `<img src="${esc(p.images[0])}" alt="${esc(nm(p.name))}" loading="lazy">`
      : `<div class="ph" style="background-color:${esc(p.tone || '#ddd')}"><span>${t('imgPlaceholder')}</span></div>`;
    const stock = out ? t('sh_out') : (p.stock <= 1 ? t('onlyLeft', { n: p.stock }) : t('inStock'));
    return `
      <article class="pcard" data-id="${esc(p.id)}">
        <a class="pcard__img" href="${link}">
          ${img}
          ${disc ? `<span class="pcard__disc">-${disc}%</span>` : ''}
          ${out ? `<span class="pcard__out">${t('sh_out')}</span>` : ''}
        </a>
        <button type="button" class="pcard__fav ${fav ? 'is-on' : ''}" data-fav="${esc(p.id)}" aria-label="${t('sh_fav')}" aria-pressed="${fav}">${HEART}</button>
        <div class="pcard__body">
          <span class="pcard__brand">${esc(p.brand)}</span>
          <a class="pcard__name" href="${link}">${esc(nm(p.name))}</a>
          ${tile ? `<span class="pcard__meta">${esc(p.tile.size)} ${t('sh_cm')} · ${esc(nm(p.tile.finish))}</span>` : ''}
          <p class="pcard__stock ${!out && p.stock <= 1 ? 'low' : ''}">${stock}</p>
          <div class="pcard__price">
            <strong>${t('currency')} ${fmt(p.price)}</strong>${tile ? `<small>${t('sh_perM2')}</small>` : ''}
            ${disc ? `<del>${fmt(p.old)}</del>` : ''}
          </div>
          ${tile ? `<small class="pcard__box">${t('sh_box')}: ${t('currency')} ${fmt(Pricing.unit(p))}</small>` : ''}
          ${tile || out
            ? `<a class="btn btn--primary pcard__btn" href="${link}">${out ? t('sh_details') : t('sh_choose')}</a>`
            : `<button type="button" class="btn btn--primary pcard__btn" data-add="${esc(p.id)}">${t('addToCart')}</button>`}
        </div>
      </article>`;
  }

  // بنربط القلب وزرار الإضافة مرة واحدة لكل الصفحة
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-fav]');
    if (f) {
      e.preventDefault();
      toast(Favs.toggle(f.dataset.fav) ? t('sh_favAdded') : t('sh_favRemoved'));
      return;
    }
    const a = e.target.closest('[data-add]');
    if (a) { Cart.add(a.dataset.add, 1); toast(t('sh_added')); }
  });

  document.addEventListener('favs:change', () => {
    document.querySelectorAll('[data-fav]').forEach(b => {
      const on = Favs.has(b.dataset.fav);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
  });

  return { html, toast, HEART };
})();