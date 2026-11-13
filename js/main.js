(function(){
var rm=matchMedia("(prefers-reduced-motion:reduce)").matches,$=function(s){return [].slice.call(document.querySelectorAll(s))};

/* Contagem decrescente (só existe na página inicial) */
var cd=document.getElementById("cd");
if(cd){
  var s0=new Date(2026,10,16),e0=new Date(2026,10,23),n=new Date(),D=864e5;
  if(n<s0){var d=Math.ceil((s0-n)/D);cd.dataset.b=d;cd.dataset.s=(d===1?"dia":"dias")+" para o primeiro passo"}
  else if(n<e0){cd.dataset.b=(Math.floor((n-s0)/D)+1)+"/7";cd.dataset.s="dia da semana solidária"}
}

/* Entrada dos elementos ao aparecerem no ecrã */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.15});
$(".rv").forEach(function(el,i){el.style.transitionDelay=(i%3)*90+"ms";io.observe(el)});

/* Barras do ranking e cartões flutuantes (página inicial) */
setTimeout(function(){$(".rk i").forEach(function(b,i){setTimeout(function(){b.style.width=b.dataset.w+"%"},i*140)})},700);
if(!rm)addEventListener("pointermove",function(e){var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;$(".fc").forEach(function(c){var k=+c.dataset.d;c.style.translate=(x*k)+"px "+(y*k)+"px"})});

/* Bolha que se transforma de um .slot para o seguinte, dentro de cada página */
var slots=$(".slot"),blob=document.getElementById("blob"),bb=blob.querySelector("b"),bs=blob.querySelector("span"),cur=-1;
function rgb(h){return [1,3,5].map(function(i){return parseInt(h.substr(i,2),16)})}
function lerp(a,b,t){return a+(b-a)*t}
function size(sl,w,h){return Math.min(Math.min(w,h)*.42,w*.82/(sl.dataset.b.length*.58))}
function morph(){
  if(!slots.length)return;
  var line=innerHeight*.55,R=slots.map(function(s){var r=s.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height,cy:r.top+r.height/2}});
  var i=0;for(var k=0;k<R.length;k++){if(R[k].cy<=line)i=k}
  var j=Math.min(i+1,R.length-1),t=0;
  if(j!==i){var u=(line-R[i].cy)/(R[j].cy-R[i].cy);t=Math.max(0,Math.min(1,(u-.2)/.6));t=t*t*(3-2*t)}
  if(rm)t=t>.5?1:0;
  var a=R[i],b=R[j],sa=slots[i],sb=slots[j],ra=Math.min(+sa.dataset.r,a.w/2,a.h/2),rb=Math.min(+sb.dataset.r,b.w/2,b.h/2),ca=rgb(sa.dataset.c),cb=rgb(sb.dataset.c);
  blob.style.width=lerp(a.w,b.w,t)+"px";blob.style.height=lerp(a.h,b.h,t)+"px";
  blob.style.transform="translate("+lerp(a.x,b.x,t)+"px,"+lerp(a.y,b.y,t)+"px)";
  blob.style.borderRadius=lerp(ra,rb,t)+"px";
  blob.style.background="rgb("+ca.map(function(c,q){return Math.round(lerp(c,cb[q],t))}).join(",")+")";
  var near=t>.5?j:i;if(near!==cur){cur=near;bb.textContent=slots[near].dataset.b;bs.textContent=slots[near].dataset.s}
  var fs=lerp(size(sa,a.w,a.h),size(sb,b.w,b.h),t);bb.style.fontSize=fs+"px";bs.style.fontSize=Math.max(11,fs*.2)+"px";
}

/* Cabeçalho, barra de progresso e cartões empilhados */
var hd=document.getElementById("hd"),bar=document.getElementById("bar"),cards=$(".card");
function tick(){
  var de=document.documentElement;bar.style.transform="scaleX("+de.scrollTop/(de.scrollHeight-de.clientHeight||1)+")";
  hd.classList.toggle("sc",scrollY>10);
  cards.forEach(function(c,q){var nx=cards[q+1];if(!nx)return;var d=Math.max(0,Math.min(1,(innerHeight-nx.getBoundingClientRect().top)/innerHeight));c.style.transform="scale("+(1-d*.06)+")"});
  morph();
}
var raf=0;function req(){if(!raf)raf=requestAnimationFrame(function(){raf=0;tick()})}
addEventListener("scroll",req,{passive:true});addEventListener("resize",req);
(document.fonts&&document.fonts.ready||Promise.resolve()).then(tick);tick();
})();
