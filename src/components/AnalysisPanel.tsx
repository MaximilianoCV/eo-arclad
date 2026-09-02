import { useMemo } from "react";
import { ALL_CATEGORIES, CATEGORY_LABELS, CHART_COLORS, type ActivityRow } from "@/types/study";
import { AlertTriangle, TrendingUp, Clock, Activity } from "lucide-react";
import PerceptionPieSection from "./PerceptionPieSection";
import ProfessionalPie from "./ProfessionalPie";

export const formatTime = (sec: number) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

export default function AnalysisPanel({ activities, studyId }: { activities: ActivityRow[]; studyId: string }) {
  const stats = useMemo(() => {
    if (activities.length === 0) return null;
    const by: Record<string, number> = {}; let total = 0;
    activities.forEach(a => { if (!a.category) return; by[a.category] = (by[a.category] || 0) + a.duration_seconds; total += a.duration_seconds; });
    const pct = (c: string) => (by[c] || 0) / Math.max(total, 1) * 100;
    const chartData = ALL_CATEGORIES.filter(c => by[c]).map(c => ({ name: CATEGORY_LABELS[c], value: by[c], percentage: pct(c), color: CHART_COLORS[c] }));
    const productive = pct("supervision_active") + pct("training") + pct("operative");
    const idle = pct("supervision_passive") + pct("unproductive");
    return { chartData, total, n: activities.length, productive, idle, admin: pct("administrative"),
      alerts: [...(idle > 20 ? [`Pasiva + improductivo en ${idle.toFixed(1)}% (umbral: 20%)`] : []), ...(pct("administrative") > 40 ? [`Tiempo administrativo en ${pct("administrative").toFixed(1)}% (umbral: 40%)`] : [])] };
  }, [activities]);

  if (!stats) return <div className="industrial-card text-center py-16"><div className="text-4xl mb-3">📊</div><p className="text-sm text-muted-foreground">Registra actividades para ver el análisis</p></div>;

  const kpis = [
    { label: "Tiempo total", value: formatTime(stats.total), icon: Clock },
    { label: "Actividades", value: String(stats.n), icon: Activity },
    { label: "Productivo", value: `${stats.productive.toFixed(1)}%`, icon: TrendingUp },
    { label: "Pasiva + improd.", value: `${stats.idle.toFixed(1)}%`, icon: AlertTriangle },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => <div key={k.label} className="industrial-card text-center py-4"><k.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" /><span className="label-caps text-[10px]">{k.label}</span><p className="text-2xl font-mono font-semibold mt-1 text-primary">{k.value}</p></div>)}
      </div>
      {stats.alerts.length > 0 && <div className="space-y-2">{stats.alerts.map((a, i) => <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20"><AlertTriangle className="h-4 w-4 text-destructive shrink-0" /><span className="text-sm font-medium text-destructive">{a}</span></div>)}</div>}
      <div className="industrial-card">
        <span className="label-caps text-[10px]">Día observado · distribución de tiempo</span>
        <div className="mt-4"><ProfessionalPie data={stats.chartData} tooltipFormatter={formatTime} height={360} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-4">
          {[...stats.chartData].sort((a, b) => b.value - a.value).map(d => (
            <div key={d.name} className="flex items-center gap-2 py-1.5 border-b border-border/50">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} /><span className="text-sm truncate flex-1">{d.name}</span>
              <span className="text-xs font-mono text-muted-foreground">{formatTime(d.value)}</span><span className="text-xs font-mono font-semibold w-12 text-right">{d.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      <PerceptionPieSection title="¿Cómo cree que pasó su día?" subtitle="Pregúntale al observado y captura en porcentaje" perceptionType="actual" studyId={studyId} />
      <PerceptionPieSection title="¿Cómo le gustaría que fuera su día?" subtitle="La distribución ideal según el observado" perceptionType="ideal" studyId={studyId} />
    </div>
  );
}
