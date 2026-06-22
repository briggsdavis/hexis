import { Sidebar } from "@/components/layout/Sidebar";

/**
 * Persistent shell for the authenticated app. Living in a route-group layout
 * means the sidebar mounts once and stays mounted across navigation between
 * Today / History / Analytics — only the page content swaps, so route changes
 * are instant instead of remounting (and re-querying) the whole shell.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      {children}
    </div>
  );
}
