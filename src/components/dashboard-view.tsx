"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppStore } from "@/context/app-store";
import { ActivePatientsBoard } from "@/components/active-patients-board";
import { Surface } from "@/components/ui";
import { isOpenSession } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";

export function DashboardView() {
  const hydrated = useHydrated();
  const { ready, todayAppointments, workspaceId } = useAppStore();

  const stats = useMemo(() => {
    const remaining = todayAppointments.filter((a) =>
      isOpenSession(a.status),
    ).length;
    const done = todayAppointments.filter((a) => a.status === "done").length;
    const skipped = todayAppointments.filter(
      (a) => a.status === "no_show",
    ).length;
    const total = todayAppointments.length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    return { remaining, done, skipped, total, progress };
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
          <div className="min-w-[10rem]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Progress
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: "var(--accent-label)" }}
              >
                {stats.progress}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${stats.progress}%`,
                  backgroundColor: "var(--accent)",
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-stone-500">
              {stats.done} of {stats.total} finished
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
          <DayStatCard
            label="Left"
            value={stats.remaining}
            hint="still open"
            emphasize={stats.remaining > 0}
          />
          <DayStatCard label="Done" value={stats.done} hint="finished" />
          <DayStatCard
            label="Skipped"
            value={stats.skipped}
            hint="no-shows"
          />
          <DayStatCard
            label="Total"
            value={stats.total}
            hint="sessions today"
          />
        </div>

        {stats.total === 0 ? (
          <div className="border-t border-stone-100 px-5 py-5 sm:px-7">
            <p className="text-sm text-stone-500">
              No sessions booked for today yet. Open a patient from the board
              to book one.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DayStatCard({
  label,
  value,
  hint,
  emphasize = false,
}: {
  label: string;
  value: number;
  hint: string;
  emphasize?: boolean;
}) {
  return (
    <Surface
      className={`px-4 py-4 sm:px-5 ${
        emphasize
          ? "border-[color:var(--accent)]/40 bg-[color:var(--accent-soft)]"
          : ""
      }`}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--accent-label)" }}
      >
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums text-stone-900 sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </Surface>
  );
}
