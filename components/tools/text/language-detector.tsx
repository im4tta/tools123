"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const SCRIPTS: { id: string; km: string; re: RegExp }[] = [
  { id: "Khmer", km: "ខ្មែរ", re: /[\u1780-\u17FF]/ },
  { id: "Chinese", km: "ចិន", re: /[\u3400-\u4DBF\u4E00-\u9FFF]/ },
  { id: "Japanese", km: "ជប៉ុន", re: /[\u3040-\u309F\u30A0-\u30FF]/ },
  { id: "Korean", km: "កូរ៉េ", re: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/ },
  { id: "Thai", km: "ថៃ", re: /[\u0E00-\u0E7F]/ },
  { id: "Cyrillic", km: "ស៊ីរីលីក", re: /[\u0400-\u04FF]/ },
  { id: "Greek", km: "ក្រិក", re: /[\u0370-\u03FF]/ },
  { id: "Arabic", km: "អារ៉ាប់", re: /[\u0600-\u06FF]/ },
  { id: "Devanagari", km: "ទេវនាគរី", re: /[\u0900-\u097F]/ },
  { id: "Latin", km: "ឡាតាំង", re: /[\u0041-\u007A\u00C0-\u024F\u1E00-\u1EFF]/ },
];

const STOPWORDS: Record<string, string[]> = {
  English: [
    "the", "and", "of", "to", "in", "is", "that", "for", "it", "with", "as", "on", "was",
    "be", "at", "by", "are", "this", "from", "have", "or", "not", "an", "you", "your",
    "we", "they", "but", "his", "her", "has", "had", "what", "when", "where", "who",
    "which", "will", "would", "can", "could", "should", "do", "does", "did", "so", "if",
    "then", "than", "too", "very", "just", "about", "there", "their", "them", "these",
    "those", "me", "our", "us", "its", "she", "he", "him", "were", "been", "being",
  ],
  French: [
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "en", "que", "qui",
    "au", "aux", "pour", "dans", "sur", "ne", "pas", "se", "ce", "il", "elle", "nous",
    "vous", "ils", "elles", "mais", "ou", "où", "avec", "comme", "plus", "moins", "tout",
    "tous", "son", "sa", "ses", "leur", "leurs", "ont", "sont", "était", "être", "je",
    "tu", "on", "moi", "toi", "lui", "par", "aussi", "donc", "cette", "ces",
  ],
  Spanish: [
    "el", "la", "los", "las", "de", "del", "un", "una", "y", "o", "que", "es", "en",
    "por", "para", "con", "no", "se", "su", "al", "como", "más", "pero", "este", "esta",
    "estos", "estas", "hay", "tiene", "tienen", "ser", "estar", "son", "era", "me",
    "te", "lo", "le", "les", "mi", "mis", "tu", "tus", "nosotros", "ellos", "ellas",
    "cuando", "donde", "quien", "muy", "también", "sin", "sobre", "entre",
  ],
  German: [
    "der", "die", "das", "und", "ist", "nicht", "ein", "eine", "mit", "von", "zu", "den",
    "dem", "des", "für", "auf", "sie", "sich", "im", "am", "an", "als", "auch", "es",
    "ich", "wir", "ihr", "er", "du", "wie", "was", "wenn", "dass", "werden", "war",
    "hat", "haben", "noch", "nur", "aus", "bei", "über", "nach", "um", "so", "dann",
    "kann", "einer", "eines", "diese", "dieser",
  ],
  Portuguese: [
    "o", "a", "os", "as", "de", "do", "da", "um", "uma", "e", "que", "é", "em", "por",
    "para", "com", "não", "se", "na", "no", "ao", "aos", "das", "dos", "como", "mais",
    "mas", "também", "este", "esta", "esse", "essa", "isso", "ele", "ela", "eles",
    "elas", "eu", "você", "nós", "ser", "está", "são", "foi", "tem", "há", "muito",
    "já", "quando", "onde",
  ],
  Indonesian: [
    "dan", "yang", "di", "ke", "dari", "ini", "itu", "dengan", "untuk", "pada", "adalah",
    "tidak", "saya", "anda", "kami", "mereka", "ada", "atau", "karena", "akan", "sudah",
    "juga", "bisa", "dapat", "harus", "lebih", "seperti", "jika", "kalau", "masih",
    "pernah", "sedang", "setelah", "sebelum", "tentang", "tetapi", "tapi", "namun",
    "bahwa", "sehingga",
  ],
  Vietnamese: [
    "và", "của", "là", "cho", "với", "không", "những", "được", "có", "các", "này", "đó",
    "một", "người", "như", "khi", "để", "về", "từ", "đã", "sẽ", "đang", "thì", "mà",
    "còn", "ở", "tại", "vì", "nên", "phải", "rất", "hơn", "cũng", "hoặc", "nhưng",
    "trong", "trên", "sau", "trước", "giữa",
  ],
};

