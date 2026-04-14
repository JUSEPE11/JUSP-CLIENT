import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { sendProductDropDigestEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function normalizeEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

type SubscriberRow = {
  email?: string | null;
  status?: string | null;
};

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("email,status")
      .eq("status", "subscribed");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const recipients = Array.from(
      new Set(
        (Array.isArray(data) ? (data as SubscriberRow[]) : [])
          .map((row) => normalizeEmail(row?.email))
          .filter(Boolean)
      )
    );

    if (!recipients.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: "no_subscribers" });
    }

    const allProducts = await getProducts();
    const featuredProducts = [...allProducts]
      .filter((product) => String(product?.slug || product?.id || "").trim())
      .sort((a, b) => {
        const aFlash = Number(Boolean(a?.expressDelivery || a?.pickupToday));
        const bFlash = Number(Boolean(b?.expressDelivery || b?.pickupToday));
        if (aFlash !== bFlash) return bFlash - aFlash;
        return String(a?.title || "").localeCompare(String(b?.title || ""));
      })
      .slice(0, 8);

    if (!featuredProducts.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: "no_products" });
    }

    const recipientChunks = chunk(recipients, 40);

    for (const group of recipientChunks) {
      await sendProductDropDigestEmail({
        to: group,
        products: featuredProducts,
      });
    }

    return NextResponse.json({
      ok: true,
      sent: recipients.length,
      batches: recipientChunks.length,
      products: featuredProducts.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "CRON_PRODUCT_NOTIFY_ERROR";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
