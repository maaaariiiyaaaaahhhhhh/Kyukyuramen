const MENU_API = 'http://localhost:5000/api';

const STATIC_PRODUCTS = [
  { id: 'spicy-ichiban',   name: 'Spicy Ichiban',   imageUrl: 'images/spicy ichiban.png',   price: 99, cat: 'ramen',      tags: [],               desc: 'Bold, fiery broth with thick-cut chashu, soft egg, and a house chili paste.' },
  { id: 'kyu-kyu',         name: 'Kyu Kyu',         imageUrl: 'images/kyu kyu.png',         price: 99, cat: 'ramen',      tags: ['Most Ordered'], desc: 'Our signature bowl — deeply rich pork-chicken broth, noodles, nori, bamboo shoots, soft egg.' },
  { id: 'tonkotsu',        name: 'Tonkotsu',        imageUrl: 'images/tonkotsu.png',        price: 99, cat: 'ramen',      tags: [],               desc: '12-hour simmered pork bone broth, silky and opaque.' },
  { id: 'cheesy-tonkotsu', name: 'Cheesy Tonkotsu', imageUrl: 'images/cheesy tonkotsu.png', price: 99, cat: 'ramen',      tags: [],               desc: 'Classic tonkotsu elevated with a molten cheese sauce swirl.' },
  { id: 'ichiban',         name: 'Ichiban',         imageUrl: 'images/ichiban.png',         price: 99, cat: 'ramen',      tags: ['Most Ordered'], desc: 'Crowd-tested champion. Umami-forward broth with layered toppings.' },
  { id: 'tantanmen',       name: 'Tantanmen',       imageUrl: 'images/tantanmen.png',       price: 99, cat: 'ramen',      tags: [],               desc: 'Sesame-rich dandan-style broth, spiced minced pork, bok choy, chili threads.' },
  { id: 'chashu-don',      name: 'Chashu Don',      imageUrl: 'images/chashu don.png',      price: 99, cat: 'rice_bowls', tags: [],               desc: 'Steamed Japanese rice topped with thick chashu slices, tare sauce, soft egg.' },
  { id: 'gyudon',          name: 'Gyudon',          imageUrl: 'images/gyudon.png',          price: 99, cat: 'rice_bowls', tags: [],               desc: 'Thinly sliced seasoned beef and caramelised onions over fluffy rice.' },
  { id: 'gyoza',           name: 'Gyoza',           imageUrl: 'images/gyoza.png',           price: 79, cat: 'side_dish',  tags: ['Most Ordered'], desc: 'Pan-fried pork and cabbage dumplings — crispy bottom, juicy inside.' },
  { id: 'red-iced-tea',    name: 'Red Iced Tea',    imageUrl: 'images/red iced tea.png',    price: 49, cat: 'drinks',     tags: [],               desc: 'Chilled house-brewed hibiscus-black tea blend.' },
];

const CATEGORIES = [
  { key: 'all',        label: 'All' },
  { key: 'ramen',      label: 'Ramen' },
  { key: 'rice_bowls', label: 'Rice Bowls' },
  { key: 'side_dish',  label: 'Side Dish' },
  { key: 'drinks',     label: 'Drinks' },
];

let PRODUCTS       = [];
let activeCategory = 'all';
let cartOpen       = false;

// ── Load products ─────────────────────────────────────────────
async function loadProducts() {
  try {
    const res  = await fetch(`${MENU_API}/menu`);
    const data = await res.json();
    PRODUCTS   = data.items.map(item => ({
      id:          item._id,
      name:        item.name,
      imageUrl:    item.imageUrl || null,
      price:       item.price,
      cat:         item.category,
      tags:        item.tags || [],
      desc:        item.description || '',
      isAvailable: item.isAvailable,
    }));
  } catch {
    PRODUCTS = STATIC_PRODUCTS;
  }
  renderMenuGrid(activeCategory);
  updateCartBadge();
  if (getCart().length > 0) renderSidebar();

  // ← ADD THIS BLOCK:
  if (window.location.hash === '#cart-open') {
    renderSidebar();
    openSidebar();
    history.replaceState(null, '', window.location.pathname);
  }
}

