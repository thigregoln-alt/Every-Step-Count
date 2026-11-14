(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.stage');
  const art = document.querySelector('.hero-art');
  const cards = [...document.querySelectorAll('.facts .dc')];
  const facts = document.querySelector('.facts');
  const goal = document.querySelector('.goal');
  const clamp = value => Math.max(0, Math.min(1, value));
  let pending = false;
  function update() {
    pending = false;
    if (preference.matches) {
      if (art) art.style.transform = '';
      cards.forEach(card => { card.style.transform = ''; });
      goal.style.width = '';
      goal.style.borderRadius = '';
      goal.style.transform = '';
      return;
    }
    const progress = clamp(-hero.getBoundingClientRect().top / hero.offsetHeight);
    if (art) art.style.transform = `translateY(${progress * 60}px) rotate(${3 - progress * 8}deg) scale(${1 + progress * 0.025})`;
    const alignment = clamp((innerHeight * 0.95 - facts.getBoundingClientRect().top) / (innerHeight * 0.6));
    const eased = alignment * alignment * (3 - 2 * alignment);
    cards.forEach((card, index) => {
      const side = index - 1;
      card.style.transform = `translate(${side * (1 - eased) * 65}px, ${(1 - eased) * (65 + index * 25)}px) rotate(${side * (1 - eased) * 12}deg) scale(${0.85 + eased * 0.15})`;
    });
    const amount = clamp((innerHeight - goal.getBoundingClientRect().top) / (innerHeight * 0.75));
    const morph = amount * amount * (3 - 2 * amount);
    goal.style.width = `${70 + morph * 28}%`;
    goal.style.borderRadius = `${150 - morph * 118}px`;
    goal.style.transform = `rotate(${(1 - morph) * -4}deg)`;
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  preference.addEventListener('change', schedule);
  update();
})();
