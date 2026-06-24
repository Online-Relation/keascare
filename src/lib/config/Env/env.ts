// src/lib/config/Env/env.ts

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    secretKey: process.env.SUPABASE_SECRET_KEY!,
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
} as const;
