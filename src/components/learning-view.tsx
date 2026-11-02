"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { useHydrated } from "@/lib/use-hydrated";
import {
  AlertBanner,
  LoadingBlock,
  useToast,
} from "@/components/feedback";
import {
  LearningComposer,
  LearningItemsList,
} from "@/components/learning-list";
import { PageHeader, Surface } from "@/components/ui";

type Filter = "open" | "all" | "done";

export function LearningView() {
  const hydrated = useHydrated();
  const toast = useToast();
  const {
    ready,
    workspaceId,
    learningItems,
    ensureLearningLoaded,
    addLearning,
    setLearningDone,
    removeLearning,
  } = useAppStore();

  const [filter, setFilter] = useState<Filter>("open");
  const [extrasReady, setExtrasReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setExtrasReady(false);
    void ensureLearningLoaded()
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load learning",
        );
      })
      .finally(() => {
        if (!cancelled) setExtrasReady(true);
      });
    return () => {
      cancelled = true;
    };
    // Reload when workspace changes; ensureLearningLoaded identity is unstable after load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, workspaceId]);

  const generalItems = useMemo(
    () =>
      learningItems
        .filter((item) => !item.patientId)
        .filter((item) => {
          if (filter === "open") return !item.done;
          if (filter === "done") return item.done;
          return true;
        })
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }),
    [learningItems, filter],
  );

  const patientItems = useMemo(
    () =>
      learningItems
        .filter((item) => !!item.patientId)
        .filter((item) => {
          if (filter === "open") return !item.done;
          if (filter === "done") return item.done;
          return true;
        })
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }),
    [learningItems, filter],
  );

  const openCount = learningItems.filter((item) => !item.done).length;

  if (!hydrated || !ready) {
    return <LoadingBlock label="Loading learning…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning"
        subtitle="Dump what you need to study — general topics and patient-specific notes in one place."
      />

      {error ? <AlertBanner tone="error">{error}</AlertBanner> : null}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["open", `Open (${openCount})`],
            ["all", "All"],
            ["done", "Done"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition ${
              filter === value
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Surface className="p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
          General
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Topics that aren&apos;t tied to one patient.
        </p>
        <div className="mt-3">
          <LearningComposer
            placeholder="e.g. Review lumbar nerve tension tests…"
            busy={busy}
            onAdd={async (body) => {
              setBusy(true);
              setError(null);
              try {
                await addLearning({ body });
                toast.success("Added to learning");
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to add item",
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
        <div className="mt-4">
          <LearningItemsList
            items={generalItems}
            loading={!extrasReady}
            emptyTitle="Nothing general yet"
            emptyDescription="Add anything you want to learn that isn’t about a specific patient."
            showPatientLink
            busy={busy}
            onToggleDone={async (id, done) => {
              setError(null);
              try {
                await setLearningDone(id, done);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to update item",
                );
              }
            }}
            onRemove={async (id) => {
              setError(null);
              try {
                await removeLearning(id);
                toast.success("Removed");
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to remove item",
                );
              }
            }}
          />
        </div>
      </Surface>

      <Surface className="p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
          From patients
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Everything you dumped on patient profiles, collected here.
        </p>
        <div className="mt-4">
          <LearningItemsList
            items={patientItems}
            loading={!extrasReady}
            emptyTitle="No patient learning yet"
            emptyDescription="Open a patient profile and add what you need to learn for that case."
            showPatientLink
            busy={busy}
            onToggleDone={async (id, done) => {
              setError(null);
              try {
                await setLearningDone(id, done);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to update item",
                );
              }
            }}
            onRemove={async (id) => {
              setError(null);
              try {
                await removeLearning(id);
                toast.success("Removed");
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to remove item",
                );
              }
            }}
          />
        </div>
      </Surface>
    </div>
  );
}
