import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ProgressPanel } from "@/components/progress/ProgressPanel";

export default function HomePage() {
  return (
    <AppShell right={<ProgressPanel />}>
      <Dashboard />
    </AppShell>
  );
}
