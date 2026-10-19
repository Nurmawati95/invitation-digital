<?php
/**
 * UNDIGITAL — api.php
 * REST JSON front controller (PHP Native + MySQL).
 *
 * Peta endpoint:
 *   POST   /api/auth/register                 Daftar akun customer
 *   POST   /api/auth/login                    Masuk dengan email + kata sandi
 *   POST   /api/auth/google                   Google Auth Simulator (satu-klik)
 *   GET    /api/auth/session                  Validasi token sesi + role
 *   POST   /api/auth/logout                   Cabut sesi aktif
 *
 *   GET    /api/events                        Daftar acara (dashboard)
 *   POST   /api/events                        Buat acara baru
 *   GET    /api/events/{publicId}             Detail acara + 7 tab + media (editor)
 *   PATCH  /api/events/{publicId}             Update info inti (judul, slug, tanggal)
 *   PUT    /api/events/{publicId}/tabs/{key}  Simpan satu tab Studio Editor
 *   POST   /api/events/{publicId}/publish     Toggle Published / Draft
 *   DELETE /api/events/{publicId}             KHUSUS SUPER ADMIN: hapus DB + berkas fisik
 *
 *   POST   /api/media                         Upload blob hasil kompresi Canvas klien
 *   DELETE /api/media/{publicId}              Hapus satu media (row + berkas fisik)
 *
 *   GET    /api/public/invitation/{slug}      Data undangan publik (published saja)
 *   POST   /api/public/rsvp                   Simpan RSVP + ucapan buku tamu
 *   GET    /api/public/rsvp/{slug}            Ambil ucapan terbaru (real-time polling)
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

send_security_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    http_response_code(204);
    exit;
}

// ---------------------------------------------------------------------------
// Kerangka error HTTP
// ---------------------------------------------------------------------------
final class HttpError extends RuntimeException
{
    public function __construct(public readonly int $status, string $message)
    {
        parent::__construct($message);
    }
}

function abort(int $status, string $message): never
{
    throw new HttpError($status, $message);
}

// ---------------------------------------------------------------------------
// Rate limiting berbasis tabel rate_limits (tanpa menyimpan IP mentah)
// ---------------------------------------------------------------------------
function rate_limit(string $bucket, int $maxHits, int $windowSeconds): void
{
    $key = hash('sha256', $bucket . '|' . client_ip_hash());
    $pdo = db();

    $pdo->prepare('DELETE FROM rate_limits WHERE expires_at < UTC_TIMESTAMP()')->execute();

    $stmt = $pdo->prepare('SELECT hits FROM rate_limits WHERE bucket_key = ? AND expires_at >= UTC_TIMESTAMP()');
    $stmt->execute([$key]);
    $row = $stmt->fetch();

    if ($row === false) {
        $pdo->prepare(
            'INSERT INTO rate_limits (bucket_key, hits, window_started_at, expires_at)
             VALUES (?, 1, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))
             ON DUPLICATE KEY UPDATE hits = 1, window_started_at = UTC_TIMESTAMP(),
             expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND)'
        )->execute([$key, $windowSeconds, $windowSeconds]);
        return;
    }

    if ((int) $row['hits'] >= $maxHits) {
        abort(429, 'Terlalu banyak permintaan. Coba lagi beberapa saat.');
    }

    $pdo->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE bucket_key = ?')->execute([$key]);
}

// ---------------------------------------------------------------------------
// Autentikasi & RBAC
// ---------------------------------------------------------------------------
function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/^Bearer\s+([A-Za-z0-9]{64})$/', trim($header), $m) === 1) {
        return $m[1];
    }
    return null;
}

function create_session(int $userId): array
{
    $token = bin2hex(random_bytes(32));
    $csrf = bin2hex(random_bytes(32));
    $expires = gmdate('Y-m-d H:i:s', time() + SESSION_TTL_DAYS * 86400);

    db()->prepare(
        'INSERT INTO auth_sessions (user_id, token_hash, csrf_hash, ip_hash, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([
        $userId,
        hash('sha256', $token),
        hash('sha256', $csrf),
        client_ip_hash(),
        mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
        $expires,
    ]);

    db()->prepare('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$userId]);

    return ['token' => $token, 'csrf' => $csrf, 'expires_at' => $expires];
}

function current_user(): ?array
{
    $token = bearer_token();
    if ($token === null) {
        return null;
    }
    $stmt = db()->prepare(
        'SELECT u.id, u.public_id, u.role, u.name, u.email, u.avatar_url, s.expires_at
         FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?
           AND s.revoked_at IS NULL
           AND s.expires_at >= UTC_TIMESTAMP()
           AND u.is_active = 1
         LIMIT 1'
    );
    $stmt->execute([hash('sha256', $token)]);
    $user = $stmt->fetch();
    if ($user === false) {
        return null;
    }
    db()->prepare('UPDATE auth_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE token_hash = ?')
        ->execute([hash('sha256', $token)]);
    return $user;
}

function require_auth(): array
{
    $user = current_user();
    if ($user === null) {
        abort(401, 'Sesi tidak valid atau telah berakhir. Silakan masuk kembali.');
    }
    return $user;
}

function require_super_admin(): array
{
    $user = require_auth();
    if ($user['role'] !== 'super_admin') {
        abort(403, 'Aksi ini hanya untuk Super Admin.');
    }
    return $user;
}

function public_user(array $user): array
{
    return [
        'id'         => $user['public_id'],
        'name'       => $user['name'],
        'email'      => $user['email'],
        'role'       => $user['role'],
        'avatar_url' => $user['avatar_url'],
    ];
}

function audit(?int $actorId, ?int $eventId, string $action, string $entityType, ?string $entityId, array $meta = []): void
{
    db()->prepare(
        'INSERT INTO audit_logs (actor_user_id, event_id, action, entity_type, entity_id, metadata, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $actorId,
        $eventId,
        $action,
        $entityType,
        $entityId,
        $meta === [] ? null : json_encode($meta, JSON_UNESCAPED_UNICODE),
        client_ip_hash(),
    ]);
}

// ---------------------------------------------------------------------------
// Helper acara
// ---------------------------------------------------------------------------
function find_event_by_public_id(string $publicId): array
{
    $stmt = db()->prepare('SELECT * FROM events WHERE public_id = ? AND deleted_at IS NULL LIMIT 1');
    $stmt->execute([$publicId]);
    $event = $stmt->fetch();
    if ($event === false) {
        abort(404, 'Acara tidak ditemukan.');
    }
    return $event;
}

/** Customer hanya boleh menyentuh acara miliknya; super_admin bebas. */
function require_event_access(array $user, string $publicId): array
{
    $event = find_event_by_public_id($publicId);
    if ($user['role'] !== 'super_admin' && (int) $event['owner_id'] !== (int) $user['id']) {
        abort(403, 'Anda tidak memiliki akses ke acara ini.');
    }
    return $event;
}

