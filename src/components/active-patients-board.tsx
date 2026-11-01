"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { PatientStatusBadge } from "@/components/status-badge";
import { inputClass } from "@/components/ui";
import { isBoardPatientStatus } from "@/lib/patient-status";
import { workspaceTheme } from "@/lib/workspace-theme";

export function ActivePatientsBoard() {
  const { patients, workspaceId } = useAppStore();
  const theme = workspaceTheme(workspaceId);
  const [query, setQuery] = useState("");

  const onBoard = useMemo(
    () =>
      patients
        .filter((p) => isBoardPatientStatus(p.status))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [patients],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return onBoard;
    return onBoard.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q) ||
        (p.phone?.includes(q) ?? false),
    );
  }, [onBoard, query]);

  const workspaceLabel = workspaceId === "clinic" ? "Clinic" : "Private";

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-white shadow-[0_12px_40px_rgba(28,42,36,0.07)]">
      <div
        className={`relative overflow-hidden bg-gradient-to-br px-5 py-7 sm:px-8 sm:py-8 ${theme.hero}`}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-black/10 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${theme.heroMuted}`}
          >
            {workspaceLabel} · Today
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white sm:text-[2.75rem] sm:leading-tight">
                Patient board
              </h1>
              <p className={`mt-2 text-sm sm:text-base ${theme.heroBody}`}>
                Active and transferred patients — open one to review history,
                notes, and book a session.
              </p>
            </div>
            <div
              className={`rounded-2xl px-4 py-3 text-center shadow-sm ${theme.heroCta}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                Caseload
              </p>
              <p className="mt-0.5 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums">
                {onBoard.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {onBoard.length > 0 ? (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or condition…"
            className={inputClass}
            aria-label="Search board patients"
          />
        ) : null}

        {onBoard.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-5 py-14 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-stone-900">
              Board is empty
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
              Add an active or transferred patient and they&apos;ll appear here
              for quick access.
            </p>
            <Link
              href="/patients"
              className="btn-accent mt-5 inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm"
            >
              Go to patients
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-10 text-center">
            <p className="font-semibold text-stone-800">No matches</p>
            <p className="mt-1 text-sm text-stone-500">
              Try another name or clear the search.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((patient) => (
              <li key={patient.id}>
                <Link
                  href={`/patients/${patient.id}`}
                  className="group flex h-full min-h-[5.5rem] items-center gap-3.5 rounded-2xl border-2 border-stone-200 bg-gradient-to-b from-white to-stone-50/80 px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:shadow-[0_12px_28px_rgba(28,42,36,0.08)] active:translate-y-0"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: "var(--accent)" }}
                    aria-hidden
                  >
                    {initials(patient.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-stone-900">
                        {patient.name}
                      </span>
                      {patient.status === "transferred" ? (
                        <PatientStatusBadge status={patient.status} />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-stone-500">
                      {patient.condition}
                    </span>
                  </span>
                  <span
                    className="shrink-0 rounded-full px-3.5 py-2 text-sm font-bold text-white opacity-95 transition group-hover:opacity-100"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    Open
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
