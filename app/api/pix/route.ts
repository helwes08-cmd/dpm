import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { MercadoPagoConfig, Payment } from "mercadopago";

const rateLimit = new Map<string, number[]>();

// Configura Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});
const payment = new Payment(client);

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

    // Cria cobrança PIX no Mercado Pago
    // Nota: MP exige e-mail e identificação válida para PIX
    const body = {
      transaction_amount: 4.97,
      description: `Roast da playlist de ${userName}`,
      payment_method_id: "pix",
      payer: {
        email: "comprador@destruaminhaplaylist.com.br", // E-mail padrão para garantir a criação
        first_name: userName.split(" ")[0] || "Comprador",
        last_name: userName.split(" ").slice(1).join(" ") || "Playlist",
        identification: {
          type: "CNPJ",
          number: "51175207000138", // CNPJ fornecido (sanitizado)
        },
      },
    };

    const mpResponse = await payment.create({ body });

    if (!mpResponse.id) {
      throw new Error("Erro ao criar pagamento no Mercado Pago");
    }

    // Salva payment_id (ID numérico do MP)
    await supabase
      .from("playlist_roasts")
      .update({ payment_id: mpResponse.id.toString() })
      .eq("id", roast.id);

    return NextResponse.json({
      roastId: roast.id,
      brCode: mpResponse.point_of_interaction?.transaction_data?.qr_code,
      brCodeBase64: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64,
    });
  } catch (err: any) {
    console.error("Erro /api/pix:", err);
    // Erro detalhado se disponível na resposta do SDK
    const errorMsg = err.message || "Algo deu errado ao gerar o PIX.";

    // Retorno mock para não travar se as chaves não estiverem configuradas corretamente
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        roastId: "dev-" + Date.now(),
        brCode: "00020101021226810014br.gov.bcb.pix...",
        brCodeBase64: "iVBORw0KGgoAAAANSUhEUgA...", // Mock base64
      });
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