function unique_slug(string $base): string
{
    $slug = slugify($base);
    if ($slug === '') {
        $slug = 'undangan';
    }
    $candidate = $slug;
    $stmt = db()->prepare('SELECT COUNT(*) FROM events WHERE slug = ?');
    for ($i = 0; $i < 50; $i++) {
        $stmt->execute([$candidate]);
        if ((int) $stmt->fetchColumn() === 0) {
            return $candidate;
        }
        $candidate = $slug . '-' . substr(bin2hex(random_bytes(3)), 0, 4);
    }
    return $slug . '-' . substr(bin2hex(random_bytes(6)), 0, 8);
}

function default_tab_content(string $tabKey, array $event): array
{
    return match ($tabKey) {
        'info_cover' => [
            'event_name'    => $event['title'],
            'custom_slug'   => $event['slug'],
            'rsvp_whatsapp' => '',
            'cover_photo'   => null,
            'music_enabled' => true,
            'music_source'  => ['type' => 'synth', 'value' => 'canon-in-d'],
        ],
        'couple_profiles' => [
            'groom' => ['full_name' => $event['groom_name'], 'nickname' => '', 'parents' => '', 'photo' => null, 'instagram' => ''],
            'bride' => ['full_name' => $event['bride_name'], 'nickname' => '', 'parents' => '', 'photo' => null, 'instagram' => ''],
        ],
        'schedule_map' => [
            'akad'     => ['date' => null, 'time_start' => '', 'time_end' => '', 'address' => '', 'maps_url' => '', 'locked' => false],
            'resepsi'  => ['date' => null, 'time_start' => '', 'time_end' => '', 'address' => '', 'maps_url' => '', 'locked' => false],
            'timezone' => $event['timezone'],
        ],
        'gallery'       => ['items' => []],
        'love_story'    => ['chapters' => []],
        'digital_gifts' => ['accounts' => [], 'address_gift' => ''],
        'settings_prayers' => [
            'sections' => [
                'cover' => true, 'music' => true, 'prayer' => true, 'profiles' => true,
                'schedule' => true, 'story' => true, 'gallery' => true, 'gifts' => true, 'rsvp' => true,
            ],
            'gallery_layout' => 'grid',
            'opening_text'   => 'Dengan memohon rahmat dan ridha Tuhan Yang Maha Esa, kami bermaksud menyelenggarakan pernikahan kami.',
            'prayer_quote'   => '',
            'closing_text'   => 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.',
        ],
        default => [],
    };
}

function seed_default_tabs(int $eventId, array $event, int $userId): void
{
    $stmt = db()->prepare(
        'INSERT INTO event_editor_tabs (event_id, tab_key, schema_version, content, revision, updated_by)
         VALUES (?, ?, 1, ?, 1, ?)'
    );
    foreach (EDITOR_TAB_KEYS as $tabKey) {
        $stmt->execute([
            $eventId,
            $tabKey,
            json_encode(default_tab_content($tabKey, $event), JSON_UNESCAPED_UNICODE),
            $userId,
        ]);
    }
}

function fetch_tabs(int $eventId): array
{
    $stmt = db()->prepare(
        'SELECT tab_key, schema_version, content, revision, updated_at
         FROM event_editor_tabs WHERE event_id = ?'
    );
    $stmt->execute([$eventId]);
    $tabs = [];
    foreach ($stmt->fetchAll() as $row) {
        $tabs[$row['tab_key']] = [
            'schema_version' => (int) $row['schema_version'],
            'revision'       => (int) $row['revision'],
            'updated_at'     => $row['updated_at'],
            'content'        => json_decode($row['content'], true) ?? [],
        ];
    }
    return $tabs;
}

