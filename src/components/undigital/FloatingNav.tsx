"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Gift as GiftIcon,
  Heart,
  House,
  Images,
  Mail,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/wedding";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof House> = {
  home: House,
  heart: Heart,
  calendar: CalendarDays,
  images: Images,
  mail: Mail,
  gift: GiftIcon,
};

/**
 * Navigasi melayang di bagian bawah dengan aksen emerald & ikon emas.
 * Item aktif ditentukan otomatis dari bagian yang sedang terlihat.
 */
export function FloatingNav() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.6, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Navigasi undangan"
      className={cn(
        "fixed bottom-4 left-1/2 z-[65] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 lg:bottom-6 lg:left-[calc(50%+var(--panel-w)/2)]",
      )}
    >
      <ul className="no-scrollbar flex items-center justify-between gap-1 overflow-x-auto rounded-full border border-gold/40 bg-emerald-deep/95 px-2 py-2 shadow-[0_20px_45px_-16px_rgba(20,59,39,0.65)] backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] ?? House;
          const isActive = active === item.id;
          return (
            <li key={item.id} className="flex-1">
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-full px-1.5 py-2 transition-all duration-300 sm:px-2.5",
                  isActive ? "text-gold" : "text-white/60 hover:text-gold",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-1 inset-y-0 rounded-full border transition-all duration-300",
                    isActive
                      ? "border-gold/45 bg-gold/12 opacity-100"
                      : "border-transparent opacity-0",
                  )}
                  aria-hidden="true"
                />
                <Icon
                  className={cn(
                    "relative h-[18px] w-[18px] transition-transform duration-300 sm:h-5 sm:w-5",
                    isActive && "scale-110",
                  )}
                  aria-hidden="true"
                />
                <span className="relative text-[0.5rem] font-semibold uppercase tracking-[0.08em] sm:text-[0.58rem]">
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
