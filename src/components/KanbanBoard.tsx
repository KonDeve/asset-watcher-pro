import { useState, useRef, useEffect } from "react";
import { MissingAsset, AssetStatus, statusConfig } from "@/types/asset";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, GripVertical, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  assets: MissingAsset[];
  onStatusChange: (assetId: string, status: AssetStatus) => void;
  onAssetClick: (asset: MissingAsset) => void;
  columns: { id: AssetStatus; label: string }[];
}

export function KanbanBoard({ assets, onStatusChange, onAssetClick, columns }: KanbanBoardProps) {
  const [draggedAsset, setDraggedAsset] = useState<MissingAsset | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<AssetStatus | null>(null);
  
  // Floating scrollbar state
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
  });
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);

  // Update scroll state when container scrolls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      setScrollState({
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
      });
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [columns.length, assets.length]);

  // Calculate scrollbar dimensions
  const hasOverflow = scrollState.scrollWidth > scrollState.clientWidth;
  const thumbWidth = hasOverflow
    ? Math.max((scrollState.clientWidth / scrollState.scrollWidth) * 100, 10)
    : 100;
  const thumbLeft = hasOverflow
    ? (scrollState.scrollLeft / (scrollState.scrollWidth - scrollState.clientWidth)) *
      (100 - thumbWidth)
    : 0;

  // Scroll navigation
  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;
    const scrollAmount = 300;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Handle scrollbar thumb drag
  const handleScrollbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingScrollbar(true);
    const scrollbar = scrollbarRef.current;
    const container = containerRef.current;
    if (!scrollbar || !container) return;

    const startX = e.clientX;
    const startScrollLeft = container.scrollLeft;
    const scrollbarWidth = scrollbar.clientWidth;
    const maxScroll = scrollState.scrollWidth - scrollState.clientWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const scrollRatio = deltaX / (scrollbarWidth * (1 - thumbWidth / 100));
      container.scrollLeft = startScrollLeft + scrollRatio * maxScroll;
    };

    const handleMouseUp = () => {
      setIsDraggingScrollbar(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle click on scrollbar track
  const handleTrackClick = (e: React.MouseEvent) => {
    const scrollbar = scrollbarRef.current;
    const container = containerRef.current;
    if (!scrollbar || !container) return;

    const rect = scrollbar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const maxScroll = scrollState.scrollWidth - scrollState.clientWidth;
    container.scrollTo({
      left: clickPosition * maxScroll,
      behavior: "smooth",
    });
  };

  const getColumnAssets = (status: AssetStatus) => {
    return assets.filter((asset) => asset.status === status);
  };

  const handleDragStart = (e: React.DragEvent, asset: MissingAsset) => {
    setDraggedAsset(asset);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", asset.id);
  };

  const handleDragOver = (e: React.DragEvent, status: AssetStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: AssetStatus) => {
    e.preventDefault();
    if (draggedAsset && draggedAsset.status !== newStatus) {
      onStatusChange(draggedAsset.id, newStatus);
    }
    setDraggedAsset(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedAsset(null);
    setDragOverColumn(null);
  };

  const getColumnColor = (status: AssetStatus) => {
    const colors: Record<AssetStatus, string> = {
      "not-started": "border-t-slate-400",
      "ongoing": "border-t-blue-500",
      "completed": "border-t-green-500",
      "exported": "border-t-purple-500",
      "uploaded": "border-t-emerald-500",
    };
    return colors[status];
  };

  const getColumnBgHover = (status: AssetStatus) => {
    const colors: Record<AssetStatus, string> = {
      "not-started": "bg-slate-500/10",
      "ongoing": "bg-blue-500/10",
      "completed": "bg-green-500/10",
      "exported": "bg-purple-500/10",
      "uploaded": "bg-emerald-500/10",
    };
    return colors[status];
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Kanban Board Content */}
      <div ref={containerRef} className="flex gap-4 p-4 flex-1 overflow-x-auto scrollbar-thin">
        {columns.map((column) => {
          const columnAssets = getColumnAssets(column.id);
          const isDropTarget = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 flex flex-col"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`bg-card rounded-t-lg border-t-4 ${getColumnColor(column.id)} px-3 py-2.5 border-x border-border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground">{column.label}</h3>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {columnAssets.length}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Sort by Date</DropdownMenuItem>
                      <DropdownMenuItem>Sort by Name</DropdownMenuItem>
                      <DropdownMenuItem>Collapse Column</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Column Content */}
              <div
                className={`
                  flex-1 bg-muted/30 rounded-b-lg border-x border-b border-border p-2 space-y-2 overflow-y-auto scrollbar-thin
                  transition-colors duration-200
                  ${isDropTarget ? getColumnBgHover(column.id) : ""}
                `}
              >
                {columnAssets.map((asset) => (
                  <Card
                    key={asset.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, asset)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onAssetClick(asset)}
                    className={`
                      p-3 cursor-pointer bg-card hover:shadow-md transition-all duration-200
                      ${draggedAsset?.id === asset.id ? "opacity-50 scale-95" : ""}
                      group
                    `}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <h4 className="font-medium text-sm text-foreground flex-1 line-clamp-2">
                        {asset.gameName}
                      </h4>
                    </div>

                    {/* Provider */}
                    <p className="text-xs text-muted-foreground mb-2">{asset.provider}</p>

                    {/* Brands */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {asset.brands.slice(0, 2).map((brand) => (
                        <div
                          key={brand.id}
                          className="flex items-center gap-1 text-xs bg-muted/50 rounded px-1.5 py-0.5"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: brand.color }}
                          />
                          <span className="truncate max-w-[60px]">{brand.name}</span>
                          {brand.reflected ? (
                            <CheckCircle2 className="w-3 h-3 text-success" />
                          ) : (
                            <XCircle className="w-3 h-3 text-muted-foreground/50" />
                          )}
                        </div>
                      ))}
                      {asset.brands.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{asset.brands.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <DesignerAvatar designer={asset.designer} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(asset.dateFound).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </Card>
                ))}

                {columnAssets.length === 0 && (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">Drop items here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Horizontal Scroll Panel */}
      {hasOverflow && (
        <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 z-10">
          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => scroll("left")}
            disabled={scrollState.scrollLeft <= 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Scrollbar Track */}
          <div
            ref={scrollbarRef}
            className="w-32 h-2 bg-muted rounded-full cursor-pointer relative"
            onClick={handleTrackClick}
          >
            {/* Scrollbar Thumb */}
            <div
              className={`
                absolute top-0 h-full rounded-full transition-colors
                ${isDraggingScrollbar ? "bg-primary" : "bg-muted-foreground/40 hover:bg-muted-foreground/60"}
              `}
              style={{
                width: `${thumbWidth}%`,
                left: `${thumbLeft}%`,
              }}
              onMouseDown={handleScrollbarMouseDown}
            />
          </div>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => scroll("right")}
            disabled={
              scrollState.scrollLeft >= scrollState.scrollWidth - scrollState.clientWidth - 1
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
