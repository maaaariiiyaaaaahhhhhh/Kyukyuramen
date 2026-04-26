/**
 * admin.js — UPDATED
 *
 * Changes from original:
 *   + Menu modal: imageUrl input field for food photos
 *   + renderMenuTable() shows image preview thumbnail
 *   + saveMenuItem() passes imageUrl to API
 *   + Menu GET uses ?all=true to fetch unavailable items too
 *
 * All other logic (navigation, orders, customers, kanban) is unchanged.
 */

const ADMIN_API = 'http://localhost:5000/api';

requireAdmin();

const dateEl = document.getElementById('admin-date');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

const STATUS_LABELS = {
  new:        { label: 'New',        cls: 'badge-new' },
  preparing:  { label: 'Preparing',  cls: 'badge-prep' },
  delivering: { label: 'Delivering', cls: 'badge-deliver' },
  done:       { label: 'Done',       cls: 'badge-done' },
  cancelled:  { label: 'Cancelled',  cls: 'badge-done' },
};

const STATUS_NEXT = { new: 'preparing', preparing: 'delivering', delivering: 'done' };

let ALL_ORDERS   = [];
let ALL_MENU     = [];
let ORDER_FILTER = 'all';

// ── Navigation ────────────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.admin-page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.side-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + pageId).style.display = 'block';
  document.querySelector('[data-page="' + pageId + '"]').classList.add('active');

  if (pageId === 'dashboard')  fetchOrders();
  if (pageId === 'orders')     renderAllOrdersTable();
  if (pageId === 'menu-items') fetchMenuItems();
  if (pageId === 'customers')  fetchCustomers();
}

document.querySelectorAll('.side-nav-item').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    showPage(this.dataset.page);
  });
});

// ── Orders ────────────────────────────────────────────────────
async function fetchOrders() {
  const token = getToken();
  try {
    const res  = await fetch(ADMIN_API + '/orders?limit=100', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    ALL_ORDERS = data.orders || [];
    renderStats();
    renderKanban();
    renderTable();
    renderAllOrdersTable();
  } catch (err) { console.error('Failed to fetch orders:', err); }
}

function renderStats() {
  const today       = new Date().toDateString();
  const todayOrders = ALL_ORDERS.filter(o => new Date(o.createdAt).toDateString() === today);
  const revenue     = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const pending     = ALL_ORDERS.filter(o => ['new','preparing','delivering'].includes(o.status)).length;

  const g = id => document.getElementById(id);
  if (g('stat-orders'))  g('stat-orders').textContent  = todayOrders.length;
  if (g('stat-revenue')) g('stat-revenue').textContent = '₱' + revenue.toLocaleString();
  if (g('stat-pending')) g('stat-pending').textContent = pending;
  if (g('stat-total'))   g('stat-total').textContent   = ALL_ORDERS.length;

  const user  = typeof getUser === 'function' ? getUser() : null;
  const nameEl = document.getElementById('admin-username');
  if (nameEl && user) nameEl.textContent = user.name.split(' ')[0];
}

function renderKanban() {
  const groups = { new: [], preparing: [], delivering: [], done: [] };
  ALL_ORDERS.forEach(o => { if (groups[o.status]) groups[o.status].push(o); });

  const countMap  = { new:'count-new', preparing:'count-prep', delivering:'count-deliver', done:'count-done' };
  Object.entries(countMap).forEach(([s, id]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = groups[s].length;
  });

  const kanbanMap = { new:'orders-new', preparing:'orders-prep', delivering:'orders-deliver', done:'orders-done' };
  Object.entries(kanbanMap).forEach(([status, elId]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const orders = groups[status].slice(0, 5);
    if (!orders.length) {
      el.innerHTML = '<div style="padding:12px;font-size:12px;color:rgba(56,0,0,0.4);text-align:center;">No orders</div>';
      return;
    }
    el.innerHTML = orders.map(o => {
      const customer   = (o.customer && o.customer.name) || o.guestName || 'Guest';
      const itemList   = o.items.map(i => i.name + ' x' + i.quantity).join(', ');
      const nextStatus = STATUS_NEXT[o.status];
      return '<div class="kanban-order-item">' +
        '<div class="ko-id">#KYU-' + o._id.slice(-4).toUpperCase() + '</div>' +
        '<div class="ko-customer">' + customer + '</div>' +
        '<div class="ko-items">' + itemList + '</div>' +
        '<div class="ko-total">₱' + o.total + '</div>' +
        '<div class="ko-time">' + formatTimeAgo(o.createdAt) + '</div>' +
        (nextStatus ? '<button onclick="updateStatus(\'' + o._id + '\',\'' + nextStatus + '\')" ' +
          'style="margin-top:6px;width:100%;padding:4px;background:var(--accent);color:#fff;border:none;' +
          'border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Mark ' + nextStatus + '</button>' : '') +
        '</div>';
    }).join('');
  });
}

function renderTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  if (!ALL_ORDERS.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:rgba(56,0,0,0.4);">No orders yet</td></tr>';
    return;
  }
  tbody.innerHTML = ALL_ORDERS.slice(0, 20).map(o => orderRow(o)).join('');
}

