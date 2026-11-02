(function () {
  Object.assign(I18N.ar, {
    ct_title: 'سلة المشتريات', ct_empty: 'سلتك فاضية', ct_emptyText: 'ابدأ بإضافة المنتجات اللي عجبتك.',
    ct_shop: 'تسوق الآن', ct_continue: 'متابعة التسوق', ct_checkout: 'إتمام الطلب',
    ct_soon: 'صفحة إتمام الطلب هتتضاف قريباً.', ct_remove: 'حذف', ct_clear: 'تفريغ السلة',
    ct_confirmClear: 'متأكد إنك عايز تفرّغ السلة؟', ct_unitPrice: 'سعر الوحدة', ct_boxPrice: 'سعر الكرتونة',
    ct_cm: 'سم', ct_boxesUnit: 'كرتونة', ct_area: '= {a} م²', ct_qty: 'الكمية',
    ct_summary: 'ملخص الطلب', ct_items: 'عدد المنتجات', ct_total: 'الإجمالي',
    ct_batchNote: 'درجة لون السيراميك بتختلف شوية من دفعة لدفعة، فالأفضل تشتري الكمية كلها مرة واحدة.',
    ct_out: 'نفدت الكمية', ct_unavailable: 'المنتج ده لم يعد متاحاً.',
    ct_fixFirst: 'احذف المنتجات غير المتاحة عشان تكمّل.',
    ct_onlyAvail: 'المتاح {n} فقط', ct_adjusted: 'اتعدّلت كمية بعض المنتجات لأن المتاح أقل.'
  });
  Object.assign(I18N.en, {
    ct_title: 'Shopping cart', ct_empty: 'Your cart is empty', ct_emptyText: 'Start by adding the products you like.',
    ct_shop: 'Shop now', ct_continue: 'Continue shopping', ct_checkout: 'Checkout',
    ct_soon: 'The checkout page is coming soon.', ct_remove: 'Remove', ct_clear: 'Clear cart',
    ct_confirmClear: 'Are you sure you want to clear the cart?', ct_unitPrice: 'Unit price', ct_boxPrice: 'Price per box',
    ct_cm: 'cm', ct_boxesUnit: 'boxes', ct_area: '= {a} m²', ct_qty: 'Quantity',
    ct_summary: 'Order summary', ct_items: 'Products', ct_total: 'Total',
    ct_batchNote: 'Tile shade can differ slightly between batches, so it is best to buy the whole quantity at once.',
    ct_out: 'Out of stock', ct_unavailable: 'This product is no longer available.',
    ct_fixFirst: 'Remove the unavailable products to continue.',
    ct_onlyAvail: 'Only {n} available', ct_adjusted: 'Some quantities were adjusted to the available stock.'
  });

  const root = document.getElementById('cart');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nm = o => (typeof o === 'string' ? o : (lang === 'en' ? o.en : o.ar));
  const fmt = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const toLatin = s => String(s ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const maxOf = p => Math.max(0, Math.min(p.stock, 9999));

  const prods = {}; // المنتجات اللي اتحمّلت (بنحمّل كل منتج مرة واحدة)

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
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
  }

  async function loadProducts(items) {
    await Promise.all(items.filter(i => !(i.id in prods)).map(async i => { prods[i.id] = await Catalog.byId(i.id); }));
  }

  const badRow = (i, p, out) => `
    <article class="citem is-bad" data-id="${esc(i.id)}">
      <div class="citem__img"><div class="ph" style="background-color:#ddd"></div></div>
      <div class="citem__body">
        <b class="citem__name">${p ? esc(nm(p.name)) : esc(i.id)}</b>
        <p class="cbad">${out ? t('ct_out') : t('ct_unavailable')}</p>
      </div>
      <div class="citem__side"><span></span><button type="button" class="citem__remove" data-act="remove">${t('ct_remove')}</button></div>
    </article>`;

  function itemHTML(i, p, unit, line) {
    const tile = p.type === 'tile';
    const link = `product.html?id=${encodeURIComponent(p.id)}`;
    const img = p.images && p.images[0]
      ? `<img src="${esc(p.images[0])}" alt="">`
      : `<div class="ph" style="background-color:${esc(p.tone || '#ddd')}"></div>`;
    const meta = tile
      ? `${esc(p.tile.size)} ${t('ct_cm')} · ${esc(nm(p.tile.finish))} · ${t('ct_boxPrice')}: ${t('currency')} ${fmt(unit)}`
      : `${t('ct_unitPrice')}: ${t('currency')} ${fmt(unit)}`;
    return `
      <article class="citem" data-id="${esc(i.id)}">
        <a class="citem__img" href="${link}">${img}</a>
        <div class="citem__body">
          <a class="citem__name" href="${link}">${esc(nm(p.name))}</a>
          <span class="citem__brand">${esc(p.brand)}</span>
          <div class="citem__meta">${meta}</div>
          <div class="citem__row">
            <div class="stepper">
              <button type="button" data-step="-1" aria-label="-">−</button>
              <input class="qty-input" type="text" inputmode="numeric" value="${i.qty}" aria-label="${t('ct_qty')}">
              <button type="button" data-step="1" aria-label="+">+</button>
            </div>
            ${tile ? `<span class="citem__area">${t('ct_boxesUnit')} ${t('ct_area', { a: fmt(i.qty * p.tile.perBox) })}</span>` : ''}
          </div>
        </div>
        <div class="citem__side">
          <b class="citem__total">${t('currency')} ${fmt(line)}</b>
          <button type="button" class="citem__remove" data-act="remove">${t('ct_remove')}</button>
        </div>
      </article>`;
  }

  async function render() {
    const items = Cart.get();
    await loadProducts(items);

    // كمية أكبر من المتاح: بنعدّلها ونرجع (الرسم هيتعاد من حدث تغيّر السلة)
    const fixes = items.filter(i => prods[i.id] && prods[i.id].stock > 0 && i.qty > maxOf(prods[i.id]));
    if (fixes.length) {
      fixes.forEach(i => Cart.set(i.id, maxOf(prods[i.id])));
      toast(t('ct_adjusted'));
      return;
    }

    if (!items.length) {
      root.innerHTML = `
        <div class="cart-empty">
          <h2>${t('ct_empty')}</h2>
          <p>${t('ct_emptyText')}</p>
          <a class="btn btn--primary" href="/">${t('ct_shop')}</a>
        </div>`;
      return;
    }

    let total = 0, bad = 0, hasTile = false;
    const rows = items.map(i => {
      const p = prods[i.id];
      if (!p || p.stock <= 0) { bad++; return badRow(i, p, !!p); }
      const unit = Pricing.unit(p);
      const line = Pricing.round2(unit * i.qty);
      total += line;
      if (p.type === 'tile') hasTile = true;
      return itemHTML(i, p, unit, line);
    }).join('');
    total = Pricing.round2(total);

    root.innerHTML = `
      <div class="cart">
        <section>
          ${hasTile ? `<p class="cnote">${t('ct_batchNote')}</p>` : ''}
          ${rows}
        </section>
        <aside class="csum">
          <h2>${t('ct_summary')}</h2>
          <div class="rrow"><span>${t('ct_items')}</span><b>${items.length}</b></div>
          <div class="rrow rrow--big"><span>${t('ct_total')}</span><b>${t('currency')} ${fmt(total)}</b></div>
          ${bad ? `<p class="cbad">${t('ct_fixFirst')}</p>` : ''}
          <button type="button" class="btn btn--primary" id="goCheckout" ${bad ? 'disabled' : ''}>${t('ct_checkout')}</button>
          <a class="csum__more" href="/">${t('ct_continue')}</a>
          <button type="button" class="csum__clear" data-act="clear">${t('ct_clear')}</button>
        </aside>
      </div>`;
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const row = b.closest('.citem');
    const id = row && row.dataset.id;

    if (b.dataset.step) {
      const cur = (Cart.get().find(x => x.id === id) || {}).qty || 1;
      const next = cur + Number(b.dataset.step);
      const p = prods[id];
      if (next < 1) return;
      if (p && next > maxOf(p)) return toast(t('ct_onlyAvail', { n: maxOf(p) }));
      Cart.set(id, next);
    } else if (b.dataset.act === 'remove') {
      Cart.remove(id);
    } else if (b.dataset.act === 'clear') {
      if (confirm(t('ct_confirmClear'))) Cart.clear();
    } else if (b.id === 'goCheckout') {
        location.href = 'checkout.html';
    }
  });

  root.addEventListener('change', e => {
    if (!e.target.classList.contains('qty-input')) return;
    const id = e.target.closest('.citem').dataset.id;
    const v = parseInt(toLatin(e.target.value), 10);
    const p = prods[id];
    if (!(v > 0)) return render();
    if (p && v > maxOf(p)) { toast(t('ct_onlyAvail', { n: maxOf(p) })); return Cart.set(id, maxOf(p)); }
    Cart.set(id, v);
  });

  document.addEventListener('cart:change', render);
  window.addEventListener('storage', render);
  document.addEventListener('langchange', render);
  render();
})();