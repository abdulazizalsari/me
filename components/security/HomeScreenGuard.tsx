"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import styles from "./HomeScreenGuard.module.css";

type GuardContext = { active: boolean };
const HomeGuardContext = createContext<GuardContext>({ active: false });

export function useHomeScreenGuard() {
  return useContext(HomeGuardContext);
}

function isCaptureKey(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (key === "printscreen") return true;
  const metaOrCtrl = event.metaKey || event.ctrlKey;
  if (metaOrCtrl && event.shiftKey && key === "s") return true;
  return metaOrCtrl && event.shiftKey && ["3", "4", "5"].includes(key);
}

function isCaptureReleaseKey(event: KeyboardEvent) {
  return ["printscreen", "meta", "control", "shift", "s", "3", "4", "5"].includes(event.key.toLowerCase());
}

function isEditable() {
  const el = document.activeElement;
  return el instanceof HTMLElement && Boolean(el.closest("input,textarea,select,[contenteditable='true'],[contenteditable='']"));
}

export default function HomeScreenGuard({
  children,
  disabled = false,
  locale = "ar"
}: {
  children: React.ReactNode;
  disabled?: boolean;
  locale?: "ar" | "en";
}) {
  const [active, setActive] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const focusedBeforeHide = useRef<HTMLElement | null>(null);
  const blurTimer = useRef<number | null>(null);
  const restoreTimer = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const transientTimer = useRef<number | null>(null);
  const captureHeld = useRef(false);
  const touchHeld = useRef(false);
  const contextLost = useRef(false);
  const devtoolsOpen = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const viewport = useRef<{ w: number; h: number; orientation: string }>({ w: 0, h: 0, orientation: "" });

  const clear = useCallback((ref: React.MutableRefObject<number | null>) => {
    if (ref.current !== null) window.clearTimeout(ref.current);
    ref.current = null;
  }, []);

  const hideNow = useCallback(() => {
    if (disabled) return;
    if (!focusedBeforeHide.current && document.activeElement instanceof HTMLElement) {
      focusedBeforeHide.current = document.activeElement;
    }
    if (contentRef.current) {
      contentRef.current.style.visibility = "hidden";
      contentRef.current.setAttribute("aria-hidden", "true");
    }
    if (overlayRef.current) overlayRef.current.hidden = false;
    setActive(true);
  }, [disabled]);

  const canRestore = useCallback(() => (
    !captureHeld.current &&
    !touchHeld.current &&
    !contextLost.current &&
    !devtoolsOpen.current &&
    document.visibilityState === "visible" &&
    document.hasFocus()
  ), []);

  const restore = useCallback((delay = 500) => {
    clear(restoreTimer);
    restoreTimer.current = window.setTimeout(() => {
      if (!canRestore()) return;
      if (contentRef.current) {
        contentRef.current.style.visibility = "visible";
        contentRef.current.removeAttribute("aria-hidden");
      }
      if (overlayRef.current) overlayRef.current.hidden = true;
      setActive(false);
      const target = focusedBeforeHide.current;
      focusedBeforeHide.current = null;
      if (target?.isConnected) {
        try { target.focus({ preventScroll: true }); } catch { target.focus(); }
      }
    }, delay);
  }, [canRestore, clear]);

  const transientHide = useCallback((duration = 900) => {
    hideNow();
    clear(transientTimer);
    transientTimer.current = window.setTimeout(() => restore(500), duration);
  }, [clear, hideNow, restore]);

  const overwriteClipboard = useCallback(() => {
    void navigator.clipboard?.writeText("المحتوى محمي — Protected content — abdulazizalsari.net").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (disabled) return;
    document.documentElement.classList.add("home-screen-guard-active");

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isCaptureKey(event)) return;
      captureHeld.current = true;
      overwriteClipboard();
      hideNow();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (isCaptureKey(event)) {
        overwriteClipboard();
        hideNow();
      }
      if (!isCaptureReleaseKey(event)) return;
      captureHeld.current = false;
      restore(500);
    };
    const onBlur = () => {
      clear(blurTimer);
      blurTimer.current = window.setTimeout(() => {
        contextLost.current = true;
        hideNow();
      }, 150);
    };
    const onFocus = () => {
      clear(blurTimer);
      contextLost.current = false;
      restore(500);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        contextLost.current = true;
        hideNow();
      } else {
        contextLost.current = false;
        restore(500);
      }
    };
    const onPageHide = () => {
      contextLost.current = true;
      hideNow();
    };
    const onPageShow = () => {
      contextLost.current = false;
      restore(500);
    };

    const coarse = () => window.matchMedia("(pointer: coarse)").matches;
    const orientation = () => screen.orientation?.type || (window.innerWidth > window.innerHeight ? "landscape" : "portrait");
    viewport.current = { w: window.innerWidth, h: window.innerHeight, orientation: orientation() };

    const onResize = () => {
      if (!coarse() || isEditable()) return;
      if (window.visualViewport && Math.abs(window.visualViewport.scale - 1) > 0.05) return;
      const prev = viewport.current;
      const next = { w: window.innerWidth, h: window.innerHeight, orientation: orientation() };
      const widthDelta = Math.abs(next.w - prev.w) / Math.max(prev.w, 1);
      const heightDelta = Math.abs(next.h - prev.h) / Math.max(prev.h, 1);
      const orientationChanged = prev.orientation !== next.orientation;
      viewport.current = next;
      if (orientationChanged || widthDelta > 0.28 || heightDelta > 0.42) transientHide(900);
    };

    const onOrientation = () => {
      if (!coarse()) return;
      viewport.current = { w: window.innerWidth, h: window.innerHeight, orientation: orientation() };
      transientHide(900);
    };

    const cancelLongPress = () => {
      clear(longPressTimer);
      touchHeld.current = false;
      touchStart.current = null;
      restore(500);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || isEditable()) return;
      touchStart.current = { x: event.clientX, y: event.clientY };
      clear(longPressTimer);
      longPressTimer.current = window.setTimeout(() => {
        touchHeld.current = true;
        hideNow();
      }, 650);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !touchStart.current) return;
      if (Math.hypot(event.clientX - touchStart.current.x, event.clientY - touchStart.current.y) > 12) cancelLongPress();
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType === "touch") cancelLongPress();
    };

    const devtoolsTimer = window.setInterval(() => {
      if (coarse() || isEditable()) return;
      const gap = Math.max(
        Math.abs(window.outerWidth - window.innerWidth),
        Math.abs(window.outerHeight - window.innerHeight)
      );
      const next = gap > 180;
      if (next && !devtoolsOpen.current) {
        devtoolsOpen.current = true;
        hideNow();
      } else if (!next && devtoolsOpen.current) {
        devtoolsOpen.current = false;
        restore(500);
      }
    }, 900);

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerEnd, true);
    window.addEventListener("pointercancel", onPointerEnd, true);

    return () => {
      document.documentElement.classList.remove("home-screen-guard-active");
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerEnd, true);
      window.removeEventListener("pointercancel", onPointerEnd, true);
      window.clearInterval(devtoolsTimer);
      clear(blurTimer);
      clear(restoreTimer);
      clear(longPressTimer);
      clear(transientTimer);
    };
  }, [clear, disabled, hideNow, overwriteClipboard, restore, transientHide]);

  const value = useMemo(() => ({ active }), [active]);

  if (disabled) return <HomeGuardContext.Provider value={value}>{children}</HomeGuardContext.Provider>;

  return (
    <HomeGuardContext.Provider value={value}>
      <div ref={contentRef} className={styles.content}>{children}</div>
      <div
        ref={overlayRef}
        className={styles.overlay}
        role="alert"
        aria-live="assertive"
        hidden
      >
        {locale === "en" ? "Protected content" : "المحتوى محمي"}
      </div>
      <div className={styles.printNotice}>{locale === "en" ? "Protected content" : "المحتوى محمي"}</div>
    </HomeGuardContext.Provider>
  );
}
