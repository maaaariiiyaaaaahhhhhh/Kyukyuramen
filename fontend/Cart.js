// cart.js — UPDATED
// Changes:
//   + getPackagingFee(cartWithCategories) — calculates ₱20/ramen, ₱10/rice_bowls
//   + cart items now optionally store `cat` field for fee calculation
//   + addToCart() accepts category param

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
function addToCart(id, name, price, emoji, category = '') {
  const cart     = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, emoji, cat: category, qty: 1 });
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