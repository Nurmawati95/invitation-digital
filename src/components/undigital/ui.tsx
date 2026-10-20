"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------
   Reveal — animasi muncul saat elemen masuk viewport
   --------------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as ElementType;
  return (
    <Tag
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      className={cn("reveal-on-scroll", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------------
   SectionHeading — judul bagian bergaya UNDIGITAL
   --------------------------------------------------------------------- */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = "dark",
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** `dark` = teks gelap di latar terang, `light` = teks putih di latar emerald. */
  tone?: "dark" | "light";
  align?: "center" | "left";
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "text-[0.68rem] font-semibold uppercase tracking-[0.42em]",
            tone === "dark" ? "text-gold-deep" : "text-gold",
          )}
        >
          {eyebrow}
        </span>
      ) : null}

      <h2
        className={cn(
          "font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl",
          tone === "dark" ? "text-emerald-deep" : "text-white",
        )}
      >
        {title}
      </h2>

      <div className="flex w-full max-w-xs items-center justify-center gap-3">
        <span
          className={cn(
            "h-px flex-1",
            tone === "dark"
              ? "bg-gradient-to-r from-transparent to-gold/70"
              : "bg-gradient-to-r from-transparent to-gold/70",
          )}
        />
        <span className="relative block h-4 w-3.5 shrink-0">
          <LeafGlyph />
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/70" />
      </div>

      {subtitle ? (
        <p
          className={cn(
            "max-w-xl text-sm leading-relaxed sm:text-base",
            tone === "dark" ? "text-ink-soft" : "text-white/75",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

function LeafGlyph() {
  return (
    <svg viewBox="0 0 100 140" fill="none" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id="ui-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0CB62" />
          <stop offset="50%" stopColor="#E5B842" />
          <stop offset="100%" stopColor="#C99722" />
        </linearGradient>
      </defs>
      <path
        d="M50 2C78 34 94 68 84 108 74 138 56 138 46 116 34 88 30 40 50 2Z"
        fill="url(#ui-leaf)"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------
   Section — pembungkus bagian dengan id & padding konsisten
   --------------------------------------------------------------------- */
export function Section({
  id,
  children,
  className,
  label,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      data-section={id}
      className={cn(
        "relative scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24",
        className,
      )}
    >
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------------
   OrnamentCard — kartu dengan bingkai emas & ornamen sudut
   --------------------------------------------------------------------- */
export function OrnamentCard({
  children,
  className,
  tone = "dark",
}: {
  children: ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border p-6 sm:p-8",
        tone === "dark"
          ? "border-gold/35 bg-white shadow-[0_20px_50px_-24px_rgba(20,59,39,0.28)]"
          : "border-gold/30 bg-emerald-deep/60",
        className,
      )}
    >
      <CornerOrnament className="absolute -left-1 -top-1 h-14 w-14 text-gold/60" />
      <CornerOrnament
        flip
        className="absolute -bottom-1 -right-1 h-14 w-14 text-gold/60"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function CornerOrnament({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={cn("h-full w-full", flip && "-scale-x-100", className)}
    >
      <path
        d="M6 114C6 62 26 26 78 10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M6 96C20 60 44 34 92 22"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="78" cy="10" r="3" fill="currentColor" />
      <path d="M78 10c8-6 16-4 20 2-8 4-15 2-20-2Z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}
