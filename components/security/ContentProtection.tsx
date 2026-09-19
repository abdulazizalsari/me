"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const IMAGE_EXT = /\.(?:avif|webp|png|jpe?g|gif|svg)(?:\?.*)?$/i;

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return Boolean(el.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
}

export default function ContentProtection() {
  const pathname = usePathname();
  const [screenMask, setScreenMask] = useState(false);
  const protectedPage = !(pathname ?? "").startsWith("/dashboard");

  useEffect(() => {
    if (!protectedPage) {
      document.body.classList.remove("content-protected");
      return;
    }

    document.body.classList.add("content-protected");

    const protectImages = (root: ParentNode = document) => {
      root.querySelectorAll("img").forEach((img) => {
        img.setAttribute("draggable", "false");
        img.setAttribute("data-protected-image", "true");
        (img as HTMLImageElement).style.setProperty("-webkit-user-drag", "none");
        (img as HTMLImageElement).style.userSelect = "none";
      });
    };

    protectImages();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            if (node.tagName === "IMG") protectImages(node.parentNode ?? document);
            else protectImages(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const preventContextMenu = (event: MouseEvent) => {
      if (isEditable(event.target)) return;
      event.preventDefault();
    };

    const preventCopy = (event: ClipboardEvent) => {
      if (isEditable(event.target)) return;
      event.preventDefault();
    };

    const preventDrag = (event: DragEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("img, [data-protected-image='true']")) event.preventDefault();
    };

    const preventImageDownload = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (link.hasAttribute("download") && IMAGE_EXT.test(href)) event.preventDefault();
    };

    const handleKeys = (event: KeyboardEvent) => {
      if (isEditable(event.target)) return;
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const blockedCombo = modifier && ["c", "s", "u", "p"].includes(key);
      const devtoolsCombo = event.key === "F12" || (modifier && event.shiftKey && ["i", "j", "c"].includes(key));
      if (blockedCombo || devtoolsCombo) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (event.key === "PrintScreen") {
        setScreenMask(true);
        window.setTimeout(() => setScreenMask(false), 1100);
        void navigator.clipboard?.writeText("Protected content — AbdulAziz Alsari").catch(() => undefined);
      }
    };

    document.addEventListener("contextmenu", preventContextMenu, true);
    document.addEventListener("copy", preventCopy, true);
    document.addEventListener("cut", preventCopy, true);
    document.addEventListener("dragstart", preventDrag, true);
    document.addEventListener("click", preventImageDownload, true);
    window.addEventListener("keydown", handleKeys, true);

    return () => {
      observer.disconnect();
      document.body.classList.remove("content-protected");
      document.removeEventListener("contextmenu", preventContextMenu, true);
      document.removeEventListener("copy", preventCopy, true);
      document.removeEventListener("cut", preventCopy, true);
      document.removeEventListener("dragstart", preventDrag, true);
      document.removeEventListener("click", preventImageDownload, true);
      window.removeEventListener("keydown", handleKeys, true);
    };
  }, [protectedPage]);

  if (!protectedPage) return null;

  return (
    <>
      <style>{`
        body.content-protected :not(input):not(textarea):not(select):not([contenteditable='true']):not([contenteditable='']) {
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        body.content-protected img,
        body.content-protected [data-protected-image='true'] {
          -webkit-user-drag: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        @media print {
          body.content-protected > *:not([data-print-blocker='true']) { visibility: hidden !important; }
          [data-print-blocker='true'] { display: grid !important; }
        }
      `}</style>
      <div
        aria-hidden="true"
        data-print-blocker="true"
        style={{
          display: screenMask ? "grid" : "none",
          position: "fixed",
          inset: 0,
          zIndex: 2147483647,
          placeItems: "center",
          padding: 24,
          textAlign: "center",
          background: "#071918",
          color: "#fff",
          fontWeight: 800,
          fontSize: "clamp(18px, 3vw, 34px)"
        }}
      >
        المحتوى والصور محمية — AbdulAziz Alsari
      </div>
    </>
  );
}
