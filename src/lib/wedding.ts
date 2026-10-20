/**
 * UNDIGITAL — Konfigurasi konten undangan.
 *
 * Semua data statis undangan terpusat di sini agar mudah disesuaikan
 * (nama mempelai, jadwal acara, cerita, rekening, dll.) tanpa perlu
 * menyentuh komponen UI.
 */

/** URL dasar untuk resolusi aset Open Graph / metadata. */
export const SITE_URL = "https://undigital.id";

export const BRAND = {
  name: "UNDIGITAL",
  tagline: "Digital Wedding Invitation",
  whatsapp: "https://wa.me/628112345678",
  whatsappLabel: "+62 811-2345-678",
  instagram: "https://instagram.com/undigital.id",
  instagramLabel: "@undigital.id",
  email: "hello@undigital.id",
  logo: "/ico_undigital.jpg",
} as const;

export const COUPLE = {
  groom: {
    role: "The Groom",
    fullName: "Aditya Pratama Nugraha",
    shortName: "Aditya",
    nickname: "Adit",
    order: "Putra ke-2 dari",
    father: "Bpk. Hendra Nugraha",
    mother: "Ibu Sri Mulyani",
    instagram: "https://instagram.com/aditya.pratama",
    instagramLabel: "@aditya.pratama",
    photo: "/images/couple-1.jpg",
  },
  bride: {
    role: "The Bride",
    fullName: "Anindya Rahmawati Kusuma",
    shortName: "Anindya",
    nickname: "Naya",
    order: "Putri ke-1 dari",
    father: "Bpk. Bambang Suryadi Hartono",
    mother: "Ibu Retno Wulandari",
    instagram: "https://instagram.com/anindya.rahma",
    instagramLabel: "@anindya.rahma",
    photo: "/images/couple-2.jpg",
  },
} as const;

/** Tanggal utama acara (dipakai countdown & hero). */
export const EVENT_DATE = {
  /** ISO lokal: 11 April 2027, 09:00 WIB. */
  iso: "2027-04-11T09:00:00+07:00",
  day: "Minggu",
  date: "11",
  month: "April",
  monthShort: "Apr",
  year: "2027",
  timeZone: "WIB",
} as const;

export type Venue = {
  key: "akad" | "resepsi";
  title: string;
  subtitle: string;
  day: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapQuery: string;
  /** Slot waktu untuk Google Calendar (ISO lokal). */
  calendarStart: string;
  calendarEnd: string;
  note: string;
};

export const VENUES: Venue[] = [
  {
    key: "akad",
    title: "Akad Nikah",
    subtitle: "Pemberkatan Ikatan Suci",
    day: "Minggu",
    date: "11 April 2027",
    time: "09.00 – 11.00 WIB",
    venue: "The Emerald Hall — Pendopo Agung",
    address:
      "Jl. Taman Cut Mutiah No. 12, Menteng, Jakarta Pusat 10310, Indonesia",
    mapQuery: "Monumen+Nasional+Jakarta",
    calendarStart: "2027-04-11T09:00:00+07:00",
    calendarEnd: "2027-04-11T11:00:00+07:00",
    note: "Diharapkan hadir 15 menit sebelum acara dimulai.",
  },
  {
    key: "resepsi",
    title: "Resepsi",
    subtitle: "Syukuran & Jamuan Malam",
    day: "Minggu",
    date: "11 April 2027",
    time: "18.00 – 21.00 WIB",
    venue: "The Emerald Hall — Pendopo Agung",
    address:
      "Jl. Taman Cut Mutiah No. 12, Menteng, Jakarta Pusat 10310, Indonesia",
    mapQuery: "Monumen+Nasional+Jakarta",
    calendarStart: "2027-04-11T18:00:00+07:00",
    calendarEnd: "2027-04-11T21:00:00+07:00",
    note: "Resepsi berlangsung informal — silakan datang bersama keluarga.",
  },
];

export const MAP_EMBED_SRC = `https://www.google.com/maps?q=${VENUES[0].mapQuery}&z=16&hl=id&output=embed`;

/** Tautan "Petunjuk Lokasi" (membuka aplikasi Google Maps). */
export const MAP_DIRECTIONS_SRC = `https://www.google.com/maps/dir/?api=1&destination=${VENUES[0].mapQuery}`;

