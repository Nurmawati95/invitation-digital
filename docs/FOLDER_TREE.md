# UNDIGITAL — Target Folder Tree

```text
undigital/
├── .env.example                         # Template kredensial MySQL, origin, dan session secret
├── .gitignore
├── .htaccess                            # Security headers, SPA fallback, proteksi berkas
├── README.md                            # Instalasi, permission, deployment, dan operasi
├── index.html                           # HTML shell tunggal untuk Client-First SPA
├── style.css                            # Bundel desain fase awal (Luxury Gold & Dark/Cream)
├── app.js                               # Bundel SPA fase awal (security, router, Modul 0-2)
├── api.php                              # REST JSON front controller (PHP Native)
├── config.php                           # Koneksi PDO MySQL, env, dan helper inti

├── database/
│   ├── schema.sql                       # Skema MySQL 8 dan indeks
│   └── seeds/
│       └── super-admin.sql              # Seed opsional, password wajib diganti
├── app/
│   ├── bootstrap.php                    # Environment, CORS, error handler, response JSON
│   ├── config/
│   │   ├── database.php                 # Koneksi PDO MySQL
│   │   ├── security.php                 # Session/token/cookie policy
│   │   └── uploads.php                  # MIME, ukuran, path, dan nama berkas
│   ├── core/
│   │   ├── Auth.php                     # Validasi token dan RBAC
│   │   ├── Database.php                 # PDO wrapper + transaction
│   │   ├── Router.php                   # Dispatcher REST api.php
│   │   ├── Request.php                  # JSON/form-data parser
│   │   ├── Response.php                 # Respons JSON seragam
│   │   ├── Validator.php                # Validasi/normalisasi input
│   │   └── UploadManager.php            # finfo, whitelist, move, dan delete tree
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── EventController.php
│   │   ├── EditorController.php
│   │   ├── MediaController.php
│   │   ├── PublicInvitationController.php
│   │   └── RsvpController.php
│   ├── middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── RoleMiddleware.php
│   │   ├── CsrfMiddleware.php
│   │   └── RateLimitMiddleware.php
│   └── repositories/
│       ├── UserRepository.php
│       ├── EventRepository.php
│       ├── EditorTabRepository.php
│       ├── MediaRepository.php
│       └── RsvpRepository.php
├── assets/
│   ├── css/
│   │   ├── tokens.css                   # Custom properties warna, radius, spacing
│   │   ├── base.css                     # Reset, semantic HTML, mobile defaults
│   │   ├── components.css               # Tombol, kartu, modal, toast, forms
│   │   ├── portal.css                   # Landing, auth, admin, studio
│   │   ├── invitation.css               # Tampilan undangan standalone
│   │   └── animations.css               # Ken Burns, floating phone, vinyl, equalizer
│   ├── js/
│   │   ├── app.js                       # Entry point dan bootstrap SPA
│   │   ├── router.js                    # History API, guards, instant transitions
│   │   ├── store.js                     # Reactive client state + cache
│   │   ├── api-client.js                # Fetch REST, token, abort, optimistic update
│   │   ├── security.js                  # Contextmenu, shortcut, dan drag protection
│   │   ├── utils/
│   │   │   ├── canvas-compressor.js     # Crop/resize/encode JPEG sebelum upload
│   │   │   ├── clipboard.js
│   │   │   ├── iframe-parser.js
│   │   │   ├── sanitizer.js
│   │   │   └── whatsapp-link.js
│   │   ├── audio/
│   │   │   ├── canon-synth.js           # Canon in D Web Audio procedural
│   │   │   ├── audio-engine.js           # Unified source/playback state
│   │   │   ├── youtube-adapter.js
│   │   │   └── soundcloud-adapter.js
│   │   ├── views/
│   │   │   ├── landing.js
│   │   │   ├── login.js
│   │   │   ├── admin.js
│   │   │   ├── studio.js
│   │   │   └── invitation.js
│   │   └── components/
│   │       ├── modal.js
│   │       ├── event-card.js
│   │       ├── cropper.js
│   │       ├── gallery.js
│   │       ├── love-story-repeater.js
│   │       ├── music-picker.js
│   │       ├── rsvp-form.js
│   │       └── vinyl-player.js
│   ├── icons/
│   └── fonts/                            # Self-hosted, WOFF2 only
├── uploads/
│   ├── .htaccess                        # Tidak boleh mengeksekusi script
│   ├── covers/                          # sampul_YYYYMMDD_[random].jpg
│   ├── couples/                         # pria_[id].jpg / wanita_[id].jpg
│   ├── gallery/                         # galeri_[id]_[index].jpg
│   └── music/                           # musik_[id].mp3
├── docs/
│   ├── FOLDER_TREE.md
│   ├── API.md                            # Kontrak endpoint REST
│   ├── EDITOR_JSON.md                    # Versi schema JSON tujuh tab
│   └── DEPLOYMENT.md                     # Apache/PHP/MySQL checklist
└── tests/
    ├── api/
    ├── browser/
    └── fixtures/
```

## Runtime boundaries

- `index.html` dan `assets/` adalah shell SPA yang dapat di-cache lama.
- `api.php` adalah satu-satunya endpoint aplikasi yang menulis ke MySQL atau filesystem.
- `app/` dan `database/` harus ditolak dari akses HTTP oleh aturan Apache.
- `uploads/` hanya menyajikan JPEG dan MP3 dari empat subdirektori yang diizinkan.
- Data editor disimpan per-tab agar autosave, versioning, dan optimistic update tetap ringan.
