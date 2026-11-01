import { Suspense } from "react";
import { SessionDetailView } from "@/components/session-detail-view";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading session…</p>}>
      <SessionPageContent params={params} />
    </Suspense>
  );
}

async function SessionPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionDetailView sessionId={id} />;
}
