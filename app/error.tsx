"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunk-errors";

export default function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { text: t } = useLanguage();
  const chunk = isChunkLoadError(error);

  useEffect(() => {
    // A chunk from an older deploy: one reload fetches the current build.
    if (chunk) reloadOnceForChunkError();
    else console.error(error);
  }, [chunk, error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-24">
      <div role="alert" className="w-full max-w-md rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
        <AlertTriangle className="mx-auto text-[var(--danger)]" size={28} aria-hidden="true" />
        <h1 className="mt-3 font-display text-lg font-semibold text-[var(--ink)]">{t("Something went wrong", "មានបញ្ហាកើតឡើង")}</h1>
        <p className="mt-2 text-sm text-[var(--ink-dim)]">
          {chunk
            ? t("Part of the page could not be downloaded. Check your connection and try again.", "មិនអាចទាញយកផ្នែកខ្លះនៃទំព័របានទេ។ សូមពិនិត្យការតភ្ជាប់ ហើយសាកល្បងម្តងទៀត។")
            : t("This page hit an unexpected error. Your saved data is safe.", "ទំព័រនេះជួបកំហុសដែលមិនបានរំពឹងទុក។ ទិន្នន័យដែលបានរក្សាទុករបស់អ្នកនៅតែមានសុវត្ថិភាព។")}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => (chunk ? window.location.reload() : retry())}
            className="ui-touch inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
          >
            <RotateCcw size={14} aria-hidden="true" />
            {t("Try again", "សាកល្បងម្តងទៀត")}
          </button>
          <Link href="/" className="ui-touch inline-flex items-center rounded-md border border-[var(--ground-line)] px-4 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)]">
            {t("All tools", "ឧបករណ៍ទាំងអស់")}
          </Link>
        </div>
      </div>
    </main>
  );
}
