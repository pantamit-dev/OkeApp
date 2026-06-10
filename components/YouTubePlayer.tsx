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
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

// ให้ page.tsx เรียก method เหล่านี้ผ่าน ref (สำหรับ keyboard shortcuts และ remote commands)
export interface YouTubePlayerHandle {
  togglePlay: () => void;
  toggleMute: () => void;
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  (
    {
      currentSong,
      isRepeat,
      onEnded,
      onToggleRepeat,
      onPlayStateChange,
      isFullscreen = false,
      onExitFullscreen,
    },
    ref
  ) => {
    const {
      isReady,
      isPlaying,
      isMuted,
      volume,
      currentTime,
      duration,
      loadVideo,
      play,
      pause,
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
      play,
      pause,
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
      <div className={isFullscreen ? "flex flex-col h-full w-full bg-black" : "flex flex-col gap-0"}>
        {/* Video Container */}
        <div className={
          isFullscreen 
            ? "flex-1 w-full relative overflow-hidden bg-black" 
            : "relative aspect-video w-full overflow-hidden rounded-t-2xl bg-zinc-900 border border-white/10 border-b-0"
        }>
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

        {/* Fullscreen Bottom Info Bar */}
        {isFullscreen && (
          <div className="flex items-center justify-between px-4 py-3 bg-black/95 border-t border-white/10">
            <div className="min-w-0 flex-1">
              {currentSong && (
                <>
                  <p className="truncate text-sm font-medium text-white/90">
                    {currentSong.title}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {currentSong.channelTitle}
                  </p>
                </>
              )}
            </div>
            {onExitFullscreen && (
              <button
                onClick={onExitFullscreen}
                className="ml-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/70 transition-all hover:bg-white/20"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v5m0-5h5m6 6l5 5m0 0v-5m0 5h-5" />
                </svg>
                ออกเต็มจอ (Esc)
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

YouTubePlayer.displayName = "YouTubePlayer";
export default YouTubePlayer;
