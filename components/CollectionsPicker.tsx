"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, Plus, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { addToolToCollection, createCollectionId, removeToolFromCollection, type ToolCollection } from "@/lib/storage";

/**
 * Dropdown that lets the user place the current tool into their favorite
 * (built-in) collection or any named collection, creating new collections
 * inline. Pure controlled component: the caller owns the data via
 * `useLocalStorage`.
 */
export function CollectionsPicker({
  toolId,
  favorites,
  onToggleFavorite,
  collections,
  setCollections,
}: {
  toolId: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  collections: ToolCollection[];
  setCollections: (next: ToolCollection[] | ((prev: ToolCollection[]) => ToolCollection[])) => void;
}) {
  const { text: t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open && creating) inputRef.current?.focus();
  }, [open, creating]);

  const isFav = favorites.includes(toolId);

  function toggleCollection(collection: ToolCollection) {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collection.id
          ? c.toolIds.includes(toolId)
            ? removeToolFromCollection(c, toolId)
            : addToolToCollection(c, toolId)
          : c
      )
    );
  }

  function createCollection() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const collection: ToolCollection = { id: createCollectionId(), name: trimmed, toolIds: [toolId] };
    setCollections((prev) => [...prev, collection]);
    setName("");
    setCreating(false);
  }

  const inCollectionCount = collections.filter((c) => c.toolIds.includes(toolId)).length;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("Add to collection", "បន្ថែមទៅបណ្តុំ")}
        className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
          inCollectionCount > 0
            ? "border-[var(--gold-dim)] text-[var(--gold)]"
            : "border-[var(--ground-line)] text-[var(--ink-faint)]"
        }`}
      >
        <Bookmark size={14} fill={inCollectionCount > 0 ? "currentColor" : "none"} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-64 overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl"
        >
          <p className="border-b border-[var(--ground-line)] px-3 py-2 text-xs font-medium text-[var(--ink-dim)]">
            {t("Add to collection", "បន្ថែមទៅបណ្តុំ")}
          </p>

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={isFav}
            onClick={() => onToggleFavorite(toolId)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[var(--ink)] transition hover:bg-[var(--ground-raised-hi)]"
          >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isFav ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--ground)]" : "border-[var(--ground-line)]"}`}>
              {isFav && <Check size={11} strokeWidth={3} />}
            </span>
            <span className="flex-1 truncate">{t("Favorites", "ចំណូលចិត្ត")}</span>
            <span className="text-[10px] text-[var(--ink-faint)]">
              {t("star", "ផ្កាយ")}
            </span>
          </button>

          {collections.map((collection) => {
            const selected = collection.toolIds.includes(toolId);
            return (
              <button
                key={collection.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={selected}
                onClick={() => toggleCollection(collection)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[var(--ink)] transition hover:bg-[var(--ground-raised-hi)]"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--ground)]" : "border-[var(--ground-line)]"}`}>
                  {selected && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                <span className="text-[10px] text-[var(--ink-faint)]">
                  {collection.toolIds.length}
                </span>
              </button>
            );
          })}

          {creating ? (
            <div className="border-t border-[var(--ground-line)] p-2">
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createCollection();
                  }}
                  placeholder={t("Collection name…", "ឈ្មោះបណ្តុំ…")}
                  className="h-8 min-w-0 flex-1 rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 text-xs text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)]"
                />
                <button
                  type="button"
                  onClick={createCollection}
                  disabled={!name.trim()}
                  aria-label={t("Create collection", "បង្កើតបណ្តុំ")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--gold-dim)] text-[var(--gold)] transition hover:bg-[var(--gold)] hover:text-[var(--ground)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--gold)]"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  aria-label={t("Cancel", "បោះបង់")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--ground-line)] text-[var(--ink-faint)] transition hover:text-[var(--ink)]"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 border-t border-[var(--ground-line)] px-3 py-2.5 text-left text-xs font-medium text-[var(--gold)] transition hover:bg-[var(--ground-raised-hi)]"
            >
              <Plus size={13} />
              {t("New collection…", "បណ្តុំថ្មី…")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
