// Khmer number-to-words engine, shared by the Number Spell-out tool and the
// Number Reading Quiz. Moved here unchanged from components/tools/khmer/
// number-spellout.tsx so both tools use the same logic.
//
// Two styles: "modern banking" groups by thousands (ពាន់, លាន, ពាន់លាន …) and
// "traditional" uses the older decimal place names (ម៉ឺន 10,000, សែន 100,000).

export const KHMER_DIGITS = ["សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
export const KHMER_NUMERAL_CHARS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
export const TENS_WORDS = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];

export function toKhmerNumerals(str: string) {
  return str.replace(/\d/g, (d) => KHMER_NUMERAL_CHARS[parseInt(d)]);
}

export function convertUnder100(n: number): string {
  if (n < 10) return KHMER_DIGITS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  let res = TENS_WORDS[tens];
  if (ones > 0) res += KHMER_DIGITS[ones];
  return res;
}

export function convertUnder1000(n: number): string {
  if (n < 100) return convertUnder100(n);
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  let res = KHMER_DIGITS[hundreds] + "រយ";
  if (remainder > 0) res += convertUnder100(remainder);
  return res;
}

export function convertModernBanking(intStr: string): string {
  const cleanStr = intStr.replace(/^0+/, "");
  if (!cleanStr) return "សូន្យ";

  const chunks: number[] = [];
  for (let i = cleanStr.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    chunks.push(parseInt(cleanStr.substring(start, i), 10));
  }

  const UNITS = ["", "ពាន់", "លាន", "ពាន់លាន", "ទ្រីលីយន"];
  const parts: string[] = [];

  for (let i = chunks.length - 1; i >= 0; i--) {
    const val = chunks[i];
    if (val > 0) {
      let word = convertUnder1000(val);
      if (UNITS[i]) word += UNITS[i];
      parts.push(word);
    }
  }

  return parts.join(" ") || "សូន្យ";
}

export function convertTraditional(intStr: string): string {
  const num = parseInt(intStr, 10);
  if (isNaN(num) || num === 0) return "សូន្យ";
  let n = num;
  const parts: string[] = [];

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    parts.push(KHMER_DIGITS[millions] + "លាន");
    n %= 1000000;
  }
  if (n >= 100000) {
    const saen = Math.floor(n / 100000);
    parts.push(KHMER_DIGITS[saen] + "សែន");
    n %= 100000;
  }
  if (n >= 10000) {
    const muen = Math.floor(n / 10000);
    parts.push(KHMER_DIGITS[muen] + "ម៉ឺន");
    n %= 10000;
  }
  if (n >= 1000) {
    const poan = Math.floor(n / 1000);
    parts.push(KHMER_DIGITS[poan] + "ពាន់");
    n %= 1000;
  }
  if (n >= 100) {
    const roi = Math.floor(n / 100);
    parts.push(KHMER_DIGITS[roi] + "រយ");
    n %= 100;
  }
  if (n > 0) parts.push(convertUnder100(n));

  return parts.join(" ");
}
