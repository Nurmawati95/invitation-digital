"use client";

import { AtSign } from "lucide-react";
import { COUPLE } from "@/lib/wedding";
import { Reveal, Section, SectionHeading } from "./ui";
import { GoldLeaf, GoldRing } from "./Ornaments";

type Person = (typeof COUPLE)[keyof typeof COUPLE];

/** Profil Mempelai — foto bulat beraksen daun emas + tombol Instagram. */
export function Couple() {
  return (
    <Section id="couple" className="bg-mist">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow="Bismillah"
            title="Kedua Mempelai"
            subtitle="Dengan memohon rahmat dan ridho Allah Subhanahu wa Ta'ala, kami menyampaikan kabar bahagia ini."
          />
        </Reveal>

        <div className="mt-14 grid gap-12 sm:mt-16 sm:gap-10 md:grid-cols-2 md:gap-8">
          <PersonCard person={COUPLE.groom} align="left" />
          <PersonCard person={COUPLE.bride} align="right" />
        </div>

        <Reveal delay={200}>
          <div className="mt-16 flex items-center justify-center">
            <div className="relative grid h-20 w-20 place-items-center">
              <GoldRing className="absolute inset-0 animate-spin-slow opacity-90" />
              <span className="font-display text-2xl text-gold-gradient font-semibold">
                A&amp;N
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function PersonCard({ person, align }: { person: Person; align: "left" | "right" }) {
  const isRight = align === "right";
  return (
    <Reveal
      as="article"
      delay={isRight ? 150 : 0}
      className={`flex flex-col items-center gap-6 ${isRight ? "md:items-end md:text-right" : "md:items-start md:text-left"}`}
    >
      {/* Foto dengan bingkai lingkaran beraksen daun emas */}
      <div className="relative">
        <span className="absolute -inset-4 rounded-full border border-dashed border-gold/45 animate-spin-slow" aria-hidden="true" />
        <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep p-[3px] shadow-[0_20px_45px_-18px_rgba(20,59,39,0.45)]">
          <span className="block h-full w-full overflow-hidden rounded-full bg-white p-[3px]">
            <img
              src={person.photo}
              alt={person.fullName}
              className="h-48 w-48 rounded-full object-cover sm:h-56 sm:w-56"
            />
          </span>
        </span>
        {/* Kuncup daun emas di puncak bingkai (elemen khas logo UNDIGITAL) */}
        <span
          className="absolute left-1/2 top-[-14px] h-8 w-6 -translate-x-1/2 drop-shadow-[0_2px_6px_rgba(201,151,34,0.5)]"
          aria-hidden="true"
        >
          <GoldLeaf />
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-gold-deep">{person.role}</p>
        <h3 className="font-display text-3xl font-semibold leading-tight text-emerald-deep sm:text-[2.1rem]">
          {person.fullName}
        </h3>
      </div>

      <div className="space-y-1 text-sm text-ink-soft">
        <p>{person.order}</p>
        <p className="font-semibold text-ink">{person.father}</p>
        <p className="font-semibold text-ink">&amp; {person.mother}</p>
      </div>

      <a
        href={person.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-full border border-emerald-deep/20 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-deep transition-all hover:border-gold hover:bg-emerald-deep hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <AtSign className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
        {person.instagramLabel}
      </a>
    </Reveal>
  );
}
