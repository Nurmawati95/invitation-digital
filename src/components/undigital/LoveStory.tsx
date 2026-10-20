"use client";

import { LOVE_STORY } from "@/lib/wedding";
import { Reveal, Section, SectionHeading } from "./ui";
import { GoldLeaf } from "./Ornaments";

/** Love Story — vertical timeline bergaris emas dengan titik kuncup daun. */
export function LoveStory() {
  return (
    <Section id="story" className="bg-emerald-deep">
      <LeafTexture />

      <div className="relative mx-auto max-w-3xl">
        <Reveal>
          <SectionHeading
            tone="light"
            eyebrow="Our Journey"
            title="Love Story"
            subtitle="Setiap perjalanan memiliki awal. Berikut adalah rangkaian kisah yang membawa kami menuju hari yang ditunggu."
          />
        </Reveal>

        <ol className="relative mt-14 space-y-10 sm:space-y-12">
          {/* Garis emas vertikal */}
          <span
            aria-hidden="true"
            className="absolute left-[26px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent sm:left-[31px]"
          />

          {LOVE_STORY.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              delay={index * 90}
              className="relative flex gap-5 sm:gap-7"
            >
              {/* Titik ikon kuncup daun emas */}
              <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/45 bg-emerald-mid sm:h-16 sm:w-16">
                <span className="absolute inset-[5px] rounded-full border border-gold/20" />
                <span className="h-7 w-5 sm:h-8 sm:w-6">
                  <GoldLeaf />
                </span>
              </span>

              <div className="flex-1 rounded-3xl border border-gold/25 bg-emerald-mid/35 px-5 py-5 sm:px-7 sm:py-6">
                <p className="text-[0.6rem] uppercase tracking-[0.35em] text-gold">
                  {item.year}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-[1.7rem]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-[0.95rem]">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
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
          id="story-leaf-pattern"
          width="76"
          height="76"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(22)"
        >
          <g fill="currentColor" opacity="0.05">
            <path d="M38 10c11 11 15 23 11 34-8-9-11-21-11-34Z" />
            <path d="M38 10c-11 11-15 23-11 34 8-9 11-21 11-34Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#story-leaf-pattern)" />
    </svg>
  );
}
