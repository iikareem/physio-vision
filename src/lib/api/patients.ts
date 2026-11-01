import { apiJson } from "@/lib/api/client";
import type { Patient, PatientProfileInput, PatientStatus, WorkspaceId } from "@/lib/types";

export function listPatients(workspace: WorkspaceId, opts?: { board?: boolean; status?: PatientStatus }) {
  const params = new URLSearchParams({ workspace });
  if (opts?.board) params.set("board", "true");
  if (opts?.status) params.set("status", opts.status);
  return apiJson<Patient[]>(`/patients?${params}`);
}

export function getPatient(id: string) {
  return apiJson<Patient>(`/patients/${id}`);
}

function optionalBodyField(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function createPatient(
  input: { workspaceId: WorkspaceId } & PatientProfileInput,
) {
  return apiJson<Patient>("/patients", {
    method: "POST",
    body: {
      workspaceId: input.workspaceId,
      name: input.name,
      phone: optionalBodyField(input.phone),
      email: optionalBodyField(input.email),
      dateOfBirth: optionalBodyField(input.dateOfBirth),
      occupation: optionalBodyField(input.occupation),
      condition: input.condition?.trim() ?? "",
      diagnosis: optionalBodyField(input.diagnosis),
      chiefComplaint: optionalBodyField(input.chiefComplaint),
      ptEvaluation: optionalBodyField(input.ptEvaluation),
      medicalHistory: optionalBodyField(input.medicalHistory),
      precautions: optionalBodyField(input.precautions),
      treatmentGoals: optionalBodyField(input.treatmentGoals),
      status: input.status ?? "active",
      referredBy: optionalBodyField(input.referredBy),
    },
  });
}

const CLEARABLE_KEYS = [
  "phone",
  "email",
  "dateOfBirth",
  "occupation",
  "diagnosis",
  "chiefComplaint",
  "ptEvaluation",
  "medicalHistory",
  "precautions",
  "treatmentGoals",
  "referredBy",
] as const;

export function updatePatient(
  id: string,
  patch: Partial<PatientProfileInput>,
) {
  const body: Record<string, unknown> = { ...patch };
  for (const key of CLEARABLE_KEYS) {
    if (key in patch) {
      body[key] = optionalBodyField(patch[key]);
    }
  }
  if (patch.condition !== undefined) {
    body.condition = patch.condition.trim();
  }
  return apiJson<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body,
  });
}
