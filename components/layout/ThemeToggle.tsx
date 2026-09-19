"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved ? saved === "dark" : prefersDark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDark(next);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return <button className="theme-toggle" type="button" aria-label={dark ? "Use light theme" : "Use dark theme"} onClick={toggle}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
