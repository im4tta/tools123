"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const NETWORKS: { name: string; km: string; prefixes: string[]; color: string }[] = [
  { name: "Smart Axiata", km: "ស្មាត", prefixes: ["010", "015", "016", "069", "070", "081", "083", "084", "085", "086", "087", "088", "089", "090", "092", "093", "095", "096", "098"], color: "#e60000" },
  { name: "Cellcard", km: "សែលកាត", prefixes: ["011", "012", "017", "061", "071", "076", "077", "078", "079", "0969", "0989"], color: "#ffd100" },
  { name: "Metfone", km: "មេតហ្វូន", prefixes: ["031", "038", "060", "066", "067", "068", "0931", "094", "097"], color: "#0072ce" },
  { name: "Seatel", km: "ស៊ីធាខល", prefixes: ["014", "018"], color: "#ff7a00" },
  { name: "CooTel", km: "គូទែល", prefixes: ["036"], color: "#8e24aa" },
];

function cleanNumber(raw: string): string {
  let n = raw.replace(/\s|-|\(|\)/g, "");
  if (n.startsWith("+855")) n = "0" + n.slice(4);
  else if (n.startsWith("855") && n.length === 11) n = "0" + n.slice(3);
  else if (n.startsWith("00")) n = "0" + n.slice(2);
  return n;
}

export default function PhoneNetworkFinder() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("phone-network:input", "012 345 678");

  const result = useMemo(() => {
    const n = cleanNumber(input);
    if (!/^0\d{8,9}$/.test(n)) return { n, match: null };
    const prefix = n.slice(0, 4);
    const match = NETWORKS.find((net) => net.prefixes.some((p) => prefix.startsWith(p)));
    return { n, match: match ?? null };
  }, [input]);

  return (
    <ToolShell
      title="Cambodia Phone Network Finder"
      khmerTitle="ស្វែងរកក្រុមហ៊ុនទូរស័ព្ទ"
      description="Detect which Cambodian mobile operator (Smart, Cellcard, Metfone, Seatel, CooTel) a phone number belongs to."
      descriptionKm="ស្វែងរកមើលថាលេខទូរស័ព្ទជារបស់ក្រុមហ៊ុនណា (ស្មាត សែលកាត មេតហ្វូន ស៊ីធាខល គូទែល)។"
    >
      <Field label={t("Phone number", "លេខទូរស័ព្ទ")} hint={t("0xx / +855 / 855", "0xx / +855 / 855")}>
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder="012 345 678" />
      </Field>
      {result.n && /^0\d{8,9}$/.test(result.n) ? (
        <div className="flex flex-col gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-black" style={{ background: result.match?.color ?? "#888" }}>
            {result.match ? result.match.name[0] : "?"}
          </span>
          <div>
            <div className="font-mono-ui text-lg font-semibold text-[var(--ink)]">{result.n}</div>
            {result.match ? (
              <div className="text-sm text-[var(--ink-dim)]">
                {t(result.match.name, result.match.km)} · prefix {result.n.slice(0, 3)}
              </div>
            ) : (
              <div className="text-sm text-[var(--danger)]">{t("Unknown or invalid operator prefix", "លេខកូដមិនត្រូវបានស្គាល់")}</div>
            )}
          </div>
        </div>
      ) : (
        input.trim() && <p className="text-sm text-[var(--danger)]">{t("Enter a valid Cambodian number", "សូមបញ្ចូលលេខកម្ពុជាឱ្យបានត្រឹមត្រូវ")}</p>
      )}
    </ToolShell>
  );
}