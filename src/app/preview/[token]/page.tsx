"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { BriefPreview } from "@/components/preview/BriefPreview";
import { fetchPublicBriefPreview } from "@/lib/supabase/briefsApi";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { PromoBrief } from "@/lib/types";
import { format } from "date-fns";
import { ExternalLink, Loader2 } from "lucide-react";

export default function PublicBriefPreviewPage() {
  const params = useParams();
  const token = String(params?.token || "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [brief, setBrief] = useState<PromoBrief | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing preview link.");
      setLoading(false);
      return;
    }
    if (!hasSupabaseConfig()) {
      setError("Preview is not configured (missing Supabase keys).");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const row = await fetchPublicBriefPreview(token);
        if (cancelled) return;
        if (!row) {
          setError(
            "This preview link is invalid or the brief is no longer available."
          );
          setBrief(null);
          return;
        }
        setName(row.name);
        setUpdatedAt(row.updatedAt);
        setBrief(row.brief);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load preview");
        setBrief(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-stone-900">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandMark size="md" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-campero-orange">
                Public preview · view only
              </p>
              <h1 className="text-lg font-bold tracking-tight text-stone-900">
                {name || "Promo brief"}
              </h1>
              {updatedAt && (
                <p className="text-xs text-stone-500">
                  Updated{" "}
                  {format(new Date(updatedAt), "MMM d, yyyy · h:mm a")}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin text-campero-orange" />
            <p className="text-sm font-medium">Loading preview…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-red-800 whitespace-pre-wrap">
              {error}
            </p>
            <Link
              href="/login/"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-campero-orange hover:underline"
            >
              Go to brief builder
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {!loading && !error && brief && (
          <div className="flex justify-center overflow-x-auto rounded-xl bg-stone-100/80 p-4 sm:p-6 border border-stone-200">
            <BriefPreview brief={brief} />
          </div>
        )}
      </main>

      <footer className="border-t border-orange-100 bg-white py-6 mt-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-stone-400">
          Campero Promo Brief · Shared preview
        </div>
      </footer>
    </div>
  );
}