/** Tautan "Simpan ke Google Calendar". */
export function buildGoogleCalendarUrl(venue: Venue): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${venue.title} — ${COUPLE.groom.shortName} & ${COUPLE.bride.shortName}`,
    dates: `${toUtcStamp(venue.calendarStart)}/${toUtcStamp(venue.calendarEnd)}`,
    details: `Dengan bahagia kami mengundang Anda hadir pada acara ${venue.title} pernikahan ${COUPLE.groom.fullName} & ${COUPLE.bride.fullName}.`,
    location: `${venue.venue}, ${venue.address}`,
    ctz: "Asia/Jakarta",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Mengubah ISO lokal menjadi format `YYYYMMDDTHHMMSSZ` milik Google. */
function toUtcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export const QUOTE = {
  source: "QS. Ar-Rum : 21",
  arabic: "وَمِنْ اٰيٰتِهٖ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً",
  translation:
    "“Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.”",
} as const;

export const LOVE_STORY = [
  {
    year: "Feb 2019",
    title: "Pertama Bertemu",
    description:
      "Kami pertama kali bertemu di sebuah kafe kecil di Bandung saat acara kampus. Secara sederhananya percakapan itu berlanjut hingga larut malam.",
  },
  {
    year: "Mar 2019",
    title: "Menjadi Sahabat",
    description:
      "Dari sekadar teman ngobrol, kami jadi paling nyaman berbagi cerita tentang mimpi, keluarga, dan rencana masa depan.",
  },
  {
    year: "Agu 2019",
    title: "Menjatuhkan Hati",
    description:
      "Di bawah hujan gerimis kota Bandung, Adit memberanikan diri menyatakan perasaannya kepada Naya — dan jawabannya ya.",
  },
  {
    year: "Jan 2020",
    title: "Melalui Jarak",
    description:
      "Tiga tahun perjalanan karir memisahkan kami di dua kota. Panggilan setiap malam menjadi janji yang kami jaga.",
  },
  {
    year: "Des 2024",
    title: "Lamaran",
    description:
      "Di rumah orang tua Naya di Yogyakarta, keluarga kami resmi bersatu dan memulai rencana menuju pelaminan.",
  },
  {
    year: "Apr 2027",
    title: "Hari Bahagia",
    description:
      "Akhirnya kami memutuskan untuk melangkah bersama. Kehadiran Anda adalah doa terindah untuk hari istimewa kami.",
  },
] as const;

export const GALLERY = [
  { src: "/images/hero.jpg", caption: "Golden Hour", span: "tall" },
  { src: "/images/couple-3.jpg", caption: "Under The Trees", span: "wide" },
  { src: "/images/couple-4.jpg", caption: "Tradisi", span: "normal" },
  { src: "/images/couple-5.jpg", caption: "Together", span: "normal" },
  { src: "/images/couple-6.jpg", caption: "Elegance", span: "normal" },
  { src: "/images/couple-7.jpg", caption: "Forever", span: "tall" },
] as const;

/** Foto yang diputar pada "cinematic video" pre-wedding. */
export const CINEMATIC_FRAMES = [
  "/images/hero.jpg",
  "/images/couple-1.jpg",
  "/images/couple-3.jpg",
  "/images/couple-5.jpg",
  "/images/couple-7.jpg",
  "/images/couple-2.jpg",
] as const;

export const GIFTS = [
  {
    bank: "BCA",
    logo: "/images/bank-bca.svg",
    accountNumber: "8820 1234 5678",
    holder: "Aditya Pratama Nugraha",
    color: "#1B4B9B",
  },
  {
    bank: "Bank Mandiri",
    logo: "/images/bank-mandiri.svg",
    accountNumber: "1230 0098 7654",
    holder: "Anindya Rahmawati Kusuma",
    color: "#0F4C8C",
  },
] as const;

export const GIFT_ADDRESS = {
  recipient: "Anindya Rahmawati Kusuma",
  phone: "+62 812-9988-7766",
  address:
    "Jl. Cendana Asri No. 45, RT 04 / RW 09, Kel. Cempaka Putih, Kec. Cempaka Putih, Jakarta Pusat 10520, DKI Jakarta",
  note: "Kirim hadiah fisik paling lambat 9 April 2027 agar sampai sebelum acara.",
} as const;

export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "couple", label: "Mempelai", icon: "heart" },
  { id: "event", label: "Acara", icon: "calendar" },
  { id: "gallery", label: "Galeri", icon: "images" },
  { id: "rsvp", label: "RSVP", icon: "mail" },
  { id: "gift", label: "Hadiah", icon: "gift" },
] as const;

export const SECTION_IDS = NAV_ITEMS.map((item) => item.id);
