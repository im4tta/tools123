// Minimal PNG encoder for the bot's QR codes: a square black-and-white image from a module grid, with a quiet zone.
// Uses Node's zlib, so it runs only on the server.
import { deflateSync } from "node:zlib";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** dark(row, col) for a size×size grid -> 8-bit greyscale PNG, `scale` pixels per module, `quiet` modules of margin. */
export function gridToPng(size: number, dark: (row: number, col: number) => boolean, scale = 8, quiet = 4): Buffer {
  const px = (size + quiet * 2) * scale;
  const raw = Buffer.alloc(px * (px + 1), 255);
  for (let y = 0; y < px; y++) {
    raw[y * (px + 1)] = 0; // filter type: none
    const r = Math.floor(y / scale) - quiet;
    for (let x = 0; x < px; x++) {
      const c = Math.floor(x / scale) - quiet;
      if (r >= 0 && c >= 0 && r < size && c < size && dark(r, c)) raw[y * (px + 1) + 1 + x] = 0;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(px, 0);
  ihdr.writeUInt32BE(px, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array())]);
}
