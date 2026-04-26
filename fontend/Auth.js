/**
 * auth.js — UPDATED
 *
 * Changes:
 *   + showToast() reusable toast (login/logout messages)
 *   + handleLogin()  fires "Successfully logged in, enjoy our ramen!" toast
 *   + handleLogout() fires "Thank you for ordering, come again!" toast
 *   + User dropdown: "My Orders" link added
 *   + injectMyOrdersModal() — My Orders component with Cancel button (pending only)
 */

const API_BASE = 'http://localhost:5000/api';

// ── Token helpers ─────────────────────────────────────────────
function getToken()  { return localStorage.getItem('kyu_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('kyu_user')); } catch { return null; } }
function saveSession(token, user) {
  localStorage.setItem('kyu_token', token);
  localStorage.setItem('kyu_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('kyu_token');
  localStorage.removeItem('kyu_user');
}
function isLoggedIn() { return !!getToken(); }
function isAdmin()    { return getUser()?.role === 'admin'; }

// ── ▼ NEW: Reusable toast ─────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.getElementById('kyu-toast');
  if (existing) existing.remove();

  const bgMap = { success: '#380000', error: '#ab0000', info: '#1a6b3c' };
  const toast       = document.createElement('div');
  toast.id          = 'kyu-toast';
  toast.style.cssText = `
    position:fixed;bottom:32px;left:50%;
    transform:translateX(-50%) translateY(20px);
    background:${bgMap[type] || bgMap.success};color:#fff;
    padding:14px 28px;border-radius:99px;font-family:var(--font, 'Poppins', sans-serif);
    font-weight:700;font-size:14px;z-index:99999;
    box-shadow:0 8px 32px rgba(0,0,0,0.22);
    display:flex;align-items:center;gap:10px;
    opacity:0;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);`;
  toast.innerHTML = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity   = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ── Update header auth button ─────────────────────────────────
function refreshAuthUI() {
  const btn = document.getElementById('user-auth-btn');
  if (!btn) return;
  if (isLoggedIn()) {
    const user    = getUser();
    btn.innerHTML = `<i class="bi bi-person-circle"></i>`;
    btn.title     = `Logged in as ${user.name}`;
    btn.classList.add('logged-in');
  } else {
    btn.innerHTML = `<i class="bi bi-person"></i>`;
    btn.title     = 'Login / Sign Up';
    btn.classList.remove('logged-in');
  }
}

// ── Modal open/close ──────────────────────────────────────────
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('modal-open');
  switchTab(tab);
  document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('modal-open');
  document.body.style.overflow = '';
  clearAuthErrors();
}
function switchTab(tab) {
  document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('login-form').style.display  = tab === 'login'  ? 'flex' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'flex' : 'none';
}
function clearAuthErrors() {
  document.querySelectorAll('.auth-error').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
}
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg; el.style.display = 'block';
}

// ── Login ─────────────────────────────────────────────────────
async function handleLogin() {
  clearAuthErrors();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showError('login-error', 'Please fill in all fields.');

  const btn = document.getElementById('login-submit-btn');
  btn.disabled = true; btn.textContent = 'Signing in…';

  try {
    const res  = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return showError('login-error', data.message || 'Login failed.');

    saveSession(data.token, data.user);
    closeAuthModal();
    refreshAuthUI();

    // ▼ NEW: login toast
    showToast(`<span style="font-size:18px;">🍜</span> Successfully logged in, enjoy our ramen!`);

    if (data.user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      if (window.location.pathname.includes('admin')) window.location.href = 'index.html';
    }
  } catch {
    showError('login-error', 'Network error. Please try again.');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

// ── Signup ─────────────────────────────────────────────────────
async function handleSignup() {
  clearAuthErrors();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;

  if (!name || !email || !password) return showError('signup-error', 'Please fill in all fields.');
  if (password !== confirm)         return showError('signup-error', 'Passwords do not match.');
  if (password.length < 6)         return showError('signup-error', 'Password must be at least 6 characters.');

  const btn = document.getElementById('signup-submit-btn');
  btn.disabled = true; btn.textContent = 'Creating account…';

  try {
    const res  = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) return showError('signup-error', data.message || 'Signup failed.');

    saveSession(data.token, data.user);
    closeAuthModal();
    refreshAuthUI();
    showToast(`<span style="font-size:18px;">🍜</span> Welcome to KyuKyu Ramen 99, ${name.split(' ')[0]}!`);
    window.location.href = data.redirect || 'index.html';
  } catch {
    showError('signup-error', 'Network error. Please try again.');
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

// ── Logout ─────────────────────────────────────────────────────
function handleLogout() {
  clearSession();
  refreshAuthUI();
  // ▼ NEW: logout toast
  showToast(`<span style="font-size:18px;">👋</span> Thank you for ordering, come again!`);
  if (window.location.pathname.includes('admin')) window.location.href = 'index.html';
}

// ── Admin guard ────────────────────────────────────────────────
function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) window.location.href = 'index.html';
}

// ── ▼ NEW: My Orders modal ────────────────────────────────────
const STATUS_DISPLAY = {
  new:        { label: 'Pending',    color: '#e05c00', bg: 'rgba(224,92,0,0.1)' },
  preparing:  { label: 'Preparing',  color: '#1a6b3c', bg: 'rgba(26,107,60,0.1)' },
  delivering: { label: 'Delivering', color: '#0066cc', bg: 'rgba(0,102,204,0.1)' },
  done:       { label: 'Delivered',  color: '#380000', bg: 'rgba(56,0,0,0.1)' },
  cancelled:  { label: 'Cancelled',  color: '#ab0000', bg: 'rgba(171,0,0,0.1)' },
};

function injectMyOrdersModal() {
  if (document.getElementById('my-orders-modal')) return;

  const modal       = document.createElement('div');
  modal.id          = 'my-orders-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
    z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;
    opacity:0;pointer-events:none;transition:opacity 0.25s ease;`;

  modal.innerHTML = `
    <div style="background:var(--bg, #fff8f5);border-radius:24px;padding:0;width:100%;max-width:580px;
      position:relative;box-shadow:0 24px 80px rgba(56,0,0,0.25);display:flex;flex-direction:column;
      max-height:85vh;overflow:hidden;">

      <!-- Header -->
      <div style="padding:28px 32px 20px;border-bottom:1px solid rgba(56,0,0,0.08);display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:17px;font-weight:800;color:var(--black,#380000);">My Orders</div>
          <div style="font-size:12px;color:rgba(56,0,0,0.5);margin-top:2px;">Your recent order history</div>
        </div>
        <button onclick="closeMyOrders()" style="width:32px;height:32px;background:rgba(56,0,0,0.06);
          border:none;border-radius:8px;cursor:pointer;font-size:16px;color:var(--brand,#380000);">✕</button>
      </div>

      <!-- Body -->
      <div id="my-orders-body" style="overflow-y:auto;padding:20px 32px;display:flex;flex-direction:column;gap:12px;">
        <div style="text-align:center;padding:40px;color:rgba(56,0,0,0.4);font-size:14px;">Loading your orders…</div>
      </div>
    </div>`;

  modal.addEventListener('click', e => { if (e.target === modal) closeMyOrders(); });
  document.body.appendChild(modal);
}

async function openMyOrders() {
  if (!isLoggedIn()) { openAuthModal('login'); return; }
  injectMyOrdersModal();

  const modal = document.getElementById('my-orders-modal');
  modal.style.opacity = '1'; modal.style.pointerEvents = 'all';
  document.body.style.overflow = 'hidden';

  await loadMyOrders();
}

function closeMyOrders() {
  const modal = document.getElementById('my-orders-modal');
  if (!modal) return;
  modal.style.opacity = '0'; modal.style.pointerEvents = 'none';
  document.body.style.overflow = '';
}

async function loadMyOrders() {
  const body  = document.getElementById('my-orders-body');
  if (!body) return;
  body.innerHTML = `<div style="text-align:center;padding:40px;color:rgba(56,0,0,0.4);">Loading…</div>`;

  try {
    const res  = await fetch(`${API_BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed');
    const orders = await res.json();

    if (!orders.length) {
      body.innerHTML = `
        <div style="text-align:center;padding:48px 20px;">
          <div style="font-size:48px;margin-bottom:12px;">🍜</div>
          <div style="font-weight:700;color:var(--black,#380000);">No orders yet</div>
          <div style="font-size:13px;color:rgba(56,0,0,0.5);margin-top:6px;">Your order history will appear here.</div>
        </div>`;
      return;
    }

    body.innerHTML = orders.map(order => {
      const s        = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.new;
      const itemList = order.items.map(i => `${i.emoji || ''} ${i.name} x${i.quantity}`).join(' · ');
      const date     = new Date(order.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      // ▼ NEW: Cancel button only if status === 'new' (pending)
      const cancelBtn = order.status === 'new'
        ? `<button onclick="cancelOrder('${order._id}')"
             style="font-size:11px;font-weight:700;color:#ab0000;background:rgba(171,0,0,0.08);
             border:1px solid rgba(171,0,0,0.15);border-radius:6px;padding:4px 10px;cursor:pointer;
             margin-top:8px;transition:background 0.15s;">
             Cancel Order
           </button>`
        : '';

      return `
        <div id="order-card-${order._id}" style="background:var(--card-bg, #fff1eb);border-radius:14px;
          padding:16px 18px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:13px;font-weight:800;color:var(--black,#380000);">
              #KYU-${order._id.slice(-4).toUpperCase()}
            </div>
            <span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;
              background:${s.bg};color:${s.color};">${s.label}</span>
          </div>
          <div style="font-size:12px;color:rgba(56,0,0,0.6);line-height:1.5;">${itemList}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:13px;font-weight:800;color:var(--accent,#ab0000);">
              ₱${order.total}
            </div>
            <div style="font-size:11px;color:rgba(56,0,0,0.4);">${date}</div>
          </div>
          ${cancelBtn}
        </div>`;
    }).join('');
  } catch {
    body.innerHTML = `<div style="text-align:center;padding:40px;color:#ab0000;">Could not load orders. Please try again.</div>`;
  }
}

// ── ▼ NEW: Cancel order (only if pending/new) ─────────────────
async function cancelOrder(orderId) {
  if (!confirm('Cancel this order?')) return;
  try {
    const res  = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(`<span>⚠️</span> ${data.message}`, 'error');
      return;
    }
    showToast('<span>✅</span> Order cancelled.');
    // Reload order list to reflect new status
    await loadMyOrders();
  } catch {
    showToast('<span>⚠️</span> Network error. Please try again.', 'error');
  }
}

// ── ▼ UPDATED: User dropdown with My Orders link ─────────────
function initAuthButton() {
  const btn = document.getElementById('user-auth-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (isLoggedIn()) {
      const existing = document.getElementById('user-dropdown');
      if (existing) { existing.remove(); return; }

      const user     = getUser();
      const dropdown = document.createElement('div');
      dropdown.id    = 'user-dropdown';
      dropdown.className = 'user-dropdown';
      dropdown.innerHTML = `
        <div class="ud-name">${user.name}</div>
        <div class="ud-role">${user.role === 'admin' ? '⚙️ Admin' : '👤 Customer'}</div>
        ${user.role === 'admin' ? '<a href="admin.html" class="ud-item"><i class="bi bi-speedometer2"></i> Dashboard</a>' : ''}
        <button class="ud-item" onclick="dropdown.remove();openMyOrders();" style="width:100%;text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;">
          <i class="bi bi-bag-fill"></i> My Orders
        </button>
        <button class="ud-item ud-logout" onclick="handleLogout()">
          <i class="bi bi-box-arrow-right"></i> Logout
        </button>`;

      // Fix onclick closure
      dropdown.querySelector('[onclick*="openMyOrders"]').onclick = () => {
        dropdown.remove();
        openMyOrders();
      };

      btn.parentElement.style.position = 'relative';
      btn.parentElement.appendChild(dropdown);

      setTimeout(() => {
        document.addEventListener('click', function closeDD(e) {
          if (!dropdown.contains(e.target) && e.target !== btn) {
            dropdown.remove();
            document.removeEventListener('click', closeDD);
          }
        });
      }, 0);
    } else {
      openAuthModal('login');
    }
  });
}

// ── Inject auth modal HTML ─────────────────────────────────────
function injectAuthModal() {
  if (document.getElementById('auth-modal')) return;
  const modal   = document.createElement('div');
  modal.id      = 'auth-modal';
  modal.className = 'auth-modal-overlay';
  modal.innerHTML = `
    <div class="auth-modal-card">
      <button class="auth-modal-close" onclick="closeAuthModal()"><i class="bi bi-x-lg"></i></button>
      <div class="auth-modal-brand">
        <div class="logo-mark sm">九九</div>
        <div class="logo-text">
          <span class="logo-main">KyuKyu</span>
          <span class="logo-sub">RAMEN 99</span>
        </div>
      </div>
      <div class="auth-tabs">
        <button class="auth-tab-btn active" data-tab="login"  onclick="switchTab('login')">Sign In</button>
        <button class="auth-tab-btn"        data-tab="signup" onclick="switchTab('signup')">Sign Up</button>
      </div>
      <div id="login-form" style="display:flex;flex-direction:column;gap:14px;">
        <div class="auth-field"><label>Email</label>
          <input id="login-email" type="email" class="auth-input" placeholder="you@email.com"/></div>
        <div class="auth-field"><label>Password</label>
          <input id="login-password" type="password" class="auth-input" placeholder="••••••••"/></div>
        <div id="login-error" class="auth-error" style="display:none;"></div>
        <button id="login-submit-btn" class="btn-primary-custom" onclick="handleLogin()">Sign In</button>
      </div>
      <div id="signup-form" style="display:none;flex-direction:column;gap:14px;">
        <div class="auth-field"><label>Full Name</label>
          <input id="signup-name" type="text" class="auth-input" placeholder="Juan dela Cruz"/></div>
        <div class="auth-field"><label>Email</label>
          <input id="signup-email" type="email" class="auth-input" placeholder="you@email.com"/></div>
        <div class="auth-field"><label>Password</label>
          <input id="signup-password" type="password" class="auth-input" placeholder="Min. 6 characters"/></div>
        <div class="auth-field"><label>Confirm Password</label>
          <input id="signup-confirm" type="password" class="auth-input" placeholder="Repeat password"/></div>
        <div id="signup-error" class="auth-error" style="display:none;"></div>
        <button id="signup-submit-btn" class="btn-primary-custom" onclick="handleSignup()">Create Account</button>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeAuthModal(); });
  document.body.appendChild(modal);
}

// ── Auto-init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectAuthModal();
  initAuthButton();
  refreshAuthUI();
});