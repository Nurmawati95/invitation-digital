/* ============================================================
   UNDIGITAL — app.js (Bagian Pertama)
   Client-First SPA · 0ms Latency Router · Modul 0, 1, 2
   ============================================================ */
(() => {
  "use strict";

  /* ==========================================================
     1. MODUL KEAMANAN FRONTEND
     Klik kanan, F12, Ctrl+U/S, Ctrl+Shift+I/J/C, anti-drag.
     ========================================================== */
  const Security = {
    init() {
      document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
      });

      document.addEventListener("dragstart", (e) => {
        const t = e.target;
        if (t && (t.tagName === "IMG" || t.tagName === "SVG" || t.tagName === "A")) {
          e.preventDefault();
        }
      });

      document.addEventListener(
        "keydown",
        (e) => {
          const key = (e.key || "").toUpperCase();
          const blocked =
            key === "F12" ||
            (e.ctrlKey && !e.shiftKey && (key === "U" || key === "S")) ||
            (e.ctrlKey && e.shiftKey && (key === "I" || key === "J" || key === "C")) ||
            (e.metaKey && e.altKey && (key === "I" || key === "J" || key === "C" || key === "U"));
          if (blocked) {
            e.preventDefault();
            e.stopPropagation();
            Toast.show("Fitur ini dinonaktifkan untuk melindungi karya.", true);
            return false;
          }
        },
        true
      );
    },
  };

  /* ==========================================================
     2. STATE & SESSION STORE
     ========================================================== */
  const Store = {
    TOKEN_KEY: "ud_token",
    user: null,
    events: [],

    get token() {
      try { return localStorage.getItem(this.TOKEN_KEY) || ""; } catch { return ""; }
    },
    set token(value) {
      try {
        if (value) localStorage.setItem(this.TOKEN_KEY, value);
        else localStorage.removeItem(this.TOKEN_KEY);
      } catch { /* privasi mode: abaikan */ }
    },

    setSession(user, session) {
      this.user = user || null;
      if (session && session.token) this.token = session.token;
      Header.sync();
    },
    clearSession() {
      this.user = null;
      this.events = [];
      this.token = "";
      Header.sync();
    },
    get isAuthed() { return !!this.user; },
    get isSuperAdmin() { return !!this.user && this.user.role === "super_admin"; },

    /** Validasi token ke server sekali per muat halaman (dipakai Route Guard). */
    _validated: false,
    async validate() {
      if (this._validated) return this.isAuthed;
      this._validated = true;
      if (!this.token) return false;
      try {
        const data = await Api.get("/auth/session");
        this.user = data.user;
        Header.sync();
        return true;
      } catch {
        this.clearSession();
        return false;
      }
    },
  };

  /* ==========================================================
     3. API CLIENT (REST JSON → api.php)
     ========================================================== */
  const Api = {
    BASE: "/api",

    async request(path, { method = "GET", body = null, formData = null } = {}) {
      const headers = {};
      if (Store.token) headers.Authorization = "Bearer " + Store.token;
      if (body !== null) headers["Content-Type"] = "application/json";

      const res = await fetch(this.BASE + path, {
        method,
        headers,
        body: formData ? formData : body !== null ? JSON.stringify(body) : undefined,
      });

      let data = {};
      try { data = await res.json(); } catch { /* respons kosong */ }

      if (!res.ok || data.ok === false) {
        const err = new Error(data.error || "Terjadi kesalahan jaringan.");
        err.status = res.status;
        throw err;
      }
      return data;
    },

    get(path) { return this.request(path); },
    post(path, body) { return this.request(path, { method: "POST", body }); },
    put(path, body) { return this.request(path, { method: "PUT", body }); },
    patch(path, body) { return this.request(path, { method: "PATCH", body }); },
    del(path) { return this.request(path, { method: "DELETE" }); },
    upload(path, formData) { return this.request(path, { method: "POST", formData }); },
  };

  /* ==========================================================
     4. UTIL DOM, TOAST, MODAL
     ========================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtDate(value) {
    const d = new Date(String(value).replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  const Toast = {
    timer: 0,
    show(message, isError = false) {
      const el = $("#toast");
      if (!el) return;
      el.textContent = message;
      el.classList.toggle("error", isError);
      el.classList.add("show");
      clearTimeout(this.timer);
      this.timer = setTimeout(() => el.classList.remove("show"), 2800);
    },
  };

  const Modal = {
    open(id) {
      const el = $(id);
      if (el) el.hidden = false;
    },
    close(id) {
      const el = $(id);
      if (el) el.hidden = true;
    },
    closeAll() {
      $$(".modal-backdrop").forEach((el) => { el.hidden = true; });
    },
    init() {
      document.addEventListener("click", (e) => {
        const closer = e.target.closest("[data-close]");
        if (closer) {
          const backdrop = closer.closest(".modal-backdrop");
          if (backdrop) backdrop.hidden = true;
          return;
        }
        if (e.target.classList && e.target.classList.contains("modal-backdrop")) {
          e.target.hidden = true;
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") Modal.closeAll();
      });
    },
  };

  /* ==========================================================
     5. HEADER PORTAL (status sesi)
     ========================================================== */
  const Header = {
    sync() {
      const chip = $("#session-chip");
      const cta = $("#header-cta");
      const logout = $("#btn-logout");
      const navAuth = $("#nav-auth-link");
      if (!chip) return;

      if (Store.isAuthed) {
        chip.hidden = false;
        $("#session-initial").textContent = (Store.user.name || "A").charAt(0).toUpperCase();
        $("#session-name").textContent = Store.user.name || "Akun";
        cta.textContent = "Dashboard";
        cta.setAttribute("href", "/admin");
        logout.hidden = false;
        navAuth.textContent = "Dashboard";
        navAuth.setAttribute("href", "/admin");
      } else {
        chip.hidden = true;
        cta.textContent = "Mulai Buat Undangan";
        cta.setAttribute("href", "/login");
        logout.hidden = true;
        navAuth.textContent = "Masuk";
        navAuth.setAttribute("href", "/login");
      }
    },
    init() {
      $("#btn-logout").addEventListener("click", async () => {
        try { await Api.post("/auth/logout"); } catch { /* token kadaluarsa: lanjut */ }
        Store.clearSession();
        Toast.show("Anda telah keluar.");
        Router.go("/");
      });
    },
  };

  /* ==========================================================
     6. CLIENT-SIDE ROUTER (0ms) + ROUTE GUARD + is-public-mode
     ========================================================== */
  const Router = {
    routes: [
      { pattern: /^\/$/, view: () => LandingView.render() },
      { pattern: /^\/login\/?$/, view: () => LoginView.render() },
      { pattern: /^\/admin\/?$/, view: () => AdminView.render(), guard: true },
      { pattern: /^\/studio\/([A-Za-z0-9-]+)\/?$/, view: (m) => StudioView.render(m[1]), guard: true },
      { pattern: /^\/([a-z0-9][a-z0-9-]*)\/?$/, view: (m) => InvitationView.render(m[1]), isPublic: true },
    ],

    go(path, { replace = false } = {}) {
      if (replace) history.replaceState({}, "", path);
      else history.pushState({}, "", path);
      this.resolve();
    },

    async resolve() {
      const path = location.pathname;
      document.body.classList.remove("is-public-mode");
      // Keluar dari undangan publik: hentikan musik, polling, dan kunci scroll.
      if (typeof InvitationView !== "undefined") InvitationView.cleanup();

      for (const route of this.routes) {
        const match = path.match(route.pattern);
        if (!match) continue;

        // Route Guard: blokir /admin & /studio tanpa sesi tervalidasi.
        if (route.guard) {
          const ok = await Store.validate();
          if (!ok) {
            Toast.show("Silakan masuk terlebih dahulu.", true);
            return this.go("/login", { replace: true });
          }
        }

        // Deteksi otomatis mode undangan publik (standalone).
        if (route.isPublic) document.body.classList.add("is-public-mode");

        window.scrollTo(0, 0);
        route.view(match);
        return;
      }
      LandingView.render();
    },

    init() {
      // Intersep seluruh anchor [data-nav] → navigasi instan tanpa reload.
      document.addEventListener("click", (e) => {
        const link = e.target.closest("a[data-nav]");
        if (!link) return;
        const href = link.getAttribute("href") || "/";
        if (/^https?:\/\//.test(href) || link.target === "_blank") return;
        e.preventDefault();

        const [pathOnly, hash] = href.split("#");
        if (hash && (pathOnly === "" || pathOnly === location.pathname)) {
          const target = document.getElementById(hash);
          if (target) target.scrollIntoView({ behavior: "smooth" });
          return;
        }
        if (href !== location.pathname + location.search) this.go(href);
      });

      window.addEventListener("popstate", () => this.resolve());
    },
  };

  function mount(templateId) {
    const tpl = document.getElementById(templateId);
    const app = $("#app");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));
    return app;
  }

  /* ==========================================================
     7. MODUL 0 — LANDING PAGE
     ========================================================== */
  const LandingView = {
    render() {
      document.title = "UNDIGITAL — Undangan Digital Instan";
      mount("tpl-landing");
    },
  };

  /* ==========================================================
     8. MODUL 1 — LOGIN / REGISTER / GOOGLE SIMULATOR
     ========================================================== */
  const GOOGLE_SIM_ACCOUNTS = [
    { google_id: "sim-108842100001", name: "Alana Pertiwi", email: "alana.pertiwi@gmail.com", color: "#7c4dbe" },
    { google_id: "sim-108842100002", name: "Raka Mahendra", email: "raka.mahendra@gmail.com", color: "#2e7d64" },
    { google_id: "sim-108842100003", name: "Keluarga Wijaya", email: "wedding.wijaya@gmail.com", color: "#b05a2f" },
  ];

  const LoginView = {
    async render() {
      // Jika sudah bersesi, langsung ke dashboard (0ms redirect).
      if (Store.token && (await Store.validate())) return Router.go("/admin", { replace: true });

      document.title = "Masuk — UNDIGITAL";
      const app = mount("tpl-login");

      // Proteksi Input Bersih: kosongkan seluruh field saat inisialisasi.
      $$("input", app).forEach((input) => { input.value = ""; });

      // Tab switcher instan.
      const tabs = $(".auth-tabs", app);
      $$(".auth-tab", app).forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = btn.dataset.tab;
          $$(".auth-tab", app).forEach((b) => {
            b.classList.toggle("active", b === btn);
            b.setAttribute("aria-selected", b === btn ? "true" : "false");
          });
          tabs.classList.toggle("on-register", target === "register");
          $("#form-login", app).classList.toggle("active", target === "login");
          $("#form-register", app).classList.toggle("active", target === "register");
        });
      });

      // Masuk akun.
      $("#form-login", app).addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = $("button[type=submit]", f);
        btn.disabled = true;
        try {
          const data = await Api.post("/auth/login", {
            email: f.email.value.trim(),
            password: f.password.value,
          });
          Store.setSession(data.user, data.session);
          Toast.show("Selamat datang kembali, " + data.user.name + "!");
          Router.go("/admin");
        } catch (err) {
          Toast.show(err.message, true);
        } finally {
          btn.disabled = false;
        }
      });

      // Daftar baru.
      $("#form-register", app).addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = $("button[type=submit]", f);
        btn.disabled = true;
        try {
          const data = await Api.post("/auth/register", {
            name: f.name.value.trim(),
            email: f.email.value.trim(),
            password: f.password.value,
          });
          Store.setSession(data.user, data.session);
          Toast.show("Akun berhasil dibuat. Selamat datang!");
          Router.go("/admin");
        } catch (err) {
          Toast.show(err.message, true);
        } finally {
          btn.disabled = false;
        }
      });

      // Google Auth Simulator.
      $("#btn-google-open", app).addEventListener("click", () => {
        this.renderGoogleAccounts();
        Modal.open("#modal-google");
      });
    },

    renderGoogleAccounts() {
      const wrap = $("#google-accounts");
      wrap.innerHTML = GOOGLE_SIM_ACCOUNTS.map(
        (acc, i) => `
        <button type="button" class="google-account" data-google-index="${i}">
          <span class="google-avatar" style="background:${acc.color}">${esc(acc.name.charAt(0))}</span>
          <span><b>${esc(acc.name)}</b><small>${esc(acc.email)}</small></span>
        </button>`
      ).join("");

      $$(".google-account", wrap).forEach((btn) => {
        btn.addEventListener("click", async () => {
          const acc = GOOGLE_SIM_ACCOUNTS[Number(btn.dataset.googleIndex)];
          btn.disabled = true;
          try {
            const data = await Api.post("/auth/google", {
              google_id: acc.google_id,
              name: acc.name,
              email: acc.email,
              avatar_url: "",
            });
            Modal.close("#modal-google");
            Store.setSession(data.user, data.session);
            Toast.show("Masuk sebagai " + data.user.name + " via Google.");
            Router.go("/admin");
          } catch (err) {
            Toast.show(err.message, true);
            btn.disabled = false;
          }
        });
      });
    },
  };

  /* ==========================================================
     9. MODUL 2 — ADMIN DASHBOARD
     ========================================================== */
  const AdminView = {
    deleteTarget: null,

    async render() {
      document.title = "Dashboard — UNDIGITAL";
      const app = mount("tpl-admin");

      $("#admin-role-flag", app).textContent = Store.isSuperAdmin ? "· SUPER ADMIN" : "";
      $("#btn-create-open", app).addEventListener("click", () => {
        const form = $("#form-create");
        form.reset();
        $$("input", form).forEach((i) => { i.value = ""; });
        Modal.open("#modal-create");
      });

      this.bindCreateForm();
      this.bindDeleteConfirm();
      await this.loadEvents();
    },

    async loadEvents() {
      const grid = $("#event-grid");
      if (!grid) return;
      try {
        const data = await Api.get("/events");
        Store.events = data.events || [];
        this.paint();
      } catch (err) {
        grid.innerHTML = `<div class="grid-empty"><b>Gagal memuat</b>${esc(err.message)}</div>`;
      }
    },

    paint() {
      const grid = $("#event-grid");
      if (!grid) return;

      if (!Store.events.length) {
        grid.innerHTML = `
          <div class="grid-empty">
            <b>Belum ada acara ✦</b>
            Tekan "Buat Acara Baru" untuk memulai undangan pertama Anda.
          </div>`;
        return;
      }

      grid.innerHTML = Store.events
        .map((ev) => {
          const published = ev.status === "published";
          const cover = ev.cover_url
            ? `<img src="${esc(ev.cover_url)}" alt="Sampul ${esc(ev.title)}" loading="lazy">`
            : `<span class="cover-fallback">${esc(ev.groom_name.charAt(0))} &amp; ${esc(ev.bride_name.charAt(0))}</span>`;
          const owner = Store.isSuperAdmin && ev.owner_name
            ? `<span>👤 ${esc(ev.owner_name)}</span>` : "";
          const deleteBtn = Store.isSuperAdmin
            ? `<button type="button" class="btn btn-delete" data-action="delete" data-id="${esc(ev.id)}">🗑 Hapus Acara</button>`
            : "";

          return `
          <article class="event-card" data-id="${esc(ev.id)}">
            <div class="event-cover">
              ${cover}
              <span class="status-badge ${published ? "published" : "draft"}">${published ? "Published" : "Draft"}</span>
            </div>
            <div class="event-body">
              <h3>${esc(ev.groom_name)} &amp; ${esc(ev.bride_name)}</h3>
              <div class="event-meta">
                <span>📅 ${fmtDate(ev.starts_at)}</span>
                <span>💬 ${Number(ev.rsvp_count || 0)} RSVP</span>
                ${owner}
              </div>
            </div>
            <div class="event-actions">
              <button type="button" class="btn btn-line" data-action="edit" data-id="${esc(ev.id)}">✎ Edit Form</button>
              <button type="button" class="btn btn-line" data-action="publish" data-id="${esc(ev.id)}">${published ? "Batal Publikasi" : "Publikasikan"}</button>
              <a class="btn btn-gold" href="/${esc(ev.slug)}" target="_blank" rel="noopener">Lihat ↗</a>
              ${deleteBtn}
            </div>
          </article>`;
        })
        .join("");

      // Delegasi aksi cepat per kartu.
      grid.onclick = async (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const id = btn.dataset.id;
        const ev = Store.events.find((x) => x.id === id);
        if (!ev) return;

        if (btn.dataset.action === "edit") return Router.go("/studio/" + id);

        if (btn.dataset.action === "publish") {
          btn.disabled = true;
          try {
            const data = await Api.post("/events/" + id + "/publish");
            ev.status = data.status;
            Toast.show(data.status === "published" ? "Undangan LIVE di /" + ev.slug + " ✦" : "Undangan dikembalikan ke Draft.");
            this.paint();
          } catch (err) {
            Toast.show(err.message, true);
            btn.disabled = false;
          }
          return;
        }

        if (btn.dataset.action === "delete") {
          this.deleteTarget = ev;
          $("#delete-target-name").textContent = ev.groom_name + " & " + ev.bride_name;
          Modal.open("#modal-delete");
        }
      };
    },

    bindCreateForm() {
      const form = $("#form-create");
      form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = $("button[type=submit]", form);
        btn.disabled = true;
        try {
          const data = await Api.post("/events", {
            groom_name: form.groom_name.value.trim(),
            bride_name: form.bride_name.value.trim(),
            event_type: form.event_type.value,
            religion: form.religion.value,
            starts_at: form.starts_at.value,
          });
          Modal.close("#modal-create");
          Toast.show("Acara \"" + data.event.title + "\" berhasil dibuat ✦");
          await this.loadEvents();
        } catch (err) {
          Toast.show(err.message, true);
        } finally {
          btn.disabled = false;
        }
      };
    },

    bindDeleteConfirm() {
      $("#btn-delete-confirm").onclick = async () => {
        if (!this.deleteTarget) return;
        const btn = $("#btn-delete-confirm");
        btn.disabled = true;
        try {
          const data = await Api.del("/events/" + this.deleteTarget.id);
          Modal.close("#modal-delete");
          Toast.show("Acara dihapus permanen (" + data.deleted_files + " berkas fisik ikut terhapus).");
          this.deleteTarget = null;
          await this.loadEvents();
        } catch (err) {
          Toast.show(err.message, true);
        } finally {
          btn.disabled = false;
        }
      };
    },
  };

  /* ==========================================================
     10. MODUL 6 — KOMPRESOR & CROPPER HTML5 CANVAS SISI KLIEN
     Foto 10-20MB dari kamera → crop interaktif → JPEG ±100-250KB.
     ========================================================== */
  const ImageTool = {
    PRESETS: {
      cover:   { ratio: 9 / 16, outW: 1080, outH: 1920, circle: false, maxKB: 250, title: "Potong Sampul · 9:16" },
      profile: { ratio: 1,      outW: 800,  outH: 800,  circle: true,  maxKB: 150, title: "Potong Foto Profil · 1:1 Bulat" },
      gallery: { ratio: 4 / 5,  outW: 1080, outH: 1350, circle: false, maxKB: 220, title: "Potong Foto Galeri" },
    },

    /** Buka dialog pemilih berkas. multiple=true → Promise<File[]>. */
    pickFile(accept = "image/*", multiple = false) {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.multiple = multiple;
        input.onchange = () => resolve(multiple ? Array.from(input.files) : input.files[0] || null);
        input.click();
      });
    },

    loadImage(file) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ img, url });
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Foto tidak dapat dibaca.")); };
        img.src = url;
      });
    },

    /** Kompresi iteratif: turunkan kualitas JPEG hingga <= maxKB. */
    compress(canvas, maxKB) {
      return new Promise((resolve) => {
        const qualities = [0.92, 0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.4];
        let i = 0;
        const attempt = () => {
          canvas.toBlob((blob) => {
            if (!blob) return resolve(null);
            if (blob.size <= maxKB * 1024 || i >= qualities.length - 1) return resolve(blob);
            i += 1;
            attempt();
          }, "image/jpeg", qualities[i]);
        };
        attempt();
      });
    },

    /** Cropper interaktif (geser + zoom) → Promise<Blob|null>. */
    crop(file, presetKey) {
      const preset = this.PRESETS[presetKey] || this.PRESETS.gallery;
      return new Promise((resolve) => {
        this.loadImage(file).then(({ img, url }) => {
          const backdrop = $("#modal-cropper");
          const canvas = $("#cropper-canvas");
          const ctx = canvas.getContext("2d");
          const zoomCtl = $("#cropper-zoom");
          const applyBtn = $("#btn-cropper-apply");
          $("#cropper-title").textContent = preset.title;

          // Dimensi tampilan mengikuti rasio target (maks 340 × 430 px).
          let vw = 340;
          let vh = Math.round(vw / preset.ratio);
          if (vh > 430) { vh = 430; vw = Math.round(vh * preset.ratio); }
          canvas.width = vw;
          canvas.height = vh;

          const base = Math.max(vw / img.width, vh / img.height);
          let zoom = 1;
          let ox = 0;
          let oy = 0;

          const clamp = () => {
            const s = base * zoom;
            ox = Math.min(0, Math.max(vw - img.width * s, ox));
            oy = Math.min(0, Math.max(vh - img.height * s, oy));
          };
          const center = () => {
            const s = base * zoom;
            ox = (vw - img.width * s) / 2;
            oy = (vh - img.height * s) / 2;
          };
          const draw = () => {
            clamp();
            const s = base * zoom;
            ctx.clearRect(0, 0, vw, vh);
            ctx.drawImage(img, ox, oy, img.width * s, img.height * s);
            if (preset.circle) {
              ctx.save();
              ctx.fillStyle = "rgba(10, 8, 6, .55)";
              ctx.beginPath();
              ctx.rect(0, 0, vw, vh);
              ctx.arc(vw / 2, vh / 2, Math.min(vw, vh) / 2 - 2, 0, Math.PI * 2, true);
              ctx.fill("evenodd");
              ctx.restore();
            }
            ctx.strokeStyle = "rgba(255, 255, 255, .22)";
            ctx.lineWidth = 1;
            for (let i = 1; i <= 2; i++) {
              ctx.beginPath(); ctx.moveTo((vw / 3) * i, 0); ctx.lineTo((vw / 3) * i, vh); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(0, (vh / 3) * i); ctx.lineTo(vw, (vh / 3) * i); ctx.stroke();
            }
          };

          zoom = 1;
          zoomCtl.value = "1";
          center();
          draw();

          // Interaksi geser (mouse & sentuh) via Pointer Events.
          let dragging = false;
          let lastX = 0;
          let lastY = 0;
          const onDown = (e) => {
            dragging = true; lastX = e.clientX; lastY = e.clientY;
            canvas.setPointerCapture(e.pointerId);
          };
          const onMove = (e) => {
            if (!dragging) return;
            ox += e.clientX - lastX;
            oy += e.clientY - lastY;
            lastX = e.clientX; lastY = e.clientY;
            draw();
          };
          const onUp = () => { dragging = false; };
          const onZoom = () => {
            const prev = base * zoom;
            zoom = parseFloat(zoomCtl.value) || 1;
            const next = base * zoom;
            ox = vw / 2 - ((vw / 2 - ox) / prev) * next;
            oy = vh / 2 - ((vh / 2 - oy) / prev) * next;
            draw();
          };

          canvas.addEventListener("pointerdown", onDown);
          canvas.addEventListener("pointermove", onMove);
          canvas.addEventListener("pointerup", onUp);
          canvas.addEventListener("pointercancel", onUp);
          zoomCtl.addEventListener("input", onZoom);

          let settled = false;
          const finish = (result) => {
            if (settled) return;
            settled = true;
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerup", onUp);
            canvas.removeEventListener("pointercancel", onUp);
            zoomCtl.removeEventListener("input", onZoom);
            backdrop.removeEventListener("click", onCancel);
            document.removeEventListener("keydown", onKey);
            applyBtn.onclick = null;
            URL.revokeObjectURL(url);
            Modal.close("#modal-cropper");
            resolve(result);
          };
          const onCancel = (e) => {
            if (e.target.closest("[data-close]") || e.target === backdrop) finish(null);
          };
          const onKey = (e) => { if (e.key === "Escape") finish(null); };

          backdrop.addEventListener("click", onCancel);
          document.addEventListener("keydown", onKey);

          applyBtn.onclick = async () => {
            applyBtn.disabled = true;
            const out = document.createElement("canvas");
            out.width = preset.outW;
            out.height = preset.outH;
            const octx = out.getContext("2d");
            octx.imageSmoothingQuality = "high";
            const s = base * zoom;
            octx.drawImage(img, -ox / s, -oy / s, vw / s, vh / s, 0, 0, preset.outW, preset.outH);
            const blob = await this.compress(out, preset.maxKB);
            applyBtn.disabled = false;
            if (!blob) {
              Toast.show("Kompresi gagal. Coba foto lain.", true);
              return finish(null);
            }
            finish(blob);
          };

          Modal.open("#modal-cropper");
        }).catch((err) => {
          Toast.show(err.message || "Foto tidak dapat dibaca.", true);
          resolve(null);
        });
      });
    },
  };

  /* ==========================================================
     11. MODUL 3 — STUDIO EDITOR UNDANGAN (7 TAB)
     ========================================================== */
  const StudioView = {
    id: null,
    event: null,
    tabs: {},
    media: { cover: [], groom: [], bride: [], gallery: [], music: [] },
    dirty: new Set(),
    active: "info_cover",

    async render(eventId) {
      document.title = "Studio Editor — UNDIGITAL";
      this.id = eventId;
      this.dirty = new Set();
      this.active = "info_cover";
      mount("tpl-studio");

      $("#btn-studio-save").addEventListener("click", () => this.saveAll());
      $$("#studio-tabs button").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.active = btn.dataset.stab;
          $$("#studio-tabs button").forEach((b) => b.classList.toggle("active", b === btn));
          this.paint();
        });
      });

      try {
        const data = await Api.get("/events/" + eventId);
        this.event = data.event;
        this.tabs = data.tabs || {};
        this.media = Object.assign({ cover: [], groom: [], bride: [], gallery: [], music: [] }, data.media || {});
        this.syncHeadline();
        this.paint();
      } catch (err) {
        $("#studio-title").textContent = "Acara tidak ditemukan";
        Toast.show(err.message, true);
      }
    },

    syncHeadline() {
      $("#studio-title").textContent = this.event.title;
      $("#studio-sub").textContent =
        "undigital.id/" + this.event.slug + " · " +
        (this.event.status === "published" ? "Published ✦" : "Draft");
    },

    /** Ambil konten tab + lengkapi kunci yang belum ada. */
    content(key, fallback) {
      if (!this.tabs[key]) this.tabs[key] = { content: {} };
      if (!this.tabs[key].content || typeof this.tabs[key].content !== "object") {
        this.tabs[key].content = {};
      }
      const c = this.tabs[key].content;
      if (fallback) {
        Object.keys(fallback).forEach((k) => {
          if (c[k] === undefined) c[k] = fallback[k];
        });
      }
      return c;
    },

    markDirty(key) {
      this.dirty.add(key);
      const el = $("#save-state");
      if (el) { el.textContent = "● Belum disimpan"; el.classList.add("dirty"); }
    },

    markSaved() {
      const el = $("#save-state");
      if (el) { el.textContent = "✓ Tersimpan"; el.classList.remove("dirty"); }
    },

    firstMedia(kind) {
      return (this.media[kind] && this.media[kind][0]) || null;
    },

    async uploadBlob(kind, blob, filename) {
      const fd = new FormData();
      fd.append("event_id", this.id);
      fd.append("kind", kind);
      fd.append("file", blob, filename);
      const data = await Api.upload("/media", fd);
      return data.media;
    },

    async saveAll() {
      if (!this.dirty.size) return Toast.show("Semua perubahan sudah tersimpan.");
      const btn = $("#btn-studio-save");
      btn.disabled = true;
      try {
        // Info inti (judul + slug) hidup di tabel events → PATCH terpisah.
        if (this.dirty.has("info_cover")) {
          const c = this.content("info_cover");
          const payload = {};
          if (c.event_name && c.event_name !== this.event.title) payload.title = c.event_name;
          if (c.custom_slug && c.custom_slug !== this.event.slug) payload.slug = c.custom_slug;
          if (Object.keys(payload).length) {
            const res = await Api.patch("/events/" + this.id, payload);
            this.event = res.event;
            this.syncHeadline();
          }
        }
        for (const key of Array.from(this.dirty)) {
          const res = await Api.put("/events/" + this.id + "/tabs/" + key, { content: this.content(key) });
          if (this.tabs[key]) this.tabs[key].revision = res.revision;
          this.dirty.delete(key);
        }
        this.markSaved();
        Toast.show("Seluruh perubahan tersimpan ✦");
      } catch (err) {
        Toast.show(err.message, true);
      } finally {
        btn.disabled = false;
      }
    },

    paint() {
      const host = $("#studio-panels");
      if (!host || !this.event) return;
      switch (this.active) {
        case "info_cover":       this.paintInfo(host); break;
        case "couple_profiles":  this.paintCouple(host); break;
        case "schedule_map":     this.paintSchedule(host); break;
        case "gallery":          this.paintGallery(host); break;
        case "love_story":       this.paintStory(host); break;
        case "digital_gifts":    this.paintGifts(host); break;
        case "settings_prayers": this.paintSettings(host); break;
      }
    },

    /* ---------- TAB 1 — INFO & SAMPUL + GENERATOR LINK TAMU ---------- */
    guestLink() {
      const c = this.content("info_cover");
      const slug = (c.custom_slug || this.event.slug || "").trim();
      const nameEl = $("#f-guest");
      const raw = nameEl ? nameEl.value.trim() : "";
      const base = location.origin + "/" + slug;
      if (!raw) return base;
      // Spasi nama tamu → '+' agar rapi saat dikirim via WhatsApp.
      const kpd = encodeURIComponent(raw).replace(/%20/g, "+");
      return base + "?kpd=" + kpd;
    },

    updateGuestLink() {
      const el = $("#guest-link");
      if (el) el.textContent = this.guestLink();
    },

    paintInfo(host) {
      const c = this.content("info_cover", {
        event_name: this.event.title,
        custom_slug: this.event.slug,
        rsvp_whatsapp: "",
        music_enabled: true,
        music_source: { type: "synth", value: "canon-in-d" },
      });
      if (!c.music_source || typeof c.music_source !== "object") {
        c.music_source = { type: "synth", value: "canon-in-d" };
      }
      const msrc = c.music_source;
      const cover = this.firstMedia("cover");

      host.innerHTML = `
      <div class="studio-panel">
        <div class="panel-grid">
          <div class="panel-col">
            <label class="sfield">Nama Acara <input id="f-ename" value="${esc(c.event_name)}"></label>
            <label class="sfield">Custom Slug URL
              <span class="slug-wrap"><span>undigital.id/</span><input id="f-slug" value="${esc(c.custom_slug)}" spellcheck="false"></span>
            </label>
            <label class="sfield">Nomor WA RSVP <input id="f-wa" inputmode="numeric" placeholder="cth. 6281234567890" value="${esc(c.rsvp_whatsapp)}"></label>
            <label class="toggle-row"><input type="checkbox" id="f-music" ${c.music_enabled ? "checked" : ""}><span class="switch"></span><b>Musik Latar Aktif</b></label>

            <div class="music-picker">
              <label class="sfield">Sumber Musik Latar
                <select id="f-msrc">
                  <option value="synth" ${msrc.type === "synth" ? "selected" : ""}>♪ Synthesizer Canon in D (bawaan, 0ms)</option>
                  <option value="library" ${msrc.type === "library" ? "selected" : ""}>Pustaka Bebas Royalti</option>
                  <option value="youtube" ${msrc.type === "youtube" ? "selected" : ""}>YouTube</option>
                  <option value="soundcloud" ${msrc.type === "soundcloud" ? "selected" : ""}>SoundCloud</option>
                  <option value="mp3" ${msrc.type === "mp3" ? "selected" : ""}>Unggah MP3 Sendiri</option>
                </select>
              </label>
              <div id="music-extra"></div>
              <div class="gen-actions">
                <button type="button" class="btn btn-line btn-sm" id="btn-music-preview">▷ Preview</button>
                <button type="button" class="btn btn-line btn-sm" id="btn-music-stop">■ Stop</button>
              </div>
            </div>

            <div class="guest-gen">
              <h4>✦ Generator Link Sebar Tamu</h4>
              <input id="f-guest" placeholder="Nama tamu — cth. Budi Santoso & Keluarga">
              <code class="guest-link" id="guest-link"></code>
              <div class="gen-actions">
                <button type="button" class="btn btn-line btn-sm" id="btn-copy-link">Salin Link</button>
                <button type="button" class="btn btn-gold btn-sm" id="btn-share-wa">Kirim via WA</button>
              </div>
            </div>
          </div>
          <div class="panel-col">
            <span class="sfield">Foto Sampul · Rasio 9:16</span>
            <div class="cover-drop" id="cover-drop">
              ${cover ? `<img src="${esc(cover.url)}" alt="Sampul undangan">` : `<span class="drop-hint">＋<br>Unggah<br>Sampul</span>`}
            </div>
            <button type="button" class="btn btn-line btn-sm" id="btn-cover-upload">${cover ? "Ganti Sampul" : "Pilih Foto Sampul"}</button>
          </div>
        </div>
      </div>`;

      const bind = (sel, prop, transform) => {
        $(sel, host).addEventListener("input", (e) => {
          c[prop] = transform ? transform(e.target.value) : e.target.value;
          this.markDirty("info_cover");
        });
      };
      bind("#f-ename", "event_name");
      bind("#f-slug", "custom_slug", (v) => v.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
      bind("#f-wa", "rsvp_whatsapp", (v) => v.replace(/[^0-9+]/g, ""));
      $("#f-slug", host).addEventListener("input", (e) => {
        e.target.value = c.custom_slug;
        this.updateGuestLink();
      });
      $("#f-music", host).addEventListener("change", (e) => {
        c.music_enabled = e.target.checked;
        this.markDirty("info_cover");
      });

      $("#f-guest", host).addEventListener("input", () => this.updateGuestLink());
      this.updateGuestLink();

      $("#btn-copy-link", host).addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(this.guestLink());
          Toast.show("Link undangan tersalin ✦");
        } catch {
          Toast.show("Clipboard tidak tersedia. Salin manual dari kotak link.", true);
        }
      });
      $("#btn-share-wa", host).addEventListener("click", () => {
        const name = ($("#f-guest", host).value || "").trim();
        const text =
          "Kepada Yth. " + (name || "Bapak/Ibu/Saudara/i") +
          "\n\nDengan penuh hormat, kami mengundang Anda untuk hadir di acara kami." +
          "\nBuka undangan: " + this.guestLink();
        window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
      });

      const startCover = async () => {
        const file = await ImageTool.pickFile();
        if (!file) return;
        const blob = await ImageTool.crop(file, "cover");
        if (!blob) return;
        Toast.show("Mengunggah sampul (" + Math.round(blob.size / 1024) + " KB)…");
        try {
          const item = await this.uploadBlob("cover", blob, "sampul.jpg");
          this.media.cover = [item];
          c.cover_photo = item.url;
          this.markDirty("info_cover");
          this.paint();
          Toast.show("Sampul 9:16 tersimpan ✦");
        } catch (err) {
          Toast.show(err.message, true);
        }
      };
      $("#btn-cover-upload", host).addEventListener("click", startCover);
      $("#cover-drop", host).addEventListener("click", startCover);

      // --- Pemilih sumber musik multi-source + preview (MODUL 4) ---
      const paintMusicExtra = () => {
        const wrap = $("#music-extra", host);
        const type = c.music_source.type;
        if (type === "library") {
          wrap.innerHTML = MUSIC_LIBRARY.map((t) => `
            <div class="music-row ${c.music_source.value === t.id ? "on" : ""}" data-track="${t.id}">
              <span>${esc(t.title)}</span>
              <button type="button" class="btn btn-line" data-prev="${t.id}">▷</button>
            </div>`).join("");
          $$(".music-row", wrap).forEach((row) => {
            row.addEventListener("click", (e) => {
              if (e.target.closest("[data-prev]")) return;
              c.music_source = { type: "library", value: row.dataset.track };
              this.markDirty("info_cover");
              paintMusicExtra();
            });
          });
          $$("[data-prev]", wrap).forEach((btn) =>
            btn.addEventListener("click", () => {
              Vinyl.show();
              MusicEngine.play({ type: "library", value: btn.dataset.prev });
            }));
        } else if (type === "youtube" || type === "soundcloud") {
          wrap.innerHTML = `
            <label class="sfield">${type === "youtube" ? "Link Video YouTube" : "Link Lagu SoundCloud"}
              <input id="f-murl" spellcheck="false" placeholder="${type === "youtube" ? "https://youtu.be/…" : "https://soundcloud.com/artis/judul"}" value="${esc(type === c.music_source.type ? c.music_source.value || "" : "")}">
            </label>`;
          $("#f-murl", wrap).addEventListener("input", (e) => {
            c.music_source = { type, value: e.target.value.trim() };
            this.markDirty("info_cover");
          });
        } else if (type === "mp3") {
          const music = this.firstMedia("music");
          wrap.innerHTML = `
            <div class="music-row ${music ? "on" : ""}">
              <span>${music ? "✓ musik_" + esc(String(this.event.id || "")) + ".mp3 terpasang" : "Belum ada MP3 terunggah"}</span>
              <button type="button" class="btn btn-line" id="btn-mp3-up">Unggah .mp3</button>
            </div>`;
          $("#btn-mp3-up", wrap).addEventListener("click", async () => {
            const file = await ImageTool.pickFile("audio/mpeg,audio/mp3,.mp3");
            if (!file) return;
            if (file.size > 12 * 1024 * 1024) return Toast.show("MP3 maksimal 12 MB.", true);
            Toast.show("Mengunggah musik…");
            try {
              const item = await this.uploadBlob("music", file, "musik.mp3");
              this.media.music = [item];
              c.music_source = { type: "mp3", value: item.url };
              this.markDirty("info_cover");
              paintMusicExtra();
              Toast.show("Musik MP3 terpasang ✦");
            } catch (err) {
              Toast.show(err.message, true);
            }
          });
        } else {
          wrap.innerHTML = `<p class="panel-note">Melodi Canon in D dimainkan prosedural via Web Audio — 100% bebas hak cipta, tanpa berkas eksternal.</p>`;
        }
      };

      $("#f-msrc", host).addEventListener("change", (e) => {
        const type = e.target.value;
        c.music_source = {
          type,
          value: type === "synth" ? "canon-in-d" : type === "library" ? MUSIC_LIBRARY[0].id : "",
        };
        if (type === "mp3") {
          const music = this.firstMedia("music");
          if (music) c.music_source.value = music.url;
        }
        this.markDirty("info_cover");
        paintMusicExtra();
      });
      paintMusicExtra();

      $("#btn-music-preview", host).addEventListener("click", () => {
        if (c.music_source.type !== "synth" && c.music_source.type !== "library" && !c.music_source.value) {
          return Toast.show("Isi dulu link / berkas musiknya.", true);
        }
        Vinyl.show();
        MusicEngine.play(c.music_source);
      });
      $("#btn-music-stop", host).addEventListener("click", () => MusicEngine.stop());
    },

    /* ---------- TAB 2 — PROFIL MEMPELAI + CROPPER 1:1 BULAT ---------- */
    paintCouple(host) {
      const c = this.content("couple_profiles", {
        groom: { full_name: this.event.groom_name, nickname: "", parents: "", instagram: "" },
        bride: { full_name: this.event.bride_name, nickname: "", parents: "", instagram: "" },
      });
      if (!c.groom || typeof c.groom !== "object") c.groom = {};
      if (!c.bride || typeof c.bride !== "object") c.bride = {};

      const card = (side, label, kind) => {
        const p = c[side];
        const photo = this.firstMedia(kind);
        return `
        <div class="couple-card">
          <p class="couple-flag">${label}</p>
          <div class="avatar-wrap" data-avatar="${side}">
            ${photo ? `<img src="${esc(photo.url)}" alt="Foto ${label}">` : `<span class="drop-hint">＋</span>`}
          </div>
          <button type="button" class="btn btn-line btn-sm" data-upload="${side}">Unggah Foto (1:1 Bulat)</button>
          <label class="sfield">Nama Lengkap <input data-f="${side}.full_name" value="${esc(p.full_name || "")}"></label>
          <label class="sfield">Nama Panggilan <input data-f="${side}.nickname" value="${esc(p.nickname || "")}"></label>
          <label class="sfield">Nama Orang Tua <input data-f="${side}.parents" placeholder="Putra/Putri dari Bapak … & Ibu …" value="${esc(p.parents || "")}"></label>
          <label class="sfield">Instagram <input data-f="${side}.instagram" placeholder="@username" value="${esc(p.instagram || "")}"></label>
        </div>`;
      };

      host.innerHTML = `
      <div class="studio-panel">
        <div class="couple-grid">
          ${card("groom", "MEMPELAI PRIA", "groom")}
          ${card("bride", "MEMPELAI WANITA", "bride")}
        </div>
      </div>`;

      $$("input[data-f]", host).forEach((input) => {
        input.addEventListener("input", () => {
          const [side, prop] = input.dataset.f.split(".");
          c[side][prop] = input.value;
          this.markDirty("couple_profiles");
        });
      });

      const startUpload = async (side) => {
        const file = await ImageTool.pickFile();
        if (!file) return;
        const blob = await ImageTool.crop(file, "profile");
        if (!blob) return;
        try {
          const item = await this.uploadBlob(side, blob, side === "groom" ? "pria.jpg" : "wanita.jpg");
          this.media[side] = [item];
          c[side].photo = item.url;
          this.markDirty("couple_profiles");
          this.paint();
          Toast.show("Foto " + (side === "groom" ? "mempelai pria" : "mempelai wanita") + " tersimpan ✦");
        } catch (err) {
          Toast.show(err.message, true);
        }
      };
      $$("button[data-upload]", host).forEach((btn) =>
        btn.addEventListener("click", () => startUpload(btn.dataset.upload)));
      $$("[data-avatar]", host).forEach((el) =>
        el.addEventListener("click", () => startUpload(el.dataset.avatar)));
    },

    /* ---------- TAB 3 — JADWAL, PETA, KUNCI TANGGAL, IFRAME PARSER ---------- */
    paintSchedule(host) {
      const c = this.content("schedule_map", {
        akad: {}, resepsi: {}, timezone: this.event.timezone || "Asia/Jakarta",
      });
      ["akad", "resepsi"].forEach((k) => {
        if (!c[k] || typeof c[k] !== "object") c[k] = {};
      });

      const block = (key, label) => {
        const s = c[key];
        return `
        <div class="sched-card">
          <p class="couple-flag">${label}</p>
          <label class="sfield">Tanggal
            <input type="date" data-s="${key}.date" value="${esc(s.date || "")}" ${s.locked ? "disabled" : ""}>
          </label>
          <div class="form-row">
            <label class="sfield">Jam Mulai <input type="time" data-s="${key}.time_start" value="${esc(s.time_start || "")}"></label>
            <label class="sfield">Jam Selesai <input type="time" data-s="${key}.time_end" value="${esc(s.time_end || "")}"></label>
          </div>
          <label class="sfield">Alamat Lengkap <textarea rows="2" data-s="${key}.address" placeholder="Nama gedung, jalan, kota">${esc(s.address || "")}</textarea></label>
          <label class="sfield">Link / Iframe Google Maps
            <textarea rows="2" data-maps="${key}" placeholder='Tempel link ATAU seluruh kode &lt;iframe src="..."&gt; dari Google Maps'>${esc(s.maps_url || "")}</textarea>
          </label>
          <small class="map-hint" data-hint="${key}">${s.maps_url ? "✓ URL peta siap dipakai" : "Auto-parser akan mengekstrak URL dari tag iframe secara otomatis."}</small>
          <label class="toggle-row"><input type="checkbox" data-lock="${key}" ${s.locked ? "checked" : ""}><span class="switch"></span><b>🔒 Kunci Tanggal</b></label>
        </div>`;
      };

      host.innerHTML = `
      <div class="studio-panel">
        <div class="sched-grid">
          ${block("akad", "AKAD / PEMBERKATAN")}
          ${block("resepsi", "RESEPSI")}
        </div>
      </div>`;

      $$("[data-s]", host).forEach((el) => {
        el.addEventListener("input", () => {
          const [key, prop] = el.dataset.s.split(".");
          c[key][prop] = el.value;
          this.markDirty("schedule_map");
        });
      });

      // Auto-Parser: ekstrak URL dari tag <iframe src="..."> Google Maps.
      $$("[data-maps]", host).forEach((el) => {
        el.addEventListener("input", () => {
          const key = el.dataset.maps;
          let value = el.value.trim();
          const match = value.match(/<iframe[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
          if (match) {
            value = match[1];
            el.value = value;
            Toast.show("URL peta berhasil diekstrak dari iframe ✦");
          }
          c[key].maps_url = value;
          const hint = $(`[data-hint="${key}"]`, host);
          if (hint) {
            hint.textContent = value
              ? "✓ URL peta siap dipakai"
              : "Auto-parser akan mengekstrak URL dari tag iframe secara otomatis.";
          }
          this.markDirty("schedule_map");
        });
      });

      // Indikator Kunci Tanggal.
      $$("[data-lock]", host).forEach((el) => {
        el.addEventListener("change", () => {
          const key = el.dataset.lock;
          c[key].locked = el.checked;
          const dateInput = $(`[data-s="${key}.date"]`, host);
          if (dateInput) dateInput.disabled = el.checked;
          this.markDirty("schedule_map");
          Toast.show(el.checked ? "Tanggal " + key + " dikunci 🔒" : "Tanggal " + key + " dibuka kembali.");
        });
      });
    },

    /* ---------- TAB 4 — GALERI MULTI-UPLOADER + CROPPER + HAPUS ---------- */
    syncGalleryContent(c) {
      c.items = (this.media.gallery || []).map((m) => ({ id: m.id, url: m.url }));
      this.markDirty("gallery");
    },

    paintGallery(host) {
      const c = this.content("gallery", { items: [] });
      const items = this.media.gallery || [];

      host.innerHTML = `
      <div class="studio-panel">
        <div class="gallery-tools">
          <div>
            <h3 class="panel-title">Galeri Foto</h3>
            <p class="panel-note">${items.length} foto · setiap foto dipotong &amp; dikompresi otomatis sebelum diunggah</p>
          </div>
          <button type="button" class="btn btn-gold" id="btn-gal-add">＋ Tambah Foto</button>
        </div>
        <div class="gallery-grid">
          ${items.length ? items.map((m) => `
            <figure class="g-item">
              <img src="${esc(m.url)}" alt="Foto galeri" loading="lazy">
              <button type="button" class="g-del" data-del="${esc(m.id)}" title="Hapus foto ini">✕</button>
            </figure>`).join("") : `<p class="panel-note empty">Belum ada foto. Tambahkan kisah visual terbaik Anda ✦</p>`}
        </div>
      </div>`;

      $("#btn-gal-add", host).addEventListener("click", async () => {
        const files = await ImageTool.pickFile("image/*", true);
        if (!files || !files.length) return;
        for (let i = 0; i < files.length; i++) {
          Toast.show("Memotong foto " + (i + 1) + " dari " + files.length + "…");
          const blob = await ImageTool.crop(files[i], "gallery");
          if (!blob) continue;
          try {
            const item = await this.uploadBlob("gallery", blob, "galeri.jpg");
            this.media.gallery.push(item);
          } catch (err) {
            Toast.show(err.message, true);
          }
        }
        this.syncGalleryContent(c);
        this.paint();
      });

      $$(".g-del", host).forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            await Api.del("/media/" + btn.dataset.del);
            this.media.gallery = this.media.gallery.filter((m) => m.id !== btn.dataset.del);
            this.syncGalleryContent(c);
            this.paint();
            Toast.show("Foto dihapus dari galeri & server.");
          } catch (err) {
            Toast.show(err.message, true);
            btn.disabled = false;
          }
        });
      });
    },

    /* ---------- TAB 5 — LOVE STORY (DYNAMIC REPEATER) ---------- */
    paintStory(host) {
      const c = this.content("love_story", { chapters: [] });
      if (!Array.isArray(c.chapters)) c.chapters = [];

      host.innerHTML = `
      <div class="studio-panel">
        <div class="gallery-tools">
          <div>
            <h3 class="panel-title">Perjalanan Cinta</h3>
            <p class="panel-note">${c.chapters.length} babak kisah</p>
          </div>
          <button type="button" class="btn btn-gold" id="btn-story-add">＋ Tambah Babak</button>
        </div>
        <div class="rep-list">
          ${c.chapters.length ? c.chapters.map((ch, i) => `
          <div class="rep-item">
            <span class="rep-no">Babak ${i + 1}</span>
            <button type="button" class="rep-del" data-ri="${i}" title="Hapus babak ini">🗑</button>
            <div class="form-row">
              <label class="sfield">Judul <input data-ch="${i}.title" placeholder="cth. Pertemuan Pertama" value="${esc(ch.title || "")}"></label>
              <label class="sfield">Waktu <input data-ch="${i}.time" placeholder="cth. Maret 2021" value="${esc(ch.time || "")}"></label>
            </div>
            <label class="sfield">Cerita <textarea rows="3" data-ch="${i}.story" placeholder="Tuliskan kisah babak ini…">${esc(ch.story || "")}</textarea></label>
          </div>`).join("") : `<p class="panel-note empty">Belum ada babak. Mulailah dari pertemuan pertama ✦</p>`}
        </div>
      </div>`;

      $("#btn-story-add", host).addEventListener("click", () => {
        c.chapters.push({ title: "", time: "", story: "" });
        this.markDirty("love_story");
        this.paint();
      });
      $$(".rep-del", host).forEach((btn) =>
        btn.addEventListener("click", () => {
          c.chapters.splice(Number(btn.dataset.ri), 1);
          this.markDirty("love_story");
          this.paint();
        }));
      $$("[data-ch]", host).forEach((el) =>
        el.addEventListener("input", () => {
          const [i, prop] = el.dataset.ch.split(".");
          c.chapters[Number(i)][prop] = el.value;
          this.markDirty("love_story");
        }));
    },

    /* ---------- TAB 6 — HADIAH DIGITAL (REKENING / E-WALLET) ---------- */
    paintGifts(host) {
      const c = this.content("digital_gifts", { accounts: [], address_gift: "" });
      if (!Array.isArray(c.accounts)) c.accounts = [];

      host.innerHTML = `
      <div class="studio-panel">
        <div class="gallery-tools">
          <div>
            <h3 class="panel-title">Hadiah Digital</h3>
            <p class="panel-note">${c.accounts.length} rekening / e-wallet terdaftar</p>
          </div>
          <button type="button" class="btn btn-gold" id="btn-acc-add">＋ Tambah Rekening</button>
        </div>
        <div class="rep-list">
          ${c.accounts.length ? c.accounts.map((acc, i) => `
          <div class="rep-item">
            <span class="rep-no">Rekening ${i + 1}</span>
            <button type="button" class="rep-del" data-ri="${i}" title="Hapus rekening ini">🗑</button>
            <div class="form-row">
              <label class="sfield">Bank / E-Wallet <input data-acc="${i}.bank" placeholder="cth. BCA, OVO, GoPay" value="${esc(acc.bank || "")}"></label>
              <label class="sfield">Nomor Rekening <input data-acc="${i}.number" inputmode="numeric" placeholder="cth. 1234567890" value="${esc(acc.number || "")}"></label>
            </div>
            <label class="sfield">Atas Nama <input data-acc="${i}.holder" placeholder="Nama pemilik rekening" value="${esc(acc.holder || "")}"></label>
          </div>`).join("") : `<p class="panel-note empty">Belum ada rekening amplop digital ✦</p>`}
        </div>
        <label class="sfield">Alamat Kirim Kado Fisik (opsional)
          <textarea rows="2" id="f-gift-addr" placeholder="Alamat lengkap penerima kado">${esc(c.address_gift || "")}</textarea>
        </label>
      </div>`;

      $("#btn-acc-add", host).addEventListener("click", () => {
        c.accounts.push({ bank: "", number: "", holder: "" });
        this.markDirty("digital_gifts");
        this.paint();
      });
      $$(".rep-del", host).forEach((btn) =>
        btn.addEventListener("click", () => {
          c.accounts.splice(Number(btn.dataset.ri), 1);
          this.markDirty("digital_gifts");
          this.paint();
        }));
      $$("[data-acc]", host).forEach((el) =>
        el.addEventListener("input", () => {
          const [i, prop] = el.dataset.acc.split(".");
          c.accounts[Number(i)][prop] = el.value;
          this.markDirty("digital_gifts");
        }));
      $("#f-gift-addr", host).addEventListener("input", (e) => {
        c.address_gift = e.target.value;
        this.markDirty("digital_gifts");
      });
    },

    /* ---------- TAB 7 — PENGATURAN MODULAR, TIPE GALERI, TEKS DOA ---------- */
    paintSettings(host) {
      const c = this.content("settings_prayers", {
        sections: {},
        gallery_layout: "grid",
        opening_text: "",
        prayer_quote: "",
        closing_text: "",
      });
      if (!c.sections || typeof c.sections !== "object") c.sections = {};

      const SECTIONS = [
        ["cover", "Sampul Pembuka"], ["music", "Musik Latar"], ["prayer", "Box Doa"],
        ["profiles", "Profil Mempelai"], ["schedule", "Jadwal & Peta"], ["story", "Love Story"],
        ["gallery", "Galeri Foto"], ["gifts", "Amplop Digital"], ["rsvp", "RSVP & Buku Tamu"],
      ];
      SECTIONS.forEach(([k]) => { if (c.sections[k] === undefined) c.sections[k] = true; });

      const LAYOUTS = [
        ["grid", "▦ Grid", "Kolase 2 kolom"],
        ["single", "▭ Satuan", "Vertikal penuh"],
        ["slide", "◈ Slide", "Carousel · panah & titik"],
      ];

      host.innerHTML = `
      <div class="studio-panel">
        <div>
          <h3 class="panel-title">Checklist Fitur Modular</h3>
          <p class="panel-note">Nyalakan / matikan setiap seksi undangan dalam satu ketukan.</p>
        </div>
        <div class="toggle-grid">
          ${SECTIONS.map(([key, label]) => `
            <label class="feature-toggle"><b>${label}</b>
              <input type="checkbox" data-sec="${key}" ${c.sections[key] ? "checked" : ""}><span class="switch"></span>
            </label>`).join("")}
        </div>

        <div>
          <h3 class="panel-title">Tipe Tata Letak Galeri</h3>
          <p class="panel-note">Menentukan cara galeri dirender di undangan publik.</p>
        </div>
        <div class="radio-cards">
          ${LAYOUTS.map(([val, title, note]) => `
            <label class="radio-card ${c.gallery_layout === val ? "checked" : ""}">
              <input type="radio" name="glayout" value="${val}" ${c.gallery_layout === val ? "checked" : ""}>
              <b>${title}</b><small>${note}</small>
            </label>`).join("")}
        </div>

        <div>
          <h3 class="panel-title">Teks Doa &amp; Sambutan</h3>
        </div>
        <label class="sfield">Teks Pembuka
          <textarea rows="3" id="f-open" placeholder="Kalimat sambutan di awal undangan">${esc(c.opening_text || "")}</textarea>
        </label>
        <label class="sfield">Kutipan Doa Pernikahan
          <textarea rows="3" id="f-prayer" placeholder="cth. QS Ar-Rum: 21 · 1 Korintus 13:4 · dst.">${esc(c.prayer_quote || "")}</textarea>
        </label>
        <label class="sfield">Teks Penutup
          <textarea rows="3" id="f-close" placeholder="Ucapan terima kasih di akhir undangan">${esc(c.closing_text || "")}</textarea>
        </label>
      </div>`;

      $$("[data-sec]", host).forEach((el) =>
        el.addEventListener("change", () => {
          c.sections[el.dataset.sec] = el.checked;
          this.markDirty("settings_prayers");
        }));

      $$("input[name=glayout]", host).forEach((el) =>
        el.addEventListener("change", () => {
          c.gallery_layout = el.value;
          $$(".radio-card", host).forEach((card) =>
            card.classList.toggle("checked", $("input", card).checked));
          this.markDirty("settings_prayers");
        }));

      const bindText = (sel, prop) =>
        $(sel, host).addEventListener("input", (e) => {
          c[prop] = e.target.value;
          this.markDirty("settings_prayers");
        });
      bindText("#f-open", "opening_text");
      bindText("#f-prayer", "prayer_quote");
      bindText("#f-close", "closing_text");
    },
  };

  /* ==========================================================
     12. MODUL 4 — MESIN MUSIK LATAR MULTI-SOURCE
     Synth Canon in D (Web Audio) · Library CC · YouTube · SoundCloud · MP3.
     ========================================================== */
  const MUSIC_LIBRARY = [
    { id: "cc1", title: "Serenity — SoundHelix (bebas royalti)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "cc2", title: "Golden Hour — SoundHelix (bebas royalti)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    { id: "cc3", title: "Eternal Vows — SoundHelix (bebas royalti)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
  ];

  /* ---- 12a. Built-in Web Audio Synthesizer: Canon in D prosedural ---- */
  const CanonSynth = {
    ctx: null,
    master: null,
    timer: 0,
    nextTime: 0,
    bar: 0,
    running: false,
    BEAT: 1.15, // detik per ketuk — tempo tenang

    /** Frekuensi dari nama nada, cth. "F#4" → Hz (A4 = 440). */
    freq(note) {
      const m = note.match(/^([A-G]#?)(\d)$/);
      if (!m) return 440;
      const SEMI = { C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4, "F#": -3, G: -2, "G#": -1, A: 0, "A#": 1, B: 2 };
      const n = SEMI[m[1]] + (parseInt(m[2], 10) - 4) * 12;
      return 440 * Math.pow(2, n / 12);
    },

    // Progresi legendaris: D — A — Bm — F#m — G — D — G — A (2 ketuk per bar).
    PROG: [
      { bass: "D2",  chord: ["D3", "F#3", "A3"] },
      { bass: "A2",  chord: ["A3", "C#4", "E4"] },
      { bass: "B2",  chord: ["B3", "D4", "F#4"] },
      { bass: "F#2", chord: ["F#3", "A3", "C#4"] },
      { bass: "G2",  chord: ["G3", "B3", "D4"] },
      { bass: "D2",  chord: ["D3", "F#3", "A3"] },
      { bass: "G2",  chord: ["G3", "B3", "D4"] },
      { bass: "A2",  chord: ["A3", "C#4", "E4"] },
    ],
    // Dua putaran melodi biola (1 nada per bar, lalu variasi seperdelapanan).
    MELODY: [
      ["F#5"], ["E5"], ["D5"], ["C#5"], ["B4"], ["A4"], ["B4"], ["C#5"],
      ["D5", "F#5"], ["C#5", "E5"], ["B4", "D5"], ["A4", "C#5"],
      ["G4", "B4"], ["F#4", "A4"], ["G4", "B4"], ["A4", "C#5"],
    ],

    /** Satu nada lembut: osilator + envelope attack/release halus. */
    tone(note, time, duration, peak, type) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = this.freq(note);
      const attack = Math.min(0.35, duration * 0.3);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(peak, time + attack);
      gain.gain.setValueAtTime(peak, time + Math.max(attack, duration * 0.55));
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.connect(gain).connect(this.master);
      osc.start(time);
      osc.stop(time + duration + 0.08);
    },

    scheduleBar(index, time) {
      const beat = this.BEAT;
      const step = this.PROG[index % this.PROG.length];
      // Bass hangat (sine) sepanjang bar.
      this.tone(step.bass, time, beat * 2.1, 0.11, "sine");
      // Pad akor (triangle) — tiga nada lembut bertumpuk.
      step.chord.forEach((n, i) => this.tone(n, time + i * 0.05, beat * 2, 0.045, "triangle"));
      // Melodi di atasnya.
      const line = this.MELODY[index % this.MELODY.length];
      const slot = (beat * 2) / line.length;
      line.forEach((n, i) => this.tone(n, time + i * slot, slot * 1.5, 0.075, "sine"));
    },

    start() {
      if (this.running) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return Toast.show("Peramban tidak mendukung Web Audio.", true);
      if (!this.ctx) {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      }
      this.ctx.resume();
      this.running = true;
      this.bar = 0;
      this.nextTime = this.ctx.currentTime + 0.1;
      // Lookahead scheduler: jadwalkan bar ±1,5 detik ke depan tiap 250 ms.
      this.timer = setInterval(() => {
        while (this.nextTime < this.ctx.currentTime + 1.5) {
          this.scheduleBar(this.bar, this.nextTime);
          this.nextTime += this.BEAT * 2;
          this.bar += 1;
        }
      }, 250);
    },

    stop() {
      this.running = false;
      clearInterval(this.timer);
      if (this.ctx) this.ctx.suspend();
    },
  };

  /* ---- 12b. Mesin terpadu + Floating Vinyl Disc ---- */
  const MusicEngine = {
    mode: null,        // 'synth' | 'url' | 'youtube' | 'soundcloud'
    playing: false,
    audio: null,       // HTMLAudioElement untuk library/MP3
    yt: null,          // YT.Player
    ytReady: null,     // Promise loader API
    sc: null,          // SC.Widget
    scReady: null,
    source: null,

    loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Gagal memuat " + src));
        document.head.appendChild(s);
      });
    },

    youtubeId(input) {
      const m = String(input || "").match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
      );
      return m ? m[1] : String(input || "").trim();
    },

    async ensureYouTube(videoId) {
      if (!this.ytReady) {
        this.ytReady = new Promise((resolve) => {
          if (window.YT && window.YT.Player) return resolve();
          window.onYouTubeIframeAPIReady = () => resolve();
          this.loadScript("https://www.youtube.com/iframe_api");
        });
      }
      await this.ytReady;
      return new Promise((resolve) => {
        if (this.yt) {
          this.yt.loadVideoById(videoId);
          return resolve();
        }
        const holder = document.createElement("div");
        $("#yt-holder").appendChild(holder);
        this.yt = new YT.Player(holder, {
          width: 1, height: 1, videoId,
          playerVars: { autoplay: 1, loop: 1, playlist: videoId, controls: 0 },
          events: { onReady: () => resolve() },
        });
      });
    },

    async ensureSoundCloud(trackUrl) {
      await this.loadScript("https://w.soundcloud.com/player/api.js");
      return new Promise((resolve) => {
        const src =
          "https://w.soundcloud.com/player/?url=" + encodeURIComponent(trackUrl) +
          "&auto_play=true&visual=false&show_artwork=false";
        if (this.sc && this.scIframe) {
          this.scIframe.src = src;
          this.sc = SC.Widget(this.scIframe);
          this.sc.bind(SC.Widget.Events.READY, () => resolve());
          return;
        }
        const iframe = document.createElement("iframe");
        iframe.allow = "autoplay";
        iframe.src = src;
        iframe.width = "1";
        iframe.height = "1";
        $("#sc-holder").appendChild(iframe);
        this.scIframe = iframe;
        this.sc = SC.Widget(iframe);
        this.sc.bind(SC.Widget.Events.READY, () => resolve());
      });
    },

    /** Mainkan sumber: {type:'synth'|'library'|'mp3'|'youtube'|'soundcloud', value} */
    async play(source) {
      this.stop(true);
      this.source = source || { type: "synth", value: "canon-in-d" };
      const { type, value } = this.source;
      try {
        if (type === "youtube") {
          this.mode = "youtube";
          await this.ensureYouTube(this.youtubeId(value));
          this.yt.setVolume(70);
          this.yt.playVideo();
        } else if (type === "soundcloud") {
          this.mode = "soundcloud";
          await this.ensureSoundCloud(value);
          this.sc.play();
        } else if (type === "library" || type === "mp3") {
          this.mode = "url";
          const url = type === "library"
            ? (MUSIC_LIBRARY.find((t) => t.id === value) || MUSIC_LIBRARY[0]).url
            : value;
          if (!this.audio) {
            this.audio = new Audio();
            this.audio.loop = true;
            this.audio.volume = 0.75;
          }
          this.audio.src = url;
          await this.audio.play();
        } else {
          this.mode = "synth";
          CanonSynth.start();
        }
        this.playing = true;
        Vinyl.sync();
      } catch (err) {
        Toast.show("Musik tidak dapat diputar: " + err.message, true);
      }
    },

    pause() {
      if (this.mode === "synth") CanonSynth.stop();
      else if (this.mode === "url" && this.audio) this.audio.pause();
      else if (this.mode === "youtube" && this.yt) this.yt.pauseVideo();
      else if (this.mode === "soundcloud" && this.sc) this.sc.pause();
      this.playing = false;
      Vinyl.sync();
    },

    resume() {
      if (!this.source) return;
      if (this.mode === "synth") CanonSynth.start();
      else if (this.mode === "url" && this.audio) this.audio.play();
      else if (this.mode === "youtube" && this.yt) this.yt.playVideo();
      else if (this.mode === "soundcloud" && this.sc) this.sc.play();
      this.playing = true;
      Vinyl.sync();
    },

    toggle() { this.playing ? this.pause() : this.resume(); },

    stop(keepDock = false) {
      if (this.mode === "synth") CanonSynth.stop();
      if (this.audio) { this.audio.pause(); this.audio.removeAttribute("src"); }
      if (this.yt) { try { this.yt.stopVideo(); } catch { /* belum siap */ } }
      if (this.sc) { try { this.sc.pause(); } catch { /* belum siap */ } }
      this.playing = false;
      if (!keepDock) Vinyl.hide();
      else Vinyl.sync();
    },
  };

  const Vinyl = {
    show() { $("#vinyl-dock").hidden = false; this.sync(); },
    hide() { const d = $("#vinyl-dock"); d.hidden = true; d.classList.remove("playing"); },
    sync() { $("#vinyl-dock").classList.toggle("playing", MusicEngine.playing); },
    init() { $("#vinyl-btn").addEventListener("click", () => MusicEngine.toggle()); },
  };

  /* ==========================================================
     13. MODUL 5 — TAMPILAN UNDANGAN PUBLIK PENUH
     ========================================================== */
  const InvitationView = {
    pollTimer: 0,
    slug: null,
    data: null,

    cleanup() {
      clearInterval(this.pollTimer);
      this.pollTimer = 0;
      document.body.classList.remove("gate-locked");
      MusicEngine.stop();
    },

    tab(key) {
      const t = this.data && this.data.tabs && this.data.tabs[key];
      return (t && t.content) || {};
    },

    async render(slug) {
      this.cleanup();
      this.slug = slug;
      const app = mount("tpl-invitation");
      document.body.classList.add("gate-locked"); // kunci scroll sampai gate dibuka

      // Pembaca ?kpd= : '+' → spasi untuk sapaan tamu.
      const params = new URLSearchParams(location.search);
      const guest = (params.get("kpd") || "").replace(/\+/g, " ").trim();
      if (guest) $("#gate-guest-name", app).textContent = guest;

      try {
        const data = await Api.get("/public/invitation/" + encodeURIComponent(slug));
        this.data = data;
        document.title = data.event.title + " — UNDIGITAL";

        $("#gate-type", app).textContent = (data.event.event_type || "Pernikahan").toUpperCase();
        $("#gate-names", app).innerHTML =
          esc(data.event.groom_name) + " <em>&amp;</em> " + esc(data.event.bride_name);
        $("#gate-date", app).textContent = fmtDate(data.event.starts_at);

        // Ken Burns pada foto sampul (bila ada & seksi cover aktif).
        const cover = (data.media.cover && data.media.cover[0]) || null;
        const sections = this.tab("settings_prayers").sections || {};
        if (cover && sections.cover !== false) {
          $("#gate-photo", app).style.backgroundImage = `url("${cover.url}")`;
        }

        this.renderMain(app);
      } catch (err) {
        $("#gate-names", app).textContent = "Undangan tidak ditemukan";
        $("#gate-date", app).textContent = err.message;
        $("#btn-open-invitation", app).style.display = "none";
        document.body.classList.remove("gate-locked");
        return;
      }

      // Tombol Buka Undangan: buka kunci scroll + nyalakan musik (user gesture).
      $("#btn-open-invitation", app).addEventListener("click", () => {
        document.body.classList.remove("gate-locked");
        $("#inv-gate", app).style.display = "none";
        $("#inv-main", app).hidden = false;
        window.scrollTo(0, 0);

        const info = this.tab("info_cover");
        const sections = this.tab("settings_prayers").sections || {};
        if (info.music_enabled !== false && sections.music !== false) {
          Vinyl.show();
          MusicEngine.play(info.music_source || { type: "synth", value: "canon-in-d" });
        }
        this.startGuestbookPolling();
      });
    },

    renderMain(app) {
      const ev = this.data.event;
      const media = this.data.media;
      const info = this.tab("info_cover");
      const couple = this.tab("couple_profiles");
      const sched = this.tab("schedule_map");
      const story = this.tab("love_story");
      const gifts = this.tab("digital_gifts");
      const setts = this.tab("settings_prayers");
      const sections = setts.sections || {};
      const on = (k) => sections[k] !== false;

      const parts = [];

      // --- Hero mempelai ---
      parts.push(`
      <section class="inv-section inv-hero">
        <p class="inv-kicker">THE ${esc((ev.event_type || "WEDDING").toUpperCase())} OF</p>
        <h1 class="inv-hero-names">${esc(ev.groom_name)} <i>&amp;</i> ${esc(ev.bride_name)}</h1>
        <p class="inv-hero-date">${esc(fmtDate(ev.starts_at))}</p>
        ${setts.opening_text ? `<p class="panel-note" style="margin-top:18px">${esc(setts.opening_text)}</p>` : ""}
        <p class="inv-flourish">❦</p>
      </section>`);

      // --- Box doa ---
      if (on("prayer") && setts.prayer_quote) {
        parts.push(`
        <section class="inv-section">
          <p class="inv-kicker">DOA PERNIKAHAN</p>
          <div class="prayer-box">${esc(setts.prayer_quote)}</div>
        </section>`);
      }

      // --- Profil mempelai ---
      if (on("profiles")) {
        const pCard = (p, photo, fallback) => `
          <div class="profile-card">
            <div class="profile-photo">${photo ? `<img src="${esc(photo.url)}" alt="${esc(p.full_name || fallback)}">` : "❦"}</div>
            <h3>${esc(p.full_name || fallback)}</h3>
            ${p.nickname ? `<div class="p-nick">"${esc(p.nickname)}"</div>` : ""}
            ${p.parents ? `<p class="p-parents">${esc(p.parents)}</p>` : ""}
            ${p.instagram ? `<a class="p-ig" href="https://instagram.com/${esc(String(p.instagram).replace(/^@/, ""))}" target="_blank" rel="noopener">✦ ${esc(p.instagram)}</a>` : ""}
          </div>`;
        parts.push(`
        <section class="inv-section">
          <p class="inv-kicker">MEMPELAI</p>
          <h2 class="inv-title">Dua hati, <em>satu perjalanan.</em></h2>
          <div class="profile-cards">
            ${pCard(couple.groom || {}, (media.groom || [])[0], ev.groom_name)}
            <span class="profile-amp">&amp;</span>
            ${pCard(couple.bride || {}, (media.bride || [])[0], ev.bride_name)}
          </div>
        </section>`);
      }

      // --- Jadwal & peta ---
      if (on("schedule")) {
        const sCard = (s, label) => {
          if (!s || (!s.date && !s.address)) return "";
          return `
          <div class="inv-sched-card">
            <h3>${label}</h3>
            ${s.locked ? `<span class="s-locked">🔒 Tanggal Terkunci</span>` : ""}
            <div class="s-date">${s.date ? esc(fmtDate(s.date + " 00:00:00")) : "Segera diumumkan"}</div>
            <div class="s-time">${esc(s.time_start || "--:--")}${s.time_end ? " — " + esc(s.time_end) : " WIB — selesai"}</div>
            ${s.address ? `<p class="s-addr">${esc(s.address)}</p>` : ""}
            ${s.maps_url ? `<a class="btn btn-gold btn-sm" href="${esc(s.maps_url)}" target="_blank" rel="noopener">📍 Buka di Google Maps</a>` : ""}
          </div>`;
        };
        const cards = sCard(sched.akad, "Akad / Pemberkatan") + sCard(sched.resepsi, "Resepsi");
        if (cards) {
          parts.push(`
          <section class="inv-section">
            <p class="inv-kicker">RANGKAIAN ACARA</p>
            <h2 class="inv-title">Waktu &amp; <em>tempat.</em></h2>
            <div class="inv-sched-cards">${cards}</div>
          </section>`);
        }
      }

      // --- Love story ---
      if (on("story") && Array.isArray(story.chapters) && story.chapters.length) {
        parts.push(`
        <section class="inv-section">
          <p class="inv-kicker">PERJALANAN CINTA</p>
          <h2 class="inv-title">Kisah yang membawa kami <em>ke sini.</em></h2>
          <div class="story-line">
            ${story.chapters.map((ch) => `
              <div class="story-item">
                ${ch.time ? `<time>${esc(ch.time)}</time>` : ""}
                <h4>${esc(ch.title || "Babak")}</h4>
                ${ch.story ? `<p>${esc(ch.story)}</p>` : ""}
              </div>`).join("")}
          </div>
        </section>`);
      }

      // --- Galeri: grid / satuan / slide ---
      if (on("gallery") && media.gallery && media.gallery.length) {
        const layout = setts.gallery_layout || "grid";
        let body = "";
        if (layout === "single") {
          body = `<div class="inv-gal-single">${media.gallery.map((m) =>
            `<img src="${esc(m.url)}" alt="Galeri" loading="lazy">`).join("")}</div>`;
        } else if (layout === "slide") {
          body = `
          <div class="inv-carousel" id="inv-carousel">
            <button type="button" class="car-btn prev" aria-label="Sebelumnya">‹</button>
            <div class="inv-carousel-track" id="car-track">
              ${media.gallery.map((m) => `<img src="${esc(m.url)}" alt="Galeri" loading="lazy">`).join("")}
            </div>
            <button type="button" class="car-btn next" aria-label="Berikutnya">›</button>
            <div class="car-dots" id="car-dots">
              ${media.gallery.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}
            </div>
          </div>`;
        } else {
          body = `<div class="inv-gal-grid">${media.gallery.map((m) =>
            `<img src="${esc(m.url)}" alt="Galeri" loading="lazy">`).join("")}</div>`;
        }
        parts.push(`
        <section class="inv-section">
          <p class="inv-kicker">GALERI</p>
          <h2 class="inv-title">Potret <em>kebahagiaan.</em></h2>
          ${body}
        </section>`);
      }

      // --- Amplop digital ---
      if (on("gifts") && Array.isArray(gifts.accounts) && gifts.accounts.length) {
        parts.push(`
        <section class="inv-section">
          <p class="inv-kicker">AMPLOP DIGITAL</p>
          <h2 class="inv-title">Tanda kasih <em>tanpa repot.</em></h2>
          <div class="gift-cards">
            ${gifts.accounts.map((acc) => `
              <div class="gift-card">
                <b>${esc(acc.bank || "Bank")}</b>
                <span class="gift-number">${esc(acc.number || "-")}</span>
                <span class="gift-holder">a.n. ${esc(acc.holder || "-")}</span>
                <button type="button" class="btn btn-gold btn-sm gift-copy" data-copy="${esc(acc.number || "")}">⧉ Salin Nomor</button>
              </div>`).join("")}
          </div>
          ${gifts.address_gift ? `<p class="panel-note" style="margin-top:16px">🎁 Kado fisik: ${esc(gifts.address_gift)}</p>` : ""}
        </section>`);
      }

      // --- RSVP & buku tamu ---
      if (on("rsvp")) {
        parts.push(`
        <section class="inv-section dark">
          <p class="inv-kicker">RSVP &amp; BUKU TAMU</p>
          <h2 class="inv-title" style="color:#f2e7ce">Konfirmasi <em>kehadiran Anda.</em></h2>
          <form class="rsvp-form" id="rsvp-form" autocomplete="off" novalidate>
            <label class="sfield">Nama Anda <input name="guest_name" autocomplete="off" required placeholder="Nama lengkap"></label>
            <div class="form-row">
              <label class="sfield">Kehadiran
                <select name="attendance">
                  <option value="attending">✓ Hadir</option>
                  <option value="maybe">? Belum Pasti</option>
                  <option value="not_attending">✕ Berhalangan</option>
                </select>
              </label>
              <label class="sfield">Jumlah Tamu <input type="number" name="attendee_count" min="1" max="20" value="1"></label>
            </div>
            <label class="sfield">Ucapan &amp; Doa <textarea name="message" rows="3" placeholder="Tuliskan ucapan selamat…"></textarea></label>
            <button type="submit" class="btn btn-gold btn-block">Kirim Konfirmasi ✦</button>
          </form>
          <div class="gb-stats" id="gb-stats"></div>
          <div class="guestbook" id="guestbook"></div>
        </section>`);
      }

      // --- Penutup ---
      parts.push(`
      <section class="inv-section dark inv-closing">
        ${setts.closing_text ? `<p>${esc(setts.closing_text)}</p>` : ""}
        <p class="inv-kicker" style="margin-top:26px">KAMI YANG BERBAHAGIA</p>
        <h2 class="inv-hero-names">${esc(ev.groom_name)} <i>&amp;</i> ${esc(ev.bride_name)}</h2>
        <p class="inv-flourish">❦</p>
        <p class="inv-credit">Made with UNDIGITAL · undigital.id</p>
      </section>`);

      const main = $("#inv-main", app);
      main.innerHTML = parts.join("");

      this.bindCarousel(main);
      this.bindGiftCopy(main);
      this.bindRsvp(main, info);
      if (on("rsvp")) this.loadGuestbook();
    },

    bindCarousel(main) {
      const track = $("#car-track", main);
      if (!track) return;
      const dots = $$("#car-dots i", main);
      const slideW = () => track.clientWidth + 12;
      $(".car-btn.prev", main).addEventListener("click", () =>
        track.scrollBy({ left: -slideW(), behavior: "smooth" }));
      $(".car-btn.next", main).addEventListener("click", () =>
        track.scrollBy({ left: slideW(), behavior: "smooth" }));
      track.addEventListener("scroll", () => {
        const idx = Math.round(track.scrollLeft / slideW());
        dots.forEach((d, i) => d.classList.toggle("on", i === idx));
      }, { passive: true });
    },

    bindGiftCopy(main) {
      $$("[data-copy]", main).forEach((btn) =>
        btn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(btn.dataset.copy);
            Toast.show("Nomor rekening tersalin ✦");
          } catch {
            Toast.show("Gagal menyalin. Catat manual ya.", true);
          }
        }));
    },

    bindRsvp(main, info) {
      const form = $("#rsvp-form", main);
      if (!form) return;
      $$("input, textarea", form).forEach((el) => { el.value = el.name === "attendee_count" ? "1" : ""; });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = $("button[type=submit]", form);
        btn.disabled = true;
        const payload = {
          slug: this.slug,
          guest_name: form.guest_name.value.trim(),
          attendance: form.attendance.value,
          attendee_count: parseInt(form.attendee_count.value, 10) || 1,
          message: form.message.value.trim(),
        };
        try {
          await Api.post("/public/rsvp", payload);
          Toast.show("Terima kasih! Konfirmasi Anda tersimpan ✦");
          form.guest_name.value = "";
          form.message.value = "";
          await this.loadGuestbook();

          // Teruskan konfirmasi ke WhatsApp mempelai bila nomor tersedia.
          const wa = String(info.rsvp_whatsapp || "").replace(/[^0-9]/g, "");
          if (wa) {
            const label = { attending: "InsyaAllah HADIR", maybe: "BELUM PASTI", not_attending: "BERHALANGAN hadir" }[payload.attendance];
            const text =
              "Halo, saya " + payload.guest_name +
              ".\nKonfirmasi RSVP: " + label +
              " (" + payload.attendee_count + " orang)." +
              (payload.message ? "\nUcapan: " + payload.message : "");
            window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(text), "_blank", "noopener");
          }
        } catch (err) {
          Toast.show(err.message, true);
        } finally {
          btn.disabled = false;
        }
      });
    },

    async loadGuestbook() {
      try {
        const data = await Api.get("/public/rsvp/" + encodeURIComponent(this.slug) + "?limit=60");
        const list = $("#guestbook");
        const stats = $("#gb-stats");
        if (!list) return;
        stats.textContent =
          data.stats.total_entries + " ucapan · " + data.stats.attending_people + " tamu dikonfirmasi hadir";
        list.innerHTML = data.entries.length
          ? data.entries.map((en) => `
            <div class="gb-entry">
              <b>${esc(en.guest_name)}</b>
              <span class="gb-badge ${esc(en.attendance)}">${{ attending: "Hadir", not_attending: "Berhalangan", maybe: "Belum Pasti" }[en.attendance] || ""}</span>
              ${en.message ? `<p>${esc(en.message)}</p>` : ""}
              <time>${esc(fmtDate(en.created_at))}</time>
            </div>`).join("")
          : `<p class="panel-note empty" style="color:#b7ae9d">Jadilah yang pertama mengirim doa ✦</p>`;
      } catch { /* polling diam-diam */ }
    },

    startGuestbookPolling() {
      clearInterval(this.pollTimer);
      this.pollTimer = setInterval(() => {
        if (document.body.classList.contains("is-public-mode")) this.loadGuestbook();
        else clearInterval(this.pollTimer);
      }, 15000);
    },
  };

  /* ==========================================================
     14. BOOTSTRAP APLIKASI
     ========================================================== */
  document.addEventListener("DOMContentLoaded", async () => {
    Security.init();
    Modal.init();
    Header.init();
    Vinyl.init();
    Router.init();

    if (Store.token) await Store.validate();
    Router.resolve();
  });
})();