function fetch_media(int $eventId): array
{
    $stmt = db()->prepare(
        'SELECT public_id, media_kind, relative_path, mime_type, byte_size, width, height, sort_order, created_at
         FROM media_files WHERE event_id = ? ORDER BY media_kind, sort_order, id'
    );
    $stmt->execute([$eventId]);
    $grouped = ['cover' => [], 'groom' => [], 'bride' => [], 'gallery' => [], 'music' => []];
    foreach ($stmt->fetchAll() as $row) {
        $grouped[$row['media_kind']][] = [
            'id'         => $row['public_id'],
            'url'        => UPLOADS_URL . '/' . $row['relative_path'],
            'mime_type'  => $row['mime_type'],
            'byte_size'  => (int) $row['byte_size'],
            'width'      => $row['width'] !== null ? (int) $row['width'] : null,
            'height'     => $row['height'] !== null ? (int) $row['height'] : null,
            'sort_order' => (int) $row['sort_order'],
            'created_at' => $row['created_at'],
        ];
    }
    return $grouped;
}

function event_summary(array $event): array
{
    return [
        'id'           => $event['public_id'],
        'slug'         => $event['slug'],
        'title'        => $event['title'],
        'groom_name'   => $event['groom_name'],
        'bride_name'   => $event['bride_name'],
        'event_type'   => $event['event_type'],
        'religion'     => $event['religion'],
        'starts_at'    => $event['starts_at'],
        'timezone'     => $event['timezone'],
        'status'       => $event['status'],
        'published_at' => $event['published_at'],
        'created_at'   => $event['created_at'],
        'updated_at'   => $event['updated_at'],
    ];
}

// ---------------------------------------------------------------------------
// MODUL 1 — AUTENTIKASI
// ---------------------------------------------------------------------------
function handle_register(): never
{
    rate_limit('auth.register', 8, 600);
    $body = read_json_body();

    $name     = str_field($body, 'name', 120);
    $email    = strtolower(str_field($body, 'email', 190));
    $password = (string) ($body['password'] ?? '');

    if ($name === '' || mb_strlen($name) < 2) {
        abort(422, 'Nama minimal 2 karakter.');
    }
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        abort(422, 'Format email tidak valid.');
    }
    if (strlen($password) < 8) {
        abort(422, 'Kata sandi minimal 8 karakter.');
    }

    $stmt = db()->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ((int) $stmt->fetchColumn() > 0) {
        abort(409, 'Email sudah terdaftar. Silakan masuk.');
    }

    $publicId = uuid4();
    db()->prepare(
        'INSERT INTO users (public_id, role, name, email, password_hash)
         VALUES (?, "customer", ?, ?, ?)'
    )->execute([$publicId, $name, $email, password_hash($password, PASSWORD_DEFAULT)]);

    $userId = (int) db()->lastInsertId();
    $session = create_session($userId);
    audit($userId, null, 'auth.register', 'user', $publicId);

    json_response([
        'ok'      => true,
        'user'    => ['id' => $publicId, 'name' => $name, 'email' => $email, 'role' => 'customer', 'avatar_url' => null],
        'session' => $session,
    ], 201);
}

function handle_login(): never
{
    rate_limit('auth.login', 10, 300);
    $body = read_json_body();

    $email    = strtolower(str_field($body, 'email', 190));
    $password = (string) ($body['password'] ?? '');

    if ($email === '' || $password === '') {
        abort(422, 'Email dan kata sandi wajib diisi.');
    }

    $stmt = db()->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user === false || $user['password_hash'] === null || !password_verify($password, $user['password_hash'])) {
        abort(401, 'Email atau kata sandi salah.');
    }

    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }

    $session = create_session((int) $user['id']);
    audit((int) $user['id'], null, 'auth.login', 'user', $user['public_id']);

    json_response(['ok' => true, 'user' => public_user($user), 'session' => $session]);
}

/**
 * Google Auth Simulator — menerima profil hasil modal simulasi di frontend,
 * menautkan ke akun yang sudah ada (berdasarkan email) atau membuat akun baru.
 */
function handle_google_auth(): never
{
    rate_limit('auth.google', 10, 300);
    $body = read_json_body();

    $googleId  = str_field($body, 'google_id', 191);
    $email     = strtolower(str_field($body, 'email', 190));
    $name      = str_field($body, 'name', 120, 'Pengguna Google');
    $avatarUrl = str_field($body, 'avatar_url', 500);

    if ($googleId === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        abort(422, 'Profil Google tidak lengkap.');
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'SELECT u.* FROM oauth_accounts o JOIN users u ON u.id = o.user_id
             WHERE o.provider = "google" AND o.provider_user_id = ? AND u.is_active = 1 LIMIT 1'
        );
        $stmt->execute([$googleId]);
        $user = $stmt->fetch();

        if ($user === false) {
            $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1');
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user === false) {
                $publicId = uuid4();
                $pdo->prepare(
                    'INSERT INTO users (public_id, role, name, email, password_hash, avatar_url, email_verified_at)
                     VALUES (?, "customer", ?, ?, NULL, ?, UTC_TIMESTAMP())'
                )->execute([$publicId, $name, $email, $avatarUrl !== '' ? $avatarUrl : null]);

                $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
                $stmt->execute([(int) $pdo->lastInsertId()]);
                $user = $stmt->fetch();
            }

            $pdo->prepare(
                'INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_email, profile_json)
                 VALUES (?, "google", ?, ?, ?)
                 ON DUPLICATE KEY UPDATE provider_email = VALUES(provider_email), profile_json = VALUES(profile_json)'
            )->execute([
                $user['id'],
                $googleId,
                $email,
                json_encode(['name' => $name, 'avatar_url' => $avatarUrl], JSON_UNESCAPED_UNICODE),
            ]);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $session = create_session((int) $user['id']);
    audit((int) $user['id'], null, 'auth.google', 'user', $user['public_id']);

    json_response(['ok' => true, 'user' => public_user($user), 'session' => $session]);
}

