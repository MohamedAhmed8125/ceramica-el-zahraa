const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
let cart = 0;

function cardHTML(p) {
  const stock = p.stock <= 1
    ? `<p class="card__stock low">تبقى ${p.stock} فقط</p>`
    : `<p class="card__stock">متوفر في المخزون</p>`;
  return `
    <article class="card">
      <span class="badge ${p.hot ? 'badge--hot' : ''}">${p.badge}</span>
      <div class="card__img">${p.img ? `<img src="${p.img}" alt="${p.name}">` : 'صورة المنتج'}</div>
      <h3 class="card__brand">${p.brand}</h3>
      <p class="card__name">${p.name}</p>
      ${stock}
      <div class="card__bottom">
        <button class="add">أضف إلى السلة</button>
        <div class="price"><strong>ج.م ${fmt(p.price)}</strong><del>${fmt(p.old)} جنيه</del></div>
      </div>
    </article>`;
}

function buildSection(el) {
  const items = PRODUCTS[el.dataset.section] || [];
  el.innerHTML = `
    <div class="products__head">
      <h2>${el.dataset.title}</h2>
      <div class="products__tools">
        <button class="arrow" data-dir="1" aria-label="التالي">›</button>
        <button class="arrow" data-dir="-1" aria-label="السابق">‹</button>
        <a href="#" class="btn--outline">عرض الكل</a>
      </div>
    </div>
    <div class="products__track">${items.map(cardHTML).join('')}</div>`;

  const track = el.querySelector('.products__track');
  el.querySelectorAll('.arrow').forEach(btn =>
    btn.addEventListener('click', () => {
      // الصفحة RTL فالاتجاه معكوس
      track.scrollBy({ left: -btn.dataset.dir * track.clientWidth * 0.8, behavior: 'smooth' });
    }));
}

document.querySelectorAll('.products').forEach(buildSection);

document.addEventListener('click', e => {
  if (e.target.classList.contains('add')) {
    document.getElementById('cartCount').textContent = ++cart;
  }
});
