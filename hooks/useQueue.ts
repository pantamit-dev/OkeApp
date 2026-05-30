"use client";

import { useState, useCallback } from "react";
import { Song } from "@/types/youtube";

export interface QueueState {
  songs: Song[];
  currentIndex: number;
  isRepeat: boolean;
}

export function useQueue() {
  const [queue, setQueue] = useState<QueueState>({
    songs: [],
    currentIndex: -1,
    isRepeat: false,
  });

  const addToQueue = useCallback(
    (song: Song): { success: boolean; message: string } => {
      // ตรวจสอบเพลงซ้ำ
      const isDuplicate = queue.songs.some((s) => s.videoId === song.videoId);
      if (isDuplicate) {
        return { success: false, message: `เพลง "${song.title}" อยู่ในคิวแล้ว` };
      }

      setQueue((prev) => {
        const newSongs = [...prev.songs, song];
        const newIndex = prev.currentIndex === -1 ? 0 : prev.currentIndex;
        return { ...prev, songs: newSongs, currentIndex: newIndex };
      });

      return { success: true, message: `เพิ่ม "${song.title}" เข้าคิวแล้ว` };
    },
    [queue.songs]
  );

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const newSongs = prev.songs.filter((_, i) => i !== index);
      let newIndex = prev.currentIndex;

      if (newSongs.length === 0) {
        newIndex = -1;
      } else if (index < prev.currentIndex) {
        newIndex = prev.currentIndex - 1;
      } else if (index === prev.currentIndex) {
        // ถ้าลบเพลงที่กำลังเล่นอยู่
        newIndex = Math.min(prev.currentIndex, newSongs.length - 1);
      }

      return { ...prev, songs: newSongs, currentIndex: newIndex };
    });
  }, []);

  const playNext = useCallback(() => {
    setQueue((prev) => {
      if (prev.songs.length === 0) return prev;

      if (prev.isRepeat) {
        // Repeat เพลงเดิม — ไม่เปลี่ยน index, ไม่ลบออก
        return { ...prev };
      }

      // ลบเพลงที่เล่นจบออกจากคิวแบบเรียลไทม์
      const newSongs = prev.songs.filter((_, i) => i !== prev.currentIndex);

      if (newSongs.length === 0) {
        // คิวหมดแล้ว
        return { songs: [], currentIndex: -1, isRepeat: prev.isRepeat };
      }

      // currentIndex คงที่ที่ 0 (เพลงถัดไปเลื่อนขึ้นมาแทน)
      const newIndex = Math.min(prev.currentIndex, newSongs.length - 1);
      return { ...prev, songs: newSongs, currentIndex: newIndex };
    });
  }, []);

  const playAt = useCallback((index: number) => {
    setQueue((prev) => {
      if (index < 0 || index >= prev.songs.length) return prev;
      return { ...prev, currentIndex: index };
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setQueue((prev) => ({ ...prev, isRepeat: !prev.isRepeat }));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue({ songs: [], currentIndex: -1, isRepeat: false });
  }, []);

  // จัดลำดับคิวเพลงใหม่ (drag-and-drop)
  // ห้ามย้ายเพลงที่กำลังเล่นอยู่
  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex === prev.currentIndex || // ห้ามย้ายเพลงที่กำลังเล่น
        fromIndex < 0 ||
        fromIndex >= prev.songs.length ||
        toIndex < 0 ||
        toIndex >= prev.songs.length ||
        toIndex === prev.currentIndex // ห้ามวางทับตำแหน่งเพลงที่กำลังเล่น
      ) {
        return prev;
      }

      const newSongs = [...prev.songs];
      const [movedSong] = newSongs.splice(fromIndex, 1);
      newSongs.splice(toIndex, 0, movedSong);

      // ปรับ currentIndex ให้ตรงกับเพลงเดิมที่กำลังเล่น
      let newCurrentIndex = prev.currentIndex;
      if (fromIndex < prev.currentIndex && toIndex >= prev.currentIndex) {
        newCurrentIndex = prev.currentIndex - 1;
      } else if (fromIndex > prev.currentIndex && toIndex <= prev.currentIndex) {
        newCurrentIndex = prev.currentIndex + 1;
      }

      return { ...prev, songs: newSongs, currentIndex: newCurrentIndex };
    });
  }, []);

  const currentSong =
    queue.currentIndex >= 0 && queue.currentIndex < queue.songs.length
      ? queue.songs[queue.currentIndex]
      : null;

  return {
    queue,
    currentSong,
    addToQueue,
    removeFromQueue,
    playNext,
    playAt,
    toggleRepeat,
    clearQueue,
    reorderQueue,
  };
}