function handle_session_check(): never
{
    $user = require_auth();
    json_response([
        'ok'             => true,
        'user'           => public_user($user),
        'is_super_admin' => $user['role'] === 'super_admin',
        'expires_at'     => $user['expires_at'],
    ]);
}

function handle_logout(): never
{
    $token = bearer_token();
    if ($token !== null) {
        db()->prepare('UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP() WHERE token_hash = ? AND revoked_at IS NULL')
            ->execute([hash('sha256', $token)]);
    }
    json_response(['ok' => true]);
}

// ---------------------------------------------------------------------------
// MODUL 2 — CRUD ACARA
// ---------------------------------------------------------------------------
function handle_events_list(): never
{
    $user = require_auth();

    if ($user['role'] === 'super_admin') {
        $stmt = db()->prepare(
            'SELECT e.*, u.name AS owner_name,
                    (SELECT relative_path FROM media_files m WHERE m.event_id = e.id AND m.media_kind = "cover" ORDER BY m.id DESC LIMIT 1) AS cover_path,
                    (SELECT COUNT(*) FROM rsvp_guestbook r WHERE r.event_id = e.id) AS rsvp_count
             FROM events e JOIN users u ON u.id = e.owner_id
             WHERE e.deleted_at IS NULL
             ORDER BY e.created_at DESC'
        );
        $stmt->execute();
    } else {
        $stmt = db()->prepare(
            'SELECT e.*, NULL AS owner_name,
                    (SELECT relative_path FROM media_files m WHERE m.event_id = e.id AND m.media_kind = "cover" ORDER BY m.id DESC LIMIT 1) AS cover_path,
                    (SELECT COUNT(*) FROM rsvp_guestbook r WHERE r.event_id = e.id) AS rsvp_count
             FROM events e
             WHERE e.owner_id = ? AND e.deleted_at IS NULL
             ORDER BY e.created_at DESC'
        );
        $stmt->execute([$user['id']]);
    }

    $events = array_map(static function (array $event): array {
        $summary = event_summary($event);
        $summary['cover_url']  = $event['cover_path'] !== null ? UPLOADS_URL . '/' . $event['cover_path'] : null;
        $summary['rsvp_count'] = (int) $event['rsvp_count'];
        $summary['owner_name'] = $event['owner_name'];
        return $summary;
    }, $stmt->fetchAll());

    json_response(['ok' => true, 'events' => $events]);
}

function handle_event_create(): never
{
    $user = require_auth();
    rate_limit('events.create', 20, 3600);
    $body = read_json_body();

    $groom     = str_field($body, 'groom_name', 120);
    $bride     = str_field($body, 'bride_name', 120);
    $eventType = str_field($body, 'event_type', 80, 'Pernikahan');
    $religion  = str_field($body, 'religion', 80);
    $startsAt  = str_field($body, 'starts_at', 32);

    if ($groom === '' || $bride === '') {
        abort(422, 'Nama mempelai pria dan wanita wajib diisi.');
    }
    $timestamp = strtotime($startsAt);
    if ($startsAt === '' || $timestamp === false) {
        abort(422, 'Tanggal acara tidak valid.');
    }

    $title    = sprintf('The Wedding of %s & %s', $groom, $bride);
    $slug     = unique_slug($groom . '-' . $bride);
    $publicId = uuid4();

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO events (public_id, owner_id, slug, title, groom_name, bride_name, event_type, religion, starts_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $publicId,
            $user['id'],
            $slug,
            $title,
            $groom,
            $bride,
            $eventType !== '' ? $eventType : 'Pernikahan',
            $religion !== '' ? $religion : null,
            gmdate('Y-m-d H:i:s', $timestamp),
        ]);

        $eventId = (int) $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        seed_default_tabs($eventId, $event, (int) $user['id']);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    audit((int) $user['id'], $eventId, 'event.create', 'event', $publicId);
    json_response(['ok' => true, 'event' => event_summary($event)], 201);
}

function handle_event_detail(string $publicId): never
{
    $user  = require_auth();
    $event = require_event_access($user, $publicId);

    json_response([
        'ok'    => true,
        'event' => event_summary($event),
        'tabs'  => fetch_tabs((int) $event['id']),
        'media' => fetch_media((int) $event['id']),
    ]);
}

