"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { Star } from "lucide-react";

// ---------------------------------------------------------------------------
// Curated, illustrative list of common Khmer given names (ឈ្មោះកណ្ដាល).
// The meanings are the usual Pali/Sanskrit root glosses these names are known
// by (e.g. សុខ "happiness", បញ្ញា "wisdom" from paññā). Gender tags are loose
// traditional associations only — most Khmer given names are used across
// genders. This list is NOT exhaustive and is not an official name register.
// ---------------------------------------------------------------------------
type Gender = "any" | "boy" | "girl";

type BabyName = {
  name: string;
  gender: Gender;
  meaningEn: string;
  meaningKm: string;
  /** Optional explicit count; when absent a grapheme-based approximation is shown. */
  syllableCount?: number;
};

const GENDER_META: Record<Gender, { en: string; km: string }> = {
  any: { en: "Any", km: "គ្រប់ភេទ" },
  boy: { en: "Boy", km: "ប្រុស" },
  girl: { en: "Girl", km: "ស្រី" },
};

const NAMES: BabyName[] = [
  // --- Traditionally more common for boys ---
  { name: "សុខ", gender: "boy", meaningEn: "happiness, well-being", meaningKm: "សេចក្ដីសុខ សប្បាយ" },
  { name: "សំណាង", gender: "boy", meaningEn: "good fortune, luck", meaningKm: "សំណាងល្អ" },
  { name: "មុនី", gender: "boy", meaningEn: "wise sage", meaningKm: "អ្នកប្រាជ្ញ អ្នកមានប្រាជ្ញា (Pali: muni)" },
  { name: "វិរៈ", gender: "boy", meaningEn: "brave, heroic", meaningKm: "ក្លាហាន អង់អាច (Sanskrit: vīra)" },
  { name: "ពេជ្រ", gender: "boy", meaningEn: "diamond", meaningKm: "ត្បូងពេជ្រ (Sanskrit: vajra)" },
  { name: "សុជាតិ", gender: "boy", meaningEn: "well-born, noble", meaningKm: "កំណើតល្អ ពូជល្អ (Pali: sujāti)" },
  { name: "វិបុល", gender: "boy", meaningEn: "abundant, vast", meaningKm: "សម្បូរបែប ទូលំទូលាយ (Pali: vipula)" },
  { name: "មង្គល", gender: "boy", meaningEn: "auspicious blessing", meaningKm: "សិរីមង្គល (Pali: maṅgala)" },
  { name: "សិទ្ធិ", gender: "boy", meaningEn: "power, accomplishment", meaningKm: "អំណាច សមត្ថភាព ជោគជ័យ (Pali: siddhi)" },
  { name: "សំរិទ្ធ", gender: "boy", meaningEn: "prosperity, fulfillment", meaningKm: "ភាពចម្រើន សម្រេចជោគជ័យ (Pali: samiddhi)" },
  { name: "សុវត្ថិ", gender: "boy", meaningEn: "welfare, safety", meaningKm: "សុខភាព សុវត្ថិភាព (Pali: svatthi)" },
  { name: "ឧត្តម", gender: "boy", meaningEn: "excellent, supreme", meaningKm: "ល្អខ្ពស់បំផុត (Pali: uttama)" },
  { name: "វង្ស", gender: "boy", meaningEn: "lineage, clan", meaningKm: "ពូជពង្ស វង្សត្រកូល (Pali: vaṃsa)" },
  { name: "រាជ", gender: "boy", meaningEn: "king, royal", meaningKm: "ស្ដេច រាជា (Sanskrit: rāja)" },
  { name: "វិជ័យ", gender: "boy", meaningEn: "victory", meaningKm: "ជ័យជំនះ (Pali: vijaya)" },
  { name: "ជ័យ", gender: "boy", meaningEn: "victory, triumph", meaningKm: "ជ័យជំនះ ឈ្នះ" },
  { name: "បុរី", gender: "boy", meaningEn: "city, town", meaningKm: "ទីក្រុង (Pali: purī)" },
  { name: "រតនៈ", gender: "boy", meaningEn: "jewel, gem", meaningKm: "ត្បូង កែវវិសេស (Pali: ratana)" },
  { name: "សុវណ្ណ", gender: "boy", meaningEn: "gold, golden", meaningKm: "មាស (Pali: suvaṇṇa)" },
  { name: "វុទ្ធី", gender: "boy", meaningEn: "progress, growth", meaningKm: "ការចម្រើនរីកចម្រើន (Pali: vuddhi)" },
  { name: "ចម្រើន", gender: "boy", meaningEn: "prosperity, flourishing", meaningKm: "ភាពចម្រើន" },
  { name: "សម្បត្តិ", gender: "boy", meaningEn: "wealth, estate", meaningKm: "ទ្រព្យសម្បត្តិ (Pali: sampatti)" },
  { name: "វិចិត្រ", gender: "boy", meaningEn: "exquisite, marvellous", meaningKm: "វិចិត្រ អស្ចារ្យ (Pali: vicitta)" },

  // --- Traditionally more common for girls ---
  { name: "សុខា", gender: "girl", meaningEn: "happy one", meaningKm: "អ្នកមានសេចក្ដីសុខ" },
  { name: "រតនា", gender: "girl", meaningEn: "jewel, precious gem", meaningKm: "កែវ ត្បូងដ៏មានតម្លៃ (Pali: ratanā)" },
  { name: "សុវណ្ណា", gender: "girl", meaningEn: "golden", meaningKm: "ពណ៌មាស (Pali: suvaṇṇā)" },
  { name: "ចន្ទ្រា", gender: "girl", meaningEn: "the moon", meaningKm: "ព្រះច័ន្ទ (Sanskrit: candrā)" },
  { name: "សុភា", gender: "girl", meaningEn: "beautiful, good", meaningKm: "ស្អាត ល្អ (Pali: subhā)" },
  { name: "សោភា", gender: "girl", meaningEn: "beauty, radiance", meaningKm: "សម្រស់ សោភ័ណភាព (Pali: sobhā)" },
  { name: "បុប្ផា", gender: "girl", meaningEn: "flower", meaningKm: "ផ្កា (Pali: pupphā)" },
  { name: "កញ្ញា", gender: "girl", meaningEn: "young lady, maiden", meaningKm: "នារីក្រមុំ (Sanskrit: kanyā)" },
  { name: "សុចិត្រា", gender: "girl", meaningEn: "good-hearted", meaningKm: "ចិត្តល្អ (Pali: sucittā)" },
  { name: "ចិន្តា", gender: "girl", meaningEn: "thought, mind", meaningKm: "គំនិត សតិបញ្ញា (Pali: cintā)" },
  { name: "ណារី", gender: "girl", meaningEn: "woman, lady", meaningKm: "នារី (Pali: nārī)" },
  { name: "សុវត្ថនា", gender: "girl", meaningEn: "prosperous, blessed", meaningKm: "ចម្រើន មានសុខ (Pali: svatthanā)" },
  { name: "កនិដ្ឋា", gender: "girl", meaningEn: "youngest, dear little one", meaningKm: "កូនពៅជាទីស្រឡាញ់ (Pali: kaniṭṭhā)" },
  { name: "ស្រីពៅ", gender: "girl", meaningEn: "youngest beloved daughter", meaningKm: "កូនស្រីពៅ" },
  { name: "សុគន្ធា", gender: "girl", meaningEn: "sweet-scented, fragrant", meaningKm: "ក្រអូប (Pali: sugandhā)" },
  { name: "ចន្ទរស្មី", gender: "girl", meaningEn: "moonlight", meaningKm: "រស្មីព្រះច័ន្ទ" },
  { name: "ស្រីនាង", gender: "girl", meaningEn: "young lady, miss", meaningKm: "នាងក្រមុំ" },
  { name: "សុជាតា", gender: "girl", meaningEn: "well-born (feminine)", meaningKm: "កំណើតល្អ (Pali: sujātā)" },
  { name: "ទេពី", gender: "girl", meaningEn: "goddess", meaningKm: "ទេពធីតា (Pali: devī)" },
  { name: "មាលា", gender: "girl", meaningEn: "garland of flowers", meaningKm: "កម្រង់ផ្កា (Pali: mālā)" },
  { name: "ស្រីអូន", gender: "girl", meaningEn: "beloved younger girl", meaningKm: "ប្អូនស្រីជាទីស្រឡាញ់" },

  // --- Used across genders ---
  { name: "បញ្ញា", gender: "any", meaningEn: "wisdom", meaningKm: "ប្រាជ្ញា (Pali: paññā)" },
  { name: "ច័ន្ទ", gender: "any", meaningEn: "moon", meaningKm: "ព្រះច័ន្ទ (Sanskrit: candra)" },
  { name: "សិរី", gender: "any", meaningEn: "glory, splendour", meaningKm: "សិរី រុងរឿង (Pali: sirī)" },
  { name: "សេរី", gender: "any", meaningEn: "freedom", meaningKm: "សេរីភាព" },
  { name: "រស្មី", gender: "any", meaningEn: "ray of light", meaningKm: "រស្មីពន្លឺ" },
  { name: "ពន្លឺ", gender: "any", meaningEn: "light, brightness", meaningKm: "ពន្លឺ" },
  { name: "ពន្លក", gender: "any", meaningEn: "sprout, bud", meaningKm: "ពន្លក" },
  { name: "សុគន្ធ", gender: "any", meaningEn: "sweet fragrance", meaningKm: "ក្លិនក្រអូប (Pali: sugandha)" },
  { name: "សាន្ត", gender: "any", meaningEn: "calm, peaceful", meaningKm: "ស្ងប់ស្ងាត់ (Pali: sānta)" },
  { name: "វណ្ណា", gender: "any", meaningEn: "colour; letter", meaningKm: "ពណ៌ អក្សរ (Pali: vaṇṇā)" },
  { name: "វណ្ណៈ", gender: "any", meaningEn: "colour, beauty", meaningKm: "ពណ៌ សម្រស់ (Pali: vaṇṇa)" },
  { name: "សុរិយា", gender: "any", meaningEn: "sun", meaningKm: "ព្រះអាទិត្យ (Pali: sūriyā)" },
  { name: "កែវ", gender: "any", meaningEn: "gem, precious", meaningKm: "កែវ វត្ថុមានតម្លៃ" },
  { name: "វិជ្ជា", gender: "any", meaningEn: "knowledge, science", meaningKm: "ចំណេះវិជ្ជា (Pali: vijjā)" },
  { name: "តារា", gender: "any", meaningEn: "star", meaningKm: "ផ្កាយ (Sanskrit: tārā)" },
  { name: "មេត្តា", gender: "any", meaningEn: "loving-kindness", meaningKm: "សេចក្ដីមេត្តា (Pali: mettā)" },
  { name: "ករុណា", gender: "any", meaningEn: "compassion", meaningKm: "ក្ដីអាណិតអាសូរ (Pali: karuṇā)" },
  { name: "សុភាព", gender: "any", meaningEn: "gentle, polite", meaningKm: "សុភាពរាបសារ" },
  { name: "បុណ្យ", gender: "any", meaningEn: "merit, good deeds", meaningKm: "បុណ្យ កុសល" },
  { name: "គុណ", gender: "any", meaningEn: "virtue, gratitude", meaningKm: "គុណធម៌ (Pali: guṇa)" },
  { name: "វាសនា", gender: "any", meaningEn: "fate, destiny", meaningKm: "វាសនា ជោគវាសនា" },
  { name: "សុខុម", gender: "any", meaningEn: "gentle, tender", meaningKm: "សុខុម ទន់ភ្លន់ (Pali: sukhuma)" },
  { name: "វិមល", gender: "any", meaningEn: "pure, spotless", meaningKm: "បរិសុទ្ធ (Pali: vimala)" },
  { name: "សន្តិ", gender: "any", meaningEn: "peace", meaningKm: "សន្តិភាព (Pali: santi)" },
];

