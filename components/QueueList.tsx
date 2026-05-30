"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Song } from "@/types/youtube";

interface QueueListProps {
  songs: Song[];
  currentIndex: number;
  onPlayAt: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function QueueList({
  songs,
  currentIndex,
  onPlayAt,
  onRemove,
  onClear,
  onReorder,
}: QueueListProps) {
  // ===== Desktop Drag =====
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // ===== Touch Drag =====
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchActiveRef = useRef(false);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Cleanup touch timer
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  // ===== Desktop Drag Handlers =====
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      if (index === currentIndex) {
        e.preventDefault();
        return;
      }
      setDragIndex(index);
      dragNodeRef.current = e.currentTarget;
      e.currentTarget.style.opacity = "0.4";
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    },
    [currentIndex]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.style.opacity = "1";
      if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
        onReorder(dragIndex, dragOverIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
      dragNodeRef.current = null;
    },
    [dragIndex, dragOverIndex, onReorder]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (index === currentIndex) return;
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [currentIndex, dragOverIndex]
  );

  const handleDragLeave = useCallback(() => {}, []);

  // ===== Touch Drag Handlers (Long Press + Drag) =====
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, index: number) => {
      if (index === currentIndex) return;

      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, index };

      // Long press — 400ms to activate
      touchTimerRef.current = setTimeout(() => {
        touchActiveRef.current = true;
        setTouchDragIndex(index);
        // Haptic feedback on supported browsers
        if (navigator.vibrate) navigator.vibrate(30);
      }, 400);
    },
    [currentIndex]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      // If moved too early (before long-press fires), cancel
      if (!touchActiveRef.current && (dx > 10 || dy > 10)) {
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
        touchStartRef.current = null;
        return;
      }

      // If active drag, prevent scrolling and find target
      if (touchActiveRef.current) {
        e.preventDefault();

        // Find which item is under the finger
        const containerEl = listContainerRef.current;
        if (!containerEl) return;

        let targetIndex: number | null = null;
        itemRefs.current.forEach((el, idx) => {
          if (idx === currentIndex) return;
          const rect = el.getBoundingClientRect();
          if (
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            targetIndex = idx;
          }
        });

        if (targetIndex !== null && targetIndex !== touchDragIndex) {
          setTouchOverIndex(targetIndex);
        }
      }
    },
    [currentIndex, touchDragIndex]
  );

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    if (touchActiveRef.current && touchDragIndex !== null && touchOverIndex !== null && touchDragIndex !== touchOverIndex) {
      onReorder(touchDragIndex, touchOverIndex);
    }

    touchActiveRef.current = false;
    touchStartRef.current = null;
    setTouchDragIndex(null);
    setTouchOverIndex(null);
  }, [touchDragIndex, touchOverIndex, onReorder]);

  // Register item ref
  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  const isDraggingAny = touchDragIndex !== null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎵</span>
          <h2 className="text-sm font-semibold text-white/90">คิวเพลง</h2>
          {songs.length > 0 && (
            <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs font-medium text-fuchsia-300">
              {songs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* เวลาโดยประมาณ */}
          {songs.length > 1 && (
            <span className="text-[10px] text-white/30">
              ~{Math.ceil((songs.length - 1) * 4)} นาที
            </span>
          )}
          {songs.length > 0 && (
            <button
              onClick={onClear}
              className="rounded-lg px-2.5 py-1 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-red-400"
            >
              ล้างคิว
            </button>
          )}
        </div>
      </div>

      {/* Song List */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-2"
        style={{ touchAction: isDraggingAny ? "none" : "auto" }}
      >
        {songs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
              <div className="absolute -inset-3 animate-pulse rounded-full bg-purple-500/10 blur-lg" />
              <span className="relative text-5xl">🎶</span>
            </div>
            <p className="text-sm font-medium text-white/40">
              ยังไม่มีเพลงในคิว
            </p>
            <p className="mt-1 text-xs text-white/25">
              ค้นหาและเพิ่มเพลงเพื่อเริ่มร้อง
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, index) => {
              const isCurrent = index === currentIndex;
              const isDragging = dragIndex === index || touchDragIndex === index;
              const isDragOver =
                (dragOverIndex === index && dragIndex !== null && !isCurrent) ||
                (touchOverIndex === index && touchDragIndex !== null && !isCurrent);

              return (
                <div
                  key={`${song.videoId}-${index}`}
                  ref={(el) => setItemRef(index, el)}
                  // Desktop drag
                  draggable={!isCurrent}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  // Touch drag
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`group relative flex items-center gap-2 rounded-xl p-2 transition-all ${
                    isCurrent
                      ? "bg-fuchsia-500/10 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] cursor-default"
                      : "hover:bg-white/5 border border-transparent cursor-grab active:cursor-grabbing"
                  } ${isDragging ? "opacity-40 scale-95" : ""} ${
                    isDragOver
                      ? "border-fuchsia-400/50 bg-fuchsia-500/5 scale-[1.02]"
                      : ""
                  } ${
                    touchDragIndex === index
                      ? "touch-drag-active"
                      : ""
                  }`}
                  onClick={() => {
                    // Prevent click if touch drag was active
                    if (!touchActiveRef.current) {
                      onPlayAt(index);
                    }
                  }}
                >
                  {/* Drag Handle / ลำดับ / ไอคอนเล่น */}
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                    {isCurrent ? (
                      <div className="flex items-end gap-0.5">
                        <div className="h-3 w-1 animate-equalizer-1 rounded-full bg-fuchsia-400" />
                        <div className="h-4 w-1 animate-equalizer-2 rounded-full bg-fuchsia-400" />
                        <div className="h-2 w-1 animate-equalizer-3 rounded-full bg-fuchsia-400" />
                      </div>
                    ) : (
                      /* ไอคอนลาก + ลำดับ */
                      <div className="relative">
                        {/* ลำดับ (ซ่อนเมื่อ hover บน desktop) */}
                        <span className="text-white/30 group-hover:opacity-0 transition-opacity lg:block">
                          {index + 1}
                        </span>
                        {/* ไอคอน drag handle (แสดงเมื่อ hover บน desktop) */}
                        <svg
                          className="absolute inset-0 h-full w-full text-white/40 opacity-0 group-hover:opacity-100 transition-opacity p-1 hidden lg:block"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z" />
                        </svg>
                        {/* ไอคอน drag handle (แสดงเสมอบนมือถือ) */}
                        <svg
                          className="absolute inset-0 h-full w-full text-white/20 p-1 lg:hidden"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-10 w-14 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="h-full w-full object-cover"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 border-2 border-fuchsia-400/50 rounded-md" />
                    )}
                  </div>

                  {/* ข้อมูลเพลง */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs font-medium ${
                        isCurrent ? "text-fuchsia-200" : "text-white/80"
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="truncate text-[10px] text-white/35">
                      {song.channelTitle}
                    </p>
                  </div>

                  {/* ปุ่มลบ */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition-all hover:bg-red-500/20 hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100"
                    title="ลบออกจากคิว"
                    style={{ opacity: undefined }}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Touch drag hint (mobile) */}
      {songs.length > 1 && (
        <div className="lg:hidden border-t border-white/5 px-3 py-2 text-center">
          <p className="text-[10px] text-white/20">
            กดค้างเพื่อจัดลำดับเพลง
          </p>
        </div>
      )}
    </div>
  );
}
