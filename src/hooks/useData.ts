import { useState, useEffect, useCallback } from "react";
import { dataService } from "@/services/dataService";
import { MissingAsset, Designer, Brand, AssetStatus } from "@/types/asset";
import { GameAssetLink } from "@/types/gameAsset";

// =============================================
// useAssets Hook
// =============================================
export function useAssets() {
  const [assets, setAssets] = useState<MissingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.getAssets();
      setAssets(data);
    } catch (err) {
      setError("Failed to fetch assets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const addAsset = useCallback(async (asset: Omit<MissingAsset, "id" | "createdAt" | "updatedAt">) => {
    const newAsset = await dataService.createAsset(asset);
    if (newAsset) {
      setAssets((prev) => [newAsset, ...prev]);
      return newAsset;
    }
    return null;
  }, []);

  const updateStatus = useCallback(async (assetId: string, status: AssetStatus) => {
    const success = await dataService.updateAssetStatus(assetId, status);
    if (success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, status, updatedAt: new Date().toISOString() }
            : a
        )
      );
    }
    return success;
  }, []);

  const updateGameName = useCallback(async (assetId: string, gameName: string) => {
    const success = await dataService.updateAssetName(assetId, gameName);
    if (success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, gameName, updatedAt: new Date().toISOString() }
            : a
        )
      );
    }
    return success;
  }, []);

  const updateDesigner = useCallback(async (assetId: string, designer: Designer | null) => {
    const success = await dataService.updateAssetDesigner(assetId, designer?.id || null);
    if (success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, designer, updatedAt: new Date().toISOString() }
            : a
        )
      );
    }
    return success;
  }, []);

  const updateProvider = useCallback(async (assetId: string, provider: string) => {
    const success = await dataService.updateAssetProvider(assetId, provider);
    if (success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, provider, updatedAt: new Date().toISOString() }
            : a
        )
      );
    }
    return success;
  }, []);

  const updateNotes = useCallback(async (assetId: string, notes: string) => {
    const success = await dataService.updateAssetNotes(assetId, notes);
    if (success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, notes, updatedAt: new Date().toISOString() }
            : a
        )
      );
    }
    return success;
  }, []);

  const updateBrandReflection = useCallback(
    async (assetId: string, brandId: string, reflected: boolean, reflectedBy?: string) => {
      const success = await dataService.updateBrandReflection(assetId, brandId, reflected, reflectedBy);
      if (success) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  brands: a.brands.map((b) =>
                    b.id === brandId
                      ? {
                          ...b,
                          reflected,
                          reflectedBy: reflected ? reflectedBy : undefined,
                          reflectedAt: reflected ? new Date().toISOString().split("T")[0] : undefined,
                        }
                      : b
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : a
          )
        );
      }
      return success;
    },
    []
  );

  const addBrandsToAsset = useCallback(async (assetId: string, brands: Brand[]) => {
    const success = await dataService.addBrandsToAsset(assetId, brands);
    if (success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                brands: [...a.brands, ...brands],
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
    }
    return success;
  }, []);

  const updateAssetBrands = useCallback(async (assetId: string, brands: Brand[]) => {
    const success = await dataService.updateAssetBrands(assetId, brands);
    if (success) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                brands,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
    }
    return success;
  }, []);

  const deleteAsset = useCallback(async (assetId: string) => {
    const success = await dataService.deleteAsset(assetId);
    if (success) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    }
    return success;
  }, []);

  return {
    assets,
    setAssets,
    loading,
    error,
    refetch: fetchAssets,
    addAsset,
    updateStatus,
    updateGameName,
    updateDesigner,
    updateProvider,
    updateNotes,
    updateBrandReflection,
    addBrandsToAsset,
    updateAssetBrands,
    deleteAsset,
    isUsingSupabase: dataService.isUsingSupabase(),
  };
}

// =============================================
// useGameAssetLinks Hook
// =============================================
export function useGameAssetLinks() {
  const [links, setLinks] = useState<GameAssetLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.getGameAssetLinks();
      setLinks(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch game asset links");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = useCallback(async (link: Omit<GameAssetLink, "id" | "createdAt" | "updatedAt">) => {
    const created = await dataService.createGameAssetLink(link);
    if (created) {
      setLinks((prev) => [created, ...prev]);
    }
    return created;
  }, []);

  const updateLink = useCallback(
    async (id: string, link: Omit<GameAssetLink, "id" | "createdAt" | "updatedAt">) => {
      const updated = await dataService.updateGameAssetLink(id, link);
      if (updated) {
        setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
      }
      return updated;
    },
    []
  );

  const deleteLink = useCallback(async (id: string) => {
    const success = await dataService.deleteGameAssetLink(id);
    if (success) {
      setLinks((prev) => prev.filter((l) => l.id !== id));
    }
    return success;
  }, []);

  return {
    links,
    loading,
    error,
    refetch: fetchLinks,
    addLink,
    updateLink,
    deleteLink,
    isUsingSupabase: dataService.isUsingSupabase(),
  };
}

