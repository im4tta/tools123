"use client";
// Header button on tool pages: makes a PNG card for the tool (name in English and Khmer, what it does, a QR code to
// the tool and the site watermark) and offers Save, Share (Web Share with the image, where supported) and Copy link.
// The card is drawn by lib/glossary-card, the same renderer the glossaries use, so all shared cards look alike.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link2, Share2, X } from "lucide-react";
import { Download, Send } from "jiggicons-react";
import { MotionIcon } from "@/components/ui/MotionIcon";
import { useLanguage } from "@/components/LanguageProvider";
import { useClipboard } from "@/components/ClipboardProvider";
import { downloadBlob } from "@/lib/download";
import { recordExport } from "@/lib/export";
import { SITE_DOMAIN } from "@/lib/site";
import { toast } from "@/lib/toast";
import { toKhmerToolTitle } from "@/lib/tool-title-km";
import { toolHref } from "@/lib/toolRoutes";

export interface ShareToolInfo {
  id: string;
  title: string;
  khmerTitle?: string;
  categoryLabel: string;
  categoryKhmer: string;
  /** What the tool does, in English and Khmer (the FAQ blurb). */
  what: { en: string; km: string };
}

function readFonts(): { latin: string; khmer: string } {
  const probe = document.createElement("span");
  probe.className = "font-khmer";
  probe.textContent = "ក";
  document.body.appendChild(probe);
  const khmer = getComputedStyle(probe).fontFamily;
  probe.remove();
  return { latin: getComputedStyle(document.body).fontFamily, khmer };
}

export function ShareToolButton({ tool }: { tool: ShareToolInfo }) {
  const { text: t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("Share this tool", "ចែករំលែកឧបករណ៍នេះ")}
        title={t("Share this tool", "ចែករំលែកឧបករណ៍នេះ")}
        className="tool-route-icon flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]"
      >
        <MotionIcon icon={Send} size={15} />
      </button>
      {open && <ShareToolSheet tool={tool} onClose={() => setOpen(false)} />}
    </>
  );
}

function ShareToolSheet({ tool, onClose }: { tool: ShareToolInfo; onClose: () => void }) {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const link = `${window.location.origin}${toolHref(tool.id)}`;
  const fileName = `${tool.id}-123toolbox.png`;

  useEffect(() => {
    let cancelled = false;
    let made: string | undefined;
    (async () => {
      try {
        const { renderGlossaryCard } = await import("@/lib/glossary-card");
        const blob = await renderGlossaryCard({
          term: tool.title,
          termKm: tool.khmerTitle ?? toKhmerToolTitle(tool.title),
          tag: `${tool.categoryLabel} / ${tool.categoryKhmer}`,
          blocks: [
            { text: tool.what.en, lang: "en" },
            ...(tool.what.km && tool.what.km !== tool.what.en ? [{ text: tool.what.km, lang: "km" as const, muted: true }] : []),
          ],
          title: "123 Toolbox · ឧបករណ៍ឥតគិតថ្លៃក្នុងកម្មវិធីរុករក",
          url: link,
          urlLabel: new URL(link).host + toolHref(tool.id),
          scanLabel: "Scan to open this tool · ស្កេនដើម្បីបើកឧបករណ៍នេះ",
          moreLabel: "more at the link · បន្ថែមនៅតំណ",
          watermark: SITE_DOMAIN,
          fonts: readFonts(),
        });
        if (cancelled) return;
        made = URL.createObjectURL(blob);
        setCard({ blob, url: made });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [tool, link]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    if (!card) return;
    downloadBlob(card.blob, fileName);
    toast(t("Image saved.", "បានរក្សាទុករូបភាព។"));
    recordExport();
  };

  const file = card ? new File([card.blob], fileName, { type: "image/png" }) : null;
  const canShareFile = typeof navigator !== "undefined" && !!file && !!navigator.canShare?.({ files: [file] });
  const share = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: tool.title, text: link });
      recordExport();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast(t("Could not share the image.", "មិនអាចចែករំលែករូបភាពបានទេ។"), "error");
    }
  };

  const action = "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ground-line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ground)] disabled:opacity-50";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label={t("Close", "បិទ")} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-tool-title"
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-elev)] sm:max-w-md sm:rounded-[28px]"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="share-tool-title" className="text-base font-semibold text-[var(--ink)]">{t("Share this tool", "ចែករំលែកឧបករណ៍នេះ")}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t("Close", "បិទ")} className="rounded-full bg-[var(--ground)] p-2 text-[var(--ink-dim)] hover:text-[var(--ink)]">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--ink-dim)]">{t("An image with a QR code that opens this tool.", "រូបភាពមានកូដ QR ដែលបើកឧបករណ៍នេះ។")}</p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[var(--ground)]">
          {card ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.url} alt={t(`Share card for ${tool.title}`, `កាតចែករំលែកសម្រាប់ ${tool.khmerTitle ?? tool.title}`)} className="block h-auto w-full" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center text-sm text-[var(--ink-faint)]">
              {failed ? t("Could not create the image.", "មិនអាចបង្កើតរូបភាពបានទេ។") : t("Making image…", "កំពុងបង្កើតរូបភាព…")}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={save} disabled={!card} className={action}>
            <MotionIcon icon={Download} size={15} /> {t("Save PNG", "រក្សាទុក PNG")}
          </button>
          {canShareFile && (
            <button type="button" onClick={() => void share()} className={action}>
              <Share2 size={15} aria-hidden /> {t("Share", "ចែករំលែក")}
            </button>
          )}
          <button type="button" onClick={() => void copyText(link)} className={`${action} ${canShareFile ? "" : "sm:col-span-2"}`}>
            <Link2 size={15} aria-hidden /> {t("Copy link", "ចម្លងតំណ")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
