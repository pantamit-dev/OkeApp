"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseYouTubePlayerOptions {
  onEnded?: () => void;
  onPlaying?: () => void;
  onPaused?: () => void;
}

export function useYouTubePlayer(
  containerId: string,
  options: UseYouTubePlayerOptions = {}
) {
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // โหลด YouTube IFrame API script
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ถ้าโหลดแล้ว ไม่ต้องโหลดอีก
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const initPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    playerRef.current = new window.YT.Player(containerId, {
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: 0,
        controls: 0,
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        fs: 0,
      },
      events: {
        onReady: (event: YT.PlayerEvent) => {
          setIsReady(true);
          event.target.setVolume(80);
        },
        onStateChange: (event: YT.OnStateChangeEvent) => {
          switch (event.data) {
            case 0: // ENDED
              setIsPlaying(false);
              if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
              }
              optionsRef.current.onEnded?.();
              break;
            case 1: // PLAYING
              setIsPlaying(true);
              setDuration(event.target.getDuration());
              // อัปเดตเวลาทุก 500ms
              if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
              }
              timeIntervalRef.current = setInterval(() => {
                if (playerRef.current) {
                  setCurrentTime(playerRef.current.getCurrentTime());
                }
              }, 500);
              optionsRef.current.onPlaying?.();
              break;
            case 2: // PAUSED
              setIsPlaying(false);
              if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
              }
              optionsRef.current.onPaused?.();
              break;
            case 3: // BUFFERING
              break;
          }
        },
        onError: (event: YT.OnErrorEvent) => {
          console.error("YouTube Player Error:", event.data);
          // ข้ามไปเพลงถัดไปเมื่อเกิด error
          optionsRef.current.onEnded?.();
        },
      },
    });
  }, [containerId]);

  const loadVideo = useCallback(
    (videoId: string) => {
      if (playerRef.current && isReady) {
        playerRef.current.loadVideoById(videoId);
      }
    },
    [isReady]
  );

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pauseVideo();
    } else {
      playerRef.current?.playVideo();
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    playerRef.current?.stopVideo();
    setIsPlaying(false);
  }, []);

  const mute = useCallback(() => {
    playerRef.current?.mute();
    setIsMuted(true);
  }, []);

  const unmute = useCallback(() => {
    playerRef.current?.unMute();
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (playerRef.current?.isMuted()) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current?.mute();
      setIsMuted(true);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    playerRef.current?.setVolume(clamped);
    setVolumeState(clamped);
    if (clamped === 0) {
      setIsMuted(true);
    } else if (playerRef.current?.isMuted()) {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  return {
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
    stop,
    mute,
    unmute,
    toggleMute,
    setVolume,
    seekTo,
  };
}
