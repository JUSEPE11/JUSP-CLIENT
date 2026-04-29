import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import Providers from "./Providers";

const SITE_URL = "https://www.juspco.com";
const LOGO_URL = `${SITE_URL}/logo.jpeg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JUSP | Originales.",
    template: "%s | JUSP",
  },
  description:
    "Compra productos originales con una experiencia clara, elegante y confiable. JUSP. Originales.",
  applicationName: "JUSP",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "JUSP",
    "Originales",
    "moda original",
    "compras online Colombia",
    "ropa original",
    "zapatos originales",
  ],
  authors: [{ name: "JUSP" }],
  creator: "JUSP",
  publisher: "JUSP",
  category: "ecommerce",
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "JUSP | Originales.",
    description:
      "Compra original. Compra con confianza. Seguimiento claro, experiencia premium y atención humana.",
    url: SITE_URL,
    siteName: "JUSP",
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: "JUSP Originales.",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JUSP | Originales.",
    description: "Compra original. Compra con confianza.",
    images: [LOGO_URL],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-title" content="JUSP" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta property="og:image" content={LOGO_URL} />
        <meta property="og:image:secure_url" content={LOGO_URL} />
        <meta property="og:image:alt" content="JUSP Originales." />
        <meta name="twitter:image" content={LOGO_URL} />

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
              :root {
                --jusp-black: #050505;
                --jusp-white: #ffffff;
                --jusp-soft: #f7f7f5;
                --jusp-line: rgba(0, 0, 0, 0.08);
                --jusp-gold: #d6a84f;
              }

              html {
                text-rendering: geometricPrecision;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                background: var(--jusp-white);
              }

              body {
                min-height: 100vh;
                background:
                  radial-gradient(circle at 10% 0%, rgba(214, 168, 79, 0.08), transparent 28%),
                  linear-gradient(180deg, #ffffff 0%, #fbfbfa 45%, #ffffff 100%);
              }

              ::selection {
                background: rgba(214, 168, 79, 0.28);
                color: #000000;
              }

              * {
                -webkit-tap-highlight-color: transparent;
              }

              button,
              a,
              input,
              select,
              textarea {
                font: inherit;
              }

              img,
              video,
              canvas,
              svg {
                max-width: 100%;
              }

              @media (prefers-reduced-motion: reduce) {
                *,
                *::before,
                *::after {
                  animation-duration: 0.001ms !important;
                  animation-iteration-count: 1 !important;
                  scroll-behavior: auto !important;
                  transition-duration: 0.001ms !important;
                }
              }

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

      <body className="min-h-screen h-full bg-white text-black antialiased overflow-x-hidden selection:bg-yellow-300/30 selection:text-black">
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
