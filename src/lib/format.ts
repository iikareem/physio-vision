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

/** Whole years of age from a YYYY-MM-DD date of birth. */
export function ageFromDateOfBirth(
  dateOfBirth: string,
  now = new Date(),
): number | null {
  const born = new Date(`${dateOfBirth}T12:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 150) return null;
  return age;
}

/** Approximate YYYY-MM-DD for storage when the therapist enters age in years. */
export function dateOfBirthFromAge(age: number, now = new Date()): string {
  const born = new Date(now);
  born.setFullYear(born.getFullYear() - age);
  return todayDateInputValue(born);
}

export function formatAge(dateOfBirth?: string | null): string | null {
  if (!dateOfBirth) return null;
  const age = ageFromDateOfBirth(dateOfBirth);
  if (age === null) return null;
  return `${age}`;
}

export function isSameDay(a: string, b: Date = new Date()): boolean {
  const d = new Date(a);
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  );
}

/** Therapist-facing labels (legacy statuses kept for old rows). */
export function appointmentStatusLabel(
  status: "scheduled" | "checked_in" | "done" | "no_show",
): string {
  switch (status) {
    case "scheduled":
    case "checked_in":
    case "done":
      return "Logged";
    case "no_show":
      return "Skipped";
  }
}

/** Legacy helper — new sessions are created as done; notes stay editable always. */
export function isOpenSession(
  status: "scheduled" | "checked_in" | "done" | "no_show",
): boolean {
  return status === "scheduled" || status === "checked_in";
}
