import { useEffect, useState } from "react";
import { ALL_CATEGORIES, CATEGORY_LABELS, type StudyRow, type ActivityRow, type ActivityCategory } from "@/types/study";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { fetchPerception } from "@/lib/api";
import { formatTime } from "./AnalysisPanel";
import { toast } from "@/hooks/use-toast";

function download(name: string, content: string, type: string) {
  const blob = new Blob(["﻿" + content], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
async function copyOrDownload(name: string, content: string, type: string) {
  try { download(name, content, type); } catch { /* fallthrough */ }
  try { await navigator.clipboard.writeText(content); toast({ title: "Copiado al portapapeles", description: name }); } catch { /* ignore */ }
}

export default function ReportPanel({ study, activities }: { study: StudyRow; activities: ActivityRow[] }) {
  const [perception, setPerception] = useState<Record<string, number> | null>(null);
  const [ideal, setIdeal] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    const pick = (d: Record<string, unknown> | null) => { if (!d) return null; const v: Record<string, number> = {}; ALL_CATEGORIES.forEach(c => { v[c] = Number(d[c] ?? 0); }); return Object.values(v).some(x => x > 0) ? v : null; };
    fetchPerception(study.id, "actual").then(d => setPerception(pick(d as never))).catch(() => {});
    fetchPerception(study.id, "ideal").then(d => setIdeal(pick(d as never))).catch(() => {});
  }, [study.id]);

  const total = activities.reduce((s, a) => s + a.duration_seconds, 0);
  const by: Record<string, number> = {}; activities.forEach(a => { if (a.category) by[a.category] = (by[a.category] || 0) + a.duration_seconds; });
  const realPct = (c: string) => (by[c] || 0) / Math.max(total, 1) * 100;
  const gaps = (ref: Record<string, number> | null, labelA: string, labelB: string) => ref ? ALL_CATEGORIES.filter(c => Math.abs((ref[c] || 0) - realPct(c)) >= 10).map(c => `${CATEGORY_LABELS[c]}: ${labelA} ${realPct(c).toFixed(1)}% — ${labelB} ${(ref[c] || 0).toFixed(0)}% (${Math.abs((ref[c] || 0) - realPct(c)).toFixed(0)} pp)`) : [];
  const percInsights = gaps(perception, "real", "cree");
  const idealInsights = gaps(ideal, "real", "ideal");
  const idle = realPct("supervision_passive") + realPct("unproductive");
  const productive = realPct("supervision_active") + realPct("training") + realPct("operative");

  const exportCSV = () => {
    const head = "plan_id,frente,sede,puesto,persona,consultor,semana,fecha,hora_inicio,hora_fin,duracion_s,codigo,categoria,descripcion";
    const rows = activities.map(a => [study.plan_id, study.frente, study.sede, study.position, study.collaborator_name, study.created_by, study.semana, study.study_date, a.start_time, a.end_time, a.duration_seconds, a.category ? ALL_CATEGORIES.indexOf(a.category) + 1 : "", a.category ? CATEGORY_LABELS[a.category as ActivityCategory] : "", a.description].map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","));
    copyOrDownload(`EO_${study.position.replace(/\s+/g, "_")}_${study.study_date || ""}.csv`, [head, ...rows].join("\n"), "text/csv;charset=utf-8");
  };
  /** Formato Excel EO: un cuadro por cada 10 min. Se reparte cada actividad en bloques de 10 min por hora de inicio. */
  const exportCuadros = () => {
    const toSec = (t: string) => { const [h, m, s] = t.split(":").map(Number); return h * 3600 + m * 60 + (s || 0); };
    const slots: Record<number, Record<string, number>> = {};
    activities.forEach(a => { if (!a.category) return; const s = toSec(a.start_time), e = a.end_time ? toSec(a.end_time) : s + a.duration_seconds; for (let t = s; t < e; t += 60) { const k = Math.floor(t / 600); (slots[k] = slots[k] || {})[a.category] = (slots[k][a.category] || 0) + 1; } });
    const rows = Object.keys(slots).map(Number).sort((a, b) => a - b).map(k => { const win = slots[k]; const cat = Object.entries(win).sort((a, b) => b[1] - a[1])[0][0] as ActivityCategory; const h = Math.floor(k * 600 / 3600), m = (k * 600 % 3600) / 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")},${ALL_CATEGORIES.indexOf(cat) + 1},${CATEGORY_LABELS[cat]}`; });
    copyOrDownload(`EO_cuadros10min_${study.position.replace(/\s+/g, "_")}.csv`, ["hora,codigo,categoria", ...rows].join("\n"), "text/csv;charset=utf-8");
  };
  const exportJSON = () => copyOrDownload(`EO_${study.position.replace(/\s+/g, "_")}.json`, JSON.stringify({ study, activities, perception, ideal }, null, 2), "application/json");

  return (
    <div className="space-y-6">
      <div className="industrial-card">
        <span className="label-caps text-[10px]">Resumen del estudio</span>
        <h2 className="display-text mt-2">{study.position}{study.collaborator_name ? ` — ${study.collaborator_name}` : ""}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm">
          <div><span className="text-muted-foreground">Frente:</span> {study.frente}</div>
          <div><span className="text-muted-foreground">Sede:</span> {study.sede || "—"}</div>
          <div><span className="text-muted-foreground">Fecha:</span> {study.study_date || "—"} {study.semana || ""}</div>
          <div><span className="text-muted-foreground">Consultor:</span> {study.created_by}</div>
          <div><span className="text-muted-foreground">Actividades:</span> {activities.length}</div>
          <div><span className="text-muted-foreground">Tiempo total:</span> {formatTime(total)}</div>
        </div>
        {study.objective && <p className="text-xs text-muted-foreground mt-3">Objetivo: {study.objective}</p>}
      </div>
      <div className="industrial-card">
        <span className="label-caps text-[10px]">Conclusiones automáticas</span>
        <ul className="mt-3 space-y-2 text-sm">
          <li>• Productivo (activa + capacitación + operativo): <strong>{productive.toFixed(1)}%</strong></li>
          <li>• Pasiva + improductivo: <strong>{idle.toFixed(1)}%</strong> {idle > 20 ? "⚠️ por encima del umbral de 20%" : "✓ dentro del rango"}</li>
          <li>• Administrativo: <strong>{realPct("administrative").toFixed(1)}%</strong> · Traslado: <strong>{realPct("travel").toFixed(1)}%</strong></li>
          <li>• Se registraron <strong>{activities.length}</strong> actividades en <strong>{formatTime(total)}</strong></li>
          {Object.entries(by).sort(([, a], [, b]) => b - a).slice(0, 3).map(([c, s]) => <li key={c}>• Principal: <strong>{CATEGORY_LABELS[c as ActivityCategory]}</strong> — {formatTime(s)} ({(s / Math.max(total, 1) * 100).toFixed(1)}%)</li>)}
        </ul>
      </div>
      {percInsights.length > 0 && <div className="industrial-card"><span className="label-caps text-[10px]">Percepción vs realidad</span><p className="text-xs text-muted-foreground mt-1">Diferencias ≥ 10 pp entre cómo cree que pasó su día y lo observado</p><ul className="mt-3 space-y-2 text-sm">{percInsights.map((i, k) => <li key={k}>• ⚡ {i}</li>)}</ul></div>}
      {idealInsights.length > 0 && <div className="industrial-card"><span className="label-caps text-[10px]">Brechas vs cómo le gustaría</span><p className="text-xs text-muted-foreground mt-1">Diferencias ≥ 10 pp entre lo observado y la distribución deseada</p><ul className="mt-3 space-y-2 text-sm">{idealInsights.map((i, k) => <li key={k}>• 🎯 {i}</li>)}</ul></div>}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={exportCSV} className="press-in flex-1" variant="outline"><FileDown className="h-4 w-4 mr-2" /> CSV actividades</Button>
        <Button onClick={exportCuadros} className="press-in flex-1" variant="outline"><FileDown className="h-4 w-4 mr-2" /> CSV cuadros 10 min (formato EO)</Button>
        <Button onClick={exportJSON} className="press-in flex-1" variant="outline"><FileDown className="h-4 w-4 mr-2" /> JSON</Button>
      </div>
    </div>
  );
}