function handle_event_update(string $publicId): never
{
    $user  = require_auth();
    $event = require_event_access($user, $publicId);
    $body  = read_json_body();

    $fields = [];
    $params = [];

    if (array_key_exists('title', $body)) {
        $title = str_field($body, 'title', 180);
        if ($title === '') {
            abort(422, 'Judul acara tidak boleh kosong.');
        }
        $fields[] = 'title = ?';
        $params[] = $title;
    }
    if (array_key_exists('slug', $body)) {
        $slug = slugify(str_field($body, 'slug', 120));
        if ($slug === '' || strlen($slug) < 3) {
            abort(422, 'Slug minimal 3 karakter (huruf kecil, angka, tanda minus).');
        }
        $stmt = db()->prepare('SELECT COUNT(*) FROM events WHERE slug = ? AND id <> ?');
        $stmt->execute([$slug, $event['id']]);
        if ((int) $stmt->fetchColumn() > 0) {
            abort(409, 'Slug sudah dipakai acara lain.');
        }
        $fields[] = 'slug = ?';
        $params[] = $slug;
    }
    if (array_key_exists('starts_at', $body)) {
        $timestamp = strtotime(str_field($body, 'starts_at', 32));
        if ($timestamp === false) {
            abort(422, 'Tanggal acara tidak valid.');
        }
        $fields[] = 'starts_at = ?';
        $params[] = gmdate('Y-m-d H:i:s', $timestamp);
    }
    foreach (['groom_name' => 120, 'bride_name' => 120, 'event_type' => 80, 'religion' => 80, 'timezone' => 64] as $column => $max) {
        if (array_key_exists($column, $body)) {
            $fields[] = $column . ' = ?';
            $params[] = str_field($body, $column, $max);
        }
    }

    if ($fields === []) {
        abort(422, 'Tidak ada perubahan yang dikirim.');
    }

    $params[] = $event['id'];
    db()->prepare('UPDATE events SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $stmt = db()->prepare('SELECT * FROM events WHERE id = ?');
    $stmt->execute([$event['id']]);
    audit((int) $user['id'], (int) $event['id'], 'event.update', 'event', $publicId, ['fields' => count($fields)]);

    json_response(['ok' => true, 'event' => event_summary($stmt->fetch())]);
}

function handle_tab_update(string $publicId, string $tabKey): never
{
    $user  = require_auth();
    $event = require_event_access($user, $publicId);

    if (!in_array($tabKey, EDITOR_TAB_KEYS, true)) {
        abort(422, 'Tab editor tidak dikenal: ' . $tabKey);
    }

    $body    = read_json_body();
    $content = $body['content'] ?? null;
    if (!is_array($content)) {
        abort(422, 'Field "content" wajib berupa objek JSON.');
    }
    $encoded = json_encode($content, JSON_UNESCAPED_UNICODE);
    if ($encoded === false || strlen($encoded) > 262144) {
        abort(422, 'Konten tab melebihi batas 256 KB.');
    }

    db()->prepare(
        'INSERT INTO event_editor_tabs (event_id, tab_key, schema_version, content, revision, updated_by)
         VALUES (?, ?, 1, ?, 1, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content), revision = revision + 1, updated_by = VALUES(updated_by)'
    )->execute([$event['id'], $tabKey, $encoded, $user['id']]);

    $stmt = db()->prepare('SELECT revision, updated_at FROM event_editor_tabs WHERE event_id = ? AND tab_key = ?');
    $stmt->execute([$event['id'], $tabKey]);
    $row = $stmt->fetch();

    audit((int) $user['id'], (int) $event['id'], 'tab.update', 'event_editor_tab', $tabKey);
    json_response(['ok' => true, 'tab_key' => $tabKey, 'revision' => (int) $row['revision'], 'updated_at' => $row['updated_at']]);
}

function handle_publish_toggle(string $publicId): never
{
    $user  = require_auth();
    $event = require_event_access($user, $publicId);

    $newStatus = $event['status'] === 'published' ? 'draft' : 'published';
    db()->prepare(
        'UPDATE events SET status = ?, published_at = CASE WHEN ? = "published" THEN UTC_TIMESTAMP() ELSE published_at END WHERE id = ?'
    )->execute([$newStatus, $newStatus, $event['id']]);

    audit((int) $user['id'], (int) $event['id'], 'event.' . $newStatus, 'event', $publicId);
    json_response([
        'ok'         => true,
        'status'     => $newStatus,
        'public_url' => $newStatus === 'published' ? '/' . $event['slug'] : null,
    ]);
}

// ---------------------------------------------------------------------------
// MODUL 3 — DELETE PERMANEN (KHUSUS SUPER ADMIN): MySQL + berkas fisik /uploads
// ---------------------------------------------------------------------------
function handle_event_delete(string $publicId): never
{
    $admin = require_super_admin();
    $event = find_event_by_public_id($publicId);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        // 1. Kumpulkan seluruh path berkas fisik SEBELUM baris dihapus.
        $stmt = $pdo->prepare('SELECT relative_path FROM media_files WHERE event_id = ?');
        $stmt->execute([$event['id']]);
        $paths = array_column($stmt->fetchAll(), 'relative_path');

        // 2. Lepaskan FK cover lalu hapus event — tabs, media, guests, dan RSVP
        //    ikut terhapus otomatis lewat ON DELETE CASCADE.
        $pdo->prepare('UPDATE events SET cover_media_id = NULL WHERE id = ?')->execute([$event['id']]);
        $pdo->prepare('DELETE FROM events WHERE id = ?')->execute([$event['id']]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    // 3. Setelah commit sukses, hapus berkas fisik satu per satu (aman traversal).
    $deletedFiles = 0;
    foreach ($paths as $relativePath) {
        delete_upload_file($relativePath);
        $deletedFiles++;
    }

    audit((int) $admin['id'], null, 'event.delete', 'event', $publicId, [
        'slug'          => $event['slug'],
        'deleted_files' => $deletedFiles,
    ]);

    json_response(['ok' => true, 'deleted_event' => $publicId, 'deleted_files' => $deletedFiles]);
}

// ---------------------------------------------------------------------------
// MODUL 4 — UPLOAD MEDIA FISIK (blob hasil kompresi Canvas klien)
// ---------------------------------------------------------------------------
function handle_media_upload(): never
{
    $user = require_auth();
    rate_limit('media.upload', 60, 600);

    $eventPublicId = str_field($_POST, 'event_id', 36);
    $kind          = str_field($_POST, 'kind', 20);

    if (!isset(UPLOAD_DIRS[$kind])) {
        abort(422, 'Jenis media tidak dikenal. Pilihan: cover, groom, bride, gallery, music.');
    }
    $event = require_event_access($user, $eventPublicId);

    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
        abort(422, 'Tidak ada berkas yang dikirim (field "file").');
    }
    $file = $_FILES['file'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        abort(422, 'Unggahan gagal (kode error PHP: ' . (int) $file['error'] . ').');
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        abort(400, 'Berkas tidak berasal dari unggahan HTTP yang sah.');
    }

    $byteSize = (int) $file['size'];
    if ($byteSize <= 0 || $byteSize > UPLOAD_MAX_BYTES[$kind]) {
        abort(413, sprintf('Ukuran berkas melebihi batas %d KB.', intdiv(UPLOAD_MAX_BYTES[$kind], 1024)));
    }

    // Validasi MIME NYATA dari isi berkas — bukan dari ekstensi/klaim klien.
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $realMime = $finfo !== false ? (finfo_file($finfo, $file['tmp_name']) ?: '') : '';
    if ($finfo !== false) {
        finfo_close($finfo);
    }
    if (!isset(UPLOAD_MIMES[$kind][$realMime])) {
        abort(415, 'Tipe berkas tidak diizinkan untuk ' . $kind . ' (terdeteksi: ' . $realMime . ').');
    }
    $extension = UPLOAD_MIMES[$kind][$realMime];

    // Dimensi untuk gambar (null untuk audio).
    $width = null;
    $height = null;
    if (str_starts_with($realMime, 'image/')) {
        $dimensions = @getimagesize($file['tmp_name']);
        if ($dimensions === false) {
            abort(415, 'Berkas gambar rusak atau tidak dapat dibaca.');
        }
        $width  = (int) $dimensions[0];
        $height = (int) $dimensions[1];
    }

    $eventId = (int) $event['id'];
    $subdir  = UPLOAD_DIRS[$kind];
    $pdo     = db();

    // Penamaan sesuai spesifikasi arsitektur direktori server.
    switch ($kind) {
        case 'cover':
            $filename = sprintf('sampul_%s_%s.%s', gmdate('Ymd'), bin2hex(random_bytes(4)), $extension);
            break;
        case 'groom':
            $filename = sprintf('pria_%d.%s', $eventId, $extension);
            break;
        case 'bride':
            $filename = sprintf('wanita_%d.%s', $eventId, $extension);
            break;
        case 'gallery':
            $stmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM media_files WHERE event_id = ? AND media_kind = "gallery"');
            $stmt->execute([$eventId]);
            $index    = (int) $stmt->fetchColumn();
            $filename = sprintf('galeri_%d_%d.%s', $eventId, $index, $extension);
            break;
        case 'music':
        default:
            $filename = sprintf('musik_%d.%s', $eventId, $extension);
            break;
    }

    $relativePath = $subdir . '/' . $filename;
    $targetDir    = UPLOADS_PATH . '/' . $subdir;
    $targetPath   = $targetDir . '/' . $filename;

    if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
        abort(500, 'Direktori upload tidak dapat disiapkan.');
    }
    if (!is_inside_uploads($targetPath)) {
        abort(400, 'Path tujuan tidak valid.');
    }

    // Media pengganti (cover/pria/wanita/musik): hapus berkas & baris lama dulu.
    $sortOrder = 0;
    if (in_array($kind, ['cover', 'groom', 'bride', 'music'], true)) {
        $stmt = $pdo->prepare('SELECT id, relative_path FROM media_files WHERE event_id = ? AND media_kind = ?');
        $stmt->execute([$eventId, $kind]);
        foreach ($stmt->fetchAll() as $old) {
            if ($kind === 'cover') {
                $pdo->prepare('UPDATE events SET cover_media_id = NULL WHERE id = ? AND cover_media_id = ?')
                    ->execute([$eventId, $old['id']]);
            }
            $pdo->prepare('DELETE FROM media_files WHERE id = ?')->execute([$old['id']]);
            delete_upload_file($old['relative_path']);
        }
    } else {
        $sortOrder = isset($index) ? $index : 0;
    }

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        abort(500, 'Berkas gagal disimpan di server.');
    }
    @chmod($targetPath, 0644);

    $mediaPublicId = uuid4();
    $pdo->prepare(
        'INSERT INTO media_files (public_id, event_id, uploaded_by, media_kind, relative_path, original_name, mime_type, byte_size, width, height, sort_order, sha256)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $mediaPublicId,
        $eventId,
        $user['id'],
        $kind,
        $relativePath,
        mb_substr((string) ($file['name'] ?? ''), 0, 255),
        $realMime,
        $byteSize,
        $width,
        $height,
        $sortOrder,
        hash_file('sha256', $targetPath),
    ]);
    $mediaId = (int) $pdo->lastInsertId();

    if ($kind === 'cover') {
        $pdo->prepare('UPDATE events SET cover_media_id = ? WHERE id = ?')->execute([$mediaId, $eventId]);
    }

    audit((int) $user['id'], $eventId, 'media.upload', 'media_file', $mediaPublicId, [
        'kind' => $kind, 'bytes' => $byteSize, 'mime' => $realMime,
    ]);

    json_response([
        'ok'    => true,
        'media' => [
            'id'         => $mediaPublicId,
            'kind'       => $kind,
            'url'        => UPLOADS_URL . '/' . $relativePath,
            'mime_type'  => $realMime,
            'byte_size'  => $byteSize,
            'width'      => $width,
            'height'     => $height,
            'sort_order' => $sortOrder,
        ],
    ], 201);
}

