<?php
/**
 * UNDIGITAL — config.php
 * Koneksi database, konstanta aplikasi, dan helper inti.
 * File ini TIDAK boleh diakses langsung dari browser (lihat .htaccess).
 */

declare(strict_types=1);

// ---------------------------------------------------------------------------
// 0. Blokir eksekusi langsung lewat HTTP (lapisan kedua setelah .htaccess)
// ---------------------------------------------------------------------------
if (PHP_SAPI !== 'cli' && basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Akses ditolak.']);
    exit;
}

// ---------------------------------------------------------------------------
// 1. Pemuat variabel lingkungan sederhana (.env di root proyek)
// ---------------------------------------------------------------------------
function undigital_load_env(string $path): void
{
    if (!is_readable($path)) {
        return;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\"'");
        if ($key !== '' && getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

undigital_load_env(__DIR__ . '/.env');

function env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    return ($value === false || $value === '') ? $default : $value;
}

// ---------------------------------------------------------------------------
// 2. Konstanta aplikasi
// ---------------------------------------------------------------------------
define('APP_NAME', 'UNDIGITAL');
define('APP_SECRET', env('APP_SECRET', 'ganti-dengan-secret-acak-64-karakter'));
define('SESSION_TTL_DAYS', 30);

define('DB_HOST', env('DB_HOST', '127.0.0.1'));
define('DB_PORT', env('DB_PORT', '3306'));
define('DB_NAME', env('DB_NAME', 'undigital'));
define('DB_USER', env('DB_USER', 'undigital'));
define('DB_PASS', env('DB_PASS', ''));

define('ROOT_PATH', __DIR__);
define('UPLOADS_PATH', __DIR__ . '/uploads');
define('UPLOADS_URL', '/uploads');

/** Whitelist subdirektori upload: kind => subfolder. Di luar peta ini DITOLAK. */
const UPLOAD_DIRS = [
    'cover'   => 'covers',
    'groom'   => 'couples',
    'bride'   => 'couples',
    'gallery' => 'gallery',
    'music'   => 'music',
];

/** Whitelist MIME nyata (hasil finfo_file) per jenis media. */
const UPLOAD_MIMES = [
    'cover'   => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'],
    'groom'   => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'],
    'bride'   => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'],
    'gallery' => ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'],
    'music'   => ['audio/mpeg' => 'mp3'],
];

/** Batas ukuran berkas (byte) per jenis media. */
const UPLOAD_MAX_BYTES = [
    'cover'   => 3 * 1024 * 1024,
    'groom'   => 3 * 1024 * 1024,
    'bride'   => 3 * 1024 * 1024,
    'gallery' => 3 * 1024 * 1024,
    'music'   => 12 * 1024 * 1024,
];

/** Tujuh kunci tab Studio Editor yang sah. */
const EDITOR_TAB_KEYS = [
    'info_cover',
    'couple_profiles',
    'schedule_map',
    'gallery',
    'love_story',
    'digital_gifts',
    'settings_prayers',
];

// ---------------------------------------------------------------------------
// 3. Koneksi PDO MySQL (singleton)
// ---------------------------------------------------------------------------
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+00:00', NAMES utf8mb4",
    ]);
    return $pdo;
}

// ---------------------------------------------------------------------------
// 4. Helper respons, input, dan keamanan
// ---------------------------------------------------------------------------
function send_security_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Cache-Control: no-store, max-age=0');
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function str_field(array $source, string $key, int $maxLength, string $default = ''): string
{
    $value = $source[$key] ?? $default;
    if (!is_scalar($value)) {
        return $default;
    }
    return mb_substr(trim((string) $value), 0, $maxLength);
}

function int_field(array $source, string $key, int $min, int $max, int $default): int
{
    $value = $source[$key] ?? $default;
    if (!is_numeric($value)) {
        return $default;
    }
    return max($min, min($max, (int) $value));
}

function uuid4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function client_ip_hash(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return hash('sha256', $ip . '|' . APP_SECRET);
}

function now_utc(): string
{
    return gmdate('Y-m-d H:i:s');
}

function slugify(string $text): string
{
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
    return trim($text, '-');
}

/**
 * Pastikan path target benar-benar berada DI DALAM /uploads
 * (anti path traversal, dipakai saat menulis maupun menghapus berkas).
 */
function is_inside_uploads(string $absolutePath): bool
{
    $uploadsReal = realpath(UPLOADS_PATH);
    if ($uploadsReal === false) {
        return false;
    }
    $dirReal = realpath(dirname($absolutePath));
    if ($dirReal === false) {
        return false;
    }
    return str_starts_with($dirReal . DIRECTORY_SEPARATOR, $uploadsReal . DIRECTORY_SEPARATOR)
        || $dirReal === $uploadsReal;
}

/** Hapus satu berkas upload berdasarkan relative path yang tersimpan di DB. */
function delete_upload_file(string $relativePath): void
{
    if ($relativePath === '' || str_contains($relativePath, '..')) {
        return;
    }
    $absolute = UPLOADS_PATH . '/' . ltrim($relativePath, '/');
    if (is_file($absolute) && is_inside_uploads($absolute)) {
        @unlink($absolute);
    }
}
