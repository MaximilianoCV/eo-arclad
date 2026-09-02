/** Respaldo local (localStorage) con la misma forma que la API de Supabase. Se usa cuando no hay conexión configurada. */
import type { StudyRow, StudyInsert, ActivityRow, ActivityInsert, ActivityUpdate, PerceptionRow, PerceptionType, ActivityCategory } from "@/types/study";
import { ALL_CATEGORIES } from "@/types/study";
import { PLAN_EO } from "@/data/plan";

const K = { studies: "eo.local.studies", activities: "eo.local.activities", perceptions: "eo.local.perceptions", seeded: "eo.local.seeded" };
const get = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const set = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + Math.random().toString(16).slice(2));
const now = () => new Date().toISOString();

/** Semilla: los 7 EO del Plan de Vuelo + 3 con actividades simuladas para ver el Resumen (marcados como demo). */
export function seedIfEmpty() {
  if (get(K.seeded, false)) return;
  const studies: StudyRow[] = PLAN_EO.map(p => ({
    id: uid(), plan_id: p.plan_id, frente: p.frente, sede: null, position: p.puesto, collaborator_name: "",
    created_by: p.consultor, study_date: null, semana: p.semana || null, objective: p.objetivo, status: "active", notes: null, created_at: now(),
  }));
  const activities: ActivityRow[] = [];
  const perceptions: PerceptionRow[] = [];
  const prof: Record<string, number[]> = { "A--001": [5, 5, 55, 15, 3, 5, 12], "A-000": [5, 3, 20, 35, 25, 5, 7], "A-039": [25, 5, 25, 20, 8, 10, 7] };
  const ACT: Record<ActivityCategory, string[]> = {
    supervision_active: ["Revisa avance con el equipo", "Corrige captura", "Asigna prioridades"],
    training: ["Explica proceso a nuevo", "Recibe capacitación de sistema"],
    administrative: ["Captura pedido en sistema", "Confirma inventario por WhatsApp", "Correo de seguimiento", "Junta interna"],
    operative: ["Visita a cliente", "Cotiza en vivo", "Secuencia en Excel", "Programa máquina"],
    travel: ["Traslado a cliente", "Camina a planta", "Va a almacén"],
    supervision_passive: ["Observa sin intervenir", "Acompaña sin decidir"],
    unproductive: ["Espera respuesta", "Espera aprobación", "Sin actividad"],
  };
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const hhmmss = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(x => String(x).padStart(2, "0")).join(":");
  studies.forEach(s => {
    const w = prof[s.plan_id || ""]; if (!w) return;
    s.collaborator_name = "(demo) persona"; s.sede = "Alce Blanco"; s.study_date = "2026-09-08";
    const tot = w.reduce((a, b) => a + b, 0);
    const pick = (): ActivityCategory => { let x = r() * tot; for (let i = 0; i < 7; i++) { x -= w[i]; if (x < 0) return ALL_CATEGORIES[i]; } return "unproductive"; };
    let t = 8 * 3600; let order = 0;
    while (t < 16 * 3600) {
      const cat = pick(); const dur = Math.round((3 + r() * 22) * 60); const end = Math.min(t + dur, 16 * 3600);
      activities.push({ id: uid(), study_id: s.id, start_time: hhmmss(t), end_time: hhmmss(end), duration_seconds: end - t, description: ACT[cat][Math.floor(r() * ACT[cat].length)], category: cat, sort_order: order++, created_at: now() });
      t = end;
    }
    if (s.plan_id !== "A-039") {
      s.status = "completed";
      const secs = ALL_CATEGORIES.map(c => activities.filter(a => a.study_id === s.id && a.category === c).reduce((x, a) => x + a.duration_seconds, 0));
      const total = secs.reduce((a, b) => a + b, 0);
      const norm = (arr: number[]) => { const tt = arr.reduce((a, b) => a + b, 0); const m = arr.map(v => Math.round(v / tt * 100)); m[0] += 100 - m.reduce((a, b) => a + b, 0); return m; };
      const mk = (f: number[]): PerceptionRow => { const v = norm(secs.map((x, i) => (x / total * 100) * f[i] + 1)); const row = { study_id: s.id, perception_type: "actual" as PerceptionType } as PerceptionRow; ALL_CATEGORIES.forEach((c, i) => (row[c] = v[i])); return row; };
      perceptions.push(mk([1, 1.1, 0.9, 1.2, 0.8, 0.8, 0.5]));
      const ideal = mk([1.3, 1.3, 0.7, 1.3, 0.6, 0.5, 0.3]); ideal.perception_type = "ideal"; perceptions.push(ideal);
    }
  });
  set(K.studies, studies); set(K.activities, activities); set(K.perceptions, perceptions); set(K.seeded, true);
}

export const localDb = {
  async fetchStudies(): Promise<StudyRow[]> { return get<StudyRow[]>(K.studies, []).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
  async fetchStudy(id: string): Promise<StudyRow> { const s = get<StudyRow[]>(K.studies, []).find(x => x.id === id); if (!s) throw new Error("No existe"); return s; },
  async createStudy(s: StudyInsert): Promise<StudyRow> { const all = get<StudyRow[]>(K.studies, []); const row: StudyRow = { status: "active", notes: null, ...s, id: uid(), created_at: now() } as StudyRow; all.push(row); set(K.studies, all); return row; },
  async updateStudy(id: string, patch: Partial<StudyRow>) { const all = get<StudyRow[]>(K.studies, []); const i = all.findIndex(x => x.id === id); if (i >= 0) { all[i] = { ...all[i], ...patch }; set(K.studies, all); } },
  async deleteStudy(id: string) { set(K.studies, get<StudyRow[]>(K.studies, []).filter(x => x.id !== id)); set(K.activities, get<ActivityRow[]>(K.activities, []).filter(x => x.study_id !== id)); set(K.perceptions, get<PerceptionRow[]>(K.perceptions, []).filter(x => x.study_id !== id)); },
  async fetchActivities(studyId: string): Promise<ActivityRow[]> { return get<ActivityRow[]>(K.activities, []).filter(a => a.study_id === studyId).sort((a, b) => a.sort_order - b.sort_order); },
  async fetchAllActivities(): Promise<ActivityRow[]> { return get<ActivityRow[]>(K.activities, []); },
  async createActivity(a: ActivityInsert): Promise<ActivityRow> { const all = get<ActivityRow[]>(K.activities, []); const row: ActivityRow = { ...a, id: uid(), created_at: now() }; all.push(row); set(K.activities, all); return row; },
  async updateActivity(id: string, u: ActivityUpdate) { const all = get<ActivityRow[]>(K.activities, []); const i = all.findIndex(x => x.id === id); if (i >= 0) { all[i] = { ...all[i], ...u }; set(K.activities, all); } },
  async deleteActivity(id: string) { set(K.activities, get<ActivityRow[]>(K.activities, []).filter(x => x.id !== id)); },
  async fetchPerception(studyId: string, type: PerceptionType): Promise<PerceptionRow | null> { return get<PerceptionRow[]>(K.perceptions, []).find(p => p.study_id === studyId && p.perception_type === type) ?? null; },
  async fetchAllPerceptions(): Promise<PerceptionRow[]> { return get<PerceptionRow[]>(K.perceptions, []); },
  async upsertPerception(studyId: string, type: PerceptionType, values: Record<string, number>) {
    const all = get<PerceptionRow[]>(K.perceptions, []).filter(p => !(p.study_id === studyId && p.perception_type === type));
    all.push({ study_id: studyId, perception_type: type, ...values } as PerceptionRow); set(K.perceptions, all);
  },
};