function handle_media_delete(string $mediaPublicId): never
{
    $user = require_auth();

    $stmt = db()->prepare(
        'SELECT m.*, e.public_id AS event_public_id, e.owner_id
         FROM media_files m JOIN events e ON e.id = m.event_id
         WHERE m.public_id = ? LIMIT 1'
    );
    $stmt->execute([$mediaPublicId]);
    $media = $stmt->fetch();
    if ($media === false) {
        abort(404, 'Media tidak ditemukan.');
    }
    if ($user['role'] !== 'super_admin' && (int) $media['owner_id'] !== (int) $user['id']) {
        abort(403, 'Anda tidak memiliki akses ke media ini.');
    }

    if ($media['media_kind'] === 'cover') {
        db()->prepare('UPDATE events SET cover_media_id = NULL WHERE id = ? AND cover_media_id = ?')
            ->execute([$media['event_id'], $media['id']]);
    }
    db()->prepare('DELETE FROM media_files WHERE id = ?')->execute([$media['id']]);
    delete_upload_file($media['relative_path']);

    audit((int) $user['id'], (int) $media['event_id'], 'media.delete', 'media_file', $mediaPublicId);
    json_response(['ok' => true, 'deleted_media' => $mediaPublicId]);
}

// ---------------------------------------------------------------------------
// MODUL 5 — UNDANGAN PUBLIK & RSVP / BUKU TAMU
// ---------------------------------------------------------------------------
function find_published_event_by_slug(string $slug): array
{
    $normalized = slugify($slug);
    if ($normalized === '') {
        abort(404, 'Undangan tidak ditemukan.');
    }
    $stmt = db()->prepare(
        'SELECT * FROM events WHERE slug = ? AND status = "published" AND deleted_at IS NULL LIMIT 1'
    );
    $stmt->execute([$normalized]);
    $event = $stmt->fetch();
    if ($event === false) {
        abort(404, 'Undangan tidak ditemukan atau belum dipublikasikan.');
    }
    return $event;
}

