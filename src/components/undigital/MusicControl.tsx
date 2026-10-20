"use client";

import { Music, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tombol putar/jeda musik latar di pojok kanan bawah.
 * Muncul hanya setelah tamu membuka undangan.
 */
export function MusicControl({
  playing,
  onToggle,
  visible,
}: {
  playing: boolean;
  onToggle: () => void;
  visible: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? "Jedakan musik latar" : "Putar musik latar"}
      aria-pressed={playing}
      title={playing ? "Jedakan musik" : "Putar musik"}
      className={cn(
        "fixed bottom-20 right-4 z-[66] grid h-12 w-12 place-items-center rounded-full border border-gold/45 bg-emerald-deep/95 text-gold shadow-[0_16px_36px_-14px_rgba(20,59,39,0.7)] backdrop-blur-xl transition-all duration-500 hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-deep lg:bottom-8 lg:right-8",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      {playing ? (
        <>
          <span
            className="absolute inset-0 animate-ping rounded-full border border-gold/40"
            aria-hidden="true"
          />
          <Music className="h-5 w-5 animate-pulse" aria-hidden="true" />
          <span className="sr-only">Musik latar sedang diputar</span>
        </>
      ) : (
        <Pause className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
