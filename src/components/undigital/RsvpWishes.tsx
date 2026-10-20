"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, LoaderCircle, MessageCircleHeart, Send, Users } from "lucide-react";
import { formatAbsoluteDate, formatNumber, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { OrnamentCard, Reveal, Section, SectionHeading } from "./ui";
import { toast } from "./ToastHost";

export type WishItem = {
  id: number;
  name: string;
  attendance: "hadir" | "tidak";
  guestCount: number;
  message: string;
  createdAt: string;
};

export type WishSummary = {
  total: number;
  attending: number;
  guests: number;
};

/** Konfirmasi Kehadiran (RSVP) & Ucapan/Doa. */
export function RsvpWishes({
  initialWishes,
  initialSummary,
  guestName,
  guestSlug,
}: {
  initialWishes: WishItem[];
  initialSummary: WishSummary;
  guestName: string;
  guestSlug: string;
}) {
  const [wishes, setWishes] = useState<WishItem[]>(initialWishes);
  const [summary, setSummary] = useState<WishSummary>(initialSummary);

  const [name, setName] = useState(guestName);
  const [guestCount, setGuestCount] = useState("1");
  const [attendance, setAttendance] = useState<"hadir" | "tidak">("hadir");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);
  // Waktu relatif hanya dihitung di klien agar hasil render server & klien identik.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const visibleWishes = useMemo(
    () => (showAll ? wishes : wishes.slice(0, 6)),
    [showAll, wishes],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Nama minimal 2 karakter.";
    if (message.trim().length < 3) nextErrors.message = "Ucapan minimal 3 karakter.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          attendance,
          guestCount: Number(guestCount),
          message: message.trim(),
          guestSlug: guestSlug || null,
        }),
      });
      const payload = (await response.json()) as
        | { data: WishItem; error?: string }
        | { error: string };

      if (!response.ok || !("data" in payload) || !payload.data) {
        throw new Error(
          "error" in payload ? payload.error : "Ucapan gagal terkirim.",
        );
      }

      const created = payload.data;
      setWishes((prev) => [created, ...prev]);
      setSummary((prev) => ({
        total: prev.total + 1,
        attending: prev.attending + (created.attendance === "hadir" ? 1 : 0),
        guests: prev.guests + (created.attendance === "hadir" ? created.guestCount : 0),
      }));
      setMessage("");
      setShowAll(true);
      toast("Terima kasih! Ucapan & doa Anda telah terkirim. 🤍");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Ucapan gagal terkirim.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Section id="rsvp" className="bg-mist">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow="RSVP & Wishes"
            title="Konfirmasi Kehadiran"
            subtitle="Kehadiran Anda adalah hadiah terindah untuk kami. Mohon konfirmasi kehadiran dan tinggalkan ucapan serta doa restu."
          />
        </Reveal>

        {/* Ringkasan statistik */}
        <Reveal delay={100}>
          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
            <StatTile label="Total Ucapan" value={summary.total} icon={<MessageCircleHeart className="h-4 w-4" aria-hidden="true" />} />
            <StatTile label="Konfirmasi Hadir" value={summary.attending} icon={<Heart className="h-4 w-4" aria-hidden="true" />} />
            <StatTile label="Estimasi Tamu" value={summary.guests} icon={<Users className="h-4 w-4" aria-hidden="true" />} />
          </dl>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          {/* Form */}
          <Reveal delay={150}>
            <OrnamentCard className="h-full">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-emerald-deep">
                    Isi Konfirmasi
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">
                    Data Anda hanya digunakan untuk keperluan daftar tamu.
                  </p>
                </div>

                <Field label="Nama Lengkap" htmlFor="rsvp-name" error={errors.name}>
                  <input
                    id="rsvp-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nama Anda"
                    className={inputClass(Boolean(errors.name))}
                  />
                </Field>

                <Field label="Jumlah Tamu" htmlFor="rsvp-guests">
                  <select
                    id="rsvp-guests"
                    name="guestCount"
                    value={guestCount}
                    onChange={(event) => setGuestCount(event.target.value)}
                    className={inputClass(false)}
                  >
                    {Array.from({ length: 11 }, (_, index) => index).map((count) => (
                      <option key={count} value={count}>
                        {count} orang
                      </option>
                    ))}
                  </select>
                </Field>

                <fieldset>
                  <legend className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-gold-deep">
                    Konfirmasi Kehadiran
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: "hadir", label: "Hadir", hint: "Insya Allah hadir" },
                      { value: "tidak", label: "Tidak Hadir", hint: "Berhalangan" },
                    ] as const).map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "cursor-pointer rounded-2xl border px-4 py-3.5 text-center transition-all",
                          attendance === option.value
                            ? "border-gold bg-emerald-deep text-white shadow-[0_14px_30px_-16px_rgba(20,59,39,0.6)]"
                            : "border-emerald-deep/15 bg-white text-ink hover:border-gold/60",
                        )}
                      >
                        <input
                          type="radio"
                          name="attendance"
                          value={option.value}
                          checked={attendance === option.value}
                          onChange={() => setAttendance(option.value)}
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[0.62rem]",
                            attendance === option.value ? "text-gold" : "text-ink-soft",
                          )}
                        >
                          {option.hint}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Field label="Ucapan & Doa" htmlFor="rsvp-message" error={errors.message}>
                  <textarea
                    id="rsvp-message"
                    name="message"
                    rows={4}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tuliskan ucapan dan doa restu untuk kedua mempelai…"
                    className={cn(inputClass(Boolean(errors.message)), "resize-none")}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gold-gradient group inline-flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 text-xs font-bold uppercase tracking-[0.22em] text-emerald-deep shadow-[0_16px_38px_-16px_rgba(229,184,66,0.8)] transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Mengirim…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      Kirim Konfirmasi
                    </>
                  )}
                </button>
              </form>
            </OrnamentCard>
          </Reveal>

          {/* Daftar ucapan */}
          <Reveal delay={250}>
            <div className="flex h-full flex-col">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl font-semibold text-emerald-deep">
                  Ucapan &amp; Doa
                </h3>
                <span className="text-xs text-ink-soft">
                  {formatNumber(wishes.length)} ucapan
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-4">
                {visibleWishes.length === 0 ? (
                  <li className="rounded-3xl border border-dashed border-gold/40 bg-white px-6 py-12 text-center text-sm text-ink-soft">
                    Jadilah yang pertama memberikan ucapan dan doa restu. 🤍
                  </li>
                ) : (
                  visibleWishes.map((wish, index) => (
                    <li
                      key={wish.id}
                      className="animate-fade-up rounded-3xl border border-gold/25 bg-white px-5 py-5 shadow-[0_16px_40px_-30px_rgba(20,59,39,0.4)]"
                      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{wish.name}</p>
                          <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-ink-soft">
                            {mounted
                      ? formatRelativeTime(wish.createdAt)
                      : formatAbsoluteDate(wish.createdAt)}
                            {wish.attendance === "hadir" && wish.guestCount > 0
                              ? ` · ${wish.guestCount} tamu`
                              : ""}
                          </p>
                        </div>
                        <AttendanceBadge attendance={wish.attendance} />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                        “{wish.message}”
                      </p>
                    </li>
                  ))
                )}
              </ul>

              {wishes.length > 6 ? (
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-deep/20 px-6 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-emerald-deep transition-all hover:border-gold hover:bg-emerald-deep hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {showAll
                    ? "Tampilkan lebih sedikit"
                    : `Lihat semua ${formatNumber(wishes.length)} ucapan`}
                </button>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-emerald-deep px-2 py-5 text-center">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <span className="mx-auto grid h-8 w-8 place-items-center rounded-full border border-gold/35 text-gold">
        {icon}
      </span>
      <p className="mt-3 font-display text-3xl font-bold leading-none tabular-nums text-gold-gradient">
        {formatNumber(value)}
      </p>
      <p className="mt-2 text-[0.55rem] uppercase tracking-[0.2em] text-white/60 sm:text-[0.62rem]">
        {label}
      </p>
    </div>
  );
}

function AttendanceBadge({ attendance }: { attendance: "hadir" | "tidak" }) {
  const isAttending = attendance === "hadir";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.16em]",
        isAttending
          ? "border-emerald-deep/25 bg-emerald-deep text-gold"
          : "border-gold/40 bg-gold/15 text-gold-deep",
      )}
    >
      {isAttending ? "Hadir" : "Tidak Hadir"}
    </span>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-gold-deep"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return cn(
    "w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-ink transition-all placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-gold/60",
    hasError ? "border-red-400" : "border-emerald-deep/15 focus:border-gold",
  );
}
