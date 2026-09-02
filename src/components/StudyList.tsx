import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchStudies, deleteStudy, fetchAllActivities } from "@/lib/api";
import type { StudyRow, ActivityRow } from "@/types/study";
import { ALL_CATEGORIES, CHART_COLORS, CATEGORY_LABELS } from "@/types/study";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowRight, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS: Record<string, [string, string]> = { active: ["bg-accent/10 text-accent", "En captura"], completed: ["bg-primary text-primary-foreground", "Cerrado"], archived: ["bg-muted text-muted-foreground", "Archivado"] };

export default function StudyList() {
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { const [s, a] = await Promise.all([fetchStudies(), fetchAllActivities()]); setStudies(s); setActs(a); }
    catch (e) { toast({ title: "Error", description: (e as Error).message || "No se pudieron cargar los estudios.", variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el estudio "${name}" y sus actividades?`)) return;
    try { await deleteStudy(id); setStudies(s => s.filter(x => x.id !== id)); toast({ title: "Eliminado" }); }
    catch { toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" }); }
  };
  const secsBy = (id: string) => { const a = acts.filter(x => x.study_id === id); const t = a.reduce((s, x) => s + x.duration_seconds, 0); return { t, sh: ALL_CATEGORIES.map(c => t ? a.filter(x => x.category === c).reduce((s, x) => s + x.duration_seconds, 0) / t * 100 : 0) }; };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <span className="label-caps text-[10px]">Módulo 2</span>
          <h1 className="display-text text-2xl">Llenado</h1>
          <p className="text-sm text-muted-foreground mt-1">Elige el estudio para capturar. El avance muestra cómo va cada uno.</p>
        </div>
        <Link to="/new"><Button className="press-in h-10 px-5 font-semibold"><Plus className="h-4 w-4 mr-2" /> Nuevo</Button></Link>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="industrial-card animate-pulse h-20" />)}</div>
      ) : studies.length === 0 ? (
        <div className="industrial-card text-center py-20">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">Sin estudios</h2>
          <p className="text-sm text-muted-foreground mb-6">Registra el primero en el módulo 1</p>
          <Link to="/new"><Button className="press-in"><Plus className="h-4 w-4 mr-2" /> Registrar estudio</Button></Link>
        </div>
      ) : (
        <div className="space-y-2">
          {studies.map((s, i) => { const { t, sh } = secsBy(s.id); const st = STATUS[s.status] ?? STATUS.active; return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.2 }} className="industrial-card flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors">
              <Link to={`/study/${s.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {s.plan_id && <span className="font-mono text-[10px] text-muted-foreground">{s.plan_id}</span>}
                  <h3 className="font-semibold text-sm truncate">{s.position}</h3>
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.collaborator_name || "persona por definir"} · {s.frente}{s.sede ? ` · ${s.sede}` : ""}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex h-2 w-40 gap-px rounded overflow-hidden bg-muted">{sh.map((p, k) => p > 0 && <span key={k} style={{ width: `${p}%`, background: CHART_COLORS[ALL_CATEGORIES[k]] }} title={`${CATEGORY_LABELS[ALL_CATEGORIES[k]]} ${p.toFixed(0)}%`} />)}</div>
                  <span className="data-text text-[11px] text-muted-foreground">{t ? `${(t / 3600).toFixed(1)} h` : "sin actividades"}</span>
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <span className="data-text text-xs text-muted-foreground hidden sm:block">{s.created_by} · {s.semana || ""} {s.study_date || ""}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${st[0]}`}>{st[1]}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id, s.position)}><Trash2 className="h-3.5 w-3.5" /></Button>
                <Link to={`/study/${s.id}`}><Button variant="ghost" size="icon" className="h-7 w-7"><ArrowRight className="h-3.5 w-3.5" /></Button></Link>
              </div>
            </motion.div>); })}
        </div>
      )}
    </div>
  );
}
