/**
 * API Endpoint: /api/providers
 * 
 * Fetches list of providers from Supabase database
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
 * Handle GET /api/providers
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
    if (!supabase) {
      res.status(500).json({ error: 'Database not configured' });
      return;
    }

    // Fetch all providers
    const { data, error } = await supabase
      .from('providers')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ error: 'Database query failed', details: error.message });
      return;
    }

    const providers = data || [];
    res.status(200).json({
      count: providers.length,
      data: providers
    });

  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
