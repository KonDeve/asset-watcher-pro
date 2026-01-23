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

    // Build query
    let query = supabase
      .from('assets')
      .select(`
        game_name,
        providers!inner(name)
      `);

    // Apply filters
    if (provider) {
      query = query.eq('providers.name', provider);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: 'Database query failed', details: error.message });
      return;
    }

    // Transform data
    const assets = (data || []).map((item: any) => ({
      game_name: item.game_name,
      gamename: normalizeGameName(item.game_name)
    }));

    res.status(200).json(assets);

  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
