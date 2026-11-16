(() => {
  const wrap = document.querySelector('.lace-scroll');
  if (!wrap) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Matching cubic segments allow the loose cord to become a continuous plate rim.
  const loose = [55,395, 190,420,245,75,405,91, 590,105,270,357,470,367, 660,378,688,63,914,104, 1120,141,1010,434,817,411, 680,395,1110,285,1140,360];
  const plate = [530,449, 375,412,338,142,485,90, 610,35,775,90,791,220, 820,353,715,449,585,450, 414,451,350,250,446,137, 490,85,561,76,601,79];
  const paths = [...wrap.querySelectorAll('.cord')];
  const measure = wrap.querySelector('.cord-edge');
  const start = wrap.querySelector('.tip-start');
  const end = wrap.querySelector('.tip-end');
  let queued = false;
  function update() {
    queued = false;
    const distance = wrap.offsetHeight-innerHeight;
    const t = motion.matches || distance < 50 ? 0 : Math.max(0,Math.min(1,-wrap.getBoundingClientRect().top/distance));
    const p = t*t*(3-2*t);
    const v = loose.map((n,i)=>n+(plate[i]-n)*p);
    const d = `M${v[0]},${v[1]} C${v.slice(2).join(' ')}`;
    paths.forEach(path=>path.setAttribute('d',d));
    const length = measure.getTotalLength();
    // Two short crossings sit in front of the letters; the rest runs behind.
    wrap.querySelectorAll('.lace-front .cord').forEach(path=>{
      path.style.strokeDasharray = `${length*.10} ${length*.24} ${length*.12} ${length}`;
      if (path.classList.contains('cord-weave')) path.style.display='none';
    });
    function tip(node,a,b) {
      const from=measure.getPointAtLength(a),to=measure.getPointAtLength(b);
      node.setAttribute('d',`M${from.x} ${from.y}L${to.x} ${to.y}`);
    }
    tip(start,0,24);tip(end,length-24,length);
    wrap.style.setProperty('--title-opacity',String(1-Math.min(1,p*2.4)));
    wrap.style.setProperty('--title-y',`${-p*35}px`);
    wrap.style.setProperty('--front-opacity',String(1-p));
    wrap.style.setProperty('--meal-opacity',String(Math.max(0,(p-.62)/.38)));
  }
  function enter() {
    if (motion.matches || scrollY > 40) return;
    const ns = 'http://www.w3.org/2000/svg';
    const animations = [];
    const masks = [];
    const groups = [];
    let finished = false;
    function clean() {
      if (finished) return;
      finished = true;
      animations.forEach(a => a.cancel());
      groups.forEach(g => g.removeAttribute('mask'));
      masks.forEach(m => m.remove());
      removeEventListener('scroll', interrupt);
      motion.removeEventListener('change', clean);
    }
    function interrupt() { if (scrollY > 40) clean(); }
    function begin() {
      if (finished || motion.matches || scrollY > 40) { clean(); return; }
      wrap.querySelectorAll('.lace-art').forEach((svg, index) => {
        const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(ns,'defs'),svg.firstChild);
        const mask = document.createElementNS(ns,'mask');
        mask.id = `lace-entry-${index}`;
        mask.setAttribute('maskUnits','userSpaceOnUse');
        mask.setAttribute('x','-100');mask.setAttribute('y','-100');
        mask.setAttribute('width','1400');mask.setAttribute('height','720');
        const reveal = document.createElementNS(ns,'path');
        reveal.setAttribute('d',measure.getAttribute('d'));
        reveal.setAttribute('fill','none');reveal.setAttribute('stroke','white');
        reveal.setAttribute('stroke-width','40');reveal.setAttribute('stroke-linecap','round');
        const length = measure.getTotalLength();
        reveal.style.strokeDasharray = `${length} ${length}`;
        mask.append(reveal);defs.append(mask);masks.push(mask);
        const group = svg.querySelector('g');group.setAttribute('mask',`url(#${mask.id})`);groups.push(group);
        animations.push(reveal.animate([{strokeDashoffset:length},{strokeDashoffset:0}],{duration:1250,easing:'cubic-bezier(.45,0,.2,1)',fill:'both'}));
      });
      const items = [...wrap.querySelectorAll('.hero-kicker,.hero-word,h1 em,.hero-bottom,.lace-tip')];
      items.forEach((node,i) => animations.push(node.animate(
        [{opacity:0,translate:'0 22px'},{opacity:1,translate:'0 0'}],
        {duration:650,delay:220+i*100,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}
      )));
      Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(clean);
      addEventListener('scroll',interrupt,{passive:true});
      motion.addEventListener('change',clean);
    }
    // Wait for the page transition to reveal the hero, without delaying navigation.
    const deadline = performance.now()+2400;
    function ready() {
      if(document.querySelector('#step-transition.active') && performance.now()<deadline) requestAnimationFrame(ready);
      else begin();
    }
    requestAnimationFrame(ready);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);motion.addEventListener('change',schedule);update();
  enter();
})();
