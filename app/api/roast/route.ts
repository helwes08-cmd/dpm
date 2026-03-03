import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAudioTracks } from "@/lib/audio";

// ─── Troque o provider aqui: "openai" | "anthropic" | "google" ───────────────
function getLLM() {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    return anthropic("claude-opus-4-5");
  }
  if (provider === "google") {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    return google("gemini-1.5-flash");
  }
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return openai("gpt-4o-mini");
}

const ALL_TAGS = [
  "protagonista", "ilusao_amorosa", "idade_jurassica", "risco_de_overdose",
  "crente_ou_quase", "militante", "generico", "original", "energia_de_termino",
  "vergonha_alheia", "emo", "zona_leste", "festa_boteco", "queen",
  "gosto_musical_de_schrodinger", "provavelmente_canta_errado", "gritos_e_riffs",
  "rebelde", "metaleiro_de_apartamento", "dj_no_fogao", "sofrencia_parcelada",
  "samba_de_boteco", "proibidao",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userName: string = (body.userName || body.user_name || "Anonimo").trim();
    const anonymous: boolean = Boolean(body.anonymous);

    const raw: string = (body.url || body.spotifyUrl || body.spotify_url || "").trim();
    let spotifyUrl: string | undefined;
    let youtubeUrl: string | undefined;

    if (raw.includes("youtube.com") || raw.includes("youtu.be")) youtubeUrl = raw;
    else if (raw) spotifyUrl = raw;

    if (!spotifyUrl && !youtubeUrl) {
      return NextResponse.json({ error: "Cole o link da playlist." }, { status: 400 });
    }

    const playlistContext = await resolveAudioTracks(raw);

    const prompt = `Voce e uma IA critica musical brasileira - acida, criativa, engracada e sem papas na lingua.
Analise a playlist abaixo e destrua o gosto musical da pessoa com humor afiado e original.

${playlistContext}

Responda SOMENTE com JSON valido, sem texto fora do JSON:
{
  "score": 4.2,
  "roast": "comentario devastador em portugues brasileiro, minimo 200 e maximo 350 caracteres, especifico sobre o estilo das musicas, sem cliches obvios",
  "tags": {
    "tag1": 7.5,
    "tag2": 8.1,
    "tag3": 6.3,
    "tag4": 9.0,
    "tag5": 5.5,
    "tag6": 7.8,
    "tag7": 4.2,
    "tag8": 8.9
  }
}

Tags disponiveis - escolha EXATAMENTE 8:
${ALL_TAGS.join(", ")}

Regras: score de 0 a 10, impiedoso. EXATAMENTE 8 tags. Sem markdown fora do JSON.`;

    const model = getLLM();
    const { text } = await generateText({ model, prompt, maxOutputTokens: 700 });

    let parsed: any;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Resposta da IA nao e JSON valido.");
      parsed = JSON.parse(match[0]);
    }

    const score = typeof parsed.score === "number" ? parsed.score : Number(parsed.score) || 0;
    const roastText = String(parsed.roast || "");
    const tags: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed.tags ?? {})) {
      if (ALL_TAGS.includes(k)) tags[k] = Number(v) || 0;
    }

    let supabaseId: string | undefined;
    let createdAt: string | undefined;
    try {
      if (!anonymous) {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from("playlist_roasts")
          .insert({
            user_name: userName,
            spotify_url: spotifyUrl ?? null,
            youtube_url: youtubeUrl ?? null,
            anonymous,
            score,
            roast: roastText,
            tags,
          })
          .select("id, created_at")
          .single();
        if (error) console.error("Supabase insert error:", error);
        else if (data) {
          supabaseId = data.id;
          createdAt = data.created_at;
        }
      }
    } catch (err) {
      console.error("Supabase error:", err);
    }

    return NextResponse.json({
      roast: {
        id: supabaseId,
        userName,
        score,
        roast: roastText,
        tags,
        spotifyUrl: spotifyUrl ?? null,
        youtubeUrl: youtubeUrl ?? null,
        createdAt: createdAt ?? new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Erro /api/roast:", error);
    return NextResponse.json({ error: error?.message || "Algo deu errado." }, { status: 500 });
  }
}
