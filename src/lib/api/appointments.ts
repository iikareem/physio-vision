import { apiJson } from "@/lib/api/client";
import type {
  Appointment,
  AppointmentStatus,
  WorkspaceId,
} from "@/lib/types";

export function listAppointments(
  workspace: WorkspaceId,
  opts?: { patientId?: string; date?: string },
) {
  const params = new URLSearchParams({ workspace });
  if (opts?.patientId) params.set("patientId", opts.patientId);
  if (opts?.date) params.set("date", opts.date);
  return apiJson<Appointment[]>(`/appointments?${params}`);
}

export function getAppointment(id: string) {
  return apiJson<Appointment>(`/appointments/${id}`);
}

export function createAppointment(input: {
  workspaceId: WorkspaceId;
  patientId: string;
  startsAt: string;
  type: string;
}) {
  return apiJson<Appointment>("/appointments", {
    method: "POST",
    body: input,
  });
}

export function updateAppointment(
  id: string,
  patch: {
    startsAt?: string;
    status?: AppointmentStatus;
    type?: string;
    summary?: string;
  },
) {
  return apiJson<Appointment>(`/appointments/${id}`, {
    method: "PATCH",
    body: patch,
  });
}
