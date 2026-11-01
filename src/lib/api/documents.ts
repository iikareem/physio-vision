import { apiBlob, apiJson } from "@/lib/api/client";
import type { Document } from "@/lib/types";

export function listDocuments(patientId: string) {
  return apiJson<Document[]>(`/patients/${patientId}/documents`);
}

export function uploadDocument(input: {
  patientId: string;
  file: File;
  label?: string;
  type?: string;
  appointmentId?: string;
}) {
  const form = new FormData();
  form.append("file", input.file);
  if (input.label) form.append("label", input.label);
  if (input.type) form.append("type", input.type);
  if (input.appointmentId) form.append("appointmentId", input.appointmentId);

  return apiJson<Document>(`/patients/${input.patientId}/documents`, {
    method: "POST",
    formData: form,
  });
}

export function downloadDocumentFile(id: string) {
  return apiBlob(`/documents/${id}/file`);
}
