import { useState, useCallback, useEffect, useRef } from "react";
import { ALL_CATEGORIES, CATEGORY_LABELS, CHART_COLORS, type ActivityCategory, type PerceptionType } from "@/types/study";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";
import { fetchPerception, upsertPerception } from "@/lib/api";
import ProfessionalPie from "./ProfessionalPie";

interface Props { title: string; subtitle: string; perceptionType: PerceptionType; studyId: string; }
const zero = () => Object.fromEntries(ALL_CATEGORIES.map(c => [c, 0])) as Record<ActivityCategory, number>;

export default function PerceptionPieSection({ title, subtitle, perceptionType, studyId }: Props) {
  const [values, setValues] = useState<Record<ActivityCategory, number>>(zero);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchPerception(studyId, perceptionType).then(row => { if (row) { const v = zero(); ALL_CATEGORIES.forEach(c => { if (typeof row[c] === "number") v[c] = row[c]; }); setValues(v); } }).catch(() => {}).finally(() => setLoaded(true));
  }, [studyId, perceptionType]);

  const handleChange = useCallback((c: ActivityCategory, raw: string) => { const n = Math.max(0, Math.min(100, Number(raw) || 0)); setValues(p => ({ ...p, [c]: n })); setDirty(true); setSaved(false); }, []);
  const handleSave = useCallback(async () => {
    setSaving(true);
    try { await upsertPerception(studyId, perceptionType, values); setDirty(false); setSaved(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSaved(false), 2500); }
    catch { localStorage.setItem(`${perceptionType}_${studyId}`, JSON.stringify(values)); }
    finally { setSaving(false); }
  }, [studyId, perceptionType, values]);

  const total = Object.values(values).reduce((s, v) => s + v, 0);
  const chartData = ALL_CATEGORIES.filter(c => values[c] > 0).map(c => ({ name: CATEGORY_LABELS[c], value: values[c], color: CHART_COLORS[c] }));
  if (!loaded) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{subtitle}</p></div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving || total !== 100} className="gap-1.5" variant={saved ? "outline" : "default"}>
          {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}
        </Button>
      </div>
      <div className="industrial-card">
        <ProfessionalPie data={chartData} tooltipFormatter={(v: number) => `${v}%`} height={320} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-4">
          {ALL_CATEGORIES.map(c => (
            <div key={c} className="flex items-center gap-2 py-1.5 border-b border-border/50">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[c] }} />
              <span className="text-sm truncate flex-1">{CATEGORY_LABELS[c]}</span>
              <Input type="number" min={0} max={100} value={values[c] || ""} onChange={e => handleChange(c, e.target.value)} className="h-7 w-16 text-xs text-right font-mono px-2" placeholder="0" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t"><span className="text-xs font-semibold">Total</span><span className={`text-xs font-mono font-semibold ${total !== 100 && total > 0 ? "text-destructive" : ""}`}>{total}%</span></div>
        {total > 0 && total !== 100 && <div className="text-[11px] text-destructive mt-1">El total debe sumar 100% para poder guardar</div>}
      </div>
    </div>
  );
}
