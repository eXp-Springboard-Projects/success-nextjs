import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseAnonKey && typeof window === 'undefined') {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Get it from: https://app.supabase.com/project/aczlassjkbtwenzsohwm/settings/api');
}

// Create a single supabase client for interacting with your database
export const supabase: SupabaseClient = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using NextAuth, not Supabase Auth
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'success-nextjs',
    },
  },
  })
  : ({} as SupabaseClient); // Fallback for when keys are not set

// Server-side client with service role key (bypass RLS)
export const supabaseAdmin = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
};

// Type-safe database client (when you need typed queries)
export type Database = {
  public: {
    Tables: {
      // Add your table types here if you want full type safety
      // You can generate these with: npx supabase gen types typescript --project-id aczlassjkbtwenzsohwm
      [key: string]: any;
    };
  };
};

export default supabase;
