"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
}

export function ScrollToTopButton() {
  const { text: t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 500);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target) || event.key.toLowerCase() !== "u") return;
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={t("Go to top", "ទៅកាន់ផ្នែកខាងលើ")}
      aria-keyshortcuts="U"
      title={`${t("Go to top", "ទៅកាន់ផ្នែកខាងលើ")} (U)`}
      className="fixed bottom-5 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gold-dim)] bg-[var(--ground-raised)] text-[var(--gold)] shadow-xl transition hover:-translate-y-0.5 hover:bg-[var(--ground-raised-hi)]"
    >
      <ArrowUp size={17} />
    </button>
  );
}
