"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Tlv = { tag: number; value: Uint8Array; children: Tlv[] | null };

type Expiry = "valid" | "expiring" | "expired" | "not-yet";

type CertInfo = {
  version: number;
  serial: string;
  signatureAlgorithm: string;
  issuer: string;
  subject: string;
  notBefore: Date | null;
  notAfter: Date | null;
  san: string[];
  publicKeyAlgorithm: string;
  expiry: Expiry;
  daysLeft: number | null;
};

const OID_NAMES: Record<string, string> = {
  "1.2.840.113549.1.1.1": "RSA (rsaEncryption)",
  "1.2.840.113549.1.1.4": "MD5 with RSA",
  "1.2.840.113549.1.1.5": "SHA-1 with RSA",
  "1.2.840.113549.1.1.11": "SHA-256 with RSA",
  "1.2.840.113549.1.1.12": "SHA-384 with RSA",
  "1.2.840.113549.1.1.13": "SHA-512 with RSA",
  "1.2.840.10045.2.1": "EC (id-ecPublicKey)",
  "1.2.840.10045.4.3.2": "ECDSA with SHA-256",
  "1.2.840.10045.4.3.3": "ECDSA with SHA-384",
  "1.2.840.10045.4.3.4": "ECDSA with SHA-512",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
  "2.5.29.17": "subjectAltName",
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "1.2.840.113549.1.9.1": "emailAddress",
  "0.9.2342.19200300.100.1.25": "DC",
};

