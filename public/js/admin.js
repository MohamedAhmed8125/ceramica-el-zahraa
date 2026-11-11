const view = document.getElementById('view');
const badge = document.getElementById('unreadBadge');

let allMessages = [], allUsers = [];
let msgFilter = 'all', msgQuery = '', userQuery = '';

// أي نص جاي من العملاء لازم يتعمله escape قبل ما يتحط في الصفحة
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = iso => new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });

async function api(url, opts = {}) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'error'), { status: r.status });
  return data;
}

function updateBadge(unread) {
  badge.textContent = unread;
  badge.hidden = !unread;
}

/* ---------- نظرة عامة ---------- */
async function showOverview() {
  const s = await api('/api/admin/stats');
  updateBadge(s.unread);
  updateOrdersBadge(s.newOrders);
  view.innerHTML = `
    <div class="stats">
      <div class="stat"><strong>${s.users}</strong><span>مستخدم مسجل</span></div>
      <div class="stat"><strong>${s.messages}</strong><span>رسالة اتصل بنا</span></div>
      <div class="stat"><strong>${s.unread}</strong><span>رسالة غير مقروءة</span></div>
      <div class="stat"><strong>${s.orders}</strong><span>طلب (${s.newOrders} جديد)</span></div>
    </div>`;
}

/* ---------- الرسائل ---------- */
function msgHTML(m) {
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}`;
  const wa = /^01\d{9}$/.test(m.phone || '') ? `https://wa.me/20${m.phone.slice(1)}` : '';
  return `
    <article class="msg ${m.read ? '' : 'unread'}" data-id="${esc(m.id)}">
      <div class="msg__head">
        <strong>${esc(m.name)} <span class="chip ${m.read ? 'chip--read' : 'chip--new'}">${m.read ? '✓ مقروءة' : 'جديدة'}</span></strong>
        <small>${fmtDate(m.createdAt)}</small>
      </div>
      <div class="msg__meta">
        <span>${esc(m.email)}</span>
        ${m.phone ? `<span dir="ltr">${esc(m.phone)}</span>` : ''}
      </div>
      <p class="msg__text">${esc(m.message)}</p>
      <div class="msg__btns">
        <a href="${gmail}" target="_blank" rel="noopener">رد بالإيميل</a>
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener">رد بواتساب</a>` : ''}
        <button type="button" data-act="read">${m.read ? 'علّم كغير مقروءة' : 'علّم كمقروءة'}</button>
        <button type="button" class="danger" data-act="delete">حذف</button>
      </div>
    </article>`;
}

function filteredMessages() {
  const q = msgQuery.trim().toLowerCase();
  return allMessages.filter(m =>
    (msgFilter === 'all' || (msgFilter === 'unread' ? !m.read : m.read)) &&
    (!q || [m.name, m.email, m.phone, m.message].some(v => String(v || '').toLowerCase().includes(q))));
}

function renderMessageList() {
  const list = document.getElementById('msgList');
  if (!list) return;
  const items = filteredMessages();
  list.innerHTML = items.length
    ? items.map(msgHTML).join('')
    : `<div class="empty">${allMessages.length ? 'مفيش نتايج مطابقة.' : 'مفيش رسائل لسه.'}</div>`;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('is-active', b.dataset.filter === msgFilter));
  updateBadge(allMessages.filter(m => !m.read).length);
}

async function showMessages() {
  allMessages = (await api('/api/admin/messages')).messages;
  view.innerHTML = `
    <div class="toolbar">
      <div class="filters">
        <button type="button" data-filter="all">الكل</button>
        <button type="button" data-filter="unread">غير المقروءة</button>
        <button type="button" data-filter="read">المقروءة</button>
      </div>
      <input type="search" id="msgSearch" class="search-box" placeholder="ابحث بالاسم أو الإيميل أو الرقم..." value="${esc(msgQuery)}">
    </div>
    <div id="msgList"></div>`;
  renderMessageList();
}

async function messageAction(btn) {
  const m = allMessages.find(x => x.id === btn.closest('.msg').dataset.id);
  if (!m) return;
  if (btn.dataset.act === 'delete') {
    if (!confirm('متأكد إنك عايز تحذف الرسالة دي؟')) return;
    await api('/api/admin/messages/' + m.id, { method: 'DELETE' });
    allMessages = allMessages.filter(x => x !== m);
  } else {
    await api('/api/admin/messages/' + m.id, { method: 'PATCH', body: JSON.stringify({ read: !m.read }) });
    m.read = !m.read;
  }
  renderMessageList();
}

/* ---------- المستخدمون ---------- */
function renderUserTable() {
  const box = document.getElementById('userTable');
  if (!box) return;
  const q = userQuery.trim().toLowerCase();
  const items = allUsers.filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  box.innerHTML = items.length
    ? `<div class="table-wrap"><table>
        <thead><tr><th>الاسم</th><th>الإيميل</th><th>الدور</th><th>تاريخ التسجيل</th><th></th></tr></thead>
        <tbody>${items.map(u => `
          <tr>
            <td>${esc(u.name)}</td><td>${esc(u.email)}</td>
            <td class="${u.role === 'admin' ? 'role-admin' : ''}">${u.role === 'admin' ? 'أدمن' : 'عميل'}</td>
            <td>${fmtDate(u.createdAt)}</td>
            <td>${u.role === 'admin' ? '' : `<button type="button" class="link-danger" data-act="del-user" data-id="${esc(u.id)}">حذف</button>`}</td>
          </tr>`).join('')}
        </tbody></table></div>`
    : `<div class="empty">${allUsers.length ? 'مفيش نتايج مطابقة.' : 'مفيش مستخدمين لسه.'}</div>`;
}

async function showUsers() {
  allUsers = (await api('/api/admin/users')).users;
  view.innerHTML = `
    <div class="toolbar">
      <strong>${allUsers.length} مستخدم</strong>
      <input type="search" id="userSearch" class="search-box" placeholder="ابحث بالاسم أو الإيميل..." value="${esc(userQuery)}">
    </div>
    <div id="userTable"></div>`;
  renderUserTable();
}

/* ---------- الإعدادات ---------- */
function showSettings() {
  view.innerHTML = `
    <form id="pwForm" class="panel" novalidate>
      <h2>تغيير كلمة المرور</h2>
      <label class="field"><span>كلمة المرور الحالية</span><input type="password" name="current" autocomplete="current-password" required></label>
      <label class="field"><span>كلمة المرور الجديدة (8 أحرف على الأقل)</span><input type="password" name="next" autocomplete="new-password" minlength="8" required></label>
      <label class="field"><span>تأكيد كلمة المرور الجديدة</span><input type="password" name="confirm" autocomplete="new-password" required></label>
      <p class="form-msg" id="pwMsg" role="alert" hidden></p>
      <button type="submit" class="btn btn--primary">حفظ</button>
    </form>`;
}

/* ---------- الأحداث ---------- */
view.addEventListener('click', async e => {
  const f = e.target.closest('[data-filter]');
  if (f) { msgFilter = f.dataset.filter; renderMessageList(); return; }

  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  try {
    switch (btn.dataset.act) {
      case 'read':
      case 'delete':
        await messageAction(btn);
        break;
      case 'del-user':
        if (!confirm('متأكد إنك عايز تحذف الحساب ده؟')) return;
        await api('/api/admin/users/' + btn.dataset.id, { method: 'DELETE' });
        await showUsers();
        break;
    }
  } catch { alert('حصل خطأ، جرّب تاني.'); }
});

view.addEventListener('input', e => {
  if (e.target.id === 'msgSearch') { msgQuery = e.target.value; renderMessageList(); }
  if (e.target.id === 'userSearch') { userQuery = e.target.value; renderUserTable(); }
});

view.addEventListener('submit', async e => {
  if (e.target.id !== 'pwForm') return;
  e.preventDefault();
  const f = e.target;
  const msg = document.getElementById('pwMsg');
  const show = (text, ok) => { msg.textContent = text; msg.classList.toggle('ok', !!ok); msg.hidden = false; };

  if (f.next.value.length < 8) return show('كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل.');
  if (f.next.value !== f.confirm.value) return show('تأكيد كلمة المرور مش مطابق.');

  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await api('/api/admin/password', { method: 'POST', body: JSON.stringify({ current: f.current.value, next: f.next.value }) });
    f.reset();
    show('تم تغيير كلمة المرور.', true);
  } catch (err) {
    show({
      invalid_credentials: 'كلمة المرور الحالية غير صحيحة.',
      weak_password: 'كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل.',
      too_many_requests: 'محاولات كتير، جرّب بعد شوية.'
    }[err.message] || 'حصل خطأ، جرّب تاني.');
  }
  btn.disabled = false;
});

/* ---------- التبويبات ---------- */
const tabs = { overview: showOverview, messages: showMessages, users: showUsers, orders: showOrders, products: showProducts, banners: showBanners, settings: showSettings };
async function openTab(name) {
  document.querySelectorAll('.admin__tabs button').forEach(b => b.classList.toggle('is-active', b.dataset.tab === name));
  view.innerHTML = '<div class="empty">جاري التحميل...</div>';
  try { await tabs[name](); }
  catch (err) {
    console.error(err);
    view.innerHTML = '<div class="empty">تعذر تحميل البيانات. تأكد إن السيرفر شغال.</div>';
  }
}

document.querySelector('.admin__tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (b) openTab(b.dataset.tab);
});

document.getElementById('logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/';
});

/* ---------- البانر ---------- */
let allBanners = [];
let bannerEditing = null; // 'new' للإضافة، أو id للتعديل

async function showBanners() {
  allBanners = (await api('/api/admin/banners')).banners;
  renderBannerList();
}

function bannerRowHTML(b, i) {
  return `
    <article class="brow ${b.active ? '' : 'is-off'}" data-id="${esc(b.id)}">
      <div class="brow__img">${b.desktop ? `<img src="${esc(b.desktop)}" alt="">` : '<span>بدون صورة</span>'}</div>
      <div class="brow__info">
        <strong>بانر ${i + 1}</strong>
        <div class="brow__meta">
          <span class="chip ${b.active ? 'chip--read' : 'chip--off'}">${b.active ? 'ظاهر' : 'مخفي'}</span>
          <span>${b.mobile ? 'نسخة موبايل ✓' : 'من غير نسخة موبايل'}</span>
        </div>
      </div>
      <div class="brow__btns">
        <button type="button" data-act="banner-up" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-act="banner-down" ${i === allBanners.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" data-act="banner-edit">تعديل</button>
        <button type="button" data-act="banner-toggle">${b.active ? 'إخفاء' : 'إظهار'}</button>
        <button type="button" class="danger" data-act="banner-delete">حذف</button>
      </div>
    </article>`;
}

function renderBannerList() {
  view.innerHTML = `
    <div class="toolbar">
      <strong>${allBanners.length} بانر</strong>
      <button type="button" class="btn btn--primary" data-act="banner-new">+ إضافة بانر</button>
    </div>
    ${allBanners.length
      ? allBanners.map(bannerRowHTML).join('')
      : '<div class="empty">مفيش بانرات لسه. الصفحة الرئيسية بتعرض بانر افتراضي لحد ما تضيف.</div>'}`;
}

function renderBannerForm(b) {
  const isNew = !b;
  b = b || { active: true, desktop: '', mobile: '' };
  view.innerHTML = `
    <form id="bannerForm" class="panel panel--wide" novalidate>
      <h2>${isNew ? 'إضافة بانر' : 'تعديل البانر'}</h2>
      <div class="grid2">
        <div class="field">
          <span>صورة الكمبيوتر (1600×600)${isNew ? ' - مطلوبة' : ''}</span>
          ${b.desktop ? `<img class="thumb" src="${esc(b.desktop)}" alt="">` : ''}
          <input type="file" name="desktop" accept="image/jpeg,image/png,image/webp" data-ratio="2.667">
          <small class="hint" data-hint>${b.desktop ? 'سيبها فاضية لو مش عايز تغيّر الصورة.' : ''}</small>
        </div>
        <div class="field">
          <span>صورة الموبايل (1080×720) - اختياري</span>
          ${b.mobile ? `<img class="thumb" src="${esc(b.mobile)}" alt="">` : ''}
          <input type="file" name="mobile" accept="image/jpeg,image/png,image/webp" data-ratio="1.5">
          <small class="hint" data-hint></small>
          ${b.mobile ? '<label class="check"><input type="checkbox" name="removeMobile" value="true"> احذف صورة الموبايل</label>' : ''}
        </div>
      </div>
      <label class="check"><input type="checkbox" name="active" ${b.active ? 'checked' : ''}> ظاهر في الموقع</label>
      <p class="form-msg" id="bMsg" role="alert" hidden></p>
      <div class="form-actions">
        <button type="submit" class="btn btn--primary">حفظ</button>
        <button type="button" class="btn btn--outline" data-act="banner-cancel">إلغاء</button>
      </div>
    </form>`;
}

view.addEventListener('click', async e => {
  const btn = e.target.closest('[data-act^="banner-"]');
  if (!btn) return;
  const row = btn.closest('.brow');
  const id = row ? row.dataset.id : null;
  const b = id ? allBanners.find(x => x.id === id) : null;
  try {
    switch (btn.dataset.act) {
      case 'banner-new': bannerEditing = 'new'; renderBannerForm(null); break;
      case 'banner-edit': bannerEditing = id; renderBannerForm(b); break;
      case 'banner-cancel': renderBannerList(); break;
      case 'banner-up':
      case 'banner-down':
        await api(`/api/admin/banners/${id}/move`, { method: 'PATCH', body: JSON.stringify({ dir: btn.dataset.act === 'banner-up' ? -1 : 1 }) });
        await showBanners();
        break;
      case 'banner-toggle':
        await api('/api/admin/banners/' + id, { method: 'PATCH', body: JSON.stringify({ active: !b.active }) });
        await showBanners();
        break;
      case 'banner-delete':
        if (!confirm('متأكد إنك عايز تحذف البانر ده؟')) return;
        await api('/api/admin/banners/' + id, { method: 'DELETE' });
        await showBanners();
        break;
    }
  } catch { alert('حصل خطأ، جرّب تاني.'); }
});

view.addEventListener('submit', async e => {
  if (e.target.id !== 'bannerForm') return;
  e.preventDefault();
  const f = e.target;
  const msg = document.getElementById('bMsg');
  const show = text => { msg.textContent = text; msg.hidden = false; };
  if (bannerEditing === 'new' && !f.desktop.files[0]) return show('ارفع صورة الكمبيوتر.');

  for (const name of ['desktop', 'mobile']) {
    const file = f[name].files[0];
    if (file && file.size > 2 * 1024 * 1024) return show('حجم الصورة لازم يكون أقل من 2 ميجابايت.');
  }

  const fd = new FormData(f);
  fd.set('active', f.active.checked ? 'true' : 'false');
  const submitBtn = f.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  try {
    const isNew = bannerEditing === 'new';
    const r = await fetch(isNew ? '/api/admin/banners' : '/api/admin/banners/' + bannerEditing, {
      method: isNew ? 'POST' : 'PUT',
      body: fd
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'error');
    await showBanners();
  } catch (err) {
    show({
      invalid_link: 'الرابط لازم يبدأ بـ / أو http:// أو https://',
      bad_image: 'الصورة لازم تكون JPG أو PNG أو WebP.',
      file_too_large: 'حجم الصورة لازم يكون أقل من 2 ميجابايت.',
      banner_empty: 'ارفع صورة الكمبيوتر.'
    }[err.message] || 'حصل خطأ، جرّب تاني.');
    submitBtn.disabled = false;
  }
});

// تنبيه لو مقاس الصورة بعيد عن المناسب
view.addEventListener('change', e => {
  const input = e.target;
  if (!input.matches('#bannerForm input[type=file]')) return;
  const hint = input.parentElement.querySelector('[data-hint]');
  const file = input.files[0];
  if (!file) { hint.textContent = ''; return; }
  const img = new Image();
  img.onload = () => {
    const target = Number(input.dataset.ratio);
    const off = Math.abs(img.width / img.height - target) / target > 0.15;
    hint.textContent = `${img.width}×${img.height}` + (off ? ' - النسبة بعيدة عن المقاس المناسب، ممكن الصورة تتقص.' : ' ✓');
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
});

/* ---------- الطلبات ---------- */
let allOrders = [];
const ORDER_STATUS = { new: 'جديد', processing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };
const PAY_LABEL = { cod: 'نقداً عند الاستلام', instapay: 'إنستاباي' };
const money = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' جنيه';

function updateOrdersBadge(n) {
  const b = document.getElementById('ordersBadge');
  b.textContent = n;
  b.hidden = !n;
}

function orderHTML(o) {
  const c = o.customer;
  const wa = /^01\d{9}$/.test(c.phone) ? `https://wa.me/20${c.phone.slice(1)}` : '';
  const where = o.shipping === 'pickup'
    ? 'استلام من المعرض'
    : `${esc(o.address.governorate.ar)} - ${esc(o.address.city)} - ${esc(o.address.street)}`;
  const ship = o.shippingPending ? ' + توصيل (يتحدد بالتليفون)' : (o.shippingFee ? ` + توصيل ${money(o.shippingFee)}` : '');
  return `
    <article class="ocard st-${esc(o.status)}" data-id="${esc(o.id)}">
      <div class="ocard__head">
        <strong dir="ltr">${esc(o.id)}</strong>
        <small>${fmtDate(o.createdAt)}</small>
        <select class="ostatus" aria-label="الحالة">
          ${Object.entries(ORDER_STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="ocard__grid">
        <div>
          <b>${esc(c.firstName)} ${esc(c.lastName)}</b>
          <p dir="ltr">${esc(c.phone)}</p>
          <p>${esc(c.email)}</p>
        </div>
        <div>
          <p>${where}</p>
          <p>الدفع: ${PAY_LABEL[o.payment] || ''}</p>
          ${c.notes ? `<p>ملاحظات: ${esc(c.notes)}</p>` : ''}
        </div>
      </div>
      <ul class="ocard__items">
        ${o.items.map(i => `<li><span>${esc(i.name.ar)} × ${i.qty}${i.tile ? ` (${i.tile.area} م²)` : ''}</span><b>${money(i.line)}</b></li>`).join('')}
      </ul>
      <div class="ocard__total"><span>المنتجات ${money(o.subtotal)}${ship}</span><b>${money(o.total)}</b></div>
      <div class="msg__btns">
        <a href="tel:${esc(c.phone)}">اتصال</a>
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener">واتساب</a>` : ''}
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}" target="_blank" rel="noopener">إيميل</a>
      </div>
    </article>`;
}

async function showOrders() {
  allOrders = (await api('/api/admin/orders')).orders;
  updateOrdersBadge(allOrders.filter(o => o.status === 'new').length);
  view.innerHTML = allOrders.length
    ? allOrders.map(orderHTML).join('')
    : '<div class="empty">مفيش طلبات لسه.</div>';
}

view.addEventListener('change', async e => {
  if (!e.target.classList.contains('ostatus')) return;
  const card = e.target.closest('.ocard');
  try {
    await api('/api/admin/orders/' + card.dataset.id, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) });
    const o = allOrders.find(x => x.id === card.dataset.id);
    if (o) o.status = e.target.value;
    card.className = 'ocard st-' + e.target.value;
    updateOrdersBadge(allOrders.filter(x => x.status === 'new').length);
  } catch { alert('حصل خطأ، جرّب تاني.'); showOrders(); }
});

/* ---------- المنتجات ---------- */
let allProducts = [];
let prodDemo = false;
let prodQuery = '';
let prodCatFilter = '';
let prodEditing = null; // 'new' أو id المنتج
let prodKeep = null;    // بيانات بتتكرر في "حفظ وإضافة منتج آخر"
let prodFlash = '';

const FINISHES = [['glossy', 'لامع'], ['matte', 'مطفي'], ['satin', 'ساتان'], ['rustic', 'خشن']];
const SIZE_RE = /^(floors|walls)-\d+-\d+-cm$/;
const toLatin = s => String(s ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const catName = id => (CATEGORIES.find(c => c.id === id) || { ar: id }).ar;

function subName(catId, slug) {
  const c = CATEGORIES.find(x => x.id === catId);
  if (!c) return slug;
  for (const col of c.cols) {
    if (!col.items.length && slugify(col.en) === slug) return col.ar;
    for (const it of col.items) if (slugify(it[1]) === slug) return it[0];
  }
  return slug;
}

// قايمة الأقسام الفرعية للقسم المختار (أقسام المقاسات بتتحدد تلقائياً من مقاس المنتج)
function subOptions(catId, selected) {
  const c = CATEGORIES.find(x => x.id === catId);
  if (!c) return '<option value="">اختر القسم الأول</option>';
  const opt = (v, l) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`;
  const groups = c.cols.map(col => {
    if (!col.items.length) return opt(slugify(col.en), col.ar);
    const items = col.items.map(i => [slugify(i[1]), i[0]]).filter(([v]) => !SIZE_RE.test(v));
    return items.length ? `<optgroup label="${esc(col.ar)}">${items.map(([v, l]) => opt(v, l)).join('')}</optgroup>` : '';
  }).join('');
  return `<option value="">— بدون قسم فرعي —</option>${groups}`;
}

