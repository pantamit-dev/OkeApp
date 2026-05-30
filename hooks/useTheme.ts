"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  // โหลด theme จาก localStorage ตอน mount
  useEffect(() => {
    const saved = localStorage.getItem("karaoke-theme") as Theme | null;
    if (saved && (saved === "dark" || saved === "light")) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("karaoke-theme", next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
