(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.querySelector('.challenge');
  if (!main) return;
  const animations = [];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (!reduced.matches) animations.push(entry.target.animate([
        {opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}
      ],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'}));
    });
  },{threshold:.15});
  main.querySelectorAll('h1,.challenge-lead,.mission-copy,.collective-steps article,.challenge-close p').forEach(node=>observer.observe(node));
  const plate = main.querySelector('.mission-target');
  let scheduled = false;
  function update(){scheduled=false;const progress=reduced.matches?1:Math.max(0,Math.min(1,(innerHeight*.95-plate.getBoundingClientRect().top)/(innerHeight*.65)));plate.style.setProperty('--plate-offset',1125*(1-progress));}
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  reduced.addEventListener('change',()=>{if(reduced.matches)animations.forEach(a=>a.cancel());schedule()});update();
})();
