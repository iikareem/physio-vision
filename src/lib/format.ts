export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return formatDate(iso);
}

/** Persist a calendar day without a meaningful clock time (local noon). */
export function dateOnlyIso(dateInput: string): string {
  const starts = new Date(`${dateInput}T12:00:00`);
  return starts.toISOString();
}

export function todayDateInputValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameDay(a: string, b: Date = new Date()): boolean {
  const d = new Date(a);
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  );
}

/** Therapist-facing labels (not reception desk language). */
export function appointmentStatusLabel(
  status: "scheduled" | "checked_in" | "done" | "no_show",
): string {
  switch (status) {
    case "scheduled":
      return "To do";
    case "checked_in":
      return "With you";
    case "done":
      return "Finished";
    case "no_show":
      return "Skipped";
  }
}

/** Still open for the physio to treat today. */
export function isOpenSession(
  status: "scheduled" | "checked_in" | "done" | "no_show",
): boolean {
  return status === "scheduled" || status === "checked_in";
}
