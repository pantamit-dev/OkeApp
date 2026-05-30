"use client";

import { useEffect } from "react";

interface KeyboardShortcutHandlers {
  onTogglePlay: () => void;
  onNext: () => void;
  onToggleMute: () => void;
  onRestart: () => void;
  onToggleFullscreen: () => void;
  onExitFullscreen: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ไม่ทำงานเมื่อกำลังพิมพ์ใน input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlers.onTogglePlay();
          break;
        case "KeyN":
          handlers.onNext();
          break;
        case "KeyM":
          handlers.onToggleMute();
          break;
        case "KeyR":
          handlers.onRestart();
          break;
        case "KeyF":
          handlers.onToggleFullscreen();
          break;
        case "Escape":
          handlers.onExitFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
