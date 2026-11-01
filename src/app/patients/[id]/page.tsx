import { Suspense } from "react";
import { PatientDetailView } from "@/components/patient-detail-view";

export default function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading patient…</p>}>
      <PatientPageContent params={params} />
    </Suspense>
  );
}

async function PatientPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientDetailView patientId={id} />;
}
