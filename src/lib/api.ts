/**
 * Capa de datos. Si hay Supabase configurado (.env o guardado en el navegador) usa Supabase;
 * si no, usa el respaldo local (localStorage) con la misma forma. Los componentes no distinguen.
 */
import { getSupabase, hasSupabase } from "@/integrations/supabase/client";
import { localDb, seedIfEmpty } from "@/lib/local-db";
import type { StudyRow, StudyInsert, ActivityRow, ActivityInsert, ActivityUpdate, PerceptionRow, PerceptionType } from "@/types/study";

export type { StudyRow, ActivityRow, ActivityInsert };
export const isCloud = () => hasSupabase();
if (!hasSupabase()) seedIfEmpty();

const sb = () => { const c = getSupabase(); if (!c) throw new Error("Supabase no configurado"); return c; };
const cloud = () => hasSupabase();
const chk = <T,>(r: { data: T; error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); return r.data; };

export async function fetchStudies(): Promise<StudyRow[]> {
  if (!cloud()) return localDb.fetchStudies();
  return chk(await sb().from("studies").select("*").order("created_at", { ascending: false })) as StudyRow[];
}
export async function fetchStudy(id: string): Promise<StudyRow> {
  if (!cloud()) return localDb.fetchStudy(id);
  return chk(await sb().from("studies").select("*").eq("id", id).single()) as StudyRow;
}
export async function createStudy(s: StudyInsert): Promise<StudyRow> {
  if (!cloud()) return localDb.createStudy(s);
  return chk(await sb().from("studies").insert(s).select().single()) as StudyRow;
}
export async function updateStudy(id: string, patch: Partial<StudyRow>) {
  if (!cloud()) return localDb.updateStudy(id, patch);
  chk(await sb().from("studies").update(patch).eq("id", id));
}
export async function updateStudyStatus(id: string, status: StudyRow["status"]) { return updateStudy(id, { status }); }
export async function deleteStudy(id: string) {
  if (!cloud()) return localDb.deleteStudy(id);
  chk(await sb().from("studies").delete().eq("id", id));
}
export async function fetchActivities(studyId: string): Promise<ActivityRow[]> {
  if (!cloud()) return localDb.fetchActivities(studyId);
  return chk(await sb().from("activities").select("*").eq("study_id", studyId).order("sort_order", { ascending: true })) as ActivityRow[];
}
export async function fetchAllActivities(): Promise<ActivityRow[]> {
  if (!cloud()) return localDb.fetchAllActivities();
  return chk(await sb().from("activities").select("*")) as ActivityRow[];
}
export async function createActivity(a: ActivityInsert): Promise<ActivityRow> {
  if (!cloud()) return localDb.createActivity(a);
  return chk(await sb().from("activities").insert(a).select().single()) as ActivityRow;
}
export async function updateActivity(id: string, u: ActivityUpdate) {
  if (!cloud()) return localDb.updateActivity(id, u);
  chk(await sb().from("activities").update(u).eq("id", id));
}
export async function deleteActivity(id: string) {
  if (!cloud()) return localDb.deleteActivity(id);
  chk(await sb().from("activities").delete().eq("id", id));
}
export async function fetchPerception(studyId: string, type: PerceptionType): Promise<PerceptionRow | null> {
  if (!cloud()) return localDb.fetchPerception(studyId, type);
  return chk(await sb().from("perceptions").select("*").eq("study_id", studyId).eq("perception_type", type).maybeSingle()) as PerceptionRow | null;
}
export async function fetchAllPerceptions(): Promise<PerceptionRow[]> {
  if (!cloud()) return localDb.fetchAllPerceptions();
  return chk(await sb().from("perceptions").select("*")) as PerceptionRow[];
}
export async function upsertPerception(studyId: string, type: PerceptionType, values: Record<string, number>) {
  if (!cloud()) return localDb.upsertPerception(studyId, type, values);
  chk(await sb().from("perceptions").upsert({ study_id: studyId, perception_type: type, ...values }, { onConflict: "study_id,perception_type" }));
}
/** Prueba de conexión (para el diálogo de configuración). */
export async function pingCloud(): Promise<string | null> {
  try { const c = getSupabase(); if (!c) return "Sin configuración"; const { error } = await c.from("studies").select("id", { count: "exact", head: true }); return error ? error.message : null; }
  catch (e) { return (e as Error).message; }
}
