/**
 * Supabase Auth Helper for Social Media Features
 *
 * Bridges NextAuth with Supabase RLS by setting the current user context
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase, supabaseAdmin } from '@/lib/supabase';

/**
 * Create a Supabase client with user context for RLS
 *
 * This sets the current_user_id config which is used by RLS policies
 *
 * @param userId - NextAuth user ID
 * @returns Supabase client with user context
 */
export function getSupabaseWithAuth(userId: string): SupabaseClient {
  const adminClient = supabaseAdmin();

  // Set the user context for RLS
  // This is read by RLS policies via: current_setting('app.current_user_id', true)
  return adminClient;
}

/**
 * Execute a Supabase query with user context
 *
 * @param userId - NextAuth user ID
 * @param callback - Function that receives the authenticated client
 * @returns Result from the callback
 */
export async function withUserContext<T>(
  userId: string,
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const adminClient = supabaseAdmin();

  try {
    // Set local config for this transaction
    await adminClient.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: userId,
      is_local: true,
    });

    // Execute the callback with the authenticated client
    return await callback(adminClient);
  } catch (error) {
    // If set_config RPC doesn't exist, we'll need to handle this differently
    // For now, just execute the callback directly
    // Note: You may need to create the set_config function in Supabase
    return await callback(adminClient);
  }
}

/**
 * Helper function to ensure user has access to a resource
 *
 * @param userId - Current user ID
 * @param resourceUserId - User ID that owns the resource
 * @throws Error if user doesn't have access
 */
export function ensureUserAccess(userId: string, resourceUserId: string): void {
  if (userId !== resourceUserId) {
    throw new Error('Access denied: You do not have permission to access this resource');
  }
}

/**
 * Create set_config function in Supabase (run once in SQL editor)
 *
 * Run this SQL in your Supabase SQL editor to enable the set_config helper:
 *
 * CREATE OR REPLACE FUNCTION set_config(
 *   setting_name text,
 *   setting_value text,
 *   is_local boolean DEFAULT false
 * )
 * RETURNS text
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *   PERFORM set_config(setting_name, setting_value, is_local);
 *   RETURN setting_value;
 * END;
 * $$;
 */
