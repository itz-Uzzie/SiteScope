import AuditDashboard from "@/components/AuditDashboard";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ url?: string; demo?: string }> }) {
  const params = await searchParams;
  return <><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "SEO Audit", href: "/results" }]} /><AuditDashboard initialUrl={params.url ?? ""} demoMode={params.demo === "1"} /></>;
}