// ── Build category filter bar ─────────────────────────────────
function buildFilterBar() {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;
  bar.innerHTML = CATEGORIES.map(c =>
    `<button class="filter-btn${c.key === 'all' ? ' active' : ''}" data-cat="${c.key}">${c.label}</button>`
  ).join('');
  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      activeCategory = this.dataset.cat;
      renderMenuGrid(activeCategory);
    });
  });
}

// ── Render menu grid ──────────────────────────────────────────
function renderMenuGrid(cat) {
  const grid     = document.getElementById('menu-grid');
  const filtered = cat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === cat);

  if (!filtered.length) {
    grid.innerHTML = '<div class="menu-empty">No items in this category yet.</div>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const unavailable = p.isAvailable === false;

    const badgesHtml = p.tags.length
      ? p.tags.map(t => `<div class="menu-badge">${t}</div>`).join('')
      : '';

    const mediaHtml = `
      <div class="menu-card-img-wrap">
        <img
          src="${p.imageUrl || ''}"
          alt="${p.name}"
          class="menu-card-img${unavailable ? ' img-grayscale' : ''}"
          loading="lazy"
          onerror="this.style.display='none';this.parentElement.classList.add('img-missing')"
        />
      </div>`;

    const stampHtml = unavailable
      ? `<div class="unavailable-stamp-overlay"><span>NOT AVAILABLE</span></div>`
      : '';

    return `
      <div class="menu-card${unavailable ? ' menu-card-unavailable' : ''}" data-id="${p.id}">
        ${badgesHtml}
        ${mediaHtml}
        ${stampHtml}
        <div class="menu-card-body">
          <h4 class="menu-card-name">${p.name}</h4>
          <p class="menu-card-desc">${p.desc}</p>
          <div class="menu-card-footer">
            <span class="menu-card-price">₱${p.price}</span>
            ${unavailable
              ? `<button class="add-to-cart-btn unavailable-btn" disabled>Unavailable</button>`
              : `<button class="add-to-cart-btn"
                  data-id="${p.id}"
                  data-name="${p.name}"
                  data-price="${p.price}"
                  data-cat="${p.cat}"
                  data-img="${p.imageUrl || ''}">+ Add to Cart
                </button>`
            }
          </div>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('.add-to-cart-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', function () {
      const { id, name, price, cat, img } = this.dataset;
      addToCart(id, name, parseInt(price), '', cat, img);
      renderSidebar();
      openSidebar();
      this.innerHTML = '<i class="bi bi-check-lg"></i> Added!';
      this.classList.add('added');
      setTimeout(() => {
        this.innerHTML = '<i class="bi bi-plus-lg"></i> Add to Cart';
        this.classList.remove('added');
      }, 1200);
    });
  });
}

// ── Cart sidebar ──────────────────────────────────────────────
function renderSidebar() {
  const cart     = getCart();
  const itemsEl  = document.getElementById('sidebar-items');
  const emptyMsg = document.getElementById('empty-cart-msg');
  const footerEl = document.getElementById('sidebar-footer');

  if (!cart.length) {
    emptyMsg.style.display = 'flex';
    footerEl.style.display = 'none';
    itemsEl.querySelectorAll('.sidebar-item').forEach(el => el.remove());
    return;
  }

  emptyMsg.style.display = 'none';
  footerEl.style.display = 'flex';
  itemsEl.querySelectorAll('.sidebar-item').forEach(el => el.remove());

  cart.forEach(item => {
    const div     = document.createElement('div');
    div.className = 'sidebar-item';
    div.innerHTML = `
<div class="si-img-wrap">
  <img src="${item.image || item.emoji || ''}" alt="${item.name}" class="si-img"
    onerror="this.style.display='none';this.parentElement.classList.add('si-img-missing')"/>
</div>
      <div class="si-info">
        <div class="si-name">${item.name}</div>
        <div class="si-price">₱${item.price}</div>
      </div>
      <div class="si-qty-ctrl">
        <button class="qty-btn" onclick="sidebarChangeQty('${item.id}', -1)">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="sidebarChangeQty('${item.id}', 1)">+</button>
      </div>
      <button class="si-remove" onclick="sidebarRemove('${item.id}')"><i class="bi bi-x"></i></button>`;
    itemsEl.appendChild(div);
  });

  const subtotal     = getSubtotal();
  const deliveryFee  = 49;
  const packagingFee = getPackagingFee();
  const grandTotal   = subtotal + deliveryFee + packagingFee;

  document.getElementById('subtotal-val').textContent = `₱${subtotal}`;
  document.getElementById('total-val').textContent    = `₱${grandTotal}`;

  const existingPkg = document.getElementById('packaging-fee-row');
  if (existingPkg) existingPkg.remove();
  if (packagingFee > 0) {
    const pkgEl     = document.createElement('div');
    pkgEl.id        = 'packaging-fee-row';
    pkgEl.className = 'subtotal-row pkg-row';
    pkgEl.innerHTML = `<span>Packaging Fee <small style="font-weight:400;opacity:0.65;">(ramen/rice)</small></span><span>₱${packagingFee}</span>`;
    const delRow    = footerEl.querySelector('.del-row');
    if (delRow) footerEl.insertBefore(pkgEl, delRow);
  }
}

function sidebarChangeQty(id, delta) { changeQty(id, delta); renderSidebar(); }
function sidebarRemove(id)           { removeFromCart(id);   renderSidebar(); }

function openSidebar() {
  document.getElementById('cart-sidebar').classList.add('sidebar-open');
  document.getElementById('menu-layout').classList.add('layout-split');
  document.getElementById('catalogue-area').classList.add('catalogue-shrunk');
  cartOpen = true;
}

function closeSidebar() {
  document.getElementById('cart-sidebar').classList.remove('sidebar-open');
  document.getElementById('menu-layout').classList.remove('layout-split');
  document.getElementById('catalogue-area').classList.remove('catalogue-shrunk');
  cartOpen = false;
}

// REPLACE WITH:
const cartToggle      = document.getElementById('cart-toggle-btn');
const closeSidebarBtn = document.getElementById('close-sidebar');

if (cartToggle) {
  cartToggle.addEventListener('click', () => {
    // ── Anyone can open the cart — no login needed ──
    cartOpen ? closeSidebar() : (renderSidebar(), openSidebar());
  });
}
if (closeSidebarBtn) {
  closeSidebarBtn.addEventListener('click', closeSidebar);
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.getElementById('kyu-toast');
  if (existing) existing.remove();

  const colors = { success: 'var(--brand)', error: '#ab0000', info: '#1a6b3c' };
  const toast       = document.createElement('div');
  toast.id          = 'kyu-toast';
  toast.style.cssText = `
    position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);
    background:${colors[type] || colors.success};color:#fff;
    padding:14px 28px;border-radius:99px;font-family:var(--font);font-weight:700;
    font-size:14px;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,0.22);
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

