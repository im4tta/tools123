import momentkh from "@thyrith/momentkh";

const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

export function toKhmerDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => KHMER_DIGITS[Number(digit)]);
}

export function localIsoToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseIsoDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month, day, date };
}

export function formatKhmerSolarDate(value: string) {
  const parts = parseIsoDateParts(value);
  if (!parts) return "";
  return new Intl.DateTimeFormat("km-KH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(parts.date);
}

export function formatKhmerLunarDate(value: string) {
  const parts = parseIsoDateParts(value);
  if (!parts) return "";
  try {
    return momentkh.format(momentkh.fromGregorian(parts.year, parts.month, parts.day, 12, 0, 0));
  } catch {
    return "";
  }
}