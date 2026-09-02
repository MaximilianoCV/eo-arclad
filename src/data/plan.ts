/** Parámetros del "Plan de Vuelo DX.xlsx" (ARclad México · Etapa de Diagnóstico). Hoja "1. Parametros". */
export const PROYECTO = "ARclad México";
export const CONSULTORES = ["Max Cuéllar", "Pablo Sepúlveda", "Adrián Garza"] as const;
export const FRENTES = [
  "1. Forecast, Ventas & Inteligencia Comercial",
  "2. Importaciones & Compras Nacionales",
  "3. Programación & Producción",
  "4. Confiabilidad & Almacén",
  "5. Logística & Despacho",
] as const;
export const SEDES = ["Alce Blanco", "Algarin", "Culiacan", "Guadalajara", "Pv. Guadalajara", "Leon", "Merida", "Monterrey", "Puebla", "Queretaro", "PV Queretaro", "Saltillo"] as const;
export const SEMANAS: Record<string, string> = { S1: "7–11 sep", S2: "14–18 sep", S3: "21–25 sep", S4: "28 sep–2 oct" };

export interface PlanEO {
  plan_id: string; frente: string; consultor: string; puesto: string; objetivo: string; semana: string; presenta: string;
}
/** Hoja "2. Plan Consultor", Tipo = Estudio de Observación (7 renglones). */
export const PLAN_EO: PlanEO[] = [
  { plan_id: "A--001", frente: FRENTES[0], consultor: "Max Cuéllar", puesto: "Asistente Comercial (captura de pedidos)", objetivo: "Validar retrabajos, confirmaciones de inventario por WhatsApp, recaptura, errores", semana: "S1", presenta: "JSA1" },
  { plan_id: "A-000", frente: FRENTES[0], consultor: "Max Cuéllar", puesto: "Ejecutivo Comercial (día en la vida)", objetivo: "Medir % de tiempo en venta efectiva vs administrativa, pasos de la venta, uso de sistema", semana: "S1", presenta: "JSA1" },
  { plan_id: "A-001", frente: FRENTES[0], consultor: "Max Cuéllar", puesto: "Gerente Comercial", objetivo: "", semana: "S2", presenta: "JSA1" },
  { plan_id: "A-026", frente: FRENTES[1], consultor: "Max Cuéllar", puesto: "Ejecutivo de Importaciones", objetivo: "Seguimiento de tránsitos por correo, retrabajos, tiempos por actividad", semana: "S3", presenta: "JSA2" },
  { plan_id: "A-027", frente: FRENTES[1], consultor: "Max Cuéllar", puesto: "Ejecutivo de Compras", objetivo: "% de compras reactivas en vivo; ciclo requisición→OC→firma; interrupciones", semana: "S4", presenta: "JSA2" },
  { plan_id: "A-039", frente: FRENTES[2], consultor: "Pablo Sepúlveda", puesto: "Programador de Producción", objetivo: "Obtención de información, programación, seguimiento a plan, supervisión en máquinas, secuenciación en Excel", semana: "", presenta: "" },
  { plan_id: "A-041", frente: FRENTES[2], consultor: "Pablo Sepúlveda", puesto: "Jefe de Almacén", objetivo: "", semana: "", presenta: "" },
];
