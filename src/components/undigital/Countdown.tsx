"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, PartyPopper } from "lucide-react";
import {
  BRAND,
  COUPLE,
  EVENT_DATE,
  VENUES,
  buildGoogleCalendarUrl,
} from "@/lib/wedding";
import { Reveal, Section, SectionHeading } from "./ui";
import { GoldDivider } from "./Ornaments";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function computeRemaining(target: number): Remaining {
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: false,
  };
}

/** Countdown real-time + tombol Simpan ke Google Calendar. */
export function Countdown() {
  const target = useMemo(() => new Date(EVENT_DATE.iso).getTime(), []);
  const [remaining, setRemaining] = useState<Remaining>(() =>
    computeRemaining(target),
  );

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(computeRemaining(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const units: Array<{ label: string; value: number }> = [
    { label: "Hari", value: remaining.days },
    { label: "Jam", value: remaining.hours },
    { label: "Menit", value: remaining.minutes },
    { label: "Detik", value: remaining.seconds },
  ];

  return (
    <Section id="countdown" className="bg-emerald-deep">
      <LeafTexture />

      <div className="relative mx-auto max-w-3xl">
        <Reveal>
          <SectionHeading
            tone="light"
            eyebrow="Save the Date"
            title="Menghitung Hari"
            subtitle={`Kami tidak sabar menyambut momen bahagia ini bersama Anda pada ${EVENT_DATE.date} ${EVENT_DATE.month} ${EVENT_DATE.year}.`}
          />
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-12 grid grid-cols-4 gap-2 sm:gap-4">
            {units.map((unit) => (
              <div
                key={unit.label}
                className="relative overflow-hidden rounded-2xl border border-gold/30 bg-emerald-mid/50 px-1.5 py-4 text-center shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] sm:px-4 sm:py-6"
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
                <p
                  className="font-display text-gold-gradient text-3xl font-bold leading-none tabular-nums sm:text-5xl lg:text-6xl"
                  aria-live="polite"
                >
                  {String(unit.value).padStart(2, "0")}
                </p>
                <p className="mt-2 text-[0.58rem] uppercase tracking-[0.2em] text-white/65 sm:text-[0.68rem] sm:tracking-[0.28em]">
                  {unit.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {remaining.done ? (
          <Reveal delay={200}>
            <p className="mt-8 flex items-center justify-center gap-2 font-display text-2xl text-gold">
              <PartyPopper className="h-6 w-6" aria-hidden="true" />
              Alhamdulillah, hari bahagia telah tiba!
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={250}>
          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="w-48">
              <GoldDivider />
            </div>
            <a
              href={buildGoogleCalendarUrl(VENUES[0])}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold-gradient group inline-flex items-center gap-3 rounded-full px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-deep shadow-[0_16px_38px_-14px_rgba(229,184,66,0.7)] transition-all hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-deep active:scale-100 sm:text-sm"
            >
              <CalendarPlus className="h-5 w-5 transition-transform group-hover:rotate-12" aria-hidden="true" />
              Simpan ke Google Calendar
            </a>
            <p className="text-xs text-white/55">
              Atau bagikan undangan ini kepada keluarga &amp; sahabat Anda.
            </p>
            <p className="text-[0.62rem] uppercase tracking-[0.35em] text-white/35">
              {BRAND.name} — {BRAND.tagline}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
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
          id="countdown-leaf-pattern"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-14)"
        >
          <g fill="currentColor" opacity="0.05">
            <path d="M40 10c12 12 16 24 12 36-8-10-12-22-12-36Z" />
            <path d="M40 10c-12 12-16 24-12 36 8-10 12-22 12-36Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#countdown-leaf-pattern)" />
    </svg>
  );
}
