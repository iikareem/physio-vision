"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { AppointmentStatusBadge } from "@/components/status-badge";
import { dateOnlyIso, formatDate, todayDateInputValue } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";

const NEXT_ACTIONS: Partial<
  Record<AppointmentStatus, { label: string; status: AppointmentStatus }[]>
> = {
  scheduled: [
    { label: "Check in", status: "checked_in" },
    { label: "No-show", status: "no_show" },
  ],
  checked_in: [
    { label: "Mark done", status: "done" },
    { label: "No-show", status: "no_show" },
  ],
};

export function ReceptionView() {
  const hydrated = useHydrated();
  const {
    ready,
    workspaceId,
    patients,
    todayAppointments,
    getPatient,
    addAppointment,
    setAppointmentStatus,
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState("Follow-up");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activePatients = useMemo(
    () => patients.filter((p) => p.status === "active"),
    [patients],
  );

  const todayLabel = useMemo(() => {
    if (!ready) return "";
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [ready]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!patientId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addAppointment({
        patientId,
        startsAt: dateOnlyIso(todayDateInputValue()),
        type: type.trim() || "Appointment",
      });
      setShowForm(false);
      setPatientId("");
      setType("Follow-up");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add appointment");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated || !ready) {
    return <p className="text-stone-500">Loading schedule…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-stone-900">
            Reception
          </h1>
          <p className="mt-1 text-stone-500">
            Today · {todayLabel} ·{" "}
            {workspaceId === "clinic" ? "Clinic" : "Private"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="min-h-11 touch-manipulation rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 active:bg-teal-900"
        >
          {showForm ? "Cancel" : "Add appointment"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {showForm && (
        <form
          onSubmit={onAdd}
          className="grid gap-3 rounded-2xl border border-teal-100 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="block text-sm sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-stone-600">Patient</span>
            <select
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
            >
              <option value="">Select…</option>
              {activePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2 lg:col-span-2">
            <span className="mb-1 block text-stone-600">Type</span>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save appointment"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        {todayAppointments.length === 0 ? (
          <p className="px-5 py-12 text-center text-stone-500">
            No appointments scheduled for today in this workspace.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {todayAppointments.map((appt) => {
              const patient = getPatient(appt.patientId);
              const actions = NEXT_ACTIONS[appt.status] ?? [];
              return (
                <li
                  key={appt.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    {patient ? (
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-semibold text-teal-800 hover:underline"
                      >
                        {patient.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-stone-500">
                        Unknown patient
                      </span>
                    )}
                    <p className="text-sm text-stone-500">
                      {formatDate(appt.startsAt)} · {appt.type}
                    </p>
                    <div className="mt-1.5">
                      <AppointmentStatusBadge status={appt.status} />
                    </div>
                  </div>
                  {actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          onClick={() => {
                            void setAppointmentStatus(
                              appt.id,
                              action.status,
                            ).catch((err) => {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to update status",
                              );
                            });
                          }}
                          className={`min-h-11 flex-1 touch-manipulation rounded-xl px-4 py-2.5 text-sm font-semibold sm:flex-none ${
                            action.status === "no_show"
                              ? "border border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "bg-teal-700 text-white hover:bg-teal-800"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
