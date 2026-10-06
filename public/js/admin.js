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
const tabs = { overview: showOverview, messages: showMessages, users: showUsers, settings: showSettings };
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