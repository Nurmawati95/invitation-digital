import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Ornamen khas UNDIGITAL — mengadaptasi elemen logo: lingkaran emas yang
 * terbuka dengan aksen kuncup daun di bagian atas kanan.
 */

type IconProps = SVGProps<SVGSVGElement>;

/** Kuncup/daun emas persis seperti aksen pada logo UNDIGITAL. */
export function GoldLeaf({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      {...props}
    >
      <defs>
        <linearGradient id="undigital-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0CB62" />
          <stop offset="45%" stopColor="#E5B842" />
          <stop offset="100%" stopColor="#C99722" />
        </linearGradient>
      </defs>
      <path
        d="M50 2C78 34 94 68 84 108 74 138 56 138 46 116 34 88 30 40 50 2Z"
        fill="url(#undigital-leaf)"
      />
      <path
        d="M50 14C56 44 58 78 52 112"
        stroke="#143B27"
        strokeOpacity="0.35"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Lingkaran emas terbuka (ciri khas logo) — dipakai sebagai bingkai. */
export function GoldRing({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      {...props}
    >
      <defs>
        <linearGradient id="undigital-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0CB62" />
          <stop offset="50%" stopColor="#E5B842" />
          <stop offset="100%" stopColor="#C99722" />
        </linearGradient>
      </defs>
      <path
        d="M100 12
           A 88 88 0 1 0 142.5 157.5
           L 116.5 175
           A 78 78 0 1 1 66 150
           L 48 134
           A 88 88 0 0 1 100 12 Z"
        fill="url(#undigital-ring)"
      />
    </svg>
  );
}

/** Garis pemisah emas dengan kuncup daun di tengah. */
export function GoldDivider({
  className,
  width = "w-full",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div className={cn("divider-gold", width, className)} aria-hidden="true">
      <span className="divider-gold-line" />
      <span className="relative block h-5 w-4 shrink-0">
        <GoldLeaf className="drop-shadow-[0_1px_2px_rgba(201,151,34,0.45)]" />
      </span>
      <span className="divider-gold-line" />
    </div>
  );
}

/** Monogram bulat dengan inisial mempelai. */
export function Monogram({
  initials,
  className,
  size = 88,
}: {
  initials: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border border-gold/60 bg-emerald-deep",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="font-display text-gold-gradient font-semibold leading-none"
        style={{ fontSize: size * 0.34 }}
      >
        {initials}
      </span>
      <span className="pointer-events-none absolute inset-[5px] rounded-full border border-gold/25" />
    </div>
  );
}

/** Ornamen sudut untuk bingkai kartu. */
export function CornerFlourish({
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
      <path
        d="M78 10c8-6 16-4 20 2-8 4-15 2-20-2Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}

/** Pola bunga/halus untuk latar belakang bagian tertentu. */
export function LeafPattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="undigital-leaf-pattern"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(18)"
        >
          <g fill="currentColor" opacity="0.16">
            <path d="M32 8c10 10 14 20 10 30-6-8-10-18-10-30Z" />
            <path d="M32 8c-10 10-14 20-10 30 6-8 10-18 10-30Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#undigital-leaf-pattern)" />
    </svg>
  );
}
