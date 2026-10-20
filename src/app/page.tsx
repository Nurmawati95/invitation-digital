import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { wishes } from "@/db/schema";
import {
  UndigitalInvitation,
} from "@/components/undigital/UndigitalInvitation";
import type { WishItem, WishSummary } from "@/components/undigital/RsvpWishes";

export const dynamic = "force-dynamic";

/** Mengambil ucapan & ringkasan RSVP dari PostgreSQL melalui Drizzle. */
async function loadWishes(): Promise<{
  wishes: WishItem[];
  summary: WishSummary;
}> {
  const empty: WishSummary = { total: 0, attending: 0, guests: 0 };
  try {
    const [rows, stats] = await Promise.all([
      db
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
        .limit(250),
      db
        .select({
          total: sql<number>`count(*)::int`,
          attending: sql<number>`count(*) filter (where ${wishes.attendance} = 'hadir')::int`,
          guests: sql<number>`coalesce(sum(${wishes.guestCount}) filter (where ${wishes.attendance} = 'hadir'), 0)::int`,
        })
        .from(wishes),
    ]);

    return {
      wishes: rows.map((row) => ({
        id: row.id,
        name: row.name,
        attendance: row.attendance,
        guestCount: row.guestCount,
        message: row.message,
        createdAt: row.createdAt.toISOString(),
      })),
      summary: {
        total: stats[0]?.total ?? 0,
        attending: stats[0]?.attending ?? 0,
        guests: stats[0]?.guests ?? 0,
      },
    };
  } catch (error) {
    console.error("[page] gagal memuat ucapan:", error);
    return { wishes: [], summary: empty };
  }
}

export default async function HomePage() {
  const { wishes, summary } = await loadWishes();

  return (
    <UndigitalInvitation wishes={wishes} summary={summary} />
  );
}
