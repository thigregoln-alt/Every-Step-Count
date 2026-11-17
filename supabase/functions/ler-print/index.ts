// ============================================================
// Every Step Count · ATEC Palmela — Edge Function "ler-print"
//
// O site envia os caminhos dos prints (1 ou 2) que já estão no Storage (pasta "prints").
// Esta função:
//   1. vê quem está a pedir (tem de ter sessão iniciada)
//   2. vai buscar cada print ao Storage
//   3. manda cada print ao Gemini, com um esquema que diz exatamente que campos devolver
//   4. o Gemini diz se a foto é um print do StepUp ou outra coisa qualquer
//   5. se alguma foto não for válida, NÃO grava nada e diz ao site qual foi
//   6. se todas forem válidas, confere os números e grava na tabela "registos"
//      (upsert: o mesmo formando no mesmo dia não conta a dobrar)
//
// A chave do Gemini NUNCA está no site: fica no Supabase como segredo GEMINI_API_KEY.
// O modelo pode ser mudado sem mexer no código com o segredo GEMINI_MODEL.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_FOTOS = 2;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function resposta(dados: unknown, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}


//------------------------------------------------------------
// O que o Gemini tem de devolver (e nada mais).
// Nada de valores fixos: o tipo da foto, os nomes, passos, km e turma vêm todos do print.
//------------------------------------------------------------
const TIPOS = ["print_stepup", "outra_app", "outra_coisa", "ilegivel"];

const ESQUEMA = {
  type: "object",
  properties: {
    tipo: {
      type: "string",
      enum: TIPOS,
      description:
        "print_stepup: ecrã da app StepUp com nomes e passos legíveis. " +
        "outra_app: print de outra app de passos ou de saúde (Samsung Health, Google Fit, Strava, etc.). " +
        "outra_coisa: qualquer outra imagem (foto, selfie, documento, meme, ecrã que não é de passos). " +
        "ilegivel: parece o StepUp, mas está desfocado, cortado ou não dá para ler os números.",
    },
    turma: {
      type: "string",
      description: "Nome do grupo/turma que aparece no topo do print. Vazio se não aparecer.",
    },
    data: {
      type: "string",
      description: "Data a que os passos dizem respeito, no formato AAAA-MM-DD, se aparecer no print. Vazio se não aparecer.",
    },
    formandos: {
      type: "array",
      description: "Uma entrada por cada pessoa visível no print. Vazio se tipo não for print_stepup.",
      items: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome da pessoa exatamente como aparece no print" },
          passos: { type: "integer", description: "Número de passos, sem pontos nem espaços" },
          km: { type: "number", description: "Distância em quilómetros. Se estiver em metros, converte para km. 0 se não aparecer." },
        },
        required: ["nome", "passos"],
      },
    },
  },
  required: ["tipo", "formandos"],
};

const PEDIDO =
  "Recebes uma imagem enviada por um delegado de turma. Deveria ser um print da app StepUp " +
  "com o ranking de passos de um grupo (turma). " +
  "Primeiro diz que tipo de imagem é. Só se for print_stepup, lê cada pessoa que aparece " +
  "e devolve o nome, os passos e a distância em km. " +
  "Não inventes nada: se um nome ou um número não se consegue ler, deixa essa pessoa de fora. " +
  "Não incluas totais do grupo, só pessoas.";


//------------------------------------------------------------
// Confere o que o Gemini devolveu para UMA foto.
// Devolve { valido, tipo, turma, data, formandos }.
//------------------------------------------------------------
export function limpar(lido: any) {
  const formandos: { nome: string; passos: number; km: number }[] = [];
  const tipo = TIPOS.includes(lido?.tipo) ? lido.tipo : "outra_coisa";

  if (tipo === "print_stepup" && Array.isArray(lido.formandos)) {
    const vistos = new Map<string, number>();
    for (const f of lido.formandos) {
      const nome = String(f?.nome ?? "").replace(/\s+/g, " ").trim();
      const passos = Number(f?.passos);
      let km = Number(f?.km ?? 0);

      if (nome === "" || nome.length > 80) continue;
      if (!Number.isInteger(passos) || passos < 0 || passos > 500000) continue;
      if (!Number.isFinite(km) || km < 0 || km > 500) km = 0;
      km = Math.round(km * 10) / 10;

      // o mesmo nome duas vezes no mesmo print: fica o maior
      const chave = nome.toLowerCase();
      if (vistos.has(chave)) {
        const i = vistos.get(chave)!;
        if (passos > formandos[i].passos) formandos[i] = { nome, passos, km };
        continue;
      }
      vistos.set(chave, formandos.length);
      formandos.push({ nome, passos, km });
    }
  }

  const turma = String(lido?.turma ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(String(lido?.data ?? "")) ? String(lido.data) : "";

  // diz que é do StepUp mas não se leu ninguém: conta como ilegível
  if (tipo === "print_stepup" && formandos.length === 0) {
    return { valido: false, tipo: "ilegivel", turma, data, formandos };
  }
  return { valido: tipo === "print_stepup", tipo, turma, data, formandos };
}


// Bytes da imagem -> texto base64 (é assim que o Gemini recebe imagens)
export function paraBase64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return btoa(bin);
}