// ── Login gate modal (shown when guest tries to checkout) ─────
function injectLoginGateModal() {
  if (document.getElementById('login-gate-modal')) return;
  const modal   = document.createElement('div');
  modal.id      = 'login-gate-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
    z-index:9500;display:flex;align-items:center;justify-content:center;padding:20px;
    opacity:0;pointer-events:none;transition:opacity 0.2s ease;`;
  modal.innerHTML = `
    <div style="background:var(--bg,#fff8f5);border-radius:24px;padding:36px 40px;width:100%;
      max-width:400px;position:relative;box-shadow:0 24px 80px rgba(56,0,0,0.25);
      display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center;">

      <button onclick="closeLoginGate()" style="position:absolute;top:16px;right:16px;width:32px;height:32px;
        background:rgba(56,0,0,0.06);border:none;border-radius:8px;cursor:pointer;font-size:16px;color:var(--brand,#380000);">✕</button>

      <div style="font-size:52px;line-height:1;">🍜</div>

      <div>
        <div style="font-size:18px;font-weight:800;color:var(--black,#000);margin-bottom:6px;">
          Sign in to place your order
        </div>
        <div style="font-size:13px;color:rgba(56,0,0,0.55);line-height:1.6;">
          Create a free account or sign in to track your order status, view your history, and get faster checkout next time.
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;width:100%;">
        <button onclick="closeLoginGate(); openAuthModal('login');"
          style="background:var(--accent,#ab0000);color:#fff;font-family:var(--font);font-size:14px;
          font-weight:700;padding:13px;border:none;border-radius:8px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;width:100%;">
          <i class="bi bi-person-fill"></i> Sign In
        </button>
        <button onclick="closeLoginGate(); openAuthModal('signup');"
          style="background:transparent;color:var(--brand,#380000);font-family:var(--font);font-size:14px;
          font-weight:600;padding:13px;border:2px solid rgba(56,0,0,0.2);border-radius:8px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;width:100%;">
          <i class="bi bi-person-plus"></i> Create Account
        </button>
      </div>

      <div style="font-size:11px;color:rgba(56,0,0,0.35);">
        Your cart items will be saved while you sign in.
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeLoginGate(); });
  document.body.appendChild(modal);
}

