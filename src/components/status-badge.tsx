import type { AppointmentStatus, PatientStatus } from "@/lib/types";
import { appointmentStatusLabel } from "@/lib/format";
import {
  patientStatusBadgeClass,
  patientStatusLabel,
} from "@/lib/patient-status";

const appointmentStyles: Record<AppointmentStatus, string> = {
  scheduled: "bg-sky-100 text-sky-800",
  checked_in: "bg-amber-100 text-amber-900",
  done: "bg-emerald-100 text-emerald-800",
  no_show: "bg-stone-200 text-stone-600",
};

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${patientStatusBadgeClass(status)}`}
    >
      {patientStatusLabel(status)}
    </span>
  );
}

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${appointmentStyles[status]}`}
    >
      {appointmentStatusLabel(status)}
    </span>
  );
}
