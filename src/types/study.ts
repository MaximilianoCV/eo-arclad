/** Categorías del formato EO (hoja "Datos"). El orden es el código 1..7. */
export type ActivityCategory =
  | "supervision_active"
  | "training"
  | "administrative"
  | "operative"
  | "travel"
  | "supervision_passive"
  | "unproductive";

export const ALL_CATEGORIES: ActivityCategory[] = [
  "supervision_active", "training", "administrative", "operative", "travel", "supervision_passive", "unproductive",
];

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  supervision_active: "Supervisión activa",
  training: "Capacitación",
  administrative: "Tiempo administrativo",
  operative: "Operativo",
  travel: "Traslado",
  supervision_passive: "Supervisión pasiva",
  unproductive: "Tiempo improductivo",
};

export const CATEGORY_SHORT: Record<ActivityCategory, string> = {
  supervision_active: "Sup. activa",
  training: "Capacitación",
  administrative: "Administrativo",
  operative: "Operativo",
  travel: "Traslado",
  supervision_passive: "Sup. pasiva",
  unproductive: "Improductivo",
};

/** Paleta validada (daltonismo + contraste) sobre la marca LCG. */
export const CHART_COLORS: Record<ActivityCategory, string> = {
  supervision_active: "#009072",
  training: "#4176E6",
  administrative: "#B8760F",
  operative: "#1C8FB0",
  travel: "#7E9C22",
  supervision_passive: "#6E5BB8",
  unproductive: "#C0504D",
};

export const categoryCode = (c: ActivityCategory) => ALL_CATEGORIES.indexOf(c) + 1;

/** Estilo de badge por categoría (fondo al 12%, texto en el color). */
export const badgeStyle = (c: ActivityCategory) => ({ backgroundColor: CHART_COLORS[c] + "1f", color: CHART_COLORS[c] });

export type StudyStatus = "active" | "completed" | "archived";

export interface StudyRow {
  id: string;
  plan_id: string | null;
  frente: string;
  sede: string | null;
  position: string;
  collaborator_name: string;
  created_by: string;          // consultor
  study_date: string | null;   // YYYY-MM-DD
  semana: string | null;       // S1..S4
  objective: string;
  status: StudyStatus;
  notes: string | null;
  created_at: string;
}
export type StudyInsert = Omit<StudyRow, "id" | "created_at" | "status" | "notes"> & Partial<Pick<StudyRow, "status" | "notes">>;

export interface ActivityRow {
  id: string;
  study_id: string;
  start_time: string;          // HH:mm:ss
  end_time: string | null;
  duration_seconds: number;
  description: string;
  category: ActivityCategory | null;
  sort_order: number;
  created_at?: string;
}
export type ActivityInsert = Omit<ActivityRow, "id" | "created_at">;
export type ActivityUpdate = Partial<ActivityInsert>;

export type PerceptionType = "actual" | "ideal";
export interface PerceptionRow extends Record<ActivityCategory, number> {
  study_id: string;
  perception_type: PerceptionType;
}

export const DEFAULT_OBJECTIVE =
  "Entender el sistema de trabajo completo del puesto: cómo recibe la información, cómo prioriza el día, cómo ejecuta y da seguimiento, con qué herramientas y sistemas, y cómo se comunica con otras áreas. Medir el % de tiempo por tipo de actividad.";