function openLoginGate() {
  injectLoginGateModal();
  const modal               = document.getElementById('login-gate-modal');
  modal.style.opacity       = '1';
  modal.style.pointerEvents = 'all';
  document.body.style.overflow = 'hidden';
}

function closeLoginGate() {
  const modal = document.getElementById('login-gate-modal');
  if (!modal) return;
  modal.style.opacity       = '0';
  modal.style.pointerEvents = 'none';
  document.body.style.overflow = '';
}

// ── Checkout modal ────────────────────────────────────────────
function injectCheckoutModal() {
  if (document.getElementById('checkout-modal')) return;
  const modal   = document.createElement('div');
  modal.id      = 'checkout-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
    z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;
    opacity:0;pointer-events:none;transition:opacity 0.2s ease;`;
  modal.innerHTML = `
    <div style="background:var(--bg);border-radius:24px;padding:36px 40px;width:100%;max-width:480px;
      position:relative;box-shadow:0 24px 80px rgba(56,0,0,0.25);display:flex;flex-direction:column;gap:18px;
      max-height:90vh;overflow-y:auto;">
      <button onclick="closeCheckout()" style="position:absolute;top:16px;right:16px;width:32px;height:32px;
        background:rgba(56,0,0,0.06);border:none;border-radius:8px;cursor:pointer;font-size:16px;color:var(--brand);">✕</button>

      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;">🛵</div>
        <div>
          <div style="font-size:16px;font-weight:800;color:var(--black);">Delivery Details</div>
          <div style="font-size:12px;color:rgba(56,0,0,0.5);">Fill in your info to place your order</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="display:flex;flex-direction:column;gap:5px;">
            <label class="co-label">Full Name</label>
            <input id="co-name" type="text" placeholder="Juan dela Cruz" class="auth-input"/>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            <label class="co-label">Phone Number</label>
            <input id="co-phone" type="tel" placeholder="09171234567" class="auth-input"/>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="co-label">Email <span style="font-weight:400;opacity:0.6;">(for order confirmation)</span></label>
          <input id="co-email" type="email" placeholder="you@email.com" class="auth-input"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="co-label">Delivery Address</label>
          <input id="co-address" type="text" placeholder="123 Ramen St., Quezon City" class="auth-input"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="co-label">Payment Method</label>
          <select id="co-payment" class="auth-input" style="cursor:pointer;">
            <option value="cash_on_delivery" selected>Cash on Delivery</option>
          </select>
        </div>
      </div>

      <div id="co-order-summary" style="background:var(--card-bg);border-radius:12px;padding:14px 16px;
        display:flex;flex-direction:column;gap:6px;font-size:13px;"></div>

      <div id="co-error" style="display:none;font-size:12px;font-weight:600;color:var(--accent);
        background:rgba(171,0,0,0.07);border:1px solid rgba(171,0,0,0.15);border-radius:8px;padding:8px 12px;"></div>

      <button id="co-submit-btn" onclick="submitOrder()" style="background:var(--accent);color:#fff;
        font-family:var(--font);font-size:14px;font-weight:700;padding:13px;border:none;
        border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
        <i class="bi bi-bag-check-fill"></i> Place Order
      </button>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeCheckout(); });
  document.body.appendChild(modal);

  if (!document.getElementById('co-label-style')) {
    const s = document.createElement('style');
    s.id = 'co-label-style';
    s.textContent = `.co-label{font-size:12px;font-weight:600;color:var(--brand);text-transform:uppercase;letter-spacing:0.4px;}`;
    document.head.appendChild(s);
  }
}