function handle_public_invitation(string $slug): never
{
    rate_limit('public.invitation', 120, 60);
    $event = find_published_event_by_slug($slug);

    json_response([
        'ok'    => true,
        'event' => [
            'slug'       => $event['slug'],
            'title'      => $event['title'],
            'groom_name' => $event['groom_name'],
            'bride_name' => $event['bride_name'],
            'event_type' => $event['event_type'],
            'religion'   => $event['religion'],
            'starts_at'  => $event['starts_at'],
            'timezone'   => $event['timezone'],
        ],
        'tabs'  => fetch_tabs((int) $event['id']),
        'media' => fetch_media((int) $event['id']),
    ]);
}

function handle_rsvp_create(): never
{
    rate_limit('rsvp.create', 5, 60);
    $body = read_json_body();

    $slug       = str_field($body, 'slug', 120);
    $guestName  = str_field($body, 'guest_name', 160);
    $phone      = str_field($body, 'phone', 32);
    $attendance = str_field($body, 'attendance', 20);
    $count      = int_field($body, 'attendee_count', 0, 20, 1);
    $message    = str_field($body, 'message', 1000);

    $event = find_published_event_by_slug($slug);

    if (mb_strlen($guestName) < 2) {
        abort(422, 'Nama tamu minimal 2 karakter.');
    }
    if (!in_array($attendance, ['attending', 'not_attending', 'maybe'], true)) {
        abort(422, 'Status kehadiran tidak valid.');
    }

    $publicId = uuid4();
    db()->prepare(
        'INSERT INTO rsvp_guestbook (public_id, event_id, guest_name, phone, attendance, attendee_count, message, is_approved, ip_hash, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)'
    )->execute([
        $publicId,
        $event['id'],
        $guestName,
        $phone !== '' ? $phone : null,
        $attendance,
        $count,
        $message !== '' ? $message : null,
        client_ip_hash(),
        mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
    ]);

    json_response([
        'ok'    => true,
        'entry' => [
            'id'             => $publicId,
            'guest_name'     => $guestName,
            'attendance'     => $attendance,
            'attendee_count' => $count,
            'message'        => $message !== '' ? $message : null,
            'created_at'     => now_utc(),
        ],
    ], 201);
}

