/**
 * Provider Service for fetching provider list
 */

import { supabaseServer as supabase } from '../lib/supabase.server';

/**
 * Fetch all providers from database
 */
export async function fetchProviders(): Promise<Array<{ id: number; name: string }>> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('providers')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching providers:', error);
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('fetchProviders error:', error);
    throw error;
  }
}
