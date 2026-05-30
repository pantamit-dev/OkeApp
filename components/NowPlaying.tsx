"use client";

import { Song } from "@/types/youtube";

interface NowPlayingProps {
  song: Song | null;
}

export default function NowPlaying({ song }: NowPlayingProps) {
  if (!song) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
      {/* Equalizer Animation */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10">
        <div className="flex items-end gap-0.5">
          <div className="h-2 w-1 animate-equalizer-1 rounded-full bg-fuchsia-400" />
          <div className="h-3.5 w-1 animate-equalizer-2 rounded-full bg-fuchsia-400" />
          <div className="h-2.5 w-1 animate-equalizer-3 rounded-full bg-fuchsia-400" />
          <div className="h-1.5 w-1 animate-equalizer-1 rounded-full bg-purple-400" />
        </div>
      </div>

      {/* Song Info */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-fuchsia-400/70">
          กำลังเล่น
        </p>
        <p className="truncate text-sm font-medium text-white/90">
          {song.title}
        </p>
        <p className="truncate text-xs text-white/40">{song.channelTitle}</p>
      </div>

      {/* Thumbnail */}
      <div className="relative h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 border border-fuchsia-500/30 rounded-lg" />
      </div>
    </div>
  );
}
