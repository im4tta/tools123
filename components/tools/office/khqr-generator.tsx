"use client";
import { useMemo } from "react";
import qrcode from "qrcode-generator";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

function tlv(tag: string, value: string): string {
  const bytes = new TextEncoder().encode(value);
  return `${tag}${bytes.length.toString(16).padStart(2, "0")}${value}`;
}

function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildKhqr(opts: {
  type: string;
  bakongAccount: string;
  merchantId: string;
  merchantName: string;
  city: string;
  amount: string;
  currency: string;
}): { payload: string; error?: string } {
  const name = opts.merchantName.trim();
  const city = opts.city.trim() || "Phnom Penh";
  if (!opts.bakongAccount.trim()) return { payload: "", error: "Bakong account ID is required" };

  const type = opts.type; // 01 merchant, 02 account
  let merchantInfo = tlv("00", type);
  if (type === "01") {
    merchantInfo += tlv("01", opts.merchantId.trim() || opts.bakongAccount.trim());
  }
  merchantInfo += tlv("02", opts.bakongAccount.trim());
  if (name) merchantInfo += tlv("03", name);
  merchantInfo += tlv("04", city);
  if (type === "01") merchantInfo += tlv("05", opts.merchantId.trim());

  let payload = "000201" + (opts.amount ? "010212" : "010211");
  payload += tlv("26", merchantInfo);
  payload += "52040000";
  payload += tlv("53", opts.currency);
  if (opts.amount) {
    const amt = parseFloat(opts.amount);
    if (Number.isNaN(amt) || amt <= 0) return { payload: "", error: "Amount must be a positive number" };
    payload += tlv("54", amt.toFixed(opts.currency === "116" ? 0 : 2));
  }
  payload += "5802KH";
  payload += tlv("59", name || "Merchant");
  payload += tlv("60", city);
  payload += "6304" + crc16ccitt(payload + "6304");
  return { payload };
}

export default function KhqrGenerator() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState("khqr:type", "01");
  const [bakongAccount, setBakongAccount] = useToolState("khqr:account", "");
  const [merchantId, setMerchantId] = useToolState("khqr:merchant", "");
  const [merchantName, setMerchantName] = useToolState("khqr:name", "My Shop");
  const [city, setCity] = useToolState("khqr:city", "Phnom Penh");
  const [amount, setAmount] = useToolState("khqr:amount", "");
  const [currency, setCurrency] = useToolState("khqr:currency", "116");

  const result = useMemo(
    () =>
      buildKhqr({ type, bakongAccount, merchantId, merchantName, city, amount, currency }),
    [type, bakongAccount, merchantId, merchantName, city, amount, currency],
  );

  const svg = useMemo(() => {
    if (!result.payload) return "";
    try {
      const qr = qrcode(0, "M");
      qr.addData(result.payload, "Byte");
      qr.make();
      return qr.createSvgTag(4, 0);
    } catch {
      return "";
    }
  }, [result.payload]);

  return (
    <ToolShell
      title="KHQR / Bakong Payment QR"
      khmerTitle="KHQR បង់ប្រាក់តាម Bakong"
      description="Generate a real Bakong KHQR payment code (EMVCo TLV + CRC16) that any Cambodian banking app can scan."
      descriptionKm="បង្កើតលេខកូដ KHQR របស់ Bakong ពិតប្រាកដ ដែលកម្មវិធីធនាគារនៅកម្ពុជាអាចស្កេនបាន។"
    >
      <Field label={t("QR type", "ប្រភេទ QR")} labelKm="ប្រភេទ QR">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="01">{t("Merchant", "អាជីវករ")}</option>
          <option value="02">{t("Account", "គណនី")}</option>
        </Select>
      </Field>
      <Field label={t("Bakong account ID", "លេខគណនី Bakong")} hint={t("e.g. phone@aba, username@acleda", "ឧ. phone@aba, username@acleda")}>
        <TextInput value={bakongAccount} onChange={(e) => setBakongAccount(e.target.value)} placeholder="user@aba" />
      </Field>
      {type === "01" && (
        <Field label={t("Merchant ID", "លេខសម្គាល់អាជីវករ")}>
          <TextInput value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="BAKONG-MERCHANT-ID" />
        </Field>
      )}
      <Field label={t("Merchant name", "ឈ្មោះអាជីវករ")}>
        <TextInput value={merchantName} onChange={(e) => setMerchantName(e.target.value)} />
      </Field>
      <Field label={t("City", "ទីក្រុង")}>
        <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
      </Field>
      <Field label={t("Amount", "ចំនួនទឹកប្រាក់")} hint={t("Leave empty for any amount", "ទុកទទេ ដើម្បីបង់តាមចិត្ត")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="116">៛ Riel (KHR)</option>
            <option value="840">$ USD</option>
          </Select>
        </div>
      </Field>

      {result.error && <p className="text-sm text-[var(--danger)]">{t(result.error, result.error)}</p>}

      {result.payload && (
        <div className="flex flex-col gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 sm:flex-row sm:items-center">
          {svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} className="rounded-lg bg-white p-2 [&>svg]:h-40 [&>svg]:w-40" />
          ) : null}
          <div className="flex-1">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("KHQR payload", "ទិន្នន័យ KHQR")}</div>
            <Output value={result.payload} label="" />
          </div>
        </div>
      )}
    </ToolShell>
  );
}