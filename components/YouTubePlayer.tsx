"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { Song } from "@/types/youtube";
import PlayerControls from "./PlayerControls";

interface YouTubePlayerProps {
  currentSong: Song | null;
  isRepeat: boolean;
  onEnded: () => void;
  onToggleRepeat: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

// ให้ page.tsx เรียก method เหล่านี้ผ่าน ref (สำหรับ keyboard shortcuts)
export interface YouTubePlayerHandle {
  togglePlay: () => void;
  toggleMute: () => void;
  seekTo: (seconds: number) => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ currentSong, isRepeat, onEnded, onToggleRepeat, onPlayStateChange }, ref) => {
    const {
      isReady,
      isPlaying,
      isMuted,
      volume,
      currentTime,
      duration,
      loadVideo,
      togglePlay,
      toggleMute,
      setVolume,
      seekTo,
    } = useYouTubePlayer("youtube-player", {
      onEnded,
      onPlaying: () => onPlayStateChange?.(true),
      onPaused: () => onPlayStateChange?.(false),
    });

    // เปิดให้ parent เข้าถึง method ผ่าน ref
    useImperativeHandle(ref, () => ({
      togglePlay,
      toggleMute,
      seekTo,
    }));

    const prevVideoIdRef = useRef<string | null>(null);

    // โหลดเพลงใหม่เมื่อ currentSong เปลี่ยน
    useEffect(() => {
      if (currentSong && isReady && currentSong.videoId !== prevVideoIdRef.current) {
        prevVideoIdRef.current = currentSong.videoId;
        loadVideo(currentSong.videoId);
      }
    }, [currentSong, isReady, loadVideo]);

    return (
      <div className="flex flex-col gap-0">
        {/* Video Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-zinc-900 border border-white/10 border-b-0">
          {/* YouTube Player */}
          <div id="youtube-player" className="absolute inset-0" />

          {/* Overlay เมื่อยังไม่มีเพลง */}
          {!currentSong && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-purple-950/30 to-zinc-900">
              <div className="relative">
                <div className="absolute -inset-4 animate-pulse rounded-full bg-fuchsia-500/20 blur-xl" />
                <span className="relative text-7xl lg:text-8xl">🎤</span>
              </div>
              <p className="mt-6 text-lg font-medium text-white/60">
                ค้นหาเพลงและเพิ่มเข้าคิวเพื่อเริ่มร้อง!
              </p>
              <p className="mt-2 text-sm text-white/30">
                เลือกเพลงจากช่องค้นหาด้านบน
              </p>
            </div>
          )}
        </div>

        {/* Player Controls */}
        <PlayerControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          isRepeat={isRepeat}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          currentSong={currentSong}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onToggleRepeat={onToggleRepeat}
          onVolumeChange={setVolume}
          onSeek={seekTo}
          onNext={onEnded}
          onRestart={() => seekTo(0)}
        />
      </div>
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";
export default YouTubePlayer;
