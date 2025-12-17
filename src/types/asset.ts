export type AssetStatus = "not-started" | "ongoing" | "completed" | "exported" | "uploaded";

export interface Designer {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Brand {
  id: string;
  name: string;
  color: string;
  reflected: boolean;
  reflectedBy?: string;
  reflectedAt?: string;
}

export interface MissingAsset {
  id: string;
  gameName: string;
  provider: string;
  brands: Brand[];
  status: AssetStatus;
  designer: Designer | null;
  foundBy: string;
  dateFound: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  "not-started": { label: "Not Started", className: "status-not-started" },
  "ongoing": { label: "Ongoing", className: "status-ongoing" },
  "completed": { label: "Completed", className: "status-completed" },
  "exported": { label: "Exported", className: "status-exported" },
  "uploaded": { label: "Uploaded", className: "status-uploaded" },
};
