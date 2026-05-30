"use client";

import { Toast } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const typeStyles: Record<Toast["type"], { bg: string; icon: string }> = {
  success: {
    bg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-200",
    icon: "✓",
  },
  info: {
    bg: "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-200",
    icon: "🎵",
  },
  warning: {
    bg: "bg-amber-500/20 border-amber-500/30 text-amber-200",
    icon: "⚠️",
  },
  error: {
    bg: "bg-red-500/20 border-red-500/30 text-red-200",
    icon: "✕",
  },
};

export default function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[360px]">
      {toasts.map((toast) => {
        const style = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur-xl shadow-2xl shadow-black/30 animate-slide-up ${style.bg}`}
          >
            <span className="text-base flex-shrink-0">{style.icon}</span>
            <p className="flex-1 min-w-0 truncate">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 ml-1 opacity-60 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
