"use client";

import { useEffect, useMemo, useState } from "react";

type Artifact = {
  id: string;
  label: string;
  eyebrow: string;
  filename: string;
  language: string;
  content: string;
};

const icons: Record<string, React.ReactNode> = {
  tree: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v5H4zM14 15h6v5h-6zM14 4h6v5h-6zM7 9v8h7M10 6h4" /></svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" /></svg>
  ),
};

export default function ArchitectureConsole({ artifacts }: { artifacts: Artifact[] }) {
  const [active, setActive] = useState(artifacts[0]?.id ?? "tree");
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const artifact = useMemo(
    () => artifacts.find((item) => item.id === active) ?? artifacts[0],
    [active, artifacts],
  );

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  async function copyArtifact() {
    if (!artifact) return;
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <a className="brand" href="#top" aria-label="UNDIGITAL beranda">
          <span className="brand-mark">U</span>
          <span>UN<span>DIGITAL</span></span>
        </a>
        <nav aria-label="Navigasi utama">
          <a href="#blueprint">Blueprint</a>
          <a href="#security">Security</a>
          <a href="#delivery">Delivery</a>
        </nav>
        <a className="header-cta" href="#delivery">Lihat artefak <span>↘</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-noise" />
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="hero-copy">
          <div className="phase-pill"><i /> Architecture delivery · Tahap 01</div>
          <h1>Fondasi elegan.<br /><em>Kecepatan tanpa kompromi.</em></h1>
          <p className="hero-lead">Blueprint sistem UNDIGITAL untuk pengalaman undangan yang terasa instan, aman, dan siap tumbuh.</p>
          <div className="hero-actions">
            <a className="button button-gold" href="#delivery">Jelajahi arsitektur <span>→</span></a>
            <a className="button button-ghost" href="#blueprint"><span className="play">▷</span> Prinsip sistem</a>
          </div>
          <div className="hero-metrics">
            <div><strong>0<small>ms</small></strong><span>Target navigasi</span></div>
            <div><strong>7</strong><span>Modul editor</span></div>
            <div><strong>100<small>%</small></strong><span>Mobile-first</span></div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Ilustrasi arsitektur UNDIGITAL">
          <div className="ring ring-a" />
          <div className="ring ring-b" />
          <div className="phone-shadow" />
          <div className="phone">
            <div className="phone-top"><span /><i /></div>
            <div className="phone-screen">
              <div className="mini-nav"><b>U</b><span>•••</span></div>
              <p>THE WEDDING OF</p>
              <h2>Alana <i>&amp;</i><br />Raka</h2>
              <div className="mini-date"><span>24</span><b>·</b><span>08</span><b>·</b><span>26</span></div>
              <button>BUKA UNDANGAN</button>
              <div className="mini-flower">❦</div>
            </div>
          </div>
          <div className="float-card float-speed"><span>⚡</span><div><b>Instant UX</b><small>Client-first SPA</small></div></div>
          <div className="float-card float-secure"><span>✓</span><div><b>Hardened</b><small>Defense in depth</small></div></div>
        </div>
      </section>

      <section className="principles" id="blueprint">
        <div className="section-kicker">SYSTEM PRINCIPLES</div>
        <div className="section-heading">
          <h2>Dirancang untuk <em>terasa tak terlihat.</em></h2>
          <p>Arsitektur yang baik tidak meminta perhatian. Ia merespons seketika, menjaga data, dan tetap sederhana saat skala bertambah.</p>
        </div>
        <div className="principle-grid">
          <article>
            <span className="number">01</span><div className="line-icon">⌁</div>
            <h3>Client-first by design</h3>
            <p>History API, optimistic state, dan cache lokal membuat setiap perpindahan terasa seketika tanpa page reload.</p>
            <small>SPA · HISTORY API · CACHE</small>
          </article>
          <article>
            <span className="number">02</span><div className="line-icon">◇</div>
            <h3>Data yang modular</h3>
            <p>Tujuh tab editor berdiri sebagai dokumen JSON berversi—ringan untuk autosave dan aman untuk berevolusi.</p>
            <small>JSON · REVISION · AUTOSAVE</small>
          </article>
          <article>
            <span className="number">03</span><div className="line-icon">⛨</div>
            <h3>Secure at every layer</h3>
            <p>RBAC, token hash, MIME inspection, CSP, serta isolasi upload bekerja sebagai lapisan pertahanan berjenjang.</p>
            <small>RBAC · CSP · MIME SNIFF</small>
          </article>
        </div>
      </section>

      <section className="security-band" id="security">
        <div>
          <div className="section-kicker light">SECURITY POSTURE</div>
          <h2>Berkas media tetap media.<br /><em>Tidak pernah menjadi kode.</em></h2>
        </div>
        <div className="security-list">
          <span><i>01</i> MIME tervalidasi dengan <code>finfo_file</code></span>
          <span><i>02</i> Eksekusi script dimatikan di <code>/uploads</code></span>
          <span><i>03</i> Hanya empat subdirektori masuk whitelist</span>
          <span><i>04</i> Dotfiles dan source internal ditolak Apache</span>
        </div>
      </section>

      <section className="delivery" id="delivery">
        <div className="section-kicker">DELIVERY CONSOLE</div>
        <div className="section-heading delivery-heading">
          <h2>Semua fondasi, <em>siap digunakan.</em></h2>
          <p>Pilih artefak untuk meninjau implementasi lengkap. Setiap keputusan telah disusun untuk deployment Apache + PHP Native + MySQL 8.</p>
        </div>

        <div className="artifact-shell">
          <aside className="artifact-tabs" aria-label="Daftar artefak">
            {artifacts.map((item) => (
              <button
                key={item.id}
                className={active === item.id ? "active" : ""}
                onClick={() => setActive(item.id)}
                type="button"
              >
                <span className="tab-icon">{icons[item.id]}</span>
                <span><small>{item.eyebrow}</small><b>{item.label}</b></span>
                <i>→</i>
              </button>
            ))}
            <div className="artifact-ready"><span>✓</span><p><b>Production-minded</b><small>MySQL 8 · Apache 2.4</small></p></div>
          </aside>

          {artifact && (
            <div className="code-window">
              <div className="code-toolbar">
                <div className="window-dots"><i /><i /><i /></div>
                <div className="filename"><span>{artifact.language === "sql" ? "DB" : artifact.id === "tree" ? "DIR" : "AP"}</span>{artifact.filename}</div>
                <button onClick={copyArtifact} type="button" className={copied ? "copied" : ""}>
                  {copied ? "Tersalin ✓" : "Salin"}
                </button>
              </div>
              <pre aria-label={`Isi ${artifact.filename}`}><code>{artifact.content}</code></pre>
              <div className="code-status"><span><i /> Validated structure</span><span>{artifact.content.split("\n").length} lines</span></div>
            </div>
          )}
        </div>
      </section>

      <section className="decisions">
        <div className="section-kicker">ARCHITECTURE NOTES</div>
        <h2>Keputusan kecil. <em>Dampak besar.</em></h2>
        <div className="decision-grid">
          <article><span>JSON</span><div><h3>Editor modular, bukan monolitik</h3><p>Satu row per tab menghindari payload besar dan konflik autosave lintas bagian.</p></div></article>
          <article><span>RBAC</span><div><h3>Hak akses eksplisit</h3><p>Customer mengelola miliknya; penghapusan permanen hanya melalui super admin.</p></div></article>
          <article><span>FS</span><div><h3>Database bukan file storage</h3><p>MySQL menyimpan metadata dan checksum. Media terkompresi tinggal di filesystem.</p></div></article>
          <article><span>FK</span><div><h3>Integritas sejak level data</h3><p>Foreign key dan cascade terukur menjaga event, media, tamu, dan RSVP tetap konsisten.</p></div></article>
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">U</span><span>UN<span>DIGITAL</span></span></a>
        <p>Architecture delivery · Phase 01</p>
        <span>Built for moments that matter.</span>
      </footer>

      <div className={`toast ${copied ? "show" : ""}`}>Artefak berhasil disalin</div>
    </main>
  );
}