async function loadProducts() {
  const d = await api('/api/admin/products');
  allProducts = d.products;
  prodDemo = d.demo;
}

async function showProducts() {
  await loadProducts();
  prodEditing = null;
  renderProductList();
}

function productRowHTML(p) {
  const tile = p.type === 'tile';
  const img = p.images && p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : '<span>بدون صورة</span>';
  const price = tile
    ? `${money(p.price)} / م² (الكرتونة ${money(Math.round(p.price * p.tile.perBox * 100) / 100)})`
    : money(p.price);
  const status = !p.active ? ['مخفي', 'chip--off'] : p.stock <= 0 ? ['نفد', 'chip--off'] : ['ظاهر', 'chip--read'];
  return `
    <article class="brow prow ${p.active ? '' : 'is-off'}" data-id="${esc(p.id)}">
      <div class="brow__img prow__img">${img}</div>
      <div class="brow__info">
        <strong>${esc(p.name.ar)}</strong>
        <small>${esc(p.brand)} · ${esc(catName(p.cat))}${p.sub ? ' › ' + esc(subName(p.cat, p.sub)) : ''}</small>
        <div class="brow__meta">
          <span>${price}</span>
          <span>المخزون: ${p.stock} ${tile ? 'كرتونة' : 'قطعة'}</span>
          <span class="chip ${status[1]}">${status[0]}</span>
        </div>
      </div>
      <div class="brow__btns">
        <button type="button" data-act="prod-edit">تعديل</button>
        <button type="button" data-act="prod-toggle">${p.active ? 'إخفاء' : 'إظهار'}</button>
        <button type="button" class="danger" data-act="prod-delete">حذف</button>
      </div>
    </article>`;
}

