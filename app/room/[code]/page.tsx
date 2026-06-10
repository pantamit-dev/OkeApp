"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { useRoom } from "@/hooks/useRoom";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/Toast";
import { Song } from "@/types/youtube";

export default function RoomGuestPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();
  const { 
    room, 
    remoteQueue, 
    joinRoom, 
    addSongToRoom,
    removeSongFromRoom,
    reorderSongsInRoom,
    sendPlaybackCommand 
  } = useRoom();
  const { toasts, addToast, removeToast } = useToast();
  const [isJoined, setIsJoined] = useState(false);

  // เข้าร่วมห้องอัตโนมัติ
  useEffect(() => {
    if (code && !isJoined) {
      joinRoom(code).then((success) => {
        if (success) {
          setIsJoined(true);
          addToast(`เข้าร่วมห้อง ${code} แล้ว`, "success");
        }
      });
    }
  }, [code, isJoined, joinRoom, addToast]);

  const handleAddToQueue = useCallback(
    async (song: Song) => {
      const success = await addSongToRoom(song);
      if (success) {
        addToast(`เพิ่ม "${song.title}" เข้าคิวแล้ว`, "success");
      } else {
        addToast(`เพลงนี้อยู่ในคิวแล้ว`, "warning");
      }
    },
    [addSongToRoom, addToast]
  );

  return (
    <div className="min-h-dvh bg-mesh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎤</span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">
              InwZa&apos;KaraO&apos;ke
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">ห้อง</span>
            <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-1 text-sm font-bold tracking-wider text-fuchsia-300">
              {code}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 space-y-4">
        {/* สถานะ */}
        {room.isConnected ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <span>🟢</span>
            <p className="text-sm text-emerald-300">
              เชื่อมต่อแล้ว — เพิ่มเพลงเข้าคิวได้เลย!
            </p>
          </div>
        ) : room.error ? (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <span>❌</span>
            <p className="text-sm text-red-300">{room.error}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
            <p className="text-sm text-white/60">กำลังเชื่อมต่อ...</p>
          </div>
        )}

        {/* ค้นหาเพลง */}
        <SearchBar onAddToQueue={handleAddToQueue} />

        {/* Playback Controls (รีโมตคอนโทรลควบคุมหน้าจอหลัก) */}
        {remoteQueue && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur-md space-y-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider text-center">
              แผงควบคุมระยะไกล (Remote Control)
            </h2>
            <div className="flex items-center justify-center gap-4">
              {/* Replay / Restart */}
              <button
                onClick={() => sendPlaybackCommand("replay").then(() => addToast("เริ่มเล่นใหม่", "info"))}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 active:scale-95 transition-all"
                title="เริ่มเล่นใหม่"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                </svg>
              </button>

              {/* Play / Pause Toggle */}
              <button
                onClick={() => {
                  const nextAction = remoteQueue.isPlaying ? "pause" : "play";
                  sendPlaybackCommand(nextAction).then(() => {
                    addToast(nextAction === "play" ? "เล่นเพลง" : "หยุดเพลง", "info");
                  });
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                title={remoteQueue.isPlaying ? "หยุดเพลง" : "เล่นเพลง"}
              >
                {remoteQueue.isPlaying ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Next (Skip) */}
              <button
                onClick={() => sendPlaybackCommand("next").then(() => addToast("ข้ามเพลง", "info"))}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 active:scale-95 transition-all"
                title="ข้ามเพลงถัดไป"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* คิวเพลงปัจจุบัน */}
        {remoteQueue && remoteQueue.songs.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span>🎵</span>
                <h2 className="text-sm font-semibold text-white/90">คิวเพลง</h2>
                <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs font-medium text-fuchsia-300">
                  {remoteQueue.songs.length}
                </span>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin p-2 space-y-1">
              {remoteQueue.songs.map((song, index) => {
                const isCurrent = index === remoteQueue.currentIndex;
                return (
                  <div
                    key={`${song.videoId}-${index}`}
                    className={`flex items-center gap-3 rounded-xl p-2 ${
                      isCurrent
                        ? "bg-fuchsia-500/10 border border-fuchsia-500/30"
                        : "border border-transparent"
                    }`}
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-xs font-bold">
                      {isCurrent ? (
                        <div className="flex items-end gap-0.5">
                          <div className="h-2 w-0.5 animate-equalizer-1 rounded-full bg-fuchsia-400" />
                          <div className="h-3 w-0.5 animate-equalizer-2 rounded-full bg-fuchsia-400" />
                          <div className="h-1.5 w-0.5 animate-equalizer-3 rounded-full bg-fuchsia-400" />
                        </div>
                      ) : (
                        <span className="text-white/30">{index + 1}</span>
                      )}
                    </div>
                    <div className="relative h-8 w-12 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
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

                    {/* ปุ่มสำหรับจัดการคิว (เลื่อน ขึ้น-ลง / ลบ) */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* เลื่อนขึ้น */}
                      {index > 0 && (
                        <button
                          onClick={() => {
                            const newSongs = [...remoteQueue.songs];
                            const temp = newSongs[index];
                            newSongs[index] = newSongs[index - 1];
                            newSongs[index - 1] = temp;
                            reorderSongsInRoom(newSongs);
                            addToast(`เลื่อนเพลงขึ้นแล้ว`, "info");
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-all active:scale-90"
                          title="เลื่อนขึ้น"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}

                      {/* เลื่อนลง */}
                      {index < remoteQueue.songs.length - 1 && (
                        <button
                          onClick={() => {
                            const newSongs = [...remoteQueue.songs];
                            const temp = newSongs[index];
                            newSongs[index] = newSongs[index + 1];
                            newSongs[index + 1] = temp;
                            reorderSongsInRoom(newSongs);
                            addToast(`เลื่อนเพลงลงแล้ว`, "info");
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-all active:scale-90"
                          title="เลื่อนลง"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}

                      {/* ลบเพลง */}
                      <button
                        onClick={() => {
                          removeSongFromRoom(index).then((success) => {
                            if (success) {
                              addToast(`ลบ "${song.title}" ออกจากคิวแล้ว`, "info");
                            }
                          });
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-90 transition-all"
                        title="ลบเพลงออกจากคิว"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-3 text-center">
        <p className="text-xs text-white/20">
          📱 โหมดมือถือ — ค้นหา เพิ่มเพลง และควบคุมการเล่นได้แบบเรียลไทม์
        </p>
      </footer>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
