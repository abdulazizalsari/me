export type Locale = "ar" | "en";

export const locales: Locale[] = ["ar", "en"];

export const localeConfig = {
  ar: { dir: "rtl", label: "العربية", switchLabel: "EN", switchHref: "/en" },
  en: { dir: "ltr", label: "English", switchLabel: "العربية", switchHref: "/" }
} satisfies Record<Locale, { dir: "ltr" | "rtl"; label: string; switchLabel: string; switchHref: string }>;

export function withLocale(locale: Locale, path: string) {
  const cleanPath = path === "/home" ? "/" : path;
  if (locale === "ar") return cleanPath;
  return cleanPath === "/" ? "/en" : `/en${cleanPath}`;
}
