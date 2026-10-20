"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/wedding";
import { GoldDivider } from "./Ornaments";

/**
 * Pre-loader: logo UNDIGITAL di tengah layar dengan efek pulse halus,
 * ditambah indikator progres sebelum halaman siap ditampilkan.
 */
export function Preloader({ onFinished }: { onFinished: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(8);
  const finishedRef = useRef(false);

  useEffect(() => {
    // Progres naik perlahan, lalu lompat ke 100% saat dokumen siap.
    const ticker = window.setInterval(() => {
      setProgress((prev) => (prev >= 92 ? prev : prev + Math.random() * 9));
    }, 160);

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      window.clearInterval(ticker);
      setProgress(100);
      setLeaving(true);
      window.setTimeout(onFinished, 700);
    };

    const safety = window.setTimeout(finish, 4200);
    const onLoad = () => window.setTimeout(finish, 500);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);

    return () => {
      window.clearInterval(ticker);
      window.clearTimeout(safety);
      window.removeEventListener("load", onLoad);
    };
  }, [onFinished]);

  return (
    <div
      role="status"
      aria-label="Memuat undangan"
      className={`bg-ornament fixed inset-0 z-[70] grid place-items-center px-8 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        leaving ? "pointer-events-none -translate-y-6 opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-7 text-center">
        <div className="animate-pulse-logo relative h-28 w-28 sm:h-32 sm:w-32">
          <div className="absolute inset-0 rounded-full bg-gold/25 blur-2xl" aria-hidden="true" />
          <img
            src={BRAND.logo}
            alt="Logo UNDIGITAL"
            width={512}
            height={512}
            className="relative h-full w-full rounded-full object-cover ring-1 ring-gold/50"
          />
        </div>

        <div className="space-y-1">
          <p className="font-display text-3xl font-semibold tracking-[0.2em] text-white">
            {BRAND.name}
          </p>
          <p className="text-[0.62rem] uppercase tracking-[0.4em] text-gold">
            {BRAND.tagline}
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="bg-gold-gradient h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.round(progress))}%` }}
            />
          </div>
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-white/55">
            Menyiapkan undangan… {Math.min(100, Math.round(progress))}%
          </p>
        </div>

        <div className="w-40">
          <GoldDivider />
        </div>
      </div>
    </div>
  );
}
