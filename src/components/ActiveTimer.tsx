import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL_CATEGORIES, CATEGORY_LABELS, CHART_COLORS, type ActivityCategory } from "@/types/study";
import { createActivity } from "@/lib/api";
import { addToQueue, useOnlineStatus } from "@/hooks/use-offline-sync";
import { toast } from "@/hooks/use-toast";
import { Wifi, WifiOff } from "lucide-react";

function formatElapsed(ms: number): string {
  const t = Math.floor(ms / 1000);
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map(x => String(x).padStart(2, "0")).join(":");
}
const hms = (d: Date) => [d.getHours(), d.getMinutes(), d.getSeconds()].map(x => String(x).padStart(2, "0")).join(":");

interface Props { studyId: string; activityCount: number; onActivityAdded: () => void; }

export default function ActiveTimer({ studyId, activityCount, onActivityAdded }: Props) {
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ActivityCategory | "">("");
  const [saving, setSaving] = useState(false);
  const online = useOnlineStatus();

  useEffect(() => { if (!timerStart) { setElapsed(0); return; } const id = setInterval(() => setElapsed(Date.now() - timerStart), 100); return () => clearInterval(id); }, [timerStart]);

  const reset = () => { setDescription(""); setCategory(""); setTimerStart(null); onActivityAdded(); };
  const handleStart = () => setTimerStart(Date.now());
  /** Finalizar guarda la actividad y arranca la siguiente de inmediato (en piso no hay huecos). */
  const handleStop = async (continueNext: boolean) => {
    if (!category || !timerStart) return;
    setSaving(true);
    const start = new Date(timerStart), end = new Date();
    const data = { study_id: studyId, start_time: hms(start), end_time: hms(end), duration_seconds: Math.round((end.getTime() - start.getTime()) / 1000), description: description || CATEGORY_LABELS[category], category, sort_order: activityCount };
    try { if (!online) throw new Error("offline"); await createActivity(data); }
    catch { addToQueue(data); toast({ title: "Guardado offline", description: "Se sincroniza al recuperar conexión." }); }
    finally { reset(); setSaving(false); if (continueNext) setTimerStart(Date.now()); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!timerStart) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = parseInt(e.key); if (n >= 1 && n <= 7) setCategory(ALL_CATEGORIES[n - 1]);
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [timerStart]);

  const Badge = () => (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${online ? "bg-mint/20 text-mint" : "bg-destructive/30 text-white"}`}>
      {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}{online ? "En línea" : "Sin conexión"}
    </span>
  );

  if (!timerStart) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-timer text-timer-foreground p-6 rounded-lg">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-widest text-timer-muted">Sin actividad</span><Badge /></div>
          <p className="text-sm text-timer-muted">Presiona iniciar. En teclado, 1 a 7 clasifica la actividad.</p>
        </div>
        <Button onClick={handleStart} className="press-in bg-mint text-primary hover:bg-mint/90 h-12 px-8 font-bold shrink-0">Iniciar actividad</Button>
      </div>
    </motion.div>
  );

  return (
    <motion.div layoutId="active-timer" className="bg-timer text-timer-foreground p-5 sm:p-6 rounded-lg space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-timer-muted">Actividad en curso</span>
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block w-2 h-2 rounded-full bg-mint" />
            <Badge />
          </div>
          <span className="text-xs text-timer-muted">{category ? CATEGORY_LABELS[category] : "Elige una categoría"}</span>
        </div>
        <div className="text-5xl font-mono tracking-tighter text-mint">{formatElapsed(elapsed)}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ALL_CATEGORIES.map((c, i) => (
          <button key={c} onClick={() => setCategory(c)} className={`press-in flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-semibold border transition-colors ${category === c ? "bg-white text-primary border-white" : "bg-white/5 border-white/15 text-white hover:bg-white/10"}`}>
            <span className="h-5 w-5 rounded grid place-items-center text-[10px] font-mono text-white shrink-0" style={{ background: CHART_COLORS[c] }}>{i + 1}</span>
            <span className="truncate">{CATEGORY_LABELS[c]}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Qué está haciendo (opcional)" className="flex-1 min-w-[200px] bg-white/10 border-white/20 text-white placeholder:text-timer-muted" autoFocus />
        <Button onClick={() => handleStop(true)} disabled={!category || saving} className="press-in bg-mint text-primary hover:bg-mint/90 h-10 px-5 font-bold">{saving ? "Guardando..." : "Siguiente actividad"}</Button>
        <Button onClick={() => handleStop(false)} disabled={!category || saving} variant="outline" className="press-in h-10 px-4 border-white/30 bg-transparent text-white hover:bg-white/10">Finalizar</Button>
      </div>
    </motion.div>
  );
}
