"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw } from "lucide-react";
import { CINEMATIC_FRAMES } from "@/lib/wedding";
import { cn } from "@/lib/utils";
import { Reveal, Section, SectionHeading } from "./ui";

const FRAME_DURATION = 5; // detik per foto
const TOTAL = CINEMATIC_FRAMES.length * FRAME_DURATION;

/**
 * Pemutar "video" pre-wedding: deretan foto dengan transisi cross-fade dan
 * efek Ken Burns, dilengkapi kontrol pemutaran, seek bar, timer, dan
 * fullscreen — berjalan sepenuhnya di sisi klien.
 */
export function CinematicPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const activeIndex = Math.min(
    CINEMATIC_FRAMES.length - 1,
    Math.floor(time / FRAME_DURATION),
  );

  // Loop animasi
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setTime((prev) => (prev + delta) % TOTAL);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // Pantau status fullscreen
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const node = containerRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen?.();
    } catch {
      /* browser menolak — abaikan */
    }
  }, []);

  const restart = useCallback(() => {
    setTime(0);
    setPlaying(true);
  }, []);

  return (
    <Section id="video" className="bg-white">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionHeading
            eyebrow="Pre-Wedding Cinematic"
            title="Video Perjalanan Kami"
            subtitle="Saksikan rangkaian momen terindah kami dalam satu putaran sinematik."
          />
        </Reveal>

        <Reveal delay={150}>
          <div
            ref={containerRef}
            className="group relative mt-12 overflow-hidden rounded-[32px] border border-gold/40 bg-emerald-deep shadow-[0_30px_70px_-32px_rgba(20,59,39,0.5)]"
          >
            {/* Bingkai video */}
            <div className="relative aspect-video w-full">
              {CINEMATIC_FRAMES.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`Pre-wedding frame ${index + 1}`}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out",
                    index === activeIndex ? "opacity-100" : "opacity-0",
                  )}
                  style={
                    index === activeIndex && playing
                      ? { animation: "ken-burns 5s ease-in-out infinite alternate" }
                      : undefined
                  }
                />
              ))}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-deep/85 via-transparent to-emerald-deep/25" />

              {/* Judul & caption */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-7">
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.4em] text-gold">
                    UNDIGITAL Cinematic
                  </p>
                  <p className="mt-2 font-display text-2xl text-white sm:text-3xl">
                    Adit &amp; Naya
                  </p>
                </div>
                <span className="rounded-full border border-gold/40 bg-emerald-deep/60 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-gold backdrop-blur-sm">
                  {activeIndex + 1}/{CINEMATIC_FRAMES.length}
                </span>
              </div>

              {/* Overlay putar saat dijeda */}
              {!playing ? (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  aria-label="Lanjutkan pemutaran"
                  className="absolute inset-0 grid place-items-center bg-emerald-deep/35 backdrop-blur-[2px] transition-opacity"
                >
                  <span className="grid h-20 w-20 place-items-center rounded-full border border-gold/60 bg-emerald-deep/70 text-gold">
                    <Play className="ml-1 h-8 w-8" aria-hidden="true" />
                  </span>
                </button>
              ) : null}
            </div>

            {/* Kontrol pemutaran */}
            <div className="relative border-t border-gold/25 bg-emerald-deep px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setPlaying((prev) => !prev)}
                  aria-label={playing ? "Jedakan video" : "Putar video"}
                  className="bg-gold-gradient grid h-11 w-11 shrink-0 place-items-center rounded-full text-emerald-deep transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-deep"
                >
                  {playing ? (
                    <Pause className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={restart}
                  aria-label="Putar ulang dari awal"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 text-gold transition-colors hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>

                <span className="shrink-0 font-mono text-[0.7rem] tabular-nums text-white/70 sm:text-xs">
                  {formatTime(time)}
                </span>

                <label className="relative flex-1">
                  <span className="sr-only">Posisi pemutaran video</span>
                  <input
                    type="range"
                    min={0}
                    max={TOTAL}
                    step={0.1}
                    value={time}
                    onChange={(event) => setTime(Number(event.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-gold"
                    style={{
                      background: `linear-gradient(to right, #E5B842 ${(time / TOTAL) * 100}%, rgba(255,255,255,0.18) ${(time / TOTAL) * 100}%)`,
                    }}
                  />
                </label>

                <span className="shrink-0 font-mono text-[0.7rem] tabular-nums text-white/50 sm:text-xs">
                  {formatTime(TOTAL)}
                </span>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? "Keluar layar penuh" : "Layar penuh"}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 text-gold transition-colors hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {fullscreen ? (
                    <Minimize className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Maximize className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