// Vietnamese-specific diacritic letters (lowercase) that rarely appear in other Latin scripts.
const VIET_DIACRITICS = /[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;

export default function LanguageDetector() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "language-detector:input",
    "Hello, how are you today? I hope everything is going well."
  );

  const detection = useMemo(() => {
    const raw = input.trim();
    if (!raw) return null;

    const counts = SCRIPTS.map((s) => ({
      ...s,
      count: (raw.match(new RegExp(s.re.source, "g")) ?? []).length,
    }));
    const present = counts.filter((c) => c.count > 0);
    if (present.length === 0) return { language: t("Unknown", "មិនស្គាល់"), script: null, present, mixed: false };

    const dominant = present.reduce((a, b) => (b.count > a.count ? b : a));
    const mixed = present.length > 1;

    // Non-Latin scripts are identified directly at the script level.
    if (dominant.id !== "Latin") {
      return { language: t(dominant.id, dominant.km), script: dominant.id, present, mixed };
    }

    // Latin text → score each language profile by stopword hits.
    const tokens = raw.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    const scores = Object.entries(STOPWORDS).map(([lang, words]) => {
      const set = new Set(words);
      let score = 0;
      for (const token of tokens) if (set.has(token)) score++;
      return { lang, score };
    });
    const vietBonus = (raw.match(VIET_DIACRITICS) ?? []).length;
    scores.find((s) => s.lang === "Vietnamese")!.score += vietBonus * 5;

    const best = scores.reduce((a, b) => (b.score > a.score ? b : a));
    if (best.score === 0) {
      return { language: t("Latin (unidentified)", "ឡាតាំង (មិនអាចកំណត់បាន)"), script: "Latin", present, mixed };
    }
    const kmNames: Record<string, string> = {
      English: "អង់គ្លេស",
      French: "បារាំង",
      Spanish: "អេស្ប៉ាញ",
      German: "អាល្លឺម៉ង់",
      Portuguese: "ព័រទុយហ្គាល់",
      Indonesian: "ឥណ្ឌូនេស៊ី",
      Vietnamese: "វៀតណាម",
    };
    return { language: t(best.lang, kmNames[best.lang] ?? best.lang), script: "Latin", present, mixed };
  }, [input, t]);

  return (
    <ToolShell
      title="Language Detector"
      khmerTitle="កំណត់ភាសា"
      description="Heuristically detects the language of a text from its script (Khmer, Chinese, Japanese, Korean, Thai, Cyrillic, Greek, Arabic, Devanagari, Latin) and small word profiles for major Latin-script languages."
      descriptionKm="កំណត់ភាសារបស់អត្ថបទដោយស្វ័យប្រវត្តិពីស្គ្រីប (ខ្មែរ ចិន ជប៉ុន កូរ៉េ ថៃ ស៊ីរីលីក ក្រិក អារ៉ាប់ ទេវនាគរី ឡាតាំង) និងទម្រង់ពាក្យតូចៗសម្រាប់ភាសាឡាតាំងសំខាន់ៗ។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>

      {detection ? (
        <>
          <Output label={t("Detected language", "ភាសាដែលបានកំណត់")} value={detection.language} mono={false} />
          {detection.mixed && (
            <p className="text-xs text-[var(--ink-dim)]">
              {t("Mixed scripts detected — this result is a best guess.", "បានរកឃើញស្គ្រីបចម្រុះ — លទ្ធផលនេះជាការប៉ាន់ស្មានល្អបំផុត។")}
            </p>
          )}
          <div className="space-y-1">
            {detection.present.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 font-khmer text-[var(--ink)]">{t(s.id, s.km)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-[var(--ground-raised)]">
                  <div
                    className="h-full rounded bg-[var(--gold)]"
                    style={{ width: `${(s.count / Math.max(...detection.present.map((p) => p.count))) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono-ui text-[var(--ink-dim)]">{s.count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Result is heuristic/approximate: it uses script ranges and small stopword profiles, not a statistical language model.",
              "លទ្ធផលគឺជាការប៉ាន់ស្មាន៖ វាប្រើជួរស្គ្រីប និងទម្រង់ពាក្យតូចៗ មិនមែនជាគំរូភាសាស្ថិតិទេ។"
            )}
          </p>
        </>
      ) : (
        <p className="text-sm font-medium text-[var(--gold)]">{t("Enter some text to detect its language.", "សូមបញ្ចូលអត្ថបទដើម្បីកំណត់ភាសា។")}</p>
      )}
    </ToolShell>
  );
}
