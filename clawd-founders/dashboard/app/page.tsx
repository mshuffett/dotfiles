import { RefreshButton } from "@/components/RefreshButton";
import { DashboardClient } from "@/components/DashboardClient";
import { getPipelineStatus } from "@/lib/pipeline";
import { getPendingDrafts } from "@/lib/drafts";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [pipelineStatus, pendingDrafts] = await Promise.all([
    getPipelineStatus(),
    getPendingDrafts(),
  ]);

  // Filter to "needs response" drafts (has AI-generated options from founder reply)
  const needsResponseDrafts = pendingDrafts.filter(
    (d) => d.context.last_wa_from === "them" && (d.drafts?.length ?? 0) > 0
  );

  return (
    <main className="h-screen flex flex-col p-4">
      <header className="mb-4 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Founder Outreach</h1>
          <p className="text-gray-400 text-sm">
            j/k navigate, 1/2/3 select draft, h snooze, Enter send
          </p>
        </div>
        <RefreshButton mode="generate" />
      </header>

      <div className="flex-1 min-h-0">
        <DashboardClient
          drafts={needsResponseDrafts}
          pipelineStatus={pipelineStatus}
        />
      </div>
    </main>
  );
}
