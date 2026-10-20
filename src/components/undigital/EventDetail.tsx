"use client";

import { CalendarDays, Clock, MapPin, Navigation, PartyPopper } from "lucide-react";
import {
  COUPLE,
  MAP_DIRECTIONS_SRC,
  MAP_EMBED_SRC,
  VENUES,
  buildGoogleCalendarUrl,
} from "@/lib/wedding";
import { OrnamentCard, Reveal, Section, SectionHeading } from "./ui";
import { GoldDivider } from "./Ornaments";

/** Detail waktu & lokasi: kartu Akad Nikah + Resepsi, peta & tombol arah. */
export function EventDetail() {
  return (
    <Section id="event" className="bg-mist">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow="Waktu & Tempat"
            title="Detail Acara"
            subtitle="Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu."
          />
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {VENUES.map((venue, index) => (
            <Reveal key={venue.key} delay={index * 140}>
              <OrnamentCard className="h-full">
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.4em] text-gold-deep">
                        {venue.subtitle}
                      </p>
                      <h3 className="mt-2 font-display text-3xl font-semibold text-emerald-deep">
                        {venue.title}
                      </h3>
                    </div>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/40 bg-emerald-deep text-gold">
                      {venue.key === "akad" ? (
                        <Clock className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <PartyPopper className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                  </div>

                  <div className="w-full">
                    <GoldDivider />
                  </div>

                  <dl className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <div>
                        <dt className="text-[0.62rem] uppercase tracking-[0.25em] text-ink-soft">
                          Hari &amp; Tanggal
                        </dt>
                        <dd className="mt-1 font-semibold text-ink">
                          {venue.day}, {venue.date}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <div>
                        <dt className="text-[0.62rem] uppercase tracking-[0.25em] text-ink-soft">
                          Waktu
                        </dt>
                        <dd className="mt-1 font-semibold text-ink">{venue.time}</dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <div>
                        <dt className="text-[0.62rem] uppercase tracking-[0.25em] text-ink-soft">
                          Lokasi
                        </dt>
                        <dd className="mt-1 font-semibold text-ink">{venue.venue}</dd>
                        <dd className="mt-1 leading-relaxed text-ink-soft">{venue.address}</dd>
                      </div>
                    </div>
                  </dl>

                  <p className="rounded-2xl border border-gold/25 bg-mist px-4 py-3 text-xs leading-relaxed text-ink-soft">
                    {venue.note}
                  </p>

                  <a
                    href={buildGoogleCalendarUrl(venue)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-deep/20 px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-deep transition-all hover:border-gold hover:bg-emerald-deep hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Simpan Jadwal {venue.title}
                  </a>
                </div>
              </OrnamentCard>
            </Reveal>
          ))}
        </div>

        {/* Peta interaktif */}
        <Reveal delay={200}>
          <div className="mt-12 overflow-hidden rounded-[32px] border border-gold/35 bg-white shadow-[0_24px_60px_-30px_rgba(20,59,39,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 px-6 py-5">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-gold-deep">
                  Lokasi Acara
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-emerald-deep">
                  The Emerald Hall — Pendopo Agung
                </p>
              </div>
              <a
                href={MAP_DIRECTIONS_SRC}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-deep shadow-[0_14px_32px_-14px_rgba(229,184,66,0.75)] transition-all hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Petunjuk Lokasi
              </a>
            </div>
            <div className="relative h-[320px] w-full sm:h-[420px]">
              <iframe
                title={`Peta lokasi pernikahan ${COUPLE.groom.shortName} & ${COUPLE.bride.shortName}`}
                src={MAP_EMBED_SRC}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