function handle_rsvp_list(string $slug): never
{
    rate_limit('rsvp.list', 120, 60);
    $event = find_published_event_by_slug($slug);
    $limit = int_field($_GET, 'limit', 1, 200, 100);

    $stmt = db()->prepare(
        'SELECT public_id, guest_name, attendance, attendee_count, message, created_at
         FROM rsvp_guestbook
         WHERE event_id = ? AND is_approved = 1
         ORDER BY created_at DESC, id DESC
         LIMIT ' . $limit
    );
    $stmt->execute([$event['id']]);

    $totals = db()->prepare(
        'SELECT
            COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN attendance = "attending" THEN attendee_count ELSE 0 END), 0) AS attending_people
         FROM rsvp_guestbook WHERE event_id = ? AND is_approved = 1'
    );
    $totals->execute([$event['id']]);
    $stats = $totals->fetch();

    json_response([
        'ok'      => true,
        'entries' => array_map(static fn (array $row): array => [
            'id'             => $row['public_id'],
            'guest_name'     => $row['guest_name'],
            'attendance'     => $row['attendance'],
            'attendee_count' => (int) $row['attendee_count'],
            'message'        => $row['message'],
            'created_at'     => $row['created_at'],
        ], $stmt->fetchAll()),
        'stats'   => [
            'total_entries'    => (int) $stats['total'],
            'attending_people' => (int) $stats['attending_people'],
        ],
    ]);
}

// ---------------------------------------------------------------------------
// ROUTER
// ---------------------------------------------------------------------------
function api_segments(): array
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = preg_replace('#^.*?/api(?:\.php)?#', '', $path) ?? '';
    $path = trim($path, '/');
    return $path === '' ? [] : explode('/', $path);
}

function dispatch(string $method, array $seg): never
{
    $a = $seg[0] ?? '';
    $b = $seg[1] ?? '';
    $c = $seg[2] ?? '';
    $d = $seg[3] ?? '';

    // --- Autentikasi -------------------------------------------------------
    if ($a === 'auth') {
        if ($b === 'register' && $method === 'POST') handle_register();
        if ($b === 'login'    && $method === 'POST') handle_login();
        if ($b === 'google'   && $method === 'POST') handle_google_auth();
        if ($b === 'session'  && $method === 'GET')  handle_session_check();
        if ($b === 'logout'   && $method === 'POST') handle_logout();
        abort(404, 'Endpoint auth tidak ditemukan.');
    }

    // --- Acara (dashboard + editor) ----------------------------------------
    if ($a === 'events') {
        if ($b === '') {
            if ($method === 'GET')  handle_events_list();
            if ($method === 'POST') handle_event_create();
            abort(405, 'Metode tidak diizinkan.');
        }
        if ($c === '') {
            if ($method === 'GET')    handle_event_detail($b);
            if ($method === 'PATCH')  handle_event_update($b);
            if ($method === 'DELETE') handle_event_delete($b);
            abort(405, 'Metode tidak diizinkan.');
        }
        if ($c === 'tabs' && $d !== '' && in_array($method, ['PUT', 'POST'], true)) {
            handle_tab_update($b, $d);
        }
        if ($c === 'publish' && $method === 'POST') {
            handle_publish_toggle($b);
        }
        abort(404, 'Endpoint acara tidak ditemukan.');
    }

    // --- Media fisik ---------------------------------------------------------
    if ($a === 'media') {
        if ($b === '' && $method === 'POST')  handle_media_upload();
        if ($b !== '' && $method === 'DELETE') handle_media_delete($b);
        abort(404, 'Endpoint media tidak ditemukan.');
    }

    // --- Publik: undangan + RSVP/buku tamu ----------------------------------
    if ($a === 'public') {
        if ($b === 'invitation' && $c !== '' && $method === 'GET') handle_public_invitation($c);
        if ($b === 'rsvp' && $c === '' && $method === 'POST')      handle_rsvp_create();
        if ($b === 'rsvp' && $c !== '' && $method === 'GET')       handle_rsvp_list($c);
        abort(404, 'Endpoint publik tidak ditemukan.');
    }

    if ($a === 'health' && $method === 'GET') {
        db()->query('SELECT 1');
        json_response(['ok' => true, 'app' => APP_NAME, 'time' => now_utc()]);
    }

    abort(404, 'Endpoint tidak ditemukan.');
}

// ---------------------------------------------------------------------------
// Eksekusi
// ---------------------------------------------------------------------------
try {
    dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', api_segments());
} catch (HttpError $e) {
    json_response(['ok' => false, 'error' => $e->getMessage()], $e->status);
} catch (PDOException $e) {
    error_log('[UNDIGITAL][DB] ' . $e->getMessage());
    json_response(['ok' => false, 'error' => 'Kesalahan database. Coba lagi nanti.'], 500);
} catch (Throwable $e) {
    error_log('[UNDIGITAL] ' . $e->getMessage());
    json_response(['ok' => false, 'error' => 'Terjadi kesalahan server.'], 500);
}
