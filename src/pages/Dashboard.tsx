import { AppLayout } from "@/components/layout/AppLayout";
import { mockAssets } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import {
  FileQuestion,
  Clock,
  CheckCircle2,
  Upload,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { AssetStatus } from "@/types/asset";

const statusCounts = mockAssets.reduce((acc, asset) => {
  acc[asset.status] = (acc[asset.status] || 0) + 1;
  return acc;
}, {} as Record<AssetStatus, number>);

const recentActivity = mockAssets
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 5);

const stats = [
  {
    title: "Total Missing",
    value: mockAssets.length,
    icon: FileQuestion,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "In Progress",
    value: statusCounts["ongoing"] || 0,
    icon: Clock,
    color: "text-status-ongoing",
    bgColor: "bg-status-ongoing-bg",
  },
  {
    title: "Completed",
    value: statusCounts["completed"] || 0,
    icon: CheckCircle2,
    color: "text-status-completed",
    bgColor: "bg-status-completed-bg",
  },
  {
    title: "Uploaded",
    value: statusCounts["uploaded"] || 0,
    icon: Upload,
    color: "text-status-uploaded",
    bgColor: "bg-status-uploaded-bg",
  },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of missing game assets
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.title} className="card-compact">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 card-compact">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-medium text-foreground">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <DesignerAvatar designer={asset.designer} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {asset.gameName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {asset.provider}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={asset.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(asset.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Summary */}
          <div className="card-compact">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-medium text-foreground">Status Summary</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between"
                >
                  <StatusBadge status={status as AssetStatus} />
                  <span className="text-sm font-medium text-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
