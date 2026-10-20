"use client";

import { Check, Copy, MapPin, QrCode, Wallet } from "lucide-react";
import { useState } from "react";
import { BRAND, GIFTS, GIFT_ADDRESS } from "@/lib/wedding";
import { copyToClipboard } from "@/lib/utils";
import { OrnamentCard, Reveal, Section, SectionHeading } from "./ui";
import { GoldDivider } from "./Ornaments";
import { toast } from "./ToastHost";

/** Amplop Digital — rekening bank, QRIS, dan alamat kirim kado. */
export function Gift() {
  return (
    <Section id="gift" className="bg-emerald-deep">
      <LeafTexture />

      <div className="relative mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            tone="light"
            eyebrow="Wedding Gift"
            title="Amplop Digital"
            subtitle="Doa restu Anda adalah hadiah terbaik. Namun bila Anda ingin memberi tanda kasih, kami menyediakan amplop digital berikut."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Kartu rekening */}
          <div className="space-y-5">
            {GIFTS.map((gift, index) => (
              <Reveal key={gift.accountNumber} delay={index * 120}>
                <BankCard
                  bank={gift.bank}
                  logo={gift.logo}
                  accountNumber={gift.accountNumber}
                  holder={gift.holder}
                />
              </Reveal>
            ))}
          </div>

          {/* QRIS + alamat kado */}
          <div className="space-y-6">
            <Reveal delay={200}>
              <OrnamentCard tone="light" className="h-full">
                <div className="flex flex-col items-center gap-5 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 text-gold">
                    <QrCode className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-white">
                      Pembayaran QRIS
                    </h3>
                    <p className="mt-1 text-xs text-white/65">
                      Pindai menggunakan aplikasi e-wallet atau m-banking apa pun.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.7)]">
                    <img
                      src="/images/qris.png"
                      alt="Kode QRIS UNDIGITAL Wedding"
                      width={640}
                      height={640}
                      className="h-44 w-44 rounded-2xl object-cover sm:h-52 sm:w-52"
                    />
                  </div>

                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">
                    NMID 93600 1234 5678 901
                  </p>
                </div>
              </OrnamentCard>
            </Reveal>

            <Reveal delay={280}>
              <OrnamentCard tone="light">
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/40 text-gold">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-white">
                        Kirim Kado Fisik
                      </h3>
                      <p className="mt-1 text-xs text-white/65">
                        Silakan kirim kado ke alamat di bawah ini.
                      </p>
                    </div>
                  </div>

                  <div className="w-full">
                    <GoldDivider />
                  </div>

                  <dl className="space-y-2 text-sm text-white/80">
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-[0.62rem] uppercase tracking-[0.2em] text-gold">
                        Penerima
                      </dt>
                      <dd className="font-semibold text-white">{GIFT_ADDRESS.recipient}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-[0.62rem] uppercase tracking-[0.2em] text-gold">
                        Telepon
                      </dt>
                      <dd className="font-semibold text-white">{GIFT_ADDRESS.phone}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-24 shrink-0 text-[0.62rem] uppercase tracking-[0.2em] text-gold">
                        Alamat
                      </dt>
                      <dd className="leading-relaxed">{GIFT_ADDRESS.address}</dd>
                    </div>
                  </dl>

                  <p className="rounded-2xl border border-gold/25 bg-emerald-mid/40 px-4 py-3 text-xs leading-relaxed text-white/70">
                    {GIFT_ADDRESS.note}
                  </p>

                  <CopyButton
                    label="Salin Alamat"
                    value={[
                      GIFT_ADDRESS.recipient,
                      GIFT_ADDRESS.phone,
                      GIFT_ADDRESS.address,
                    ].join("\n")}
                    successMessage="Alamat pengiriman berhasil disalin!"
                  />
                </div>
              </OrnamentCard>
            </Reveal>
          </div>
        </div>

        <Reveal delay={340}>
          <p className="mt-12 text-center text-xs text-white/50">
            Pertanyaan seputar hadiah? Hubungi{" "}
            <a
              href={BRAND.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-light"
            >
              {BRAND.whatsappLabel}
            </a>
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

/** Kartu ATM/bank bergaya mewah dengan fitur salin nomor rekening. */
function BankCard({
  bank,
  logo,
  accountNumber,
  holder,
}: {
  bank: string;
  logo: string;
  accountNumber: string;
  holder: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-gold/35 bg-gradient-to-br from-emerald-mid via-emerald-deep to-[#0d2a1c] p-6 shadow-[0_26px_60px_-28px_rgba(0,0,0,0.75)] sm:p-7">
      <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold/12 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-gold/8 blur-3xl" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/45 text-gold">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.58rem] uppercase tracking-[0.35em] text-gold">
              Transfer Bank
            </p>
            <p className="font-display text-xl font-semibold text-white">{bank}</p>
          </div>
        </div>
        <img
          src={logo}
          alt={`Logo ${bank}`}
          width={120}
          height={48}
          className="h-9 w-auto rounded-md"
        />
      </div>

      <div className="relative mt-7">
        <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/45">
          Nomor Rekening
        </p>
        <p className="mt-1.5 font-display text-3xl font-semibold tracking-[0.06em] text-white sm:text-[2.1rem]">
          {accountNumber}
        </p>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/45">
            Nama Penerima
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{holder}</p>
        </div>
        <CopyButton
          label="Salin"
          value={accountNumber.replace(/\s/g, "")}
          successMessage="Nomor rekening berhasil disalin!"
        />
      </div>
    </div>
  );
}

function CopyButton({
  label,
  value,
  successMessage,
}: {
  label: string;
  value: string;
  successMessage: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      toast(successMessage);
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      toast("Gagal menyalin. Silakan salin manual.", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gold/50 bg-emerald-deep/40 px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-emerald-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-deep"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Tersalin
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
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
          id="gift-leaf-pattern"
          width="72"
          height="72"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-20)"
        >
          <g fill="currentColor" opacity="0.05">
            <path d="M36 9c11 11 15 23 11 34-8-9-11-21-11-34Z" />
            <path d="M36 9c-11 11-15 23-11 34 8-9 11-21 11-34Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gift-leaf-pattern)" />
    </svg>
  );
}
