/* Página inicial: contagem, semana horizontal, contador da meta e parallax */
(function(){
var T=function(s){return window.t?window.t(s):s};
var $=function(id){return document.getElementById(id)};
var rm=matchMedia("(prefers-reduced-motion:reduce)").matches;
var s0=new Date(2026,10,16),D=864e5;
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};

/* contagem decrescente no primeiro cartão */
var bn=$("bn"),bl=$("bl");
function renderCount(){
  if(!bn||!bl)return;
  var n=new Date(),num,key;
  if(n<s0){num=Math.ceil((s0-n)/D);key=num===1?"dia para o primeiro passo":"dias para o primeiro passo"}
  else{num=Math.min(7,Math.floor((n-s0)/D)+1)+"/7";key="dia da semana solidária"}
  bn.textContent=num;
  bl.textContent=T(key);
}

/* a semana: 7 cartões numa faixa que avança com o scroll */
var wkx=$("semana"),wkt=$("wkt"),wkb=$("wkb"),dist=0;
function renderWeek(){
  if(!wkt)return;
  var lang=document.documentElement.lang||"pt-PT",
      wf=new Intl.DateTimeFormat(lang,{weekday:"long"}),mf=new Intl.DateTimeFormat(lang,{month:"long"}),
      n=new Date(),idx=n<s0?-1:Math.floor((n-s0)/D),cols=["--sage","--amber","--mist","--sand"],h="";
  for(var i=0;i<7;i++){
    var d=new Date(2026,10,16+i),st,cls="";
    if(idx>=7||i<idx)st=T("Concluído");
    else if(i===idx){st=T("Hoje");cls=" now"}
    else st=T("Em breve");
    h+='<div class="wd" style="background:var('+cols[i%4]+')"><div class="wt"><small>'+wf.format(d)+'</small><span class="st'+cls+'">'+st+'</span></div><div class="wn">'+(16+i)+'</div><div class="wb"><small>'+mf.format(d)+'</small><small>'+(i+1)+'/7</small></div></div>';
  }
  wkt.innerHTML=h;
  size();
}
function size(){
  if(!wkx||!wkt||rm)return;
  dist=Math.max(0,wkt.offsetWidth-innerWidth);
  wkx.style.height=(innerHeight+dist)+"px";
  weekTick();
}
function weekTick(){
  if(!wkx||!wkt||rm)return;
  var r=wkx.getBoundingClientRect(),span=r.height-innerHeight,p=span>0?clamp(-r.top/span,0,1):0;
  wkt.style.transform="translate3d("+(-dist*p)+"px,0,0)";
  if(wkb)wkb.style.transform="scaleX("+p+")";
}

/* meta: o número sobe de 0 até 1,5 quando entra no ecrã */
var gn=$("gn"),gv=$("gv"),gb=$("gb"),goal=$("meta"),gval=0;
function showGoal(v){
  gval=v;
  if(gv)gv.textContent=v.toFixed(1).replace(".",T("1,5M").charAt(1)||",");
}
function countUp(){
  if(rm){showGoal(1.5);return}
  var t0=null,dur=1900;
  (function step(ts){
    if(t0===null)t0=ts;
    var k=clamp((ts-t0)/dur,0,1);
    showGoal(1.5*(1-Math.pow(1-k,3)));
    if(k<1)requestAnimationFrame(step);
  })(performance.now());
}
if(gn&&"IntersectionObserver"in window){
  var go=new IntersectionObserver(function(es){
    if(es[0].isIntersecting){go.disconnect();countUp()}
  },{threshold:.5});
  go.observe(gn);
}else showGoal(1.5);

function goalTick(){
  if(!goal||!gb)return;
  var r=goal.getBoundingClientRect();
  gb.style.transform="scaleX("+clamp((innerHeight*.9-r.top)/(r.height*.8),0,1)+")";
}

/* parallax do hero */
var mesh=document.querySelector(".stage>.mesh");
function heroTick(){if(mesh)mesh.style.setProperty("--py",Math.min(scrollY,innerHeight))}
if(mesh&&!rm)addEventListener("pointermove",function(e){
  mesh.style.setProperty("--mx",(e.clientX/innerWidth-.5).toFixed(3));
  mesh.style.setProperty("--my",(e.clientY/innerHeight-.5).toFixed(3));
});

/* scroll e resize */
var raf=0;
function tick(){weekTick();goalTick();heroTick()}
function req(){if(!raf)raf=requestAnimationFrame(function(){raf=0;tick()})}
addEventListener("scroll",req,{passive:true});
addEventListener("resize",function(){size();req()});
(document.fonts&&document.fonts.ready||Promise.resolve()).then(function(){size();tick()});

renderCount();renderWeek();tick();
addEventListener("langchange",function(){
  renderCount();renderWeek();
  if(gval)showGoal(gval);
});
})();
