"use client";

import { AtSign, MessageCircle } from "lucide-react";
import { BRAND, COUPLE } from "@/lib/wedding";
import { GoldDivider, Monogram } from "./Ornaments";
import { Reveal } from "./ui";

/**
 * Footer undangan: ucapan terima kasih dari kedua mempelai +
 * credit footer khusus brand UNDIGITAL.
 */
export function BrandFooter({ guestName }: { guestName: string }) {
  return (
    <footer className="relative">
      {/* Ucapan terima kasih */}
      <div className="bg-ornament relative overflow-hidden px-5 pb-28 pt-20 text-center sm:px-8 sm:pb-32 lg:px-14">
        <LeafTexture />

        <div className="relative mx-auto max-w-2xl">
          <Reveal>
            <p className="text-[0.6rem] uppercase tracking-[0.45em] text-gold">
              Terima Kasih
            </p>
            <h2 className="mt-5 font-display text-4xl font-light leading-tight text-white sm:text-5xl">
              Merupakan suatu kebahagiaan
              <br className="hidden sm:block" /> bagi kami apabila Anda
              <br className="hidden sm:block" /> berkenan hadir.
            </h2>
            <div className="mx-auto my-8 w-56">
              <GoldDivider />
            </div>
            <p className="text-sm leading-relaxed text-white/75 sm:text-base">
              Atas kehadiran dan doa restu yang telah Anda berikan, kami
              mengucapkan terima kasih yang sebesar-besarnya. Semoga kebahagiaan
              ini menjadi awal dari keluarga yang penuh cinta dan berkah.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="mt-10 flex flex-col items-center gap-5">
              <Monogram initials="A&N" size={84} />
              <p className="font-display text-3xl font-semibold text-white sm:text-4xl">
                {COUPLE.groom.shortName} <span className="text-gold">&amp;</span>{" "}
                {COUPLE.bride.shortName}
              </p>
              <p className="text-xs text-white/55">
                Beserta keluarga besar {COUPLE.groom.father} &amp;{" "}
                {COUPLE.groom.mother}, serta {COUPLE.bride.father} &amp;{" "}
                {COUPLE.bride.mother}.
              </p>
            </div>
          </Reveal>

          <Reveal delay={250}>
            <p className="mt-10 text-xs italic text-white/50">
              “Kami yang mengundang: {guestName} — sampai jumpa di hari bahagia
              kami.”
            </p>
          </Reveal>
        </div>
      </div>

      {/* Credit footer UNDIGITAL */}
      <div className="relative bg-emerald-deep px-5 pb-28 pt-8 sm:px-8 lg:px-14 lg:pb-28">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center gap-6 border-t border-gold/20 pt-8 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={BRAND.logo}
                alt="Logo UNDIGITAL"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-gold/50"
              />
              <p className="text-xs text-white/75 sm:text-sm">
                Created with <span className="text-red-400">❤️</span> by{" "}
                <span className="font-semibold tracking-[0.18em] text-gold">
                  {BRAND.name}
                </span>{" "}
                — {BRAND.tagline}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp UNDIGITAL"
                className="group inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold transition-all hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                WhatsApp
              </a>
              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram UNDIGITAL"
                className="group inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold transition-all hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <AtSign className="h-3.5 w-3.5" aria-hidden="true" />
                Instagram
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
            <p className="text-[0.6rem] uppercase tracking-[0.28em] text-white/35">
              © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
            </p>
            <p className="text-[0.6rem] text-white/35">
              Tertarik membuat undangan serupa?{" "}
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-light"
              >
                Pesan di sini
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
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
          id="footer-leaf-pattern"
          width="88"
          height="88"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(24)"
        >
          <g fill="currentColor" opacity="0.05">
            <path d="M44 10c12 12 16 25 12 37-8-10-12-23-12-37Z" />
            <path d="M44 10c-12 12-16 25-12 37 8-10 12-23 12-37Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#footer-leaf-pattern)" />
    </svg>
  );
}
