"use client";
import { useMemo, useRef, useState } from "react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Item {
  id: number;
  name: string;
  url: string;
  width: number;
  height: number;
  dHash: string;
  aHash: string;
}

/** Packs 64 bits into a 16-character hex string. */
function toHex(bits: number[]): string {
  let out = "";
  for (let i = 0; i < bits.length; i += 4) {
    out += (bits[i] * 8 + bits[i + 1] * 4 + bits[i + 2] * 2 + bits[i + 3]).toString(16);
  }
  return out;
}

/**
 * Perceptual hashes: downscale to 9×8 grayscale, then derive
 * - dHash (difference hash): bit = right pixel brighter than left
 * - aHash (average hash): bit = pixel brighter than the 8×8 mean
 */
function hashImage(url: string): Promise<{ width: number; height: number; dHash: string; aHash: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 9;
        canvas.height = 8;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, 9, 8);
        const data = ctx.getImageData(0, 0, 9, 8).data;
        const gray: number[] = [];
        for (let i = 0; i < 9 * 8; i++) {
          gray.push(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
        }
        const mean = gray.slice(0, 8 * 8).reduce((a, b) => a + b, 0) / 64;
        const dBits: number[] = [];
        const aBits: number[] = [];
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const idx = y * 9 + x;
            dBits.push(gray[idx] > gray[idx + 1] ? 1 : 0);
            aBits.push(gray[idx] > mean ? 1 : 0);
          }
        }
        resolve({ width: img.naturalWidth, height: img.naturalHeight, dHash: toHex(dBits), aHash: toHex(aBits) });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = url;
  });
}

const POPCOUNT = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

function hamming(a: string, b: string): number {
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    distance += POPCOUNT[parseInt(a[i], 16) ^ parseInt(b[i], 16)];
  }
  return distance;
}

/** Combined similarity % (average of dHash and aHash similarity). */
function similarity(a: Item, b: Item): number {
  const dSim = 1 - hamming(a.dHash, b.dHash) / 64;
  const aSim = 1 - hamming(a.aHash, b.aHash) / 64;
  return ((dSim + aSim) / 2) * 100;
}

