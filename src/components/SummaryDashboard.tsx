import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchStudies, fetchAllActivities, fetchAllPerceptions } from "@/lib/api";
import { ALL_CATEGORIES, CATEGORY_LABELS, CATEGORY_SHORT, CHART_COLORS, type StudyRow, type ActivityRow, type PerceptionRow, type ActivityCategory } from "@/types/study";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RefreshCw, FileDown, Table2, BarChart3 } from "lucide-react";
import ProfessionalPie from "./ProfessionalPie";
import { formatTime } from "./AnalysisPanel";
import { toast } from "@/hooks/use-toast";

const ALL = "__all__";
type GroupKey = "frente" | "position" | "created_by" | "sede" | "semana" | "study";
const GROUPS: Record<GroupKey, string> = { frente: "Frente", position: "Puesto", created_by: "Consultor", sede: "Sede", semana: "Semana", study: "Estudio" };

export default function SummaryDashboard() {
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [percs, setPercs] = useState<PerceptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ frente: ALL, position: ALL, created_by: ALL, sede: ALL, semana: ALL, study: ALL });
  const [group, setGroup] = useState<GroupKey>("frente");
  const [table, setTable] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const [s, a, p] = await Promise.all([fetchStudies(), fetchAllActivities(), fetchAllPerceptions()]); setStudies(s); setActs(a); setPercs(p); }
    catch (e) { toast({ title: "Error", description: (e as Error).message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const withData = useMemo(() => studies.filter(s => acts.some(a => a.study_id === s.id)), [studies, acts]);
  const rows = useMemo(() => withData.filter(s =>
    (f.frente === ALL || s.frente === f.frente) && (f.position === ALL || s.position === f.position) && (f.created_by === ALL || s.created_by === f.created_by) &&
    (f.sede === ALL || (s.sede || "") === f.sede) && (f.semana === ALL || (s.semana || "") === f.semana) && (f.study === ALL || s.id === f.study)), [withData, f]);
  const uniq = (k: keyof StudyRow) => [...new Set(withData.map(s => String(s[k] ?? "")).filter(Boolean))];

  const secsOf = (ids: Set<string>) => { const by = Object.fromEntries(ALL_CATEGORIES.map(c => [c, 0])) as Record<ActivityCategory, number>; let t = 0; acts.forEach(a => { if (ids.has(a.study_id) && a.category) { by[a.category] += a.duration_seconds; t += a.duration_seconds; } }); return { by, t }; };
  const all = secsOf(new Set(rows.map(r => r.id)));
  const pct = (c: ActivityCategory, by = all.by, t = all.t) => t ? by[c] / t * 100 : 0;
  const productive = pct("supervision_active") + pct("training") + pct("operative"), idle = pct("supervision_passive") + pct("unproductive");

  const groups = useMemo(() => {
    const m: Record<string, StudyRow[]> = {};
    rows.forEach(s => { const k = group === "study" ? `${s.position}${s.collaborator_name ? " · " + s.collaborator_name : ""}` : String(s[group] || `Sin ${GROUPS[group].toLowerCase()}`); (m[k] = m[k] || []).push(s); });
    return Object.entries(m).map(([k, ss]) => { const { by, t } = secsOf(new Set(ss.map(s => s.id))); const row: Record<string, number | string> = { name: k, n: ss.length, t }; ALL_CATEGORIES.forEach(c => (row[c] = t ? +(by[c] / t * 100).toFixed(1) : 0)); return row; }).sort((a, b) => (b.t as number) - (a.t as number));
  }, [rows, group, acts]);

  const perception = (type: "actual" | "ideal") => { const acc = Object.fromEntries(ALL_CATEGORIES.map(c => [c, 0])) as Record<ActivityCategory, number>; let n = 0; rows.forEach(s => { const p = percs.find(x => x.study_id === s.id && x.perception_type === type); if (!p) return; const w = secsOf(new Set([s.id])).t || 1; n += w; ALL_CATEGORIES.forEach(c => (acc[c] += (p[c] || 0) * w)); }); return n ? Object.fromEntries(ALL_CATEGORIES.map(c => [c, acc[c] / n])) as Record<ActivityCategory, number> : null; };
  const cree = perception("actual"), ideal = perception("ideal");

  const exportCSV = async () => {
    const head = "plan_id,frente,sede,puesto,persona,consultor,semana,fecha,hora_inicio,hora_fin,duracion_s,codigo,categoria,descripcion";
    const lines = rows.flatMap(s => acts.filter(a => a.study_id === s.id).map(a => [s.plan_id, s.frente, s.sede, s.position, s.collaborator_name, s.created_by, s.semana, s.study_date, a.start_time, a.end_time, a.duration_seconds, a.category ? ALL_CATEGORIES.indexOf(a.category) + 1 : "", a.category ? CATEGORY_LABELS[a.category] : "", a.description].map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")));
    const csv = [head, ...lines].join("\n");
    try { const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const el = document.createElement("a"); el.href = url; el.download = "EO_base_ARclad.csv"; el.click(); URL.revokeObjectURL(url); } catch { /* ignore */ }
    try { await navigator.clipboard.writeText(csv); toast({ title: "Base copiada al portapapeles", description: `${lines.length} actividades` }); } catch { /* ignore */ }
  };

  const Sel = ({ k, label, opts, fmt }: { k: keyof typeof f; label: string; opts: string[]; fmt?: (v: string) => string }) => (
    <div className="space-y-1 min-w-[150px]"><Label className="label-caps text-[10px]">{label}</Label>
      <Select value={f[k]} onValueChange={v => setF(x => ({ ...x, [k]: v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value={ALL}>Todos</SelectItem>{opts.map(o => <SelectItem key={o} value={o}>{fmt ? fmt(o) : o}</SelectItem>)}</SelectContent></Select></div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div><span className="label-caps text-[10px]">Módulo 3</span><h1 className="display-text text-2xl">Resumen</h1><p className="text-sm text-muted-foreground mt-1">Todo lo capturado, agrupable por frente, puesto, consultor, sede o semana.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="press-in"><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Actualizar</Button>
          <Button variant={table ? "default" : "outline"} size="sm" onClick={() => setTable(t => !t)} className="press-in">{table ? <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> : <Table2 className="h-3.5 w-3.5 mr-1.5" />}{table ? "Ver gráfica" : "Ver tabla"}</Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="press-in"><FileDown className="h-3.5 w-3.5 mr-1.5" /> Base CSV</Button>
        </div>
      </div>

      <div className="industrial-card flex flex-wrap gap-3 items-end">
        <Sel k="frente" label="Frente" opts={uniq("frente")} />
        <Sel k="position" label="Puesto" opts={uniq("position")} />
        <Sel k="created_by" label="Consultor" opts={uniq("created_by")} />
        <Sel k="sede" label="Sede" opts={uniq("sede")} />
        <Sel k="semana" label="Semana" opts={uniq("semana")} />
        <Sel k="study" label="Estudio" opts={withData.map(s => s.id)} fmt={id => { const s = withData.find(x => x.id === id)!; return `${s.position}${s.collaborator_name ? " · " + s.collaborator_name : ""}`; }} />
        <div className="space-y-1 min-w-[150px] ml-auto"><Label className="label-caps text-[10px]">Agrupar por</Label>
          <Select value={group} onValueChange={v => setGroup(v as GroupKey)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(GROUPS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
        <Button variant="ghost" size="sm" onClick={() => setF({ frente: ALL, position: ALL, created_by: ALL, sede: ALL, semana: ALL, study: ALL })}>Limpiar</Button>
      </div>

      {loading ? <div className="industrial-card animate-pulse h-40" /> : rows.length === 0 ? (
        <div className="industrial-card text-center py-16"><div className="text-4xl mb-3">📊</div><p className="text-sm text-muted-foreground">{withData.length ? "Ningún estudio coincide con el filtro." : "Todavía no hay actividades capturadas."}</p>{!withData.length && <Link to="/studies" className="text-xs text-accent underline mt-2 inline-block">Ir a Llenado</Link>}</div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[["Estudios", String(rows.length)], ["Tiempo observado", formatTime(all.t)], ["Productivo", `${productive.toFixed(0)}%`], ["Pasiva + improd.", `${idle.toFixed(0)}%`], ["Administrativo", `${pct("administrative").toFixed(0)}%`]].map(([l, v]) => (
              <div key={l} className="industrial-card text-center py-4"><span className="label-caps text-[10px]">{l}</span><p className={`text-2xl font-mono font-semibold mt-1 ${l.startsWith("Pasiva") && idle > 20 ? "text-destructive" : "text-primary"}`}>{v}</p></div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="industrial-card">
              <span className="label-caps text-[10px]">Contenido de trabajo por {GROUPS[group].toLowerCase()} · 100% apilado</span>
              {table ? (
                <div className="overflow-x-auto mt-3"><table className="w-full text-xs"><thead><tr className="border-b">{["Grupo", "Est.", "Tiempo", ...ALL_CATEGORIES.map(c => CATEGORY_SHORT[c])].map(h => <th key={h} className="label-caps text-[10px] text-left py-2 pr-3 whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{groups.map(g => <tr key={g.name as string} className="border-b border-border/50"><td className="py-2 pr-3 font-medium">{g.name}</td><td className="font-mono">{g.n}</td><td className="font-mono">{formatTime(g.t as number)}</td>{ALL_CATEGORIES.map(c => <td key={c} className="font-mono pr-3">{(g[c] as number).toFixed(1)}%</td>)}</tr>)}</tbody></table></div>
              ) : (
                <div className="mt-3" style={{ height: Math.max(220, groups.length * 44 + 60) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groups} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={10}>
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v: number, n: string) => [`${v}%`, CATEGORY_LABELS[n as ActivityCategory]]} contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
                      <Legend formatter={(v: string) => CATEGORY_SHORT[v as ActivityCategory]} wrapperStyle={{ fontSize: 11 }} />
                      {ALL_CATEGORIES.map(c => <Bar key={c} dataKey={c} stackId="a" fill={CHART_COLORS[c]} stroke="hsl(var(--card))" strokeWidth={1} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="industrial-card">
              <span className="label-caps text-[10px]">Día observado · total del corte</span>
              <ProfessionalPie data={ALL_CATEGORIES.filter(c => all.by[c] > 0).map(c => ({ name: CATEGORY_SHORT[c], value: all.by[c], color: CHART_COLORS[c] }))} tooltipFormatter={formatTime} height={300} />
              <div className="space-y-1 mt-2">{ALL_CATEGORIES.map(c => <div key={c} className="flex items-center gap-2 text-xs py-1 border-b border-border/50"><span className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS[c] }} /><span className="flex-1 truncate">{CATEGORY_LABELS[c]}</span><span className="font-mono text-muted-foreground">{formatTime(all.by[c])}</span><span className="font-mono font-semibold w-12 text-right">{pct(c).toFixed(1)}%</span></div>)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="industrial-card">
              <span className="label-caps text-[10px]">Observado vs cómo cree vs cómo le gustaría</span>
              {!cree && !ideal ? <p className="text-sm text-muted-foreground mt-4">Aparece cuando se capturan las percepciones en la pestaña Análisis de cada estudio.</p> : (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-4 text-[11px] text-muted-foreground"><span><i className="inline-block w-4 h-2 rounded-sm bg-primary mr-1 align-middle" />Observado</span><span><i className="inline-block w-4 h-2 rounded-sm bg-primary/40 mr-1 align-middle" />Cómo cree</span><span><i className="inline-block w-4 h-2 rounded-sm border border-primary mr-1 align-middle" />Cómo le gustaría</span></div>
                  {ALL_CATEGORIES.map(c => { const o = pct(c), cr = cree?.[c] ?? 0, id = ideal?.[c] ?? 0; const w = (v: number) => `${Math.min(100, v / 60 * 100)}%`; return (
                    <div key={c} className="grid grid-cols-[140px_1fr] gap-3 items-center">
                      <span className="text-xs font-medium flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS[c] }} />{CATEGORY_SHORT[c]}</span>
                      <div><div className="space-y-0.5"><div className="h-1.5 rounded bg-muted"><div className="h-full rounded" style={{ width: w(o), background: CHART_COLORS[c] }} /></div>{cree && <div className="h-1.5 rounded bg-muted"><div className="h-full rounded opacity-40" style={{ width: w(cr), background: CHART_COLORS[c] }} /></div>}{ideal && <div className="h-1.5 rounded bg-muted"><div className="h-full rounded border" style={{ width: w(id), borderColor: CHART_COLORS[c] }} /></div>}</div>
                        <div className="flex gap-3 text-[10px] font-mono text-muted-foreground mt-0.5"><span>obs {o.toFixed(0)}%</span>{cree && <span>cree {cr.toFixed(0)}%</span>}{ideal && <span>ideal {id.toFixed(0)}%</span>}{ideal && <span className={`ml-auto font-semibold ${id - o >= 0 ? "text-accent" : "text-destructive"}`}>brecha {id - o >= 0 ? "+" : ""}{(id - o).toFixed(0)} pp</span>}</div></div>
                    </div>); })}
                </div>
              )}
            </div>
            <div className="industrial-card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b"><span className="label-caps text-[10px]">Estudios del corte</span></div>
              <div className="max-h-[420px] overflow-auto">
                {rows.map(s => { const { by, t } = secsOf(new Set([s.id])); const id = t ? (by.supervision_passive + by.unproductive) / t * 100 : 0; return (
                  <Link key={s.id} to={`/study/${s.id}`} className="grid grid-cols-[1fr_120px_60px] gap-3 items-center px-4 py-2.5 border-b border-border/50 hover:bg-muted/40">
                    <div className="min-w-0"><p className="text-sm font-medium truncate">{s.position}</p><p className="text-[11px] text-muted-foreground truncate">{s.collaborator_name || "—"} · {s.created_by} · {s.semana || ""}</p></div>
                    <div className="flex h-2.5 gap-px rounded overflow-hidden bg-muted">{ALL_CATEGORIES.map(c => t && by[c] > 0 && <span key={c} style={{ width: `${by[c] / t * 100}%`, background: CHART_COLORS[c] }} />)}</div>
                    <span className={`text-xs font-mono font-semibold text-right ${id > 20 ? "text-destructive" : ""}`}>{id.toFixed(0)}%</span>
                  </Link>); })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