function parseTlv(buf: Uint8Array, pos: number): { tlv: Tlv; next: number } {
  if (pos >= buf.length) throw new Error("truncated");
  const tag = buf[pos];
  let lenPos = pos + 1;
  let length = buf[lenPos];
  if ((length & 0x80) !== 0) {
    const count = length & 0x7f;
    if (count === 0 || count > 4 || lenPos + count >= buf.length) throw new Error("bad length");
    length = 0;
    for (let i = 0; i < count; i++) length = length * 256 + buf[lenPos + 1 + i];
    lenPos += count;
  }
  const start = lenPos + 1;
  if (start + length > buf.length) throw new Error("truncated");
  const value = buf.slice(start, start + length);
  let children: Tlv[] | null = null;
  if ((tag & 0x20) !== 0) {
    children = [];
    let p = 0;
    while (p < value.length) {
      const child = parseTlv(value, p);
      children.push(child.tlv);
      p = child.next;
    }
  }
  return { tlv: { tag, value, children }, next: start + length };
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64ToBytes(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function derToBytes(input: string): Uint8Array {
  const text = input.trim();
  if (!text) throw new Error("empty");
  if (text.startsWith("-----")) {
    const block = /-----BEGIN[^-]*-----([\s\S]*?)-----END[^-]*-----/.exec(text);
    if (!block) throw new Error("empty");
    const b64 = block[1].replace(/\s/g, "");
    if (!b64) throw new Error("empty");
    return base64ToBytes(b64);
  }
  if (/^[0-9a-fA-F\s:]+$/.test(text) && text.replace(/[\s:]/g, "").length % 2 === 0) {
    const clean = text.replace(/[\s:]/g, "");
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
  if (/^[A-Za-z0-9+/=\s]+$/.test(text)) {
    try {
      return base64ToBytes(text);
    } catch {
      throw new Error("parse");
    }
  }
  throw new Error("parse");
}

function decodeOid(buf: Uint8Array): string {
  let out = "";
  let first = true;
  let value = 0;
  for (const b of buf) {
    value = value * 128 + (b & 0x7f);
    if ((b & 0x80) === 0) {
      if (first) {
        out = `${Math.floor(value / 40)}.${value % 40}`;
        first = false;
      } else {
        out += `.${value}`;
      }
      value = 0;
    }
  }
  return out;
}

function oidOf(seq: Tlv): string {
  const oid = seq.children?.[0];
  return oid && oid.tag === 0x06 ? decodeOid(oid.value) : "";
}

function oidName(oid: string): string {
  return OID_NAMES[oid] ?? oid;
}

function utf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function decodeString(tlv: Tlv): string {
  const bytes = tlv.value;
  if (tlv.tag === 0x1e) {
    let s = "";
    for (let i = 0; i + 1 < bytes.length; i += 2) s += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    return s;
  }
  if (tlv.tag === 0x14 || tlv.tag === 0x16 || tlv.tag === 0x13 || tlv.tag === 0x12) {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return s;
  }
  return utf8(bytes);
}

function nameOf(seq: Tlv): string {
  const parts: string[] = [];
  for (const set of seq.children ?? []) {
    for (const atv of set.children ?? []) {
      const oidTlv = atv.children?.[0];
      const valTlv = atv.children?.[1];
      if (!oidTlv || !valTlv) continue;
      const oid = oidTlv.tag === 0x06 ? decodeOid(oidTlv.value) : "";
      parts.push(`${OID_NAMES[oid] ?? oid}=${decodeString(valTlv)}`);
    }
  }
  return parts.reverse().join(", ");
}

function readInt(bytes: Uint8Array): number {
  let n = 0;
  for (const b of bytes) n = n * 256 + b;
  return n;
}

function parseTime(tlv: Tlv): Date | null {
  const s = utf8(tlv.value);
  const utc = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  if (utc) {
    let yy = Number(utc[1]);
    yy = yy < 50 ? yy + 2000 : yy + 1900;
    return new Date(Date.UTC(yy, Number(utc[2]) - 1, Number(utc[3]), Number(utc[4]), Number(utc[5]), Number(utc[6])));
  }
  const gen = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  if (gen) {
    return new Date(Date.UTC(Number(gen[1]), Number(gen[2]) - 1, Number(gen[3]), Number(gen[4]), Number(gen[5]), Number(gen[6])));
  }
  return null;
}

function expiryOf(notBefore: Date | null, notAfter: Date | null): { expiry: Expiry; daysLeft: number | null } {
  const now = Date.now();
  if (notBefore && now < notBefore.getTime()) return { expiry: "not-yet", daysLeft: null };
  if (notAfter && now > notAfter.getTime()) return { expiry: "expired", daysLeft: null };
  if (notAfter) {
    const days = Math.ceil((notAfter.getTime() - now) / 86_400_000);
    if (days < 30) return { expiry: "expiring", daysLeft: days };
  }
  return { expiry: "valid", daysLeft: notAfter ? Math.ceil((notAfter.getTime() - now) / 86_400_000) : null };
}

function parseCertificate(pem: string): CertInfo {
  const der = derToBytes(pem);
  const root = parseTlv(der, 0).tlv;
  if (root.tag !== 0x30 || !root.children || root.children.length < 3) throw new Error("not a certificate");
  const c = root.children[0];
  if (!c || c.tag !== 0x30 || !c.children) throw new Error("not a certificate");
  const tbs = c.children;

  let version = 1;
  let idx = 0;
  if (tbs[0] && tbs[0].tag === 0xa0) {
    const inner = tbs[0].children?.[0];
    if (inner && inner.tag === 0x02) version = readInt(inner.value) + 1;
    idx = 1;
  }

  const serial = tbs[idx] && tbs[idx].tag === 0x02 ? toHex(tbs[idx].value) : "";
  const signatureAlgorithm = tbs[idx + 1] ? oidName(oidOf(tbs[idx + 1])) : "";
  const issuer = tbs[idx + 2] ? nameOf(tbs[idx + 2]) : "";
  const validity = tbs[idx + 3];
  const notBefore = validity?.children?.[0] ? parseTime(validity.children[0]) : null;
  const notAfter = validity?.children?.[1] ? parseTime(validity.children[1]) : null;
  const subject = tbs[idx + 5] ? nameOf(tbs[idx + 5]) : "";
  const spki = tbs[idx + 6];
  const spkiAlgo = spki?.children?.[0];
  const publicKeyAlgorithm = spkiAlgo ? oidName(oidOf(spkiAlgo)) : "";

  const san: string[] = [];
  for (const node of tbs) {
    if (node.tag !== 0xa3 || !node.children) continue;
    for (const ext of node.children) {
      if (ext.tag !== 0x30 || !ext.children) continue;
      if (oidOf(ext) !== "2.5.29.17") continue;
      const extnValue = ext.children[ext.children.length - 1];
      if (!extnValue || extnValue.tag !== 0x04) continue;
      const gn = parseTlv(extnValue.value, 0).tlv;
      for (const g of gn.children ?? []) {
        if (g.tag === 0x82) san.push(utf8(g.value));
      }
    }
  }

  const { expiry, daysLeft } = expiryOf(notBefore, notAfter);
  return { version, serial, signatureAlgorithm, issuer, subject, notBefore, notAfter, san, publicKeyAlgorithm, expiry, daysLeft };
}

const EXPIRY_UI: Record<Expiry, { label: string; labelKm: string; cls: string }> = {
  valid: { label: "Valid", labelKm: "មានសុពលភាព", cls: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]" },
  expiring: { label: "Expiring soon", labelKm: "ជិតផុតកំណត់", cls: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]" },
  expired: { label: "Expired", labelKm: "ផុតកំណត់", cls: "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]" },
  "not-yet": { label: "Not yet valid", labelKm: "មិនទាន់មានសុពលភាព", cls: "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]" },
};

export default function CertificateViewer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("cert:pem", "");

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return parseCertificate(input);
    } catch {
      return null;
    }
  }, [input]);
  const parseError = input.trim() !== "" && parsed === null;

  return (
    <ToolShell
      title="Certificate (X.509) Viewer"
      khmerTitle="មើលវិញ្ញាបនបត្រ X.509"
      description="Paste a PEM certificate to extract version, serial, issuer, validity, subject, SAN DNS names, and key algorithm with a local DER parser."
      descriptionKm="បិទភ្ជាប់វិញ្ញាបនបត្រ PEM ដើម្បីទាញយកកំណែ លេខស៊េរី អ្នកចេញ សុពលភាព ប្រធានបទ ឈ្មោះ DNS ក្នុង SAN និងក្បួនសោ ដោយកម្មវិធីវិភាគ DER ក្នុងឧបករណ៍។"
    >
      <Field label={t("PEM certificate", "វិញ្ញាបនបត្រ PEM")}>
        <TextArea
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("Paste -----BEGIN CERTIFICATE----- …", "បិទភ្ជាប់ -----BEGIN CERTIFICATE----- …")}
        />
      </Field>

      {input.trim() === "" && (
        <p className="text-sm text-[var(--ink-dim)]">{t("Paste a PEM certificate to view its details.", "សូមបិទភ្ជាប់វិញ្ញាបនបត្រ PEM ដើម្បីមើលព័ត៌មានលម្អិត។")}</p>
      )}

      {parseError && (
        <p className="text-sm text-[var(--danger)]">
          {t("Could not parse this as an X.509 certificate. Make sure you pasted the full PEM block (including the BEGIN/END lines) or valid DER.", "មិនអាចវិភាគនេះជាវិញ្ញាបនបត្រ X.509 បានទេ។ សូមប្រាកដថាអ្នកបានបិទភ្ជាប់ប្លុក PEM ពេញលេញ (រួមទាំងបន្ទាត់ BEGIN/END) ឬ DER ត្រឹមត្រូវ។")}
        </p>
      )}

      {parsed && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Status", "ស្ថានភាព")}</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${EXPIRY_UI[parsed.expiry].cls}`}>
              {t(EXPIRY_UI[parsed.expiry].label, EXPIRY_UI[parsed.expiry].labelKm)}
            </span>
            {parsed.expiry === "expiring" && parsed.daysLeft !== null && (
              <span className="text-xs text-[var(--ink-dim)]">
                {t("Expires in", "ផុតកំណត់ក្នុងរយៈពេល")} {parsed.daysLeft} {t("days", "ថ្ងៃ")}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <DetailRow label1={t("Version", "កំណែ")} value1={parsed.version === 1 ? "v1" : `v${parsed.version}`} />
            <DetailRow label1={t("Serial number (hex)", "លេខស៊េរី (hex)")} value1={parsed.serial || "—"} mono1 />
            <DetailRow label1={t("Signature algorithm", "ក្បួនហត្ថលេខា")} value1={parsed.signatureAlgorithm || "—"} />
            <DetailRow label1={t("Issuer", "អ្នកចេញ")} value1={parsed.issuer || "—"} />
            <DetailRow label1={t("Subject", "ប្រធានបទ")} value1={parsed.subject || "—"} />
            <DetailRow
              label1={t("Validity", "សុពលភាព")}
              value1={`${parsed.notBefore ? parsed.notBefore.toUTCString() : "—"} → ${parsed.notAfter ? parsed.notAfter.toUTCString() : "—"}`}
            />
            <DetailRow label1={t("Public key algorithm", "ក្បួនសោសាធារណៈ")} value1={parsed.publicKeyAlgorithm || "—"} />
            <DetailRow label1={t("SubjectAltName (DNS)", "SubjectAltName (DNS)")} value1={parsed.san.length > 0 ? parsed.san.join(", ") : "—"} />
          </div>

          <p className="text-xs text-[var(--ink-dim)]">
            {t("Parsed locally with a minimal DER (ASN.1) walker — the certificate never leaves your device.", "វិភាគក្នុងឧបករណ៍ដោយកម្មវិធីដើរ DER (ASN.1) តិចតួច — វិញ្ញាបនបត្រមិនដែលចេញពីឧបករណ៍របស់អ្នកទេ។")}
          </p>
        </div>
      )}

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Independent minimal DER parser implementing the X.509 certificate structure defined in:", "កម្មវិធីវិភាគ DER ឯករាជ្យតិចតួច អនុវត្តរចនាសម្ព័ន្ធវិញ្ញាបនបត្រ X.509 ដែលកំណត់ក្នុង៖")}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-[var(--ink-dim)]">
          <li>
            <a href="https://www.rfc-editor.org/rfc/rfc5280" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              RFC 5280
            </a>{" "}
            — {t("Internet X.509 Public Key Infrastructure Certificate and CRL Profile", "Internet X.509 Public Key Infrastructure Certificate and CRL Profile")}
          </li>
          <li>
            <a href="https://www.rfc-editor.org/rfc/rfc7468" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              RFC 7468
            </a>{" "}
            — {t("PEM textual encoding", "ការអ៊ិនកូដអត្ថបទ PEM")}
          </li>
        </ul>
      </div>
    </ToolShell>
  );
}

/** Small presentational row used to render label/value pairs. */
function DetailRow({ label1, value1, mono1 = false }: { label1: string; value1: string; mono1?: boolean }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{label1}</div>
      <div className={`mt-0.5 break-all text-sm text-[var(--ink)] ${mono1 ? "font-mono-ui" : ""}`}>{value1}</div>
    </div>
  );
}
