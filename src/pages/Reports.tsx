import { AppLayout } from "@/components/layout/AppLayout";
import { mockAssets } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { AssetStatus, statusConfig } from "@/types/asset";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Copy,
  Download,
  FileText,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const ongoingAssets = mockAssets.filter((a) => a.status === "ongoing");
  const notStartedAssets = mockAssets.filter((a) => a.status === "not-started");

  const statusCounts = mockAssets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<AssetStatus, number>);

  const reflectedCount = mockAssets.reduce(
    (acc, asset) => acc + asset.brands.filter((b) => b.reflected).length,
    0
  );
  const totalBrandEntries = mockAssets.reduce(
    (acc, asset) => acc + asset.brands.length,
    0
  );
  const reflectionRate = Math.round((reflectedCount / totalBrandEntries) * 100);

  const handleCopyOngoing = () => {
    const text = ongoingAssets
      .map(
        (a) =>
          `• ${a.gameName} (${a.provider}) - ${a.designer?.name || "Unassigned"}`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Ongoing checklist copied to clipboard.",
    });
  };

  const handleExportReport = () => {
    const report = `
MISSING ASSETS REPORT
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
${Object.entries(statusCounts)
  .map(([status, count]) => `${statusConfig[status as AssetStatus].label}: ${count}`)
  .join("\n")}
Total: ${mockAssets.length}

ONGOING ITEMS
-------------
${ongoingAssets
  .map(
    (a) =>
      `- ${a.gameName} | ${a.provider} | ${a.designer?.name || "Unassigned"} | ${a.brands.map((b) => b.name).join(", ")}`
  )
  .join("\n")}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asset-report-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Your report has been downloaded.",
    });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 h-full overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">
              Overview and analytics for asset tracking
            </p>
          </div>
          <Button onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Full Report
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mockAssets.length}</p>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-status-ongoing/10">
                <Clock className="w-5 h-5 text-status-ongoing" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{ongoingAssets.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-status-not-started/10">
                <AlertCircle className="w-5 h-5 text-status-not-started" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{notStartedAssets.length}</p>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{reflectionRate}%</p>
                <p className="text-xs text-muted-foreground">Reflection Rate</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Summary */}
          <Card className="p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Status Breakdown</h2>
            </div>

            <div className="space-y-3">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = statusCounts[status as AssetStatus] || 0;
                const percentage = Math.round((count / mockAssets.length) * 100);
                return (
                  <div key={status} className="flex items-center gap-3">
                    <StatusBadge status={status as AssetStatus} />
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status === "not-started"
                              ? "bg-status-not-started"
                              : status === "ongoing"
                              ? "bg-status-ongoing"
                              : status === "completed"
                              ? "bg-status-completed"
                              : status === "exported"
                              ? "bg-status-exported"
                              : "bg-status-uploaded"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Ongoing Checklist */}
          <Card className="p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-status-ongoing/10">
                  <CheckCircle2 className="w-4 h-4 text-status-ongoing" />
                </div>
                <h2 className="font-semibold text-foreground">Ongoing Checklist</h2>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyOngoing}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>

            {ongoingAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No ongoing items</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {ongoingAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {asset.gameName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {asset.provider} • {asset.designer?.name || "Unassigned"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      {asset.brands.slice(0, 3).map((brand) => (
                        <span
                          key={brand.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: brand.color }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Not Started Items */}
          <Card className="p-4 lg:p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-status-not-started/10">
                <AlertCircle className="w-4 h-4 text-status-not-started" />
              </div>
              <h2 className="font-semibold text-foreground">Pending Assignment</h2>
              <span className="text-xs text-muted-foreground">({notStartedAssets.length} items)</span>
            </div>

            {notStartedAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">All items assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {notStartedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="py-2.5 px-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <p className="font-medium text-foreground text-sm truncate">
                      {asset.gameName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {asset.provider}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {asset.brands.map((brand) => (
                        <span
                          key={brand.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: brand.color }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}