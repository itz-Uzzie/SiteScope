import AuditDashboard from "@/components/AuditDashboard";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ url?: string; demo?: string }> }) {
  const params = await searchParams;
  return <AuditDashboard initialUrl={params.url ?? ""} demoMode={params.demo === "1"} />;
}
