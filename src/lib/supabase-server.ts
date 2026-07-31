import { createClient } from "@supabase/supabase-js";

export function serverClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://llvszoblxpblvwzmlkeq.supabase.co";
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_QIPUB5wfg5zerYs1eu0tkA_0vPth1me";

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (
          (key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) &&
          h.get("Authorization") === `Bearer ${key}`
        ) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}
