const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const $ = s => document.querySelector(s);
let currentUser = null;

/* ---------- Products ---------- */
function cardHTML(p) {
  const name = lang === 'en' ? p.name_en : p.name;
  const stock = p.stock <= 1
    ? `<p class="card__stock low">${t('onlyLeft', { n: p.stock })}</p>`
    : `<p class="card__stock">${t('inStock')}</p>`;
  return `
    <article class="card">
      <span class="badge ${p.badge === 'popular' ? 'badge--hot' : ''}">${t(p.badge)}</span>
      <div class="card__img">${p.img ? `<img src="${p.img}" alt="${name}">` : t('imgPlaceholder')}</div>
      <h3 class="card__brand">${p.brand}</h3>
      <p class="card__name">${name}</p>
      ${stock}
      <div class="card__bottom">
        <button class="add">${t('addToCart')}</button>
        <div class="price"><strong>${t('currency')} ${fmt(p.price)}</strong><del>${fmt(p.old)} ${t('egp')}</del></div>
      </div>
    </article>`;
}

function buildSection(el) {
  const items = PRODUCTS[el.dataset.section] || [];
  const rtl = document.dir === 'rtl';
  el.innerHTML = `
    <div class="products__head">
      <h2>${t(el.dataset.titleKey)}</h2>
      <div class="products__tools">
        <button class="arrow" data-dir="1">${rtl ? '‹' : '›'}</button>
        <button class="arrow" data-dir="-1">${rtl ? '›' : '‹'}</button>
        <a href="#" class="btn--outline">${t('viewAll')}</a>
      </div>
    </div>
    <div class="products__track">${items.map(cardHTML).join('')}</div>`;

  const track = el.querySelector('.products__track');
  el.querySelectorAll('.arrow').forEach(btn =>
    btn.addEventListener('click', () => {
      const sign = rtl ? -1 : 1; // في RTL الـ scroll بالسالب
      track.scrollBy({ left: sign * btn.dataset.dir * track.clientWidth * 0.8, behavior: 'smooth' });
    }));
}

const renderProducts = () => document.querySelectorAll('.products').forEach(buildSection);

function renderCartCount() {
  // أيقونة السلة بتفتح صفحة السلة في كل الصفحات
  document.querySelectorAll('.cart-btn').forEach(a => a.setAttribute('href', 'cart.html'));
  const c = $('#cartCount');
  if (!c || typeof Cart === 'undefined') return;
  const n = Cart.count();
  c.textContent = n;
  c.hidden = n === 0;
}
document.addEventListener('cart:change', renderCartCount);
window.addEventListener('storage', renderCartCount);

/* ---------- Account ---------- */
function renderAccount() {
  const a = $('#accountLink');
  const [small, strong] = a.children;
  if (currentUser) {
    a.classList.remove('login-btn');
    small.hidden = false;
    small.textContent = t('hello');
    strong.textContent = currentUser.name;
    if (currentUser.role === 'admin') a.setAttribute('href', 'admin.html');
    else a.removeAttribute('href');
    $('#logoutBtn').hidden = false;
  } else {
    a.classList.add('login-btn');
    small.hidden = true;
    strong.textContent = t('login');
    a.setAttribute('href', 'login.html');
    $('#logoutBtn').hidden = true;
  }
}

async function loadUser() {
  try {
    const r = await fetch('/api/me');
    currentUser = r.ok ? (await r.json()).user : null;
  } catch { currentUser = null; }
  renderAccount();
}

$('#logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  currentUser = null;
  renderAccount();
});

/* ---------- البحث ---------- */
document.addEventListener('submit', e => {
  const f = e.target.closest && e.target.closest('.search');
  if (!f) return;
  e.preventDefault();
  const v = f.querySelector('input').value.trim();
  if (v) location.href = 'category.html?q=' + encodeURIComponent(v);
});

/* ---------- المفضلة ---------- */
function setupFavButton() {
  const cartBtn = document.querySelector('.cart-btn');
  if (!cartBtn || document.getElementById('favBtn') || typeof Favs === 'undefined') return;
  const a = document.createElement('a');
  a.id = 'favBtn';
  a.className = 'fav-link';
  a.href = 'category.html?fav=1';
  a.setAttribute('aria-label', 'Favorites');
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span class="cart-count" id="favCount" hidden>0</span>';
  cartBtn.before(a);
}
function renderFavCount() {
  const c = document.getElementById('favCount');
  if (!c || typeof Favs === 'undefined') return;
  const n = Favs.count();
  c.textContent = n;
  c.hidden = n === 0;
}
document.addEventListener('favs:change', renderFavCount);
window.addEventListener('storage', renderFavCount);

/* ---------- Init ---------- */
document.addEventListener('langchange', () => { renderProducts(); renderAccount(); });
applyLang();
loadUser();
renderCartCount();
setupFavButton();
renderFavCount();