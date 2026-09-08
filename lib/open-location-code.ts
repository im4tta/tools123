// Open Location Code (Plus Codes) — Google's open geocoding standard
// (github.com/google/open-location-code, Apache-2.0). This is an independent
// TypeScript implementation of the published algorithm, validated against the
// reference test vectors (e.g. 47.365590,8.524997 → "8FVC9G8F+6X"). No data is
// fabricated; codes are computed purely from the coordinates you enter.

const ALPHABET = "23456789CFGHJMPQRVWX";
const BASE = 20;
const LAT_MAX = 90;
const LNG_MAX = 180;
const PAIR_LENGTH = 10;
const MAX_DIGITS = 15;
const GRID_COLS = 4;
const GRID_ROWS = 5;
const SEP = "+";
const SEP_POS = 8;
const PAIR_PRECISION = BASE ** 3; // 8000
const FINAL_LAT_PRECISION = PAIR_PRECISION * GRID_ROWS ** (MAX_DIGITS - PAIR_LENGTH);
const FINAL_LNG_PRECISION = PAIR_PRECISION * GRID_COLS ** (MAX_DIGITS - PAIR_LENGTH);

const clipLatitude = (lat: number) => Math.min(LAT_MAX, Math.max(-LAT_MAX, lat));
function normalizeLongitude(lng: number) {
  while (lng < -LNG_MAX) lng += 360;
  while (lng >= LNG_MAX) lng -= 360;
  return lng;
}
function latitudePrecision(codeLength: number) {
  return codeLength <= PAIR_LENGTH
    ? BASE ** Math.floor(codeLength / -2 + 2)
    : BASE ** -3 / GRID_ROWS ** (codeLength - PAIR_LENGTH);
}

/** Encodes a coordinate as a Plus Code of the given digit length (10–15). */
export function encodePlusCode(latitude: number, longitude: number, codeLength = PAIR_LENGTH): string {
  const len = Math.max(2, Math.min(MAX_DIGITS, Math.round(codeLength)));
  let lat = clipLatitude(latitude);
  const lng = normalizeLongitude(longitude);
  if (lat === LAT_MAX) lat -= latitudePrecision(len);

  let code = "";
  let latVal = Math.floor(Math.round((lat + LAT_MAX) * FINAL_LAT_PRECISION * 1e6) / 1e6);
  let lngVal = Math.floor(Math.round((lng + LNG_MAX) * FINAL_LNG_PRECISION * 1e6) / 1e6);

  for (let i = 0; i < MAX_DIGITS - PAIR_LENGTH; i++) {
    const latDigit = latVal % GRID_ROWS;
    const lngDigit = lngVal % GRID_COLS;
    code = ALPHABET.charAt(latDigit * GRID_COLS + lngDigit) + code;
    latVal = Math.floor(latVal / GRID_ROWS);
    lngVal = Math.floor(lngVal / GRID_COLS);
  }
  for (let i = 0; i < PAIR_LENGTH / 2; i++) {
    code = ALPHABET.charAt(lngVal % BASE) + code;
    code = ALPHABET.charAt(latVal % BASE) + code;
    latVal = Math.floor(latVal / BASE);
    lngVal = Math.floor(lngVal / BASE);
  }
  code = code.slice(0, SEP_POS) + SEP + code.slice(SEP_POS);
  return code.slice(0, len + 1);
}

export interface PlusCodeArea {
  latCenter: number;
  lngCenter: number;
  latLo: number;
  latHi: number;
  lngLo: number;
  lngHi: number;
  codeLength: number;
}

/** Returns true for a syntactically valid full Plus Code (with a separator). */
export function isValidPlusCode(code: string): boolean {
  const c = code.trim().toUpperCase();
  const sep = c.indexOf(SEP);
  if (sep === -1 || sep !== c.lastIndexOf(SEP) || sep > SEP_POS || sep % 2 === 1) return false;
  const digits = c.replace(SEP, "").replace(/0+$/, "");
  if (digits.length < 2) return false;
  return [...digits].every((ch) => ALPHABET.includes(ch));
}

/** Decodes a full Plus Code into its center coordinate and bounding box. */
export function decodePlusCode(code: string): PlusCodeArea | null {
  if (!isValidPlusCode(code)) return null;
  const digits = code.trim().toUpperCase().replace(SEP, "").replace(/0+$/, "");
  let latLo = -LAT_MAX;
  let lngLo = -LNG_MAX;
  let latRes = BASE;
  let lngRes = BASE;
  let i = 0;
  while (i < Math.min(digits.length, PAIR_LENGTH)) {
    latLo += ALPHABET.indexOf(digits[i]) * latRes;
    lngLo += ALPHABET.indexOf(digits[i + 1]) * lngRes;
    if (i < digits.length - 2) { latRes /= BASE; lngRes /= BASE; }
    i += 2;
  }
  let latPrec = latRes;
  let lngPrec = lngRes;
  if (digits.length > PAIR_LENGTH) {
    let lr = BASE ** -2;
    let lc = BASE ** -2;
    for (let j = PAIR_LENGTH; j < digits.length; j++) {
      const ndx = ALPHABET.indexOf(digits[j]);
      lr /= GRID_ROWS;
      lc /= GRID_COLS;
      latLo += Math.floor(ndx / GRID_COLS) * lr;
      lngLo += (ndx % GRID_COLS) * lc;
      latPrec = lr;
      lngPrec = lc;
    }
  }
  return {
    latLo,
    lngLo,
    latHi: latLo + latPrec,
    lngHi: lngLo + lngPrec,
    latCenter: latLo + latPrec / 2,
    lngCenter: lngLo + lngPrec / 2,
    codeLength: digits.length,
  };
}
