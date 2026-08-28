// Pure networking / transfer math. Formula references:
// - Download time = total bits / link speed (bits per second)
// - Decimal units (kB, MB, GB) = powers of 1000; binary (KiB, MiB, GiB) = powers of 1024
// - IPv6: 128-bit integers; types per RFC 4291, compression per RFC 5952.

export const SIZE_UNITS: Record<string, number> = {
  B: 1, kB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12,
  KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4,
};

export const SPEED_UNITS: Record<string, number> = {
  "bit/s": 1, "kbit/s": 1e3, "Mbit/s": 1e6, "Gbit/s": 1e9,
  "B/s": 8, "kB/s": 8e3, "MB/s": 8e6, "GB/s": 8e9,
};

/** Download time in seconds; null for non-positive sizes or speeds. */
export function downloadSeconds(
  sizeValue: number, sizeUnit: string, speedValue: number, speedUnit: string,
): number | null {
  const sizeFactor = SIZE_UNITS[sizeUnit];
  const speedFactor = SPEED_UNITS[speedUnit];
  if (!sizeFactor || !speedFactor) return null;
  if (!isFinite(sizeValue) || !isFinite(speedValue) || sizeValue <= 0 || speedValue <= 0) return null;
  return (sizeValue * sizeFactor * 8) / (speedValue * speedFactor);
}

/** Effective megabytes (decimal) moved per minute at the given link speed. */
export function megabytesPerMinute(speedValue: number, speedUnit: string): number | null {
  const speedFactor = SPEED_UNITS[speedUnit];
  if (!speedFactor || !isFinite(speedValue) || speedValue <= 0) return null;
  return (speedValue * speedFactor * 60) / 8 / 1e6;
}

function parseIpv4Group(text: string): number | null {
  const parts = text.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = value * 256 + n;
  }
  return value;
}

function parseGroup(group: string): number | null {
  if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
  return parseInt(group, 16);
}

function groupsToBigint(groups: number[]): bigint {
  let value = 0n;
  for (const g of groups) value = (value << 16n) | BigInt(g & 0xffff);
  return value;
}

/** Parses "address" or "address/prefix"; accepts :: compression and an IPv4 tail. Null when malformed. */
export function parseIpv6(input: string): { value: bigint; prefix: number | null } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const [addressPart, prefixPart] = trimmed.split("/");
  if (prefixPart !== undefined && !/^\d{1,3}$/.test(prefixPart)) return null;
  const prefix = prefixPart === undefined ? null : Number(prefixPart);
  if (prefix !== null && (prefix < 0 || prefix > 128)) return null;
  if ((addressPart.match(/::/g) ?? []).length > 1) return null;

  let head = addressPart.includes("%") ? addressPart.slice(0, addressPart.indexOf("%")) : addressPart;

  // IPv4-embedded tail, e.g. ::ffff:192.168.0.1 → two extra 16-bit groups.
  const lastColon = head.lastIndexOf(":");
  if (lastColon >= 0 && head.slice(lastColon + 1).includes(".")) {
    const parsedV4 = parseIpv4Group(head.slice(lastColon + 1));
    if (parsedV4 === null) return null;
    head = head.slice(0, lastColon + 1); // drop the IPv4 tail, keep the leading "::…:"
    return buildGroups(head, parsedV4, prefix);
  }
  return buildGroups(head, null, prefix);
}

function buildGroups(head: string, ipv4Value: number | null, prefix: number | null) {
  const doubleColon = head.includes("::");
  const [left, right = ""] = doubleColon ? head.split("::") : [head, ""];
  const leftGroups = (left ? left.split(":") : []).filter(Boolean);
  const rightGroups = (right ? right.split(":") : []).filter(Boolean);
  const extra = ipv4Value !== null ? 2 : 0;
  const missing = 8 - leftGroups.length - rightGroups.length - extra;
  if (missing < 0 || (!doubleColon && missing !== 0)) return null;
  const groups: (number | null)[] = leftGroups.map(parseGroup);
  for (let i = 0; i < missing; i++) groups.push(0);
  for (const g of rightGroups) groups.push(parseGroup(g));
  if (ipv4Value !== null) {
    groups.push(ipv4Value >> 16);
    groups.push(ipv4Value & 0xffff);
  }
  if (groups.some((g) => g === null)) return null;
  return { value: groupsToBigint(groups as number[]), prefix };
}

/** Full form: eight lower-case zero-padded hex groups. */
export function expandIpv6(value: bigint): string {
  const groups: string[] = [];
  for (let i = 7; i >= 0; i--) {
    groups.push(((value >> BigInt(i * 16)) & 0xffffn).toString(16).padStart(4, "0"));
  }
  return groups.join(":");
}

/** RFC 5952 compressed form: the longest zero run (≥ 2 groups) becomes "::". */
export function formatIpv6(value: bigint): string {
  const groups: number[] = [];
  for (let i = 7; i >= 0; i--) groups.push(Number((value >> BigInt(i * 16)) & 0xffffn));
  let bestStart = -1;
  let bestLength = 0;
  let currentStart = -1;
  let currentLength = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === 0) {
      if (currentStart < 0) currentStart = i;
      currentLength++;
      if (currentLength > bestLength) { bestLength = currentLength; bestStart = currentStart; }
    } else {
      currentStart = -1;
      currentLength = 0;
    }
  }
  if (bestLength < 2) bestStart = -1;
  const parts = groups.map((g) => g.toString(16));
  if (bestStart < 0) return parts.join(":");
  return `${parts.slice(0, bestStart).join(":")}::${parts.slice(bestStart + bestLength).join(":")}`;
}

/** Address scope per RFC 4291 (plus the 2001:db8::/32 documentation range). */
export function ipv6Type(value: bigint): string {
  if (value === 0n) return "unspecified (::)";
  if (value === 1n) return "loopback (::1)";
  const top16 = Number(value >> 112n);
  if ((value >> 32n) === 0xffffn) return "IPv4-mapped (::ffff:0:0/96)";
  if ((top16 & 0xffc0) === 0xfe80) return "link-local (fe80::/10)";
  if ((top16 & 0xfe00) === 0xfc00) return "unique local (fc00::/7)";
  if ((top16 & 0xff00) === 0xff00) return "multicast (ff00::/8)";
  if (Number((value >> 96n) & 0xffffffffn) === 0x20010db8) return "documentation (2001:db8::/32)";
  if ((top16 & 0xe000) === 0x2000) return "global unicast (2000::/3)";
  return "other / reserved";
}

/** First/last address of the /prefix subnet containing `value`, and its size. */
export function ipv6Range(
  value: bigint, prefix: number,
): { first: bigint; last: bigint; count: bigint } | null {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) return null;
  const hostBits = 128 - prefix;
  const mask = hostBits === 0 ? 0n : (1n << BigInt(hostBits)) - 1n;
  const allMask = (1n << 128n) - 1n;
  const first = value & ~mask & allMask;
  return { first, last: first | mask, count: mask + 1n };
}