/** Approximate syllable count from Khmer orthographic (grapheme) clusters. */
function approxSyllables(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
    return [...seg.segment(text)].filter((s) => s.segment.trim() !== "").length;
  }
  return [...text].filter((c) => c.trim() !== "").length;
}

const KH = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH[Number(d)] ?? d).join("");

export default function KhmerBabyNameFinder() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("khmer-baby-name-finder:query", "");
  const [gender, setGender] = useToolState<Gender>("khmer-baby-name-finder:gender", "any");
  const [favOnly, setFavOnly] = useToolState("khmer-baby-name-finder:favOnly", false);
  const [favs, setFavs] = useToolState<string[]>("khmer-baby-name-finder:favs", []);

  const favSet = useMemo(() => new Set(favs), [favs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NAMES.filter(
      (n) =>
        (gender === "any" || n.gender === gender) &&
        (!favOnly || favSet.has(n.name)) &&
        (!q ||
          n.name.toLowerCase().includes(q) ||
          n.meaningEn.toLowerCase().includes(q) ||
          n.meaningKm.toLowerCase().includes(q))
    ).map((n) => ({ ...n, syllables: n.syllableCount ?? approxSyllables(n.name) }));
  }, [query, gender, favOnly, favSet]);

  const toggleFav = (name: string) => {
    setFavs((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  };

  return (
    <ToolShell
      title="Khmer Baby Name Finder"
      khmerTitle="ស្វែងរកឈ្មោះកូនខ្មែរ"
      description="Browse a curated list of Khmer given names with their usual meanings (in English and Khmer). Search by name or meaning, filter by gender, keep a favourites list, and copy names — each with an approximate syllable count."
      descriptionKm="រកមើលបញ្ជីឈ្មោះកណ្ដាលខ្មែរជាមួយអត្ថន័យធម្មតា (ទាំងភាសាអង់គ្លេស និងខ្មែរ)។ ស្វែងរកតាមឈ្មោះ ឬអត្ថន័យ ត្រងតាមភេទ រក្សាទុកបញ្ជីចំណូលចិត្ត និងចម្លងឈ្មោះ — ជាមួយចំនួនព្យាង្គប្រហាក់ប្រហែលនៃឈ្មោះនីមួយៗ។"
    >
      <Row>
        <Field label="Search" labelKm="ស្វែងរក">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Name or meaning…", "ឈ្មោះ ឬអត្ថន័យ…")}
          />
        </Field>
        <Field label="Gender" labelKm="ភេទ">
          <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="any"><>{t("All genders", "គ្រប់ភេទ")}</></option>
            <option value="boy"><>{t("Boys", "ប្រុស")}</></option>
            <option value="girl"><>{t("Girls", "ស្រី")}</></option>
          </Select>
        </Field>
      </Row>

      <button
        type="button"
        onClick={() => setFavOnly(!favOnly)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
          favOnly
            ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
            : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"
        }`}
      >
        <Star size={13} className={favOnly ? "fill-[var(--gold)]" : ""} />
        {favOnly ? t("Favourites only", "តែឈ្មោះចំណូលចិត្ត") : t("Show favourites only", "បង្ហាញតែឈ្មោះចំណូលចិត្ត")}
      </button>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
          {t(`${filtered.length} of ${NAMES.length} names`, `ឈ្មោះ ${toKh(filtered.length)} ក្នុងចំណោម ${toKh(NAMES.length)}`)}
          {favs.length > 0 && (
            <span className="ml-2 font-normal normal-case text-[var(--ink-faint)]">
              {t(`· ${favs.length} favourited`, `· ចំណូលចិត្ត ${toKh(favs.length)}`)}
            </span>
          )}
        </h2>

        {filtered.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--ground-line)] px-4 py-8 text-center text-sm text-[var(--ink-dim)]">
            {t("No names match your search. Try a different word or clear the filters.", "រកមិនឃើញឈ្មោះត្រូវនឹងការស្វែងរកទេ។ សូមសាកពាក្យផ្សេង ឬសម្អាតតម្រង។")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map((n) => {
              const isFav = favSet.has(n.name);
              return (
                <div key={n.name} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span lang="km" className="font-khmer text-lg font-semibold text-[var(--ink)]">
                        {n.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">
                        {t(GENDER_META[n.gender].en, GENDER_META[n.gender].km)} · {t("syllables", "ព្យាង្គ")} {toKh(n.syllables)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <CopyButton text={n.name} compact />
                      <button
                        type="button"
                        onClick={() => toggleFav(n.name)}
                        aria-label={isFav ? t("Remove from favourites", "ដកចេញពីចំណូលចិត្ត") : t("Add to favourites", "បន្ថែមទៅចំណូលចិត្ត")}
                        title={isFav ? t("Remove from favourites", "ដកចេញពីចំណូលចិត្ត") : t("Add to favourites", "បន្ថែមទៅចំណូលចិត្ត")}
                        className={`rounded-md p-1.5 transition hover:bg-[var(--ground-line)]/60 ${isFav ? "text-[var(--gold)]" : "text-[var(--ink-faint)] hover:text-[var(--gold)]"}`}
                      >
                        <Star size={14} className={isFav ? "fill-[var(--gold)]" : ""} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs italic leading-relaxed text-[var(--ink-dim)]">{n.meaningEn}</p>
                  <p lang="km" className="text-xs leading-relaxed text-[var(--ink-dim)]">
                    {t("Meaning", "អត្ថន័យ")}: {n.meaningKm}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Curated illustrative list of common Khmer given names with their usual root meanings — not exhaustive and not an official or authoritative register. Gender tags are loose traditional associations; most Khmer given names are used across genders. Syllable counts are approximate (grapheme clusters). Confirm meaning and suitability with family or elders before choosing a name.",
          "បញ្ជីគំរូនៃឈ្មោះកណ្ដាលខ្មែរទូទៅ ជាមួយអត្ថន័យឫសគល់ធម្មតា — មិនពេញលេញ និងមិនមែនជាបញ្ជីផ្លូវការ ឬមានសិទ្ធិអំណាចទេ។ ការសន្មតភេទគ្រាន់តែជាទម្លាប់ប្រពៃណីរលុងៗ ឈ្មោះកណ្ដាលខ្មែរភាគច្រើនប្រើបានទាំងភេទទាំងពីរ។ ចំនួនព្យាង្គជាតម្លៃប្រហាក់ប្រហែល (រាប់តាម grapheme)។ សូមផ្ទៀងផ្ទាត់អត្ថន័យ និងភាពសមស្របជាមួយក្រុមគ្រួសារ ឬអ្នកចាស់ទុំ មុនជ្រើសរើសឈ្មោះ។"
        )}
      </p>
    </ToolShell>
  );
}
