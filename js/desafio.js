(() => {
  const scene = document.querySelector('.step-story');
  if (!scene) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height:620px)');
  const header = document.querySelector('header');
  const copies = [...scene.querySelectorAll('.story-copy article')];
  const group = scene.querySelector('.story-shapes');
  const controls = scene.querySelector('.story-controls');
  const range = controls.querySelector('input');
  const back = controls.querySelector('[data-story-back]');
  const next = controls.querySelector('[data-story-next]');
  const inner = scene.querySelector('.dish-inner');
  const tools = scene.querySelector('.dish-tools');
  const clamp = x => Math.max(0,Math.min(1,x));
  const ease = x => {x=clamp(x);return x*x*(3-2*x)};
  const mix = (a,b,t) => a+(b-a)*t;
  let top=85, progress=0, queued=false;
  const shapes = Array.from({length:12},(_,i)=>{
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    group.append(path);
    // Each sole becomes a segment of the plate. Equal point counts keep the morph continuous.
    const sole=[],rim=[];
    for(let j=0;j<24;j++){
      const a=j/24*Math.PI*2;
      sole.push([Math.cos(a)*(25+7*Math.sin(a)),Math.sin(a)*54]);
      const outer=j<12;
      const q=outer?j/11:(23-j)/11;
      const theta=(i+q)/12*Math.PI*2-Math.PI/2;
      const r=outer?185:169;
      rim.push([300+Math.cos(theta)*r,300+Math.sin(theta)*r]);
    }
    return {path,sole,rim};
  });
  function isStatic(){return reduced.matches||short.matches}
  function distance(){return Math.max(1,scene.offsetHeight-(innerHeight-top))}
  function draw(p){
    const gather=ease(p*2), dish=ease((p-.48)/.52);
    shapes.forEach(({path,sole,rim},i)=>{
      const x0=i%2?335:255,y0=i%2?335:250;
      const x1=135+(i%4)*110,y1=165+Math.floor(i/4)*130;
      const x=mix(x0,x1,gather),y=mix(y0,y1,gather);
      const angle=mix(i%2?.2:-.2,(i%2?.15:-.15),gather);
      const d=sole.map(([sx,sy],j)=>{
        const px=x+sx*Math.cos(angle)-sy*Math.sin(angle);
        const py=y+sx*Math.sin(angle)+sy*Math.cos(angle);
        return `${j?'L':'M'}${mix(px,rim[j][0],dish).toFixed(2)} ${mix(py,rim[j][1],dish).toFixed(2)}`;
      }).join('')+'Z';
      path.setAttribute('d',d);
      path.style.opacity=i<2?1:ease(gather*1.7-i*.045);
    });
    inner.style.opacity=ease((p-.7)/.3)*.5;
    tools.style.opacity=ease((p-.8)/.2);
    const active=p<.25?0:p<.75?1:2;
    copies.forEach((copy,i)=>{
      const delta=p*2-i;
      const opacity=clamp(1-Math.abs(delta)*1.8);
      copy.style.opacity=isStatic()?1:opacity;
      copy.style.transform=isStatic()?'none':`translateY(${-delta*65}px)`;
      copy.style.visibility=isStatic()||opacity>.001?'visible':'hidden';
      if(isStatic())copy.removeAttribute('aria-hidden');else copy.setAttribute('aria-hidden',String(i!==active));
    });
    range.value=Math.round(p*1000);
    range.style.setProperty('--scrub',`${p*100}%`);
    range.setAttribute('aria-valuetext',['O teu passo','A força da turma','A refeição'][active]);
    back.disabled=p<.01;next.disabled=p>.99;
    scene.style.backgroundColor=`rgb(${Math.round(mix(191,246,dish))},${Math.round(mix(210,247,dish))},${Math.round(mix(187,243,dish))})`;
  }
  function update(){
    queued=false;
    progress=isStatic()?1:clamp((top-scene.getBoundingClientRect().top)/distance());
    draw(progress);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update)}}
  function layout(){
    top=Math.ceil(header?.getBoundingClientRect().height||85);
    scene.style.setProperty('--story-top',`${top}px`);
    scene.classList.toggle('story-active',!isStatic());
    controls.hidden=isStatic();
    schedule();
  }
  function seek(value,smooth){
    if(isStatic())return;
    const y=scrollY+scene.getBoundingClientRect().top-top+clamp(value)*distance();
    scrollTo({top:y,behavior:smooth?'smooth':'instant'});
    if(!smooth){progress=clamp(value);draw(progress)}
  }
  range.addEventListener('input',()=>seek(Number(range.value)/1000,false));
  back.addEventListener('click',()=>seek(progress>.52?.5:0,true));
  next.addEventListener('click',()=>seek(progress<.48?.5:1,true));
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',layout);
  reduced.addEventListener('change',layout);short.addEventListener('change',layout);
  if(header&&typeof ResizeObserver!=='undefined')new ResizeObserver(layout).observe(header);
  layout();
})();
