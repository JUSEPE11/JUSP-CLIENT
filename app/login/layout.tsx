// app/login/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_AT, verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
};

export default async function LoginLayout({ children }: Props) {
  const cookieStore = await cookies();
  const at = cookieStore.get(COOKIE_AT)?.value;

  if (at) {
    try {
      await verifyAccessToken(at);
      redirect("/");
    } catch {
      // token inválido → mostrar login
    }
  }

  return <>{children}</>;
}