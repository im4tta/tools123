// Cross-links inside glossary definitions: finds other entries' Khmer headwords in a definition so they can be tapped.
// Khmer has no spaces, so a match must not split a written syllable: it may not start right after a coeng (្) or end right
// before a dependent vowel, sign or coeng. Short headwords (fewer than minLength code points, default 6) are skipped to avoid noise.

export interface LinkTarget {
  id: string;
  km: string;
}

export type LinkPiece = string | { text: string; id: string };

const COMBINING = /[ា-៓៝]/;
const COENG = "្";

/** The Khmer forms a headword can appear as: "ក/ខ" and "ក ឬ ខ" give both; text in brackets is dropped. */
export function headwordForms(km: string): string[] {
  return km
    .replace(/\(.*?\)/g, " ")
    .split(/\/|\s+ឬ\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildLinker(targets: LinkTarget[], minLength = 6): (text: string, selfId: string) => LinkPiece[] {
  const forms: { form: string; id: string }[] = [];
  const seen = new Set<string>();
  for (const t of targets) {
    for (const form of headwordForms(t.km)) {
      if ([...form].length < minLength || seen.has(form)) continue;
      seen.add(form);
      forms.push({ form, id: t.id });
    }
  }
  forms.sort((a, b) => b.form.length - a.form.length);
  // Bucket by first character so each position only tries the headwords that could start there.
  const byFirst = new Map<string, { form: string; id: string }[]>();
  for (const f of forms) {
    const bucket = byFirst.get(f.form[0]);
    if (bucket) bucket.push(f);
    else byFirst.set(f.form[0], [f]);
  }

  return (text, selfId) => {
    const pieces: LinkPiece[] = [];
    const used = new Set<string>([selfId]);
    let plain = "";
    let i = 0;
    while (i < text.length) {
      let hit: { form: string; id: string } | undefined;
      if (text[i - 1] !== COENG && !COMBINING.test(text[i])) {
        hit = byFirst.get(text[i])?.find((f) => !used.has(f.id) && text.startsWith(f.form, i) && !COMBINING.test(text[i + f.form.length] ?? "") && text[i + f.form.length] !== COENG);
      }
      if (hit) {
        if (plain) pieces.push(plain);
        plain = "";
        pieces.push({ text: hit.form, id: hit.id });
        used.add(hit.id);
        i += hit.form.length;
      } else {
        plain += text[i];
        i += 1;
      }
    }
    if (plain) pieces.push(plain);
    return pieces;
  };
}
