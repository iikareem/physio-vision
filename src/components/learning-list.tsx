"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { EmptyState, Spinner } from "@/components/feedback";
import { PrimaryButton, SecondaryButton, inputClass } from "@/components/ui";
import { useAppStore } from "@/context/app-store";
import { formatDateTime } from "@/lib/format";
import type { LearningItem } from "@/lib/types";

export function LearningComposer({
  placeholder,
  busy,
  onAdd,
}: {
  placeholder: string;
  busy: boolean;
  onAdd: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || busy || saving) return;
    setSaving(true);
    try {
      await onAdd(trimmed);
      setBody("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={`${inputClass} min-h-[5rem] py-3`}
      />
      <PrimaryButton type="submit" disabled={!body.trim() || busy || saving}>
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" /> Saving…
          </span>
        ) : (
          "Add to learning"
        )}
      </PrimaryButton>
    </form>
  );
}

export function LearningItemRow({
  item,
  showPatientLink,
  busy,
  onToggleDone,
  onRemove,
}: {
  item: LearningItem;
  showPatientLink?: boolean;
  busy?: boolean;
  onToggleDone: (id: string, done: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { workspaceId, setWorkspaceId } = useAppStore();
  const [acting, setActing] = useState(false);

  async function toggle() {
    if (busy || acting) return;
    setActing(true);
    try {
      await onToggleDone(item.id, !item.done);
    } finally {
      setActing(false);
    }
  }

  async function remove() {
    if (busy || acting) return;
    setActing(true);
    try {
      await onRemove(item.id);
    } finally {
      setActing(false);
    }
  }

  function openPatient() {
    if (item.workspaceId && item.workspaceId !== workspaceId) {
      setWorkspaceId(item.workspaceId);
    }
  }

  return (
    <li
      className={`rounded-xl border px-3 py-3 ${
        item.done
          ? "border-stone-100 bg-stone-50/60 opacity-70"
          : "border-stone-100 bg-stone-50/80"
      }`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy || acting}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
            item.done
              ? "border-teal-600 bg-teal-600 text-white"
              : "border-stone-300 bg-white text-transparent hover:border-teal-500"
          }`}
          aria-label={item.done ? "Mark as to learn" : "Mark as learned"}
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden>
            <path d="M6.4 11.2 3.2 8l1.13-1.13L6.4 8.93l5.27-5.26L12.8 4.8 6.4 11.2Z" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`whitespace-pre-wrap text-sm text-stone-800 ${
              item.done ? "line-through decoration-stone-400" : ""
            }`}
          >
            {item.body}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
            <span>{formatDateTime(item.createdAt)}</span>
            {showPatientLink && item.patientId ? (
              <Link
                href={`/patients/${item.patientId}`}
                onClick={openPatient}
                className="font-medium text-teal-700 hover:underline"
              >
                {item.patientName || "Patient"}
                {item.workspaceId && item.workspaceId !== workspaceId
                  ? ` · ${item.workspaceId}`
                  : ""}
              </Link>
            ) : showPatientLink ? (
              <span className="font-medium text-stone-600">General</span>
            ) : null}
          </p>
        </div>
        <SecondaryButton
          type="button"
          onClick={() => void remove()}
          disabled={busy || acting}
          className="!min-h-8 shrink-0 !px-2.5 !py-1 !text-xs"
        >
          Remove
        </SecondaryButton>
      </div>
    </li>
  );
}

export function LearningItemsList({
  items,
  loading,
  emptyTitle,
  emptyDescription,
  showPatientLink,
  busy,
  onToggleDone,
  onRemove,
}: {
  items: LearningItem[];
  loading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  showPatientLink?: boolean;
  busy?: boolean;
  onToggleDone: (id: string, done: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-stone-500">
        <span className="inline-flex items-center gap-2">
          <Spinner className="h-4 w-4 text-[color:var(--accent)]" />
          Loading learning…
        </span>
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <LearningItemRow
          key={item.id}
          item={item}
          showPatientLink={showPatientLink}
          busy={busy}
          onToggleDone={onToggleDone}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}