function renderProdItems() {
  const box = document.getElementById('prodList');
  if (!box) return;
  const q = prodQuery.trim().toLowerCase();
  const items = allProducts.filter(p =>
    (!prodCatFilter || p.cat === prodCatFilter) &&
    (!q || [p.name.ar, p.name.en, p.brand].some(v => String(v || '').toLowerCase().includes(q))));
  box.innerHTML = items.length
    ? items.map(productRowHTML).join('')
    : `<div class="empty">${allProducts.length ? 'مفيش نتايج مطابقة.' : 'لسه مفيش منتجات. اضغط "+ إضافة منتج" وابدأ.'}</div>`;
}

function renderProductList() {
  const flash = prodFlash;
  prodFlash = '';
  view.innerHTML = `
    ${flash ? `<div class="admin-note ok">${esc(flash)}</div>` : ''}
    ${prodDemo ? '<div class="admin-note">المنتجات اللي ظاهرة في الموقع دلوقتي <b>تجريبية</b>. أول ما تضيف منتج حقيقي هتختفي كلها، ويظهر الموقع بمنتجاتك إنت بس.</div>' : ''}
    <div class="toolbar">
      <strong>${allProducts.length} منتج</strong>
      <div class="toolbar__grow">
        <input type="search" id="prodSearch" class="search-box" placeholder="ابحث بالاسم أو الماركة..." value="${esc(prodQuery)}">
        <select id="prodCatSel">
          <option value="">كل الأقسام</option>
          ${CATEGORIES.map(c => `<option value="${esc(c.id)}" ${prodCatFilter === c.id ? 'selected' : ''}>${esc(c.ar)}</option>`).join('')}
        </select>
      </div>
      <button type="button" class="btn btn--primary" data-act="prod-new">+ إضافة منتج</button>
    </div>
    <div id="prodList"></div>`;
  renderProdItems();
}

