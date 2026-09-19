"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    const cursor = cursorRef.current;
    if (!cursor) return;
    const cursorEl = cursor;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let raf = 0;

    function render() {
      cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = window.requestAnimationFrame(render);
    }

    function onMove(event: MouseEvent) {
      x = event.clientX;
      y = event.clientY;
    }

    function onOver(event: MouseEvent) {
      const target = event.target as Element | null;
      cursorEl.dataset.active = target?.closest("a, button, input, textarea, select, .card") ? "true" : "false";
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    raf = window.requestAnimationFrame(render);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" aria-hidden="true" />;
}