function filterOrders(status, btn) {
  ORDER_FILTER = status;
  document.querySelectorAll('#page-orders .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAllOrdersTable();
}

function renderAllOrdersTable() {
  const tbody    = document.getElementById('all-orders-table-body');
  if (!tbody) return;
  const filtered = ORDER_FILTER === 'all' ? ALL_ORDERS : ALL_ORDERS.filter(o => o.status === ORDER_FILTER);
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:rgba(56,0,0,0.4);">No orders</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(o => {
    const s        = STATUS_LABELS[o.status] || STATUS_LABELS.new;
    const customer = (o.customer && o.customer.name) || o.guestName || 'Guest';
    const phone    = o.guestPhone || (o.customer && o.customer.phone) || '—';
    const address  = o.deliveryAddress || '—';
    const itemList = o.items.map(i => i.name + ' x' + i.quantity).join(', ');
    const next     = STATUS_NEXT[o.status];
    return '<tr>' +
      '<td class="order-id-cell">#KYU-' + o._id.slice(-4).toUpperCase() + '</td>' +
      '<td>' + customer + '</td>' +
      '<td>' + phone + '</td>' +
      '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + address + '">' + address + '</td>' +
      '<td class="items-cell" title="' + itemList + '">' + itemList + '</td>' +
      '<td><strong>₱' + o.total + '</strong></td>' +
      '<td><span class="status-badge ' + s.cls + '">' + s.label + '</span></td>' +
      '<td class="time-cell">' + formatTimeAgo(o.createdAt) + '</td>' +
      '<td><div class="action-btns">' +
        (next ? '<button class="action-btn edit-btn" title="Advance" onclick="updateStatus(\'' + o._id + '\',\'' + next + '\')"><i class="bi bi-arrow-right-circle-fill"></i></button>' : '') +
        (o.status !== 'cancelled' && o.status !== 'done' ? '<button class="action-btn" title="Cancel" onclick="updateStatus(\'' + o._id + '\',\'cancelled\')" style="background:rgba(171,0,0,0.1);color:var(--accent);width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;"><i class="bi bi-x-circle-fill"></i></button>' : '') +
      '</div></td></tr>';
  }).join('');
}

function orderRow(o) {
  const s        = STATUS_LABELS[o.status] || STATUS_LABELS.new;
  const customer = (o.customer && o.customer.name) || o.guestName || 'Guest';
  const itemList = o.items.map(i => i.name + ' x' + i.quantity).join(', ');
  const next     = STATUS_NEXT[o.status];
  return '<tr>' +
    '<td class="order-id-cell">#KYU-' + o._id.slice(-4).toUpperCase() + '</td>' +
    '<td>' + customer + '</td>' +
    '<td class="items-cell" title="' + itemList + '">' + itemList + '</td>' +
    '<td><strong>₱' + o.total + '</strong></td>' +
    '<td><span class="status-badge ' + s.cls + '">' + s.label + '</span></td>' +
    '<td class="time-cell">' + formatTimeAgo(o.createdAt) + '</td>' +
    '<td><div class="action-btns">' +
      (next ? '<button class="action-btn edit-btn" title="Advance" onclick="updateStatus(\'' + o._id + '\',\'' + next + '\')"><i class="bi bi-arrow-right-circle-fill"></i></button>' : '') +
    '</div></td></tr>';
}

