import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.event === "BILLING_PAID") {
      const supabase = getSupabaseAdmin();
      await supabase.from("playlist_roasts").update({ paid: true }).eq("payment_id", body.data.id);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}