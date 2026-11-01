"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { AddSessionForm } from "@/components/add-session-form";
import { AppointmentStatusBadge } from "@/components/status-badge";
import {
  inputClass,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import { formatDate, isOpenSession } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";

function isSameDay(iso: string, now: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function SessionRow({
  session,
  patientName,
  condition,
}: {
  session: Appointment;
  patientName: string;
  condition?: string;
}) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex min-h-16 items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-stone-50 active:bg-stone-100 sm:px-5"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-stone-900">{patientName}</p>
        <p className="truncate text-sm text-stone-500">
          {formatDate(session.startsAt)} · {session.type}
          {condition ? ` · ${condition}` : ""}
        </p>
      </div>
      <AppointmentStatusBadge status={session.status} />
    </Link>
  );
}

export function SessionsView() {
  const hydrated = useHydrated();
  const {
    ready,
    workspaceId,
    workspaceSessions,
    patients,
    getPatient,
  } = useAppStore();

  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const { today, upcoming, past } = useMemo(() => {
    if (!ready) {
      return {
        today: [] as Appointment[],
        upcoming: [] as Appointment[],
        past: [] as Appointment[],
      };
    }

    const now = new Date();
    const q = query.trim().toLowerCase();

    const match = (s: Appointment) => {
      if (!q) return true;
      const patient = getPatient(s.patientId);
      return (
        patient?.name.toLowerCase().includes(q) ||
        patient?.condition.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      );
    };

    const todayList: Appointment[] = [];
    const upcomingList: Appointment[] = [];
    const pastList: Appointment[] = [];

    for (const s of workspaceSessions) {
      if (!match(s)) continue;
      const starts = new Date(s.startsAt);

      if (isSameDay(s.startsAt, now)) {
        todayList.push(s);
      } else if (starts.getTime() > now.getTime() && isOpenSession(s.status)) {
        upcomingList.push(s);
      } else {
        pastList.push(s);
      }
    }

    return { today: todayList, upcoming: upcomingList, past: pastList };
  }, [ready, workspaceSessions, query, getPatient]);

  if (!hydrated || !ready) {
    return <p className="text-stone-500">Loading sessions…</p>;
  }

  const activePatients = patients.filter((p) => p.status === "active");
  const pastVisible = showPast || query.trim().length > 0 ? past : past.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        subtitle={`${workspaceId === "clinic" ? "Clinic" : "Private"} · today, history, and new bookings`}
        action={
          <PrimaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "New session"}
          </PrimaryButton>
        }
      />

      {showForm && <AddSessionForm onCancel={() => setShowForm(false)} />}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by patient, condition, or type…"
        className={inputClass}
      />

      {/* Today */}
      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
          Today
          <span className="ml-2 text-base font-normal tabular-nums text-stone-400">
            {today.length}
          </span>
        </h2>
        <Surface className="overflow-hidden divide-y divide-stone-100">
          {today.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-stone-500">
              No sessions today.
            </p>
          ) : (
            today.map((session) => {
              const patient = getPatient(session.patientId);
              return (
                <SessionRow
                  key={session.id}
                  session={session}
                  patientName={patient?.name ?? "Unknown patient"}
                  condition={
                    patient?.condition || patient?.diagnosis || undefined
                  }
                />
              );
            })
          )}
        </Surface>
      </section>

      {/* Upcoming (other days) */}
      {upcoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
            Upcoming
            <span className="ml-2 text-base font-normal tabular-nums text-stone-400">
              {upcoming.length}
            </span>
          </h2>
          <Surface className="overflow-hidden divide-y divide-stone-100">
            {upcoming.map((session) => {
              const patient = getPatient(session.patientId);
              return (
                <SessionRow
                  key={session.id}
                  session={session}
                  patientName={patient?.name ?? "Unknown patient"}
                  condition={
                    patient?.condition || patient?.diagnosis || undefined
                  }
                />
              );
            })}
          </Surface>
        </section>
      )}

      {/* History */}
      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
          History
          <span className="ml-2 text-base font-normal tabular-nums text-stone-400">
            {past.length}
          </span>
        </h2>
        <Surface className="overflow-hidden divide-y divide-stone-100">
          {past.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-stone-500">
              No past sessions yet.
            </p>
          ) : (
            pastVisible.map((session) => {
              const patient = getPatient(session.patientId);
              return (
                <SessionRow
                  key={session.id}
                  session={session}
                  patientName={patient?.name ?? "Unknown patient"}
                  condition={
                    patient?.condition || patient?.diagnosis || undefined
                  }
                />
              );
            })
          )}
        </Surface>
        {!query.trim() && past.length > 5 && (
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="link-accent text-sm font-semibold hover:underline"
          >
            {showPast ? "Show less" : `Show all ${past.length} past sessions`}
          </button>
        )}
      </section>

      {activePatients.length === 0 && (
        <Surface className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-600">
            No active patients yet — add a patient first, then book a session.
          </p>
          <Link href="/patients">
            <SecondaryButton>Go to patients</SecondaryButton>
          </Link>
        </Surface>
      )}
    </div>
  );
}
