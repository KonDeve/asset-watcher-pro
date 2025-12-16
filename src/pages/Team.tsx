import { AppLayout } from "@/components/layout/AppLayout";
import { designers, mockAssets } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { AssetStatus } from "@/types/asset";
import { Mail, Briefcase } from "lucide-react";

export default function Team() {
  const getDesignerStats = (designerId: string) => {
    const designerAssets = mockAssets.filter(
      (a) => a.designer?.id === designerId
    );

    const statusCounts = designerAssets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    }, {} as Record<AssetStatus, number>);

    return {
      total: designerAssets.length,
      ongoing: statusCounts["ongoing"] || 0,
      completed:
        (statusCounts["completed"] || 0) +
        (statusCounts["exported"] || 0) +
        (statusCounts["uploaded"] || 0),
    };
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            Designer workload and assignments
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {designers.map((designer) => {
            const stats = getDesignerStats(designer.id);
            return (
              <div key={designer.id} className="card-compact">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
                    {designer.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {designer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {designer.email}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {stats.total}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          assigned
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status="ongoing" />
                        <span className="text-sm font-medium">{stats.ongoing}</span>
                      </div>
                    </div>

                    {/* Workload Bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min((stats.ongoing / 5) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Workload: {stats.ongoing}/5 ongoing tasks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
