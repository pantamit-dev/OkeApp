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
  isPlaying?: boolean;
  lastCommand?: { action: string; timestamp: number } | null;
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

  // Subscribe to Realtime changes
  const subscribeToRoom = useCallback((code: string) => {
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
            isPlaying: data.is_playing ?? false,
            lastCommand: data.last_command || null,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  // สร้างห้องใหม่
  const createRoom = useCallback(async () => {
    try {
      let code = "";
      let success = false;
      let retries = 0;

      while (!success && retries < 5) {
        code = generateCode();
        const { error } = await supabase.from("rooms").insert({
          code,
          queue: [],
          current_index: -1,
          is_repeat: false,
        });

        if (!error) {
          success = true;
        } else if (error.code === "23505") {
          retries++;
        } else {
          throw error;
        }
      }

      if (!success) {
        throw new Error("ไม่สามารถสุ่มรหัสห้องที่ไม่ซ้ำกันได้");
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
  }, [subscribeToRoom]);

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
        isPlaying: data.is_playing ?? false,
        lastCommand: data.last_command || null,
      });

      // Subscribe to realtime
      subscribeToRoom(normalizedCode);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถเข้าห้องได้";
      setRoom((prev) => ({ ...prev, error: message }));
      return false;
    }
  }, [subscribeToRoom]);

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

  // ลบเพลงออกจากคิว (สำหรับ Remote control)
  const removeSongFromRoom = useCallback(
    async (index: number) => {
      if (!room.code) return false;

      const { data } = await supabase
        .from("rooms")
        .select("queue, current_index")
        .eq("code", room.code)
        .single();

      if (!data) return false;

      const currentQueue = (data.queue as Song[]) || [];
      const newQueue = currentQueue.filter((_, i) => i !== index);
      let newIndex = data.current_index ?? -1;

      if (newQueue.length === 0) {
        newIndex = -1;
      } else if (newIndex >= newQueue.length) {
        newIndex = newQueue.length - 1;
      } else if (index < newIndex) {
        newIndex = newIndex - 1;
      }

      const { error } = await supabase
        .from("rooms")
        .update({ queue: newQueue, current_index: newIndex })
        .eq("code", room.code);

      return !error;
    },
    [room.code]
  );

  // สลับลำดับเพลง (สำหรับ Remote control)
  const reorderSongsInRoom = useCallback(
    async (newSongs: Song[]) => {
      if (!room.code) return false;

      const { error } = await supabase
        .from("rooms")
        .update({ queue: newSongs })
        .eq("code", room.code);

      return !error;
    },
    [room.code]
  );

  // ส่งคำสั่งการเล่นเพลง (สำหรับ Remote control เช่น PLAY, PAUSE, NEXT, REPLAY)
  const sendPlaybackCommand = useCallback(
    async (action: "PLAY" | "PAUSE" | "NEXT" | "REPLAY" | "play" | "pause" | "next" | "replay") => {
      if (!room.code) return false;

      const upperAction = action.toUpperCase() as "PLAY" | "PAUSE" | "NEXT" | "REPLAY";
      const updates: any = {
        last_command: {
          action: upperAction,
          timestamp: Date.now(),
        },
      };

      // อัปเดตสถานะ is_playing ควบคู่ไปด้วย
      if (upperAction === "PLAY") {
        updates.is_playing = true;
      } else if (upperAction === "PAUSE") {
        updates.is_playing = false;
      }

      const { error } = await supabase
        .from("rooms")
        .update(updates)
        .eq("code", room.code);

      return !error;
    },
    [room.code]
  );

  // ซิงค์สถานะการเล่นจริงกลับไปที่ DB (สำหรับ Host)
  const syncPlayState = useCallback(
    async (isPlaying: boolean) => {
      if (!room.code) return;

      await supabase
        .from("rooms")
        .update({ is_playing: isPlaying })
        .eq("code", room.code);
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
    removeSongFromRoom,
    reorderSongsInRoom,
    sendPlaybackCommand,
    syncPlayState,
    leaveRoom,
  };
}
