import Link from "next/link";

const NAV = [
  { label: "Hombre", href: "/products?gender=men" },
  { label: "Mujer", href: "/products?gender=women" },
  { label: "Niños", href: "/products?gender=kids" },
  { label: "Jordan", href: "/products?brand=Jordan" },
  { label: "SNKRS", href: "/products?tab=snkrs" },
  { label: "Ofertas", href: "/products?tab=offers" },
];

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M10.5 3a7.5 7.5 0 105.02 13.07l3.2 3.2a1 1 0 001.41-1.41l-3.2-3.2A7.5 7.5 0 0010.5 3zm0 2a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"
      />
    </svg>
  );
}

function IconHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 21s-7-4.35-9.33-8.36C.62 9.08 2.07 5.9 5.2 5.2c1.77-.4 3.51.3 4.64 1.65C10.96 5.5 12.7 4.8 14.47 5.2c3.13.7 4.58 3.88 2.53 7.44C19 16.65 12 21 12 21z"
      />
    </svg>
  );
}

function IconBag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M7 8V7a5 5 0 0110 0v1h3a1 1 0 011 1l-1.2 11A2 2 0 0117.82 22H6.18A2 2 0 014.2 20L3 9a1 1 0 011-1h3zm2 0h6V7a3 3 0 00-6 0v1z"
      />
    </svg>
  );
}

export default function HeaderNike() {
  return (
    <header className="jusp-header">
      {/* top util bar (como Nike) */}
      <div className="jusp-header-top">
        <div className="jusp-header-top-inner">
          <div className="jusp-header-left">
            <Link href="/" className="jusp-logo" aria-label="JUSP Home">
              JUSP
            </Link>
          </div>

          <nav className="jusp-nav" aria-label="Navegación principal">
            {NAV.map((it) => (
              <Link key={it.href} href={it.href} className="jusp-nav-link">
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="jusp-header-right">
            <form action="/products" method="GET" className="jusp-search" role="search">
              <IconSearch className="jusp-ico" />
              <input
                name="q"
                placeholder="Buscar"
                className="jusp-search-input"
                autoComplete="off"
              />
            </form>

            <Link href="/favorites" className="jusp-icon-btn" aria-label="Favoritos">
              <IconHeart className="jusp-ico" />
            </Link>

            <Link href="/cart" className="jusp-icon-btn" aria-label="Bolsa">
              <IconBag className="jusp-ico" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}