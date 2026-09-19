"use client";

import { Briefcase, Home, Lightbulb, Mail, MapPin, Menu, Phone, Target, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { copy, nav, person } from "@/data/site";
import { type Locale, withLocale } from "@/lib/i18n";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navIcons = {
  "/": Home,
  "/about": User,
  "/training": Target,
  "/services": Briefcase,
  "/ruaa": Lightbulb,
  "/contact": Mail
};

function localizedSwitchPath(pathname: string, locale: Locale) {
  if (locale === "ar") return pathname === "/" ? "/en" : `/en${pathname}`;
  const clean = pathname.replace(/^\/en/, "");
  return clean || "/";
}

export function Header({ locale, logoUrl = "/images/brand/abdulaziz-logo-mark.png", logoAlt = "" }: { locale: Locale; logoUrl?: string; logoAlt?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const c = copy[locale];
  const ar = locale === "ar";
  const primaryNav = nav;
  const switchPath = useMemo(() => localizedSwitchPath(pathname, locale), [pathname, locale]);

  function isActive(href: string) {
    const localizedHref = withLocale(locale, href);
    if (localizedHref === "/" || localizedHref === "/en") return pathname === localizedHref;
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="top-contact-bar">
        <div className="container top-contact-inner">
          <span><MapPin size={15} aria-hidden /> {person.location[locale]}</span>
          <a href={`mailto:${person.email}`}><Mail size={15} aria-hidden /> <span dir="ltr">{person.email}</span></a>
          <a href={person.phoneHref}><Phone size={15} aria-hidden /> <span className="ltr-text">{person.phoneDisplay}</span></a>
        </div>
      </div>

      <div className="container nav-shell">
        <a className="brand" href={withLocale(locale, "/")} aria-label={ar ? person.arabicName : person.name}>
          <Image
            src={logoUrl}
            alt={logoAlt}
            width={898}
            height={685}
            priority
            className="brand-logo"
          />
          <span className="brand-text desktop-brand-text">
            <span>{ar ? person.arabicName : person.name}</span>
            <small>{c.tagline}</small>
          </span>
        </a>

        <nav className="nav" aria-label={ar ? "القائمة الرئيسية" : "Primary navigation"}>
          {primaryNav.map((item) => {
            const Icon = navIcons[item.href as keyof typeof navIcons] ?? Target;
            return (
              <a key={item.href} href={withLocale(locale, item.href)} className={isActive(item.href) ? "active" : undefined} aria-current={isActive(item.href) ? "page" : undefined}>
                <Icon size={15} aria-hidden />
                <span>{item.label[locale]}</span>
              </a>
            );
          })}
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          <div className="language-wrap">
            <Link className="lang" href={switchPath} aria-label="Change language">
              <span>{ar ? "EN" : "AR"}</span>
            </Link>
          </div>
          <a className="btn btn-primary consultation-btn" href={withLocale(locale, "/consultation")}>{c.book}</a>
          <button className="menu-toggle" type="button" aria-label={ar ? "فتح القائمة" : "Toggle menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className="container mobile-panel" data-open={open} aria-hidden={!open}>
        {primaryNav.map((item) => (
          <a key={item.href} href={withLocale(locale, item.href)} className={isActive(item.href) ? "active" : undefined} onClick={() => setOpen(false)}>{item.label[locale]}</a>
        ))}
        <a className="btn btn-primary" href={withLocale(locale, "/consultation")}>{c.book}</a>
      </div>
    </header>
  );
}