export default function DuplicateImageChecker() {
  const { text: t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loadError, setLoadError] = useState("");
  const [thresholdStr, setThresholdStr] = useToolState("dup-checker:threshold", "90");
  const [selA, setSelA] = useToolState("dup-checker:sel-a", "");
  const [selB, setSelB] = useToolState("dup-checker:sel-b", "");
  const idRef = useRef(0);

  const threshold = Math.max(50, Math.min(100, Number(thresholdStr) || 90));

  function addFiles(files: FileList | null) {
    if (!files) return;
    setLoadError("");
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result);
        hashImage(url)
          .then((h) => {
            idRef.current += 1;
            setItems((prev) => [...prev, { id: idRef.current, name: file.name, url, ...h }]);
          })
          .catch(() => setLoadError(t("Could not read one or more of the selected images.", "មិនអាចអានរូបភាពមួយ ឬច្រើនដែលបានជ្រើសរើសបានទេ។")));
      };
      reader.readAsDataURL(file);
    });
  }

  const groups = useMemo(() => {
    const used = new Set<number>();
    const result: Item[][] = [];
    for (const item of items) {
      if (used.has(item.id)) continue;
      const group = [item];
      used.add(item.id);
      for (const other of items) {
        if (used.has(other.id)) continue;
        if (similarity(item, other) >= threshold) {
          group.push(other);
          used.add(other.id);
        }
      }
      result.push(group);
    }
    return result;
  }, [items, threshold]);

  const dupGroups = groups.filter((group) => group.length > 1);
  const uniqueCount = groups.length - dupGroups.length;

  const a = items.find((item) => item.id === Number(selA));
  const b = items.find((item) => item.id === Number(selB));
  const sim = a && b && a.id !== b.id ? similarity(a, b) : null;

  return (
    <ToolShell
      title="Duplicate Image Checker"
      khmerTitle="ពិនិត្យរូបភាពស្ទួន"
      description="Upload several images and get an approximate perceptual comparison — visually similar images are grouped and a similarity score is shown for any pair."
      descriptionKm="បញ្ចូលរូបភាពជាច្រើន ដើម្បីទទួលបានការប្រៀបធៀបតាមការយល់ឃើញប្រហាក់ប្រហែល — រូបភាពស្រដៀងគ្នាត្រូវបានដាក់ជាក្រុម ហើយពិន្ទុស្រដៀងត្រូវបានបង្ហាញសម្រាប់រូបនីមួយៗ។"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/10 px-4 py-2 text-sm font-medium text-[var(--gold)] transition hover:bg-[var(--gold)]/20">
          {t("Choose images", "ជ្រើសរូបភាព")}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </label>
        {items.length > 0 && (
          <Button onClick={() => { setItems([]); setLoadError(""); }}>{t("Clear all", "សម្អាតទាំងអស់")}</Button>
        )}
        <span className="text-xs text-[var(--ink-faint)]">
          {items.length > 0 ? `${items.length} ${t("images", "រូបភាព")}` : t("PNG, JPG, WebP…", "PNG, JPG, WebP…")}
        </span>
      </div>

      {loadError && <p className="text-sm text-[var(--danger)]">{loadError}</p>}

      {items.length === 0 && (
        <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center text-sm text-[var(--ink-dim)]">
          {t("No images yet. Add at least two images to compare them.", "មិនទាន់មានរូបភាពទេ។ សូមបន្ថែមយ៉ាងហោចណាស់ពីររូបដើម្បីប្រៀបធៀប។")}
        </p>
      )}

      {items.length > 0 && (
        <>
          <p className="text-xs text-[var(--ink-dim)]">
            {t("Approximate perceptual comparison — results are indicative, not an exact duplicate test.", "ការប្រៀបធៀបតាមការយល់ឃើញប្រហាក់ប្រហែល — លទ្ធផលគ្រាន់តែបង្ហាញទិសដៅ មិនមែនជាការធ្វើតេស្តស្ទួនពិតប្រាកដទេ។")}
          </p>

          {dupGroups.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Possible duplicate groups", "ក្រុមរូបភាពស្ទួនអាចមាន")}
              </div>
              {dupGroups.map((group, gi) => (
                <div key={gi} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                  <div className="mb-2 text-sm font-medium text-[var(--gold)]">{t("Group", "ក្រុម")} {gi + 1}</div>
                  <div className="flex flex-wrap gap-3">
                    {group.map((item) => (
                      <div key={item.id} className="flex flex-col items-center gap-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.name} className="h-20 w-20 rounded-md border border-[var(--ground-line)] object-cover" />
                        <span className="max-w-[96px] truncate text-[10px] text-[var(--ink-dim)]">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {uniqueCount > 0 && (
                <p className="text-xs text-[var(--ink-dim)]">{uniqueCount} {t("unique image(s)", "រូបភាពមិនស្ទួន")}</p>
              )}
            </div>
          )}

          {items.length >= 2 && (
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Compare two images", "ប្រៀបធៀបរូបពីរ")}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t("Image A", "រូប A")}>
                  <Select value={selA} onChange={(e) => setSelA(e.target.value)}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("Image B", "រូប B")}>
                  <Select value={selB} onChange={(e) => setSelB(e.target.value)}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              {sim !== null ? (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className={`text-2xl font-semibold ${sim >= threshold ? "text-[var(--gold)]" : "text-[var(--ink-dim)]"}`}>{sim.toFixed(1)}%</span>
                  <span className="text-xs text-[var(--ink-dim)]">{t("similar", "ស្រដៀង")}</span>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--ink-dim)]">{t("Pick two different images to see their similarity score.", "ជ្រើសរើសរូបភាពពីរផ្សេងគ្នាដើម្បីមើលពិន្ទុស្រដៀងគ្នា។")}</p>
              )}
            </div>
          )}

          <Field label={t("Similarity threshold (%)", "កម្រិតស្រដៀង (%)")}>
            <input type="range" min={60} max={100} step={1} value={threshold} onChange={(e) => setThresholdStr(e.target.value)} className="w-full accent-[var(--gold)]" />
            <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{threshold}%</div>
          </Field>

          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">{t("Name", "ឈ្មោះ")}</th>
                  <th className="px-3 py-2 font-medium">{t("Dimensions", "វិមាត្រ")}</th>
                  <th className="px-3 py-2 font-medium">{t("dHash", "dHash")}</th>
                  <th className="px-3 py-2 font-medium">{t("aHash", "aHash")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-b border-[var(--ground-line)] last:border-0">
                    <td className="px-3 py-2 text-[var(--ink-dim)]">{i + 1}</td>
                    <td className="max-w-[180px] truncate px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2 font-mono-ui">{item.width}×{item.height}</td>
                    <td className="px-3 py-2 font-mono-ui">{item.dHash}</td>
                    <td className="px-3 py-2 font-mono-ui">{item.aHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <aside className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-2 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</p>
        <p>
          {t("Uses the well-known perceptual hashing techniques dHash (difference hash) and aHash (average hash), described by Dr. Neal Krawetz (Hacker Factor). Implementation is original to Tools123: images are downscaled to 9×8 grayscale and compared with Hamming distance.", "ប្រើបច្ចេកទេស perceptual hash ដ៏ល្បី dHash (difference hash) និង aHash (average hash) ដែលបានពិពណ៌នាដោយ បណ្ឌិត Neal Krawetz (Hacker Factor)។ ការអនុវត្តគឺដើមរបស់ Tools123៖ រូបភាពត្រូវបានបង្រួមទៅ 9×8 ក្រេសស្កេល ហើយប្រៀបធៀបដោយចម្ងាយ Hamming។")}{" "}
          <a href="https://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">Hacker Factor — dHash</a>
          {" · "}
          <a href="https://www.hackerfactor.com/blog/index.php?/archives/432-Looks-Like-It.html" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">aHash</a>
        </p>
      </aside>
    </ToolShell>
  );
}
