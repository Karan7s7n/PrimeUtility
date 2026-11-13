"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage disabled — the toggle still works for this page */
    }
    setDark(next);
  };

  return (
    <button type="button" className="btn-ghost btn-sm" onClick={toggle} aria-label={label} title={label}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
