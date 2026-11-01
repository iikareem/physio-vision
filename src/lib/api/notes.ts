import { apiJson } from "@/lib/api/client";
import type { Note } from "@/lib/types";

export function listNotes(patientId: string) {
  return apiJson<Note[]>(`/patients/${patientId}/notes`);
}

export function createNote(
  patientId: string,
  body: string,
  appointmentId?: string,
) {
  return apiJson<Note>(`/patients/${patientId}/notes`, {
    method: "POST",
    body: {
      body,
      appointmentId: appointmentId || null,
    },
  });
}
