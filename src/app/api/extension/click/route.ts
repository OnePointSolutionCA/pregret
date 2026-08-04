import { NextResponse, type NextRequest } from "next/server";
import { serviceSupabase, supabaseConfigured } from "@/lib/supabase";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ ok: true }, { headers: CORS });
  let body: { product_id?: string; destination_url?: string; session_id?: string; program?: string } = {};
  try {
    body = await req.json();
  } catch {}
  if (!body.product_id || !body.destination_url) {
    return NextResponse.json({ ok: false }, { status: 400, headers: CORS });
  }
  try {
    const svc = serviceSupabase();
    await svc.from("affiliate_clicks").insert({
      product_id: body.product_id,
      destination_url: body.destination_url,
      session_id: body.session_id ?? null,
      affiliate_program: body.program ?? null,
      source: "extension",
    });
  } catch {}
  return NextResponse.json({ ok: true }, { headers: CORS });
}
