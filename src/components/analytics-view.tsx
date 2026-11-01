"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppStore } from "@/context/app-store";
import { PageHeader, StatCard, Surface } from "@/components/ui";
import { getAnalytics } from "@/lib/api/analytics";
import {
  parseDateInput,
  parseMonthInput,
  toDateInputValue,
  toMonthInputValue,
  type AnalyticsBucket,
  type AnalyticsPeriod,
  type AnalyticsSummary,
  type TypeBreakdown,
} from "@/lib/analytics";
import { useHydrated } from "@/lib/use-hydrated";

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

export function AnalyticsView() {
  const hydrated = useHydrated();
  const { ready, workspaceId, appointments, patients } = useAppStore();
  const [period, setPeriod] = useState<AnalyticsPeriod>("day");
  const [selected, setSelected] = useState(() => new Date());
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnalytics({
      workspace: workspaceId,
      period,
      date: toDateInputValue(selected),
    })
      .then((summary) => {
        if (!cancelled) setAnalytics(summary);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setAnalytics(null);
          setError(err instanceof Error ? err.message : "Failed to load analytics");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, workspaceId, period, selected]);

  const yearOptions = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const years = new Set<number>([nowYear, selected.getFullYear()]);
    for (const a of appointments) {
      years.add(new Date(a.startsAt).getFullYear());
    }
    for (const p of patients) {
      years.add(new Date(p.createdAt).getFullYear());
    }
    for (let y = nowYear - 2; y <= nowYear; y++) years.add(y);
    return [...years].sort((a, b) => b - a);
  }, [appointments, patients, selected]);

  if (!hydrated || !ready) {
    return <p className="text-stone-500">Loading…</p>;
  }

  if (error) {
    return <p className="text-rose-700">{error}</p>;
  }

  if (loading || !analytics) {
    return <p className="text-stone-500">Loading…</p>;
  }

  const workspaceLabel = workspaceId === "clinic" ? "Clinic" : "Private";
  const maxSessions = Math.max(...analytics.buckets.map((b) => b.sessions), 1);
  const maxType = Math.max(...analytics.byType.map((t) => t.count), 1);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Analytics"
        subtitle={`${workspaceLabel} workload and history`}
      />

      <PeriodChooser
        period={period}
        selected={selected}
        rangeLabel={analytics.rangeLabel}
        yearOptions={yearOptions}
        onPeriodChange={setPeriod}
        onSelectedChange={setSelected}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Sessions"
          value={analytics.totalSessions}
          hint="in this period"
        />
        <StatCard
          label="Patients"
          value={analytics.uniquePatients}
          hint="worked with"
        />
        <StatCard
          label="Finished"
          value={analytics.doneSessions}
          hint="completed sessions"
        />
        <StatCard
          label="New patients"
          value={analytics.newPatients}
          hint="added here"
        />
      </div>

      <Surface className="overflow-hidden">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
            {analytics.chartLabel}
          </h2>
          <p className="mt-0.5 text-sm text-stone-500">
            Breakdown for {analytics.rangeLabel}
          </p>
        </div>
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {analytics.totalSessions === 0 ? (
            <p className="text-sm text-stone-500">
              No sessions in this {period} yet.
            </p>
          ) : (
            <BarChart
              buckets={analytics.buckets}
              max={maxSessions}
              period={period}
            />
          )}
        </div>
      </Surface>

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
              By session type
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              Mix of work in this {period}
            </p>
          </div>
          <div className="space-y-3 px-5 py-5 sm:px-6">
            {analytics.byType.length === 0 ? (
              <p className="text-sm text-stone-500">No type data yet.</p>
            ) : (
              analytics.byType.map((row) => (
                <TypeRow key={row.type} row={row} max={maxType} />
              ))
            )}
          </div>
        </Surface>

        <Surface className="overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
              Most worked patients
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              Highest session count in this {period}
            </p>
          </div>
          <ul className="divide-y divide-stone-100">
            {analytics.topPatients.length === 0 ? (
              <li className="px-5 py-5 text-sm text-stone-500 sm:px-6">
                No patient sessions in this {period}.
              </li>
            ) : (
              analytics.topPatients.map((p, i) => (
                <li key={p.patientId}>
                  <Link
                    href={`/patients/${p.patientId}`}
                    className="flex min-h-14 items-center gap-3 px-5 py-3.5 transition hover:bg-stone-50 active:bg-stone-100 sm:px-6"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums"
                      style={{
                        backgroundColor: "var(--accent-soft)",
                        color: "var(--accent-label)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-stone-900">
                        {p.name}
                      </p>
                      <p className="truncate text-sm text-stone-500">
                        {p.condition || "No condition"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-[family-name:var(--font-display)] text-lg font-semibold tabular-nums text-stone-900">
                        {p.sessions}
                      </p>
                      <p className="text-xs text-stone-500">
                        {p.done} finished
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Surface>
      </div>

      <Surface className="overflow-hidden">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
            Detail
          </h2>
          <p className="mt-0.5 text-sm text-stone-500">
            Sessions and patients for each slot
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="px-5 py-3 sm:px-6">
                  {period === "day"
                    ? "Status"
                    : period === "month"
                      ? "Day"
                      : "Month"}
                </th>
                <th className="px-3 py-3 text-right tabular-nums">Sessions</th>
                <th className="px-3 py-3 text-right tabular-nums">Patients</th>
                <th className="px-5 py-3 text-right tabular-nums sm:px-6">
                  Finished
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {analytics.buckets
                .filter((b) => b.sessions > 0)
                .map((b) => (
                  <tr key={b.key} className="text-stone-800">
                    <td className="px-5 py-3 font-medium sm:px-6">{b.label}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {b.sessions}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {b.uniquePatients}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums sm:px-6">
                      {b.done}
                    </td>
                  </tr>
                ))}
              {analytics.buckets.every((b) => b.sessions === 0) ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-5 text-sm text-stone-500 sm:px-6"
                  >
                    Nothing to list for this {period}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

function PeriodChooser({
  period,
  selected,
  rangeLabel,
  yearOptions,
  onPeriodChange,
  onSelectedChange,
}: {
  period: AnalyticsPeriod;
  selected: Date;
  rangeLabel: string;
  yearOptions: number[];
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onSelectedChange: (date: Date) => void;
}) {
  const dateRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const isCurrent = isSameSelection(period, selected, new Date());

  function shift(delta: number) {
    const next = new Date(selected);
    if (period === "day") next.setDate(next.getDate() + delta);
    else if (period === "month") next.setMonth(next.getMonth() + delta);
    else next.setFullYear(next.getFullYear() + delta);
    onSelectedChange(next);
  }

  function openPicker() {
    if (period === "day") {
      const el = dateRef.current;
      if (!el) return;
      try {
        el.showPicker();
      } catch {
        el.click();
      }
      return;
    }
    if (period === "month") {
      const el = monthRef.current;
      if (!el) return;
      try {
        el.showPicker();
      } catch {
        el.click();
      }
    }
  }

  const currentLabel =
    period === "day" ? "Today" : period === "month" ? "This month" : "This year";

  return (
    <Surface className="overflow-hidden">
      <div
        className="grid grid-cols-3 border-b border-stone-100"
        role="tablist"
        aria-label="Period type"
      >
        {PERIODS.map((p) => {
          const active = period === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onPeriodChange(p.id)}
              className={`relative min-h-12 text-sm font-semibold transition ${
                active
                  ? "text-[color:var(--accent-label)]"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              }`}
            >
              {p.label}
              {active ? (
                <span
                  className="absolute inset-x-4 bottom-0 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--accent)" }}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-2 py-5 sm:gap-4 sm:px-4 sm:py-6">
        <NavButton label={`Previous ${period}`} onClick={() => shift(-1)}>
          <ChevronLeft />
        </NavButton>

        <div className="min-w-0 flex-1 text-center">
          {period === "year" ? (
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                {selected.getFullYear()}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {yearOptions.map((y) => {
                  const active = y === selected.getFullYear();
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => onSelectedChange(new Date(y, 0, 1))}
                      className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition ${
                        active
                          ? "text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                      style={
                        active
                          ? { backgroundColor: "var(--accent)" }
                          : undefined
                      }
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openPicker}
              className="group mx-auto max-w-full rounded-xl px-3 py-2 transition hover:bg-stone-50"
            >
              <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                {displayTitle(period, selected, rangeLabel)}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-400 group-hover:text-[color:var(--accent-label)]">
                Tap to choose {period}
              </p>
            </button>
          )}

          {!isCurrent ? (
            <button
              type="button"
              onClick={() => onSelectedChange(new Date())}
              className="mt-3 text-sm font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--accent-label)" }}
            >
              Jump to {currentLabel.toLowerCase()}
            </button>
          ) : (
            <p className="mt-3 text-sm font-medium text-stone-400">
              {currentLabel}
            </p>
          )}
        </div>

        <NavButton label={`Next ${period}`} onClick={() => shift(1)}>
          <ChevronRight />
        </NavButton>
      </div>

      <input
        ref={dateRef}
        type="date"
        className="sr-only"
        tabIndex={-1}
        value={toDateInputValue(selected)}
        onChange={(e) => {
          const next = parseDateInput(e.target.value);
          if (next) onSelectedChange(next);
        }}
      />
      <input
        ref={monthRef}
        type="month"
        className="sr-only"
        tabIndex={-1}
        value={toMonthInputValue(selected)}
        onChange={(e) => {
          const next = parseMonthInput(e.target.value);
          if (next) onSelectedChange(next);
        }}
      />
    </Surface>
  );
}

function displayTitle(
  period: AnalyticsPeriod,
  selected: Date,
  rangeLabel: string,
): string {
  if (period === "day") {
    return selected.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
    });
  }
  if (period === "month") {
    return selected.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
  return rangeLabel;
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100"
    >
      {children}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M9.5 6.5 15 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isSameSelection(
  period: AnalyticsPeriod,
  selected: Date,
  now: Date,
): boolean {
  if (period === "day") {
    return (
      selected.getFullYear() === now.getFullYear() &&
      selected.getMonth() === now.getMonth() &&
      selected.getDate() === now.getDate()
    );
  }
  if (period === "month") {
    return (
      selected.getFullYear() === now.getFullYear() &&
      selected.getMonth() === now.getMonth()
    );
  }
  return selected.getFullYear() === now.getFullYear();
}

function BarChart({
  buckets,
  max,
  period,
}: {
  buckets: AnalyticsBucket[];
  max: number;
  period: AnalyticsPeriod;
}) {
  return (
    <div className="flex h-52 items-end gap-1 sm:h-60 sm:gap-1.5">
      {buckets.map((b) => {
        const height =
          b.sessions === 0 ? 0 : Math.max((b.sessions / max) * 100, 8);
        return (
          <div
            key={b.key}
            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-[10px] font-semibold tabular-nums text-stone-500 opacity-0 transition group-hover:opacity-100 sm:text-xs sm:opacity-100">
              {b.sessions || ""}
            </span>
            <div
              className="w-full max-w-10 rounded-t-md transition-[height] duration-500 sm:max-w-12"
              style={{
                height: `${height}%`,
                backgroundColor:
                  b.sessions > 0 ? "var(--accent)" : "rgb(231 229 228)",
                opacity: b.sessions > 0 ? 0.9 : 0.55,
              }}
              title={`${b.label}: ${b.sessions} sessions · ${b.uniquePatients} patients`}
            />
            <span className="w-full truncate text-center text-[9px] font-medium text-stone-500 sm:text-[10px]">
              {shortLabel(b, period)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function shortLabel(b: AnalyticsBucket, period: AnalyticsPeriod): string {
  if (period === "day" || period === "year") return b.label;
  return b.key;
}

function TypeRow({ row, max }: { row: TypeBreakdown; max: number }) {
  const width = Math.max((row.count / max) * 100, 4);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-medium text-stone-800">{row.type}</p>
        <p className="shrink-0 text-sm tabular-nums text-stone-500">
          {row.count} · {row.pct}%
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${width}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}
