"use client";

import { useEffect } from "react";
import { catchError, type ErrorInfo } from "next/error";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunk-errors";

function ToolCrash({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { text: t } = useLanguage();
  const chunk = isChunkLoadError(error);
  const message = error instanceof Error ? error.message : "";
  // A stale deploy's chunk is fixed by one automatic reload; the card covers the case where that
  // already happened (offline, or the chunk is really missing).
  useEffect(() => { if (chunk) reloadOnceForChunkError(); }, [chunk]);
  return (
    <div role="alert" className="mx-auto max-w-6xl rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-5 text-sm text-[var(--ink)]">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-[var(--danger)]" size={18} aria-hidden="true" />
        <div className="min-w-0 space-y-2">
          <p className="font-medium">
            {chunk
              ? t("This tool could not be downloaded. Check your connection, or reload to get the latest version.", "មិនអាចទាញយកឧបករណ៍នេះបានទេ។ សូមពិនិត្យការតភ្ជាប់ ឬផ្ទុកឡើងវិញដើម្បីទទួលបានកំណែចុងក្រោយ។")
              : t("Something went wrong in this tool. The rest of the page still works.", "មានបញ្ហាកើតឡើងក្នុងឧបករណ៍នេះ។ ផ្នែកផ្សេងទៀតនៃទំព័រនៅតែដំណើរការ។")}
          </p>
          {!chunk && message && <p className="break-words font-mono-ui text-xs text-[var(--ink-dim)]">{message}</p>}
          <button
            type="button"
            onClick={onRetry}
            className="ui-touch inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)]"
          >
            <RotateCcw size={13} aria-hidden="true" />
            {chunk ? t("Reload page", "ផ្ទុកទំព័រឡើងវិញ") : t("Try again", "សាកល្បងម្តងទៀត")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Error boundary around a single tool, so one misbehaving tool shows a bilingual retry card
 * instead of blanking the page. A failed chunk download needs a real reload: React.lazy keeps
 * the rejected import, so re-rendering alone would fail again.
 */
export const ToolErrorBoundary = catchError((_props: object, { error, reset }: ErrorInfo) => (
  <ToolCrash error={error} onRetry={() => (isChunkLoadError(error) ? window.location.reload() : reset())} />
));
