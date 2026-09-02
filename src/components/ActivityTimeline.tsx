import { useState } from "react";
import { ALL_CATEGORIES, CATEGORY_LABELS, CHART_COLORS, badgeStyle, type ActivityCategory } from "@/types/study";
import { updateActivity as updateActivityApi, deleteActivity as deleteActivityApi } from "@/lib/api";
import type { ActivityRow } from "@/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return `${m}m${s > 0 ? ` ${s}s` : ""}`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
const toSec = (t: string) => { const [h, m, s] = t.split(":").map(Number); return h * 3600 + m * 60 + (s || 0); };

export default function ActivityTimeline({ activities, onRefresh }: { activities: ActivityRow[]; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [f, setF] = useState({ description: "", category: "", startTime: "", endTime: "" });

  if (activities.length === 0) return (
    <div className="industrial-card text-center py-16">
      <div className="text-4xl mb-3">⏱</div>
      <p className="text-sm text-muted-foreground">No hay actividades registradas aún.</p>
      <p className="text-xs text-muted-foreground mt-1">Usa "Iniciar actividad" para comenzar</p>
    </div>
  );
  const startEdit = (a: ActivityRow) => { setEditingId(a.id); setF({ description: a.description, category: a.category || "", startTime: a.start_time, endTime: a.end_time || "" }); };
  const saveEdit = async (id: string) => {
    try { const s = toSec(f.startTime), e = f.endTime ? toSec(f.endTime) : s;
      await updateActivityApi(id, { description: f.description, category: (f.category || null) as ActivityCategory | null, start_time: f.startTime, end_time: f.endTime || null, duration_seconds: Math.max(0, e - s) });
      setEditingId(null); onRefresh(); }
    catch { toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" }); }
  };
  const del = async (id: string) => { try { await deleteActivityApi(id); onRefresh(); } catch { toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" }); } };
  const cols = "sm:grid-cols-[110px_1fr_170px_80px_80px]";

  return (
    <div className="industrial-card p-0 overflow-hidden">
      <div className={`hidden sm:grid ${cols} gap-2 px-4 py-2 border-b bg-muted`}>
        {["Horario", "Descripción", "Clasificación", "Duración", "Acciones"].map(h => <span key={h} className="label-caps text-[10px]">{h}</span>)}
      </div>
      <AnimatePresence>
        {activities.map(a => {
          const cat = a.category; const isEditing = editingId === a.id;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
              className="border-b border-l-4 hover:bg-muted/50 transition-colors" style={{ borderLeftColor: cat ? CHART_COLORS[cat] : "hsl(var(--border))" }}>
              {isEditing ? (
                <div className={`grid grid-cols-1 ${cols} gap-2 px-4 py-3 items-center`}>
                  <div className="flex sm:flex-col gap-1"><Input value={f.startTime} onChange={e => setF(x => ({ ...x, startTime: e.target.value }))} className="h-7 text-xs font-mono" /><Input value={f.endTime} onChange={e => setF(x => ({ ...x, endTime: e.target.value }))} className="h-7 text-xs font-mono" /></div>
                  <Input value={f.description} onChange={e => setF(x => ({ ...x, description: e.target.value }))} className="h-7 text-sm" />
                  <Select value={f.category} onValueChange={v => setF(x => ({ ...x, category: v }))}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{ALL_CATEGORIES.map(k => <SelectItem key={k} value={k}>{CATEGORY_LABELS[k]}</SelectItem>)}</SelectContent>
                  </Select>
                  <span className="data-text text-muted-foreground hidden sm:block">—</span>
                  <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(a.id)}><Check className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button></div>
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${cols} gap-1 sm:gap-2 px-4 py-3 items-center`}>
                  <span className="font-mono text-sm text-muted-foreground">{a.start_time.slice(0, 5)}{a.end_time ? ` – ${a.end_time.slice(0, 5)}` : ""}</span>
                  <span className="text-sm font-medium truncate">{a.description}</span>
                  <div>{cat && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={badgeStyle(cat)}>{CATEGORY_LABELS[cat]}</span>}</div>
                  <span className="data-text text-muted-foreground">{formatDuration(a.duration_seconds)}</span>
                  <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div className="px-4 py-2 bg-muted text-xs text-muted-foreground">{activities.length} actividad{activities.length !== 1 ? "es" : ""} · {formatDuration(activities.reduce((s, a) => s + a.duration_seconds, 0))}</div>
    </div>
  );
}
