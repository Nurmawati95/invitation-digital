"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeGuestName, slugifyGuestName } from "@/lib/utils";
import { BrandFooter } from "./BrandFooter";
import { CinematicPlayer } from "./CinematicPlayer";
import { Countdown } from "./Countdown";
import { Couple } from "./Couple";
import { CoverGate } from "./CoverGate";
import { EventDetail } from "./EventDetail";
import { FloatingNav } from "./FloatingNav";
import { Gallery } from "./Gallery";
import { Gift } from "./Gift";
import { Hero } from "./Hero";
import { LoveStory } from "./LoveStory";
import { MusicControl } from "./MusicControl";
import { Preloader } from "./Preloader";
import { RsvpWishes, type WishItem, type WishSummary } from "./RsvpWishes";
import { SidePanel } from "./SidePanel";
import { ToastHost } from "./ToastHost";

type Phase = "loading" | "cover" | "open";

/**
 * Akar undangan UNDIGITAL.
 * Mengatur pre-loader, layar pembuka (gate), musik latar, dan tata letak
 * split-screen (panel kiri statis di desktop, full-width di mobile).
 */
export function UndigitalInvitation({
  wishes,
  summary,
}: {
  wishes: WishItem[];
  summary: WishSummary;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [guestName, setGuestName] = useState("Tamu Undangan");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* --- Nama tamu dari parameter URL `?to=` --------------------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setGuestName(normalizeGuestName(params.get("to")));
  }, []);

  /* --- Kunci / buka scroll sesuai fase ------------------------------- */
  useEffect(() => {
    const locked = phase !== "open";
    document.documentElement.dataset.locked = String(locked);
    document.body.dataset.locked = String(locked);
    if (!locked) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [phase]);

  /* --- Buka undangan: geser layar, buka scroll, putar musik ---------- */
  const openInvitation = useCallback(() => {
    setPhase("open");
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          setMusicPlaying(true);
          // Fade-in volume agar halus
          let volume = 0;
          const fade = window.setInterval(() => {
            volume = Math.min(0.55, volume + 0.05);
            audio.volume = volume;
            if (volume >= 0.55) window.clearInterval(fade);
          }, 120);
        })
        .catch(() => setMusicPlaying(false));
    }
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false));
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }, []);

  const guestSlug = slugifyGuestName(guestName);

  return (
    <div className="relative lg:[--panel-w:42%] xl:[--panel-w:40%]">
      {/* Musik latar */}
      <audio
        ref={audioRef}
        src="/music/wedding-theme.wav"
        loop
        preload="auto"
        data-testid="wedding-music"
      />

      {/* Panel kiri statis — hanya desktop */}
      <SidePanel />

      {/* Konten utama yang bisa di-scroll */}
      <main className="relative lg:ml-[var(--panel-w)]">
        <Hero />
        <Couple />
        <Countdown />
        <EventDetail />
        <LoveStory />
        <CinematicPlayer />
        <Gallery />
        <RsvpWishes
          initialWishes={wishes}
          initialSummary={summary}
          guestName={guestName}
          guestSlug={guestSlug}
        />
        <Gift />
        <BrandFooter guestName={guestName} />
      </main>

      {/* UI melayang */}
      <FloatingNav />
      <MusicControl
        playing={musicPlaying}
        onToggle={toggleMusic}
        visible={phase === "open"}
      />
      <ToastHost />

      {/* Layar pembuka & pre-loader */}
      <CoverGate
        guestName={guestName}
        onOpen={openInvitation}
        reveal={phase !== "loading"}
        leaving={phase === "open"}
      />

      {phase === "loading" ? (
        <Preloader onFinished={() => setPhase("cover")} />
      ) : null}
    </div>
  );
}
