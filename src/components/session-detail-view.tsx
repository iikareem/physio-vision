"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/context/app-store";
import {
  inputClass,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import { formatDate, formatDateTime, isOpenSession } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";

type FocusTab = "notes" | "pdfs";

export function SessionDetailView({ sessionId }: { sessionId: string }) {
  const hydrated = useHydrated();
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
    setAppointmentStatus,
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
  const fileRef = useRef<HTMLInputElement>(null);
  const checkedInRef = useRef(false);

  useEffect(() => {
    if (!session?.patientId || !ready) return;
    void ensurePatientExtras(session.patientId).catch(() => undefined);
  }, [session?.patientId, ready, ensurePatientExtras]);

  useEffect(() => {
    if (!session || checkedInRef.current) return;
    if (session.status === "scheduled") {
      checkedInRef.current = true;
      void setAppointmentStatus(session.id, "checked_in").catch(() => {
        checkedInRef.current = false;
      });
    }
  }, [session, setAppointmentStatus]);

  if (!hydrated || !ready) {
    return <p className="text-stone-500">Loading…</p>;
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

  const open = isOpenSession(session.status);

  async function submitNote(e: FormEvent) {
    e.preventDefault();
    if (!noteBody.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addNote(patient!.id, noteBody.trim(), session!.id);
      setNoteBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setBusy(false);
    }
  }

  async function finishSession() {
    setBusy(true);
    setError(null);
    try {
      await setAppointmentStatus(session!.id, "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish session");
    } finally {
      setBusy(false);
    }
  }

  async function skipSession() {
    setBusy(true);
    setError(null);
    try {
      await setAppointmentStatus(session!.id, "no_show");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip session");
    } finally {
      setBusy(false);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach PDF");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel =
    session.status === "done"
      ? "Finished"
      : session.status === "no_show"
        ? "Skipped"
        : "In progress";

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/patients/${patient.id}`}
          className="link-accent text-sm font-semibold hover:underline"
        >
          ← {patient.name}
        </Link>
        <span className="rounded-full border-2 border-stone-300 bg-white px-3 py-1 text-xs font-bold text-stone-700">
          {statusLabel}
        </span>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <Surface className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Session · {formatDate(session.startsAt)}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-stone-900">
          {patient.name}
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          {session.type} · {patient.condition}
        </p>
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
            {open ? (
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
                  Save note
                </PrimaryButton>
              </form>
            ) : null}

            {sessionNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center">
                <p className="font-semibold text-stone-800">No notes yet</p>
                <p className="mt-1 text-sm text-stone-500">
                  {open
                    ? "Your first note for this session will show up here."
                    : "Nothing was saved on this session."}
                </p>
              </div>
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
            {open ? (
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
                  Attach PDF
                </PrimaryButton>
              </form>
            ) : null}

            {sessionDocs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center">
                <p className="font-semibold text-stone-800">No PDFs yet</p>
                <p className="mt-1 text-sm text-stone-500">
                  {open
                    ? "Attach a report or plan for this session."
                    : "No files were attached to this session."}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {sessionDocs.map((d) => (
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
                      onClick={() => {
                        void downloadDocument(d.id).catch((err) => {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Download failed",
                          );
                        });
                      }}
                      className="shrink-0 text-xs font-semibold text-teal-700 hover:underline"
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Surface>
      )}

      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md safe-bottom md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-2xl gap-2 md:pt-1">
            <PrimaryButton
              onClick={() => void finishSession()}
              disabled={busy}
              className="min-h-12 flex-1 text-base"
            >
              Finish session
            </PrimaryButton>
            <SecondaryButton
              onClick={() => void skipSession()}
              disabled={busy}
              className="min-h-12 px-5"
            >
              Skip
            </SecondaryButton>
          </div>
        </div>
      ) : (
        <Link
          href={`/patients/${patient.id}`}
          className="btn-accent inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-base font-bold shadow-sm sm:w-auto"
        >
          Back to patient
        </Link>
      )}
    </div>
  );
}
