import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaraokeApp — ร้องคาราโอเกะออนไลน์",
  description:
    "เว็บแอปร้องเพลงคาราโอเกะออนไลน์ ค้นหาเพลงจาก YouTube พร้อมระบบจัดคิวเพลงและเครื่องเล่นวิดีโอ",
  keywords: "คาราโอเกะ, karaoke, ร้องเพลง, YouTube, เพลงไทย, online karaoke",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-mesh">{children}</body>
    </html>
  );
}
