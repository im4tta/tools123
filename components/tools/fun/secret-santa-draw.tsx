"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Gift, RefreshCw } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const MAX_PARTICIPANTS = 25;

/** Random permutation with no fixed points (nobody gives a gift to themselves). */
function derangement(n: number): number[] {
  if (n < 2) return [0];
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let tries = 0; tries < 2000; tries++) {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    if (idx.every((v, i) => v !== i)) return idx;
  }
  // Guaranteed fallback: rotate everyone one seat over.
  return idx.map((_, i) => (i + 1) % n);
}

export default function SecretSantaDraw() {
  const { text: t } = useLanguage();
  const [namesInput, setNamesInput] = useToolState(
    "secret-santa:names",
    "Sokha\nDara\nSreypov\nRithy\nMalis"
  );
  const [recipients, setRecipients] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [hidden, setHidden] = useState(true);

  const names = useMemo(
    () => namesInput.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, MAX_PARTICIPANTS),
    [namesInput]
  );
  const extra = useMemo(
    () => namesInput.split("\n").map((s) => s.trim()).filter(Boolean).length - names.length,
    [namesInput, names.length]
  );
  const canDraw = names.length >= 2;

  const drawNext = () => {
    if (finished) {
      if (!canDraw) return;
      setRecipients(derangement(names.length));
      setRevealed(1);
      setHidden(false);
      return;
    }
    if (recipients.length !== names.length) {
      setRecipients(derangement(names.length));
      setRevealed(1);
      setHidden(false);
      return;
    }
    if (revealed < names.length) {
      setRevealed((r) => r + 1);
      setHidden(false);
    }
  };

  const reshuffle = () => {
    if (!canDraw || (revealed > 0 && !finished)) return;
    setRecipients(derangement(names.length));
    setRevealed(0);
    setHidden(true);
  };

  const started = recipients.length === names.length && names.length > 0;
  const finished = started && revealed >= names.length;
  const canReshuffle = !started || revealed === 0 || finished;
  // Show the newest pair while it is not hidden — including the very last one.
  const current = started && revealed > 0 && !hidden ? revealed - 1 : -1;
  const giver = current >= 0 ? names[current] : "";
  const recipient = current >= 0 ? names[recipients[current]] : "";

  const csv = useMemo(() => {
    if (!started) return "";
    const lines = ["Giver,Recipient"];
    for (let i = 0; i < names.length; i++) {
      lines.push(`${names[i]},${names[recipients[i]]}`);
    }
    return lines.join("\n");
  }, [started, names, recipients]);

  return (
    <ToolShell
      title="Secret Santa Draw"
      khmerTitle="គូរឈ្មោះសម្ងាត់"
      description="Draw Secret Santa pairs one at a time so each giver learns their recipient privately — then copy the full list as CSV."
      descriptionKm="គូរឈ្មោះសម្ងាត់ម្តងមួយគូ ដើម្បីឲ្យអ្នកឲ្យអំណោយម្នាក់ៗដឹងអ្នកទទួលតែឯង — រួចចម្លងបញ្ជីទាំងមូលជា CSV។"
    >
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Nobody ever gives a gift to themselves. Each result is shown one at a time — keep it secret until the reveal party!", "គ្មាននរណាឲ្យអំណោយដល់ខ្លួនឯងទេ។ លទ្ធផលនីមួយៗបង្ហាញម្តងមួយ — សូមរក្សាការសម្ងាត់រហូតដល់ថ្ងៃបង្ហាញ!")}
      </div>

      <Field
        label={t("Participant names (one per line)", "ឈ្មោះអ្នកចូលរួម (មួយក្នុងមួយបន្ទាត់)")}
        hint="up to 25"
        hintKm="រហូតដល់ ២៥"
      >
        <TextArea
          rows={6}
          value={namesInput}
          onChange={(e) => {
            setNamesInput(e.target.value);
            setRecipients([]);
            setRevealed(0);
            setHidden(true);
          }}
          placeholder={t("Sokha\nDara\nSreypov", "Sokha\nDara\nSreypov")}
        />
      </Field>

      {extra > 0 && (
        <p className="text-xs text-[var(--danger)]">
          {t(`Only the first 25 names are used (${extra} extra line(s) ignored).`, `ប្រើតែឈ្មោះ ២៥ ដំបូងប៉ុណ្ណោះ (បន្ទាត់លើស ${extra} ត្រូវបានរំលង)។`)}
        </p>
      )}

      {!canDraw ? (
        <div className="rounded-md border border-dashed border-[var(--ground-line)] p-6 text-center text-sm text-[var(--ink-faint)]">
          {t("Add at least 2 names to start the draw.", "បន្ថែមឈ្មោះយ៉ាងតិច ២ ដើម្បីចាប់ផ្ដើមគូរ។")}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" onClick={drawNext} className="w-full sm:w-auto">
              <Gift size={15} className="mr-1 inline" />
              {finished
                ? t("New draw", "គូរឡើងវិញ")
                : revealed === 0
                  ? t("Start the draw", "ចាប់ផ្ដើមគូរ")
                  : t("Reveal next pair", "បង្ហាញគូបន្ទាប់")}
            </Button>
            {started && (
              <Button
                type="button"
                onClick={reshuffle}
                disabled={!canReshuffle}
                className="!bg-[var(--ground-raised)] !text-[var(--ink)]"
                title={!canReshuffle ? t("Finish or hide the current draw first", "សូមបញ្ចប់ ឬលាក់ការគូរបច្ចុប្បន្នសិន") : undefined}
              >
                <RefreshCw size={14} className="mr-1 inline" />
                {t("Shuffle all", "សាប់ទាំងអស់")}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--ink-dim)]">
            <span>
              {t("Participants", "អ្នកចូលរួម")}: {names.length}
            </span>
            {started && (
              <span>
                {t("Revealed", "បានបង្ហាញ")}: {Math.min(revealed, names.length)} / {names.length}
              </span>
            )}
          </div>

          {started && (
            <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-6 text-center">
              {!hidden && current >= 0 ? (
                <>
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                    {t("You draw", "អ្នកគូរបាន")}
                  </div>
                  <p className="mt-2 font-display text-xl leading-relaxed text-[var(--ink)]">
                    <span className="font-semibold text-[var(--gold)]">{giver}</span>{" "}
                    {t("gives a gift to", "ឲ្យអំណោយដល់")}{" "}
                    <span className="font-semibold text-[var(--gold)]">{recipient}</span>
                  </p>
                  {finished && (
                    <p className="mt-3 text-sm text-[var(--ink-dim)]">
                      {t("Everyone has drawn — happy gift giving!", "អ្នកគ្រប់គ្នាបានគូររួចរាល់ — សូមរីករាយជាមួយការឲ្យអំណោយ!")}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button
                      type="button"
                      onClick={() => setHidden(true)}
                      className="!bg-[var(--ground-raised)] !text-[var(--ink)]"
                    >
                      <EyeOff size={14} className="mr-1 inline" />
                      {t("Hide result", "លាក់លទ្ធផល")}
                    </Button>
                    {!finished && (
                      <Button type="button" onClick={drawNext}>
                        <Eye size={14} className="mr-1 inline" />
                        {t("Next person", "មនុស្សបន្ទាប់")}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-[var(--ink-dim)]">
                    {finished
                      ? t("Everyone has drawn — happy gift giving!", "អ្នកគ្រប់គ្នាបានគូររួចរាល់ — សូមរីករាយជាមួយការឲ្យអំណោយ!")
                      : revealed === 0
                        ? t("Press start when everyone is ready.", "ចុចចាប់ផ្ដើម ពេលអ្នកគ្រប់គ្នារួចរាល់។")
                        : t("Result hidden. Pass the device to the next person.", "លទ្ធផលត្រូវបានលាក់។ សូមហុចទូរស័ព្ទទៅមនុស្សបន្ទាប់។")}
                  </p>
                  {!finished && revealed > 0 && (
                    <Button type="button" onClick={drawNext}>
                      <Eye size={14} className="mr-1 inline" />
                      {t("Reveal next pair", "បង្ហាញគូបន្ទាប់")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {started && (
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                  {t("Full list (CSV)", "បញ្ជីទាំងមូល (CSV)")}
                </div>
                <CopyButton text={csv} />
              </div>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono-ui text-xs text-[var(--ink-dim)]">{csv}</pre>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-faint)]">
                {t("CSV shows every giver and recipient — share it only with the organizer until gifts are exchanged.", "CSV បង្ហាញអ្នកឲ្យ និងអ្នកទទួលទាំងអស់ — សូមចែករំលែកតែជាមួយអ្នករៀបចំរហូតដល់ថ្ងៃដោះដូរអំណោយ។")}
              </p>
            </div>
          )}
        </>
      )}
    </ToolShell>
  );
}
