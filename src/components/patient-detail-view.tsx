"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { useHydrated } from "@/lib/use-hydrated";
import { AddSessionForm } from "@/components/add-session-form";
import { PatientStatusPicker } from "@/components/patient-status-picker";
import { AppointmentStatusBadge, PatientStatusBadge } from "@/components/status-badge";
import {
  AlertBanner,
  EmptyState,
  LoadingBlock,
  Spinner,
  useToast,
} from "@/components/feedback";
import { PresetOrCustomField } from "@/components/preset-or-custom-field";
import {
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  CHIEF_COMPLAINT_OPTIONS,
  CONDITION_OPTIONS,
  DIAGNOSIS_GROUPS,
  PRECAUTION_OPTIONS,
  TREATMENT_GOAL_OPTIONS,
} from "@/lib/patient-clinical-options";
import type { PatientStatus } from "@/lib/types";

export function PatientDetailView({ patientId }: { patientId: string }) {
  const hydrated = useHydrated();
  const toast = useToast();
  const {
    ready,
    workspaceId,
    getPatient,
    getNotesForPatient,
    getDocumentsForPatient,
    getSessionsForPatient,
    ensurePatientExtras,
    updatePatient,
    addNote,
    addDocument,
    downloadDocument,
  } = useAppStore();

  const patient = getPatient(patientId);
  const notes = getNotesForPatient(patientId);
  const documents = getDocumentsForPatient(patientId);
  const sessions = getSessionsForPatient(patientId);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [occupation, setOccupation] = useState("");
  const [condition, setCondition] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [ptEvaluation, setPtEvaluation] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [precautions, setPrecautions] = useState("");
  const [treatmentGoals, setTreatmentGoals] = useState("");
  const [status, setStatus] = useState<PatientStatus>("active");
  const [referredBy, setReferredBy] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [docLabel, setDocLabel] = useState("");
  const [docType, setDocType] = useState("PDF");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [extrasReady, setExtrasReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready || !patientId) return;
    setExtrasReady(false);
    void ensurePatientExtras(patientId)
      .catch(() => {
        /* list views still work without extras */
      })
      .finally(() => setExtrasReady(true));
  }, [ready, patientId, ensurePatientExtras]);

  if (!hydrated || !ready) {
    return <LoadingBlock label="Loading patient…" />;
  }

  if (!patient || patient.workspaceId !== workspaceId) {
    return (
      <div className="space-y-3">
        <p className="text-stone-700">
          Patient not found in the current workspace.
        </p>
        <Link href="/patients" className="font-semibold text-teal-700 hover:underline">
          Back to patients
        </Link>
      </div>
    );
  }

  function startEdit() {
    setName(patient!.name);
    setPhone(patient!.phone ?? "");
    setDateOfBirth(patient!.dateOfBirth ?? "");
    setOccupation(patient!.occupation ?? "");
    setCondition(patient!.condition);
    setDiagnosis(patient!.diagnosis ?? "");
    setChiefComplaint(patient!.chiefComplaint ?? "");
    setPtEvaluation(patient!.ptEvaluation ?? "");
    setMedicalHistory(patient!.medicalHistory ?? "");
    setPrecautions(patient!.precautions ?? "");
    setTreatmentGoals(patient!.treatmentGoals ?? "");
    setStatus(patient!.status);
    setReferredBy(patient!.referredBy ?? "");
    setEditing(true);
    setError(null);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updatePatient(patient!.id, {
        name: name.trim(),
        phone: phone.trim() || "",
        dateOfBirth: dateOfBirth.trim() || "",
        occupation: occupation.trim() || "",
        condition: condition.trim(),
        diagnosis: diagnosis.trim() || "",
        chiefComplaint: chiefComplaint.trim() || "",
        ptEvaluation: ptEvaluation.trim() || "",
        medicalHistory: medicalHistory.trim() || "",
        precautions: precautions.trim() || "",
        treatmentGoals: treatmentGoals.trim() || "",
        status,
        referredBy:
          status === "transferred" ? referredBy.trim() || "" : "",
      });
      setEditing(false);
      toast.success("Patient profile saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save patient");
    } finally {
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--accent-label)" }}
        >
          ← Board
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-stone-900">
              {patient.name}
            </h1>
            <p className="mt-1 text-stone-500">
              {patient.diagnosis ||
                patient.condition ||
                patient.chiefComplaint ||
                "No diagnosis recorded yet"}
            </p>
            <div className="mt-2">
              <PatientStatusBadge status={patient.status} />
            </div>
          </div>
          {!editing && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <PrimaryButton
                onClick={() => setBooking((v) => !v)}
                className="min-h-12 w-full px-5 text-base sm:w-auto"
              >
                {booking ? "Cancel booking" : "Book session"}
              </PrimaryButton>
              <SecondaryButton onClick={startEdit} className="min-h-12">
                Edit profile
              </SecondaryButton>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <AlertBanner tone="error" onDismiss={() => setError(null)}>
          {error}
        </AlertBanner>
      ) : null}

      {booking && (
        <AddSessionForm
          lockedPatientId={patient.id}
          onCancel={() => setBooking(false)}
        />
      )}

      {editing ? (
        <Surface className="p-5">
          <form onSubmit={saveEdit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  className={inputClass}
                />
              </Field>
              <Field label="Date of birth (optional)">
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Occupation (optional)">
                <input
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <p className="text-sm text-stone-500">
              Tap a chip to fill a field, or type your own wording underneath.
            </p>

            <PresetOrCustomField
              label="Condition / area"
              hint="Optional — body region or presenting issue"
              value={condition}
              onChange={setCondition}
              options={CONDITION_OPTIONS}
              placeholder="e.g. Left knee after fall…"
            />
            <PresetOrCustomField
              label="Working diagnosis"
              hint="Your physio impression by region — not a doctor’s medical diagnosis."
              value={diagnosis}
              onChange={setDiagnosis}
              groups={DIAGNOSIS_GROUPS}
              featured
              placeholder="Type a custom impression if none of the chips fit…"
            />
            <PresetOrCustomField
              label="Main problem"
              hint="Optional — what brought them in"
              value={chiefComplaint}
              onChange={setChiefComplaint}
              options={CHIEF_COMPLAINT_OPTIONS}
              placeholder="What matters most to the patient…"
            />
            <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
              <Field label="PT evaluation (optional)">
                <textarea
                  value={ptEvaluation}
                  onChange={(e) => setPtEvaluation(e.target.value)}
                  rows={4}
                  placeholder="ROM, strength, special tests, functional findings…"
                  className={`${inputClass} min-h-[5.5rem] py-3`}
                />
              </Field>
            </div>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
              <Field label="Relevant history (optional)">
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  rows={3}
                  placeholder="Past injuries, surgeries, meds…"
                  className={`${inputClass} min-h-[5rem] py-3`}
                />
              </Field>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <PresetOrCustomField
                label="Precautions"
                hint="Optional"
                value={precautions}
                onChange={setPrecautions}
                options={PRECAUTION_OPTIONS}
                placeholder="Anything to watch or avoid…"
                multiline
              />
              <PresetOrCustomField
                label="Treatment goals"
                hint="Optional"
                value={treatmentGoals}
                onChange={setTreatmentGoals}
                options={TREATMENT_GOAL_OPTIONS}
                placeholder="What you and the patient are working toward…"
                multiline
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-stone-600">Status</p>
              <PatientStatusPicker value={status} onChange={setStatus} />
              {status === "transferred" ? (
                <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/80 p-3.5">
                  <Field label="Referring doctor — optional">
                    <input
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="Leave blank if unknown"
                      className={inputClass}
                    />
                  </Field>
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> Saving…
                  </span>
                ) : (
                  "Save"
                )}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
              >
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </Surface>
      ) : (
        <div className="space-y-4">
          {(patient.diagnosis || patient.condition || patient.chiefComplaint) && (
            <div
              className="rounded-2xl border border-[color:var(--accent)]/20 p-5 shadow-sm"
              style={{
                background:
                  "linear-gradient(160deg, color-mix(in srgb, var(--accent-soft) 70%, white), white 70%)",
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--accent-label)]">
                Working diagnosis
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-stone-900">
                {patient.diagnosis ||
                  patient.condition ||
                  patient.chiefComplaint}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
                {patient.condition && patient.diagnosis ? (
                  <span>
                    <span className="text-stone-400">Area · </span>
                    {patient.condition}
                  </span>
                ) : null}
                {patient.chiefComplaint ? (
                  <span>
                    <span className="text-stone-400">Main problem · </span>
                    {patient.chiefComplaint}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          <dl className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Phone
              </dt>
              <dd className="mt-1 text-stone-800">{patient.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Date of birth
              </dt>
              <dd className="mt-1 text-stone-800">
                {patient.dateOfBirth
                  ? formatDate(`${patient.dateOfBirth}T12:00:00`)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Occupation
              </dt>
              <dd className="mt-1 text-stone-800">
                {patient.occupation || "—"}
              </dd>
            </div>
            {patient.status === "transferred" && patient.referredBy ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  Referred by
                </dt>
                <dd className="mt-1 text-stone-800">{patient.referredBy}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Patient since
              </dt>
              <dd className="mt-1 text-stone-800">
                {formatDate(patient.createdAt)}
              </dd>
            </div>
          </dl>

          {(patient.ptEvaluation ||
            patient.medicalHistory ||
            patient.precautions ||
            patient.treatmentGoals) && (
            <dl className="grid gap-4 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm sm:grid-cols-2">
              {patient.ptEvaluation ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    PT evaluation
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-stone-800">
                    {patient.ptEvaluation}
                  </dd>
                </div>
              ) : null}
              {patient.medicalHistory ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Relevant history
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-stone-800">
                    {patient.medicalHistory}
                  </dd>
                </div>
              ) : null}
              {patient.precautions ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Precautions
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-stone-800">
                    {patient.precautions}
                  </dd>
                </div>
              ) : null}
              {patient.treatmentGoals ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Treatment goals
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-stone-800">
                    {patient.treatmentGoals}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <Surface className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
              Sessions
            </h2>
            <Link
              href="/sessions"
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              All sessions
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-stone-100">
            {sessions.length === 0 ? (
              <li className="py-4">
                <EmptyState
                  title="No sessions yet"
                  description="Book a session to start the clinical record."
                />
              </li>
            ) : (
              sessions.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-stone-50/80"
                  >
                    <div>
                      <p className="font-semibold text-stone-900">
                        {formatDate(s.startsAt)}
                      </p>
                      <p className="text-sm text-stone-500">{s.type}</p>
                    </div>
                    <AppointmentStatusBadge status={s.status} />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Surface>

        <Surface className="p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
            Notes
          </h2>
          <form
            className="mt-3 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!noteBody.trim() || busy) return;
              setBusy(true);
              setError(null);
              try {
                await addNote(patient.id, noteBody.trim());
                setNoteBody("");
                toast.success("Note saved");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to add note");
              } finally {
                setBusy(false);
              }
            }}
          >
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="General patient note…"
              className={`${inputClass} min-h-[5rem] py-3`}
            />
            <PrimaryButton type="submit" disabled={!noteBody.trim() || busy}>
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Saving…
                </span>
              ) : (
                "Add note"
              )}
            </PrimaryButton>
          </form>
          <ul className="mt-4 space-y-3">
            {!extrasReady ? (
              <li className="py-6 text-center text-sm text-stone-500">
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4 text-[color:var(--accent)]" />
                  Loading notes…
                </span>
              </li>
            ) : notes.length === 0 ? (
              <li>
                <EmptyState
                  title="No notes yet"
                  description="Add a general note or open a session for clinical notes."
                />
              </li>
            ) : (
              notes.slice(0, 6).map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-3"
                >
                  <p className="whitespace-pre-wrap text-sm text-stone-800">
                    {n.body}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-500">
                    {formatDateTime(n.createdAt)}
                    {n.appointmentId ? (
                      <>
                        {" · "}
                        <Link
                          href={`/sessions/${n.appointmentId}`}
                          className="font-medium text-teal-700 hover:underline"
                        >
                          Session
                        </Link>
                      </>
                    ) : null}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Surface>
      </section>

      <Surface className="p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
          Documents
        </h2>
        <form
          className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem_auto_auto]"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!docFile || busy) return;
            setBusy(true);
            setError(null);
            try {
              await addDocument({
                patientId: patient.id,
                file: docFile,
                label: docLabel.trim() || docFile.name,
                type: docType,
              });
              setDocLabel("");
              setDocFile(null);
              if (fileRef.current) fileRef.current.value = "";
              toast.success("Document uploaded");
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to upload document",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            value={docLabel}
            onChange={(e) => setDocLabel(e.target.value)}
            placeholder="Label (e.g. Lumbar MRI)"
            className={inputClass}
          />
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className={inputClass}
          >
            <option>PDF</option>
            <option>X-ray</option>
            <option>MRI</option>
            <option>Ultrasound</option>
            <option>Other</option>
          </select>
          <input
            ref={fileRef}
            type="file"
            required
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            className="min-h-11 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
          />
          <PrimaryButton type="submit" disabled={!docFile || busy}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Uploading…
              </span>
            ) : (
              "Upload"
            )}
          </PrimaryButton>
        </form>
        <ul className="mt-4 space-y-2">
          {!extrasReady ? (
            <li className="py-6 text-center text-sm text-stone-500">
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4 text-[color:var(--accent)]" />
                Loading documents…
              </span>
            </li>
          ) : documents.length === 0 ? (
            <li>
              <EmptyState
                title="No documents yet"
                description="Upload a PDF, scan, or report for this patient."
              />
            </li>
          ) : (
            documents.map((d) => {
              const isDownloading = downloadingId === d.id;
              return (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-stone-800">{d.label}</p>
                    <p className="truncate text-xs text-stone-500">
                      {d.type} · {d.fileName} · {formatDate(d.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {d.appointmentId ? (
                      <Link
                        href={`/sessions/${d.appointmentId}`}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Session
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      disabled={Boolean(downloadingId)}
                      onClick={() => void handleDownload(d.id)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60"
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
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </Surface>
    </div>
  );
}
