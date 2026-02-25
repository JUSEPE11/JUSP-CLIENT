// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "JUSP",
  description: "Lo más top, sin perder tiempo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-screen h-full bg-[#070709] text-white antialiased overflow-x-hidden selection:bg-yellow-300/30 selection:text-white">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}