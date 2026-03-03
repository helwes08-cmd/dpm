import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("playlist_roasts")
      .select(
        "id, score, roast, spotify_url, youtube_url, created_at, originalidade, influencia_do_algoritmo, energia_de_termino, vergonha_alheia",
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Erro ao buscar playlists recentes:", error);
      return NextResponse.json({ recent: [] });
    }

    const recent =
      data?.map((row) => ({
        id: row.id,
        score: row.score,
        roast: row.roast,
        spotifyUrl: row.spotify_url,
        youtubeUrl: row.youtube_url,
        createdAt: row.created_at,
        metrics: {
          originalidade: row.originalidade ?? 0,
          influenciaDoAlgoritmo: row.influencia_do_algoritmo ?? 0,
          energiaDeTermino: row.energia_de_termino ?? 0,
          vergonhaAlheia: row.vergonha_alheia ?? 0,
        },
      })) ?? [];

    return NextResponse.json({ recent });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Erro de configuração do Supabase:", error);
    // Não quebrar o site — apenas não mostrar dados recentes
    return NextResponse.json({ recent: [] });
  }
}

