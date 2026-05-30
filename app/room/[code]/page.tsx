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
  const { room, remoteQueue, joinRoom, addSongToRoom } = useRoom();
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
              KaraokeApp
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

        {/* คิวเพลงปัจจุบัน */}
        {remoteQueue && remoteQueue.songs.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span>🎵</span>
              <h2 className="text-sm font-semibold text-white/90">คิวเพลง</h2>
              <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs font-medium text-fuchsia-300">
                {remoteQueue.songs.length}
              </span>
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
                    <div className="relative h-8 w-12 flex-shrink-0 overflow-hidden rounded">
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-3 text-center">
        <p className="text-xs text-white/20">
          📱 โหมดมือถือ — เพิ่มเพลงเข้าคิวจากที่นี่
        </p>
      </footer>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
