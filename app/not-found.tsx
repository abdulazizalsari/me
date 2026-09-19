import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-hero">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className="h1">Page not found</h1>
        <p className="lead">The page may have moved or the address may be incorrect.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/">Home</Link>
          <Link className="btn btn-secondary" href="/services">Services</Link>
          <Link className="btn btn-secondary" href="/services">Services</Link>
          <Link className="btn btn-secondary" href="/contact">Contact</Link>
        </div>
      </div>
    </main>
  );
}
