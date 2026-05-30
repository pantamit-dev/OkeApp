"use client";

import { Song } from "@/types/youtube";

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  isRepeat: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  currentSong: Song | null;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (seconds: number) => void;
  onNext: () => void;
  onRestart: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlayerControls({
  isPlaying,
  isMuted,
  isRepeat,
  volume,
  currentTime,
  duration,
  currentSong,
  onTogglePlay,
  onToggleMute,
  onToggleRepeat,
  onVolumeChange,
  onSeek,
  onNext,
  onRestart,
}: PlayerControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-b-2xl border border-white/10 border-t-0 bg-zinc-900/80 backdrop-blur-md px-3 py-3 lg:px-5 lg:py-4">
      {/* Progress Bar */}
      <div className="group mb-3">
        <div
          className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/10 transition-all group-hover:h-2.5"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            onSeek(percent * duration);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all"
            style={{ width: `${progress}%` }}
          />
          {/* Dot indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-lg shadow-fuchsia-500/50 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-white/30">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-2">
        {/* ปุ่มซ้าย: Play Controls */}
        <div className="flex items-center gap-1 lg:gap-2">
          {/* Repeat */}
          <button
            onClick={onToggleRepeat}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-white/10 active:scale-90 ${
              isRepeat
                ? "text-fuchsia-400 bg-fuchsia-500/10"
                : "text-white/50 hover:text-white/80"
            }`}
            title="ร้องซ้ำ"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>

          {/* Restart — เริ่มเล่นเพลงใหม่ */}
          <button
            onClick={onRestart}
            disabled={!currentSong}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white/80 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            title="เริ่มเล่นใหม่"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            disabled={!currentSong}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30 transition-all hover:from-fuchsia-500 hover:to-purple-500 hover:shadow-fuchsia-500/50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            title={isPlaying ? "หยุด" : "เล่น"}
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="ml-0.5 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            disabled={!currentSong}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white/80 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            title="เพลงถัดไป"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* ปุ่มขวา: Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white/80 active:scale-90"
            title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
          >
            {isMuted || volume === 0 ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.21.05-.43.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : volume < 50 ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          {/* Volume Slider */}
          <div className="hidden w-20 lg:block">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value))}
              className="volume-slider w-full cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
