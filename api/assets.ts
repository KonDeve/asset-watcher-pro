/**
 * API Endpoint: /api/assets
 * 
 * Fetches assets from Supabase database with optional filters
 * Returns game_name and gamename for Figma plugin integration
 */

import { createClient } from '@supabase/supabase-js';

// Support both Vite (local dev) and Vercel (production) environments
const supabaseUrl = (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL : undefined) || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_ANON_KEY : undefined) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Normalize game name to lowercase without spaces/symbols
 */
function normalizeGameName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Handle GET /api/assets
 */
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { provider, status } = req.query;

    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    // Get provider ID if provider filter is specified
    let providerId: number | undefined;
    if (provider) {
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('name', provider)
        .single();
      
      if (providerError || !providerData) {
        console.error('Provider not found:', provider);
        res.status(200).json({
          count: 0,
          returned: 0,
          data: []
        });
        return;
      }
      
      providerId = providerData.id;
    }

    // Paginate to fetch ALL assets (Supabase default limit is 1000)
    const PAGE_SIZE = 1000;
    let allAssets: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build paginated query
      let paginatedQuery = supabase
        .from('assets')
        .select(`
          game_name,
          status,
          provider_id,
          providers(name)
        `);

      // Apply filters
      if (providerId) {
        paginatedQuery = paginatedQuery.eq('provider_id', providerId);
      }

      if (status) {
        paginatedQuery = paginatedQuery.eq('status', status);
      }

      paginatedQuery = paginatedQuery.range(from, to);

      const { data: pageData, error: pageError } = await paginatedQuery;

      if (pageError) {
        console.error('Supabase pagination error:', pageError);
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

    // Transform data to match dev environment format
    const assets = allAssets.map((item: any) => ({
      game_name: item.game_name,
      gamename: normalizeGameName(item.game_name),
      provider: item.providers?.name || 'Unknown',
      status: item.status
    }));

    res.status(200).json({
      count: assets.length,
      returned: assets.length,
      data: assets
    });

  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
