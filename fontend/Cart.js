

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('kyu_cart')) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('kyu_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const cart  = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent    = total;
    el.style.display  = total > 0 ? 'flex' : 'none';
  });
}

// ▼ UPDATED: accepts category for packaging fee
function addToCart(id, name, price, emoji, category = '', image = '') {
  const cart     = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, emoji, cat: category, qty: 1, image });
  }
  saveCart(cart);
  updateCartBadge();
  return cart;
}

function removeFromCart(id) {
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateCartBadge();
  return cart;
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) return removeFromCart(id);
  }
  saveCart(cart);
  updateCartBadge();
  return cart;
}

function getSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ▼ NEW: calculate packaging fee from cart items
// ₱20 per ramen item (per qty), ₱10 per rice_bowl item (per qty)
function getPackagingFee() {
  return getCart().reduce((fee, item) => {
    if (item.cat === 'ramen')      return fee + 20 * item.qty;
    if (item.cat === 'rice_bowls') return fee + 10 * item.qty;
    return fee;
  }, 0);
}

// ▼ NEW: grand total helper (subtotal + delivery + packaging)
function getGrandTotal(deliveryFee = 49) {
  return getSubtotal() + deliveryFee + getPackagingFee();
}

// ── Universal cart sidebar (works on all pages) ───────────────
function renderSidebarUniversal() {
  const cart     = getCart();
  const itemsEl  = document.getElementById('sidebar-items');
  const emptyMsg = document.getElementById('empty-cart-msg');
  const footerEl = document.getElementById('sidebar-footer');
  if (!itemsEl) return;

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
    const div = document.createElement('div');
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
    <button class="qty-btn" onclick="universalChangeQty('${item.id}', -1)">−</button>
    <span>${item.qty}</span>
    <button class="qty-btn" onclick="universalChangeQty('${item.id}', 1)">+</button>
  </div>
  <button class="si-remove" onclick="universalRemove('${item.id}')"><i class="bi bi-x"></i></button>`;
    itemsEl.appendChild(div);
  });

  const subtotal     = getSubtotal();
  const packagingFee = getPackagingFee();
  const grandTotal   = subtotal + 49 + packagingFee;

  document.getElementById('subtotal-val').textContent = `₱${subtotal}`;
  document.getElementById('total-val').textContent    = `₱${grandTotal}`;
}

function universalChangeQty(id, delta) { changeQty(id, delta); renderSidebarUniversal(); }
function universalRemove(id)           { removeFromCart(id);   renderSidebarUniversal(); }

function openCartSidebar() {
  const sidebar = document.getElementById('cart-sidebar');
  if (sidebar) sidebar.classList.add('sidebar-open');
}

function closeCartSidebar() {
  const sidebar = document.getElementById('cart-sidebar');
  if (sidebar) sidebar.classList.remove('sidebar-open');
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderSidebarUniversal();

  const cartBtn  = document.getElementById('header-cart-btn');
  const closeBtn = document.getElementById('close-sidebar');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('cart-sidebar');
      if (!sidebar) return;
      sidebar.classList.contains('sidebar-open') ? closeCartSidebar() : (renderSidebarUniversal(), openCartSidebar());
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCartSidebar);
  }
});