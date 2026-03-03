import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ paid: false });

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("playlist_roasts")
      .select("paid")
      .eq("id", id)
      .single();

    return NextResponse.json({ paid: data?.paid ?? false });
  } catch {
    return NextResponse.json({ paid: false });
  }
}
