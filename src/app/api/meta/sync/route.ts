import { NextResponse } from "next/server";
import { syncMetaAccount } from "@/lib/meta-sync";

// GET en vez de POST a propósito: en Nivel 1 esto solo lee de Meta y
// escribe en nuestra propia base de datos (nada se toca en Meta), así que
// se puede disparar visitando la URL desde el navegador para probar.
export async function GET() {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!adAccountId) {
    return NextResponse.json(
      { ok: false, error: "META_AD_ACCOUNT_ID no está configurado." },
      { status: 500 }
    );
  }

  try {
    const summary = await syncMetaAccount(adAccountId);

    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
