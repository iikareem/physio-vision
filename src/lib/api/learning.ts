import { apiJson } from "@/lib/api/client";
import type { LearningItem, WorkspaceId } from "@/lib/types";

/** Learning is shared across clinic + private for the signed-in owner. */
export function listLearning(opts?: {
  patientId?: string;
  scope?: "general";
  done?: boolean;
}) {
  const params = new URLSearchParams();
  if (opts?.patientId) params.set("patientId", opts.patientId);
  if (opts?.scope) params.set("scope", opts.scope);
  if (opts?.done !== undefined) params.set("done", String(opts.done));
  const qs = params.toString();
  return apiJson<LearningItem[]>(qs ? `/learning?${qs}` : "/learning");
}

export function listPatientLearning(patientId: string) {
  return apiJson<LearningItem[]>(`/patients/${patientId}/learning`);
}

export function createLearning(input: {
  workspaceId: WorkspaceId;
  body: string;
  patientId?: string;
}) {
  return apiJson<LearningItem>("/learning", {
    method: "POST",
    body: {
      workspaceId: input.workspaceId,
      body: input.body,
      patientId: input.patientId || null,
    },
  });
}

export function createPatientLearning(patientId: string, body: string) {
  return apiJson<LearningItem>(`/patients/${patientId}/learning`, {
    method: "POST",
    body: { body },
  });
}

export function updateLearning(
  id: string,
  patch: { body?: string; done?: boolean },
) {
  return apiJson<LearningItem>(`/learning/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

export function deleteLearning(id: string) {
  return apiJson<void>(`/learning/${id}`, {
    method: "DELETE",
  });
}
