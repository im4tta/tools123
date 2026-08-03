"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export function ScrollToBottomButton() {
  const { text: t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const pageIsLong = document.documentElement.scrollHeight > window.innerHeight + 500;
      setVisible(pageIsLong && window.scrollY <= 500);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })}
      aria-label={t("Go to bottom", "ទៅកាន់ផ្នែកខាងក្រោម")}
      title={t("Go to bottom", "ទៅកាន់ផ្នែកខាងក្រោម")}
      className="fixed bottom-5 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] shadow-xl transition hover:translate-y-0.5 hover:bg-[var(--ground-raised-hi)] hover:text-[var(--gold)]"
    >
      <ArrowDown size={17} />
    </button>
  );
}
