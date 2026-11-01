import type { Appointment, Patient } from "@/lib/types";

export type AnalyticsPeriod = "day" | "month" | "year";

export type AnalyticsBucket = {
  key: string;
  label: string;
  sessions: number;
  uniquePatients: number;
  done: number;
};

export type TypeBreakdown = {
  type: string;
  count: number;
  pct: number;
};

export type TopPatient = {
  patientId: string;
  name: string;
  condition: string;
  sessions: number;
  done: number;
};

export type AnalyticsSummary = {
  period: AnalyticsPeriod;
  rangeLabel: string;
  chartLabel: string;
  totalSessions: number;
  uniquePatients: number;
  doneSessions: number;
  newPatients: number;
  buckets: AnalyticsBucket[];
  byType: TypeBreakdown[];
  topPatients: TopPatient[];
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function emptyBucket(key: string, label: string): AnalyticsBucket {
  return { key, label, sessions: 0, uniquePatients: 0, done: 0 };
}

/** Bounds for the selected day / month / year. */
export function selectedRange(
  period: AnalyticsPeriod,
  selected: Date,
): { start: Date; end: Date; label: string; chartLabel: string } {
  if (period === "day") {
    const start = startOfDay(selected);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      start,
      end,
      label: start.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      chartLabel: "By status",
    };
  }

  if (period === "month") {
    const start = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const end = new Date(selected.getFullYear(), selected.getMonth() + 1, 1);
    return {
      start,
      end,
      label: start.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      chartLabel: "Sessions by day",
    };
  }

  const start = new Date(selected.getFullYear(), 0, 1);
  const end = new Date(selected.getFullYear() + 1, 0, 1);
  return {
    start,
    end,
    label: String(selected.getFullYear()),
    chartLabel: "Sessions by month",
  };
}

function buildBuckets(
  period: AnalyticsPeriod,
  selected: Date,
): AnalyticsBucket[] {
  if (period === "day") {
    return [
      emptyBucket("done", "Finished"),
      emptyBucket("open", "Open"),
      emptyBucket("no_show", "Skipped"),
    ];
  }

  if (period === "month") {
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const buckets: AnalyticsBucket[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      buckets.push(
        emptyBucket(
          String(day),
          d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        ),
      );
    }
    return buckets;
  }

  const year = selected.getFullYear();
  const buckets: AnalyticsBucket[] = [];
  for (let month = 0; month < 12; month++) {
    const d = new Date(year, month, 1);
    buckets.push(
      emptyBucket(
        String(month),
        d.toLocaleDateString("en-US", { month: "short" }),
      ),
    );
  }
  return buckets;
}

function bucketKeyFor(
  period: AnalyticsPeriod,
  appointment: Appointment,
): string | null {
  if (period === "day") {
    if (appointment.status === "done") return "done";
    if (appointment.status === "no_show") return "no_show";
    return "open";
  }
  const d = new Date(appointment.startsAt);
  if (period === "month") return String(d.getDate());
  return String(d.getMonth());
}

export function computeAnalytics(
  appointments: Appointment[],
  patients: Patient[],
  period: AnalyticsPeriod,
  selected: Date,
): AnalyticsSummary {
  const { start, end, label: rangeLabel, chartLabel } = selectedRange(
    period,
    selected,
  );

  const buckets = buildBuckets(period, selected);
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));
  const patientsInBucket = new Map<string, Set<string>>();

  const inWindow = appointments.filter((a) =>
    inRange(a.startsAt, start, end),
  );

  for (const a of inWindow) {
    const key = bucketKeyFor(period, a);
    if (key === null) continue;
    const idx = bucketIndex.get(key);
    if (idx === undefined) continue;
    const bucket = buckets[idx];
    bucket.sessions += 1;
    if (a.status === "done") bucket.done += 1;
    let set = patientsInBucket.get(key);
    if (!set) {
      set = new Set();
      patientsInBucket.set(key, set);
    }
    set.add(a.patientId);
  }

  for (const b of buckets) {
    b.uniquePatients = patientsInBucket.get(b.key)?.size ?? 0;
  }

  const uniquePatientIds = new Set(inWindow.map((a) => a.patientId));
  const doneSessions = inWindow.filter((a) => a.status === "done").length;

  const newPatients = patients.filter((p) =>
    inRange(p.createdAt, start, end),
  ).length;

  const typeCounts = new Map<string, number>();
  for (const a of inWindow) {
    const type = a.type.trim() || "Session";
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  }
  const totalForType = inWindow.length || 1;
  const byType: TypeBreakdown[] = [...typeCounts.entries()]
    .map(([type, count]) => ({
      type,
      count,
      pct: Math.round((count / totalForType) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const patientCounts = new Map<
    string,
    { sessions: number; done: number }
  >();
  for (const a of inWindow) {
    const cur = patientCounts.get(a.patientId) ?? { sessions: 0, done: 0 };
    cur.sessions += 1;
    if (a.status === "done") cur.done += 1;
    patientCounts.set(a.patientId, cur);
  }

  const patientById = new Map(patients.map((p) => [p.id, p]));
  const topPatients: TopPatient[] = [...patientCounts.entries()]
    .map(([patientId, stats]) => {
      const p = patientById.get(patientId);
      return {
        patientId,
        name: p?.name ?? "Unknown patient",
        condition: p?.condition ?? "",
        sessions: stats.sessions,
        done: stats.done,
      };
    })
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name))
    .slice(0, 8);

  return {
    period,
    rangeLabel,
    chartLabel,
    totalSessions: inWindow.length,
    uniquePatients: uniquePatientIds.size,
    doneSessions,
    newPatients,
    buckets,
    byType,
    topPatients,
  };
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toMonthInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseMonthInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return Number.isNaN(d.getTime()) ? null : d;
}