function productFormHTML(p) {
  const isNew = !p;
  const d = p || prodKeep || { cat: '', sub: '', brand: '', type: 'item', use: 'floor' };
  const tl = d.tile || {};
  const imgs = (p && p.images) || [];
  const brands = [...new Set(allProducts.map(x => x.brand))];
  const v = x => esc(x ?? '');
  const flash = prodFlash;
  prodFlash = '';
  return `
    <form id="productForm" class="panel panel--wide" novalidate>
      <h2>${isNew ? 'إضافة منتج' : 'تعديل منتج'}</h2>
      ${flash ? `<p class="form-msg ok">${esc(flash)}</p>` : ''}

      <div class="grid2">
        <label class="field"><span>القسم *</span>
          <select name="cat" id="pfCat">
            <option value="">اختر القسم...</option>
            ${CATEGORIES.map(c => `<option value="${esc(c.id)}" ${d.cat === c.id ? 'selected' : ''}>${esc(c.ar)}</option>`).join('')}
          </select>
        </label>
        <label class="field"><span>القسم الفرعي</span>
          <select name="sub" id="pfSub">${subOptions(d.cat, d.sub)}</select>
        </label>
      </div>

      <div class="grid2">
        <label class="field"><span>اسم المنتج (عربي) *</span><input name="name_ar" maxlength="120" value="${v(p && p.name.ar)}"></label>
        <label class="field"><span>اسم المنتج (English)</span><input name="name_en" maxlength="120" dir="ltr" value="${v(p && p.name.en)}"><small class="hint">اختياري. لو سبته فاضي بيظهر الاسم العربي.</small></label>
      </div>

      <div class="grid2">
        <label class="field"><span>الماركة *</span>
          <input name="brand" list="brandList" maxlength="60" value="${v(d.brand)}">
          <datalist id="brandList">${brands.map(b => `<option value="${esc(b)}">`).join('')}</datalist>
        </label>
        <label class="field"><span>طريقة البيع</span>
          <select name="type">
            <option value="item" ${d.type !== 'tile' ? 'selected' : ''}>بالقطعة</option>
            <option value="tile" ${d.type === 'tile' ? 'selected' : ''}>بالكرتونة (سيراميك / بورسلين / باركيه)</option>
          </select>
        </label>
      </div>

      <div class="tilebox" id="tileBox" ${d.type === 'tile' ? '' : 'hidden'}>
        <div class="tilebox__title">بيانات الكرتونة</div>
        <div class="grid2">
          <label class="field"><span>المقاس بالسنتيمتر *</span><input name="size" dir="ltr" placeholder="60×120" value="${v(tl.size)}"></label>
          <label class="field"><span>الاستخدام</span>
            <select name="use">
              <option value="floor" ${d.use !== 'wall' ? 'selected' : ''}>أرضيات</option>
              <option value="wall" ${d.use === 'wall' ? 'selected' : ''}>حوائط</option>
            </select>
          </label>
          <label class="field"><span>التشطيب</span>
            <select name="finish">
              ${FINISHES.map(([k, l]) => `<option value="${k}" ${tl.finish && tl.finish.ar === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </label>
          <label class="field"><span>الكرتونة بتغطي كام متر مربع؟ *</span>
            <input name="perBox" inputmode="decimal" dir="ltr" placeholder="1.44" value="${v(tl.perBox)}">
          </label>
          <label class="field"><span>عدد القطع في الكرتونة</span>
            <input name="pcs" inputmode="numeric" dir="ltr" placeholder="2" value="${v(tl.pcs || '')}"><small class="hint">اختياري</small>
          </label>
        </div>
      </div>

      <div class="grid2">
        <label class="field"><span id="lblPrice">السعر (جنيه) *</span><input name="price" inputmode="decimal" dir="ltr" value="${v(p && p.price)}"></label>
        <label class="field"><span id="lblOld">السعر القديم (اختياري)</span><input name="old" inputmode="decimal" dir="ltr" value="${v(p && p.old ? p.old : '')}"><small class="hint">لو أكبر من السعر الحالي بيظهر خصم.</small></label>
        <label class="field"><span id="lblStock">الكمية المتاحة *</span><input name="stock" inputmode="numeric" dir="ltr" value="${v(p ? p.stock : '')}"></label>
      </div>
      <p class="boxprice" id="boxPrice"></p>

      <div class="field">
        <span>صور المنتج (حتى 5، الأولى هي الرئيسية)</span>
        ${imgs.length ? `<div class="thumbs">${imgs.map(u => `
          <div class="thumb-item"><img src="${esc(u)}" alt="">
            <label><input type="checkbox" name="removeImages" value="${esc(u)}"> حذف</label></div>`).join('')}</div>` : ''}
        <input type="file" id="pfFiles" name="images" accept="image/jpeg,image/png,image/webp" multiple>
        <div class="thumbs" id="pfPreview"></div>
        <small class="hint">يفضل صورة مربعة (مثلاً 1000×1000)، JPG أو PNG أو WebP، وأقل من 2 ميجا للصورة.</small>
      </div>

      <label class="check"><input type="checkbox" name="active" ${!p || p.active ? 'checked' : ''}> ظاهر في الموقع</label>
      <p class="form-msg" id="pMsg" role="alert" hidden></p>
      <div class="form-actions">
        <button type="submit" class="btn btn--primary">حفظ</button>
        ${isNew ? '<button type="submit" class="btn btn--outline" data-again="1">حفظ وإضافة منتج آخر</button>' : ''}
        <button type="button" class="btn btn--outline" data-act="prod-cancel">إلغاء</button>
      </div>
    </form>`;
}

// تغيّر العناوين والأرقام حسب طريقة البيع
function syncProductForm() {
  const f = document.getElementById('productForm');
  if (!f) return;
  const tile = f.elements.type.value === 'tile';
  document.getElementById('tileBox').hidden = !tile;
  document.getElementById('lblPrice').textContent = tile ? 'سعر المتر المربع (جنيه) *' : 'السعر (جنيه) *';
  document.getElementById('lblOld').textContent = tile ? 'السعر القديم للمتر (اختياري)' : 'السعر القديم (اختياري)';
  document.getElementById('lblStock').textContent = tile ? 'عدد الكراتين المتاحة *' : 'الكمية المتاحة *';
  const price = parseFloat(toLatin(f.elements.price.value).replace(',', '.'));
  const per = parseFloat(toLatin(f.elements.perBox.value).replace(',', '.'));
  document.getElementById('boxPrice').textContent =
    tile && price > 0 && per > 0 ? `سعر الكرتونة = ${money(Math.round(price * per * 100) / 100)}` : '';
}

function openProductForm(p) {
  prodEditing = p ? p.id : 'new';
  view.innerHTML = productFormHTML(p);
  syncProductForm();
  window.scrollTo(0, 0);
}

function renderPreview(input) {
  const box = document.getElementById('pfPreview');
  box.innerHTML = '';
  [...input.files].forEach(file => {
    const img = document.createElement('img');
    img.className = 'thumb-img';
    img.alt = '';
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    box.appendChild(img);
  });
}

view.addEventListener('click', async e => {
  const b = e.target.closest('[data-act^="prod-"]');
  if (!b) return;
  const row = b.closest('.prow');
  const p = row ? allProducts.find(x => x.id === row.dataset.id) : null;
  try {
    switch (b.dataset.act) {
      case 'prod-new': prodKeep = null; openProductForm(null); break;
      case 'prod-edit': if (p) openProductForm(p); break;
      case 'prod-cancel': prodKeep = null; await showProducts(); break;
      case 'prod-toggle':
        await api('/api/admin/products/' + p.id, { method: 'PATCH', body: JSON.stringify({ active: !p.active }) });
        await showProducts();
        break;
      case 'prod-delete':
        if (!confirm(`متأكد إنك عايز تحذف "${p.name.ar}"؟`)) return;
        await api('/api/admin/products/' + p.id, { method: 'DELETE' });
        await showProducts();
        break;
    }
  } catch { alert('حصل خطأ، جرّب تاني.'); }
});

view.addEventListener('input', e => {
  if (e.target.id === 'prodSearch') { prodQuery = e.target.value; renderProdItems(); }
  else if (e.target.form && e.target.form.id === 'productForm') syncProductForm();
});

view.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'prodCatSel') { prodCatFilter = el.value; renderProdItems(); }
  else if (el.id === 'pfCat') {
    const f = el.form;
    f.elements.sub.innerHTML = subOptions(el.value, '');
    f.elements.type.value = el.value === 'ceramic' ? 'tile' : 'item';
    syncProductForm();
  } else if (el.name === 'type' && el.form && el.form.id === 'productForm') syncProductForm();
  else if (el.id === 'pfFiles') renderPreview(el);
});

view.addEventListener('submit', async e => {
  if (e.target.id !== 'productForm') return;
  e.preventDefault();
  const f = e.target, el = f.elements;
  const msg = document.getElementById('pMsg');
  const show = text => { msg.textContent = text; msg.className = 'form-msg'; msg.hidden = false; msg.scrollIntoView({ block: 'center' }); };
  const again = !!(e.submitter && e.submitter.dataset.again);
  const tile = el.type.value === 'tile';

  if (!el.cat.value) return show('اختر القسم.');
  if (el.name_ar.value.trim().length < 2) return show('اكتب اسم المنتج بالعربي.');
  if (!el.brand.value.trim()) return show('اكتب الماركة.');
  if (!(parseFloat(toLatin(el.price.value).replace(',', '.')) > 0)) return show('اكتب السعر.');
  if (el.stock.value.trim() === '') return show('اكتب المخزون (ممكن يكون 0).');
  if (tile) {
    if (!/^\d{1,3}(\.\d)?\s*[x×X*]\s*\d{1,3}(\.\d)?$/.test(toLatin(el.size.value).trim())) return show('اكتب المقاس زي 60×120.');
    if (!(parseFloat(toLatin(el.perBox.value).replace(',', '.')) > 0)) return show('اكتب الكرتونة بتغطي كام متر مربع (مثال 1.44).');
  }

  const files = [...el.images.files];
  if (files.some(x => x.size > 2 * 1024 * 1024)) return show('حجم الصورة لازم يكون أقل من 2 ميجابايت.');
  const existing = f.querySelectorAll('input[name="removeImages"]').length;
  const removing = f.querySelectorAll('input[name="removeImages"]:checked').length;
  if (existing - removing + files.length > 5) return show('الحد الأقصى 5 صور للمنتج.');

  const fd = new FormData(f);
  fd.set('active', el.active.checked ? 'true' : 'false');
  const isNew = prodEditing === 'new';
  const buttons = f.querySelectorAll('button[type=submit]');
  buttons.forEach(x => { x.disabled = true; });
  try {
    const r = await fetch(isNew ? '/api/admin/products' : '/api/admin/products/' + prodEditing, { method: isNew ? 'POST' : 'PUT', body: fd });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'error');
    prodFlash = 'تم حفظ المنتج ✓';
    if (again) {
      prodKeep = { cat: el.cat.value, sub: el.sub.value, brand: el.brand.value.trim(), type: el.type.value, use: el.use.value };
      await loadProducts();
      openProductForm(null);
    } else {
      prodKeep = null;
      await showProducts();
    }
  } catch (err) {
    show({
      invalid_name: 'اكتب اسم المنتج بالعربي.', invalid_brand: 'اكتب الماركة.', invalid_category: 'اختر القسم.',
      invalid_price: 'اكتب سعراً صحيحاً.', invalid_stock: 'المخزون لازم يكون رقم صحيح.',
      invalid_size: 'المقاس غير صحيح، اكتبه زي 60×120.', invalid_finish: 'اختر التشطيب.',
      invalid_perbox: 'اكتب الكرتونة بتغطي كام متر مربع (مثال 1.44).',
      bad_image: 'الصورة لازم تكون JPG أو PNG أو WebP.', file_too_large: 'حجم الصورة لازم يكون أقل من 2 ميجابايت.',
      too_many_images: 'الحد الأقصى 5 صور للمنتج.', upload_failed: 'تعذر رفع الصور، جرّب تاني.',
      not_found: 'المنتج ده اتحذف.'
    }[err.message] || 'حصل خطأ، جرّب تاني.');
    buttons.forEach(x => { x.disabled = false; });
  }
});

/* ---------- البداية: التأكد إنه أدمن ---------- */
(async function init() {
  try {
    const { user } = await api('/api/me');
    if (user.role !== 'admin') {
      document.querySelector('.admin__wrap').innerHTML = '<div class="empty">مفيش عندك صلاحية لدخول لوحة التحكم.</div>';
      return;
    }
  } catch {
    location.href = '/login.html';
    return;
  }
  openTab('overview');
})();