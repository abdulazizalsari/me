import type { Locale } from "@/lib/i18n";

export type Localized<T = string> = Record<Locale, T>;
