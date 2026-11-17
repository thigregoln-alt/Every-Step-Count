/* Submeter pontuação (só existe em submeter.html):
   caixa de upload de prints (arrastar, clicar ou colar) + envio para o Supabase. */
(function(){
var T=function(s){return window.t?window.t(s):s};
var f=document.getElementById("f-up");
if(!f)return;

var sb=window.ATEC_SB||null;
var MAX=4,SIZE=8*1024*1024,EXT={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
var drop=document.getElementById("drop"),input=document.getElementById("file"),thumbs=document.getElementById("thumbs");
var msg=f.querySelector(".msg"),btn=f.querySelector("button[type=submit]"),items=[],user=null;

/* Saudação com o nome da turma (vem dos dados da conta) */
var sec=document.getElementById("up"),tag=document.createElement("span");
tag.className="tag";tag.hidden=true;f.insertBefore(tag,f.firstChild);
function greet(){
  var m=(user&&user.user_metadata)||{},nm=(m["class"]||m.name||"").trim();
  tag.textContent=nm?T("Olá,")+" "+nm:"";tag.hidden=!nm;
}
addEventListener("langchange",greet);

/* Entrada: espera que a transição de página acabe e só então anima o cartão e os campos */
function whenClear(cb){
  var L=document.getElementById("step-transition"),done=false,mo=null;
  function go(){if(done)return;done=true;if(mo)mo.disconnect();cb()}
  if(!L||!L.classList.contains("active"))return go();
  mo=new MutationObserver(function(){if(!L.classList.contains("active"))go()});
  mo.observe(L,{attributes:true,attributeFilter:["class"]});
  setTimeout(go,2500);
}
function enter(){
  [].slice.call(sec.querySelectorAll(".af>*")).forEach(function(el,i){el.style.setProperty("--i",i)});
  sec.classList.add("go");
}
if(!matchMedia("(prefers-reduced-motion:reduce)").matches)addEventListener("pointermove",function(e){
  sec.style.setProperty("--mx",(e.clientX/innerWidth-.5)*70);
  sec.style.setProperty("--my",(e.clientY/innerHeight-.5)*70);
},{passive:true});

/* O formulário fica logo visível, com ou sem sessão iniciada */
function ready(s){
  if(s){user=s.user;greet()}
  whenClear(enter);
}
if(sb)sb.auth.getSession().then(function(r){ready(r.data&&r.data.session)},function(){ready(null)});
else ready(null);

/* Dia: já não há campo; usa-se a data de hoje no momento do envio */
function hoje(){
  var p2=function(n){return (n<10?"0":"")+n},now=new Date();
  return now.getFullYear()+"-"+p2(now.getMonth()+1)+"-"+p2(now.getDate());
}

function say(s,ok){msg.classList.toggle("ok",!!ok);msg.textContent=s?T(s):""}

function render(){
  thumbs.innerHTML="";
  items.forEach(function(it,i){
    var li=document.createElement("li"),img=document.createElement("img"),x=document.createElement("button");
    img.src=it.url;img.alt="";
    x.type="button";x.textContent="×";x.setAttribute("aria-label",T("Remover"));
    x.addEventListener("click",function(){URL.revokeObjectURL(it.url);items.splice(i,1);render();say("")});
    li.appendChild(img);li.appendChild(x);thumbs.appendChild(li);
  });
}

function add(list){
  var err="";
  [].slice.call(list).forEach(function(file){
    if(!EXT[file.type]||file.size>SIZE){err="Ficheiro inválido. Usa PNG, JPG ou WebP até 8 MB.";return}
    if(items.length>=MAX){err="Podes enviar no máximo 4 prints.";return}
    items.push({file:file,url:URL.createObjectURL(file)});
  });
  render();say(err);
}

/* Caixa: clicar, teclado, arrastar e colar */
drop.addEventListener("click",function(e){if(e.target!==input)input.click()});
drop.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();input.click()}});
input.addEventListener("change",function(){add(input.files);input.value=""});
["dragenter","dragover"].forEach(function(n){drop.addEventListener(n,function(e){e.preventDefault();drop.classList.add("over")})});
["dragleave","drop"].forEach(function(n){drop.addEventListener(n,function(e){e.preventDefault();drop.classList.remove("over")})});
drop.addEventListener("drop",function(e){if(e.dataTransfer)add(e.dataTransfer.files)});
document.addEventListener("paste",function(e){
  if(f.hidden||!e.clipboardData||!e.clipboardData.files.length)return;
  add(e.clipboardData.files);
});

