"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./ScreenGuard.module.css";
import { getScreenGuardMode, type ScreenGuardMode } from "@/lib/security/screen-guard-config";

type ScreenGuardContextValue = {
  mode: ScreenGuardMode;
  active: boolean;
  setModeOverride: (mode?: ScreenGuardMode) => void;
};

const ScreenGuardContext = createContext<ScreenGuardContextValue | null>(null);
const CLIPBOARD_MESSAGE = "المحتوى محمي — Protected content — abdulazizalsari.net";

function isEditable(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : document.activeElement;
  return Boolean(element instanceof HTMLElement && element.closest("input,textarea,select,[contenteditable='true'],[contenteditable='']"));
}

function isCaptureEvent(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (key === "printscreen") return true;
  const modifier = event.metaKey || event.ctrlKey;
  return Boolean(modifier && event.shiftKey && (key === "s" || key === "3" || key === "4" || key === "5"));
}

function isCaptureReleaseKey(event: KeyboardEvent) {
  return ["printscreen", "meta", "control", "shift", "s", "3", "4", "5"].includes(event.key.toLowerCase());
}

export function useScreenGuard() {
  const value = useContext(ScreenGuardContext);
  if (!value) throw new Error("useScreenGuard must be used inside ScreenGuard");
  return value;
}

export default function ScreenGuard({
  children,
  mode
}: {
  children: React.ReactNode;
  mode?: ScreenGuardMode;
}) {
  const pathname = usePathname() || "/";
  const [override, setOverride] = useState<ScreenGuardMode | undefined>();
  const resolvedMode = getScreenGuardMode(pathname, override ?? mode);
  const [captureBlur, setCaptureBlur] = useState(false);
  const [softBlur, setSoftBlur] = useState(false);
  const [hidden, setHidden] = useState(false);
  const captureHeld = useRef(false);
  const blurTimer = useRef<number | null>(null);
  const captureTimer = useRef<number | null>(null);
  const restoreTimer = useRef<number | null>(null);
  const focusedBeforeMask = useRef<HTMLElement | null>(null);
  const english = pathname === "/en" || pathname.startsWith("/en/");

  const clearTimer = (timer: React.MutableRefObject<number | null>) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const rememberFocus = () => {
    if (!focusedBeforeMask.current && document.activeElement instanceof HTMLElement) {
      focusedBeforeMask.current = document.activeElement;
    }
  };

  const restoreFocus = () => {
    const target = focusedBeforeMask.current;
    focusedBeforeMask.current = null;
    if (target?.isConnected) {
      try { target.focus({ preventScroll: true }); } catch { target.focus(); }
    }
  };

  const writeProtectionMessage = () => {
    void navigator.clipboard?.writeText(CLIPBOARD_MESSAGE).catch(() => undefined);
  };

  const showHideMask = () => {
    rememberFocus();
    setHidden(true);
  };

  const scheduleHideRestore = () => {
    clearTimer(restoreTimer);
    restoreTimer.current = window.setTimeout(() => {
      if (document.visibilityState === "visible" && document.hasFocus() && !captureHeld.current) {
        setHidden(false);
        window.setTimeout(restoreFocus, 0);
      }
    }, 500);
  };

  const triggerCapture = () => {
    writeProtectionMessage();
    rememberFocus();
    if (resolvedMode === "hide") {
      setHidden(true);
      return;
    }
    if (resolvedMode === "base") {
      setCaptureBlur(true);
      clearTimer(captureTimer);
      captureTimer.current = window.setTimeout(() => setCaptureBlur(false), 1500);
    }
  };

  useEffect(() => {
    document.body.classList.toggle("sg-print-protected", resolvedMode !== "off");
    document.documentElement.classList.toggle("sg-print-protected", resolvedMode !== "off");

    if (resolvedMode === "off") {
      setCaptureBlur(false);
      setSoftBlur(false);
      setHidden(false);
      return () => {
        document.body.classList.remove("sg-print-protected");
        document.documentElement.classList.remove("sg-print-protected");
      };
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isCaptureEvent(event)) return;
      captureHeld.current = true;
      triggerCapture();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isCaptureEvent(event)) triggerCapture();
      if (!isCaptureReleaseKey(event)) return;
      captureHeld.current = false;
      if (resolvedMode === "hide") scheduleHideRestore();
    };

    const applyContextLoss = () => {
      if (isEditable(document.activeElement)) return;
      rememberFocus();
      if (resolvedMode === "hide") showHideMask();
      else setSoftBlur(true);
    };

    const scheduleContextLoss = () => {
      clearTimer(blurTimer);
      blurTimer.current = window.setTimeout(applyContextLoss, 150);
    };

    const onFocus = () => {
      clearTimer(blurTimer);
      if (resolvedMode === "base") setSoftBlur(false);
      else scheduleHideRestore();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") scheduleContextLoss();
      else onFocus();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", scheduleContextLoss);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    let devtoolsTimer: number | undefined;
    if (resolvedMode === "hide") {
      devtoolsTimer = window.setInterval(() => {
        if (!window.matchMedia("(pointer:fine)").matches || isEditable(document.activeElement)) return;
        const gap = Math.max(Math.abs(window.outerWidth - window.innerWidth), Math.abs(window.outerHeight - window.innerHeight));
        if (gap > 180) showHideMask();
      }, 1200);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", scheduleContextLoss);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (devtoolsTimer) window.clearInterval(devtoolsTimer);
      clearTimer(blurTimer);
      clearTimer(captureTimer);
      clearTimer(restoreTimer);
      document.body.classList.remove("sg-print-protected");
      document.documentElement.classList.remove("sg-print-protected");
    };
  }, [resolvedMode, pathname]);

  useEffect(() => {
    setCaptureBlur(false);
    setSoftBlur(false);
    setHidden(false);
    captureHeld.current = false;
  }, [resolvedMode, pathname]);

  const contextValue = useMemo<ScreenGuardContextValue>(() => ({
    mode: resolvedMode,
    active: resolvedMode === "hide" ? hidden : captureBlur || softBlur,
    setModeOverride: setOverride
  }), [captureBlur, hidden, resolvedMode, softBlur]);

  if (resolvedMode === "off") {
    return <ScreenGuardContext.Provider value={contextValue}>{children}</ScreenGuardContext.Provider>;
  }

  const contentClass = [
    styles.content,
    resolvedMode === "hide" && hidden ? styles.hidden : "",
    resolvedMode === "base" && captureBlur ? styles.blurStrong : "",
    resolvedMode === "base" && !captureBlur && softBlur ? styles.blurSoft : ""
  ].filter(Boolean).join(" ");

  return (
    <ScreenGuardContext.Provider value={contextValue}>
      <div className={contentClass}>{children}</div>
      {resolvedMode === "hide" && hidden && (
        <div className={styles.overlay} role="alert" aria-live="assertive">
          {english ? "Protected content" : "المحتوى محمي"}
        </div>
      )}
    </ScreenGuardContext.Provider>
  );
}
