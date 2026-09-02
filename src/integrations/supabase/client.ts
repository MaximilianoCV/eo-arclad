import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Config: primero .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY); si no, lo que el usuario guardó en el navegador. */
export function getSupabaseConfig(): { url: string; key: string } | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (envUrl && envKey) return { url: envUrl, key: envKey };
  try {
    const raw = localStorage.getItem("eo.supabase");
    if (raw) { const c = JSON.parse(raw); if (c?.url && c?.key) return c; }
  } catch { /* ignore */ }
  return null;
}
export function saveSupabaseConfig(cfg: { url: string; key: string } | null) {
  if (cfg) localStorage.setItem("eo.supabase", JSON.stringify(cfg)); else localStorage.removeItem("eo.supabase");
}

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  client = createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true, storage: localStorage } });
  return client;
}
export const hasSupabase = () => getSupabaseConfig() !== null;
