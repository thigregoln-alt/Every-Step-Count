(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.acts .b1').forEach(button => {
    const label = document.createElement('span');
    label.className = 'button-label';
    while (button.firstChild) label.append(button.firstChild);
    const arrow = document.createElement('span');
    arrow.className = 'button-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    button.append(label, arrow);
    button.classList.add('slide-arrow-button');
  });
  const cards = [...document.querySelectorAll('.deck-card')];
  let scheduled = false;
  function updateStack() {
    scheduled = false;
    cards.forEach((card, index) => {
      if (reduced.matches || !cards[index + 1]) { card.style.transform = ''; return; }
      const next = cards[index + 1].getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight * .8 - next.top) / (innerHeight * .6)));
      card.style.transform = `scale(${1 - progress * .055})`;
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateStack);
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  updateStack();
  const dialog = document.querySelector('.morph-dialog');
  let source = null;
  let animation = null;
  let closing = false;
  function frameFrom(rect, target) {
    return {transform: `translate(${rect.left + rect.width / 2 - target.left - target.width / 2}px, ${rect.top + rect.height / 2 - target.top - target.height / 2}px) scale(${rect.width / target.width}, ${rect.height / target.height})`, borderRadius:'28px'};
  }
  document.querySelectorAll('[data-morph]').forEach(tile => {
    tile.addEventListener('click', () => {
      source = tile;
      dialog.style.background = getComputedStyle(tile).backgroundColor;
      dialog.querySelector('h2').textContent = tile.querySelector('strong').textContent;
      dialog.querySelector('.dialog-detail').textContent = tile.dataset.detail;
      dialog.querySelector('.dialog-art').textContent = tile.querySelector('.tile-art').textContent;
      const origin = tile.getBoundingClientRect();
      dialog.showModal();
      document.body.classList.add('dialog-open');
      if (!reduced.matches) animation = dialog.animate([frameFrom(origin, dialog.getBoundingClientRect()), {transform:'none',borderRadius:'30px'}], {duration:480,easing:'cubic-bezier(.22,1,.36,1)'});
    });
  });
  async function close() {
    if (closing || !dialog.open) return;
    closing = true;
    if (animation) animation.cancel();
    if (!reduced.matches && source) {
      animation = dialog.animate([{transform:'none'},frameFrom(source.getBoundingClientRect(),dialog.getBoundingClientRect())],{duration:320,easing:'cubic-bezier(.4,0,.2,1)'});
      await animation.finished.catch(() => {});
    }
    dialog.close();
    document.body.classList.remove('dialog-open');
    source?.focus({preventScroll:true});
    closing = false;
  }
  dialog.querySelector('.dialog-close').addEventListener('click',close);
  dialog.addEventListener('cancel',event => {event.preventDefault();close();});
  dialog.addEventListener('click',event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
  });
})();
