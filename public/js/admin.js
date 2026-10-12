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
  view.innerHTML = `
    <div class="stats">
      <div class="stat"><strong>${s.users}</strong><span>مستخدم مسجل</span></div>
      <div class="stat"><strong>${s.messages}</strong><span>رسالة اتصل بنا</span></div>
      <div class="stat"><strong>${s.unread}</strong><span>رسالة غير مقروءة</span></div>
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
const tabs = { overview: showOverview, messages: showMessages, users: showUsers, banners: showBanners, settings: showSettings };
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
          <span>صورة الكمبيوتر (1920×430)${isNew ? ' - مطلوبة' : ''}</span>
          ${b.desktop ? `<img class="thumb" src="${esc(b.desktop)}" alt="">` : ''}
          <input type="file" name="desktop" accept="image/jpeg,image/png,image/webp" data-ratio="4.465">
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