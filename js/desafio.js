(() => {
  const scene=document.querySelector('.step-story');
  if(!scene)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const short=matchMedia('(max-height:700px)');
  const header=document.querySelector('header');
  const copies=[...scene.querySelectorAll('.story-copy article')];
  const chips=[scene.querySelector('.chip-left'),scene.querySelector('.chip-right')];
  const value=scene.querySelector('.sum-value');
  const label=scene.querySelector('.sum-label');
  const detail=scene.querySelector('.sum-detail');
  const destination=scene.querySelector('.submission-destination');
  const format=new Intl.NumberFormat('pt-PT',{minimumFractionDigits:1,maximumFractionDigits:1});
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
  let top=85,pending=false;
  const staticMode=()=>reduced.matches||short.matches;
  function update(){
    pending=false;
    const p=staticMode()?1:clamp((top-scene.getBoundingClientRect().top)/Math.max(1,scene.offsetHeight-innerHeight+top));
    const a=ease((p-.15)/.12),b=ease((p-.27)/.13),c=ease((p-.5)/.12),d=ease((p-.62)/.13);
    const total=4.2+3.8*a+5*b+18*c+24*d;
    const phase=p<.15?0:p<.5?1:p<.82?2:3;
    value.textContent=format.format(total);
    label.textContent=['O teu registo','A tua turma','ATEC Palmela','Contributo a submeter'][phase];
    detail.textContent=['6 000 passos neste exemplo','4,2 + 3,8 + 5 km','13 + 18 + 24 km','Exemplo · 55 km reunidos'][phase];
    copies.forEach((copy,i)=>{
      const visible=staticMode()||i===phase;
      copy.style.opacity=visible?1:0;copy.style.visibility=visible?'visible':'hidden';
      if(staticMode())copy.removeAttribute('aria-hidden');else copy.setAttribute('aria-hidden',String(!visible));
    });
    chips.forEach((chip,i)=>{
      const team=p>=.5;
      chip.querySelector('span').textContent=team?['Turma B','Turma C'][i]:['Colega A','Colega B'][i];
      chip.querySelector('strong').innerHTML=team?['+ 18 <small>km</small>','+ 24 <small>km</small>'][i]:['+ 3,8 <small>km</small>','+ 5 <small>km</small>'][i];
      const start=team?[.5,.62][i]:[.15,.27][i];
      const t=clamp((p-start)/.12);
      const opacity=(p<start||phase===3||staticMode())?0:Math.min(1,t*6)*(1-ease((t-.65)/.35));
      chip.style.opacity=opacity;
      chip.style.transform=`translate(${(i?-1:1)*t*45}px,${t*110}px) scale(${1-t*.25})`;
    });
    const sent=ease((p-.82)/.18);
    scene.style.setProperty('--total-y',`${-sent*28}px`);
    scene.style.setProperty('--line-opacity',phase===1||phase===2?.35:0);
    destination.style.opacity=sent;
    destination.style.transform=`translateY(${20*(1-sent)}px)`;
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
  function layout(){top=Math.ceil(header?.getBoundingClientRect().height||85);scene.style.setProperty('--story-top',`${top}px`);scene.classList.toggle('story-active',!staticMode());schedule()}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',layout);
  reduced.addEventListener('change',layout);short.addEventListener('change',layout);
  if(header&&typeof ResizeObserver!=='undefined')new ResizeObserver(layout).observe(header);
  layout();
})();
