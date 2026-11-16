/* Rankings: classificacao.html, ranking-turmas.html, ranking-formandos.html e ranking-equipa.html.
   Soma os registos por formando e por turma, ordena do mais para o menos e desenha o gráfico e as listas.
   Este ficheiro tem de ser carregado depois do i18n.js e antes do main.js. */
(function(){
var T=function(s){return window.t?window.t(s):s};

/* ---------- DADOS ----------
   Por agora são DADOS DE TESTE (nomes e turmas inventados), só para ver as páginas a funcionar.
   Cada linha é um registo: formando, turma, passos e km (os km vêm no print do StepUp).
   Quando a base de dados tiver os registos lidos dos prints, basta encher a lista "registos"
   a partir do Supabase e pôr DADOS_DE_TESTE a false. O resto do ficheiro não muda. */
var DADOS_DE_TESTE=true;
var registos=[
  {nome:"Tomás Ferreira", turma:"PIPL0925", passos:74091, km:56.5},
  {nome:"Duarte Costa", turma:"PIPL0925", passos:81326, km:58.5},
  {nome:"Beatriz Mendes", turma:"PIPL0925", passos:61799, km:45.6},
  {nome:"Hugo Nunes", turma:"PIPL0925", passos:64446, km:47.6},
  {nome:"Rita Fonseca", turma:"PIPL0924", passos:42910, km:30.6},
  {nome:"Lúcia Correia", turma:"PIPL0924", passos:68643, km:48.0},
  {nome:"Nuno Gomes", turma:"PIPL0924", passos:80309, km:60.8},
  {nome:"Lara Dias", turma:"PIPL0924", passos:34896, km:25.6},
  {nome:"Jorge Dias", turma:"TPSI0925", passos:22085, km:16.8},
  {nome:"Alice Mendes", turma:"TPSI0925", passos:76640, km:56.3},
  {nome:"Vera Sousa", turma:"TPSI0925", passos:78863, km:56.2},
  {nome:"Olívia Teixeira", turma:"TPSI0925", passos:25011, km:17.0},
  {nome:"Sara Moreira", turma:"TPSI0925", passos:24607, km:17.2},
  {nome:"Carla Cardoso", turma:"TPSI0924", passos:77187, km:53.3},
  {nome:"Ana Gomes", turma:"TPSI0924", passos:57585, km:42.3},
  {nome:"Teresa Teixeira", turma:"TPSI0924", passos:54321, km:38.5},
  {nome:"Fábio Moreira", turma:"TPSI0924", passos:24027, km:16.7},
  {nome:"Joana Matos", turma:"GRSI0925", passos:43350, km:31.6},
  {nome:"Edgar Moreira", turma:"GRSI0925", passos:26221, km:19.0},
  {nome:"Mariana Mendes", turma:"GRSI0925", passos:46417, km:32.1},
  {nome:"Miguel Mendes", turma:"GRSI0925", passos:46590, km:33.9},
  {nome:"Válter Antunes", turma:"CISEG0925", passos:56929, km:42.9},
  {nome:"Luís Almeida", turma:"CISEG0925", passos:33429, km:23.6},
  {nome:"Íris Martins", turma:"CISEG0925", passos:67675, km:50.8},
  {nome:"Daniela Gomes", turma:"CISEG0925", passos:18418, km:13.4},
  {nome:"Rui Vieira", turma:"MECA0925", passos:75940, km:51.6},
  {nome:"Simão Fonseca", turma:"MECA0925", passos:70779, km:49.9},
  {nome:"Vasco Matos", turma:"MECA0925", passos:23558, km:16.1},
  {nome:"Filipa Antunes", turma:"MECA0925", passos:75250, km:54.9},
  {nome:"Diogo Ferreira", turma:"ELET0924", passos:67381, km:49.1},
  {nome:"Noémia Ribeiro", turma:"ELET0924", passos:24826, km:18.0},
  {nome:"Helena Ferreira", turma:"ELET0924", passos:52876, km:40.4},
  {nome:"Ricardo Martins", turma:"ELET0924", passos:76019, km:54.4},
  {nome:"Bruno Sousa", turma:"ELET0924", passos:80803, km:61.6},
  {nome:"Marta Vieira", turma:"AUTO0925", passos:56519, km:40.0},
  {nome:"André Sousa", turma:"AUTO0925", passos:79646, km:57.5},
  {nome:"Clara Ferreira", turma:"AUTO0925", passos:67959, km:49.0},
  {nome:"Xavier Gomes", turma:"AUTO0925", passos:26718, km:20.3},
  {nome:"Rafael Matos", turma:"SOLD0924", passos:45161, km:31.2},
  {nome:"Gonçalo Almeida", turma:"SOLD0924", passos:70802, km:53.0},
  {nome:"Sofia Correia", turma:"SOLD0924", passos:55018, km:38.6},
  {nome:"Leonor Martins", turma:"SOLD0924", passos:72038, km:48.8},
  {nome:"Inês Fonseca", turma:"LOGI0925", passos:44766, km:32.8},
  {nome:"Tiago Almeida", turma:"LOGI0925", passos:54498, km:40.7},
  {nome:"Samuel Mendes", turma:"LOGI0925", passos:69442, km:49.1},
  {nome:"Paulo Pinto", turma:"MULT0925", passos:59094, km:40.9},
  {nome:"Pedro Ribeiro", turma:"MULT0925", passos:71063, km:52.1},
  {nome:"Catarina Martins", turma:"MULT0925", passos:20835, km:15.0},
  {nome:"Tomás Ribeiro", turma:"MULT0925", passos:79944, km:57.9}
];

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

/* Soma os formandos de cada turma. Também do mais para o menos. */
function somarTurmas(formandos){
  var mapa={},lista=[];
  formandos.forEach(function(f){
    if(!mapa[f.turma]){mapa[f.turma]={turma:f.turma,passos:0,km:0,formandos:0};lista.push(mapa[f.turma])}
    mapa[f.turma].passos+=f.passos;
    mapa[f.turma].km+=f.km;
    mapa[f.turma].formandos++;
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
  caixa.textContent="";
  if(!turmas.length){caixa.appendChild(cria("p","vazio",T("Ainda não há dados.")));return}
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
    barra.style.setProperty("--p",primeiraVez?0:t.passos/topo);
    barra.dataset.p=t.passos/topo;
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

  /* as barras começam em zero e sobem até à altura certa (como as barras .rk do main.js) */
  if(primeiraVez)setTimeout(function(){
    [].slice.call(caixa.querySelectorAll(".barra")).forEach(function(b,i){
      setTimeout(function(){b.style.setProperty("--p",b.dataset.p)},Math.min(i,12)*70);
    });
  },700);
}

/* ---------- LISTA DE FORMANDOS ---------- */
/* comTurma=true: # · Nome · Turma · Passos · Distância   (ranking de toda a ATEC)
   comTurma=false: # · Nome · Passos · Distância          (dentro de uma turma) */
function desenharLista(caixa,formandos,comTurma){
  caixa.textContent="";
  if(!formandos.length){caixa.appendChild(cria("p","vazio",T("Ainda não há dados.")));return}
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
    quadrado.dataset.b=turmas.length;
    quadrado.dataset.s=T("turmas");
    if(!turmas.length){caixa.appendChild(cria("p","vazio",T("Ainda não há dados.")));return}
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
  if(!turma){
    intro.textContent=T("Turma não encontrada.");
    quadrado.dataset.b="0";
    quadrado.dataset.s="km · "+T("total da turma");
    return;
  }
  intro.textContent=T("Quem andou mais nesta turma, de 16 a 22 de novembro.");
  quadrado.dataset.b=milhares(turma.km);
  quadrado.dataset.s="km · "+T("total da turma");
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
    el.dataset.b=milhares(km);
    el.dataset.s="km · "+T("total acumulado pela ATEC Palmela");
  }

  /* ranking-turmas.html */
  el=document.getElementById("grafico");
  if(el){
    desenharGrafico(el,turmas);
    el=document.getElementById("turmas-quadrado");
    el.dataset.b=turmas.length;
    el.dataset.s=T("turmas em competição");
  }

  /* ranking-formandos.html */
  el=document.getElementById("formandos-lista");
  if(el){
    desenharLista(el,formandos,true);
    el=document.getElementById("formandos-quadrado");
    el.dataset.b=formandos.length;
    el.dataset.s=T("formandos a caminhar");
  }

  /* ranking-equipa.html */
  if(document.getElementById("equipa-lista"))desenharEquipa(formandos,turmas);

  /* aviso bem visível enquanto os números não forem reais (fica logo por baixo do título) */
  el=document.getElementById("aviso-teste");
  if(DADOS_DE_TESTE&&!el){
    var topo=document.querySelector("main .top");
    if(topo){
      el=cria("p","tag");
      el.id="aviso-teste";
      el.style.background="var(--amber)";
      topo.parentNode.insertBefore(el,topo.nextSibling);
    }
  }
  if(el)el.textContent=T("Dados de teste");

  primeiraVez=false;
}

desenhar();
/* Ao mudar de idioma: refaz os textos e os números (o main.js relê os quadrados logo a seguir) */
addEventListener("langchange",desenhar);
})();
