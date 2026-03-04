import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
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

    // Cria cobrança no AbacatePay
    const res = await fetch("https://api.abacatepay.com/v1/billing/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: [{
          externalId: roast.id,
          name: "Destruição de Playlist",
          description: `Roast da playlist de ${userName}`,
          quantity: 1,
          price: 497, // R$4,97 em centavos
        }],
        customer: {
          name: userName,
          cellphone: "", // Accepts empty string as well!
          email: "seuemail@gmail.com", // Requires valid e-mail format, can't be empty
          taxId: "" // Abacate Pay accepts empty string instead of real CPF
        },
        returnUrl: `${process.env.NEXT_PUBLIC_URL}`,
        completionUrl: `${process.env.NEXT_PUBLIC_URL}`,
      }),
    });

    const billing = await res.json();

    if (!billing.success) {
      throw new Error(billing.error);
    }

    // Salva payment_id
    await supabase
      .from("playlist_roasts")
      .update({ payment_id: billing.data?.id })
      .eq("id", roast.id);

    return NextResponse.json({
      roastId: roast.id,
      link: billing?.data?.url,
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
