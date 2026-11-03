"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppStore } from "@/context/app-store";
import { ActivePatientsBoard } from "@/components/active-patients-board";
import { Surface } from "@/components/ui";
import { useHydrated } from "@/lib/use-hydrated";

export function DashboardView() {
  const hydrated = useHydrated();
  const { ready, todayAppointments, workspaceId } = useAppStore();

  const stats = useMemo(() => {
    const total = todayAppointments.length;
    return { total };
  }, [todayAppointments]);

  const todayLabel = useMemo(() => {
    if (!ready) return "";
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [ready]);

  if (!hydrated || !ready) {
    return <p className="text-stone-500">Loading…</p>;
  }

  const workspaceLabel = workspaceId === "clinic" ? "Clinic" : "Private";

  return (
    <div className="space-y-8 sm:space-y-10">
      <ActivePatientsBoard />

      <section className="overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-white shadow-[0_8px_30px_rgba(28,42,36,0.06)]">
        <div className="flex flex-col gap-4 border-b border-stone-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              {workspaceLabel} overview
            </p>
            <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              Today
            </h2>
            <p className="mt-1 text-sm text-stone-500">{todayLabel}</p>
            <Link
              href="/analytics"
              className="mt-2 inline-block text-sm font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--accent-label)" }}
            >
              View analytics →
            </Link>
          </div>
          <Surface className="min-w-[9rem] px-4 py-3 sm:px-5">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--accent-label)" }}
            >
              Sessions today
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums text-stone-900">
              {stats.total}
            </p>
          </Surface>
        </div>

        {stats.total === 0 ? (
          <div className="border-t border-stone-100 px-5 py-5 sm:px-7">
            <p className="text-sm text-stone-500">
              No sessions logged for today yet. Open a patient from the board
              to add one.
            </p>
          </div>
        ) : (
          <div className="border-t border-stone-100 px-5 py-4 sm:px-7">
            <Link
              href="/sessions"
              className="text-sm font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--accent-label)" }}
            >
              Open today’s sessions →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
