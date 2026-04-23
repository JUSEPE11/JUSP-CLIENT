import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { listSavedAddressesForIdentity } from "@/lib/addressBook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value || "").trim();
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

function normalizeMobileAddress(address: any) {
  return {
    id: clean(address?.id),
    label: clean(address?.label),
    fullName: clean(address?.fullName),
    email: clean(address?.email).toLowerCase(),
    documentType: clean(address?.documentType).toUpperCase(),
    documentNumber: clean(address?.documentNumber),
    phone: clean(address?.phone),
    city: clean(address?.municipality || address?.city),
    municipality: clean(address?.municipality || address?.city),
    region: clean(address?.region),
    addressLine1: clean(address?.addressLine1),
    country: "CO",
    notes: clean(address?.notes),
    isDefault: false,
    createdAt: address?.createdAt || null,
    updatedAt: address?.updatedAt || null,
  };
}

async function getRegistry(
  admin: ReturnType<typeof supabaseAdmin>,
  userId: string,
  email: string
) {
  const byUser = await admin
    .from("user_registry")
    .select("profile,name,email,user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUser.data) return byUser.data;

  const byEmail = await admin
    .from("user_registry")
    .select("profile,name,email,user_id")
    .eq("email", email)
    .maybeSingle();

  return byEmail.data || null;
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Missing bearer token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload = await verifyAccessToken(accessToken).catch(() => null);

    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const userId = clean((payload as any)?.sub || (payload as any)?.id);
    const email = clean((payload as any)?.email).toLowerCase();

    if (!userId || !email) {
      return NextResponse.json(
        { ok: false, error: "Invalid token payload" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const admin = supabaseAdmin();

    let dbProfile: any = null;
    let dbName: string | null = null;
    let registryEmail = email;

    try {
      const reg = await getRegistry(admin, userId, email);

      if (reg?.profile) dbProfile = reg.profile;
      if (typeof reg?.name === "string") dbName = reg.name;
      if (typeof reg?.email === "string" && reg.email.trim()) {
        registryEmail = reg.email.trim().toLowerCase();
      }
    } catch {}

    const savedAddressesRaw = await listSavedAddressesForIdentity({
      userId,
      email: registryEmail || email,
    });

    const savedAddresses = savedAddressesRaw.map((address, index) => ({
      ...normalizeMobileAddress(address),
      isDefault: index === 0,
    }));

    const defaultAddress = savedAddresses[0] || null;

    const mergedProfile =
      dbProfile && typeof dbProfile === "object"
        ? {
            ...dbProfile,
            savedAddresses,
            defaultAddress,
          }
        : {
            savedAddresses,
            defaultAddress,
          };

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: userId,
          email: registryEmail || email,
          name: dbName || null,
          profile: mergedProfile,
          savedAddresses,
          defaultAddress,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Me error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}