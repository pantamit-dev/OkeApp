"use client";

import { Song } from "@/types/youtube";

interface MobileControlsProps {
  isPlaying: boolean;
  currentSong: Song | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onRestart: () => void;
}

export default function MobileControls({
  isPlaying,
  currentSong,
  onTogglePlay,
  onNext,
  onRestart,
}: MobileControlsProps) {
  return (
    <div className="mobile-controls-bar lg:hidden">
      {/* Now Playing Info (left side) */}
      <div className="mobile-controls-info">
        {currentSong ? (
          <>
            <div className="mobile-controls-thumbnail">
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="mobile-controls-thumb-img"
              />
              {isPlaying && (
                <div className="mobile-controls-playing-indicator">
                  <div className="mobile-eq-bar mobile-eq-1" />
                  <div className="mobile-eq-bar mobile-eq-2" />
                  <div className="mobile-eq-bar mobile-eq-3" />
                </div>
              )}
            </div>
            <div className="mobile-controls-text">
              <p className="mobile-controls-title">{currentSong.title}</p>
              <p className="mobile-controls-artist">{currentSong.channelTitle}</p>
            </div>
          </>
        ) : (
          <div className="mobile-controls-text">
            <p className="mobile-controls-title" style={{ opacity: 0.4 }}>
              ยังไม่มีเพลง
            </p>
            <p className="mobile-controls-artist">เลือกเพลงจากช่องค้นหา</p>
          </div>
        )}
      </div>

      {/* Control Buttons (right side) */}
      <div className="mobile-controls-buttons">
        {/* Restart */}
        <button
          onClick={onRestart}
          disabled={!currentSong}
          className="mobile-ctrl-btn"
          aria-label="เริ่มเล่นใหม่"
        >
          <svg className="mobile-ctrl-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>

        {/* Play / Pause (main) */}
        <button
          onClick={onTogglePlay}
          disabled={!currentSong}
          className="mobile-ctrl-btn-main"
          aria-label={isPlaying ? "หยุด" : "เล่น"}
        >
          {isPlaying ? (
            <svg className="mobile-ctrl-icon-main" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="mobile-ctrl-icon-main" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!currentSong}
          className="mobile-ctrl-btn"
          aria-label="เพลงถัดไป"
        >
          <svg className="mobile-ctrl-icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
