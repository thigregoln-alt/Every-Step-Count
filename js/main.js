(function(){
var rm=matchMedia("(prefers-reduced-motion:reduce)").matches,$=function(s){return [].slice.call(document.querySelectorAll(s))};

/* Cliente Supabase partilhado por todas as páginas + botão do cabeçalho com o nome da turma */
window.ATEC_SB=(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY&&window.SUPABASE_URL.indexOf("O-TEU-PROJETO")<0&&window.SUPABASE_ANON_KEY.indexOf("COLA")!==0)?window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY):null;
var hb=document.querySelector("header>.btn");
if(hb&&window.ATEC_SB)window.ATEC_SB.auth.getSession().then(function(r){
  var s=r.data&&r.data.session;if(!s)return;
  var m=s.user.user_metadata||{},nm=String(m["class"]||m.name||(s.user.email||"").split("@")[0]||"").trim();
  if(!nm)return;
  hb.textContent="";hb.dataset.user=nm;hb.setAttribute("aria-label",nm);hb.href="submeter.html";
});

/* Contagem decrescente (só existe na página inicial) */
var T=function(s){return window.t?window.t(s):s};
var cd=document.getElementById("cd");
function countdown(){
  if(!cd)return;
  var s0=new Date(2026,10,16),e0=new Date(2026,10,23),n=new Date(),D=864e5;
  if(n<s0){var d=Math.ceil((s0-n)/D);cd.dataset.b=d;cd.dataset.s=T(d===1?"dia para o primeiro passo":"dias para o primeiro passo")}
  else if(n<e0){cd.dataset.b=(Math.floor((n-s0)/D)+1)+"/7";cd.dataset.s=T("dia da semana solidária")}
}
countdown();

/* Entrada dos elementos ao aparecerem no ecrã */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.15});
$(".rv").forEach(function(el,i){el.style.transitionDelay=(i%3)*90+"ms";io.observe(el)});

/* Barras do ranking e cartões flutuantes (página inicial) */
setTimeout(function(){$(".rk i").forEach(function(b,i){setTimeout(function(){b.style.width=b.dataset.w+"%"},i*140)})},700);
if(!rm)addEventListener("pointermove",function(e){var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;$(".fc").forEach(function(c){var k=+c.dataset.d;c.style.translate=(x*k)+"px "+(y*k)+"px"})});

/* Bolha que se transforma de um .slot para o seguinte, dentro de cada página */
var slots=$(".slot"),blob=document.getElementById("blob"),bb=blob&&blob.querySelector("b"),bs=blob&&blob.querySelector("span"),cur=-1;
function rgb(h){return [1,3,5].map(function(i){return parseInt(h.substr(i,2),16)})}
function lerp(a,b,t){return a+(b-a)*t}
function size(sl,w,h){return Math.min(Math.min(w,h)*.42,w*.82/(sl.dataset.b.length*.58))}
function morph(){
  if(!blob||!slots.length)return;
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
  var near=t>.5?j:i;if(near!==cur){cur=near;bb.textContent=T(slots[near].dataset.b);bs.textContent=T(slots[near].dataset.s)}
  var fs=lerp(size(sa,a.w,a.h),size(sb,b.w,b.h),t);bb.style.fontSize=fs+"px";bs.style.fontSize=Math.max(11,fs*.2)+"px";
}

/* Cabeçalho, barra de progresso e cartões empilhados */
var hd=document.getElementById("hd"),bar=document.getElementById("bar"),cards=$(".card");
function tick(){
  var de=document.documentElement;bar.style.transform="scaleX("+de.scrollTop/(de.scrollHeight-de.clientHeight||1)+")";
  hd.classList.toggle("sc",scrollY>10);
  cards.forEach(function(c,q){var nx=cards[q+1];if(!nx)return;var d=Math.max(0,Math.min(1,(innerHeight-nx.getBoundingClientRect().top)/innerHeight));c.style.transform="scale("+(1-d*.06)+")"});
  morph();routeTick();
}
var raf=0;function req(){if(!raf)raf=requestAnimationFrame(function(){raf=0;tick()})}
addEventListener("scroll",req,{passive:true});addEventListener("resize",req);
(document.fonts&&document.fonts.ready||Promise.resolve()).then(tick);tick();

/* Ao mudar de idioma, refaz os textos da bolha e da contagem */
addEventListener("langchange",function(){
  countdown();
  cur=-1;tick();
});

/* Rota desenhada com o scroll (só existe em como-funciona.html) */
var route=document.getElementById("route"),rsvg=document.getElementById("rsvg"),stops=$(".stop"),rp=null,rl=0;
function buildRoute(){
  if(!route||!rsvg||!stops.length)return;
  var R=route.getBoundingClientRect(),w=R.width,h=R.height;
  var ms=stops.map(function(s){var r=s.querySelector(".mk").getBoundingClientRect();return{x:r.left+r.width/2-R.left,y:r.top+r.height/2-R.top}});
  var d="M"+ms[0].x+" "+ms[0].y;
  for(var i=1;i<ms.length;i++){
    var a=ms[i-1],b=ms[i],dy=(b.y-a.y)*.5,sw=Math.min(w*.14,90)*(i%2?1:-1);
    d+=" C"+(a.x+sw)+" "+(a.y+dy)+","+(b.x-sw)+" "+(b.y-dy)+","+b.x+" "+b.y;
  }
  rsvg.setAttribute("viewBox","0 0 "+w+" "+h);
  rsvg.innerHTML='<path d="'+d+'" fill="none" stroke="rgba(19,32,27,.16)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 12"/><path id="rp" d="'+d+'" fill="none" stroke="#1F3D32" stroke-width="4" stroke-linecap="round"/>';
  rp=document.getElementById("rp");rl=rp.getTotalLength();rp.style.strokeDasharray=rl;
  routeTick();
}
function routeTick(){
  if(!rp||!route)return;
  var R=route.getBoundingClientRect(),line=innerHeight*.6,p=Math.max(0,Math.min(1,(line-R.top)/R.height));
  rp.style.strokeDashoffset=rm?0:rl*(1-p);
  stops.forEach(function(s){var r=s.querySelector(".mk").getBoundingClientRect();s.classList.toggle("on",rm||r.top+r.height/2<line)});
}
if(route){
  buildRoute();
  addEventListener("resize",buildRoute);
  addEventListener("load",buildRoute);
  addEventListener("langchange",function(){setTimeout(buildRoute,50)});
  (document.fonts&&document.fonts.ready||Promise.resolve()).then(buildRoute);
}

