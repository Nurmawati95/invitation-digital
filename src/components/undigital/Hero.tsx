"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, MapPin } from "lucide-react";
import { COUPLE, EVENT_DATE, QUOTE } from "@/lib/wedding";
import { GoldDivider } from "./Ornaments";
import { Reveal } from "./ui";

/** Hero: foto pre-wedding dengan transisi fade-in + kutipan suci. */
export function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setLoaded(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section id="home" data-section="home" className="relative">
      {/* Foto pre-wedding */}
      <div className="relative h-[100svh] min-h-[620px] w-full overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt={`${COUPLE.groom.fullName} & ${COUPLE.bride.fullName}`}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            loaded ? "scale-100 opacity-100" : "scale-110 opacity-0"
          }`}
        />
        {/* Animasi Ken Burns halus */}
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-ken-burns bg-[url('/images/hero.jpg')] bg-cover bg-center mix-blend-overlay opacity-40"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-emerald-deep/80 via-emerald-deep/45 to-emerald-deep"
        />

        <div className="relative flex h-full flex-col items-center justify-end gap-6 px-6 pb-28 text-center sm:px-10 sm:pb-32">
          <p
            className={`text-[0.62rem] uppercase tracking-[0.5em] text-gold transition-all delay-300 duration-[1200ms] sm:text-xs ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            The Wedding Celebration of
          </p>

          <h1
            className={`font-display text-[3.2rem] font-light leading-[0.98] text-white transition-all delay-500 duration-[1400ms] sm:text-7xl lg:text-8xl ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            {COUPLE.groom.shortName}
            <span className="mx-2 inline-block text-gold sm:mx-4">&amp;</span>
            {COUPLE.bride.shortName}
          </h1>

          <div
            className={`transition-all delay-700 duration-[1200ms] ${
              loaded ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <GoldDivider width="w-64" />
          </div>

          <p
            className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/85 transition-all delay-[850ms] duration-[1200ms] sm:text-base ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
              {EVENT_DATE.day}, {EVENT_DATE.date} {EVENT_DATE.month} {EVENT_DATE.year}
            </span>
            <span className="h-1 w-1 rounded-full bg-gold" />
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
              The Emerald Hall, Jakarta
            </span>
          </p>
        </div>

        {/* Indikator scroll */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 sm:bottom-28">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[0.58rem] uppercase tracking-[0.35em] text-white/55">
              Scroll
            </span>
            <ChevronDown className="h-5 w-5 animate-bounce-soft text-gold" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Kutipan suci */}
      <div className="relative bg-emerald-deep px-5 pb-20 pt-6 sm:px-8 sm:pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-deep to-transparent" />
        <Reveal className="relative mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-[32px] border border-gold/35 bg-emerald-mid/40 px-6 py-10 text-center sm:px-12 sm:py-14">
            <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-gold/10 blur-3xl" />

            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-gold">
              {QUOTE.source}
            </p>
            <p
              dir="rtl"
              lang="ar"
              className="mt-6 font-display text-2xl leading-[2.1] text-white sm:text-3xl sm:leading-[2]"
            >
              {QUOTE.arabic}
            </p>
            <div className="mx-auto my-7 w-44">
              <GoldDivider />
            </div>
            <p className="text-sm leading-relaxed text-white/80 sm:text-base">
              {QUOTE.translation}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
