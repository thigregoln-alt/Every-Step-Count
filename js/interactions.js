(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const activeAnimations = new Set();
  function play(element, frames, options) {
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
    return animation;
  }
  document.querySelectorAll('.award-tile').forEach(tile => {
    const layer = document.createElement('span');
    layer.className = 'direction-layer';
    layer.setAttribute('aria-hidden', 'true');
    tile.prepend(layer);
    let currentAnimation;
    function edgeTransform(event) {
      const rect = tile.getBoundingClientRect();
      const distances = [
        {distance: Math.abs(event.clientY - rect.top), transform: 'translateY(-102%)'},
        {distance: Math.abs(event.clientX - rect.right), transform: 'translateX(102%)'},
        {distance: Math.abs(event.clientY - rect.bottom), transform: 'translateY(102%)'},
        {distance: Math.abs(event.clientX - rect.left), transform: 'translateX(-102%)'}
      ];
      distances.sort((a, b) => a.distance - b.distance);
      return distances[0].transform;
    }
    function move(event, entering) {
      if (event.pointerType === 'touch') return;
      const start = getComputedStyle(layer).transform;
      currentAnimation?.cancel();
      tile.classList.toggle('direction-active', entering);
      const edge = edgeTransform(event);
      layer.style.transform = entering ? 'translate(0, 0)' : edge;
      if (reduced.matches) return;
      currentAnimation = play(layer, [
        {transform: entering ? edge : start},
        {transform: entering ? 'translate(0, 0)' : edge}
      ], {duration: 340, easing: 'cubic-bezier(.22,1,.36,1)'});
    }
    tile.addEventListener('pointerenter', event => move(event, true));
    tile.addEventListener('pointerleave', event => move(event, false));
    tile.addEventListener('focus', () => {
      if (!tile.matches(':focus-visible')) return;
      currentAnimation?.cancel();
      layer.style.transform = 'translate(0, 0)';
      tile.classList.add('direction-active');
    });
    tile.addEventListener('blur', () => {
      if (tile.matches(':hover')) return;
      layer.style.transform = 'translateY(102%)';
      tile.classList.remove('direction-active');
    });
  });

  // Each element is revealed once. Base styles remain visible without JavaScript.
  const targets = [...document.querySelectorAll('.participation > h2, .recognition > h2, .award-tile, .deck-card h3, .deck-card p, .goal-label, footer .fr h2')];
  const revealed = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    visible.forEach((entry, index) => {
      observer.unobserve(entry.target);
      if (revealed.has(entry.target)) return;
      revealed.add(entry.target);
      if (reduced.matches) return;
      play(entry.target, [
        {opacity: 0, transform: 'perspective(1000px) translateY(44px) rotateX(7deg) scale(.97)'},
        {opacity: 1, transform: 'perspective(1000px) translateY(0) rotateX(0) scale(1)'}
      ], {duration: 720, delay: Math.min(index, 3) * 90, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'});
    });
  }, {threshold: .16});
  targets.forEach(target => observer.observe(target));
  reduced.addEventListener('change', () => {
    if (reduced.matches) activeAnimations.forEach(animation => animation.cancel());
  });
})();
