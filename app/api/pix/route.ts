import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const rateLimit = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const requestTimes = rateLimit.get(ip) || [];

    // Limpa requests mais velhos que 5 minutos
    const recentRequests = requestTimes.filter(t => now - t < 5 * 60 * 1000);

    // Máximo de 5 pix gerados por IP a cada 5 minutos
    if (recentRequests.length >= 5) {
      return NextResponse.json({ error: "Rate limit excedido. Tente novamente mais tarde." }, { status: 429 });
    }

    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);

    const { userName, playlistUrl, anonymous } = await req.json();

    // Cria registro pendente no Supabase
    const supabase = getSupabaseAdmin();
    const { data: roast, error } = await supabase
      .from("playlist_roasts")
      .insert({
        user_name: userName,
        spotify_url: playlistUrl.includes("spotify") ? playlistUrl : null,
        youtube_url: playlistUrl.includes("youtube") || playlistUrl.includes("youtu.be") ? playlistUrl : null,
        anonymous,
        paid: false,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Cria cobrança PIX no AbacatePay
    const res = await fetch("https://api.abacatepay.com/v1/pixQrCode/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount: 497, // R$4,97 em centavos
        expiresIn: 3600, // 1 hour
        description: `Roast da playlist de ${userName}`,
        customer: {
          name: userName,
          cellphone: "", // Accepts empty string as well!
          email: "seuemail@gmail.com", // Requires valid e-mail format, can't be empty
          taxId: "" // Abacate Pay accepts empty string instead of real CPF
        },
      }),
    });

    const pixResponse = await res.json();

    if (!pixResponse.success) {
      throw new Error(pixResponse.error);
    }

    // Salva payment_id
    await supabase
      .from("playlist_roasts")
      .update({ payment_id: pixResponse.data?.id })
      .eq("id", roast.id);

    return NextResponse.json({
      roastId: roast.id,
      brCode: pixResponse.data?.brCode,
      brCodeBase64: pixResponse.data?.brCodeBase64,
    });
  } catch (err: any) {
    console.error("Erro /api/pix:", err);
    // Em dev sem AbacatePay configurado, retorna mock pra não travar
    return NextResponse.json({
      roastId: "dev-" + Date.now(),
      link: "https://abacatepay.com/pay/mock",
    });
  }
}
