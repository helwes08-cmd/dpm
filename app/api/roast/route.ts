import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAudioTracks } from "@/lib/audio";
import { providerPlaylistUrlSchema } from "@/lib/validation";

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
  "protagonista", "ilusaoAmorosa", "idadeJurassica", "riscoDeOverdose",
  "crenteOuQuase", "militante", "generico", "original", "energiaDeTermino",
  "vergonhaAlheia", "emo", "zonaLeste", "festaBoteco", "queen",
  "gostoMusicalDeSchrodinger", "provavelmenteCantaErrado", "gritosERiffs",
  "rebelde", "metaleiroDeApartamento", "djNoFogao", "sofrenciaParcelada",
  "sambaDeBoteco", "proibidao",
] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userName: string = (body.userName || body.user_name || "Anonimo").trim();
    const anonymous: boolean = Boolean(body.anonymous);
    const roastId: string | undefined = body.roastId;

    const raw: string = (body.url || body.spotifyUrl || body.spotify_url || "").trim();
    const validation = providerPlaylistUrlSchema.safeParse(raw);
    if (!validation.success) {
      // @ts-ignore
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    let spotifyUrl: string | undefined;
    let youtubeUrl: string | undefined;

    if (raw.includes("youtube.com") || raw.includes("youtu.be")) youtubeUrl = raw;
    else if (raw) spotifyUrl = raw;

    const playlistContext = await resolveAudioTracks(raw);

    const prompt = `Voce e uma IA critica musical brasileira - acida, criativa, engracada e sem papas na lingua.
Analise a playlist abaixo e destrua o gosto musical da pessoa com humor afiado e original.

${playlistContext}

Tags disponiveis: ${ALL_TAGS.join(", ")}

Regras: score de 0 a 10, impiedoso.`;

    const model = getLLM();
    const { output } = await generateText({
      model,
      prompt,
      output: Output.object({
        schema: z.object({
          score: z.number().min(0).max(10).describe("score de 0 a 10, impiedoso"),
          roast: z.string().describe("comentario devastador em portugues brasileiro, minimo 200 e maximo 350 caracteres, especifico sobre o estilo das musicas, sem cliches obvios"),
          tags: z.array(
            z.object({
              tag: z.enum(ALL_TAGS).describe("A tag aplicavel ao gosto musical"),
              score: z.number().min(0).max(10).describe("A aderência do usuario a essa tag (0 a 10)")
            })
          ).length(4).describe("Lista de EXATAMENTE 4 tags aplicaveis ao gosto musical da pessoa, selecione aleatoriamente 4 tags das que estão disponíveis")
        })
      })
    });

    const score = output.score;
    const roastText = output.roast;
    const tags: Record<string, number> = {};
    for (const item of output.tags) {
      tags[item.tag] = item.score;
    }

    let supabaseId: string | undefined;
    let createdAt: string | undefined;
    try {
      if (!anonymous || roastId) {
        const supabase = getSupabaseAdmin();

        if (roastId && !roastId.startsWith("dev-")) {
          // Atualiza o registro existente previamente criado pelo Pix
          const { data, error } = await supabase
            .from("playlist_roasts")
            .update({
              score,
              roast: roastText,
              tags: Object.keys(tags).length > 0 ? tags : null, // Evita empty object se vazio
            })
            .eq("id", roastId)
            .select("id, created_at")
            .single();

          if (error) console.error("Supabase update error:", error);
          else if (data) {
            supabaseId = data.id;
            createdAt = data.created_at;
          }
        } else if (!anonymous) {
          // Fallback para dev- mode ou sem processo de pix engatilhado
          const { data, error } = await supabase
            .from("playlist_roasts")
            .insert({
              user_name: userName,
              spotify_url: spotifyUrl ?? null,
              youtube_url: youtubeUrl ?? null,
              anonymous,
              score,
              roast: roastText,
              tags: Object.keys(tags).length > 0 ? tags : null,
              paid: true, // Auto aprova em dev local
            })
            .select("id, created_at")
            .single();

          if (error) console.error("Supabase insert error (dev mode):", error);
          else if (data) {
            supabaseId = data.id;
            createdAt = data.created_at;
          }
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
