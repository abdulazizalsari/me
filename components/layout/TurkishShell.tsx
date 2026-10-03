import Link from "next/link";
export function TurkishShell({children}:{children:React.ReactNode}){
  return <div className="turkish-shell" lang="tr" dir="ltr">
    <header className="turkish-header">
      <nav className="turkish-nav">
        <Link href="/tr">AbdulAziz Alsari</Link>
        <div className="turkish-nav-links">
          <Link href="/tr">Ana Sayfa</Link>
          <Link href="/tr/services">Hizmetler</Link>
          <Link href="/tr/training">Eğitimler</Link>
          <Link href="/tr/ruaa">İçgörüler</Link>
          <span className="header-language-buttons" aria-label="Languages">
            <Link className="lang" href="/">AR</Link>
            <Link className="lang" href="/en">EN</Link>
            <Link className="lang active" href="/tr" aria-current="page">TR</Link>
          </span>
        </div>
      </nav>
    </header>
    {children}
  </div>;
}
