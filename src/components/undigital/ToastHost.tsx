"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastItem = {
  id: number;
  message: string;
  variant: "success" | "error";
};

type ToastDetail = { message: string; variant?: "success" | "error" };

const EVENT_NAME = "undigital:toast";

/** Memicu notifikasi toast dari komponen mana pun. */
export function toast(message: string, variant: "success" | "error" = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(EVENT_NAME, { detail: { message, variant } }),
  );
}

/** Host notifikasi toast — dipasang satu kali di akar undangan. */
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let seq = 0;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      const id = ++seq;
      setItems((prev) => [
        ...prev.slice(-2),
        { id, message: detail.message, variant: detail.variant ?? "success" },
      ]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 3600);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-5 z-[80] flex flex-col items-center gap-2 px-4"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className="animate-fade-up pointer-events-auto flex max-w-sm items-center gap-3 rounded-full border border-gold/50 bg-emerald-deep/95 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(20,59,39,0.35)] backdrop-blur-md"
        >
          {item.variant === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
          )}
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
