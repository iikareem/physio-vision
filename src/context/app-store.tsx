"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/auth-context";
import * as appointmentsApi from "@/lib/api/appointments";
import * as documentsApi from "@/lib/api/documents";
import * as notesApi from "@/lib/api/notes";
import * as patientsApi from "@/lib/api/patients";
import { saveBlobAsFile } from "@/lib/download";
import type {
  Appointment,
  AppointmentStatus,
  Document,
  Note,
  Patient,
  WorkspaceId,
} from "@/lib/types";

const WORKSPACE_KEY = "physio-vision-workspace";

type AppStoreValue = {
  ready: boolean;
  error: string | null;
  workspaceId: WorkspaceId;
  setWorkspaceId: (id: WorkspaceId) => void;
  patients: Patient[];
  notes: Note[];
  documents: Document[];
  appointments: Appointment[];
  getPatient: (id: string) => Patient | undefined;
  getAppointment: (id: string) => Appointment | undefined;
  getNotesForPatient: (patientId: string) => Note[];
  getNotesForAppointment: (appointmentId: string) => Note[];
  getDocumentsForPatient: (patientId: string) => Document[];
  getDocumentsForAppointment: (appointmentId: string) => Document[];
  getSessionsForPatient: (patientId: string) => Appointment[];
  ensurePatientExtras: (patientId: string) => Promise<void>;
  todayAppointments: Appointment[];
  workspaceSessions: Appointment[];
  addPatient: (
    input: Omit<Patient, "id" | "workspaceId" | "createdAt" | "updatedAt">,
  ) => Promise<Patient>;
  updatePatient: (
    id: string,
    patch: Partial<
      Pick<Patient, "name" | "phone" | "condition" | "status" | "referredBy">
    >,
  ) => Promise<void>;
  addNote: (
    patientId: string,
    body: string,
    appointmentId?: string,
  ) => Promise<void>;
  addDocument: (input: {
    patientId: string;
    file: File;
    label: string;
    type: string;
    appointmentId?: string;
  }) => Promise<Document>;
  downloadDocument: (
    id: string,
  ) => Promise<{ mode: "download" | "open"; fileName: string }>;
  addAppointment: (input: {
    patientId: string;
    startsAt: string;
    type: string;
  }) => Promise<Appointment>;
  setAppointmentStatus: (
    id: string,
    status: AppointmentStatus,
  ) => Promise<void>;
  updateAppointmentSummary: (id: string, summary: string) => Promise<void>;
  clearCache: () => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

function loadWorkspace(): WorkspaceId {
  if (typeof window === "undefined") return "clinic";
  const raw = localStorage.getItem(WORKSPACE_KEY);
  return raw === "private" ? "private" : "clinic";
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const [workspaceId, setWorkspaceIdState] = useState<WorkspaceId>("clinic");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadedPatients, setLoadedPatients] = useState<Set<string>>(
    () => new Set(),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setWorkspaceIdState(loadWorkspace());
    setNow(new Date());
  }, []);

  const clearCache = useCallback(() => {
    setPatients([]);
    setAppointments([]);
    setNotes([]);
    setDocuments([]);
    setLoadedPatients(new Set());
    setReady(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      clearCache();
      return;
    }

    let cancelled = false;
    setReady(false);
    setError(null);

    Promise.all([
      patientsApi.listPatients(workspaceId),
      appointmentsApi.listAppointments(workspaceId),
    ])
      .then(([nextPatients, nextAppointments]) => {
        if (cancelled) return;
        setPatients(nextPatients);
        setAppointments(nextAppointments);
        setNotes([]);
        setDocuments([]);
        setLoadedPatients(new Set());
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status, user, workspaceId, clearCache]);

  const setWorkspaceId = useCallback((id: WorkspaceId) => {
    setWorkspaceIdState(id);
    localStorage.setItem(WORKSPACE_KEY, id);
  }, []);

  const workspaceSessions = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      ),
    [appointments],
  );

  const todayAppointments = useMemo(() => {
    if (!now) return [];
    return appointments
      .filter((a) => {
        const d = new Date(a.startsAt);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [appointments, now]);

  const getPatient = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients],
  );

  const getAppointment = useCallback(
    (id: string) => appointments.find((a) => a.id === id),
    [appointments],
  );

  const getNotesForPatient = useCallback(
    (patientId: string) =>
      notes
        .filter((n) => n.patientId === patientId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [notes],
  );

  const getNotesForAppointment = useCallback(
    (appointmentId: string) =>
      notes
        .filter((n) => n.appointmentId === appointmentId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [notes],
  );

  const getDocumentsForPatient = useCallback(
    (patientId: string) =>
      documents
        .filter((d) => d.patientId === patientId)
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime(),
        ),
    [documents],
  );

  const getDocumentsForAppointment = useCallback(
    (appointmentId: string) =>
      documents
        .filter((d) => d.appointmentId === appointmentId)
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime(),
        ),
    [documents],
  );

  const getSessionsForPatient = useCallback(
    (patientId: string) =>
      appointments
        .filter((a) => a.patientId === patientId)
        .sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
        ),
    [appointments],
  );

  const ensurePatientExtras = useCallback(
    async (patientId: string) => {
      if (loadedPatients.has(patientId)) return;
      const [patientNotes, patientDocs] = await Promise.all([
        notesApi.listNotes(patientId),
        documentsApi.listDocuments(patientId),
      ]);
      setNotes((prev) => [
        ...prev.filter((n) => n.patientId !== patientId),
        ...patientNotes,
      ]);
      setDocuments((prev) => [
        ...prev.filter((d) => d.patientId !== patientId),
        ...patientDocs,
      ]);
      setLoadedPatients((prev) => new Set(prev).add(patientId));
    },
    [loadedPatients],
  );

  const addPatient = useCallback(
    async (
      input: Omit<Patient, "id" | "workspaceId" | "createdAt" | "updatedAt">,
    ) => {
      const patient = await patientsApi.createPatient({
        workspaceId,
        name: input.name,
        phone: input.phone,
        condition: input.condition,
        status: input.status,
        referredBy: input.referredBy,
      });
      setPatients((prev) => [patient, ...prev]);
      return patient;
    },
    [workspaceId],
  );

  const updatePatient = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<Patient, "name" | "phone" | "condition" | "status" | "referredBy">
      >,
    ) => {
      const patient = await patientsApi.updatePatient(id, patch);
      setPatients((prev) => prev.map((p) => (p.id === id ? patient : p)));
    },
    [],
  );

  const addNote = useCallback(
    async (patientId: string, body: string, appointmentId?: string) => {
      const note = await notesApi.createNote(patientId, body, appointmentId);
      setNotes((prev) => [note, ...prev]);
    },
    [],
  );

  const addDocument = useCallback(
    async (input: {
      patientId: string;
      file: File;
      label: string;
      type: string;
      appointmentId?: string;
    }) => {
      const doc = await documentsApi.uploadDocument(input);
      setDocuments((prev) => [doc, ...prev]);
      return doc;
    },
    [],
  );

  const downloadDocument = useCallback(
    async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      const fileName = doc?.fileName || "document";
      const blob = await documentsApi.downloadDocumentFile(id);
      const result = await saveBlobAsFile(blob, fileName);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return { mode: result.mode, fileName };
    },
    [documents],
  );

  const addAppointment = useCallback(
    async (input: {
      patientId: string;
      startsAt: string;
      type: string;
    }) => {
      const appointment = await appointmentsApi.createAppointment({
        workspaceId,
        patientId: input.patientId,
        startsAt: input.startsAt,
        type: input.type,
      });
      setAppointments((prev) => [...prev, appointment]);
      return appointment;
    },
    [workspaceId],
  );

  const setAppointmentStatus = useCallback(
    async (id: string, nextStatus: AppointmentStatus) => {
      const appointment = await appointmentsApi.updateAppointment(id, {
        status: nextStatus,
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? appointment : a)),
      );
    },
    [],
  );

  const updateAppointmentSummary = useCallback(
    async (id: string, summary: string) => {
      const appointment = await appointmentsApi.updateAppointment(id, {
        summary,
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? appointment : a)),
      );
    },
    [],
  );

  const value: AppStoreValue = {
    ready: status === "authenticated" ? ready : false,
    error,
    workspaceId,
    setWorkspaceId,
    patients,
    notes,
    documents,
    appointments,
    getPatient,
    getAppointment,
    getNotesForPatient,
    getNotesForAppointment,
    getDocumentsForPatient,
    getDocumentsForAppointment,
    getSessionsForPatient,
    ensurePatientExtras,
    todayAppointments,
    workspaceSessions,
    addPatient,
    updatePatient,
    addNote,
    addDocument,
    downloadDocument,
    addAppointment,
    setAppointmentStatus,
    updateAppointmentSummary,
    clearCache,
  };

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return ctx;
}
