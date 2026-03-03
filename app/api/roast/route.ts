import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type RoastMetricsRaw = {
  originalidade?: number;
  influencia_do_algoritmo?: number;
  influenciaDoAlgoritmo?: number;
  energia_de_termino?: number;
  energiaDeTermino?: number;
  vergonha_alheia?: number;
  vergonhaAlheia?: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let spotifyUrl: string | undefined = body.spotifyUrl || body.spotify_url;
    let youtubeUrl: string | undefined = body.youtubeUrl || body.youtube_url;
    const anonymous: boolean = Boolean(body.anonymous);

    // Aceita um único campo "url" e detecta Spotify ou YouTube
    const singleUrl: string | undefined = body.url?.trim();
    if (singleUrl) {
      if (singleUrl.includes("open.spotify.com") || singleUrl.includes("spotify.com")) {
        spotifyUrl = singleUrl;
      } else if (singleUrl.includes("youtube.com") || singleUrl.includes("youtu.be")) {
        youtubeUrl = singleUrl;
      } else {
        spotifyUrl = singleUrl; // fallback: trata como contexto genérico
      }
    }

    if (!spotifyUrl && !youtubeUrl) {
      return NextResponse.json(
        { error: "Cole o link da playlist (Spotify ou YouTube)." },
        { status: 400 },
      );
    }

    const playlistContext = `
URLs fornecidas:
- Spotify: ${spotifyUrl || "nenhuma"}
- YouTube: ${youtubeUrl || "nenhuma"}
`.trim();

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um crítico musical sarcástico que faz roasts engraçados, exagerados e levemente cruéis, mas ainda assim divertidos, sobre playlists enviadas por usuários. Sempre responda em português brasileiro.",
        },
        {
          role: "user",
          content: `
O usuário enviou a(s) seguinte(s) playlist(s). Você NÃO tem acesso às músicas reais, então deduza o contexto pelo pouco que sabe (URLs, plataforma, vibe geral) e invente um roast criativo e engraçado.

Regras importantes:
- responda APENAS em JSON válido, sem texto fora do JSON
- use o seguinte formato:
{
  "score": number,                // score geral de 0 a 10
  "roast": string,                // texto sarcástico e engraçado, em até 3 parágrafos curtos
  "metrics": {
    "originalidade": number,          // 0 a 10
    "influencia_do_algoritmo": number,// 0 a 10
    "energia_de_termino": number,     // 0 a 10
    "vergonha_alheia": number        // 0 a 10
  }
}

Guia de tom:
- seja sarcástico, mas divertido
- faça piadas com gosto musical, vibe da playlist, clichês de algoritmo, energia de término de relacionamento, etc.
- NÃO seja ofensivo com grupos específicos, mantenha o humor focado no gosto musical da pessoa.

Agora gere o JSON para esta playlist:

${playlistContext}
        `.trim(),
        },
      ],
      temperature: 0.9,
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Resposta vazia da OpenAI.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Tentar extrair JSON de um bloco de código, se houver
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("Não foi possível interpretar a resposta da IA.");
      }
      parsed = JSON.parse(match[0]);
    }

    const metricsRaw: RoastMetricsRaw = parsed.metrics || {};

    const roastPayload = {
      score: typeof parsed.score === "number" ? parsed.score : Number(parsed.score) || 0,
      roast: String(parsed.roast || ""),
      spotifyUrl: spotifyUrl || null,
      youtubeUrl: youtubeUrl || null,
      metrics: {
        originalidade:
          typeof metricsRaw.originalidade === "number"
            ? metricsRaw.originalidade
            : Number(metricsRaw.originalidade ?? 0),
        influenciaDoAlgoritmo:
          typeof metricsRaw.influenciaDoAlgoritmo === "number"
            ? metricsRaw.influenciaDoAlgoritmo
            : Number(metricsRaw.influencia_do_algoritmo ?? 0),
        energiaDeTermino:
          typeof metricsRaw.energiaDeTermino === "number"
            ? metricsRaw.energiaDeTermino
            : Number(metricsRaw.energia_de_termino ?? 0),
        vergonhaAlheia:
          typeof metricsRaw.vergonhaAlheia === "number"
            ? metricsRaw.vergonhaAlheia
            : Number(metricsRaw.vergonha_alheia ?? 0),
      },
    };

    let supabaseId: string | undefined;
    let createdAt: string | undefined;

    try {
      if (!anonymous) {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
          .from("playlist_roasts")
          .insert({
            spotify_url: roastPayload.spotifyUrl,
            youtube_url: roastPayload.youtubeUrl,
            score: roastPayload.score,
            roast: roastPayload.roast,
            originalidade: roastPayload.metrics.originalidade,
            influencia_do_algoritmo: roastPayload.metrics.influenciaDoAlgoritmo,
            energia_de_termino: roastPayload.metrics.energiaDeTermino,
            vergonha_alheia: roastPayload.metrics.vergonhaAlheia,
          })
          .select("*")
          .single();

        if (error) {
          // eslint-disable-next-line no-console
          console.error("Erro ao salvar no Supabase:", error);
        } else if (data) {
          supabaseId = data.id;
          createdAt = data.created_at;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Erro de configuração do Supabase ou inserção:", error);
    }

    const responseRoast = {
      ...roastPayload,
      id: supabaseId,
      createdAt: createdAt ?? new Date().toISOString(),
    };

    return NextResponse.json({ roast: responseRoast });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro na rota /api/roast:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Algo deu errado ao gerar o roast da playlist. Verifique as chaves de API e tente novamente.",
      },
      { status: 500 },
    );
  }
}