// Data de hoje em Portugal (AAAA-MM-DD)
export function hojeLisboa(agora = new Date()) {
  return agora.toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
}

// Usa a data do print só se for de hoje ou dos 6 dias antes; senão usa hoje
export function escolherDia(dataPrint: string, agora = new Date()) {
  const hoje = hojeLisboa(agora);
  if (dataPrint === "") return hoje;
  const dias = (Date.parse(hoje) - Date.parse(dataPrint)) / 86400000;
  if (dias >= 0 && dias <= 6) return dataPrint;
  return hoje;
}


// Junta as linhas das fotos: a mesma pessoa no mesmo dia (ex.: aparece nos 2 prints) fica uma vez, com o maior valor
type Linha = { dia: string; turma: string; nome: string; passos: number; km: number };
export function juntar(linhas: Linha[]) {
  const mapa = new Map<string, Linha>();
  for (const l of linhas) {
    const chave = l.dia + "|" + l.nome.toLowerCase();
    const antes = mapa.get(chave);
    if (!antes || l.passos > antes.passos) mapa.set(chave, l);
  }
  return [...mapa.values()];
}


//------------------------------------------------------------
// Chamada ao Gemini (uma foto)
//------------------------------------------------------------
async function perguntarGemini(imagemBase64: string, tipo: string) {
  const chave = Deno.env.get("GEMINI_API_KEY");
  if (!chave) throw new Error("Falta o segredo GEMINI_API_KEY no Supabase.");
  const modelo = Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash";

  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: tipo, data: imagemBase64 } },
            { text: PEDIDO },
          ],
        }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: ESQUEMA,
        },
      }),
    },
  );

  const corpo = await r.json().catch(() => null);
  if (!r.ok) {
    throw new Error("Gemini respondeu " + r.status + ": " + (corpo?.error?.message ?? "sem detalhe"));
  }
  const texto = corpo?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("O Gemini não devolveu JSON válido.");
  }
}


//------------------------------------------------------------
// Pedido do site: { caminhos: ["<id do user>/....png", ...] }
//------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return resposta({ erro: "Usa POST." }, 405);

  try {
    // 1. Cliente com a sessão de quem pediu (as regras da base de dados aplicam-se a ele)
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: u, error: erroUser } = await sb.auth.getUser();
    if (erroUser || !u?.user) return resposta({ erro: "Sessão inválida. Faz login outra vez." }, 401);
    const user = u.user;

    // Caminhos: 1 ou 2, todos na pasta do próprio utilizador
    const corpo = await req.json().catch(() => ({}));
    const caminhos: string[] = Array.isArray(corpo?.caminhos) ? corpo.caminhos.map(String) : [];
    if (caminhos.length === 0) return resposta({ erro: "Não enviaste nenhum print." }, 400);
    if (caminhos.length > MAX_FOTOS) return resposta({ erro: "Podes enviar no máximo " + MAX_FOTOS + " prints." }, 400);
    if (caminhos.some((c) => !c.startsWith(user.id + "/"))) return resposta({ erro: "Print inválido." }, 400);

    // 2, 3 e 4. Cada foto: Storage -> Gemini -> conferir (as fotos são lidas ao mesmo tempo)
    const fotos = await Promise.all(caminhos.map(async (caminho) => {
      const { data: ficheiro, error } = await sb.storage.from("prints").download(caminho);
      if (error || !ficheiro) throw new Error("Não encontrei o print no Storage.");
      const bytes = new Uint8Array(await ficheiro.arrayBuffer());
      return limpar(await perguntarGemini(paraBase64(bytes), ficheiro.type || "image/png"));
    }));

    // 5. Alguma foto não é válida: não grava nada e diz qual foi (foto 1, foto 2)
    const invalidas = fotos
      .map((f, i) => ({ foto: i + 1, tipo: f.tipo, valido: f.valido }))
      .filter((f) => !f.valido)
      .map(({ foto, tipo }) => ({ foto, tipo }));
    if (invalidas.length > 0) return resposta({ valido: false, invalidas });

    // Turma: a da conta do delegado; se a conta não tiver, a que aparece no print
    const turmaConta = String(user.user_metadata?.["class"] ?? "").trim();
    const turma = turmaConta || fotos.map((f) => f.turma).find((t) => t !== "") || "";
    if (turma === "") return resposta({ erro: "Não sei de que turma é este print. Põe a turma na tua conta." }, 400);

    // 6. Gravar (o trigger da tabela põe a turma em maiúsculas e anota quem enviou)
    const linhas = juntar(fotos.flatMap((f) => {
      const dia = escolherDia(f.data);
      return f.formandos.map((p) => ({ dia, turma, nome: p.nome, passos: p.passos, km: p.km }));
    }));
    const { error: erroGravar } = await sb.from("registos").upsert(linhas, { onConflict: "dia,turma,nome" });
    if (erroGravar) throw new Error("Erro ao gravar: " + erroGravar.message);

    return resposta({ valido: true, turma, formandos: linhas.map(({ dia, nome, passos, km }) => ({ dia, nome, passos, km })) });
  } catch (e) {
    console.error(e);
    return resposta({ erro: e instanceof Error ? e.message : String(e) }, 500);
  }
});
