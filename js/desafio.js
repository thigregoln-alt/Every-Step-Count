(() => {
  const main = document.querySelector('.challenge');
  if (!main) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width:760px), (max-height:720px)');
  const scene = main.querySelector('.mission-scroll');
  const plate = main.querySelector('.mission-target');
  const intro = main.querySelector('h1');
  const rows = [...main.querySelectorAll('.collective-steps article')];
  const clamp = n => Math.max(0,Math.min(1,n));
  const ease = n => n*n*(3-2*n);
  let scheduled = false;
  main.classList.add('scroll-enabled');
  function update() {
    scheduled = false;
    const rect = scene.getBoundingClientRect();
    const p = reduced.matches ? 1 : compact.matches
      ? clamp((innerHeight*.9-plate.getBoundingClientRect().top)/(innerHeight*.65))
      : clamp((80-rect.top)/(scene.offsetHeight-(innerHeight-80)));
    const smooth = ease(p);
    scene.style.setProperty('--scene-margin',`${reduced.matches||compact.matches?0:28*(1-smooth)}px`);
    scene.style.setProperty('--scene-radius',`${60*(1-smooth)}px`);
    scene.style.setProperty('--copy-y',`${reduced.matches?0:22*(1-smooth)}px`);
    scene.style.setProperty('--plate-scale',.72+.28*smooth);
    scene.style.setProperty('--plate-rotation',`${-16*(1-smooth)}deg`);
    scene.style.setProperty('--plate-offset',1125*(1-clamp(p*1.4)));
    scene.style.setProperty('--inner-offset',949*(1-clamp((p-.18)*1.5)));
    scene.style.setProperty('--number-clip',`${100*(1-clamp(p*2.4))}%`);
    scene.style.setProperty('--number-y',`${25*(1-smooth)}px`);
    scene.style.setProperty('--orbit-radius',`${250-85*smooth}px`);
    scene.style.setProperty('--orbit-opacity',Math.sin(p*Math.PI)*.9);
    const departure=reduced.matches?0:clamp(-main.getBoundingClientRect().top/innerHeight);
    intro.style.transform=`translateY(${-departure*40}px)`;
    rows.forEach(row=>{
      const t=reduced.matches?1:ease(clamp((innerHeight*.9-row.getBoundingClientRect().top)/(innerHeight*.45)));
      row.style.setProperty('--step-y',`${35*(1-t)}px`);
      row.style.setProperty('--step-opacity',.25+.75*t);
    });
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  reduced.addEventListener('change',schedule);compact.addEventListener('change',schedule);update();
})();
