"use client";

import { useMemo, useRef, useState } from "react";
import { useBriefStore } from "@/store/briefStore";
import { formatDisplayDate } from "@/lib/utils";
import { downloadBriefJson, parseImportFile } from "@/lib/briefExport";
import { defaultBriefName } from "@/lib/briefIds";
import { downloadBriefPdf } from "@/lib/pdf";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  deleteCloudBrief,
  getOrCreatePreviewUrl,
  renameCloudBrief,
  upsertCloudBrief,
} from "@/lib/supabase/briefsApi";
import {
  Check,
  Copy,
  Download,
  FolderOpen,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SavedBriefsPanel() {
  const show = useBriefStore((s) => s.showLibrary);
  const setShow = useBriefStore((s) => s.setShowLibrary);
  const library = useBriefStore((s) => s.library);
  const activeBriefId = useBriefStore((s) => s.activeBriefId);
  const isDirty = useBriefStore((s) => s.isDirty);
  const brief = useBriefStore((s) => s.brief);
  const openFromLibrary = useBriefStore((s) => s.openFromLibrary);
  const deleteFromLibrary = useBriefStore((s) => s.deleteFromLibrary);
  const renameInLibrary = useBriefStore((s) => s.renameInLibrary);
  const duplicateInLibrary = useBriefStore((s) => s.duplicateInLibrary);
  const saveToLibrary = useBriefStore((s) => s.saveToLibrary);
  const saveAsNew = useBriefStore((s) => s.saveAsNew);
  const applyCloudSave = useBriefStore((s) => s.applyCloudSave);
  const newBrief = useBriefStore((s) => s.newBrief);
  const importIntoLibrary = useBriefStore((s) => s.importIntoLibrary);
  const { cloudEnabled, user, canEdit, isViewer, canAdmin, refreshCloudLibrary } =
    useAuth();

  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [saveName, setSaveName] = useState("");
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const activeRecord = useMemo(
    () => library.find((b) => b.id === activeBriefId) || null,
    [library, activeBriefId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.brief.promoName.toLowerCase().includes(q) ||
        b.brief.projectLead.toLowerCase().includes(q) ||
        b.brief.locations.toLowerCase().includes(q)
    );
  }, [library, query]);

  if (!show) return null;

  const handleOpen = (id: string) => {
    if (isDirty && activeBriefId !== id) {
      const ok = window.confirm(
        "You have unsaved changes on the current brief. Open anyway and discard them from the library version? (Tip: Save first.)"
      );
      if (!ok) return;
    }
    if (openFromLibrary(id)) {
      flash("Brief opened");
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      flash("View only — you cannot save briefs");
      return;
    }
    const name =
      saveName.trim() ||
      activeRecord?.name ||
      defaultBriefName(brief.promoName, brief.projectLead);
    saveToLibrary(name);
    setSaveName("");
    setShowSaveAs(false);
    if (cloudEnabled && user) {
      try {
        const saved = await upsertCloudBrief({
          id: activeBriefId,
          name,
          brief,
          userId: user.id,
        });
        applyCloudSave(saved);
        await refreshCloudLibrary();
        flash(`Saved to cloud “${saved.name}”`);
      } catch (e) {
        flash(e instanceof Error ? e.message : "Cloud save failed");
      }
    } else {
      flash(`Saved “${name}” (this browser only)`);
    }
  };

  const handleSaveAs = async () => {
    if (!canEdit) {
      flash("View only — you cannot save briefs");
      return;
    }
    const name =
      saveName.trim() ||
      defaultBriefName(brief.promoName, brief.projectLead);
    saveAsNew(name);
    setSaveName("");
    setShowSaveAs(false);
    if (cloudEnabled && user) {
      try {
        const saved = await upsertCloudBrief({
          id: null,
          name,
          brief,
          userId: user.id,
        });
        applyCloudSave(saved);
        await refreshCloudLibrary();
        flash(`Saved as “${saved.name}” (cloud)`);
      } catch (e) {
        flash(e instanceof Error ? e.message : "Cloud save failed");
      }
    } else {
      flash(`Saved as “${name}” (this browser only)`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canEdit && !canAdmin) {
      flash("View only — you cannot delete briefs");
      return;
    }
    if (!canAdmin) {
      flash("Only admins can delete shared briefs");
      return;
    }
    if (!window.confirm(`Delete “${name}” from your library? This cannot be undone.`)) {
      return;
    }
    deleteFromLibrary(id);
    if (cloudEnabled) {
      try {
        await deleteCloudBrief(id);
        await refreshCloudLibrary();
      } catch (e) {
        flash(e instanceof Error ? e.message : "Cloud delete failed");
        return;
      }
    }
    flash("Brief deleted");
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = async () => {
    if (!canEdit) {
      flash("View only — you cannot rename briefs");
      setRenamingId(null);
      setRenameValue("");
      return;
    }
    if (renamingId && renameValue.trim()) {
      renameInLibrary(renamingId, renameValue);
      if (cloudEnabled && user) {
        try {
          await renameCloudBrief(renamingId, renameValue.trim(), user.id);
          await refreshCloudLibrary();
        } catch (e) {
          flash(e instanceof Error ? e.message : "Cloud rename failed");
        }
      }
      flash("Renamed");
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseImportFile(text);
      const saved = importIntoLibrary(parsed);
      flash(`Imported “${saved.name}”`);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Import failed");
    }
  };

  const handleNew = () => {
    const hasContent =
      isDirty ||
      !!brief.promoName.trim() ||
      !!brief.projectLead.trim() ||
      !!activeBriefId;
    if (hasContent) {
      const ok = window.confirm(
        [
          "Start a new empty brief?",
          "",
          "WARNING: Content in the current brief will NOT be saved.",
          "Unsaved edits on this form will be discarded.",
          "",
          "Briefs already saved in My briefs are kept.",
        ].join("\n")
      );
      if (!ok) return;
    }
    newBrief();
    setShow(false);
    flash("New empty brief ready");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
        onClick={() => setShow(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl border-l border-stone-200"
      >
        <header className="border-b border-stone-100 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-campero-orange">
                Local library
              </p>
              <h2
                id="library-title"
                className="text-lg font-bold text-stone-900"
              >
                Saved Briefs
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {cloudEnabled
                  ? `Cloud library · ${library.length} saved${isViewer ? " · view only" : ""}`
                  : `This browser only · ${library.length} saved`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="rounded-lg p-2 text-stone-500 hover:bg-white hover:text-stone-800"
              aria-label="Close library"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Current brief actions */}
        <div className="border-b border-stone-100 px-5 py-4 space-y-3 bg-stone-50/50">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Currently editing
              </p>
              <p className="text-sm font-bold text-stone-900 truncate">
                {activeRecord?.name ||
                  brief.promoName ||
                  "Untitled draft"}
                {isDirty && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                    Unsaved
                  </span>
                )}
              </p>
              {activeRecord && (
                <p className="text-xs text-stone-400 mt-0.5">
                  Last library save{" "}
                  {format(new Date(activeRecord.updatedAt), "MMM d, yyyy · h:mm a")}
                </p>
              )}
            </div>
          </div>

          {showSaveAs ? (
            <div className="space-y-2">
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={defaultBriefName(
                  brief.promoName,
                  brief.projectLead
                )}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveAs}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save as new
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveAs(false);
                    setSaveName("");
                  }}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-campero-orange px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-campero-orange-dark"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {activeBriefId ? "Save changes" : "Save to library"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveName(
                        activeRecord
                          ? `${activeRecord.name} (copy)`
                          : defaultBriefName(brief.promoName, brief.projectLead)
                      );
                      setShowSaveAs(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-orange-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Save as…
                  </button>
                  <button
                    type="button"
                    onClick={handleNew}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New brief
                  </button>
                </>
              ) : (
                <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  View only — open briefs below; you cannot save or delete.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                downloadBriefJson(
                  brief,
                  activeRecord?.name || brief.promoName
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Search + list */}
        <div className="px-5 py-3 border-b border-stone-100">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, lead, location…"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-stone-300 mb-2" />
              <p className="text-sm font-semibold text-stone-600">
                {library.length === 0
                  ? "No saved briefs yet"
                  : "No matches"}
              </p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                {library.length === 0
                  ? "Save the current form to keep it for later edits when the project changes."
                  : "Try a different search."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((item) => {
                const isActive = item.id === activeBriefId;
                const isRenaming = renamingId === item.id;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-xl border p-3 transition-colors",
                      isActive
                        ? "border-campero-orange/40 bg-orange-50/50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    )}
                  >
                    {isRenaming ? (
                      <div className="flex gap-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") {
                              setRenamingId(null);
                            }
                          }}
                          className="flex-1 rounded-lg border border-stone-200 px-2 py-1.5 text-sm focus:border-campero-orange focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={commitRename}
                          className="rounded-lg bg-campero-orange p-2 text-white"
                          aria-label="Confirm rename"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpen(item.id)}
                            className="min-w-0 text-left flex-1"
                          >
                            <p className="text-sm font-bold text-stone-900 truncate">
                              {item.name}
                              {isActive && (
                                <span className="ml-2 text-[10px] font-semibold text-campero-orange">
                                  OPEN
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-stone-500 mt-0.5 truncate">
                              {item.brief.projectLead || "No lead"} ·{" "}
                              {item.brief.locations || "No location"} ·{" "}
                              {formatDisplayDate(item.brief.launchDate)}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-1">
                              Updated{" "}
                              {format(
                                new Date(item.updatedAt),
                                "MMM d, yyyy · h:mm a"
                              )}
                            </p>
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpen(item.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-orange-50"
                          >
                            <FolderOpen className="h-3 w-3" />
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!cloudEnabled) {
                                flash("Sign in to create a public preview link");
                                return;
                              }
                              try {
                                const { url } = await getOrCreatePreviewUrl(
                                  item.id
                                );
                                try {
                                  await navigator.clipboard.writeText(url);
                                  flash("Public preview link copied");
                                } catch {
                                  window.prompt(
                                    "Copy this public preview link:",
                                    url
                                  );
                                }
                              } catch (e) {
                                flash(
                                  e instanceof Error
                                    ? e.message
                                    : "Could not create preview link"
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                            title="Public view-only preview (no login)"
                          >
                            <Link2 className="h-3 w-3" />
                            Copy preview link
                          </button>
                          <button
                            type="button"
                            onClick={() => startRename(item.id, item.name)}
                            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            <Pencil className="h-3 w-3" />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              duplicateInLibrary(item.id);
                              flash("Duplicated");
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            <Copy className="h-3 w-3" />
                            Duplicate
                          </button>
                          <button
                            type="button"
                            disabled={pdfBusyId === item.id}
                            onClick={async () => {
                              setPdfBusyId(item.id);
                              try {
                                await downloadBriefPdf(item.brief);
                                flash("PDF downloaded");
                              } catch (e) {
                                flash(
                                  e instanceof Error
                                    ? e.message
                                    : "PDF download failed"
                                );
                              } finally {
                                setPdfBusyId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                            title="Download this brief as PDF"
                          >
                            {pdfBusyId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            Download PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-100 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="border-t border-stone-100 px-5 py-3 text-[11px] text-stone-400">
          <strong>Copy preview link</strong> shares a public, view-only page
          (no login, no edit). Use <strong>Download PDF</strong> on a brief for
          a PDF file.
        </footer>

        {toast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
