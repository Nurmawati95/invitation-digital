/**
 * Membuat gambar QRIS statis (EMVCo Merchant Presented Mode) untuk
 * bagian Amplop Digital. Dijalankan sekali: node scripts/generate-qris.mjs
 */
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";

// --- TLV (Tag-Length-Value) ---------------------------------------------
const tlv = (id, value) => {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
};

// --- CRC16-CCITT (poly 0x1021, init 0xFFFF) ------------------------------
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const merchant = {
  name: "THE WEDDING OF ADIT & NAYA",
  city: "JAKARTA",
  postal: "10520",
  nmid: "9360012345678901",
};

const merchantAccount = tlv("00", "ID.CO.QRIS.WWW") + tlv("01", merchant.nmid);

let payload =
  tlv("00", "01") +          // Payload Format Indicator
  tlv("01", "12") +          // Point of Initiation: static
  tlv("26", merchantAccount) +
  tlv("52", "5812") +        // Merchant Category Code
  tlv("53", "360") +         // Currency: IDR
  tlv("58", "ID") +          // Country code
  tlv("59", merchant.name) +
  tlv("60", merchant.city) +
  tlv("61", merchant.postal) +
  "6304";                    // CRC placeholder

payload += crc16(payload);

const OUT = "public/images/qris.png";
await QRCode.toFile(OUT, payload, {
  errorCorrectionLevel: "M",
  margin: 2,
  width: 640,
  color: { dark: "#143B27", light: "#FFFFFFFF" },
});
console.log("QRIS written:", OUT);
console.log("Payload:", payload);