// ▼ UPDATED: gate behind login before opening checkout
function openCheckout() {
  const cart = getCart();
  if (!cart.length) return;

  // ── If not logged in, show login gate instead ──────────────
  const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : !!localStorage.getItem('kyu_token');
  if (!loggedIn) {
    openLoginGate();
    return;
  }

  // ── Logged in — proceed to checkout as before ──────────────
  injectCheckoutModal();

  const user = typeof getUser === 'function' ? getUser() : null;
  if (user) {
    document.getElementById('co-name').value  = user.name  || '';
    document.getElementById('co-phone').value = user.phone || '';
    document.getElementById('co-email').value = user.email || '';
  }

  const subtotal     = getSubtotal();
  const deliveryFee  = 49;
  const packagingFee = getPackagingFee();
  const grandTotal   = subtotal + deliveryFee + packagingFee;
  const summary      = document.getElementById('co-order-summary');

  const packagingLine = packagingFee > 0
    ? `<div style="display:flex;justify-content:space-between;color:rgba(56,0,0,0.6);">
         <span>Packaging Fee</span><span>₱${packagingFee}</span>
       </div>`
    : '';

  summary.innerHTML =
    cart.map(i => `
      <div style="display:flex;justify-content:space-between;">
        <span>${i.name} x${i.qty}</span>
        <span style="font-weight:700;">₱${i.price * i.qty}</span>
      </div>`).join('') +
    `<div style="border-top:1px dashed rgba(56,0,0,0.15);margin-top:6px;padding-top:6px;">
       <div style="display:flex;justify-content:space-between;color:rgba(56,0,0,0.6);">
         <span>Delivery Fee</span><span>₱${deliveryFee}</span>
       </div>
       ${packagingLine}
       <div style="display:flex;justify-content:space-between;font-weight:800;font-size:14px;color:var(--accent);margin-top:6px;">
         <span>Total</span><span>₱${grandTotal}</span>
       </div>
     </div>`;

  const modal               = document.getElementById('checkout-modal');
  modal.style.opacity       = '1';
  modal.style.pointerEvents = 'all';
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;
  modal.style.opacity       = '0';
  modal.style.pointerEvents = 'none';
  const errEl = document.getElementById('co-error');
  if (errEl) errEl.style.display = 'none';
}

// ── Submit order ──────────────────────────────────────────────
async function submitOrder() {
  const name          = document.getElementById('co-name').value.trim();
  const phone         = document.getElementById('co-phone').value.trim();
  const address       = document.getElementById('co-address').value.trim();
  const email         = document.getElementById('co-email').value.trim();
  const paymentMethod = document.getElementById('co-payment').value;
  const errEl         = document.getElementById('co-error');
  const btn           = document.getElementById('co-submit-btn');

  errEl.style.display = 'none';
  if (!name || !phone || !address) {
    errEl.textContent   = 'Please fill in your name, phone, and address.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Placing order…';

  const cart  = getCart();
  const items = cart.map(i => ({ menuItemId: i.id, name: i.name, quantity: i.qty }));

  try {
    const headers = { 'Content-Type': 'application/json' };
    const token   = typeof getToken === 'function' ? getToken() : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res  = await fetch(`${MENU_API}/orders`, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ items, deliveryAddress: address, guestName: name, guestPhone: phone, email, paymentMethod }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent   = data.message || 'Order failed. Please try again.';
      errEl.style.display = 'block';
      return;
    }

    localStorage.removeItem('kyu_cart');
    updateCartBadge();
    renderSidebar();
    closeSidebar();
    closeCheckout();
    showToast('<span style="font-size:18px;">🍜</span> Order placed! Track it under My Orders.');

  } catch {
    errEl.textContent   = 'Network error. Please try again.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-bag-check-fill"></i> Place Order';
  }
}

// ── Header cart button behavior ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const headerCartBtn = document.getElementById('header-cart-btn');
  if (!headerCartBtn) return;

  const isMenuPage = window.location.pathname.includes('menu.html')
    || window.location.pathname.endsWith('/menu')
    || window.location.pathname.endsWith('/');

headerCartBtn.addEventListener('click', () => {
    if (isMenuPage) {
      cartOpen ? closeSidebar() : (renderSidebar(), openSidebar());
    } else {
      window.location.href = 'menu.html#cart-open';
    }
  });
});

// ── Init ──────────────────────────────────────────────────────
buildFilterBar();
loadProducts();
injectCheckoutModal();