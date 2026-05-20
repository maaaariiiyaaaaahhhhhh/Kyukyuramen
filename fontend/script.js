
(function(){
  const c = document.getElementById('homeCarousel');
  const dw = document.getElementById('carDots');
  const cards = c ? [...c.querySelectorAll('.car-card')] : [];
  let cur = 0;
  if(!c || !cards.length) return;

  cards.forEach((_,i) => {
    const d = document.createElement('div');
    d.className = 'cdot' + (i===0?' active':'');
    d.onclick = () => goTo(i);
    dw.appendChild(d);
  });

  function goTo(i) {
    cur = Math.max(0, Math.min(cards.length-1, i));
    c.scrollTo({ left: cards[cur].offsetLeft - c.offsetLeft - 4, behavior: 'smooth' });
    dw.querySelectorAll('.cdot').forEach((d,j) => d.classList.toggle('active', j===cur));
  }

  c.addEventListener('scroll', () => {
    let min = Infinity, idx = 0;
    cards.forEach((card,i) => {
      const dist = Math.abs(card.offsetLeft - c.scrollLeft - c.offsetLeft);
      if(dist < minDist){ min=dist; idx=i; }
    });
    cur = idx;
    dw.querySelectorAll('.cdot').forEach((d,j) => d.classList.toggle('active', j===cur));
  });

  window.slideCarousel = (dir) => goTo(cur + dir);
})();
