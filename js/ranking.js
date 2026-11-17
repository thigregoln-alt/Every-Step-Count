/* Rankings: classificacao.html, ranking-turmas.html, ranking-formandos.html e ranking-equipa.html.
   Soma os registos por formando e por turma, ordena do mais para o menos e desenha o gráfico e as listas.
   Este ficheiro tem de ser carregado depois do i18n.js e antes do main.js. */
(function(){
var T=function(s){return window.t?window.t(s):s};

/* ---------- DADOS ----------
   Os registos vêm da tabela "registos" do Supabase (ver supabase/registos.sql).
   Cada linha é um registo: formando, turma, passos e km (os km vêm no print do StepUp).
   Não há dados inventados: se a tabela estiver vazia, as páginas dizem "Ainda não há dados." */
var registos=[];
var totais=[];  /* totais das turmas (ecrã de resumo do grupo no StepUp), da tabela "totais_turma" */
var estado="a carregar"; /* "a carregar" -> "pronto" ou "erro" */
var pedido=0;            /* número do último pedido feito ao Supabase (ver carregar) */

/* O Supabase devolve no máximo 1000 linhas de cada vez: pede-se por partes até ter todas.
   "count" é o total de linhas da tabela. O "order" serve para as partes não repetirem nem saltarem linhas. */
function buscar(sb,lista){
  return sb.from("registos").select("dia,nome,turma,passos,km",{count:"exact"}).order("id").range(lista.length,lista.length+999).then(function(r){
    if(r.error)throw r.error;
    r.data.forEach(function(l){
      lista.push({dia:l.dia,nome:l.nome,turma:l.turma,passos:Number(l.passos)||0,km:Number(l.km)||0});
    });
    if(r.data.length&&lista.length<r.count)return buscar(sb,lista);
  });
}

/* O mesmo para os totais das turmas (ver supabase/totais_turma.sql) */
function buscarTotais(sb,lista){
  return sb.from("totais_turma").select("dia,turma,passos,km,membros",{count:"exact"}).order("id").range(lista.length,lista.length+999).then(function(r){
    if(r.error)throw r.error;
    r.data.forEach(function(l){
      lista.push({dia:l.dia,turma:l.turma,passos:Number(l.passos)||0,km:Number(l.km)||0,membros:Number(l.membros)||0});
    });
    if(r.data.length&&lista.length<r.count)return buscarTotais(sb,lista);
  });
}

/* Vai buscar todos os registos e redesenha a página.
   Os dados novos vão para uma lista à parte: a página continua a mostrar os antigos até os novos chegarem. */
function carregar(){
  var sb=window.ATEC_SB,novos=[],novosTotais=[],meu=++pedido;
  if(!sb){estado="erro";desenhar();return}
  Promise.all([buscar(sb,novos),buscarTotais(sb,novosTotais)]).then(function(){
    if(meu!==pedido)return; /* entretanto já foi feito um pedido mais recente: este já não interessa */
    registos=novos;
    totais=novosTotais;
    estado="pronto";
    desenhar();
  },function(erro){
    console.error(erro);
    /* se já havia números no ecrã, ficam lá; o erro só aparece se ainda não havia nada */
    if(meu===pedido&&estado!=="pronto"){estado="erro";desenhar()}
  });
}

/* ---------- ATUALIZAR SOZINHO ----------
   Quando os registos de um print entram na base de dados, o Supabase (Realtime) avisa todas as
   páginas que estão abertas, e cada uma vai buscar os dados outra vez. Ninguém precisa de recarregar. */
var espera=null,jaLigou=false;
/* um print dá muitos registos de uma vez: espera-se 1 segundo depois do último aviso para buscar só uma vez */
function mudou(){
  clearTimeout(espera);
  espera=setTimeout(carregar,1000);
}
function ouvirMudancas(){
  var sb=window.ATEC_SB;
  if(!sb)return;
  sb.channel("ranking")
    .on("postgres_changes",{event:"*",schema:"public",table:"registos"},mudou)
    .on("postgres_changes",{event:"*",schema:"public",table:"totais_turma"},mudou)
    .subscribe(function(situacao){
      if(situacao!=="SUBSCRIBED")return;
      /* se a ligação caiu e voltou (telemóvel bloqueado, Wi-Fi a falhar), podem ter-se perdido avisos:
         busca-se tudo outra vez. Da primeira vez não é preciso, o carregar() já foi chamado. */
      if(jaLigou)carregar();
      jaLigou=true;
    });
}

/* Frase que fica no lugar da lista ou do gráfico quando não há nada para mostrar */
function avisoVazio(){
  if(estado==="a carregar")return cria("p","vazio espera",T("A carregar…"));
  if(estado==="erro")return cria("p","vazio",T("Não foi possível carregar os dados."));
  return cria("p","vazio",T("Ainda não há dados."));
}

/* Número grande dos quadrados: antes de os dados chegarem não se mostra um 0, que podia parecer verdadeiro */
function grande(n){
  if(estado==="a carregar")return "…";
  if(estado==="erro")return "–";
  return milhares(n);
}

/* ---------- SOMAS ---------- */
function porPassos(a,b){return b.passos-a.passos}

/* Um formando pode ter vários registos (ex.: um por dia): aqui ficam somados numa só linha.
   Devolve a lista do que tem mais passos para o que tem menos. */
function somarFormandos(){
  var mapa={},lista=[];
  registos.forEach(function(r){
    var chave=r.turma+"|"+r.nome;
    if(!mapa[chave]){mapa[chave]={nome:r.nome,turma:r.turma,passos:0,km:0};lista.push(mapa[chave])}
    mapa[chave].passos+=r.passos;
    mapa[chave].km+=r.km;
  });
  return lista.sort(porPassos);
}

/* Total de cada turma, dia a dia:
   - se o delegado enviou o ecrã de resumo do grupo nesse dia, conta o total do resumo;
   - senão, soma os formandos desse dia;
   - se houver as duas coisas, fica o maior (o resumo inclui quem não aparece na lista).
   Também do mais para o menos. */
function somarTurmas(formandos){
  var mapa={},lista=[],dias={};
  function turma(nome){
    if(!mapa[nome]){mapa[nome]={turma:nome,passos:0,km:0,formandos:0};lista.push(mapa[nome])}
    return mapa[nome];
  }

  registos.forEach(function(r){
    var chave=r.turma+"|"+r.dia;
    if(!dias[chave])dias[chave]={turma:r.turma,passos:0,km:0,resumo:null};
    dias[chave].passos+=r.passos;
    dias[chave].km+=r.km;
  });
  totais.forEach(function(t){
    var chave=t.turma+"|"+t.dia;
    if(!dias[chave])dias[chave]={turma:t.turma,passos:0,km:0,resumo:null};
    dias[chave].resumo=t;
  });
  Object.keys(dias).forEach(function(chave){
    var d=dias[chave],t=turma(d.turma);
    if(d.resumo&&d.resumo.passos>d.passos){t.passos+=d.resumo.passos;t.km+=d.resumo.km}
    else{t.passos+=d.passos;t.km+=d.km}
  });

  /* número de formandos: os que aparecem nas listas ou os membros do resumo (o maior) */
  formandos.forEach(function(f){turma(f.turma).formandos++});
  totais.forEach(function(t){
    var x=turma(t.turma);
    if(t.membros>x.formandos)x.formandos=t.membros;
  });
  return lista.sort(porPassos);
}

/* ---------- NÚMEROS ---------- */
/* A vírgula ou o ponto decimal depende do idioma: usa-se o mesmo truque do home.js ("1,5M" / "1.5M") */
function separadorDecimal(){return T("1,5M").charAt(1)==="."?".":","}

/* 84210 -> "84.210" (em inglês "84,210") */
function milhares(n){
  var texto=String(Math.round(n)),sep=separadorDecimal()===","?".":",",saida="";
  for(var i=0;i<texto.length;i++){
    if(i>0&&(texto.length-i)%3===0)saida+=sep;
    saida+=texto.charAt(i);
  }
  return saida;
}

/* 60.24 -> "60,2 km" */
function emKm(n){
  var partes=n.toFixed(1).split(".");
  return milhares(partes[0])+separadorDecimal()+partes[1]+" km";
}

function emPassos(n){return milhares(n)+" "+T("passos")}

/* ---------- AJUDAS PARA CRIAR ELEMENTOS ---------- */
/* Usa-se textContent (e não innerHTML) porque os nomes vão passar a vir dos prints */
function cria(tag,classe,texto){
  var el=document.createElement(tag);
  if(classe)el.className=classe;
  if(texto!==undefined)el.textContent=texto;
  return el;
}

/* A animação de entrada só acontece na primeira vez; ao mudar de idioma redesenha-se sem animar */
var primeiraVez=true;

/* ---------- GRÁFICO DAS TURMAS ---------- */
/* Topo do eixo: um número redondo que dê 4 divisões iguais (ex.: 284.000 -> 400.000) */
function topoDoEixo(maior){
  if(maior<=0)return 4;
  var divisao=maior/4,potencia=Math.pow(10,Math.floor(Math.log(divisao)/Math.LN10)),opcoes=[1,2,2.5,5,10];
  for(var i=0;i<opcoes.length;i++){
    if(opcoes[i]*potencia>=divisao)return opcoes[i]*potencia*4;
  }
  return maior;
}

function desenharGrafico(caixa,turmas){
  /* antes de apagar, guarda-se a altura que cada barra tinha e a posição do scroll para o lado:
     assim, quando chegam dados novos, as barras crescem a partir de onde estavam e a janela não salta */
  var antes={},janelaAntiga=caixa.querySelector(".barras-janela"),lado=janelaAntiga?janelaAntiga.scrollLeft:0;
  [].slice.call(caixa.querySelectorAll(".barra")).forEach(function(b){antes[b.dataset.turma]=b.dataset.p});
  caixa.textContent="";
  if(!turmas.length){caixa.appendChild(avisoVazio());return}
  var topo=topoDoEixo(turmas[0].passos);

  /* eixo da esquerda: passos, de 0 até ao topo */
  var eixo=cria("div","eixo");
  eixo.setAttribute("aria-hidden","true");
  eixo.appendChild(cria("small","eixo-titulo",T("passos")));
  for(var i=4;i>=0;i--)eixo.appendChild(cria("span","",milhares(topo*i/4)));

  /* barras: uma por turma, com o nome em cima; se não couberem, a janela desliza para o lado */
  var janela=cria("div","barras-janela"),barras=cria("ol","barras");
  janela.tabIndex=0;
  janela.setAttribute("role","group");
  janela.setAttribute("aria-label",T("Passos por turma"));
  turmas.forEach(function(t){
    var barra=cria("li","barra"),area=cria("div","barra-area");
    barra.style.setProperty("--p",antes[t.turma]||0);
    barra.dataset.p=t.passos/topo;
    barra.dataset.turma=t.turma;
    area.appendChild(cria("strong","barra-nome",t.turma));
    area.appendChild(cria("i","barra-cor"));
    barra.appendChild(area);
    barra.appendChild(cria("span","barra-passos",milhares(t.passos)));
    barra.appendChild(cria("span","barra-km",emKm(t.km)));
    barras.appendChild(barra);
  });
  janela.appendChild(barras);
  caixa.appendChild(eixo);
  caixa.appendChild(janela);

  janela.scrollLeft=lado;

  /* as barras sobem até à altura certa (como as barras .rk do main.js).
     Na primeira vez começam em zero e entram uma a seguir à outra; depois disso só se mexem as que mudaram. */
  var primeira=primeiraVez;
  setTimeout(function(){
    [].slice.call(caixa.querySelectorAll(".barra")).forEach(function(b,i){
      setTimeout(function(){b.style.setProperty("--p",b.dataset.p)},primeira?Math.min(i,12)*70:0);
    });
  },primeira?700:50);
}

/* ---------- LISTA DE FORMANDOS ---------- */
/* comTurma=true: # · Nome · Turma · Passos · Distância   (ranking de toda a ATEC)
   comTurma=false: # · Nome · Passos · Distância          (dentro de uma turma) */
function desenharLista(caixa,formandos,comTurma){
  caixa.textContent="";
  if(!formandos.length){caixa.appendChild(avisoVazio());return}
  var tabela=cria("table","lista"+(primeiraVez?" entra":"")),cabeca=cria("thead"),corpo=cria("tbody"),linha=cria("tr");
  linha.appendChild(cria("th","pos","#"));
  linha.appendChild(cria("th","",T("Nome")));
  if(comTurma)linha.appendChild(cria("th","turma",T("Turma")));
  linha.appendChild(cria("th","num",T("Passos")));
  linha.appendChild(cria("th","num",T("Distância")));
  cabeca.appendChild(linha);
  formandos.forEach(function(f,i){
    var tr=cria("tr"),pos=cria("td","pos"),nome=cria("td","nome",f.nome);
    tr.style.setProperty("--i",Math.min(i,14));
    pos.appendChild(cria("span","",i+1));
    /* no telemóvel a coluna Turma esconde-se e a turma aparece por baixo do nome */
    if(comTurma)nome.appendChild(cria("small","",f.turma));
    tr.appendChild(pos);
    tr.appendChild(nome);
    if(comTurma)tr.appendChild(cria("td","turma",f.turma));
    tr.appendChild(cria("td","num",milhares(f.passos)));
    tr.appendChild(cria("td","num",emKm(f.km)));
    corpo.appendChild(tr);
  });
  tabela.appendChild(cabeca);
  tabela.appendChild(corpo);
  caixa.appendChild(tabela);
}

/* ---------- DENTRO DA EQUIPA ---------- */
/* Sem ?turma= no endereço: lista de turmas para escolher (por ordem alfabética, para se encontrar depressa).
   Com ?turma=PIPL0925: os formandos dessa turma. */
function turmaEscolhida(){
  var m=/[?&]turma=([^&]*)/.exec(location.search);
  return m?decodeURIComponent(m[1].replace(/\+/g," ")):"";
}

function desenharEquipa(formandos,turmas){
  var caixa=document.getElementById("equipa-lista"),titulo=document.getElementById("equipa-titulo"),
      intro=document.getElementById("equipa-intro"),volta=document.getElementById("equipa-volta"),
      quadrado=document.getElementById("equipa-quadrado"),escolhida=turmaEscolhida();
  caixa.textContent="";

  if(!escolhida){
    quadrado.dataset.b=grande(turmas.length);
    quadrado.dataset.s=T("turmas");
    if(!turmas.length){caixa.appendChild(avisoVazio());return}
    var lista=cria("div","turmas"+(primeiraVez?" entra":""));
    turmas.slice().sort(function(a,b){return a.turma<b.turma?-1:1}).forEach(function(t,i){
      var a=cria("a","row");
      a.href="ranking-equipa.html?turma="+encodeURIComponent(t.turma);
      a.style.setProperty("--i",Math.min(i,14));
      a.appendChild(cria("h3","",t.turma));
      a.appendChild(cria("p","",t.formandos+" "+T(t.formandos===1?"formando":"formandos")));
      a.appendChild(cria("span","",emPassos(t.passos)+" · "+emKm(t.km)));
      lista.appendChild(a);
    });
    caixa.appendChild(lista);
    return;
  }

  var turma=null;
  turmas.forEach(function(t){if(t.turma===escolhida)turma=t});
  volta.href="ranking-equipa.html";
  volta.textContent=T("Todas as turmas");
  titulo.textContent=escolhida;
  quadrado.dataset.b=grande(turma?turma.km:0);
  quadrado.dataset.s="km · "+T("total da turma");
  /* só se pode dizer que a turma não existe depois de os dados chegarem */
  if(!turma&&estado==="pronto"){intro.textContent=T("Turma não encontrada.");return}
  intro.textContent=T("Quem andou mais nesta turma, de 16 a 22 de novembro.");
  desenharLista(caixa,formandos.filter(function(f){return f.turma===escolhida}),false);
}

/* ---------- DESENHAR A PÁGINA ---------- */
/* Os quadrados (.slot) são lidos pelo main.js: basta mudar o data-b (número grande) e o data-s (legenda).
   O número grande vai sem "km" para a legenda não ficar minúscula quando o total tiver muitos algarismos. */
function desenhar(){
  var formandos=somarFormandos(),turmas=somarTurmas(formandos),km=0,el;
  turmas.forEach(function(t){km+=t.km});

  /* classificacao.html: total real da ATEC Palmela */
  el=document.getElementById("total-atec");
  if(el){
    el.dataset.b=grande(km);
    el.dataset.s="km · "+T("total acumulado pela ATEC Palmela");
  }

  /* ranking-turmas.html */
  el=document.getElementById("grafico");
  if(el){
    desenharGrafico(el,turmas);
    el=document.getElementById("turmas-quadrado");
    el.dataset.b=grande(turmas.length);
    el.dataset.s=T("turmas em competição");
  }

  /* ranking-formandos.html */
  el=document.getElementById("formandos-lista");
  if(el){
    desenharLista(el,formandos,true);
    el=document.getElementById("formandos-quadrado");
    el.dataset.b=grande(formandos.length);
    el.dataset.s=T("formandos a caminhar");
  }

  /* ranking-equipa.html */
  if(document.getElementById("equipa-lista"))desenharEquipa(formandos,turmas);

  /* a animação de entrada fica guardada para quando os dados reais aparecem */
  if(estado==="pronto")primeiraVez=false;

  /* avisa o main.js para voltar a ler os quadrados (.slot), que podem ter números novos */
  window.dispatchEvent(new Event("dadoschange"));
}

/* Primeiro desenha-se a página sem dados ("A carregar…").
   O cliente do Supabase (window.ATEC_SB) é criado no main.js, que é carregado depois deste ficheiro:
   por isso só se vão buscar os dados quando a página acabar de carregar. */
desenhar();
addEventListener("DOMContentLoaded",function(){carregar();ouvirMudancas()});
/* Ao mudar de idioma: refaz os textos e os números (o main.js relê os quadrados logo a seguir) */
addEventListener("langchange",desenhar);
})();
