-- UNDIGITAL MySQL 8 schema
-- Requires MySQL 8.0.16+ for enforced CHECK constraints and JSON defaults.

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS undigital
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE undigital;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  role ENUM('super_admin', 'customer') NOT NULL DEFAULT 'customer',
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  email_verified_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_public_id (public_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB;

CREATE TABLE oauth_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('google') NOT NULL,
  provider_user_id VARCHAR(191) NOT NULL,
  provider_email VARCHAR(190) NULL,
  profile_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oauth_provider_identity (provider, provider_user_id),
  KEY idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  csrf_hash CHAR(64) NOT NULL,
  ip_hash CHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  expires_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token (token_hash),
  KEY idx_sessions_user_expiry (user_id, expires_at),
  KEY idx_sessions_expiry_revoked (expires_at, revoked_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  slug VARCHAR(120) NOT NULL,
  title VARCHAR(180) NOT NULL,
  groom_name VARCHAR(120) NOT NULL,
  bride_name VARCHAR(120) NOT NULL,
  event_type VARCHAR(80) NOT NULL DEFAULT 'Pernikahan',
  religion VARCHAR(80) NULL,
  starts_at DATETIME NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  cover_media_id BIGINT UNSIGNED NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_events_public_id (public_id),
  UNIQUE KEY uq_events_slug (slug),
  KEY idx_events_owner_status (owner_id, status, deleted_at),
  KEY idx_events_public_lookup (slug, status, deleted_at),
  KEY idx_events_date (starts_at),
  CONSTRAINT fk_events_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_events_slug CHECK (slug REGEXP '^[a-z0-9]+(?:-[a-z0-9]+)*$')
) ENGINE=InnoDB;

CREATE TABLE event_editor_tabs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  tab_key ENUM(
    'info_cover',
    'couple_profiles',
    'schedule_map',
    'gallery',
    'love_story',
    'digital_gifts',
    'settings_prayers'
  ) NOT NULL,
  schema_version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  content JSON NOT NULL,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_event_editor_tab (event_id, tab_key),
  KEY idx_editor_updated_by (updated_by),
  KEY idx_editor_event_revision (event_id, revision),
  CONSTRAINT fk_editor_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_editor_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_editor_content_object CHECK (JSON_TYPE(content) = 'OBJECT')
) ENGINE=InnoDB;

CREATE TABLE media_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  event_id BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  media_kind ENUM('cover', 'groom', 'bride', 'gallery', 'music') NOT NULL,
  relative_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NULL,
  mime_type ENUM('image/jpeg', 'image/png', 'image/webp', 'audio/mpeg') NOT NULL,
  byte_size INT UNSIGNED NOT NULL,
  width SMALLINT UNSIGNED NULL,
  height SMALLINT UNSIGNED NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  sha256 CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_public_id (public_id),
  UNIQUE KEY uq_media_path (relative_path),
  KEY idx_media_event_kind_order (event_id, media_kind, sort_order),
  KEY idx_media_uploader (uploaded_by),
  CONSTRAINT fk_media_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_media_size CHECK (byte_size > 0)
) ENGINE=InnoDB;

ALTER TABLE events
  ADD CONSTRAINT fk_events_cover_media
  FOREIGN KEY (cover_media_id) REFERENCES media_files(id) ON DELETE SET NULL;

CREATE TABLE invitation_guests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id BIGINT UNSIGNED NOT NULL,
  guest_token CHAR(32) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NULL,
  party_size SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  source VARCHAR(80) NULL,
  first_opened_at DATETIME NULL,
  last_opened_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guest_token (guest_token),
  KEY idx_guests_event_name (event_id, display_name),
  CONSTRAINT fk_guests_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT chk_guest_party_size CHECK (party_size BETWEEN 1 AND 20)
) ENGINE=InnoDB;

CREATE TABLE rsvp_guestbook (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  event_id BIGINT UNSIGNED NOT NULL,
  guest_id BIGINT UNSIGNED NULL,
  guest_name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NULL,
  attendance ENUM('attending', 'not_attending', 'maybe') NOT NULL,
  attendee_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  message TEXT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 1,
  ip_hash CHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rsvp_public_id (public_id),
  KEY idx_rsvp_event_feed (event_id, is_approved, created_at),
  KEY idx_rsvp_guest (guest_id),
  CONSTRAINT fk_rsvp_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_rsvp_guest FOREIGN KEY (guest_id) REFERENCES invitation_guests(id) ON DELETE SET NULL,
  CONSTRAINT chk_attendee_count CHECK (attendee_count BETWEEN 0 AND 20)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  event_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(64) NULL,
  metadata JSON NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_actor_time (actor_user_id, created_at),
  KEY idx_audit_event_time (event_id, created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Rate limiting without retaining raw IP addresses.
CREATE TABLE rate_limits (
  bucket_key CHAR(64) NOT NULL,
  hits INT UNSIGNED NOT NULL DEFAULT 1,
  window_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (bucket_key),
  KEY idx_rate_limits_expiry (expires_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
