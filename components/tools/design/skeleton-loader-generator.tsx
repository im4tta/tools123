"use client";
import { useMemo } from "react";
import { ToolShell, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function SkeletonLoaderGenerator() {
  const { text: t } = useLanguage();
  const [showAvatar, setShowAvatar] = useToolState("skeleton-loader:avatar", true);
  const [showCard, setShowCard] = useToolState("skeleton-loader:card", true);
  const [showButton, setShowButton] = useToolState("skeleton-loader:button", true);
  const [linesStr, setLinesStr] = useToolState("skeleton-loader:lines", "3");
  const [baseColor, setBaseColor] = useToolState("skeleton-loader:base", "#e2e5e9");
  const [shimmerColor, setShimmerColor] = useToolState("skeleton-loader:shimmer", "#f8f9fa");
  const [durationStr, setDurationStr] = useToolState("skeleton-loader:duration", "1.5");

  const lines = Math.max(0, Math.min(12, Number(linesStr) || 0));
  const duration = Math.max(0.2, Math.min(10, Number(durationStr) || 1.5));

  const css = useMemo(() => {
    const base = [
      `.sk {`,
      `  position: relative;`,
      `  overflow: hidden;`,
      `  background: ${baseColor};`,
      `  border-radius: 6px;`,
      `}`,
      `.sk::after {`,
      `  content: "";`,
      `  position: absolute;`,
      `  inset: 0;`,
      `  transform: translateX(-100%);`,
      `  background: linear-gradient(90deg, transparent, ${shimmerColor}, transparent);`,
      `  animation: sk-shimmer ${duration}s infinite;`,
      `}`,
      `@keyframes sk-shimmer {`,
      `  100% { transform: translateX(100%); }`,
      `}`,
    ].join("\n");
    const blocks = [
      showAvatar ? `.sk-avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n}` : "",
      lines > 0 ? `.sk-line {\n  height: 12px;\n  border-radius: 6px;\n  margin-bottom: 10px;\n}` : "",
      showCard ? `.sk-card {\n  height: 96px;\n  border-radius: 12px;\n}` : "",
      showButton ? `.sk-button {\n  width: 120px;\n  height: 36px;\n  border-radius: 8px;\n}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return blocks ? `${base}\n\n${blocks}` : base;
  }, [baseColor, shimmerColor, duration, showAvatar, showCard, showButton, lines]);

  const lineWidths = ["100%", "85%", "60%"];

  const checkbox = "h-4 w-4 accent-[var(--gold)]";
  const colorInput = "h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1";

  return (
    <ToolShell
      title="Skeleton Loader Generator"
      khmerTitle="បង្កើត Skeleton Loader"
      description="Compose a skeleton loading screen from avatar, lines, card and button blocks, then copy the shimmer CSS."
      descriptionKm="ផ្គុំអេក្រង់ផ្ទុក skeleton ពីប្លុក avatar បន្ទាត់ កាត និងប៊ូតុង រួចចម្លងកូដ CSS shimmer។"
    >
      <Row>
        <Field label={t("Blocks", "ប្លុក")}>
          <div className="flex h-9 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--ink)]">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showAvatar} onChange={(e) => setShowAvatar(e.target.checked)} className={checkbox} />
              {t("Avatar", "Avatar")}
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showCard} onChange={(e) => setShowCard(e.target.checked)} className={checkbox} />
              {t("Card", "កាត")}
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showButton} onChange={(e) => setShowButton(e.target.checked)} className={checkbox} />
              {t("Button", "ប៊ូតុង")}
            </label>
          </div>
        </Field>
        <Field label={t("Text lines", "បន្ទាត់អត្ថបទ")}>
          <input type="range" min={0} max={8} step={1} value={lines} onChange={(e) => setLinesStr(e.target.value)} className="w-full accent-[var(--gold)]" />
          <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{lines}</div>
        </Field>
        <Field label={t("Base color", "ពណ៌មូលដ្ឋាន")}>
          <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className={colorInput} />
        </Field>
        <Field label={t("Shimmer color", "ពណ៌ shimmer")}>
          <input type="color" value={shimmerColor} onChange={(e) => setShimmerColor(e.target.value)} className={colorInput} />
        </Field>
        <Field label={t("Duration (s)", "រយៈពេល (វិនាទី)")}>
          <input type="range" min={0.5} max={4} step={0.25} value={duration} onChange={(e) => setDurationStr(e.target.value)} className="w-full accent-[var(--gold)]" />
          <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{duration}s</div>
        </Field>
      </Row>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <style>{css}</style>
        <div className="mx-auto max-w-md">
          {showAvatar && (
            <div className="mb-4 flex items-center gap-3">
              <div className="sk sk-avatar shrink-0" />
              <div className="flex-1">
                <div className="sk sk-line" style={{ width: "60%" }} />
                <div className="sk sk-line" style={{ width: "40%" }} />
              </div>
            </div>
          )}
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="sk sk-line" style={{ width: lineWidths[i % lineWidths.length] }} />
          ))}
          {showCard && <div className="sk sk-card mt-4" />}
          {showButton && <div className="sk sk-button mt-4" />}
          {!showAvatar && lines === 0 && !showCard && !showButton && (
            <p className="py-8 text-center text-sm text-[var(--ink-dim)]">{t("Select at least one block to build the skeleton.", "សូមជ្រើសរើសយ៉ាងហោចណាស់មួយប្លុកដើម្បីបង្កើត skeleton។")}</p>
          )}
        </div>
      </div>

      <Output label={t("CSS", "កូដ CSS")} value={css} />
    </ToolShell>
  );
}
