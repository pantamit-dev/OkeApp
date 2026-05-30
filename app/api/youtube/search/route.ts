import { NextRequest, NextResponse } from "next/server";

// In-memory cache เพื่อลดการเรียก API ซ้ำ (ประหยัด quota)
const searchCache = new Map<
  string,
  { data: unknown; timestamp: number }
>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 นาที

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "กรุณาใส่คำค้นหา" },
      { status: 400 }
    );
  }

  const cacheKey = query.toLowerCase().trim();

  // ตรวจสอบ cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API Key ยังไม่ได้ตั้งค่า" },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: `${query} คาราโอเกะ karaoke`,
      type: "video",
      videoCategoryId: "10", // Music category
      maxResults: "12",
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API Error:", errorData);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // เก็บ cache
    searchCache.set(cacheKey, { data, timestamp: Date.now() });

    // ล้าง cache เก่า (ป้องกัน memory leak)
    if (searchCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          searchCache.delete(key);
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเชื่อมต่อ" },
      { status: 500 }
    );
  }
}
