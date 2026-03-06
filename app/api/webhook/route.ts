import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("webhookSecret");

    // Validação simples de segurança do Webhook (prevenir bypass de pagamento)
    if (process.env.WEBHOOK_SECRET && token !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (body.event === "billing.paid") {
      const supabase = getSupabaseAdmin();

      // AbacatePay documentation payload structure for PIX:
      // { "event": "billing.paid", "data": { "pixQrCode": { "id": "pix_..." } } } ou { "billing": { "id": "bill_..." } }
      const paymentId = body.data?.pixQrCode?.id || body.data?.billing?.id || body.data?.id;

      if (paymentId) {
        await supabase.from("playlist_roasts").update({ paid: true }).eq("payment_id", paymentId);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}