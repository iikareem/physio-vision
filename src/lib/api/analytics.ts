import { apiJson } from "@/lib/api/client";
import type { AnalyticsPeriod, AnalyticsSummary } from "@/lib/analytics";
import type { WorkspaceId } from "@/lib/types";

export function getAnalytics(input: {
  workspace: WorkspaceId;
  period: AnalyticsPeriod;
  date: string;
}) {
  const params = new URLSearchParams({
    workspace: input.workspace,
    period: input.period,
    date: input.date,
  });
  return apiJson<AnalyticsSummary>(`/analytics?${params}`);
}
