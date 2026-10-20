import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { wishes } from "@/db/schema";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------
   Skema validasi input RSVP / ucapan
   --------------------------------------------------------------------- */
const rsvpSchema = {
  parse(value: unknown): RsvpInput {
    if (typeof value !== "object" || value === null) {
      throw new ValidationError("Payload tidak valid.");
    }
    const body = value as Record<string, unknown>;

    const name = str(body.name, "Nama", 2, 120);
    const attendanceRaw = str(body.attendance, "Konfirmasi kehadiran", 1, 20);
    if (attendanceRaw !== "hadir" && attendanceRaw !== "tidak") {
      throw new ValidationError("Konfirmasi kehadiran tidak dikenali.");
    }
    const message = str(body.message, "Ucapan & doa", 3, 1000);
    const guestCount = clampInt(body.guestCount, 0, 20, 1);
    const guestSlug = body.guestSlug ? str(body.guestSlug, "Slug tamu", 1, 160) : null;

    return { name, attendance: attendanceRaw, guestCount, message, guestSlug };
  },
};

type RsvpInput = {
  name: string;
  attendance: "hadir" | "tidak";
  guestCount: number;
  message: string;
  guestSlug: string | null;
};

class ValidationError extends Error {}

function str(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") throw new ValidationError(`${label} wajib diisi.`);
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < min) throw new ValidationError(`${label} minimal ${min} karakter.`);
  if (trimmed.length > max) throw new ValidationError(`${label} maksimal ${max} karakter.`);
  return trimmed;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/* ---------------------------------------------------------------------
   GET — daftar ucapan + ringkasan statistik
   --------------------------------------------------------------------- */
export async function GET() {
  try {
    const rows = await db
      .select({
        id: wishes.id,
        name: wishes.name,
        attendance: wishes.attendance,
        guestCount: wishes.guestCount,
        message: wishes.message,
        createdAt: wishes.createdAt,
      })
      .from(wishes)
      .orderBy(desc(wishes.createdAt))
      .limit(250);

    const [summary] = await db
      .select({
        total: sql<number>`count(*)::int`,
        attending: sql<number>`count(*) filter (where ${wishes.attendance} = 'hadir')::int`,
        guests: sql<number>`coalesce(sum(${wishes.guestCount}) filter (where ${wishes.attendance} = 'hadir'), 0)::int`,
      })
      .from(wishes);

    return NextResponse.json(
      {
        data: rows,
        summary: {
          total: summary?.total ?? 0,
          attending: summary?.attending ?? 0,
          guests: summary?.guests ?? 0,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/wishes]", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar ucapan." },
      { status: 500 },
    );
  }
}

/* ---------------------------------------------------------------------
   POST — kirim konfirmasi kehadiran & ucapan baru
   --------------------------------------------------------------------- */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  let data: ReturnType<typeof rsvpSchema.parse>;
  try {
    data = rsvpSchema.parse(payload);
  } catch (error) {
    const message =
      error instanceof ValidationError
        ? error.message
        : "Data yang dikirim tidak lengkap.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const [row] = await db
      .insert(wishes)
      .values({
        name: data.name,
        attendance: data.attendance,
        guestCount: data.guestCount,
        message: data.message,
        guestSlug: data.guestSlug,
      })
      .returning({
        id: wishes.id,
        name: wishes.name,
        attendance: wishes.attendance,
        guestCount: wishes.guestCount,
        message: wishes.message,
        createdAt: wishes.createdAt,
      });

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/wishes]", error);
    return NextResponse.json(
      { error: "Maaf, ucapan Anda gagal terkirim. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
