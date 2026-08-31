"use client";
import { useRef, useState } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function readImage(file: File, setter: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => setter(String(reader.result));
  reader.readAsDataURL(file);
}

export default function ImageCompareSlider() {
  const { text: t } = useLanguage();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [pos, setPos] = useToolState("image-compare:pos", 50);
  const [beforeLabel, setBeforeLabel] = useToolState("image-compare:before-label", "Before");
  const [afterLabel, setAfterLabel] = useToolState("image-compare:after-label", "After");
  const [swapped, setSwapped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function updateFromEvent(e: React.PointerEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromEvent(e);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragging.current) updateFromEvent(e);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const left = swapped ? after : before;
  const right = swapped ? before : after;
  const leftLabel = swapped ? afterLabel : beforeLabel;
  const rightLabel = swapped ? beforeLabel : afterLabel;

  const uploadButton = "cursor-pointer rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/10 px-4 py-2 text-sm font-medium text-[var(--gold)] transition hover:bg-[var(--gold)]/20";

  return (
    <ToolShell
      title="Image Compare Slider"
      khmerTitle="ប្រៀបធៀបរូបភាព"
      description="Upload two images and drag the divider to compare them side by side. Useful for before/after shots."
      descriptionKm="បញ្ចូលរូបភាពពីរ ហើយអូសបន្ទាត់ខណ្ឌ ដើម្បីប្រៀបធៀបរូបទាំងពីរ។ មានប្រយោជន៍សម្រាប់រូបមុន/ក្រោយ។"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className={uploadButton}>
          {t("Before image", "រូបមុន")}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImage(f, setBefore); }} />
        </label>
        <label className={uploadButton}>
          {t("After image", "រូបក្រោយ")}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImage(f, setAfter); }} />
        </label>
        <Button onClick={() => setSwapped((v) => !v)} disabled={!before && !after}>{t("Swap sides", "ប្ដូរទីតាំង")}</Button>
      </div>

      <Row>
        <Field label={t("Before label", "ស្លាករូបមុន")}>
          <TextInput value={beforeLabel} onChange={(e) => setBeforeLabel(e.target.value)} />
        </Field>
        <Field label={t("After label", "ស្លាករូបក្រោយ")}>
          <TextInput value={afterLabel} onChange={(e) => setAfterLabel(e.target.value)} />
        </Field>
      </Row>

      <div
        ref={containerRef}
        className="relative h-96 w-full touch-none select-none overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {left ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={left} alt={t("Left image", "រូបខាងឆ្វេង")} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-[var(--ink-dim)]">
            {t("Upload images and drag the divider to compare.", "បញ្ចូលរូបភាព ហើយអូសបន្ទាត់ខណ្ឌដើម្បីប្រៀបធៀប។")}
          </div>
        )}
        {right && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={right} alt={t("Right image", "រូបខាងស្ដាំ")} className="absolute inset-0 h-full w-full object-cover" draggable={false} style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />
        )}
        {left && right && (
          <>
            <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
              <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.5)]" />
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--gold)] p-1 shadow-md" />
            </div>
            <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">{leftLabel}</span>
            <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">{rightLabel}</span>
          </>
        )}
      </div>
    </ToolShell>
  );
}
