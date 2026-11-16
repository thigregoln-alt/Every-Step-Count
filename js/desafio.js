(() => {
  const sequence=document.querySelector('.reveal-sequence');
  if(!sequence)return;
  const stage=sequence.querySelector('.reveal-stage');
  const opening=sequence.querySelector('.opening');
  const panel=sequence.querySelector('.mission-panel');
  const content=sequence.querySelector('.mission-content');
  const link=opening.querySelector('a');
  const header=document.querySelector('header');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
  let active=false,headerHeight=85,queued=false;
  function distance(){return Math.max(1,sequence.offsetHeight-stage.offsetHeight)}
  function update(){
    queued=false;
    if(!active)return;
    const p=clamp((headerHeight-sequence.getBoundingClientRect().top)/distance());
    // A single continuous wipe: words separate first, then the mission covers them.
    const spread=ease(p/.6),reveal=ease((p-.12)/.72);
    sequence.style.setProperty('--spread',spread);
    sequence.style.setProperty('--opening-scale',1-spread*.08);
    sequence.style.setProperty('--opening-opacity',1-ease((p-.4)/.4));
    sequence.style.setProperty('--panel-cut',`${(1-reveal)*100}%`);
    sequence.style.setProperty('--panel-radius',`${55*(1-reveal)}px`);
    sequence.style.setProperty('--content-y',`${45*(1-reveal)}px`);
    sequence.style.setProperty('--content-opacity',ease((p-.25)/.5));
    panel.style.pointerEvents=p>.7?'auto':'none';
    // Avoid trapping keyboard focus behind the overlay; Tab remains native.
    opening.style.pointerEvents=p>.75?'none':'auto';
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
  function layout(){
    headerHeight=Math.ceil(header?.getBoundingClientRect().height||85);
    sequence.style.setProperty('--header-h',`${headerHeight}px`);
    sequence.classList.remove('layered-scroll');
    // Don't pin when translated copy or a short viewport needs more room.
    active=!reduced.matches && innerHeight-headerHeight>520 && content.scrollHeight+70<innerHeight-headerHeight;
    sequence.classList.toggle('layered-scroll',active);
    if(!active){panel.style.pointerEvents='';opening.style.pointerEvents='';}
    schedule();
  }
  function revealMission(smooth=true){
    if(!active)return;
    const y=scrollY+sequence.getBoundingClientRect().top-headerHeight+distance();
    scrollTo({top:y,behavior:smooth?'smooth':'instant'});
  }
  link.addEventListener('click',event=>{if(!active||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.replaceState(null,'','#missao');revealMission()});
  opening.addEventListener('focusin',()=>{if(active)scrollTo({top:scrollY+sequence.getBoundingClientRect().top-headerHeight,behavior:'instant'})});
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',layout);reduced.addEventListener('change',layout);
  if(header&&typeof ResizeObserver!=='undefined')new ResizeObserver(layout).observe(header);
  const observer=new MutationObserver(layout);observer.observe(content,{subtree:true,characterData:true,childList:true});
  layout();
  if(document.fonts)document.fonts.ready.then(()=>{layout();if(location.hash==='#missao')revealMission(false)});
})();
