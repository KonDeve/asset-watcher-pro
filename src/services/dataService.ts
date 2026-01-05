import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MissingAsset, Designer, Brand, AssetStatus } from "@/types/asset";
import {
  mockAssets,
  designers as mockDesigners,
  brandOptions as mockBrands,
  providerOptions as mockProviders,
} from "@/data/mockData";

// =============================================
// DATA SERVICE - Handles Supabase or Mock Data
// =============================================

class DataService {
  private useSupabase: boolean;

  constructor() {
    this.useSupabase = isSupabaseConfigured();
    if (!this.useSupabase) {
      console.log("Supabase not configured. Using mock data.");
    } else {
      console.log("Supabase configured. Using database.");
    }
  }

  // Check if using Supabase
  isUsingSupabase(): boolean {
    return this.useSupabase;
  }

  // =============================================
  // DESIGNERS
  // =============================================

  async getDesigners(): Promise<Designer[]> {
    if (!this.useSupabase || !supabase) {
      return mockDesigners;
    }

    const { data, error } = await supabase
      .from("designers")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching designers:", error);
      return mockDesigners;
    }

    return data.map((d) => ({
      id: d.id,
      name: d.name,
      avatar: d.avatar || d.name.split(" ").map((n) => n[0]).join(""),
      email: d.email,
    }));
  }

  async createDesigner(designer: Omit<Designer, "id">): Promise<Designer | null> {
    if (!this.useSupabase || !supabase) {
      const newDesigner: Designer = {
        id: `${Date.now()}`,
        ...designer,
      };
      mockDesigners.push(newDesigner);
      return newDesigner;
    }

    const { data, error } = await supabase
      .from("designers")
      .insert({
        name: designer.name,
        avatar: designer.avatar,
        email: designer.email,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating designer:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      avatar: data.avatar || "",
      email: data.email,
    };
  }

  // =============================================
  // BRANDS
  // =============================================

  async getBrands(): Promise<{ id: string; name: string; color: string }[]> {
    if (!this.useSupabase || !supabase) {
      return mockBrands;
    }

    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching brands:", error);
      return mockBrands;
    }

    return data.map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
    }));
  }

  async createBrand(brand: { name: string; color: string }): Promise<{ id: string; name: string; color: string } | null> {
    if (!this.useSupabase || !supabase) {
      const newBrand = {
        id: `${Date.now()}`,
        ...brand,
      };
      mockBrands.push(newBrand);
      return newBrand;
    }

    const { data, error } = await supabase
      .from("brands")
      .insert(brand)
      .select()
      .single();

    if (error) {
      console.error("Error creating brand:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
    };
  }

  async updateBrand(id: string, brand: { name: string; color: string }): Promise<{ id: string; name: string; color: string } | null> {
    if (!this.useSupabase || !supabase) {
      const index = mockBrands.findIndex((b) => b.id === id);
      if (index === -1) return null;
      mockBrands[index] = { ...mockBrands[index], ...brand };
      return mockBrands[index];
    }

    const { data, error } = await supabase
      .from("brands")
      .update(brand)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
    };
  }

  async deleteBrand(id: string): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const index = mockBrands.findIndex((b) => b.id === id);
      if (index !== -1) {
        mockBrands.splice(index, 1);
      }
      return true;
    }

    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      console.error("Error deleting brand:", error);
      return false;
    }
    return true;
  }

  // =============================================
  // PROVIDERS
  // =============================================

  async getProviders(): Promise<string[]> {
    if (!this.useSupabase || !supabase) {
      return mockProviders;
    }

    const { data, error } = await supabase
      .from("providers")
      .select("name")
      .order("name");

    if (error) {
      console.error("Error fetching providers:", error);
      return mockProviders;
    }

    return data.map((p) => p.name);
  }

  async createProvider(name: string): Promise<string | null> {
    if (!this.useSupabase || !supabase) {
      if (!mockProviders.includes(name)) {
        mockProviders.push(name);
      }
      return name;
    }

    const { data, error } = await supabase
      .from("providers")
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error("Error creating provider:", error);
      return null;
    }

    return data.name;
  }

  async updateProvider(currentName: string, newName: string): Promise<string | null> {
    if (!this.useSupabase || !supabase) {
      const index = mockProviders.findIndex((p) => p === currentName);
      if (index === -1) return null;
      mockProviders[index] = newName;
      return newName;
    }

    const { data, error } = await supabase
      .from("providers")
      .update({ name: newName })
      .eq("name", currentName)
      .select()
      .single();

    if (error) {
      console.error("Error updating provider:", error);
      return null;
    }

    return data.name;
  }

  async deleteProvider(name: string): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const index = mockProviders.findIndex((p) => p === name);
      if (index !== -1) {
        mockProviders.splice(index, 1);
      }
      return true;
    }

    const { error } = await supabase.from("providers").delete().eq("name", name);
    if (error) {
      console.error("Error deleting provider:", error);
      return false;
    }
    return true;
  }

  // =============================================
  // ASSETS
  // =============================================

  async getAssets(): Promise<MissingAsset[]> {
    if (!this.useSupabase || !supabase) {
      return mockAssets;
    }

    // Paginate to fetch ALL assets (Supabase default limit is 1000)
    const PAGE_SIZE = 1000;
    let allAssets: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("assets")
        .select(`
          *,
          designer:designers(*),
          provider:providers(name)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching assets:", error);
        return mockAssets;
      }

      if (data && data.length > 0) {
        allAssets = allAssets.concat(data);
        hasMore = data.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }

    const assetsData = allAssets;

    // Paginate to fetch ALL asset brands
    let allAssetBrands: any[] = [];
    page = 0;
    hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("asset_brands")
        .select(`
          *,
          brand:brands(*)
        `)
        .range(from, to);

      if (error) {
        console.error("Error fetching asset brands:", error);
        return mockAssets;
      }

      if (data && data.length > 0) {
        allAssetBrands = allAssetBrands.concat(data);
        hasMore = data.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }

    const assetBrandsData = allAssetBrands;

    // Map the data to MissingAsset format
    return assetsData.map((asset) => {
      const assetBrands = assetBrandsData
        .filter((ab) => ab.asset_id === asset.id)
        .map((ab) => ({
          id: ab.brand_id,
          name: ab.brand?.name || "",
          color: ab.brand?.color || "#000000",
          reflected: ab.reflected,
          reflectedBy: ab.reflected_by || undefined,
          reflectedAt: ab.reflected_at || undefined,
        }));

      return {
        id: asset.id,
        gameName: asset.game_name,
        provider: asset.provider?.name || "",
        brands: assetBrands,
        status: asset.status as AssetStatus,
        designer: asset.designer
          ? {
              id: asset.designer.id,
              name: asset.designer.name,
              avatar: asset.designer.avatar || "",
              email: asset.designer.email,
            }
          : null,
        foundBy: asset.found_by,
        dateFound: asset.date_found,
        notes: asset.notes || "",
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
      };
    });
  }

  async createAsset(asset: Omit<MissingAsset, "id" | "createdAt" | "updatedAt">): Promise<MissingAsset | null> {
    if (!this.useSupabase || !supabase) {
      const newAsset: MissingAsset = {
        id: `${Date.now()}`,
        ...asset,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockAssets.unshift(newAsset);
      return newAsset;
    }

    // Get provider ID
    const { data: providerData } = await supabase
      .from("providers")
      .select("id")
      .eq("name", asset.provider)
      .single();

    // Create the asset
    const { data: newAssetData, error: assetError } = await supabase
      .from("assets")
      .insert({
        game_name: asset.gameName,
        provider_id: providerData?.id || null,
        status: asset.status,
        designer_id: asset.designer?.id || null,
        found_by: asset.foundBy,
        date_found: asset.dateFound,
        notes: asset.notes,
      })
      .select()
      .single();

    if (assetError) {
      console.error("Error creating asset:", assetError);
      return null;
    }

    // Create asset-brand relationships
    if (asset.brands.length > 0) {
      const assetBrands = asset.brands.map((brand) => ({
        asset_id: newAssetData.id,
        brand_id: brand.id,
        reflected: brand.reflected,
        reflected_by: brand.reflectedBy || null,
        reflected_at: brand.reflectedAt || null,
      }));

      const { error: brandsError } = await supabase
        .from("asset_brands")
        .insert(assetBrands);

      if (brandsError) {
        console.error("Error creating asset brands:", brandsError);
      }
    }

    return {
      id: newAssetData.id,
      gameName: newAssetData.game_name,
      provider: asset.provider,
      brands: asset.brands,
      status: newAssetData.status as AssetStatus,
      designer: asset.designer,
      foundBy: newAssetData.found_by,
      dateFound: newAssetData.date_found,
      notes: newAssetData.notes || "",
      createdAt: newAssetData.created_at,
      updatedAt: newAssetData.updated_at,
    };
  }

  async updateAssetStatus(assetId: string, status: AssetStatus): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        asset.status = status;
        asset.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from("assets")
      .update({ status })
      .eq("id", assetId);

    if (error) {
      console.error("Error updating asset status:", error);
      return false;
    }

    return true;
  }

  async updateAssetName(assetId: string, gameName: string): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        asset.gameName = gameName;
        asset.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from("assets")
      .update({ game_name: gameName })
      .eq("id", assetId);

    if (error) {
      console.error("Error updating asset name:", error);
      return false;
    }

    return true;
  }

  async updateAssetDesigner(assetId: string, designerId: string | null): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        asset.designer = designerId
          ? mockDesigners.find((d) => d.id === designerId) || null
          : null;
        asset.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from("assets")
      .update({ designer_id: designerId })
      .eq("id", assetId);

    if (error) {
      console.error("Error updating asset designer:", error);
      return false;
    }

    return true;
  }

  async updateAssetProvider(assetId: string, providerName: string): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        asset.provider = providerName;
        asset.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    // Resolve provider ID by name
    const { data: providerData, error: providerError } = await supabase
      .from("providers")
      .select("id")
      .eq("name", providerName)
      .single();

    if (providerError) {
      console.error("Error fetching provider for update:", providerError);
      return false;
    }

    const { error } = await supabase
      .from("assets")
      .update({ provider_id: providerData?.id || null })
      .eq("id", assetId);

    if (error) {
      console.error("Error updating asset provider:", error);
      return false;
    }

    return true;
  }

  async updateAssetNotes(assetId: string, notes: string): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        asset.notes = notes;
        asset.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from("assets")
      .update({ notes })
      .eq("id", assetId);

    if (error) {
      console.error("Error updating asset notes:", error);
      return false;
    }

    return true;
  }

  async updateBrandReflection(
    assetId: string,
    brandId: string,
    reflected: boolean,
    reflectedBy?: string
  ): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        const brand = asset.brands.find((b) => b.id === brandId);
        if (brand) {
          brand.reflected = reflected;
          brand.reflectedBy = reflected ? reflectedBy : undefined;
          brand.reflectedAt = reflected ? new Date().toISOString().split("T")[0] : undefined;
          asset.updatedAt = new Date().toISOString();
          return true;
        }
      }
      return false;
    }

    const { error } = await supabase
      .from("asset_brands")
      .update({
        reflected,
        reflected_by: reflected ? reflectedBy : null,
        reflected_at: reflected ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("asset_id", assetId)
      .eq("brand_id", brandId);

    if (error) {
      console.error("Error updating brand reflection:", error);
      return false;
    }

    return true;
  }

  async updateAssetBrands(assetId: string, brands: Brand[]): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        asset.brands = brands;
        asset.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const { error: deleteError } = await supabase
      .from("asset_brands")
      .delete()
      .eq("asset_id", assetId);

    if (deleteError) {
      console.error("Error clearing asset brands:", deleteError);
      return false;
    }

    if (brands.length === 0) {
      return true;
    }

    const assetBrands = brands.map((brand) => ({
      asset_id: assetId,
      brand_id: brand.id,
      reflected: brand.reflected,
      reflected_by: brand.reflectedBy || null,
      reflected_at: brand.reflectedAt || null,
    }));

    const { error: insertError } = await supabase
      .from("asset_brands")
      .insert(assetBrands);

    if (insertError) {
      console.error("Error updating asset brands:", insertError);
      return false;
    }

    return true;
  }

  async addBrandsToAsset(assetId: string, brands: Brand[]): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const asset = mockAssets.find((a) => a.id === assetId);
      if (asset) {
        asset.brands.push(...brands);
        asset.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const assetBrands = brands.map((brand) => ({
      asset_id: assetId,
      brand_id: brand.id,
      reflected: brand.reflected,
      reflected_by: brand.reflectedBy || null,
      reflected_at: brand.reflectedAt || null,
    }));

    const { error } = await supabase
      .from("asset_brands")
      .insert(assetBrands);

    if (error) {
      console.error("Error adding brands to asset:", error);
      return false;
    }

    return true;
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    if (!this.useSupabase || !supabase) {
      const index = mockAssets.findIndex((a) => a.id === assetId);
      if (index !== -1) {
        mockAssets.splice(index, 1);
        return true;
      }
      return false;
    }

    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", assetId);

    if (error) {
      console.error("Error deleting asset:", error);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const dataService = new DataService();
