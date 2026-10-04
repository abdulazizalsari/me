# AbdulAziz Al-Sari Website

Next.js App Router website for **abdulazizalsari.net**.

## ScreenGuard screenshot deterrence

The site includes one client-side screenshot deterrence provider:

- `components/security/ScreenGuard.tsx`
- `components/security/ScreenGuard.module.css`
- `lib/security/screen-guard-config.ts`

It is mounted once in the root layout. The active route configuration currently uses:

- `/` → `hide`
- `/en` → `hide`
- every other route → `off`

Only the homepage uses screenshot deterrence. Inner pages do not use screenshot masking or blur. They use the separate lightweight content protection layer for text-copy prevention and best-effort image-save/drag prevention.

Googlebot, Google Inspection Tool, Bingbot, Bing Preview, and common social-preview crawlers bypass ScreenGuard server-side so the full server-rendered HTML remains available to search engines and link-preview crawlers.

### Per-page override

The default route modes live in:

`lib/security/screen-guard-config.ts`

Add an exact route to `SCREEN_GUARD_ROUTE_MODES` to force `"base"`, `"hide"`, or `"off"`.

A client page/component can also call:

`useScreenGuard().setModeOverride("base" | "hide" | "off")`

and clear the override with `setModeOverride()`.

## What this can and cannot prevent

### It can deter

- casual use of PrintScreen and common OS screenshot keyboard shortcuts on the homepage when the browser receives those key events;
- screenshots attempted immediately after switching away from the homepage;
- some capture attempts while DevTools appears to be open on the homepage;
- normal browser printing on the protected homepage;
- copying page text and casual image saving/dragging on inner pages.

### It cannot truly prevent screenshots

Browsers do **not** have a reliable API that can block operating-system screenshots. ScreenGuard is therefore **best-effort deterrence, not DRM and not guaranteed screenshot prevention**.

It cannot reliably stop:

- OS or hardware capture that does not expose a keyboard event to the page;
- a second phone/camera photographing the screen;
- browser extensions, automation, remote-desktop software, GPU/OS capture APIs, or a compromised device;
- captures that occur before client hydration;
- every DevTools configuration. DevTools detection is heuristic and intentionally limited to the homepage `hide` mode.

The protected page content stays in the server-rendered HTML for SEO. Visual masking is applied only after hydration.

## ScreenGuard testing checklist

- [ ] Windows: PrintScreen on homepage → black overlay; inner page → 25px blur for ~1.5s.
- [ ] Windows: Alt+PrintScreen.
- [ ] Windows: Win+PrintScreen.
- [ ] Windows: Win+Shift+S.
- [ ] macOS: Cmd+Shift+3.
- [ ] macOS: Cmd+Shift+4.
- [ ] macOS: Cmd+Shift+5.
- [ ] macOS/other keyboard variants: Ctrl+Shift+3/4/5 and Ctrl+Shift+S.
- [ ] Verify capture shortcuts on both `keydown` and `keyup`.
- [ ] Verify clipboard is replaced with the short protection message after a detected capture shortcut.
- [ ] Homepage: switch tabs/windows → instant black mask after the 150ms blur debounce; restore ~500ms after focus returns.
- [ ] Inner pages: no screenshot blur or black overlay; text copy and casual image save/drag prevention remain active.
- [ ] Homepage: DevTools-open heuristic triggers the black mask on desktop/fine-pointer environments.
- [ ] Contact and consultation forms remain usable while typing; blur/visibility protection must not fire solely because focus leaves the browser while an editable field is active.
- [ ] Scrolling, zooming, clicking, selecting form controls, and keyboard navigation do not trigger ScreenGuard.
- [ ] No watermark is rendered anywhere on the site.
- [ ] Printing hides the protected body and shows the short protected-content message.
- [ ] Chrome desktop.
- [ ] Safari desktop.
- [ ] Firefox desktop.
- [ ] Edge desktop.
- [ ] iOS Safari.
- [ ] Android Chrome.
- [ ] Lighthouse: confirm SEO, accessibility, and CLS remain unchanged; no layout shift is introduced by ScreenGuard.
- [ ] Search Console URL Inspection: Google Inspection Tool must receive the complete page without ScreenGuard.
- [ ] Test a social preview crawler (for example Facebook/LinkedIn/Slack) and confirm full metadata/page HTML remains available.
- [ ] Verify `prefers-reduced-motion` produces no protection animation.
- [ ] Verify focus returns to the previously focused element after the homepage hide mask restores.
