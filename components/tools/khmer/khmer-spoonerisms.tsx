"use client";
import { useMemo, useRef, useState } from "react";
import { Download, Pin, RefreshCw, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { downloadDataUrl } from "@/lib/download";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";
import { buildOptions, shuffle } from "@/lib/khmer-learning";
import { filterSpoonerisms, formatSpoonerism, SPOONERISM_CATEGORIES, SPOONERISMS, type Spoonerism, type SpoonerismCategory } from "@/lib/khmer-spoonerisms";

type Tab = "dictionary" | "quiz" | "poster";
const QUIZ_LENGTH = 10;
const MAX_POSTER = 6;
const DEFAULT_POSTER = SPOONERISMS.filter((w) => w.fromImage).map((w) => w.id).slice(0, MAX_POSTER);

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);

interface QuizQ { entry: Spoonerism; options: string[] }

export default function KhmerSpoonerisms() {
  const { text: t } = useLanguage();
  const [tab, setTab] = useToolState<Tab>("khmer-spoonerisms:tab", "dictionary");
  const [custom, setCustom] = useToolState<Spoonerism[]>("khmer-spoonerisms:custom", []);
  const [category, setCategory] = useState<SpoonerismCategory | "all">("all");
  const [query, setQuery] = useState("");

  const all = useMemo(() => [...SPOONERISMS, ...custom.map((c) => ({ ...c, custom: true }))], [custom]);
  const shown = useMemo(() => filterSpoonerisms(all, category, query), [all, category, query]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of all) m.set(w.category, (m.get(w.category) ?? 0) + 1);
    return m;
  }, [all]);
  const catLabel = (id: SpoonerismCategory) => {
    const c = SPOONERISM_CATEGORIES.find((x) => x.id === id);
    return c ? t(c.en, c.km) : id;
  };

  // ---- add your own ----
  const [newWord, setNewWord] = useState("");
  const [newSpoon, setNewSpoon] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newCat, setNewCat] = useState<SpoonerismCategory>("general");
  const addCustom = () => {
    if (!newWord.trim() || !newSpoon.trim() || !newMeaning.trim()) return;
    const id = Date.now();
    setCustom([...custom, { id, word: newWord.trim(), spoonerism: newSpoon.trim(), meaning: newMeaning.trim(), category: newCat }]);
    setNewWord(""); setNewSpoon(""); setNewMeaning("");
  };
  const removeCustom = (id: number) => setCustom(custom.filter((c) => c.id !== id));

  // ---- quiz ----
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const startQuiz = () => {
    const pool = all.filter((w) => w.meaning);
    const qs = shuffle(pool, Math.random).slice(0, QUIZ_LENGTH).map((entry) => ({
      entry,
      options: buildOptions(entry.meaning, pool.map((w) => w.meaning), 4, Math.random),
    }));
    setQuiz(qs); setQi(0); setPicked(null); setScore(0);
  };
  const answer = (opt: string) => {
    if (!quiz || picked !== null) return;
    setPicked(opt);
    if (opt === quiz[qi].entry.meaning) setScore(score + 1);
  };
  const quizDone = !!quiz && qi >= quiz.length;

  // ---- poster ----
  const [posterIds, setPosterIds] = useToolState<number[]>("khmer-spoonerisms:poster", DEFAULT_POSTER);
  const [posterNote, setPosterNote] = useState("");
  const [busy, setBusy] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const posterItems = posterIds.map((id) => all.find((w) => w.id === id)).filter((w): w is Spoonerism => !!w);
  const togglePoster = (id: number) => {
    if (posterIds.includes(id)) { setPosterIds(posterIds.filter((x) => x !== id)); setPosterNote(""); return; }
    if (posterIds.length >= MAX_POSTER) { setPosterNote(t(`You can choose up to ${MAX_POSTER} entries.`, `អ្នកអាចជ្រើសបានត្រឹម ${kh(MAX_POSTER)} ពាក្យប៉ុណ្ណោះ។`)); return; }
    setPosterIds([...posterIds, id]);
  };
  const downloadPoster = async () => {
    const node = posterRef.current;
    if (!node || posterItems.length === 0) return;
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
      const url = await watermarkImageDataUrl(canvas.toDataURL("image/png"));
      downloadDataUrl(url, `khmer-spoonerisms-${Date.now()}.png`);
      recordExport();
      setPosterNote("");
    } catch {
      setPosterNote(t("Couldn't create the image in this browser. Try again, or take a screenshot of the preview.", "មិនអាចបង្កើតរូបភាពក្នុងកម្មវិធីរុករកនេះបានទេ។ សូមសាកម្តងទៀត ឬថតអេក្រង់ការមើលជាមុន។"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell
      title="Khmer Spoonerisms"
      khmerTitle="ពាក្យគន្លាស់កាត់ខ្មែរ"
      description="Explore Khmer spoonerisms (ពាក្យគន្លាស់កាត់) — the traditional wordplay where sounds are swapped between syllables to turn a plain phrase into a playful or cheeky one. Browse and search a list of 100+ examples by category, test yourself with a quiz that asks for the real meaning behind each spoonerism, add your own, and make a shareable poster image in the classic style."
      descriptionKm="ស្វែងយល់ពាក្យគន្លាស់កាត់ខ្មែរ — ល្បែងលេងពាក្យប្រពៃណីដែលប្តូរសំឡេងរវាងព្យាង្គ ដើម្បីបំប្លែងឃ្លាធម្មតាឱ្យទៅជាឃ្លាកំប្លែង ឬដៀមដាម។ រុករក និងស្វែងរកឧទាហរណ៍ជាង ១០០ តាមប្រភេទ សាកល្បងខ្លួនឯងជាមួយល្បងប្រាជ្ញាដែលសួររកន័យពិតនៃពាក្យគន្លាស់នីមួយៗ បន្ថែមពាក្យផ្ទាល់ខ្លួន និងបង្កើតរូបភាពផ្ទាំងបដាសម្រាប់ចែករំលែកតាមបែបបុរាណ។"
    >
      <PillGroup label={t("View", "ទិដ្ឋភាព")}>
        <Pill active={tab === "dictionary"} onClick={() => setTab("dictionary")}>{t("Word list", "បញ្ជីពាក្យ")}</Pill>
        <Pill active={tab === "quiz"} onClick={() => setTab("quiz")}>{t("Quiz", "ល្បងប្រាជ្ញា")}</Pill>
        <Pill active={tab === "poster"} onClick={() => setTab("poster")}>{t("Poster image", "បង្កើតរូបភាព")}</Pill>
      </PillGroup>

      {tab === "dictionary" && (
        <div className="space-y-4">
          <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-5 text-[var(--ink-dim)]">
            {t(
              "How to read an entry: the plain phrase (real meaning) has sounds swapped between its syllables to make the spoonerism — e.g. ក្រមុំពេញសាច់ → ក្រមាច់ពេញសុំ. Entries marked with a pin come from a widely shared image; the rest have not yet been checked by a language reviewer, so some may be inaccurate.",
              "របៀបអាន៖ ឃ្លាធម្មតា (ន័យពិត) ត្រូវបានប្តូរសំឡេងរវាងព្យាង្គ ដើម្បីបង្កើតពាក្យគន្លាស់ — ឧ. ក្រមុំពេញសាច់ → ក្រមាច់ពេញសុំ។ ពាក្យដែលមានសញ្ញាខ្ទាស់មកពីរូបភាពដែលគេចែករំលែកទូលំទូលាយ ពាក្យផ្សេងទៀតមិនទាន់ត្រូវបានអ្នកជំនាញភាសាពិនិត្យនៅឡើយ ដូច្នេះខ្លះអាចមិនត្រឹមត្រូវ។",
            )}
          </p>
          <Field label="Search" labelKm="ស្វែងរក">
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} lang="km" className="font-khmer" placeholder="Search a word, spoonerism, or meaning…" />
          </Field>
          <PillGroup label={t("Category", "ប្រភេទ")}>
            <Pill active={category === "all"} onClick={() => setCategory("all")}>{t(`All (${all.length})`, `ទាំងអស់ (${kh(all.length)})`)}</Pill>
            {SPOONERISM_CATEGORIES.map((c) => (
              <Pill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{t(`${c.en} (${counts.get(c.id) ?? 0})`, `${c.km} (${kh(counts.get(c.id) ?? 0)})`)}</Pill>
            ))}
          </PillGroup>
          <p className="text-xs text-[var(--ink-faint)]" role="status">{t(`${shown.length} found`, `រកឃើញ ${kh(shown.length)} ពាក្យ`)}</p>

          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--ink-faint)]">{t("No matching words. Try another search, or add your own below.", "រកមិនឃើញពាក្យទេ។ សូមស្វែងរកពាក្យផ្សេង ឬបន្ថែមពាក្យផ្ទាល់ខ្លួនខាងក្រោម។")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((w) => (
                <div key={w.id} className="relative rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 pr-8 text-[11px]">
                    <span className="rounded border border-[var(--ground-line)] px-1.5 py-0.5 text-[var(--ink-dim)]">{catLabel(w.category)}</span>
                    {w.fromImage && <span className="flex items-center gap-1 rounded border border-[var(--gold)]/60 px-1.5 py-0.5 text-[var(--gold)]"><Pin size={10} />{t("From image", "ពីរូបភាព")}</span>}
                    {w.custom && <span className="rounded border border-[var(--teal)]/60 px-1.5 py-0.5 text-[var(--teal)]">{t("Added by you", "អ្នកបានបន្ថែម")}</span>}
                    {!w.fromImage && !w.custom && <span className="rounded px-1.5 py-0.5 text-[var(--ink-faint)]">{t("Unverified", "មិនទាន់ផ្ទៀងផ្ទាត់")}</span>}
                  </div>
                  <p lang="km" className="font-moul text-lg leading-relaxed text-[var(--ink)]">{w.word}</p>
                  <dl lang="km" className="mt-2 space-y-1.5 font-khmer text-sm">
                    <div><dt className="text-xs text-[var(--ink-faint)]">{t("Spoonerism", "គន្លាស់")}</dt><dd className="font-semibold text-[var(--gold)]">{w.spoonerism}</dd></div>
                    <div><dt className="text-xs text-[var(--ink-faint)]">{t("Real meaning", "ន័យពិត")}</dt><dd className="text-[var(--ink)]">{w.meaning}</dd></div>
                  </dl>
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <CopyButton text={formatSpoonerism(w)} compact className="border-0 bg-transparent" />
                    {w.custom && (
                      <button type="button" onClick={() => removeCustom(w.id)} className="p-1 text-[var(--ink-faint)] hover:text-[var(--danger)]" aria-label={t(`Delete ${w.word}`, `លុប ${w.word}`)}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="space-y-3 rounded-md border border-[var(--ground-line)] p-4" onSubmit={(e) => { e.preventDefault(); addCustom(); }}>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Add your own", "បន្ថែមពាក្យផ្ទាល់ខ្លួន")}</p>
            <Row>
              <Field label="Headword" labelKm="ពាក្យដើម">
                <TextInput value={newWord} onChange={(e) => setNewWord(e.target.value)} lang="km" className="font-khmer" placeholder="e.g. ក្រមុំក្រមាច់" autoComplete="off" />
              </Field>
              <Field label="Spoonerism" labelKm="ការគន្លាស់">
                <TextInput value={newSpoon} onChange={(e) => setNewSpoon(e.target.value)} lang="km" className="font-khmer" placeholder="e.g. ក្រមាច់ពេញសុំ" autoComplete="off" />
              </Field>
              <Field label="Real meaning" labelKm="ន័យពិត">
                <TextInput value={newMeaning} onChange={(e) => setNewMeaning(e.target.value)} lang="km" className="font-khmer" placeholder="e.g. ក្រមុំពេញសាច់" autoComplete="off" />
              </Field>
              <Field label="Category" labelKm="ប្រភេទ">
                <Select value={newCat} onChange={(e) => setNewCat(e.target.value as SpoonerismCategory)}>
                  {SPOONERISM_CATEGORIES.filter((c) => c.id !== "image").map((c) => <option key={c.id} value={c.id}>{t(c.en, c.km)}</option>)}
                </Select>
              </Field>
            </Row>
            <Button type="submit" disabled={!newWord.trim() || !newSpoon.trim() || !newMeaning.trim()}>{t("Save", "រក្សាទុក")}</Button>
            <p className="text-xs text-[var(--ink-faint)]">{t("Your words are saved in this browser only.", "ពាក្យរបស់អ្នករក្សាទុកតែក្នុងកម្មវិធីរុករកនេះប៉ុណ្ណោះ។")}</p>
          </form>
        </div>
      )}

      {tab === "quiz" && (
        <div className="mx-auto max-w-2xl space-y-4">
          {!quiz ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-[var(--ink-dim)]">{t(`Can you work out the real meaning behind each spoonerism? ${QUIZ_LENGTH} questions.`, `តើអ្នកអាចទាយន័យពិតនៃពាក្យគន្លាស់នីមួយៗបានទេ? សំណួរ ${kh(QUIZ_LENGTH)}។`)}</p>
              <Button onClick={startQuiz}>{t("Start quiz", "ចាប់ផ្តើមលេង")}</Button>
            </div>
          ) : quizDone ? (
            <div className="space-y-3 text-center" role="status">
              <p className="text-lg text-[var(--ink)]">{t(`You scored ${score}/${quiz.length}.`, `អ្នកទទួលបានពិន្ទុ ${kh(score)}/${kh(quiz.length)}។`)}</p>
              <Button onClick={startQuiz}>{t("Play again", "លេងម្តងទៀត")}</Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm text-[var(--ink-dim)]">
                <span>{t(`Question ${qi + 1}/${quiz.length}`, `សំណួរទី ${kh(qi + 1)}/${kh(quiz.length)}`)}</span>
                <span>{t(`Score: ${score}`, `ពិន្ទុ៖ ${kh(score)}`)}</span>
              </div>
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
                <p className="mb-1 text-xs text-[var(--ink-faint)]">{t("Decode this spoonerism:", "បកស្រាយពាក្យគន្លាស់៖")}</p>
                <p lang="km" className="font-moul text-2xl leading-relaxed text-[var(--ink)]">{quiz[qi].entry.word}</p>
                <p lang="km" className="mt-2 border-t border-[var(--ground-line)] pt-2 font-khmer text-lg text-[var(--gold)]">“{quiz[qi].entry.spoonerism}”</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {quiz[qi].options.map((o) => {
                  const correct = o === quiz[qi].entry.meaning;
                  const state = picked === null ? "idle" : correct ? "right" : o === picked ? "wrong" : "idle";
                  return (
                    <button
                      key={o}
                      type="button"
                      lang="km"
                      disabled={picked !== null}
                      onClick={() => answer(o)}
                      className={`rounded-md border p-3 text-left font-khmer transition ${state === "right" ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--ink)]" : state === "wrong" ? "border-[var(--danger)]/60 bg-[var(--danger)]/10 text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink)] hover:border-[var(--ink-faint)]"}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {picked !== null && (
                <div className="flex flex-wrap items-center gap-3" role="status">
                  <p className="text-sm text-[var(--ink-dim)]">
                    {picked === quiz[qi].entry.meaning ? t("Correct!", "ត្រឹមត្រូវ!") : <>{t("Not quite — the answer is", "មិនត្រឹមត្រូវ — ចម្លើយគឺ")} <span lang="km" className="font-khmer text-[var(--ink)]">{quiz[qi].entry.meaning}</span></>}
                  </p>
                  <Button onClick={() => { setQi(qi + 1); setPicked(null); }}>{qi + 1 >= quiz.length ? t("See score", "មើលពិន្ទុ") : t("Next", "បន្ទាប់")}</Button>
                </div>
              )}
              <PillAction onClick={startQuiz}><RefreshCw size={13} />{t("Restart", "ចាប់ផ្តើមឡើងវិញ")}</PillAction>
            </>
          )}
        </div>
      )}

      {tab === "poster" && (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(`Choose up to ${MAX_POSTER} entries (${posterItems.length}/${MAX_POSTER})`, `ជ្រើសរើសរហូតដល់ ${kh(MAX_POSTER)} ពាក្យ (${kh(posterItems.length)}/${kh(MAX_POSTER)})`)}</p>
            <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border border-[var(--ground-line)] p-2">
              {[...all].sort((a, b) => Number(!!b.fromImage) - Number(!!a.fromImage)).map((w) => (
                <label key={w.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[var(--ground-raised)]">
                  <input type="checkbox" checked={posterIds.includes(w.id)} onChange={() => togglePoster(w.id)} className="h-4 w-4 accent-[var(--gold)]" />
                  <span lang="km" className="flex-1 font-khmer text-[var(--ink)]">{w.word}</span>
                  {w.fromImage && <Pin size={12} className="text-[var(--gold)]" aria-hidden />}
                </label>
              ))}
            </div>
            {posterNote && <p className="text-sm text-[var(--danger)]" role="alert">{posterNote}</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadPoster} disabled={busy || posterItems.length === 0} className="flex items-center gap-2"><Download size={15} />{busy ? t("Creating…", "កំពុងបង្កើត…") : t("Download PNG", "ទាញយករូបភាព (PNG)")}</Button>
              <PillAction onClick={() => { setPosterIds(DEFAULT_POSTER); setPosterNote(""); }}><RefreshCw size={13} />{t("Reset to image entries", "កំណត់ទៅពាក្យក្នុងរូបភាពវិញ")}</PillAction>
            </div>
          </div>

          <div className="flex justify-center lg:col-span-7">
            <div ref={posterRef} id="khmer-spoonerism-poster" className="flex aspect-[3/4] w-full max-w-[450px] flex-col p-7">
              <h2 lang="km" className="spoonerism-poster-title mb-6 text-center font-moul text-3xl sm:text-4xl">ពាក្យគន្លាស់កាត់</h2>
              <ol className="flex flex-1 flex-col gap-4">
                {posterItems.map((w, i) => (
                  <li key={w.id} lang="km" className="spoonerism-poster-item font-khmer text-base font-bold leading-relaxed sm:text-lg">
                    {kh(i + 1)}. {formatSpoonerism(w)}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        #khmer-spoonerism-poster {
          position: relative;
          border-radius: 2px;
          background-color: #dcb383;
          /* Vignette as a gradient rather than an inset shadow: html2canvas draws inset shadows as a solid band. */
          background-image: radial-gradient(circle farthest-corner at center, #dcb383 62%, #cda470 100%);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        }
        .spoonerism-poster-title {
          color: #d94848;
          letter-spacing: 1px;
          text-shadow: -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, -3px 0 0 #fff, 3px 0 0 #fff, 0 -3px 0 #fff, 0 3px 0 #fff, 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        .spoonerism-poster-item {
          color: #2b3d68;
          text-shadow: -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      <SourceCredits>
        <p>{t(
          "Adapted from a standalone Khmer Spoonerisms app contributed by the site owner (word list, quiz, and poster design). The six pinned entries reproduce a widely shared image of Khmer spoonerisms whose original author is unknown — Provenance Pending; if you know the source, please tell us so we can credit it. The remaining entries came with the contributed app and have not been reviewed by a Khmer language expert. The poster keeps the original's kraft-paper colours and outlined lettering, using the site's Moul font. Everything runs in your browser; words you add stay in this browser.",
          "កែសម្រួលពីកម្មវិធីពាក្យគន្លាស់កាត់ខ្មែរដាច់ដោយឡែក ដែលម្ចាស់គេហទំព័របានផ្តល់ (បញ្ជីពាក្យ ល្បងប្រាជ្ញា និងការរចនាផ្ទាំងរូបភាព)។ ពាក្យទាំងប្រាំមួយដែលមានសញ្ញាខ្ទាស់ ចម្លងពីរូបភាពពាក្យគន្លាស់ខ្មែរដែលគេចែករំលែកទូលំទូលាយ ដែលមិនស្គាល់អ្នកនិពន្ធដើម — ប្រភពកំពុងរង់ចាំការផ្ទៀងផ្ទាត់ ប្រសិនបើអ្នកដឹងប្រភព សូមប្រាប់យើងដើម្បីផ្តល់កិត្តិយស។ ពាក្យផ្សេងទៀតភ្ជាប់មកជាមួយកម្មវិធីនោះ ហើយមិនទាន់ត្រូវបានអ្នកជំនាញភាសាខ្មែរពិនិត្យទេ។ ផ្ទាំងរូបភាពរក្សាពណ៌ក្រដាសកាដុង និងអក្សរមានគែមតាមដើម ដោយប្រើពុម្ពអក្សរ Moul របស់គេហទំព័រ។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក ពាក្យដែលអ្នកបន្ថែមនៅតែក្នុងកម្មវិធីរុករកនេះ។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
