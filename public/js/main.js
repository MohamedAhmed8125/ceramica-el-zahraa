const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const $ = s => document.querySelector(s);
let cart = 0;
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

document.addEventListener('click', e => {
  if (e.target.classList.contains('add')) $('#cartCount').textContent = ++cart;
});

/* ---------- Account ---------- */
function renderAccount() {
  const a = $('#accountLink');
  const [small, strong] = a.children;
  if (currentUser) {
    small.textContent = t('hello');
    strong.textContent = currentUser.name;
    a.removeAttribute('href');
    $('#logoutBtn').hidden = false;
  } else {
    small.textContent = t('login');
    strong.textContent = t('myAccount');
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

/* ---------- Init ---------- */
document.addEventListener('langchange', () => { renderProducts(); renderAccount(); });
applyLang();
loadUser();
