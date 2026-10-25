(function () {
  // نصوص الصفحة دي (بتتضاف لقاموس اللغات الموجود)
  Object.assign(I18N.ar, {
    pd_home: 'الرئيسية', pd_out: 'نفدت الكمية', pd_perM2: '/ م²',
    pd_boxPrice: 'سعر الكرتونة', pd_boxInfo: 'الكرتونة = {m} م² ({n} بلاطة)',
    pd_brand: 'الماركة', pd_size: 'المقاس', pd_cm: 'سم', pd_finish: 'التشطيب',
    pd_pcs: 'عدد البلاطات في الكرتونة', pd_cover: 'تغطية الكرتونة', pd_m2: 'م²',
    pd_calcTitle: 'حاسبة السيراميك', pd_tabBoxes: 'أعرف عدد الكراتين', pd_tabArea: 'احسب من مساحة الغرفة',
    pd_boxesCount: 'عدد الكراتين', pd_boxHint: 'كل كرتونة تغطي {m} م²',
    pd_room: 'الغرفة', pd_length: 'الطول (متر)', pd_width: 'العرض (متر)',
    pd_addRoom: '+ إضافة غرفة أخرى', pd_removeRoom: 'حذف',
    pd_waste: 'نسبة الهالك', pd_wasteHint: 'بنضيف نسبة على المساحة للكسر والقص، وغالباً بتتحط من 5% لـ 10%، والتركيب المائل أو المعقد بيحتاج أكتر.',
    pd_totalArea: 'مساحة الغرف', pd_areaWaste: 'المساحة بعد الهالك ({w}%)',
    pd_youNeed: 'تحتاج', pd_boxesUnit: 'كرتونة', pd_useThis: 'استخدم العدد ده',
    pd_enterDims: 'اكتب الطول والعرض لكل غرفة وهنحسبلك.',
    pd_summary: '{n} كرتونة = {a} م²', pd_total: 'الإجمالي', pd_qty: 'الكمية',
    pd_added: 'تمت الإضافة إلى السلة ✓', pd_onlyAvail: 'المتاح {n} فقط',
    pd_notFound: 'المنتج غير موجود', pd_related: 'منتجات مشابهة'
  });
  Object.assign(I18N.en, {
    pd_home: 'Home', pd_out: 'Out of stock', pd_perM2: '/ m²',
    pd_boxPrice: 'Price per box', pd_boxInfo: 'Box = {m} m² ({n} tiles)',
    pd_brand: 'Brand', pd_size: 'Size', pd_cm: 'cm', pd_finish: 'Finish',
    pd_pcs: 'Tiles per box', pd_cover: 'Box coverage', pd_m2: 'm²',
    pd_calcTitle: 'Tile calculator', pd_tabBoxes: 'I know the number of boxes', pd_tabArea: 'Calculate from room size',
    pd_boxesCount: 'Number of boxes', pd_boxHint: 'Each box covers {m} m²',
    pd_room: 'Room', pd_length: 'Length (m)', pd_width: 'Width (m)',
    pd_addRoom: '+ Add another room', pd_removeRoom: 'Remove',
    pd_waste: 'Waste allowance', pd_wasteHint: 'We add a percentage for breakage and cutting. 5% to 10% is common, and diagonal or complex layouts need more.',
    pd_totalArea: 'Rooms area', pd_areaWaste: 'Area with waste ({w}%)',
    pd_youNeed: 'You need', pd_boxesUnit: 'boxes', pd_useThis: 'Use this number',
    pd_enterDims: 'Enter the length and width of each room and we will calculate.',
    pd_summary: '{n} boxes = {a} m²', pd_total: 'Total', pd_qty: 'Quantity',
    pd_added: 'Added to cart ✓', pd_onlyAvail: 'Only {n} available',
    pd_notFound: 'Product not found', pd_related: 'Related products'
  });

  const root = document.getElementById('product');
  const crumbs = document.getElementById('crumbs');
  const id = new URLSearchParams(location.search).get('id');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nm = o => (typeof o === 'string' ? o : (lang === 'en' ? o.en : o.ar));
  const fmt = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const toLatin = s => String(s ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const num = v => { const n = parseFloat(toLatin(v).replace(',', '.')); return n > 0 && n <= 1000 ? n : 0; };

  let P = null;
  let loaded = false;
  const S = { qty: 1, mode: 'boxes', rooms: [{ l: '', w: '' }], waste: 10, img: 0 };

  const isTile = () => P.type === 'tile';
  const round2 = n => Math.round(n * 100) / 100;
  const boxPrice = () => round2(P.price * P.tile.perBox);
  const unitPrice = () => (isTile() ? boxPrice() : P.price);
  const maxQty = () => Math.max(0, Math.min(P.stock, 9999));
  const clamp = q => Math.min(Math.max(1, Math.floor(q) || 1), Math.max(1, maxQty()));
  const inCart = () => (Cart.get().find(i => i.id === P.id) || {}).qty || 0;

  /* ---------- حساب الكراتين من المساحة ---------- */
  function calc() {
    const area = S.rooms.reduce((s, r) => s + num(r.l) * num(r.w), 0);
    const withWaste = area * (1 + S.waste / 100);
    const boxes = area > 0 ? Math.ceil(withWaste / P.tile.perBox - 1e-9) : 0;
    return { area, withWaste, boxes };
  }

  /* ---------- رسالة صغيرة ---------- */
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

  /* ---------- أجزاء الصفحة ---------- */
  function galleryHTML() {
    const imgs = P.images || [];
    const main = imgs.length
      ? `<img src="${esc(imgs[S.img])}" alt="${esc(nm(P.name))}">`
      : `<div class="ph" style="background-color:${esc(P.tone || '#ddd')}"><span>${t('imgPlaceholder')}</span></div>`;
    const thumbs = imgs.length > 1
      ? `<div class="pd__thumbs">${imgs.map((s, i) => `<button type="button" class="${i === S.img ? 'is-active' : ''}" data-img="${i}"><img src="${esc(s)}" alt=""></button>`).join('')}</div>`
      : '';
    return `<div class="pd__main">${main}</div>${thumbs}`;
  }

  function specsHTML() {
    const rows = [[t('pd_brand'), P.brand]];
    if (isTile()) {
      rows.push(
        [t('pd_size'), `${P.tile.size} ${t('pd_cm')}`],
        [t('pd_finish'), nm(P.tile.finish)],
        [t('pd_pcs'), P.tile.pcs],
        [t('pd_cover'), `${fmt(P.tile.perBox)} ${t('pd_m2')}`]
      );
    }
    (P.specs || []).forEach(([k, v]) => rows.push([nm(k), nm(v)]));
    return `<table class="specs">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`;
  }

  const stepperHTML = () => `
    <div class="stepper">
      <button type="button" data-step="-1" aria-label="-">−</button>
      <input class="qty-input" type="text" inputmode="numeric" value="${S.qty}" aria-label="${t('pd_qty')}">
      <button type="button" data-step="1" aria-label="+">+</button>
    </div>`;

  const roomHTML = (r, i) => `
    <div class="room">
      <div class="room__head">
        <b>${t('pd_room')} ${i + 1}</b>
        ${S.rooms.length > 1 ? `<button type="button" data-act="room-del" data-i="${i}">${t('pd_removeRoom')}</button>` : ''}
      </div>
      <div class="room__grid">
        <label><span>${t('pd_length')}</span><input class="dim" data-f="l" data-i="${i}" type="text" inputmode="decimal" maxlength="6" placeholder="0.00" value="${esc(r.l)}"></label>
        <label><span>${t('pd_width')}</span><input class="dim" data-f="w" data-i="${i}" type="text" inputmode="decimal" maxlength="6" placeholder="0.00" value="${esc(r.w)}"></label>
      </div>
    </div>`;

  function calcHTML() {
    return `
      <div class="calc">
        <h3>${t('pd_calcTitle')}</h3>
        <div class="calc__tabs">
          <button type="button" class="${S.mode === 'boxes' ? 'is-active' : ''}" data-mode="boxes">${t('pd_tabBoxes')}</button>
          <button type="button" class="${S.mode === 'area' ? 'is-active' : ''}" data-mode="area">${t('pd_tabArea')}</button>
        </div>

        <div class="calc__pane" ${S.mode === 'boxes' ? '' : 'hidden'}>
          <p class="calc__label">${t('pd_boxesCount')}</p>
          ${stepperHTML()}
          <small class="calc__hint">${t('pd_boxHint', { m: fmt(P.tile.perBox) })}</small>
        </div>

        <div class="calc__pane" ${S.mode === 'area' ? '' : 'hidden'}>
          ${S.rooms.map(roomHTML).join('')}
          <button type="button" class="calc__add" data-act="room-add">${t('pd_addRoom')}</button>
          <label class="calc__waste">
            <span>${t('pd_waste')}</span>
            <select id="wasteSel">${[0, 5, 10, 15].map(w => `<option value="${w}" ${S.waste === w ? 'selected' : ''}>${w}%</option>`).join('')}</select>
          </label>
          <small class="calc__hint">${t('pd_wasteHint')}</small>
          <div class="calc__result" id="calcResult"></div>
        </div>

        <div class="calc__sum" id="calcSum"></div>
      </div>`;
  }

  function buyHTML() {
    const out = P.stock <= 0;
    return `
      <div class="buy">
        ${isTile() ? '' : `<div class="buy__qty"><span>${t('pd_qty')}</span>${stepperHTML()}</div>`}
        <div class="buy__total" id="buyTotal"></div>
        <button type="button" class="btn btn--primary buy__btn" id="addBtn" ${out ? 'disabled' : ''}>${out ? t('pd_out') : t('addToCart')}</button>
      </div>`;
  }

  /* ---------- الأرقام اللي بتتحدث وإنت بتكتب ---------- */
  function updateOutputs() {
    if (!P) return;
    const total = S.qty * unitPrice();
    const bt = document.getElementById('buyTotal');
    if (bt) bt.innerHTML = `${t('pd_total')}: <b>${t('currency')} ${fmt(total)}</b>`;

    const cs = document.getElementById('calcSum');
    if (cs) cs.textContent = t('pd_summary', { n: S.qty, a: fmt(S.qty * P.tile.perBox) });

    const r = document.getElementById('calcResult');
    if (r) {
      const c = calc();
      r.innerHTML = c.area <= 0
        ? `<p class="calc__hint">${t('pd_enterDims')}</p>`
        : `
          <div class="rrow"><span>${t('pd_totalArea')}</span><b>${fmt(c.area)} ${t('pd_m2')}</b></div>
          ${S.waste ? `<div class="rrow"><span>${t('pd_areaWaste', { w: S.waste })}</span><b>${fmt(c.withWaste)} ${t('pd_m2')}</b></div>` : ''}
          <div class="rrow rrow--big"><span>${t('pd_youNeed')}</span><b>${c.boxes} ${t('pd_boxesUnit')}</b></div>
          <button type="button" class="btn btn--primary" data-act="use">${t('pd_useThis')}</button>`;
    }
  }

  /* ---------- الرسم الكامل ---------- */
  function cardHTML(p) {
    const price = p.type === 'tile'
      ? `${t('currency')} ${fmt(p.price)} ${t('pd_perM2')}`
      : `${t('currency')} ${fmt(p.price)}`;
    return `
      <a class="rcard" href="product.html?id=${encodeURIComponent(p.id)}">
        <div class="rcard__img" style="background-color:${esc(p.tone || '#ddd')}">${t('imgPlaceholder')}</div>
        <h3>${esc(nm(p.name))}</h3>
        <p>${price}</p>
      </a>`;
  }

  async function renderRelated() {
    const list = await Catalog.related(P, 4);
    const box = document.getElementById('related');
    if (!box || !list.length) return;
    box.innerHTML = `<h2>${t('pd_related')}</h2><div class="related__grid">${list.map(cardHTML).join('')}</div>`;
  }

  function render() {
    if (!loaded) return;
    if (!P) {
      crumbs.innerHTML = '';
      root.innerHTML = `<div class="pd-empty"><h2>${t('pd_notFound')}</h2><a class="btn btn--primary" href="/">${t('backHome')}</a></div>`;
      return;
    }
    const cat = CATEGORIES.find(c => c.id === P.cat);
    crumbs.innerHTML = `<a href="/">${t('pd_home')}</a><span>/</span>${cat ? `<a href="#">${esc(nm(cat))}</a><span>/</span>` : ''}<span>${esc(nm(P.name))}</span>`;
    document.title = `${nm(P.name)} | ${t('taglineName')}`;

    const disc = P.old > P.price ? Math.round((1 - P.price / P.old) * 100) : 0;
    const stock = P.stock <= 0 ? t('pd_out') : P.stock <= 1 ? t('onlyLeft', { n: P.stock }) : t('inStock');

    root.innerHTML = `
      <div class="pd">
        <div class="pd__gallery">${galleryHTML()}</div>
        <div class="pd__info">
          <span class="pd__brand">${esc(P.brand)}</span>
          <h1 class="pd__name">${esc(nm(P.name))}</h1>
          <div class="pd__price">
            <strong>${t('currency')} ${fmt(P.price)}</strong>
            ${isTile() ? `<span class="pd__unit">${t('pd_perM2')}</span>` : ''}
            ${disc ? `<del>${fmt(P.old)}</del><em class="pd__disc">-${disc}%</em>` : ''}
          </div>
          ${isTile() ? `<p class="pd__box">${t('pd_boxPrice')}: <b>${t('currency')} ${fmt(boxPrice())}</b> <span>(${t('pd_boxInfo', { m: fmt(P.tile.perBox), n: P.tile.pcs })})</span></p>` : ''}
          <p class="pd__stock ${P.stock <= 1 ? 'low' : ''}">${stock}</p>
          ${specsHTML()}
          ${isTile() ? calcHTML() : ''}
          ${buyHTML()}
        </div>
      </div>
      <section class="related" id="related"></section>`;
    updateOutputs();
    renderRelated();
  }

  /* ---------- التحكم ---------- */
  function setQty(q, fromInput) {
    if (q > maxQty() && maxQty() > 0) toast(t('pd_onlyAvail', { n: maxQty() }));
    S.qty = clamp(q);
    const inp = root.querySelector('.qty-input');
    if (inp && !fromInput) inp.value = S.qty;
    updateOutputs();
  }

  function useBoxes() {
    const c = calc();
    if (c.boxes < 1) return;
    if (c.boxes > maxQty()) toast(t('pd_onlyAvail', { n: maxQty() }));
    S.qty = clamp(c.boxes);
    S.mode = 'boxes';
    render();
  }

  function addToCart() {
    if (!P || P.stock <= 0) return;
    const room = maxQty() - inCart();
    if (room <= 0) return toast(t('pd_onlyAvail', { n: maxQty() }));
    const q = Math.min(S.qty, room);
    Cart.add(P.id, q);
    toast(q < S.qty ? t('pd_onlyAvail', { n: maxQty() }) : t('pd_added'));
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'addBtn') return addToCart();
    if (b.dataset.img) { S.img = Number(b.dataset.img); return render(); }
    if (b.dataset.mode) { S.mode = b.dataset.mode; return render(); }
    if (b.dataset.step) return setQty(S.qty + Number(b.dataset.step));
    switch (b.dataset.act) {
      case 'room-add': {
        S.rooms.push({ l: '', w: '' });
        render();
        const ins = root.querySelectorAll('.dim[data-f="l"]');
        if (ins.length) ins[ins.length - 1].focus();
        break;
      }
      case 'room-del': S.rooms.splice(Number(b.dataset.i), 1); render(); break;
      case 'use': useBoxes(); break;
    }
  });

  root.addEventListener('input', e => {
    const el = e.target;
    if (el.classList.contains('qty-input')) {
      const v = parseInt(toLatin(el.value), 10);
      if (v > 0) setQty(v, true);
    } else if (el.classList.contains('dim')) {
      S.rooms[Number(el.dataset.i)][el.dataset.f] = el.value;
      updateOutputs();
    }
  });

  root.addEventListener('change', e => {
    if (e.target.id === 'wasteSel') { S.waste = Number(e.target.value); updateOutputs(); }
    if (e.target.classList.contains('qty-input')) e.target.value = S.qty;
  });

  document.addEventListener('langchange', render);

  Catalog.byId(id).then(p => {
    P = p;
    loaded = true;
    if (P) S.qty = clamp(1);
    render();
  });
})();