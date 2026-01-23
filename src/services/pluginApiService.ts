/**
 * API Service for Figma Plugin Integration
 * 
 * Provides endpoints for fetching game data to be used by the Figma plugin
 */

import { supabaseServer as supabase } from '../lib/supabase.server';

/**
 * Normalize game name to lowercase without spaces/symbols
 */
function normalizeGameName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Fetch assets filtered by provider and/or status
 * Returns data in format expected by Figma plugin
 */
export async function fetchAssetsForPlugin(
  provider?: string,
  status?: string
): Promise<Array<{ game_name: string; gamename: string; provider: string; status: string }>> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log('Fetching assets with filters - provider:', provider, 'status:', status);

    // Start building the query - join with providers table
    let query = supabase
      .from('assets')
      .select(`
        game_name,
        status,
        providers!assets_provider_id_fkey(name)
      `);

    // Apply provider filter if provided
    if (provider) {
      // First get the provider ID
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('name', provider)
        .single();
      
      if (providerError || !providerData) {
        console.error('Provider not found:', provider);
        return [];
      }
      
      query = query.eq('provider_id', providerData.id);
    }

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Paginate to fetch ALL assets (Supabase default limit is 1000)
    const PAGE_SIZE = 1000;
    let allAssets: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build query with pagination
      let paginatedQuery = supabase
        .from('assets')
        .select(`
          game_name,
          status,
          providers!assets_provider_id_fkey(name)
        `);

      // Apply same filters
      if (provider) {
        const { data: providerData } = await supabase
          .from('providers')
          .select('id')
          .eq('name', provider)
          .single();
        
        if (providerData) {
          paginatedQuery = paginatedQuery.eq('provider_id', providerData.id);
        }
      }

      if (status) {
        paginatedQuery = paginatedQuery.eq('status', status);
      }

      paginatedQuery = paginatedQuery.order('game_name', { ascending: true }).range(from, to);

      const { data: pageData, error: pageError } = await paginatedQuery;

      if (pageError) {
        console.error('Error fetching assets page:', pageError);
        break;
      }

      if (pageData && pageData.length > 0) {
        allAssets = allAssets.concat(pageData);
        hasMore = pageData.length === PAGE_SIZE;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log('Fetched', allAssets.length, 'assets');

    // Transform data to plugin format
    return allAssets.map((item: any) => ({
      game_name: item.game_name,
      gamename: normalizeGameName(item.game_name),
      provider: item.providers?.name || 'Unknown',
      status: item.status
    }));

  } catch (error: any) {
    console.error('fetchAssetsForPlugin error:', error);
    throw error;
  }
}

/**
 * Get list of all providers (for dropdown)
 */
export async function getProviders(): Promise<string[]> {
  try {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('providers')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching providers:', error);
      return [];
    }

    return (data || []).map((item: any) => item.name);
  } catch (error) {
    console.error('getProviders error:', error);
    return [];
  }
}

/**
 * Export a simple HTTP endpoint handler that can be used with Vite dev server
 * or deployed as a serverless function
 */
export async function handleApiRequest(req: {
  method: string;
  query: { provider?: string; status?: string };
}): Promise<{ status: number; data: any }> {
  if (req.method !== 'GET') {
    return {
      status: 405,
      data: { error: 'Method not allowed' }
    };
  }

  try {
    const { provider, status } = req.query;
    const assets = await fetchAssetsForPlugin(provider, status);

    return {
      status: 200,
      data: assets
    };
  } catch (error: any) {
    return {
      status: 500,
      data: { error: 'Internal server error', details: error.message }
    };
  }
}
