import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { MercadoPagoConfig, Payment } from "mercadopago";
import crypto from "crypto";

// Configura Mercado Pago para verificação manual
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});
const paymentClient = new Payment(client);

export async function POST(req: NextRequest) {
  try {
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    // 1. Validação de Assinatura (Segurança)
    // Se o segredo estiver configurado, validamos a origem para evitar execuções forjadas
    if (process.env.WEBHOOK_SECRET && xSignature && xRequestId) {
      const parts = xSignature.split(",");
      let ts = "";
      let v1 = "";

      parts.forEach(part => {
        const [key, value] = part.split("=");
        if (key === "ts") ts = value;
        if (key === "v1") v1 = value;
      });

      const url = new URL(req.url);
      const dataId = url.searchParams.get("data.id");

      // Template: id:[data.id];request-id:[x-request-id];ts:[ts];
      let manifest = "";
      if (dataId) manifest += `id:${dataId};`;
      manifest += `request-id:${xRequestId};ts:${ts};`;

      const calculatedSignature = crypto
        .createHmac("sha256", process.env.WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");

      if (calculatedSignature !== v1) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Mercado Pago envia o ID do recurso em query params ou body dependendo da versão
    // Mas o padrão mais comum para notificações IPN/Webhooks é via body
    const body = await req.json();

    // Mercado Pago envia body.type == 'payment' para atualizações de pagamento
    if (body.type === "payment" || (body.action && body.action.startsWith("payment."))) {
      const paymentId = body.data?.id || body.resource?.split("/").pop();

      if (!paymentId) return NextResponse.json({ ok: true });

      // POR SEGURANÇA: Buscamos o status real na API do Mercado Pago
      // Isso evita que alguém forje um webhook para liberar o roast
      const mpPayment = await paymentClient.get({ id: paymentId });

      if (mpPayment.status === "approved") {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
          .from("playlist_roasts")
          .update({ paid: true })
          .eq("payment_id", paymentId.toString());

        if (error) console.error("Erro ao atualizar Supabase via Webhook:", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    // Mercado Pago espera 200/201 mesmo que dê erro no nosso processamento interno
    // para não ficar reenviando o mesmo webhook infinitamente se for erro de lógica
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
