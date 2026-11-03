"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/context/app-store";
import {
  AlertBanner,
  EmptyState,
  LoadingBlock,
  Spinner,
  useToast,
} from "@/components/feedback";
import {
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import {
  dateOnlyIso,
  formatDate,
  formatDateTime,
  isOpenSession,
  todayDateInputValue,
} from "@/lib/format";
import { SESSION_TYPES } from "@/lib/session-types";
import { useHydrated } from "@/lib/use-hydrated";

type FocusTab = "notes" | "pdfs";

export function SessionDetailView({ sessionId }: { sessionId: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const toast = useToast();
  const {
    ready,
    workspaceId,
    getAppointment,
    getPatient,
    getNotesForAppointment,
    getDocumentsForAppointment,
    ensurePatientExtras,
    addNote,
    addDocument,
    downloadDocument,
    updateAppointment,
    setAppointmentStatus,
    deleteAppointment,
  } = useAppStore();

  const session = getAppointment(sessionId);
  const patient = session ? getPatient(session.patientId) : undefined;
  const sessionNotes = getNotesForAppointment(sessionId);
  const sessionDocs = getDocumentsForAppointment(sessionId);

  const [focus, setFocus] = useState<FocusTab>("notes");
  const [noteBody, setNoteBody] = useState("");
  const [pdfLabel, setPdfLabel] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [extrasReady, setExtrasReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const promotedRef = useRef(false);

  useEffect(() => {
    if (!session?.patientId || !ready) return;
    setExtrasReady(false);
    void ensurePatientExtras(session.patientId)
      .catch(() => undefined)
      .finally(() => setExtrasReady(true));
  }, [session?.patientId, ready, ensurePatientExtras]);

  // Older rows used scheduled → in progress → done. Promote them quietly.
  useEffect(() => {
    if (!session || promotedRef.current) return;
    if (!isOpenSession(session.status)) return;
    promotedRef.current = true;
    void setAppointmentStatus(session.id, "done").catch(() => {
      promotedRef.current = false;
    });
  }, [session, setAppointmentStatus]);

  if (!hydrated || !ready) {
    return <LoadingBlock label="Loading session…" />;
  }

  if (!session || session.workspaceId !== workspaceId || !patient) {
    return (
      <div className="space-y-3">
        <p className="text-stone-700">Session not found in this workspace.</p>
        <Link href="/" className="link-accent hover:underline">
          Back to board
        </Link>
      </div>
    );
  }

  async function submitNote(e: FormEvent) {
    e.preventDefault();
    if (!noteBody.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addNote(patient!.id, noteBody.trim(), session!.id);
      setNoteBody("");
      toast.success("Note saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    setEditDate(todayDateInputValue(new Date(session!.startsAt)));
    setEditType(session!.type);
    setConfirmDelete(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setConfirmDelete(false);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editDate || !editType.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateAppointment(session!.id, {
        startsAt: dateOnlyIso(editDate),
        type: editType.trim(),
      });
      setEditing(false);
      toast.success("Session updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update session");
    } finally {
      setBusy(false);
    }
  }

  async function removeSession() {
    setBusy(true);
    setError(null);
    try {
      const patientId = patient!.id;
      await deleteAppointment(session!.id);
      toast.success("Session deleted");
      router.push(`/patients/${patientId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete session");
      setBusy(false);
    }
  }

  async function handleDownload(docId: string) {
    if (downloadingId) return;
    setDownloadingId(docId);
    setError(null);
    toast.info("Preparing document…");
    try {
      const result = await downloadDocument(docId);
      toast.success(
        result.mode === "open"
          ? `Opened ${result.fileName}`
          : `Downloading ${result.fileName}`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Download failed";
      setError(message);
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  }

  function onPickPdf(file: File | null) {
    if (!file) return;
    setPdfFile(file);
    if (!pdfLabel.trim()) {
      setPdfLabel(file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "));
    }
  }

  async function attachPdf(e: FormEvent) {
    e.preventDefault();
    if (!pdfFile || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addDocument({
        patientId: patient!.id,
        appointmentId: session!.id,
        label: pdfLabel.trim() || pdfFile.name,
        type: "PDF",
        file: pdfFile,
      });
      setPdfLabel("");
      setPdfFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("PDF attached");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/patients/${patient.id}`}
          className="link-accent text-sm font-semibold hover:underline"
        >
          ← {patient.name}
        </Link>
      </div>

      {error ? (
        <AlertBanner tone="error" onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      ) : null}

      <Surface className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Session · {formatDate(session.startsAt)}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-stone-900">
              {patient.name}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {session.type}
              {patient.condition || patient.diagnosis
                ? ` · ${patient.condition || patient.diagnosis}`
                : ""}
            </p>
          </div>
          {!editing ? (
            <SecondaryButton
              onClick={startEdit}
              disabled={busy}
              className="shrink-0 px-3 py-2 text-sm"
            >
              Edit
            </SecondaryButton>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={saveEdit} className="mt-4 space-y-4 border-t border-stone-100 pt-4">
            <Field label="Date">
              <input
                required
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-stone-600">
                Session type
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                {SESSION_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`min-h-9 rounded-full px-3 text-sm font-bold ${
                      editType === t
                        ? "btn-accent"
                        : "border-2 border-stone-300 bg-white text-stone-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                required
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                placeholder="Or type a custom type…"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <PrimaryButton
                type="submit"
                disabled={!editDate || !editType.trim() || busy}
                className="min-h-11 flex-1"
              >
                {busy ? "Saving…" : "Save changes"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={cancelEdit}
                disabled={busy}
                className="min-h-11"
              >
                Cancel
              </SecondaryButton>
            </div>
          </form>
        ) : null}
      </Surface>

      <div
        role="tablist"
        aria-label="Session focus"
        className="grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={focus === "notes"}
          onClick={() => setFocus("notes")}
          className={`min-h-12 rounded-2xl border-2 px-4 text-sm font-bold transition ${
            focus === "notes"
              ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-stone-900"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          }`}
        >
          Notes
          <span className="ml-2 tabular-nums text-stone-500">
            {sessionNotes.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={focus === "pdfs"}
          onClick={() => setFocus("pdfs")}
          className={`min-h-12 rounded-2xl border-2 px-4 text-sm font-bold transition ${
            focus === "pdfs"
              ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-stone-900"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          }`}
        >
          PDFs
          <span className="ml-2 tabular-nums text-stone-500">
            {sessionDocs.length}
          </span>
        </button>
      </div>

      {focus === "notes" && (
        <Surface className="overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-stone-900">
              Session notes
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Write what matters for this session — findings, exercises, plan.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            <form onSubmit={submitNote} className="space-y-3">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={8}
                autoFocus
                placeholder="Start typing the note for this session…"
                className={`${inputClass} min-h-[12rem] resize-y py-3.5 text-base leading-relaxed`}
              />
              <PrimaryButton
                type="submit"
                disabled={!noteBody.trim() || busy}
                className="min-h-12 w-full text-base sm:w-auto sm:min-w-[10rem]"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> Saving…
                  </span>
                ) : (
                  "Save note"
                )}
              </PrimaryButton>
            </form>

            {!extrasReady ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-500">
                <Spinner className="h-4 w-4 text-[color:var(--accent)]" />
                Loading notes…
              </div>
            ) : sessionNotes.length === 0 ? (
              <EmptyState
                title="No notes yet"
                description="Your first note for this session will show up here."
              />
            ) : (
              <ul className="space-y-3">
                {sessionNotes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-2xl border-2 border-stone-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-800">
                      {n.body}
                    </p>
                    <p className="mt-3 text-xs font-medium text-stone-400">
                      Saved {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Surface>
      )}

      {focus === "pdfs" && (
        <Surface className="overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-stone-900">
              Session PDFs
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Attach reports, scans, or plans for this session only.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            <form onSubmit={attachPdf} className="space-y-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                  aria-hidden
                >
                  PDF
                </span>
                <span className="mt-3 text-base font-bold text-stone-900">
                  {pdfFile ? "Change PDF" : "Choose PDF"}
                </span>
                <span className="mt-1 text-sm text-stone-500">
                  {pdfFile?.name || "Tap to select a .pdf file"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => onPickPdf(e.target.files?.[0] ?? null)}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-600">
                  Label
                </label>
                <input
                  value={pdfLabel}
                  onChange={(e) => setPdfLabel(e.target.value)}
                  placeholder="e.g. MRI lumbar, Home exercise sheet"
                  className={inputClass}
                />
              </div>

              <PrimaryButton
                type="submit"
                disabled={!pdfFile || busy}
                className="min-h-12 w-full text-base sm:w-auto sm:min-w-[10rem]"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> Uploading…
                  </span>
                ) : (
                  "Attach PDF"
                )}
              </PrimaryButton>
            </form>

            {!extrasReady ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-500">
                <Spinner className="h-4 w-4 text-[color:var(--accent)]" />
                Loading documents…
              </div>
            ) : sessionDocs.length === 0 ? (
              <EmptyState
                title="No PDFs yet"
                description="Attach a report or plan for this session."
              />
            ) : (
              <ul className="space-y-3">
                {sessionDocs.map((d) => {
                  const isDownloading = downloadingId === d.id;
                  return (
                    <li
                      key={d.id}
                      className="flex items-start gap-3 rounded-2xl border-2 border-stone-200 bg-white px-4 py-4 shadow-sm"
                    >
                      <span
                        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                        style={{ backgroundColor: "var(--accent)" }}
                        aria-hidden
                      >
                        PDF
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-stone-900">{d.label}</p>
                        <p className="mt-0.5 truncate text-sm text-stone-500">
                          {d.fileName}
                        </p>
                        <p className="mt-2 text-xs font-medium text-stone-400">
                          Added {formatDate(d.uploadedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={Boolean(downloadingId)}
                        onClick={() => void handleDownload(d.id)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <>
                            <Spinner className="h-3.5 w-3.5" />
                            Opening…
                          </>
                        ) : (
                          "Open / Download"
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Surface>
      )}

      <Surface className="overflow-hidden">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-stone-900">
            Manage session
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Edit the date or type above, or delete this session.
          </p>
        </div>

        <div className="space-y-3 px-5 py-5">
          <Link
            href={`/patients/${patient.id}`}
            className="btn-secondary inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold sm:w-auto"
          >
            Back to patient
          </Link>

          {!confirmDelete ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
              className="min-h-11 w-full rounded-xl border-2 border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
            >
              Delete session
            </button>
          ) : (
            <div className="space-y-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-medium text-rose-800">
                Delete this session? Notes and PDFs stay on the patient; only
                the session record is removed.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeSession()}
                  className="min-h-11 flex-1 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-50"
                >
                  {busy ? "Deleting…" : "Yes, delete"}
                </button>
                <SecondaryButton
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-11"
                >
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}
