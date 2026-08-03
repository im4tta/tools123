"use client";

import { useState } from "react";
import { Bookmark, ChevronDown, ChevronRight, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { TOOLS } from "@/lib/tools";
import { createCollectionId, removeToolFromCollection, type ToolCollection } from "@/lib/storage";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH_DIGITS[Number(d)]).join("");

/**
 * Home-grid section listing the user's named collections. Each collection is a
 * collapsible card with rename/delete actions and the tools it contains.
 */
export function CollectionsSection({
  collections,
  setCollections,
  favorites,
  onToggleFavorite,
  onSelect,
}: {
  collections: ToolCollection[];
  setCollections: (next: ToolCollection[] | ((prev: ToolCollection[]) => ToolCollection[])) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const { text: t } = useLanguage();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (collections.length === 0) return null;

  function startRename(collection: ToolCollection) {
    setEditingId(collection.id);
    setEditingName(collection.name);
  }

  function commitRename() {
    const trimmed = editingName.trim();
    if (editingId && trimmed) {
      setCollections((prev) => prev.map((c) => (c.id === editingId ? { ...c, name: trimmed } : c)));
    }
    setEditingId(null);
  }

  function removeTool(collectionId: string, toolId: string) {
    setCollections((prev) => prev.map((c) => (c.id === collectionId ? removeToolFromCollection(c, toolId) : c)));
  }

  function createCollection() {
    const collection: ToolCollection = { id: createCollectionId(), name: t("New collection", "បណ្តុំថ្មី"), toolIds: [] };
    setCollections((prev) => [...prev, collection]);
    startRename(collection);
  }

  return (
    <div className="relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
      <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
        <Bookmark size={13} className="text-[var(--gold)]" fill="currentColor" />
        <h2 className="font-display text-sm font-medium text-[var(--ink)]">{t("Collections", "បណ្តុំ")}</h2>
        <button
          type="button"
          onClick={createCollection}
          className="flex items-center gap-1 rounded border border-[var(--gold-dim)] px-2 py-0.5 text-[11px] font-medium text-[var(--gold)] transition hover:bg-[var(--gold)] hover:text-[var(--ground)]"
        >
          <Plus size={11} />
          {t("New collection", "បណ្តុំថ្មី")}
        </button>
      </div>

      <div className="space-y-3">
        {collections.map((collection) => {
          const isCollapsed = collapsed[collection.id];
          const tools = collection.toolIds
            .map((id) => TOOLS.find((tool) => tool.id === id))
            .filter(Boolean) as typeof TOOLS;
          const isEditing = editingId === collection.id;
          return (
            <div key={collection.id} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setCollapsed((p) => ({ ...p, [collection.id]: !isCollapsed }))}
                  aria-label={isCollapsed ? t("Expand collection", "ពង្រីកបណ្តុំ") : t("Collapse collection", "បង្រួមបណ្តុំ")}
                  className="flex items-center gap-2 rounded p-1 text-sm text-[var(--ink)] transition hover:bg-[var(--ground-line)]"
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span className="font-medium">
                    {isEditing ? (
                      <span className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={commitRename}
                          className="h-6 w-40 rounded border border-[var(--gold-dim)] bg-[var(--ground)] px-2 text-xs text-[var(--ink)] outline-none"
                        />
                        <button
                          type="button"
                          onClick={commitRename}
                          aria-label={t("Save name", "រក្សាទុកឈ្មោះ")}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--gold-dim)] text-[var(--gold)]"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          aria-label={t("Cancel", "បោះបង់")}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--ground-line)] text-[var(--ink-faint)]"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : (
                      collection.name
                    )}
                  </span>
                  <span className="text-xs text-[var(--ink-faint)]">
                    {t(`${tools.length} tools`, `${toKh(tools.length)} ឧបករណ៍`)}
                  </span>
                </button>

                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startRename(collection)}
                    aria-label={t("Rename collection", "ប្តូរឈ្មោះបណ្តុំ")}
                    className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--ink)]"
                  >
                    <Pencil size={13} />
                  </button>
                  {confirmDeleteId === collection.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCollections((prev) => prev.filter((c) => c.id !== collection.id));
                        setConfirmDeleteId(null);
                      }}
                      onBlur={() => setConfirmDeleteId(null)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/10"
                    >
                      <Trash2 size={12} />
                      {t("Confirm", "បញ្ជាក់")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(collection.id)}
                      aria-label={t("Delete collection", "លុបបណ្តុំ")}
                      className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--danger)]"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </span>
              </div>

              {!isCollapsed && (
                <div className="border-t border-[var(--ground-line)] px-3 py-2.5">
                  {tools.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--ink-faint)]">
                      {t("No tools in this collection yet.", "មិនទាន់មានឧបករណ៍ក្នុងបណ្តុំនេះទេ។")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {tools.map((tool) => {
                        const isFav = favorites.includes(tool.id);
                        return (
                          <div
                            key={tool.id}
                            className="group flex items-center gap-1 rounded-md border border-transparent pr-1 text-left text-sm text-[var(--ink-dim)] transition hover:border-[var(--ground-line)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"
                          >
                            <button onClick={() => onSelect(tool.id)} className="flex flex-1 items-center gap-2 px-3 py-2 text-left">
                              <span className="truncate">{t(tool.title, tool.khmerTitle ?? tool.title)}</span>
                            </button>
                            <button
                              onClick={() => onToggleFavorite(tool.id)}
                              aria-label={isFav ? t("Remove from favorites", "ដកចេញពីចំណូលចិត្ត") : t("Add to favorites", "បន្ថែមទៅចំណូលចិត្ត")}
                              className={`shrink-0 rounded p-1 transition ${
                                isFav ? "text-[var(--gold)] opacity-100" : "text-[var(--ink-faint)] opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              <StarIcon filled={isFav} />
                            </button>
                            <button
                              onClick={() => removeTool(collection.id, tool.id)}
                              aria-label={t("Remove from collection", "ដកចេញពីបណ្តុំ")}
                              className="shrink-0 rounded p-1 text-[var(--ink-faint)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--danger)]"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2l2.9 6.26 6.6.72-4.9 4.55 1.34 6.51L12 16.77 6.06 20.04 7.4 13.53 2.5 8.98l6.6-.72L12 2z" />
    </svg>
  );
}
