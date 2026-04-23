export async function POST(req: Request) {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401 }
      );
    }

    const verified = await verifyAccessToken(accessToken).catch(() => null);

    if (!verified?.sub) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const items = normalizeItems(body?.items || []);
    const reference = String(body?.reference || makeReference()).trim();

    if (!items.length) {
      return NextResponse.json(
        { ok: false, error: "Items requeridos" },
        { status: 400 }
      );
    }

    const total = Math.round(calculateTotal(items));
    const amountInCents = total * 100;

    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        { ok: false, error: "amountInCents inválido" },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(req);

    // 🔥 SOLO WOMPI (SIN CREAR ORDEN)
    const wompiRes = await fetch(`${baseUrl}/api/wompi/checkout-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_AT}=${accessToken}`,
      },
      body: JSON.stringify({
        reference,
        items,
        amountInCents,
        currency: "COP",
        totals: { total },

        // ⚠️ DATOS MÍNIMOS PARA QUE WOMPI FUNCIONE
        customer: {
          fullName: verified.name || "Cliente JUSP",
          email: verified.email,
          documentType: "CC",
          documentNumber: "000000000",
          phone: "3000000000",
        },
        shipping: {
          addressLine1: "Por definir",
          city: "Cali",
          region: "Valle del Cauca",
          country: "CO",
        },
      }),
    });

    const wompiJson = await wompiRes.json().catch(() => ({}));

    if (!wompiRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "wompi",
          error: wompiJson?.error || "Error creando checkout",
        },
        { status: wompiRes.status }
      );
    }

    const checkoutUrl =
      wompiJson?.checkoutUrl ||
      wompiJson?.url ||
      wompiJson?.data?.checkoutUrl ||
      wompiJson?.data?.url;

    return NextResponse.json({
      ok: true,
      reference,
      checkoutUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mobile checkout error",
      },
      { status: 500 }
    );
  }
}