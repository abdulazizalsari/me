const trustedIframePrefixes = [
  "https://www.youtube.com/embed/",
  "https://www.youtube-nocookie.com/embed/",
  "https://player.vimeo.com/video/",
  "https://open.spotify.com/embed/"
];

function safeIframe(match: string) {
  const src = match.match(/\bsrc=(["'])(.*?)\1/i)?.[2] ?? "";
  if (!trustedIframePrefixes.some((prefix) => src.startsWith(prefix))) return "";
  const title = match.match(/\btitle=(["'])(.*?)\1/i)?.[2] ?? "Embedded media";
  return `<iframe src="${src.replace(/"/g, "&quot;")}" title="${title.replace(/"/g, "&quot;")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

export function sanitizeCmsHtml(value: string) {
  if (!value) return "";
  let html = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<(object|embed|form|input|textarea|select|option|meta|link|base)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(object|embed|form|input|textarea|select|option|meta|link|base)\b[^>]*\/?\s*>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, (match) => safeIframe(match))
    .replace(/\s(on\w+|style|srcdoc)\s*=\s*(["'])[^"']*\2/gi, "")
    .replace(/\s(on\w+|style|srcdoc)\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*(javascript:|vbscript:|data:text\/html)[^"']*\2/gi, '$1="#"');

  html = html.replace(/<a\b([^>]*)>/gi, (match, attrs: string) => {
    const hasTargetBlank = /\btarget=(["'])_blank\1/i.test(attrs);
    if (!hasTargetBlank) return match;
    const withoutRel = attrs.replace(/\srel=(["'])[^"']*\1/gi, "");
    return `<a${withoutRel} rel="noopener noreferrer">`;
  });

  return html.trim();
}

export function stripHtml(value: string) {
  return sanitizeCmsHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
