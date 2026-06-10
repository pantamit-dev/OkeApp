"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  // โหลด theme จาก localStorage ตอน mount
  useEffect(() => {
    const saved = localStorage.getItem("karaoke-theme") as Theme | null;
    if (saved && (saved === "dark" || saved === "light")) {
      document.documentElement.setAttribute("data-theme", saved);
      // หลีกเลี่ยงการทำ setState แบบซิงโครนัสใน Effect เพื่อป้องกันการทำ render ซ้ำซ้อน (cascading renders)
      setTimeout(() => {
        setTheme(saved);
      }, 0);
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
