export type ScreenGuardMode = "base" | "hide" | "off";

export const SCREEN_GUARD_ROUTE_MODES: Readonly<Record<string, ScreenGuardMode>> = {
  "/": "hide",
  "/en": "hide"
};

export function getScreenGuardMode(pathname: string, override?: ScreenGuardMode) {
  if (override) return override;
  return SCREEN_GUARD_ROUTE_MODES[pathname] ?? "base";
}

const CRAWLER_RE = /(googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google|bingbot|bingpreview|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|pinterestbot|applebot)/i;

export function isScreenGuardCrawler(userAgent: string) {
  return CRAWLER_RE.test(userAgent);
}
