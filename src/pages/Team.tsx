import { AppLayout } from "@/components/layout/AppLayout";
import { useAssets, useDesigners } from "@/hooks/useData";
import { StatusBadge } from "@/components/StatusBadge";
import { AssetStatus } from "@/types/asset";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Briefcase,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function Team() {
  const { assets, loading: assetsLoading, isUsingSupabase } = useAssets();
  const { designers, loading: designersLoading } = useDesigners();

  const loading = assetsLoading || designersLoading;

  // Show loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading team data...</p>
            {isUsingSupabase && (
              <p className="text-xs text-muted-foreground">Connected to Supabase</p>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  const getDesignerStats = (designerId: string) => {
    const designerAssets = assets.filter(
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
      notStarted: statusCounts["not-started"] || 0,
    };
  };

  const totalAssigned = assets.filter((a) => a.designer !== null).length;
  const totalUnassigned = assets.filter((a) => a.designer === null).length;
  const avgWorkload = designers.length > 0 ? Math.round(totalAssigned / designers.length) : 0;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 h-full overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            Designer workload and task assignments
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{designers.length}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10">
                <Briefcase className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAssigned}</p>
                <p className="text-xs text-muted-foreground">Assigned Tasks</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-status-not-started/10">
                <Clock className="w-5 h-5 text-status-not-started" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalUnassigned}</p>
                <p className="text-xs text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgWorkload}</p>
                <p className="text-xs text-muted-foreground">Avg per Designer</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {designers.map((designer) => {
            const stats = getDesignerStats(designer.id);
            const workloadPercentage = Math.min((stats.ongoing / 5) * 100, 100);
            const completionRate =
              stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0;

            return (
              <Card key={designer.id} className="p-4 lg:p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg shrink-0">
                    {designer.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {designer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{designer.email}</span>
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-ongoing">{stats.ongoing}</p>
                    <p className="text-xs text-muted-foreground">Ongoing</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-success">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                </div>

                {/* Workload Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Current Workload</span>
                    <span className="text-xs font-medium text-foreground">
                      {stats.ongoing}/5
                    </span>
                  </div>
                  <Progress
                    value={workloadPercentage}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {workloadPercentage >= 80
                      ? "High workload"
                      : workloadPercentage >= 40
                      ? "Moderate workload"
                      : "Available for more tasks"}
                  </p>
                </div>

                {/* Completion Rate */}
                <div className="mt-4 flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Completion Rate</span>
                  <span className="text-sm font-semibold text-foreground">
                    {completionRate}%
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}