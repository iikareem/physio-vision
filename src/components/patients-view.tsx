"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { AddPatientForm } from "@/components/add-patient-form";
import { PatientStatusBadge } from "@/components/status-badge";
import {
  inputClass,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import { PATIENT_STATUS_OPTIONS } from "@/lib/patient-status";
import type { PatientStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";

export function PatientsView() {
  const hydrated = useHydrated();
  const { patients, ready, workspaceId } = useAppStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PatientStatus>(
    "all",
  );
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q) ||
        (p.diagnosis?.toLowerCase().includes(q) ?? false) ||
        (p.phone?.includes(q) ?? false) ||
        (p.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [patients, query, statusFilter]);

  if (!hydrated || !ready) {
    return <p className="text-stone-500">Loading patients…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        subtitle={`Directory for ${workspaceId === "clinic" ? "Clinic" : "Private"} · ${filtered.length} shown`}
        action={
          showForm ? (
            <SecondaryButton onClick={() => setShowForm(false)}>
              Cancel
            </SecondaryButton>
          ) : (
            <PrimaryButton onClick={() => setShowForm(true)}>
              Add patient
            </PrimaryButton>
          )
        }
      />

      {showForm ? (
        <AddPatientForm
          onCancel={() => setShowForm(false)}
          onCreated={() => setShowForm(false)}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search name, condition, diagnosis, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} sm:max-w-md`}
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | PatientStatus)
          }
          className={inputClass}
        >
          <option value="all">All statuses</option>
          {PATIENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2 md:hidden">
        {filtered.length === 0 ? (
          <li>
            <Surface className="px-4 py-10 text-center text-stone-500">
              No patients match in this workspace.
            </Surface>
          </li>
        ) : (
          filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/patients/${p.id}`}
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-stone-200/70 bg-white px-4 py-3.5 shadow-sm active:bg-teal-50/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-900">
                    {p.name}
                  </p>
                  <p className="truncate text-sm text-stone-500">
                    {p.condition || p.diagnosis || "No condition"}
                  </p>
                </div>
                <PatientStatusBadge status={p.status} />
              </Link>
            </li>
          ))
        )}
      </ul>

      <div className="hidden overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Condition</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">
                Phone
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">
                Since
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-stone-500"
                >
                  No patients match in this workspace.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-stone-100 last:border-0 hover:bg-teal-50/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/patients/${p.id}`}
                      className="font-semibold text-teal-800 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {p.condition || p.diagnosis || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-stone-600 lg:table-cell">
                    {p.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <PatientStatusBadge status={p.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-stone-500 xl:table-cell">
                    {formatDate(p.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
