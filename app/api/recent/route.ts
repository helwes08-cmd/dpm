import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const createWindow = (count: number | null = 4) => {
  const totalCount = count || 0;
  if (totalCount < 4) {
    return { start: 0, end: totalCount };
  }

  const start = Math.floor(Math.random() * (totalCount - 3));
  return { start, end: start + 3 };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { count } = await supabase
      .from("playlist_roasts")
      .select("*", { count: "exact", head: true })
      .eq("paid", true)
      .not("roast", "is", null);

    const { start, end } = createWindow(count);
    const { data, error } = await supabase
      .from("playlist_roasts")
      .select("*")
      .eq("paid", true)
      .not("roast", "is", null)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Erro ao buscar playlists recentes:", error);
      return NextResponse.json({ roasts: [] });
    }

    const roasts =
      data?.map((row) => ({
        id: row.id,
        userName: row.anonymous ? "Anônimo" : row.user_name,
        score: row.score,
        roast: row.roast,
        spotifyUrl: row.spotify_url,
        youtubeUrl: row.youtube_url,
        createdAt: row.created_at,
        tags: row.tags
      })) ?? [];

    return NextResponse.json({ roasts });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Erro de configuração do Supabase:", error);
    // Não quebrar o site — apenas não mostrar dados recentes
    return NextResponse.json({ roasts: [] });
  }
}

