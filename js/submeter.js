/* Submeter pontuação (só existe em submeter.html):
   caixa de upload (arrastar, clicar ou colar) + envio para o Supabase.
   O delegado envia 2 ficheiros: o print do resumo do grupo do StepUp e a tabela que o StepUp gera (CSV/Excel). */
(function(){
var T=function(s){return window.t?window.t(s):s};
var f=document.getElementById("f-up");
if(!f)return;

var sb=window.ATEC_SB||null;
var MAX=2,SIZE=8*1024*1024,EXT={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
var XLSX_TIPO="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/* Que ficheiro é: imagem pelo tipo; tabela pela extensão
   (no Windows um .csv às vezes vem como "application/vnd.ms-excel" ou sem tipo) */
function tipoDe(file){
  if(EXT[file.type])return {ext:EXT[file.type],tipo:file.type,imagem:true};
  var nome=(file.name||"").toLowerCase();
  if(/\.csv$/.test(nome))return {ext:"csv",tipo:"text/csv",imagem:false};
  if(/\.xlsx$/.test(nome))return {ext:"xlsx",tipo:XLSX_TIPO,imagem:false};
  return null;
}
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
    var li=document.createElement("li"),x=document.createElement("button");
    if(it.url){
      var img=document.createElement("img");
      img.src=it.url;img.alt="";
      li.appendChild(img);
    }else{
      /* tabela (CSV/Excel): não há imagem, mostra o nome do ficheiro */
      var fi=document.createElement("div");
      fi.className="fich";
      fi.innerHTML="<b>"+it.ext.toUpperCase()+"</b>";
      var nm=document.createElement("span");
      nm.textContent=it.file.name;
      fi.appendChild(nm);
      li.appendChild(fi);
    }
    x.type="button";x.textContent="×";x.setAttribute("aria-label",T("Remover"));
    x.addEventListener("click",function(){if(it.url)URL.revokeObjectURL(it.url);items.splice(i,1);render();say("")});
    li.appendChild(x);thumbs.appendChild(li);
  });
}

function add(list){
  var err="";
  [].slice.call(list).forEach(function(file){
    var t=tipoDe(file);
    if(!t||file.size>SIZE){err="Ficheiro inválido. Usa PNG, JPG ou WebP para o print e CSV ou XLSX para a tabela, até 8 MB.";return}
    if(items.length>=MAX){err="Podes enviar no máximo 2 ficheiros: o print e a tabela.";return}
    items.push({file:file,ext:t.ext,tipo:t.tipo,url:t.imagem?URL.createObjectURL(file):""});
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

/* Ler os ficheiros com o Gemini (Edge Function "ler-print" no Supabase).
   A função vê se é o print e a tabela do StepUp, confere se os números batem certo e só então grava. */
function lerPrints(paths){
  return sb.functions.invoke("ler-print",{body:{caminhos:paths}}).then(function(r){
    if(!r.error)return r.data;
    /* erro da função: tenta mostrar a mensagem que ela mandou */
    var ctx=r.error.context;
    if(ctx&&ctx.json)return ctx.json().then(function(d){throw new Error(d&&d.erro?d.erro:r.error.message)},function(){throw r.error});
    throw r.error;
  });
}

/* O que dizer quando um ficheiro não serve (o tipo vem do Gemini) */
var MOTIVO={
  outra_app:"é de outra app, não do StepUp.",
  outra_coisa:"não é o print nem a tabela do StepUp.",
  ilegivel:"não dá para ler. Envia um ficheiro mais nítido."
};
function fotosInvalidas(lista){
  return lista.map(function(x){
    return T("Ficheiro")+" "+x.foto+": "+T(MOTIVO[x.tipo]||MOTIVO.outra_coisa);
  }).join(" ");
}

/* O que dizer quando a tabela não bate certo com o print do resumo (vem da função) */
var NAO_BATE={
  falta_resumo:"Falta o print do resumo do grupo do StepUp. A tabela só é aceite junto com ele.",
  falta_tabela:"Falta a tabela do StepUp (CSV ou Excel) com os passos de cada aluno.",
  passos:"Os passos da tabela não batem certo com o StepUp. A tabela pode ter sido alterada.",
  membros:"A tabela tem mais alunos do que o grupo do StepUp. A tabela pode ter sido alterada.",
  km:"Os quilómetros da tabela não batem certo com o StepUp. A tabela pode ter sido alterada.",
  datas:"As datas da tabela não são as mesmas do print do StepUp.",
  turma:"A tabela é de outro grupo do StepUp."
};
function naoBate(d){
  var texto=T(NAO_BATE[d.motivo]||NAO_BATE.falta_resumo);
  if(d.tabela!=null&&d.stepup!=null)texto+=" ("+T("Tabela:")+" "+d.tabela+" · StepUp: "+d.stepup+")";
  return texto;
}

function erro(texto,err){
  console.error(err);
  btn.disabled=false;
  msg.classList.remove("ok");
  msg.textContent=T(texto)+(err&&err.message?" ("+err.message+")":"");
}

/* Enviar: prints para o Storage -> o Gemini verifica e lê -> só se forem válidos fica a submissão */
f.addEventListener("submit",function(e){
  e.preventDefault();
  if(items.length<2){say("Envia os 2 ficheiros: o print do resumo do StepUp e a tabela do StepUp (CSV ou Excel).");return}
  if(!sb){say("Não foi possível ligar ao servidor.");return}

  btn.disabled=true;say("A enviar…");
  var paths=[],chain=Promise.resolve();
  items.forEach(function(it,i){
    chain=chain.then(function(){
      var path=(user?user.id:"anon")+"/"+Date.now()+"-"+i+"."+it.ext;
      return sb.storage.from("prints").upload(path,it.file,{contentType:it.tipo}).then(function(r){
        if(r.error)throw r.error;
        paths.push(path);
      });
    });
  });

  chain.then(function(){
    say("A verificar os ficheiros…");
    return lerPrints(paths).then(function(d){
      /* algum ficheiro não serve ou a tabela não bate certo: não grava nada, os ficheiros ficam na caixa para trocar */
      if(!d||d.valido!==true){
        btn.disabled=false;
        msg.classList.remove("ok");
        msg.textContent=d&&d.motivo?naoBate(d):fotosInvalidas((d&&d.invalidas)||[]);
        return;
      }
      return sb.from("submissoes").insert({dia:hoje(),prints:paths}).then(function(r){
        if(r.error)throw r.error;
        items.forEach(function(it){if(it.url)URL.revokeObjectURL(it.url)});
        items=[];render();
        btn.disabled=false;
        msg.classList.add("ok");
        var lido=[];
        if(d.formandos&&d.formandos.length)lido.push(T("Formandos lidos:")+" "+d.formandos.length);
        /* ecrã de resumo do grupo: mostra o total da turma que foi lido */
        (d.totais||[]).forEach(function(t){lido.push(T("Total da turma:")+" "+t.passos+" "+T("passos"))});
        msg.textContent=T("Pontuação enviada. Obrigado!")+" "+lido.join(" · ");
      });
    },function(err){erro("Não foi possível ler os ficheiros. Tenta novamente.",err)});
  }).catch(function(err){erro("Não foi possível enviar. Tenta novamente.",err)});
});

/* Terminar sessão: limpa a sessão guardada e volta ao login */
var out=document.getElementById("out");
if(out)out.addEventListener("click",function(){
  var go=function(){location.href="login.html"};
  (sb?sb.auth.signOut():Promise.resolve()).then(go,go);
});

/* Ao mudar de idioma os avisos são limpos pelo i18n; nada mais a fazer */
})();
