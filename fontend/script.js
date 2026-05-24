// ── HERO RAMEN CAROUSEL ───────────────────────────────────────
const heroItems = [
  {
    title: 'CHEESY TONKOTSU',
    desc:  'Classic tonkotsu elevated with a molten cheese sauce swirl. Creamy, indulgent, and dangerously good.',
    prep:  '24 Hrs Broth',
    base:  'Hakata Tonkotsu',
    price: '₱99.00 Only',
    color: '#961c1c',
  },
  {
    title: 'GYUDON',
    desc:  'Thinly sliced seasoned beef and caramelised onions over fluffy Japanese rice. Comfort in every bite.',
    prep:  '30 Min Cook',
    base:  'Beef Braise',
    price: '₱99.00 Only',
    color: '#7a3b00',
  },
  {
    title: 'ICHIBAN',
    desc:  'Crowd-tested champion. A umami-forward broth with layered toppings that hits every time.',
    prep:  '18 Hrs Broth',
    base:  'Pork-Chicken',
    price: '₱99.00 Only',
    color: '#5a1a1a',
  },
  {
    title: 'SPICY ICHIBAN',
    desc:  'Bold, fiery broth with thick-cut chashu, soft egg, and a house chili paste. Not for the faint of heart.',
    prep:  '18 Hrs Broth',
    base:  'Spicy Tonkotsu',
    price: '₱99.00 Only',
    color: '#8b0000',
  },
];

let heroCurrent = 0;
let heroAnimating = false;

const bowls      = document.querySelectorAll('.ramen-showcase-bowl');
const thumbs     = document.querySelectorAll('.item-thumb');
const activeLine = document.getElementById('active-line');
const titleEl    = document.getElementById('item-title');
const descEl     = document.getElementById('item-desc');
const waveBg     = document.getElementById('wave-bg');
const heroSection = document.getElementById('ramen-hero');

function heroGoTo(index) {
  if (heroAnimating || index === heroCurrent) return;
  heroAnimating = true;

  const prev = heroCurrent;
  heroCurrent = index;

  // ── Update bowl images ──────────────────────────────────────
  bowls[prev].className = 'ramen-showcase-bowl prev';
  bowls[index].className = 'ramen-showcase-bowl active';

  // reset other bowls to 'next'
  bowls.forEach((b, i) => {
    if (i !== prev && i !== index) b.className = 'ramen-showcase-bowl next';
  });

  // ── Update text with fade ───────────────────────────────────
  titleEl.classList.add('slide-out-text');
  descEl.classList.add('slide-out-text');

  setTimeout(() => {
    titleEl.textContent = heroItems[index].title;
    descEl.textContent  = heroItems[index].desc;

    // update meta boxes
    const metaBoxes = document.querySelectorAll('.meta-box p');
    if (metaBoxes[0]) metaBoxes[0].textContent = heroItems[index].prep;
    if (metaBoxes[1]) metaBoxes[1].textContent = heroItems[index].base;
    if (metaBoxes[2]) metaBoxes[2].textContent = heroItems[index].price;

    titleEl.classList.remove('slide-out-text');
    descEl.classList.remove('slide-out-text');
  }, 220);

  // ── Update theme color ──────────────────────────────────────
  if (heroSection) heroSection.style.setProperty('--theme-color', heroItems[index].color);
  if (waveBg)      waveBg.style.backgroundColor = heroItems[index].color;

  // ── Update thumbnails ───────────────────────────────────────
  thumbs.forEach((t, i) => t.classList.toggle('active', i === index));

  // ── Slide the active underline ──────────────────────────────
  if (activeLine && thumbs[index]) {
    const thumbWidth = thumbs[index].offsetWidth;
    const gap        = 20; // matches CSS gap
    activeLine.style.transform = `translateX(${index * (thumbWidth + gap)}px)`;
    activeLine.style.width     = `${thumbWidth}px`;
  }

  // ── Splash ring animation ───────────────────────────────────
  const splash = document.getElementById('splash-ring');
  if (splash) {
    splash.style.backgroundColor = heroItems[index].color;
    splash.classList.remove('burst');
    void splash.offsetWidth; // reflow to restart animation
    splash.classList.add('burst');
  }

  setTimeout(() => { heroAnimating = false; }, 800);
}

// ── Wire up thumbnail clicks ──────────────────────────────────
thumbs.forEach((thumb, i) => {
  thumb.addEventListener('click', () => heroGoTo(i));
});

// ── Auto-rotate hero every 4s ─────────────────────────────────
setInterval(() => {
  heroGoTo((heroCurrent + 1) % heroItems.length);
}, 4000);


// ── MOST FAVORITE CARDS ───────────────────────────────────────
const mfItems   = document.querySelectorAll('.mf-card-item');
let   mfCurrent = 1;

function mfGoTo(index) {
  mfItems.forEach((card, i) => {
    card.classList.remove('center', 'side');
    card.classList.add(i === index ? 'center' : 'side');
  });
  mfCurrent = index;
}



// Auto-rotate every 3s
setInterval(() => {
  mfGoTo((mfCurrent + 1) % mfItems.length);
}, 3000);

    document.addEventListener('DOMContentLoaded', function () {
      const hamburgerBtn = document.querySelector('.hamburger-btn');
      const mobileDrawer  = document.querySelector('.mobile-nav-drawer');
      const mobileOverlay = document.querySelector('.mobile-nav-overlay');

      if (!hamburgerBtn || !mobileDrawer || !mobileOverlay) return;

      function toggleDrawer(open) {
        mobileDrawer.classList.toggle('drawer-open', open);
        mobileOverlay.classList.toggle('overlay-open', open);
        hamburgerBtn.setAttribute('aria-expanded', open);
        const icon = hamburgerBtn.querySelector('i');
        if (icon) icon.className = open ? 'bi bi-x-lg' : 'bi bi-list';
      }

      hamburgerBtn.addEventListener('click', function () {
        toggleDrawer(!mobileDrawer.classList.contains('drawer-open'));
      });

      mobileOverlay.addEventListener('click', function () { toggleDrawer(false); });

      mobileDrawer.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () { toggleDrawer(false); });
      });
    });