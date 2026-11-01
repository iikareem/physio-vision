import { apiJson } from "@/lib/api/client";
import type { Patient, PatientStatus, WorkspaceId } from "@/lib/types";

export function listPatients(workspace: WorkspaceId, opts?: { board?: boolean; status?: PatientStatus }) {
  const params = new URLSearchParams({ workspace });
  if (opts?.board) params.set("board", "true");
  if (opts?.status) params.set("status", opts.status);
  return apiJson<Patient[]>(`/patients?${params}`);
}

export function getPatient(id: string) {
  return apiJson<Patient>(`/patients/${id}`);
}

export function createPatient(input: {
  workspaceId: WorkspaceId;
  name: string;
  phone?: string;
  condition: string;
  status?: PatientStatus;
  referredBy?: string;
}) {
  return apiJson<Patient>("/patients", {
    method: "POST",
    body: {
      workspaceId: input.workspaceId,
      name: input.name,
      phone: input.phone ?? null,
      condition: input.condition,
      status: input.status ?? "active",
      referredBy: input.referredBy ?? null,
    },
  });
}

export function updatePatient(
  id: string,
  patch: Partial<
    Pick<Patient, "name" | "phone" | "condition" | "status" | "referredBy">
  >,
) {
  return apiJson<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body: {
      ...patch,
      phone: patch.phone === undefined ? undefined : patch.phone || "",
      referredBy:
        patch.referredBy === undefined ? undefined : patch.referredBy || "",
    },
  });
}