// =============================================
// useDesigners Hook
// =============================================
export function useDesigners() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesigners = async () => {
      setLoading(true);
      const data = await dataService.getDesigners();
      setDesigners(data);
      setLoading(false);
    };
    fetchDesigners();
  }, []);

  const addDesigner = useCallback(async (designer: Omit<Designer, "id">) => {
    const newDesigner = await dataService.createDesigner(designer);
    if (newDesigner) {
      setDesigners((prev) => [...prev, newDesigner]);
    }
    return newDesigner;
  }, []);

  return { designers, loading, addDesigner };
}

// =============================================
// useBrands Hook
// =============================================
export function useBrands() {
  const [brands, setBrands] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      const data = await dataService.getBrands();
      setBrands(data);
      setLoading(false);
    };
    fetchBrands();
  }, []);

  const addBrand = useCallback(async (brand: { name: string; color: string }) => {
    const newBrand = await dataService.createBrand(brand);
    if (newBrand) {
      setBrands((prev) => [...prev, newBrand]);
    }
    return newBrand;
  }, []);

  const updateBrand = useCallback(async (id: string, brand: { name: string; color: string }) => {
    const updated = await dataService.updateBrand(id, brand);
    if (updated) {
      setBrands((prev) => prev.map((b) => (b.id === id ? updated : b)));
    }
    return updated;
  }, []);

  const deleteBrand = useCallback(async (id: string) => {
    const success = await dataService.deleteBrand(id);
    if (success) {
      setBrands((prev) => prev.filter((b) => b.id !== id));
    }
    return success;
  }, []);

  return { brands, loading, addBrand, updateBrand, deleteBrand, isUsingSupabase: dataService.isUsingSupabase() };
}

// =============================================
// useProviders Hook
// =============================================
export function useProviders() {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      const data = await dataService.getProviders();
      setProviders(data);
      setLoading(false);
    };
    fetchProviders();
  }, []);

  const addProvider = useCallback(async (name: string) => {
    const newProvider = await dataService.createProvider(name);
    if (newProvider && !providers.includes(newProvider)) {
      setProviders((prev) => [...prev, newProvider].sort());
    }
    return newProvider;
  }, [providers]);

  const updateProvider = useCallback(async (currentName: string, newName: string) => {
    const updated = await dataService.updateProvider(currentName, newName);
    if (updated) {
      setProviders((prev) => prev.map((p) => (p === currentName ? updated : p)).sort());
    }
    return updated;
  }, []);

  const deleteProvider = useCallback(async (name: string) => {
    const success = await dataService.deleteProvider(name);
    if (success) {
      setProviders((prev) => prev.filter((p) => p !== name));
    }
    return success;
  }, []);

  return { providers, loading, addProvider, updateProvider, deleteProvider, isUsingSupabase: dataService.isUsingSupabase() };
}

// =============================================
// useMessages Hook
// =============================================
export function useMessages(currentUserId: string, otherUserId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!otherUserId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const data = await dataService.getMessages(currentUserId, otherUserId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!otherUserId) return null;
      const message = await dataService.sendMessage({
        senderId: currentUserId,
        receiverId: otherUserId,
        content,
      });
      if (message) {
        setMessages((prev) => [...prev, message]);
      }
      return message;
    },
    [currentUserId, otherUserId]
  );

  const markAsRead = useCallback(async () => {
    if (!otherUserId) return;
    await dataService.markMessagesAsRead(currentUserId, otherUserId);
  }, [currentUserId, otherUserId]);

  return { messages, loading, sendMessage, markAsRead, refetch: fetchMessages };
}

// =============================================
// useUnreadCounts Hook
// =============================================
export function useUnreadCounts(userId: string) {
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  const fetchCounts = useCallback(async () => {
    const data = await dataService.getUnreadCount(userId);
    setCounts(data);
  }, [userId]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { counts, refetch: fetchCounts };
}
