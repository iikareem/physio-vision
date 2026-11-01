import type { PatientStatus } from "@/lib/types";

export const PATIENT_STATUS_OPTIONS: {
  value: PatientStatus;
  label: string;
  hint: string;
  badgeClass: string;
  selectedClass: string;
}[] = [
  {
    value: "active",
    label: "Active",
    hint: "In care",
    badgeClass: "bg-emerald-100 text-emerald-800",
    selectedClass:
      "bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500/50 shadow-sm",
  },
  {
    value: "terminated",
    label: "Terminated",
    hint: "Care stopped",
    badgeClass: "bg-rose-100 text-rose-800",
    selectedClass:
      "bg-rose-100 text-rose-950 ring-2 ring-rose-500/50 shadow-sm",
  },
  {
    value: "transferred",
    label: "Transferred",
    hint: "From another doctor",
    badgeClass: "bg-sky-100 text-sky-800",
    selectedClass: "bg-sky-100 text-sky-950 ring-2 ring-sky-500/50 shadow-sm",
  },
  {
    value: "discharged",
    label: "Discharged",
    hint: "Completed care",
    badgeClass: "bg-stone-200 text-stone-700",
    selectedClass:
      "bg-stone-200 text-stone-900 ring-2 ring-stone-400/60 shadow-sm",
  },
];

/** Patients shown on the home board (in care + referred in). */
export function isBoardPatientStatus(status: PatientStatus): boolean {
  return status === "active" || status === "transferred";
}

export function patientStatusLabel(status: PatientStatus): string {
  return (
    PATIENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export function patientStatusBadgeClass(status: PatientStatus): string {
  return (
    PATIENT_STATUS_OPTIONS.find((o) => o.value === status)?.badgeClass ??
    "bg-stone-200 text-stone-600"
  );
}

export function patientStatusSelectedClass(status: PatientStatus): string {
  return (
    PATIENT_STATUS_OPTIONS.find((o) => o.value === status)?.selectedClass ??
    "bg-white ring-2 ring-stone-300"
  );
}
