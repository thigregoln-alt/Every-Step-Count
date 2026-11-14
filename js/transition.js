/* Passo a passo — overlapping organic stamps, carried across documents. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'atec-step-transition-v1';
  let busy = false;
  let watchdog;
  const style = document.createElement('style');
  style.textContent = `
    #step-transition{position:fixed;inset:0;z-index:2147483000;overflow:hidden;pointer-events:none;visibility:hidden;contain:strict}
    #step-transition.active{visibility:visible;pointer-events:auto}
    #step-transition .step{position:absolute;width:180vmax;height:180vmax;left:var(--x);top:var(--y);margin:-90vmax;border-radius:46% 54% 61% 39% / 56% 38% 62% 44%;background:var(--color);transform:rotate(var(--angle)) scale(0);will-change:transform}
    #step-transition.covered .step{transform:rotate(var(--angle)) scale(1)}
    html.step-busy{cursor:progress}
    @media(prefers-reduced-motion:reduce){#step-transition{display:none}}
  `;
  document.head.append(style);
  const layer = document.createElement('div');
  layer.id = 'step-transition';
  layer.setAttribute('aria-hidden', 'true');
  const positions = [
    ['22%', '76%', '-28deg', '#E2D8C3'],
    ['73%', '48%', '24deg', '#BFD2BB'],
    ['40%', '20%', '-17deg', '#1F3D32']
  ];
  const stamps = positions.map(([x,y,angle,color]) => {
    const node = document.createElement('div');
    node.className = 'step';
    node.style.cssText = `--x:${x};--y:${y};--angle:${angle};--color:${color}`;
    layer.append(node);
    return node;
  });
  root.append(layer);
  const transform = (i, scale, turn = 0) => `rotate(${parseFloat(positions[i][2]) + turn}deg) scale(${scale})`;
  function reset() {
    clearTimeout(watchdog);
    stamps.forEach(node => node.getAnimations().forEach(animation => animation.cancel()));
    layer.className = '';
    root.classList.remove('step-busy');
    busy = false;
  }
  async function run(arriving) {
    layer.className = arriving ? 'active covered' : 'active';
    const animations = stamps.map((node,i) => node.animate(
      arriving
        ? [{transform:transform(i,1)}, {transform:transform(i,0,24)}]
        : [{transform:transform(i,0,-24)}, {transform:transform(i,.11,-10),offset:.38}, {transform:transform(i,1)}],
      {duration: arriving ? 570 : 560, delay:(arriving ? 2-i : i)*85,
       easing:'cubic-bezier(.76,0,.24,1)',fill:'both'}
    ));
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  }
  let pending;
  try {
    pending = JSON.parse(sessionStorage.getItem(key));
    sessionStorage.removeItem(key);
  } catch (_) {}
  if (pending && Date.now()-pending.time < 12000 && pending.path === location.pathname && !reduced.matches) {
    layer.className = 'active covered';
    const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => run(true).then(reset)));
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',reveal,{once:true});
    else reveal();
    watchdog = setTimeout(reset,2200);
  }
  document.addEventListener('click', event => {
    if(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href]');
    if(!link || link.hasAttribute('download') || (link.target && link.target !== '_self') || link.dataset.noTransition !== undefined) return;
    const url = new URL(link.href, location.href);
    if(url.origin !== location.origin || !['http:','https:','file:'].includes(url.protocol)) return;
    if(url.pathname === location.pathname && url.search === location.search) return;
    if(!/\.html?$|\/$/i.test(url.pathname) || reduced.matches) return;
    event.preventDefault();
    if(busy) return;
    busy = true;
    root.classList.add('step-busy');
    run(false).then(() => {
      try {sessionStorage.setItem(key,JSON.stringify({path:url.pathname,time:Date.now()}));} catch (_) {}
      location.assign(url.href);
      watchdog = setTimeout(reset,5000);
    });
  });
  addEventListener('pageshow',event => {if(event.persisted) reset();});
})();
