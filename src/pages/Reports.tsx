import { AppLayout } from "@/components/layout/AppLayout";
import { mockAssets } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { AssetStatus, statusConfig } from "@/types/asset";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const ongoingAssets = mockAssets.filter((a) => a.status === "ongoing");

  const statusCounts = mockAssets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<AssetStatus, number>);

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
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export asset reports
          </p>
        </div>

        <div className="grid gap-6">
          {/* Status Summary Card */}
          <div className="card-compact">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Status Summary
              </h2>
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div
                  key={status}
                  className="text-center p-3 rounded-lg bg-muted/50"
                >
                  <div className="text-2xl font-semibold text-foreground mb-1">
                    {statusCounts[status as AssetStatus] || 0}
                  </div>
                  <StatusBadge status={status as AssetStatus} />
                </div>
              ))}
            </div>
          </div>

          {/* Ongoing Checklist */}
          <div className="card-compact">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Ongoing Checklist
              </h2>
              <Button variant="outline" size="sm" onClick={handleCopyOngoing}>
                <Copy className="w-4 h-4 mr-2" />
                Copy List
              </Button>
            </div>

            {ongoingAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No ongoing items
              </p>
            ) : (
              <div className="space-y-2">
                {ongoingAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {asset.gameName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {asset.provider} • {asset.designer?.name || "Unassigned"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {asset.brands.slice(0, 2).map((brand) => (
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