/* Ler um print com o Gemini (Edge Function "ler-print" no Supabase).
   A função lê, confere e grava na tabela registos; devolve o que gravou. */
function lerPrint(path){
  return sb.functions.invoke("ler-print",{body:{caminho:path}}).then(function(r){
    if(!r.error)return r.data;
    /* erro da função: tenta mostrar a mensagem que ela mandou */
    var ctx=r.error.context;
    if(ctx&&ctx.json)return ctx.json().then(function(d){throw new Error(d&&d.erro?d.erro:r.error.message)},function(){throw r.error});
    throw r.error;
  });
}

/* Enviar: prints para o Storage, a linha na tabela submissoes e depois o Gemini lê cada print */
f.addEventListener("submit",function(e){
  e.preventDefault();
  if(!items.length){say("Escolhe pelo menos um print.");return}
  if(!sb){say("Não foi possível ligar ao servidor.");return}

  btn.disabled=true;say("A enviar…");
  var paths=[],chain=Promise.resolve();
  items.forEach(function(it,i){
    chain=chain.then(function(){
      var path=(user?user.id:"anon")+"/"+Date.now()+"-"+i+"."+EXT[it.file.type];
      return sb.storage.from("prints").upload(path,it.file,{contentType:it.file.type}).then(function(r){
        if(r.error)throw r.error;
        paths.push(path);
      });
    });
  });
  chain.then(function(){
    return sb.from("submissoes").insert({dia:hoje(),prints:paths});
  }).then(function(r){
    if(r.error)throw r.error;
    items.forEach(function(it){URL.revokeObjectURL(it.url)});
    items=[];render();

    /* um print de cada vez, para não mandar tudo ao Gemini ao mesmo tempo */
    say("A ler os prints…");
    var lidos=0,ler=Promise.resolve();
    paths.forEach(function(p){
      ler=ler.then(function(){return lerPrint(p)}).then(function(d){
        lidos+=(d&&d.formandos)?d.formandos.length:0;
      });
    });
    return ler.then(function(){
      btn.disabled=false;
      if(lidos===0){say("Não consegui ler passos nos prints. Confirma que é o ecrã do StepUp.");return}
      msg.classList.add("ok");
      msg.textContent=T("Pontuação enviada. Obrigado!")+" "+T("Formandos lidos:")+" "+lidos;
    },function(err){
      /* os prints já ficaram guardados; só a leitura falhou */
      console.error(err);
      btn.disabled=false;
      msg.classList.remove("ok");
      msg.textContent=T("Os prints foram guardados, mas não foi possível lê-los.")+(err&&err.message?" ("+err.message+")":"");
    });
  }).catch(function(err){
    console.error(err);
    btn.disabled=false;
    msg.classList.remove("ok");
    msg.textContent=T("Não foi possível enviar. Tenta novamente.")+(err&&err.message?" ("+err.message+")":"");
  });
});

/* Terminar sessão: limpa a sessão guardada e volta ao login */
var out=document.getElementById("out");
if(out)out.addEventListener("click",function(){
  var go=function(){location.href="login.html"};
  (sb?sb.auth.signOut():Promise.resolve()).then(go,go);
});

/* Ao mudar de idioma os avisos são limpos pelo i18n; nada mais a fazer */
})();
