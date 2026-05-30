"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Song, YouTubeSearchResult } from "@/types/youtube";

interface SearchBarProps {
  onAddToQueue: (song: Song) => void;
}

export default function SearchBar({ onAddToQueue }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchYouTube = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
        setShowResults(true);
      }
    } catch (err) {
      console.error("ค้นหาผิดพลาด:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchYouTube(value);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    searchYouTube(query);
  };

  const handleAddToQueue = (item: YouTubeSearchResult) => {
    const song: Song = {
      videoId: item.id.videoId,
      title: item.snippet.title.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle,
    };
    onAddToQueue(song);
    setAddedIds((prev) => new Set(prev).add(item.id.videoId));
  };

  // Decode HTML entities ใน title
  const decodeTitle = (title: string) => {
    return title
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md transition-all focus-within:border-fuchsia-500/50 focus-within:shadow-[0_0_20px_rgba(217,70,239,0.15)]">
          {/* ไอคอนค้นหา */}
          <div className="flex items-center pl-4 text-white/40">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="🔍 ค้นหาเพลงคาราโอเกะ..."
            className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/40 outline-none lg:text-base"
          />
          {isLoading && (
            <div className="pr-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
            </div>
          )}
          <button
            type="submit"
            className="mr-1.5 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-fuchsia-500 hover:to-purple-500 hover:shadow-lg hover:shadow-fuchsia-500/25 active:scale-95"
          >
            ค้นหา
          </button>
        </div>
      </form>

      {/* ผลลัพธ์ค้นหา */}
      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[400px] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 scrollbar-thin">
          <div className="p-2">
            <p className="mb-2 px-3 text-xs font-medium text-white/40">
              ผลการค้นหา ({results.length} เพลง)
            </p>
            {results.map((item) => (
              <div
                key={item.id.videoId}
                className="group flex items-center gap-3 rounded-xl p-2 transition-all hover:bg-white/5"
              >
                {/* Thumbnail */}
                <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg lg:h-16 lg:w-24">
                  <img
                    src={
                      item.snippet.thumbnails.medium?.url ||
                      item.snippet.thumbnails.default.url
                    }
                    alt={item.snippet.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* ข้อมูลเพลง */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90 group-hover:text-white">
                    {decodeTitle(item.snippet.title)}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {item.snippet.channelTitle}
                  </p>
                </div>

                {/* ปุ่มเพิ่มเข้าคิว */}
                <button
                  onClick={() => handleAddToQueue(item)}
                  disabled={addedIds.has(item.id.videoId)}
                  className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    addedIds.has(item.id.videoId)
                      ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                      : "bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 hover:text-fuchsia-200 active:scale-95"
                  }`}
                >
                  {addedIds.has(item.id.videoId) ? "✓ เพิ่มแล้ว" : "+ เข้าคิว"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ไม่พบผลลัพธ์ */}
      {showResults && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center backdrop-blur-xl">
          <p className="text-3xl">🎵</p>
          <p className="mt-2 text-sm text-white/50">
            ไม่พบเพลงที่ค้นหา ลองใช้คำค้นอื่น
          </p>
        </div>
      )}
    </div>
  );
}
