// ============================================================
// Every Step Count · ATEC Palmela — Edge Function "ler-print"
//
// O site envia o caminho de um print que já está no Storage (pasta "prints").
// Esta função:
//   1. vê quem está a pedir (tem de ter sessão iniciada)
//   2. vai buscar o print ao Storage
//   3. manda o print ao Gemini, com um esquema que diz exatamente que campos devolver
//   4. confere o que o Gemini devolveu (deita fora o que não faz sentido)
//   5. grava na tabela "registos" (upsert: o mesmo formando no mesmo dia não conta a dobrar)
//   6. devolve ao site o que foi gravado, para o delegado ver
//
// A chave do Gemini NUNCA está no site: fica no Supabase como segredo GEMINI_API_KEY.
// O modelo pode ser mudado sem mexer no código com o segredo GEMINI_MODEL.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

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
// Nada de valores fixos: os nomes, passos, km e turma vêm todos do print.
//------------------------------------------------------------
const ESQUEMA = {
  type: "object",
  properties: {
    e_stepup: {
      type: "boolean",
      description: "true se a imagem é um ecrã da app StepUp com passos de pessoas; false se não é",
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
      description: "Uma entrada por cada pessoa visível no print",
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
  required: ["e_stepup", "formandos"],
};

const PEDIDO =
  "Isto é um print da app StepUp com o ranking de passos de um grupo (turma). " +
  "Lê cada pessoa que aparece e devolve o nome, os passos e a distância em km. " +
  "Não inventes nada: se um nome ou um número não se consegue ler, deixa essa pessoa de fora. " +
  "Não incluas totais do grupo, só pessoas. " +
  "Se a imagem não for da app StepUp, devolve e_stepup a false e a lista vazia.";


//------------------------------------------------------------
// Confere o que o Gemini devolveu.
// Só passa o que tem nome, passos inteiros e valores possíveis para um dia/semana.
//------------------------------------------------------------
export function limpar(lido: any) {
  const formandos: { nome: string; passos: number; km: number }[] = [];
  if (!lido || lido.e_stepup !== true || !Array.isArray(lido.formandos)) {
    return { turma: "", data: "", formandos };
  }

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

  const turma = String(lido.turma ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(String(lido.data ?? "")) ? String(lido.data) : "";
  return { turma, data, formandos };
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


//------------------------------------------------------------
// Chamada ao Gemini
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
// Pedido do site
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

    // 2. Caminho do print: tem de estar na pasta do próprio utilizador
    const corpo = await req.json().catch(() => ({}));
    const caminho = String(corpo?.caminho ?? "");
    if (!caminho.startsWith(user.id + "/")) return resposta({ erro: "Print inválido." }, 400);

    const { data: ficheiro, error: erroFicheiro } = await sb.storage.from("prints").download(caminho);
    if (erroFicheiro || !ficheiro) return resposta({ erro: "Não encontrei o print no Storage." }, 404);

    // 3 e 4. Gemini + conferir
    const bytes = new Uint8Array(await ficheiro.arrayBuffer());
    const tipo = ficheiro.type || "image/png";
    const lido = limpar(await perguntarGemini(paraBase64(bytes), tipo));

    if (lido.formandos.length === 0) {
      return resposta({ turma: "", dia: "", formandos: [], aviso: "Não consegui ler passos neste print." });
    }

    // Turma: a da conta do delegado; se a conta não tiver, a que aparece no print
    const turmaConta = String(user.user_metadata?.["class"] ?? "").trim();
    const turma = turmaConta || lido.turma;
    if (turma === "") return resposta({ erro: "Não sei de que turma é este print. Põe a turma na tua conta." }, 400);

    const dia = escolherDia(lido.data);

    // 5. Gravar (o trigger da tabela põe a turma em maiúsculas e anota quem enviou)
    const linhas = lido.formandos.map((f) => ({ dia, turma, nome: f.nome, passos: f.passos, km: f.km }));
    const { error: erroGravar } = await sb.from("registos").upsert(linhas, { onConflict: "dia,turma,nome" });
    if (erroGravar) throw new Error("Erro ao gravar: " + erroGravar.message);

    // 6. Devolver o que ficou gravado
    return resposta({ turma, dia, formandos: lido.formandos });
  } catch (e) {
    console.error(e);
    return resposta({ erro: e instanceof Error ? e.message : String(e) }, 500);
  }
});
