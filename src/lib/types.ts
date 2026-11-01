export type WorkspaceId = "clinic" | "private";

export type PatientStatus =
  | "active"
  | "terminated"
  | "transferred"
  | "discharged";

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "done"
  | "no_show";

export interface Workspace {
  id: WorkspaceId;
  name: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  workspaceId: WorkspaceId;
  name: string;
  phone?: string;
  condition: string;
  status: PatientStatus;
  /** Referring doctor when status is transferred (referred in). */
  referredBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  patientId: string;
  /** Optional link to a specific session/appointment */
  appointmentId?: string;
  body: string;
  createdAt: string;
}

export interface Document {
  id: string;
  patientId: string;
  appointmentId?: string;
  label: string;
  type: string;
  fileName: string;
  storageKey: string;
  contentType?: string;
  byteSize?: number;
  uploadedAt: string;
}

export interface Appointment {
  id: string;
  workspaceId: WorkspaceId;
  patientId: string;
  startsAt: string;
  status: AppointmentStatus;
  type: string;
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
}
