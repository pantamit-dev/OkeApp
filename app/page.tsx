"use client";

import { useCallback, useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import YouTubePlayer, { YouTubePlayerHandle } from "@/components/YouTubePlayer";
import QueueList from "@/components/QueueList";
import NowPlaying from "@/components/NowPlaying";
import ToastContainer from "@/components/Toast";
import MobileControls from "@/components/MobileControls";
import RoomPanel from "@/components/RoomPanel";
import { useQueue } from "@/hooks/useQueue";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRoom } from "@/hooks/useRoom";
import { Song } from "@/types/youtube";

export default function HomePage() {
  const {
    queue,
    currentSong,
    addToQueue,
    removeFromQueue,
    playNext,
    playAt,
    toggleRepeat,
    clearQueue,
    reorderQueue,
    updateQueue,
  } = useQueue();

  const { toasts, addToast, removeToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const {
    room,
    remoteQueue,
    createRoom,
    joinRoom,
    syncQueue,
    addSongToRoom,
    syncPlayState,
    leaveRoom,
  } = useRoom();

  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // ป้องกัน sync loop
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef("");

  // ===== Fullscreen =====
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ===== Keyboard Shortcuts =====
  const shortcutHandlers = useMemo(
    () => ({
      onTogglePlay: () => playerRef.current?.togglePlay(),
      onNext: () => playNext(),
      onToggleMute: () => playerRef.current?.toggleMute(),
      onRestart: () => playerRef.current?.seekTo(0),
      onToggleFullscreen: toggleFullscreen,
      onExitFullscreen: exitFullscreen,
    }),
    [playNext, toggleFullscreen, exitFullscreen]
  );
  useKeyboardShortcuts(shortcutHandlers);

  // ===== Room Sync (Host → Supabase) =====
  // ===== Room Sync (Host → Supabase: ส่งข้อมูลคิวขึ้นฐานข้อมูล) =====
  useEffect(() => {
    if (!room.isConnected || !room.isHost) return;
    if (isSyncingRef.current) return;

    const queueStr = JSON.stringify({
      s: queue.songs.map((s) => s.videoId),
      i: queue.currentIndex,
      r: queue.isRepeat,
    });

    if (queueStr !== lastSyncRef.current) {
      lastSyncRef.current = queueStr;
      syncQueue(queue.songs, queue.currentIndex, queue.isRepeat);
    }
  }, [queue, room.isConnected, room.isHost, syncQueue]);

  // ===== Room Sync (Supabase → Host: รับข้อมูลคิว / จัดลำดับใหม่ / ลบเพลง จาก Remote) =====
  useEffect(() => {
    if (!room.isConnected || !room.isHost || !remoteQueue) return;

    const remoteQueueStr = JSON.stringify(remoteQueue.songs.map((s) => s.videoId));
    const localQueueStr = JSON.stringify(queue.songs.map((s) => s.videoId));

    // ตรวจสอบความแตกต่างของคิวเพลง หรือ index ของเพลงปัจจุบัน
    if (remoteQueueStr !== localQueueStr || remoteQueue.currentIndex !== queue.currentIndex) {
      isSyncingRef.current = true;

      // ล็อกค่าซิงค์ปัจจุบันไม่ให้ยิงขึ้น DB อีกครั้ง
      const nextSyncStr = JSON.stringify({
        s: remoteQueue.songs.map((s) => s.videoId),
        i: remoteQueue.currentIndex,
        r: remoteQueue.isRepeat,
      });
      lastSyncRef.current = nextSyncStr;

      // อัปเดตคิวในเครื่อง Host ให้ตรงกับคิวส่วนกลางของ Supabase
      updateQueue({
        songs: remoteQueue.songs,
        currentIndex: remoteQueue.currentIndex,
        isRepeat: remoteQueue.isRepeat,
      });

      // แจ้งเตือนเมื่อมีความเปลี่ยนแปลง
      if (remoteQueue.songs.length > queue.songs.length) {
        addToast("➕ เพลงถูกเพิ่มเข้าคิวผ่านรีโมตคอนโทรล", "info");
      } else if (remoteQueue.songs.length < queue.songs.length) {
        addToast("🗑️ เพลงถูกลบออกจากคิวผ่านรีโมตคอนโทรล", "info");
      } else {
        addToast("🔀 จัดลำดับคิวเพลงใหม่ผ่านรีโมตคอนโทรล", "info");
      }

      // ปลดล็อกการซิงค์
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 500);
    }
  }, [remoteQueue, room.isConnected, room.isHost, queue.songs, queue.currentIndex, updateQueue, addToast]);

  // ===== Playback State Sync (Host → Supabase: ส่งสถานะเล่นจริงไปที่ DB) =====
  useEffect(() => {
    if (room.isConnected && room.isHost) {
      syncPlayState(isPlaying);
    }
  }, [isPlaying, room.isConnected, room.isHost, syncPlayState]);

  // ===== Playback Commands Sync (Supabase → Host: รับคำสั่งเล่นเพลงจากรีโมต) =====
  const lastCommandTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!room.isConnected || !room.isHost || !remoteQueue?.lastCommand) return;

    const { action, timestamp } = remoteQueue.lastCommand;

    // ทำงานเฉพาะเมื่อได้รับคำสั่งใหม่ที่มี timestamp ล่าสุด
    if (!lastCommandTimestampRef.current || timestamp > lastCommandTimestampRef.current) {
      lastCommandTimestampRef.current = timestamp;

      switch (action) {
        case "play":
          playerRef.current?.play();
          addToast("▶️ เล่นเพลงผ่านรีโมตคอนโทรล", "info");
          break;
        case "pause":
          playerRef.current?.pause();
          addToast("⏸️ หยุดเพลงผ่านรีโมตคอนโทรล", "info");
          break;
        case "next":
          playNext();
          addToast("⏭️ ข้ามเพลงผ่านรีโมตคอนโทรล", "info");
          break;
        case "replay":
          playerRef.current?.seekTo(0);
          addToast("🔄 เริ่มเล่นเพลงใหม่ผ่านรีโมตคอนโทรล", "info");
          break;
        default:
          break;
      }
    }
  }, [remoteQueue?.lastCommand, room.isConnected, room.isHost, playNext, addToast]);

  // ===== Handlers =====
  const handleAddToQueue = useCallback(
    (song: Song) => {
      // ถ้าเป็น Guest ในห้อง → เพิ่มผ่าน Supabase
      if (room.isConnected && !room.isHost) {
        addSongToRoom(song).then((success) => {
          if (success) {
            addToast(`เพิ่ม "${song.title}" เข้าคิวแล้ว`, "success");
          } else {
            addToast(`เพลงนี้อยู่ในคิวแล้ว`, "warning");
          }
        });
        return;
      }

      // เพิ่มปกติ (local)
      const result = addToQueue(song);
      addToast(result.message, result.success ? "success" : "warning");
    },
    [addToQueue, addToast, room, addSongToRoom]
  );

  const handleEnded = useCallback(() => {
    if (queue.songs.length <= 1 && !queue.isRepeat) {
      addToast("🎤 คิวเพลงหมดแล้ว!", "info");
    }
    playNext();
  }, [playNext, addToast, queue.songs.length, queue.isRepeat]);

  const handleRemove = useCallback(
    (index: number) => {
      const song = queue.songs[index];
      removeFromQueue(index);
      if (song) {
        addToast(`ลบ "${song.title}" ออกจากคิว`, "info");
      }
    },
    [removeFromQueue, addToast, queue.songs]
  );

  const handleClear = useCallback(() => {
    clearQueue();
    addToast("ล้างคิวเพลงทั้งหมดแล้ว", "info");
  }, [clearQueue, addToast]);



  // ===== Normal Layout =====
  return (
    <div className="flex min-h-dvh flex-col bg-mesh pb-[76px] lg:pb-0" style={{ background: "var(--background)" }}>
      {/* Navbar + Room Panel */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--nav-bg)",
        }}
      >
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-4 py-3 lg:px-6 relative">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl transition-transform group-hover:scale-110 group-hover:rotate-12">
              🎤
            </span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-xl font-bold tracking-tight text-transparent lg:text-2xl">
              InwZa&apos;KaraO&apos;ke
            </span>
          </Link>

          {/* Center Credit (กรอบสีแดง) */}
          <div
            className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold tracking-wider uppercase opacity-60"
            style={{ color: "var(--text-secondary)" }}
          >
            ©️Power By S&apos;Pantamit
          </div>

          <div className="flex items-center gap-2">
            {/* Room Panel */}
            <RoomPanel
              roomCode={room.code}
              isHost={room.isHost}
              isConnected={room.isConnected}
              error={room.error}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onLeaveRoom={leaveRoom}
            />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--text-secondary)",
              }}
              title={theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}
            >
              {theme === "dark" ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 py-4 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          {/* === ส่วนซ้าย: Search + Player === */}
          <div className="flex flex-col gap-4 lg:flex-1 lg:min-w-0">
            {/* Search Bar */}
            <SearchBar onAddToQueue={handleAddToQueue} />

            {/* Video Player + ปุ่มขยาย/เต็มจอ */}
            <div className={isFullscreen ? "fixed inset-0 z-[999] bg-black flex flex-col" : "relative"}>
              <YouTubePlayer
                ref={playerRef}
                currentSong={currentSong}
                isRepeat={queue.isRepeat}
                onEnded={handleEnded}
                onToggleRepeat={toggleRepeat}
                onPlayStateChange={setIsPlaying}
                isFullscreen={isFullscreen}
                onExitFullscreen={exitFullscreen}
              />
              {/* ปุ่มขวาบน: ขยาย + เต็มจอ */}
              {!isFullscreen && (
                <div className="absolute right-3 top-3 z-10 flex gap-2">
                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white/70 backdrop-blur-md border border-white/10 transition-all hover:bg-black/80 hover:text-white hover:scale-105 active:scale-95"
                    title="เต็มจอ (F)"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  </button>
                  {/* ขยาย/ย่อ Queue */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white/70 backdrop-blur-md border border-white/10 transition-all hover:bg-black/80 hover:text-white hover:scale-105 active:scale-95"
                    title={isExpanded ? "แสดงคิว" : "ซ่อนคิว"}
                  >
                    {isExpanded ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v5m0-5h5m6 6l5 5m0 0v-5m0 5h-5" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Now Playing */}
            <NowPlaying song={currentSong} />

            {/* Keyboard shortcuts hint */}
            <div className="hidden lg:flex items-center gap-4 px-1">
              {[
                { key: "Space", label: "เล่น/หยุด" },
                { key: "N", label: "ถัดไป" },
                { key: "R", label: "เริ่มใหม่" },
                { key: "M", label: "ปิดเสียง" },
                { key: "F", label: "เต็มจอ" },
              ].map((s) => (
                <span key={s.key} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <kbd className="rounded border px-1.5 py-0.5 font-mono text-[9px]" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                    {s.key}
                  </kbd>
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* === ส่วนขวา: Queue List === */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded
                ? "lg:w-[60px] lg:overflow-hidden"
                : "lg:w-[340px] xl:w-[380px]"
            } lg:flex-shrink-0`}
          >
            <div className="lg:sticky lg:top-[73px] lg:max-h-[calc(100dvh-97px)]">
              {isExpanded ? (
                <div className="hidden lg:flex h-full flex-col items-center rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md py-4 gap-3">
                  <span className="text-lg">🎵</span>
                  <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs font-medium text-fuchsia-300">
                    {queue.songs.length}
                  </span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-white/10 hover:text-white"
                    title="แสดงคิวเพลง"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <QueueList
                  songs={queue.songs}
                  currentIndex={queue.currentIndex}
                  onPlayAt={playAt}
                  onRemove={handleRemove}
                  onClear={handleClear}
                  onReorder={reorderQueue}
                />
              )}
              {isExpanded && (
                <div className="lg:hidden">
                  <QueueList
                    songs={queue.songs}
                    currentIndex={queue.currentIndex}
                    onPlayAt={playAt}
                    onRemove={handleRemove}
                    onClear={handleClear}
                    onReorder={reorderQueue}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          🎤 InwZa&apos;KaraO&apos;ke — ร้องเพลงคาราโอเกะออนไลน์ · Powered by YouTube
        </p>
      </footer>

      {/* Mobile Bottom Controls */}
      <MobileControls
        isPlaying={isPlaying}
        currentSong={currentSong}
        onTogglePlay={() => playerRef.current?.togglePlay()}
        onNext={() => playNext()}
        onRestart={() => playerRef.current?.seekTo(0)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