async function updateStatus(orderId, newStatus) {
  const token = getToken();
  try {
    const res = await fetch(ADMIN_API + '/orders/' + orderId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchOrders();
  } catch (err) { console.error('Error updating status:', err); }
}

// ── ▼ UPDATED: Menu Items (with image support) ────────────────
async function fetchMenuItems() {
  const token = getToken();
  try {
    // Use ?all=true to see unavailable items too
    const res  = await fetch(ADMIN_API + '/menu?all=true', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    ALL_MENU   = data.items || [];
    renderMenuTable();
  } catch (err) { console.error('Failed to fetch menu:', err); }
}

function renderMenuTable() {
  const tbody = document.getElementById('menu-items-table-body');
  if (!tbody) return;
  if (!ALL_MENU.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:rgba(56,0,0,0.4);">No menu items</td></tr>';
    return;
  }
  tbody.innerHTML = ALL_MENU.map(item => {
    // ▼ NEW: show thumbnail if imageUrl exists, else emoji
    const imgCell = item.imageUrl
      ? `<img src="${item.imageUrl}" alt="${item.name}"
           style="width:44px;height:44px;object-fit:cover;border-radius:10px;"
           onerror="this.outerHTML='<span style=\\"font-size:28px;\\">${item.emoji || '🍜'}</span>'">`
      : `<span style="font-size:28px;">${item.emoji || '🍜'}</span>`;

    return '<tr>' +
      '<td>' + imgCell + '</td>' +
      '<td><strong>' + item.name + '</strong></td>' +
      '<td>' + item.category + '</td>' +
      '<td><strong style="color:var(--accent);">₱' + item.price + '</strong></td>' +
      '<td>' + (item.isAvailable
        ? '<span class="status-badge badge-done">Yes</span>'
        : '<span class="status-badge badge-done" style="background:rgba(171,0,0,0.1);color:var(--accent);">No</span>') + '</td>' +
      '<td><div class="action-btns">' +
        '<button class="action-btn edit-btn" onclick="openMenuItemModal(\'' + item._id + '\')" title="Edit"><i class="bi bi-pencil-fill"></i></button>' +
        '<button class="action-btn" onclick="deleteMenuItem(\'' + item._id + '\')" title="Delete" style="background:rgba(171,0,0,0.1);color:var(--accent);width:28px;height:28px;border:none;border-radius:6px;cursor:pointer;"><i class="bi bi-trash-fill"></i></button>' +
      '</div></td></tr>';
  }).join('');
}

function openMenuItemModal(itemId) {
  const modal = document.getElementById('menu-item-modal');
  modal.style.display = 'flex';
  document.getElementById('mi-error').style.display = 'none';

  if (itemId) {
    const item = ALL_MENU.find(m => m._id === itemId);
    if (!item) return;
    document.getElementById('menu-modal-title').textContent = 'Edit Menu Item';
    document.getElementById('mi-id').value           = item._id;
    document.getElementById('mi-name').value         = item.name;
    document.getElementById('mi-emoji').value        = item.emoji || '';
    document.getElementById('mi-price').value        = item.price;
    document.getElementById('mi-category').value     = item.category;
    document.getElementById('mi-desc').value         = item.description || '';
    document.getElementById('mi-imageurl').value     = item.imageUrl || '';  // ▼ NEW
    document.getElementById('mi-available').checked  = item.isAvailable;
    updateImagePreview(item.imageUrl);
  } else {
    document.getElementById('menu-modal-title').textContent = 'Add Menu Item';
    document.getElementById('mi-id').value           = '';
    document.getElementById('mi-name').value         = '';
    document.getElementById('mi-emoji').value        = '';
    document.getElementById('mi-price').value        = 99;
    document.getElementById('mi-category').value     = 'ramen';
    document.getElementById('mi-desc').value         = '';
    document.getElementById('mi-imageurl').value     = '';  // ▼ NEW
    document.getElementById('mi-available').checked  = true;
    updateImagePreview('');
  }
}

// ▼ NEW: live image preview in modal
function updateImagePreview(url) {
  const preview = document.getElementById('mi-img-preview');
  if (!preview) return;
  if (url) {
    preview.innerHTML = `<img src="${url}" alt="Preview"
      style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:2px solid rgba(56,0,0,0.1);"
      onerror="this.parentElement.innerHTML='<span style=\\"font-size:11px;color:#ab0000;\\">Invalid image URL</span>'">`;
  } else {
    preview.innerHTML = '';
  }
}

function closeMenuItemModal() {
  document.getElementById('menu-item-modal').style.display = 'none';
}

async function saveMenuItem() {
  const token  = getToken();
  const id     = document.getElementById('mi-id').value;
  const errEl  = document.getElementById('mi-error');
  const btn    = document.getElementById('mi-submit-btn');
  errEl.style.display = 'none';

  const body = {
    name:        document.getElementById('mi-name').value.trim(),
    emoji:       document.getElementById('mi-emoji').value.trim(),
    price:       parseInt(document.getElementById('mi-price').value),
    category:    document.getElementById('mi-category').value,
    description: document.getElementById('mi-desc').value.trim(),
    isAvailable: document.getElementById('mi-available').checked,
    imageUrl:    document.getElementById('mi-imageurl').value.trim() || null,  // ▼ NEW
  };

  if (!body.name || !body.price) {
    errEl.textContent   = 'Name and price are required.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Saving…';

  try {
    const url    = id ? ADMIN_API + '/menu/' + id : ADMIN_API + '/menu';
    const method = id ? 'PATCH' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body:    JSON.stringify(body),
    });
    if (res.ok) {
      closeMenuItemModal();
      fetchMenuItems();
    } else {
      const data          = await res.json();
      errEl.textContent   = data.message || 'Save failed.';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent   = 'Network error.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Save Item';
  }
}

async function deleteMenuItem(itemId) {
  if (!confirm('Delete this menu item?')) return;
  const token = getToken();
  try {
    await fetch(ADMIN_API + '/menu/' + itemId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });
    fetchMenuItems();
  } catch (err) { console.error(err); }
}

// ── Customers ─────────────────────────────────────────────────
async function fetchCustomers() {
  const token = getToken();
  try {
    const res  = await fetch(ADMIN_API + '/auth/users', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('No users endpoint');
    const data = await res.json();
    renderCustomers(data.users || data || []);
  } catch {
    const tbody = document.getElementById('customers-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:32px;color:rgba(56,0,0,0.4);">Customers endpoint not available yet.</td></tr>';
  }
}

function renderCustomers(users) {
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:32px;color:rgba(56,0,0,0.4);">No customers yet</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => {
    return '<tr>' +
      '<td><strong>' + u.name + '</strong></td>' +
      '<td>' + u.email + '</td>' +
      '<td><span class="status-badge ' + (u.role === 'admin' ? 'badge-deliver' : 'badge-new') + '">' + u.role + '</span></td>' +
      '<td class="time-cell">' + new Date(u.createdAt).toLocaleDateString('en-PH') + '</td>' +
      '</tr>';
  }).join('');
}

// ── Helpers ───────────────────────────────────────────────────
function formatTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return diff + 's ago';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return new Date(dateStr).toLocaleDateString('en-PH');
}

// ── Init ──────────────────────────────────────────────────────
fetchOrders();
setInterval(fetchOrders, 30000);