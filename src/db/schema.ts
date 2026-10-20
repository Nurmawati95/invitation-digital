import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/** Konfirmasi kehadiran tamu. */
export const attendanceEnum = pgEnum("attendance_status", ["hadir", "tidak"]);

/**
 * Daftar tamu undangan. Slug dibuat otomatis dari nama agar tautan
 * `?to=` selalu bisa dinormalisasi, dan dipakai untuk melacak jumlah
 * undangan yang dibuka.
 */
export const guests = pgTable(
  "guests",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    /** Token unik untuk tautan personal (opsional). */
    token: varchar("token", { length: 64 }).notNull(),
    /** Jumlah kursi yang dialokasikan untuk tamu ini. */
    quota: integer("quota").notNull().default(2),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("guests_slug_key").on(table.slug),
    uniqueIndex("guests_token_key").on(table.token),
  ],
);

/** Ucapan & konfirmasi kehadiran (RSVP) dari tamu. */
export const wishes = pgTable(
  "wishes",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    attendance: attendanceEnum("attendance").notNull().default("hadir"),
    guestCount: integer("guest_count").notNull().default(1),
    message: text("message").notNull(),
    /** Tamu yang hadir di bawah nama tamu terdaftar (jika ada). */
    guestSlug: varchar("guest_slug", { length: 160 }),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("wishes_created_at_idx").on(table.createdAt.desc()),
    index("wishes_attendance_idx").on(table.attendance),
  ],
);

export type Guest = typeof guests.$inferSelect;
export type Wish = typeof wishes.$inferSelect;
export type Attendance = (typeof attendanceEnum.enumValues)[number];
