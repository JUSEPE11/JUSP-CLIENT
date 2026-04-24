import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "JUSP",
  description: "Lo más top, sin perder tiempo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var params = new URLSearchParams(window.location.search);
                  var isApp = params.get("app") === "1";

                  if (isApp) {
                    document.documentElement.classList.add("jusp-app-mode");
                    document.documentElement.setAttribute("data-jusp-app", "1");

                    Object.defineProperty(window, "innerWidth", {
                      get: function () { return 390; },
                      configurable: true
                    });

                    Object.defineProperty(window, "outerWidth", {
                      get: function () { return 390; },
                      configurable: true
                    });

                    Object.defineProperty(screen, "width", {
                      get: function () { return 390; },
                      configurable: true
                    });

                    Object.defineProperty(screen, "availWidth", {
                      get: function () { return 390; },
                      configurable: true
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html.jusp-app-mode,
              html.jusp-app-mode body {
                width: 100% !important;
                max-width: 100% !important;
                overflow-x: hidden !important;
              }

              html.jusp-app-mode * {
                box-sizing: border-box;
              }

              html.jusp-app-mode img,
              html.jusp-app-mode video,
              html.jusp-app-mode canvas,
              html.jusp-app-mode svg {
                max-width: 100% !important;
              }
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WGZSFVJH');
            `,
          }}
        />
      </head>

      <body className="min-h-screen h-full bg-[#070709] text-white antialiased overflow-x-hidden selection:bg-yellow-300/30 selection:text-white">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WGZSFVJH"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}