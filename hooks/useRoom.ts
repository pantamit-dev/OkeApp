"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Song } from "@/types/youtube";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RoomState {
  code: string | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
}

interface RoomQueue {
  songs: Song[];
  currentIndex: number;
  isRepeat: boolean;
}

export function useRoom() {
  const [room, setRoom] = useState<RoomState>({
    code: null,
    isHost: false,
    isConnected: false,
    error: null,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [remoteQueue, setRemoteQueue] = useState<RoomQueue | null>(null);

  // สร้าง Room Code (6 ตัวอักษร)
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // สร้างห้องใหม่
  const createRoom = useCallback(async () => {
    try {
      const code = generateCode();

      const { error } = await supabase.from("rooms").insert({
        code,
        queue: [],
        current_index: -1,
        is_repeat: false,
      });

      if (error) {
        // ถ้า code ซ้ำ ลองใหม่
        if (error.code === "23505") {
          return createRoom();
        }
        throw error;
      }

      setRoom({
        code,
        isHost: true,
        isConnected: true,
        error: null,
      });

      // Subscribe to realtime
      subscribeToRoom(code);

      return code;
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถสร้างห้องได้";
      setRoom((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  // เข้าร่วมห้อง
  const joinRoom = useCallback(async (code: string) => {
    try {
      const normalizedCode = code.toUpperCase().trim();

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", normalizedCode)
        .single();

      if (error || !data) {
        setRoom((prev) => ({
          ...prev,
          error: "ไม่พบห้องนี้ กรุณาตรวจสอบรหัสห้อง",
        }));
        return false;
      }

      setRoom({
        code: normalizedCode,
        isHost: false,
        isConnected: true,
        error: null,
      });

      // โหลดคิวปัจจุบัน
      setRemoteQueue({
        songs: (data.queue as Song[]) || [],
        currentIndex: data.current_index ?? -1,
        isRepeat: data.is_repeat ?? false,
      });

      // Subscribe to realtime
      subscribeToRoom(normalizedCode);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถเข้าห้องได้";
      setRoom((prev) => ({ ...prev, error: message }));
      return false;
    }
  }, []);

  // Subscribe to Realtime changes
  const subscribeToRoom = (code: string) => {
    // ยกเลิก subscription เดิม
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const data = payload.new;
          setRemoteQueue({
            songs: (data.queue as Song[]) || [],
            currentIndex: data.current_index ?? -1,
            isRepeat: data.is_repeat ?? false,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  // Sync คิวไปที่ Supabase (เฉพาะ Host หรือเมื่อเพิ่มเพลง)
  const syncQueue = useCallback(
    async (songs: Song[], currentIndex: number, isRepeat: boolean) => {
      if (!room.code) return;

      await supabase
        .from("rooms")
        .update({
          queue: songs,
          current_index: currentIndex,
          is_repeat: isRepeat,
        })
        .eq("code", room.code);
    },
    [room.code]
  );

  // เพิ่มเพลงเข้าคิวของห้อง (สำหรับ Guest)
  const addSongToRoom = useCallback(
    async (song: Song) => {
      if (!room.code) return false;

      // ดึงคิวปัจจุบัน
      const { data } = await supabase
        .from("rooms")
        .select("queue, current_index")
        .eq("code", room.code)
        .single();

      if (!data) return false;

      const currentQueue = (data.queue as Song[]) || [];

      // ตรวจซ้ำ
      if (currentQueue.some((s) => s.videoId === song.videoId)) {
        return false;
      }

      const newQueue = [...currentQueue, song];
      const newIndex = data.current_index === -1 ? 0 : data.current_index;

      await supabase
        .from("rooms")
        .update({ queue: newQueue, current_index: newIndex })
        .eq("code", room.code);

      return true;
    },
    [room.code]
  );

  // ออกจากห้อง
  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom({
      code: null,
      isHost: false,
      isConnected: false,
      error: null,
    });
    setRemoteQueue(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    room,
    remoteQueue,
    createRoom,
    joinRoom,
    syncQueue,
    addSongToRoom,
    leaveRoom,
  };
}
