"use client";

import Link from "next/link";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  return (
    <nav className="navbar sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: "var(--border)", backgroundColor: "var(--nav-bg)" }}>
      <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-3 lg:px-6">
        {/* โลโก้ */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-3xl transition-transform group-hover:scale-110 group-hover:rotate-12">
            🎤
          </span>
          <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-xl font-bold tracking-tight text-transparent lg:text-2xl">
            KaraokeApp
          </span>
        </Link>

        {/* ปุ่มสลับ Theme */}
        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: "var(--surface)", color: "var(--text-secondary)" }}
          title={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
        >
          {theme === "dark" ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
