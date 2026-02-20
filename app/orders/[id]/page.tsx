import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OrderIdRedirectPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(String(params?.id || ""));
  redirect(`/mis-pedidos/${id}`);
}