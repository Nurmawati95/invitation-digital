"use client";

import { ArrowDown, CalendarDays, MapPin } from "lucide-react";
import { BRAND, COUPLE, EVENT_DATE } from "@/lib/wedding";
import { cn } from "@/lib/utils";
import { GoldDivider, GoldRing } from "./Ornaments";

/**
 * Layar pembuka (full-screen lock). Menampilkan nama tamu dari URL
 * parameter `?to=`, foto utama dalam bingkai arch bertepi emas, dan
 * tombol "Buka Undangan" yang membuka scroll + memutar musik latar.
 */
export function CoverGate({
  guestName,
  onOpen,
  reveal,
  leaving,
}: {
  guestName: string;
  onOpen: () => void;
  /** Animasi masuk diputar setelah pre-loader selesai. */
  reveal: boolean;
  /** Layar bergeser ke atas saat undangan dibuka. */
  leaving: boolean;
}) {
  return (
    <div
      aria-hidden={leaving}
      inert={leaving || !reveal}
      className={cn(
        "bg-ornament fixed inset-0 z-[60] flex flex-col overflow-y-auto transition-transform duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
        leaving ? "-translate-y-full" : "translate-y-0",
      )}
    >
      {/* Ornamen garis emas tipis di tepi */}
      <span className="pointer-events-none absolute inset-4 rounded-[36px] border border-gold/25 sm:inset-7" />
      <span className="pointer-events-none absolute inset-[22px] rounded-[28px] border border-gold/10 sm:inset-[34px]" />
      <LeafPattern />

      <div className="relative flex min-h-full flex-col items-center justify-center gap-8 px-6 py-14 sm:px-10 sm:py-16">
        {/* Brand */}
        <div
          className={cn(
            "flex flex-col items-center gap-3 transition-all delay-100 duration-[900ms]",
            reveal ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <img
            src={BRAND.logo}
            alt="UNDIGITAL"
            width={96}
            height={96}
            className="h-16 w-16 rounded-full object-cover ring-1 ring-gold/50 sm:h-20 sm:w-20"
          />
          <p className="text-[0.6rem] uppercase tracking-[0.5em] text-gold sm:text-[0.68rem]">
            {BRAND.tagline}
          </p>
        </div>

        {/* Foto utama dalam arch frame */}
        <div
          className={cn(
            "relative transition-all delay-200 duration-[1000ms]",
            reveal ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
          <div className="absolute -inset-5 rounded-full border border-dashed border-gold/35 animate-spin-slow" />
          <div className="relative h-56 w-44 arch-frame border-[3px] border-gold/80 p-[6px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6)] sm:h-72 sm:w-56">
            <img
              src="/images/hero.jpg"
              alt={`${COUPLE.groom.fullName} & ${COUPLE.bride.fullName}`}
              className="h-full w-full arch-frame object-cover"
            />
            <span className="pointer-events-none absolute inset-0 arch-frame bg-gradient-to-t from-emerald-deep/55 via-transparent to-transparent" />
          </div>
          <span className="absolute -bottom-4 left-1/2 h-14 w-14 -translate-x-1/2">
            <GoldRing className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]" />
          </span>
        </div>

        {/* Nama mempelai & tanggal */}
        <div
          className={cn(
            "flex flex-col items-center gap-4 text-center transition-all delay-300 duration-[1000ms]",
            reveal ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
        >
          <p className="text-[0.62rem] uppercase tracking-[0.45em] text-white/60 sm:text-xs">
            The Wedding of
          </p>
          <h1 className="font-display text-[2.6rem] font-light leading-[1.05] text-white sm:text-6xl">
            {COUPLE.groom.shortName}
            <span className="mx-3 inline-block align-middle text-gold">&amp;</span>
            {COUPLE.bride.shortName}
          </h1>
          <GoldDivider width="w-56" />
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
              {EVENT_DATE.day}, {EVENT_DATE.date} {EVENT_DATE.month} {EVENT_DATE.year}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-gold/60 sm:block" />
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
              The Emerald Hall, Jakarta
            </span>
          </p>
        </div>

        {/* Nama tamu (glassmorphism) */}
        <div
          className={cn(
            "glass w-full max-w-sm rounded-2xl px-6 py-5 text-center transition-all delay-500 duration-[1000ms]",
            reveal ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-gold">
            Kepada Yth. Bapak / Ibu / Saudara/i
          </p>
          <p className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
            {guestName}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir pada
            hari bahagia kami.
          </p>
        </div>

        {/* Tombol Buka Undangan */}
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "bg-gold-gradient group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-9 py-4 text-sm font-bold uppercase tracking-[0.22em] text-emerald-deep shadow-[0_18px_40px_-12px_rgba(229,184,66,0.65)] transition-all delay-700 duration-[1000ms] hover:scale-[1.04] hover:shadow-[0_22px_50px_-10px_rgba(229,184,66,0.8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-deep active:scale-[0.98]",
            reveal ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] group-hover:translate-x-full" />
          <span className="relative">Buka Undangan</span>
          <ArrowDown className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Pola daun halus sebagai tekstur latar. */
function LeafPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-gold"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="cover-leaf-pattern"
          width="70"
          height="70"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(20)"
        >
          <g fill="currentColor" opacity="0.07">
            <path d="M35 8c11 11 15 22 11 33-7-9-11-20-11-33Z" />
            <path d="M35 8c-11 11-15 22-11 33 7-9 11-20 11-33Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cover-leaf-pattern)" />
    </svg>
  );
}
