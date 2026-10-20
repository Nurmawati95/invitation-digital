"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { GALLERY } from "@/lib/wedding";
import { cn } from "@/lib/utils";
import { Reveal, Section, SectionHeading } from "./ui";

/** Galeri foto responsif dengan Lightbox (zoom, navigasi, keyboard). */
export function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(
    () =>
      setActiveIndex((prev) =>
        prev === null ? prev : (prev - 1 + GALLERY.length) % GALLERY.length,
      ),
    [],
  );
  const showNext = useCallback(
    () =>
      setActiveIndex((prev) =>
        prev === null ? prev : (prev + 1) % GALLERY.length,
      ),
    [],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, close, showPrev, showNext]);

  const active = activeIndex === null ? null : GALLERY[activeIndex];

  return (
    <Section id="gallery" className="bg-mist">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow="Our Moments"
            title="Galeri Foto"
            subtitle="Beberapa momen indah yang kami abadikan sepanjang perjalanan kami bersama."
          />
        </Reveal>

        <div className="mt-14 grid auto-rows-[168px] grid-cols-2 gap-3 sm:auto-rows-[210px] sm:gap-4 lg:grid-cols-4">
          {GALLERY.map((photo, index) => (
            <Reveal
              key={photo.src}
              delay={index * 70}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-gold/25 bg-emerald-deep/5",
                spanClass(photo.span, index),
              )}
            >
              <img
                src={photo.src}
                alt={photo.caption}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-deep/75 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="font-display text-lg text-white">{photo.caption}</span>
              </figcaption>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Lihat foto ${photo.caption} lebih besar`}
                className="absolute inset-0 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/60 bg-emerald-deep/70 text-gold opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:opacity-100">
                  <Expand className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto"
          className="fixed inset-0 z-[75] flex flex-col bg-emerald-deep/97 backdrop-blur-md animate-fade-in"
          onClick={close}
        >
          <div className="flex items-center justify-between px-5 py-4 sm:px-8">
            <p className="text-[0.62rem] uppercase tracking-[0.35em] text-gold">
              {(activeIndex ?? 0) + 1} / {GALLERY.length}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup pratinjau"
              className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div
            className="flex flex-1 items-center justify-center gap-3 px-3 pb-6 sm:gap-6 sm:px-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={showPrev}
              aria-label="Foto sebelumnya"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:h-13 sm:w-13"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>

            <figure className="flex min-w-0 flex-1 flex-col items-center gap-4">
              <img
                src={active.src}
                alt={active.caption}
                className="max-h-[68svh] w-auto max-w-full rounded-2xl border border-gold/40 object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] animate-reveal"
              />
              <figcaption className="font-display text-2xl text-white">
                {active.caption}
              </figcaption>
            </figure>

            <button
              type="button"
              onClick={showNext}
              aria-label="Foto berikutnya"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:h-13 sm:w-13"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </Section>
  );
}

function spanClass(span: string, index: number): string {
  if (span === "tall") return "row-span-2";
  if (span === "wide") return "col-span-2 row-span-1";
  // Grid 4 kolom: buat ritme asimetris yang tetap rapi
  if (index === 3) return "col-span-2";
  return "";
}
