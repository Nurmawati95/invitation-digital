"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { BRAND, COUPLE, EVENT_DATE } from "@/lib/wedding";
import { GoldDivider, GoldRing } from "./Ornaments";

/**
 * Panel kiri statis untuk layar desktop (split-screen).
 * Berlatar emerald dengan foto mempelai dalam bingkai arch bertepi emas.
 */
export function SidePanel() {
  return (
    <aside
      className="bg-ornament fixed inset-y-0 left-0 z-40 hidden w-[var(--panel-w)] flex-col justify-between overflow-hidden px-10 py-12 xl:px-14 lg:flex"
      aria-label="Informasi singkat undangan"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-6 rounded-[36px] border border-gold/20"
      />
      <LeafTexture />

      {/* Brand */}
      <div className="relative flex items-center gap-3">
        <img
          src={BRAND.logo}
          alt="UNDIGITAL"
          width={80}
          height={80}
          className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/50"
        />
        <div>
          <p className="font-display text-lg font-semibold tracking-[0.22em] text-white">
            {BRAND.name}
          </p>
          <p className="text-[0.55rem] uppercase tracking-[0.34em] text-gold">
            {BRAND.tagline}
          </p>
        </div>
      </div>

      {/* Foto mempelai */}
      <div className="relative flex flex-1 items-center justify-center py-8">
        <div className="relative w-full max-w-[330px]">
          <span
            aria-hidden="true"
            className="absolute -inset-6 rounded-full border border-dashed border-gold/30 animate-spin-slow"
          />
          <div className="relative aspect-[3/4] arch-frame border-[3px] border-gold/75 p-2 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.75)]">
            <img
              src="/images/hero.jpg"
              alt={`${COUPLE.groom.fullName} & ${COUPLE.bride.fullName}`}
              className="h-full w-full arch-frame object-cover"
            />
            <span className="pointer-events-none absolute inset-0 arch-frame bg-gradient-to-t from-emerald-deep/60 via-transparent to-emerald-deep/20" />
          </div>

          <span className="absolute -bottom-5 left-1/2 h-14 w-14 -translate-x-1/2">
            <GoldRing className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]" />
          </span>
        </div>
      </div>

      {/* Nama & tanggal */}
      <div className="relative space-y-5 text-center">
        <div className="space-y-3">
          <p className="text-[0.58rem] uppercase tracking-[0.45em] text-white/55">
            The Wedding of
          </p>
          <h2 className="font-display text-[2.6rem] font-light leading-[1.05] text-white xl:text-5xl">
            {COUPLE.groom.shortName}
            <span className="mx-2 text-gold">&amp;</span>
            {COUPLE.bride.shortName}
          </h2>
          <div className="mx-auto w-48">
            <GoldDivider />
          </div>
          <p className="flex items-center justify-center gap-2 text-sm text-white/80">
            <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
            {EVENT_DATE.day}, {EVENT_DATE.date} {EVENT_DATE.month} {EVENT_DATE.year}
          </p>
          <p className="flex items-center justify-center gap-2 text-xs text-white/55">
            <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            The Emerald Hall — Jakarta
          </p>
        </div>
      </div>
    </aside>
  );
}

function LeafTexture() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-gold"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="side-leaf-pattern"
          width="84"
          height="84"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(16)"
        >
          <g fill="currentColor" opacity="0.055">
            <path d="M42 10c12 12 16 24 12 36-8-10-12-22-12-36Z" />
            <path d="M42 10c-12 12-16 24-12 36 8-10 12-22 12-36Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#side-leaf-pattern)" />
    </svg>
  );
}
