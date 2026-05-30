"use client";

import { useState } from "react";

interface RoomPanelProps {
  roomCode: string | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  onCreateRoom: () => Promise<string | null>;
  onJoinRoom: (code: string) => Promise<boolean>;
  onLeaveRoom: () => void;
}

export default function RoomPanel({
  roomCode,
  isHost,
  isConnected,
  error,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}: RoomPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    await onCreateRoom();
    setIsLoading(false);
  };

  const handleJoin = async () => {
    if (joinCode.length < 6) return;
    setIsLoading(true);
    await onJoinRoom(joinCode);
    setIsLoading(false);
  };

  const shareUrl =
    typeof window !== "undefined" && roomCode
      ? `${window.location.origin}/room/${roomCode}`
      : "";

  const qrUrl = roomCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=09090b&color=d946ef`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {/* ปุ่มเปิด/ปิด Panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
          isConnected
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-white/5 text-white/60 hover:border-fuchsia-500/30 hover:text-fuchsia-300"
        }`}
      >
        <span>{isConnected ? "🟢" : "📡"}</span>
        {isConnected ? `ห้อง ${roomCode}` : "แชร์ห้องร้อง"}
      </button>

      {/* Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl animate-slide-up">
          {isConnected ? (
            /* ===== เชื่อมต่อแล้ว ===== */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">
                  {isHost ? "คุณเป็นเจ้าของห้อง" : "คุณเข้าร่วมห้อง"}
                </p>
                <p className="text-2xl font-bold tracking-[0.3em] text-fuchsia-300">
                  {roomCode}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-xl border border-white/10 bg-white p-2">
                  <img
                    src={qrUrl}
                    alt="QR Code สำหรับเข้าห้อง"
                    className="h-32 w-32"
                    width={128}
                    height={128}
                  />
                </div>
              </div>

              {/* Share URL */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="rounded-lg bg-fuchsia-500/20 px-3 py-2 text-xs font-medium text-fuchsia-300 transition-all hover:bg-fuchsia-500/30 active:scale-95"
                >
                  {copied ? "✓" : "คัดลอก"}
                </button>
              </div>

              <button
                onClick={() => {
                  onLeaveRoom();
                  setIsOpen(false);
                }}
                className="w-full rounded-xl bg-red-500/10 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
              >
                ออกจากห้อง
              </button>
            </div>
          ) : (
            /* ===== ยังไม่เชื่อมต่อ ===== */
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white/90 text-center">
                📡 แชร์ห้องร้อง
              </h3>
              <p className="text-xs text-white/40 text-center">
                สร้างห้องแล้วส่ง QR Code ให้เพื่อน
                <br />
                ทุกคนเพิ่มเพลงเข้าคิวร่วมกันได้!
              </p>

              {/* สร้างห้อง */}
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 py-2.5 text-sm font-medium text-white transition-all hover:from-fuchsia-500 hover:to-purple-500 hover:shadow-lg hover:shadow-fuchsia-500/25 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "กำลังสร้าง..." : "🏠 สร้างห้องใหม่"}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/30">หรือ</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* เข้าร่วมห้อง */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="ใส่รหัสห้อง"
                  maxLength={6}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-fuchsia-500/50 tracking-[0.2em] text-center font-mono"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 6 || isLoading}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/15 active:scale-95 disabled:opacity-30"
                >
                  เข้าร่วม
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