/* Login / criar conta (só existe em login.html) */
var auth=document.getElementById("auth");
if(auth){
  var forms=$(".af");
  var accessCode="";try{accessCode=sessionStorage.getItem("acesso")||""}catch(e){}
  var unlocked=!!accessCode;
  var sb=window.ATEC_SB;
  /* Já tem sessão iniciada: não volta a pedir código nem login */
  if(sb)sb.auth.getSession().then(function(r){if(r.data&&r.data.session)location.replace("submeter.html")});
  var show=function(name){if(!unlocked)name="gate";forms.forEach(function(f){f.hidden=f.id!=="f-"+name})};
  $("[data-go]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();show(a.dataset.go);history.replaceState(null,"","#"+a.dataset.go)})});
  show(location.hash==="#signup"?"signup":"login");
  /* Código de acesso: verificado no servidor (função check_access_code no Supabase). Não existe neste ficheiro. */

  var fails=0,lockUntil=0,rpcErr="";

  function checkCode(c){
    if(Date.now()<lockUntil)return Promise.resolve("lock");
    if(!sb){rpcErr=window.supabase?"configuração do Supabase em falta":"a biblioteca do Supabase não carregou";return Promise.resolve("nosupport")}
    return sb.rpc("check_access_code",{code:c.trim().toUpperCase()}).then(function(res){
      if(res.error){rpcErr=res.error.message||"";console.error(res.error);return "nosupport"}
      if(res.data===true){fails=0;return "ok"}
      if(++fails>=5){fails=0;lockUntil=Date.now()+6e4;return "lock"}
      return "bad";
    });
  }
  forms.forEach(function(f){
    f.addEventListener("submit",function(e){
      e.preventDefault();
      var msg=f.querySelector(".msg"),bad=null;
      [].slice.call(f.querySelectorAll("input")).forEach(function(i){
        var v=i.value.trim(),ko=!v||(i.type==="email"&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))||(i.name==="password"&&f.id==="f-signup"&&v.length<8);
        i.classList.toggle("err",ko);if(ko&&!bad)bad=i;
      });
      msg.classList.remove("ok");
      if(bad){msg.textContent=T("Verifica os campos assinalados.");bad.focus();return}
      /* TODO: ligar ao backend de autenticação */
      if(f.id==="f-gate"){
        var ci=f.elements.access;
        checkCode(ci.value).then(function(r){
          if(r!=="ok"){
            ci.classList.add("err");ci.focus();
            msg.textContent=T(r==="lock"?"Demasiadas tentativas. Tenta novamente dentro de 1 minuto.":r==="nosupport"?"Não foi possível validar o código. Tenta novamente.":"Código de acesso inválido.");
            if(r==="nosupport"&&rpcErr)msg.textContent+=" ("+rpcErr+")";
            return;
          }
          accessCode=ci.value.trim().toUpperCase();unlocked=true;try{sessionStorage.setItem("acesso",accessCode)}catch(x){}
          msg.textContent="";show(location.hash==="#signup"?"signup":"login");
          var nf=document.querySelector(".af:not([hidden]) input");if(nf)nf.focus();
        });
        return;
      }
      if(!sb){msg.textContent=T("Não foi possível ligar ao servidor.");return}
      var fd=function(n){return f.elements[n].value.trim()},btn=f.querySelector("button[type=submit]");
      btn.disabled=true;
      var req=f.id==="f-login"
        ?sb.auth.signInWithPassword({email:fd("email"),password:f.elements.password.value})
        :sb.auth.signUp({email:fd("email"),password:f.elements.password.value,options:{data:{name:fd("name"),"class":fd("class"),access_code:accessCode}}});
      req.then(function(r){
        btn.disabled=false;
        if(r.error){
          var m=(r.error.message||"").toLowerCase();
          msg.textContent=T(m.indexOf("invalid login")>=0?"Email ou palavra-passe incorretos.":m.indexOf("not confirmed")>=0?"Confirma o teu email antes de entrar.":m.indexOf("already")>=0?"Já existe uma conta com este email.":m.indexOf("database error")>=0?"Código de acesso inválido.":"Não foi possível concluir. Tenta novamente.");
          if(!/invalid login|not confirmed|already|database error/.test(m)){console.error(r.error);msg.textContent+=" ("+r.error.message+")"}
          return;
        }
        msg.classList.add("ok");
        if(f.id==="f-signup"&&!r.data.session){msg.textContent=T("Conta criada. Verifica o teu email para confirmar.");return}
        msg.textContent=T(f.id==="f-login"?"Sessão iniciada.":"Conta criada com sucesso.");
        setTimeout(function(){location.href="submeter.html"},900);
      },function(){btn.disabled=false;msg.textContent=T("Não foi possível ligar ao servidor.")});
    });
  });
}
})();
