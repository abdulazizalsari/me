"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedMetric({ value }: { value: string }) {
  const target = Number.parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
  const prefix = value.startsWith("+") ? "+" : "";
  const suffix = value.replace(/^[+]?\d+/, "");
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setStarted(true);
      if (reduced) {
        setCurrent(target);
        return;
      }
      const begin = performance.now();
      const duration = 1000;
      const tick = (now: number) => {
        const progress = Math.min((now - begin) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(target * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { start(); observer.disconnect(); } }, { threshold: 0.35 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [target]);

  return <strong ref={elementRef}>{started ? `${prefix}${current}${suffix}` : value}</strong>;
}
