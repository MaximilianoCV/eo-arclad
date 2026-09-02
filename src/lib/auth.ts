/** Inicio de sesión: usuario (consultora) + contraseña compartida. En Supabase es Auth real (email+password); en modo local es un candado simple. */
import { getSupabase, hasSupabase } from "@/integrations/supabase/client";

export const USERS: { name: string; email: string }[] = [
  { name: "Max Cuéllar", email: "max.cuellar@eo-arclad.app" },
  { name: "Pablo Sepúlveda", email: "pablo.sepulveda@eo-arclad.app" },
  { name: "Adrián Garza", email: "adrian.garza@eo-arclad.app" },
];
const LOCAL_KEY = "eo.local.session";
const LOCAL_PASSWORD = "ARclad2026"; // solo modo local/demo; en Supabase la contraseña vive en Auth

export interface Session { name: string; email: string; }

export async function getSession(): Promise<Session | null> {
  if (!hasSupabase()) {
    if (new URLSearchParams(location.search).has("demo")) return USERS[0]; // solo modo local: capturas y demos
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch { return null; }
  }
  const { data } = await getSupabase()!.auth.getSession();
  const u = data.session?.user; if (!u) return null;
  return { name: (u.user_metadata?.name as string) || USERS.find(x => x.email === u.email)?.name || u.email || "", email: u.email || "" };
}
export async function signIn(name: string, password: string): Promise<Session> {
  const user = USERS.find(u => u.name === name); if (!user) throw new Error("Usuario no válido");
  if (!hasSupabase()) {
    if (password !== LOCAL_PASSWORD) throw new Error("Contraseña incorrecta");
    localStorage.setItem(LOCAL_KEY, JSON.stringify(user)); return user;
  }
  const { error } = await getSupabase()!.auth.signInWithPassword({ email: user.email, password });
  if (error) throw new Error(/invalid/i.test(error.message) ? "Contraseña incorrecta" : error.message);
  localStorage.setItem("eo.who", user.name);
  return user;
}
export async function signOut() {
  localStorage.removeItem(LOCAL_KEY);
  if (hasSupabase()) await getSupabase()!.auth.signOut();
}
export function onAuthChange(cb: () => void) {
  if (!hasSupabase()) return () => {};
  const { data } = getSupabase()!.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}
