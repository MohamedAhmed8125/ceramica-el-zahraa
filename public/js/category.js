(function () {
  Object.assign(I18N.ar, {
    sh_home: 'الرئيسية', sh_all: 'كل المنتجات', sh_favTitle: 'المفضلة', sh_searchFor: 'نتائج البحث عن "{q}"',
    sh_notFound: 'القسم ده مش موجود.', sh_filters: 'تصفية', sh_brand: 'الماركة', sh_price: 'السعر (ج.م)',
    sh_min: 'من', sh_max: 'إلى', sh_size: 'المقاس', sh_finish: 'التشطيب', sh_stockOnly: 'المتاح فقط',
    sh_reset: 'مسح التصفية', sh_sort: 'الترتيب', sh_sortDefault: 'الافتراضي', sh_priceAsc: 'السعر: الأقل أولاً',
    sh_priceDesc: 'السعر: الأعلى أولاً', sh_discount: 'أعلى خصم', sh_name: 'الاسم',
    sh_count: 'منتج {a}–{b} من {n}', sh_noResults: 'مفيش منتجات مطابقة للتصفية.', sh_noProducts: 'مفيش منتجات هنا لسه.',
    sh_noFav: 'لسه مفيش منتجات في المفضلة. اضغط على القلب في أي منتج عشان تضيفه.',
    sh_prev: 'السابق', sh_next: 'التالي', sh_grid: 'شبكة', sh_list: 'قايمة', sh_backHome: 'الرجوع للرئيسية'
  });
  Object.assign(I18N.en, {
    sh_home: 'Home', sh_all: 'All products', sh_favTitle: 'Favorites', sh_searchFor: 'Search results for "{q}"',
    sh_notFound: 'This category does not exist.', sh_filters: 'Filters', sh_brand: 'Brand', sh_price: 'Price (EGP)',
    sh_min: 'From', sh_max: 'To', sh_size: 'Size', sh_finish: 'Finish', sh_stockOnly: 'In stock only',
    sh_reset: 'Clear filters', sh_sort: 'Sort', sh_sortDefault: 'Default', sh_priceAsc: 'Price: low to high',
    sh_priceDesc: 'Price: high to low', sh_discount: 'Biggest discount', sh_name: 'Name',
    sh_count: 'Products {a}–{b} of {n}', sh_noResults: 'No products match the filters.', sh_noProducts: 'No products here yet.',
    sh_noFav: 'No favorites yet. Tap the heart on any product to add it.',
    sh_prev: 'Previous', sh_next: 'Next', sh_grid: 'Grid', sh_list: 'List', sh_backHome: 'Back to home'
  });

  const root = document.getElementById('shop');
  const crumbsEl = document.getElementById('crumbs');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nm = o => (typeof o === 'string' ? o : Array.isArray(o) ? o[lang === 'en' ? 1 : 0] : (lang === 'en' ? o.en : o.ar));
  const toLatin = s => String(s ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const PAGE = 12;
  const SORTS = ['default', 'priceAsc', 'priceDesc', 'discount', 'name'];

  /* ---------- الرابط: أنهي قسم أو بحث ---------- */
  const Q = new URLSearchParams(location.search);
  const params = {
    c: Q.get('c') || '', g: Q.get('g') || '', sub: Q.get('sub') || '',
    q: (Q.get('q') || '').trim().slice(0, 80), deals: Q.get('deals') === '1', fav: Q.get('fav') === '1'
  };
  const cat = CATEGORIES.find(c => c.id === params.c) || null;
  const grp = cat && params.g ? (cat.cols.find(col => slugify(col.en) === params.g) || null) : null;

  function findSub(c, slug) {
    for (const col of c.cols) {
      if (!col.items.length && slugify(col.en) === slug) return { node: col, col };
      for (const it of col.items) if (slugify(it[1]) === slug) return { node: it, col };
    }
    return null;
  }
  const subInfo = cat && params.sub ? findSub(cat, params.sub) : null;
  const groupSlugs = grp ? (grp.items.length ? grp.items.map(i => slugify(i[1])) : [params.g]) : [];

  const S = {
    all: [], scope: [], ready: false,
    sort: SORTS.includes(Q.get('sort')) ? Q.get('sort') : 'default',
    view: Q.get('view') === 'list' ? 'list' : 'grid',
    page: Math.max(1, parseInt(Q.get('p'), 10) || 1),
    F: { brands: new Set(), sizes: new Set(), finishes: new Set(), min: '', max: '', inStock: false },
    filtersOpen: false
  };

  /* ---------- مطابقة المنتجات ---------- */
  function matchSub(p, slug) {
    if (p.sub === slug) return true;
    const m = slug.match(/^(floors|walls)-(\d+)-(\d+)-cm$/); // أقسام المقاسات
    return !!m && p.type === 'tile' && p.use === (m[1] === 'floors' ? 'floor' : 'wall') && p.tile.size === `${m[2]}×${m[3]}`;
  }

  // البحث بيتجاهل التشكيل واختلاف الألف والياء والتاء المربوطة
  const norm = s => String(s || '').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/×/g, 'x');
  const haystack = p => {
    const c = CATEGORIES.find(x => x.id === p.cat);
    return norm([p.name.ar, p.name.en, p.brand, p.tile && p.tile.size, p.tile && p.tile.finish.ar, p.tile && p.tile.finish.en, c && c.ar, c && c.en].join(' '));
  };
  const searchMatch = p => { const h = haystack(p); return norm(params.q).split(/\s+/).filter(Boolean).every(w => h.includes(w)); };

  function computeScope() {
    let list = S.all;
    if (params.fav) list = Favs.all().map(id => S.all.find(p => p.id === id)).filter(Boolean);
    else if (params.q) list = list.filter(searchMatch);
    else if (params.deals) list = list.filter(p => p.old > p.price);
    else if (cat) {
      list = list.filter(p => p.cat === cat.id);
      if (params.sub) list = list.filter(p => matchSub(p, params.sub));
      else if (grp) list = list.filter(p => groupSlugs.some(s => matchSub(p, s)));
    }
    S.scope = list;
  }

  /* ---------- الفلاتر والترتيب ---------- */
  function applyFilters(list) {
    const F = S.F, min = parseFloat(F.min), max = parseFloat(F.max);
    return list.filter(p =>
      (!F.brands.size || F.brands.has(p.brand)) &&
      (!F.inStock || p.stock > 0) &&
      (!(min > 0) || p.price >= min) && (!(max > 0) || p.price <= max) &&
      (!F.sizes.size || (p.type === 'tile' && F.sizes.has(p.tile.size))) &&
      (!F.finishes.size || (p.type === 'tile' && F.finishes.has(p.tile.finish.en))));
  }
  const discOf = p => (p.old > p.price ? 1 - p.price / p.old : 0);
  function sortList(list) {
    const a = list.slice();
    if (S.sort === 'priceAsc') a.sort((x, y) => x.price - y.price);
    else if (S.sort === 'priceDesc') a.sort((x, y) => y.price - x.price);
    else if (S.sort === 'discount') a.sort((x, y) => discOf(y) - discOf(x));
    else if (S.sort === 'name') a.sort((x, y) => nm(x.name).localeCompare(nm(y.name), lang));
    return a;
  }
  const countBy = (list, fn) => {
    const m = new Map();
    list.forEach(p => { const k = fn(p); m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  };

  /* ---------- العنوان ومسار التنقل ---------- */
  function titleInfo() {
    if (params.fav) return { title: t('sh_favTitle'), trail: [] };
    if (params.q) return { title: t('sh_searchFor', { q: params.q }), trail: [] };
    if (params.deals) return { title: t('dealsTitle'), trail: [] };
    if (!cat) return { title: t('sh_all'), trail: [] };
    const trail = [{ label: nm(cat), href: (grp || subInfo) ? catHref(cat.id) : '' }];
    if (grp) trail.push({ label: nm(grp), href: subInfo ? groupHref(cat.id, params.g) : '' });
    else if (subInfo && subInfo.col.items.length) trail.push({ label: nm(subInfo.col), href: groupHref(cat.id, slugify(subInfo.col.en)) });
    if (subInfo) trail.push({ label: nm(subInfo.node), href: '' });
    return { title: trail[trail.length - 1].label, trail };
  }

  // مربعات الأقسام الفرعية
  const TONES = ['#d9cbb4', '#b9aa94', '#e8e1d6', '#a7a199', '#cdbfa8', '#c9bba3'];
  function squaresHTML() {
    if (!cat || params.q || params.deals || params.fav || params.sub) return '';
    const own = S.all.filter(p => p.cat === cat.id);
    let nodes;
    if (grp) nodes = grp.items.map(i => ({ n: i, slugs: [slugify(i[1])], href: subHref(cat.id, slugify(i[1])) }));
    else nodes = cat.cols.map(col => {
      const slug = slugify(col.en);
      return col.items.length
        ? { n: col, slugs: col.items.map(i => slugify(i[1])), href: groupHref(cat.id, slug) }
        : { n: col, slugs: [slug], href: subHref(cat.id, slug) };
    });
    if (!nodes.length) return '';
    return `<div class="squares">${nodes.map((x, i) => {
      const count = own.filter(p => x.slugs.some(s => matchSub(p, s))).length;
      return `<a class="sq ${count ? '' : 'is-empty'}" href="${x.href}">
        <span class="sq__img" style="background-color:${TONES[i % TONES.length]}"></span>
        <span class="sq__name">${esc(nm(x.n))}</span><small>${count}</small></a>`;
    }).join('')}</div>`;
  }

  /* ---------- الرسم ---------- */
  function filtersHTML() {
    const tiles = S.scope.filter(p => p.type === 'tile');
    const brands = countBy(S.scope, p => p.brand).map(([v, n]) => [v, v, n]);
    const sizes = countBy(tiles, p => p.tile.size).map(([v, n]) => [v, `${v} ${t('sh_cm')}`, n]);
    const finishLabel = new Map(tiles.map(p => [p.tile.finish.en, nm(p.tile.finish)]));
    const finishes = countBy(tiles, p => p.tile.finish.en).map(([v, n]) => [v, finishLabel.get(v), n]);
    const prices = S.scope.map(p => p.price);
    const group = (title, key, entries) => entries.length ? `
      <fieldset class="flt"><legend>${title}</legend>
        ${entries.map(([val, label, n]) => `
          <label class="chk"><input type="checkbox" data-f="${key}" value="${esc(val)}" ${S.F[key].has(val) ? 'checked' : ''}><span>${esc(label)}</span><em>${n}</em></label>`).join('')}
      </fieldset>` : '';
    return `
      ${group(t('sh_brand'), 'brands', brands)}
      <fieldset class="flt"><legend>${t('sh_price')}</legend>
        <div class="prange">
          <input data-f="min" type="text" inputmode="numeric" placeholder="${t('sh_min')} ${Math.floor(Math.min(...prices))}" value="${esc(S.F.min)}">
          <input data-f="max" type="text" inputmode="numeric" placeholder="${t('sh_max')} ${Math.ceil(Math.max(...prices))}" value="${esc(S.F.max)}">
        </div>
      </fieldset>
      ${group(t('sh_size'), 'sizes', sizes)}
      ${group(t('sh_finish'), 'finishes', finishes)}
      <label class="chk"><input type="checkbox" data-f="inStock" ${S.F.inStock ? 'checked' : ''}><span>${t('sh_stockOnly')}</span></label>
      <button type="button" class="flt-reset" data-act="reset">${t('sh_reset')}</button>`;
  }

  function pagerHTML(pages) {
    if (pages < 2) return '';
    const nums = [...new Set([1, pages, S.page - 1, S.page, S.page + 1].filter(n => n >= 1 && n <= pages))].sort((a, b) => a - b);
    let out = `<button type="button" data-page="${S.page - 1}" ${S.page === 1 ? 'disabled' : ''}>${t('sh_prev')}</button>`;
    let prev = 0;
    nums.forEach(n => {
      if (n - prev > 1) out += '<span>…</span>';
      out += `<button type="button" data-page="${n}" class="${n === S.page ? 'is-active' : ''}">${n}</button>`;
      prev = n;
    });
    out += `<button type="button" data-page="${S.page + 1}" ${S.page === pages ? 'disabled' : ''}>${t('sh_next')}</button>`;
    return `<div class="pager">${out}</div>`;
  }

  function syncUrl() {
    const u = new URL(location.href);
    if (S.sort !== 'default') u.searchParams.set('sort', S.sort); else u.searchParams.delete('sort');
    if (S.view === 'list') u.searchParams.set('view', 'list'); else u.searchParams.delete('view');
    if (S.page > 1) u.searchParams.set('p', S.page); else u.searchParams.delete('p');
    history.replaceState(null, '', u);
  }

  function renderList() {
    const el = document.getElementById('lst');
    if (!el) return;
    const filtered = sortList(applyFilters(S.scope));
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
    if (S.page > pages) S.page = pages;
    const from = (S.page - 1) * PAGE;
    const slice = filtered.slice(from, from + PAGE);
    const sortOpts = [['default', 'sh_sortDefault'], ['priceAsc', 'sh_priceAsc'], ['priceDesc', 'sh_priceDesc'], ['discount', 'sh_discount'], ['name', 'sh_name']];
    el.innerHTML = `
      <div class="tbar">
        <span class="tbar__count">${slice.length ? t('sh_count', { a: from + 1, b: from + slice.length, n: filtered.length }) : ''}</span>
        <div class="tbar__right">
          <button type="button" class="tbar__filters" data-act="toggle-filters">${t('sh_filters')}</button>
          <select class="sortSel" aria-label="${t('sh_sort')}">
            ${sortOpts.map(([v, k]) => `<option value="${v}" ${S.sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}
          </select>
          <div class="vtoggle">
            <button type="button" data-view="grid" class="${S.view === 'grid' ? 'is-active' : ''}" aria-label="${t('sh_grid')}">▦</button>
            <button type="button" data-view="list" class="${S.view === 'list' ? 'is-active' : ''}" aria-label="${t('sh_list')}">☰</button>
          </div>
        </div>
      </div>
      ${slice.length
        ? `<div class="pgrid ${S.view === 'list' ? 'is-list' : ''}">${slice.map(ProductCard.html).join('')}</div>${pagerHTML(pages)}`
        : `<div class="shop-empty"><p>${t('sh_noResults')}</p><button type="button" class="btn btn--outline" data-act="reset">${t('sh_reset')}</button></div>`}`;
    syncUrl();
  }

  function renderFilters() {
    const el = document.getElementById('flt');
    if (el) el.innerHTML = filtersHTML();
  }

  function render() {
    if (!S.ready) return;
    const missing = params.c && !cat && !params.q && !params.deals && !params.fav;
    const { title, trail } = titleInfo();
    const labels = [`<a href="/">${t('sh_home')}</a>`];
    trail.forEach(x => labels.push('<span>/</span>', x.href ? `<a href="${x.href}">${esc(x.label)}</a>` : `<span>${esc(x.label)}</span>`));
    if (!trail.length) labels.push('<span>/</span>', `<span>${esc(title)}</span>`);
    crumbsEl.innerHTML = labels.join('');
    document.title = `${title} | ${t('taglineName')}`;

    if (missing) {
      root.innerHTML = `<div class="shop-empty"><h1 class="shop__title">${t('sh_notFound')}</h1><a class="btn btn--primary" href="/">${t('sh_backHome')}</a></div>`;
      return;
    }
    if (!S.scope.length) {
      root.innerHTML = `
        <h1 class="shop__title">${esc(title)}</h1>
        ${squaresHTML()}
        <div class="shop-empty"><p>${params.fav ? t('sh_noFav') : t('sh_noProducts')}</p><a class="btn btn--primary" href="/">${t('sh_backHome')}</a></div>`;
      return;
    }
    root.innerHTML = `
      <h1 class="shop__title">${esc(title)}</h1>
      ${squaresHTML()}
      <div class="shop">
        <aside class="shop__filters ${S.filtersOpen ? 'is-open' : ''}" id="flt"></aside>
        <section id="lst"></section>
      </div>`;
    renderFilters();
    renderList();
  }

  /* ---------- الأحداث ---------- */
  let priceTimer;
  const resetFilters = () => { S.F = { brands: new Set(), sizes: new Set(), finishes: new Set(), min: '', max: '', inStock: false }; S.page = 1; };

  root.addEventListener('click', e => {
    const pg = e.target.closest('[data-page]');
    if (pg) {
      S.page = Number(pg.dataset.page);
      renderList();
      document.getElementById('lst').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const vw = e.target.closest('[data-view]');
    if (vw) { S.view = vw.dataset.view; renderList(); return; }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'reset') { resetFilters(); renderFilters(); renderList(); }
    if (act.dataset.act === 'toggle-filters') {
      S.filtersOpen = !S.filtersOpen;
      document.getElementById('flt').classList.toggle('is-open', S.filtersOpen);
    }
  });

  root.addEventListener('change', e => {
    const el = e.target;
    if (el.classList.contains('sortSel')) { S.sort = el.value; S.page = 1; renderList(); return; }
    const key = el.dataset.f;
    if (!key || key === 'min' || key === 'max') return;
    if (key === 'inStock') S.F.inStock = el.checked;
    else if (el.checked) S.F[key].add(el.value);
    else S.F[key].delete(el.value);
    S.page = 1;
    renderList();
  });

  root.addEventListener('input', e => {
    const key = e.target.dataset.f;
    if (key !== 'min' && key !== 'max') return;
    S.F[key] = toLatin(e.target.value).replace(/[^\d.]/g, '');
    clearTimeout(priceTimer);
    priceTimer = setTimeout(() => { S.page = 1; renderList(); }, 300);
  });

  document.addEventListener('langchange', render);
  document.addEventListener('favs:change', () => {
    if (!params.fav) return;
    computeScope();
    render();
  });

  /* ---------- البداية ---------- */
  (async function init() {
    S.all = await Catalog.all();
    S.ready = true;
    computeScope();
    const si = document.querySelector('.header .search input');
    if (si && params.q) si.value = params.q;
    render();
  })();
})();