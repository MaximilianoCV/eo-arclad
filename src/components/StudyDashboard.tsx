import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchStudy, fetchActivities, updateStudyStatus } from "@/lib/api";
import type { StudyRow, ActivityRow } from "@/types/study";
import { useOfflineSync, useOnlineStatus } from "@/hooks/use-offline-sync";
import ActiveTimer from "./ActiveTimer";
import ActivityTimeline from "./ActivityTimeline";
import AnalysisPanel from "./AnalysisPanel";
import ReportPanel from "./ReportPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CloudOff, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Tab = "timeline" | "analysis" | "report";
const tabs: { key: Tab; label: string }[] = [{ key: "timeline", label: "Timeline" }, { key: "analysis", label: "Análisis" }, { key: "report", label: "Reporte" }];

export default function StudyDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<StudyRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const online = useOnlineStatus();

  const loadData = useCallback(async () => {
    if (!id) return;
    try { const [s, a] = await Promise.all([fetchStudy(id), fetchActivities(id)]); setStudy(s); setActivities(a); }
    catch { if (!navigator.onLine && study) return; navigate("/studies"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);
  useEffect(() => { loadData(); }, [loadData]);
  const { pendingCount } = useOfflineSync(loadData);

  const toggleStatus = async () => {
    if (!study) return;
    const next = study.status === "completed" ? "active" : "completed";
    try { await updateStudyStatus(study.id, next); setStudy({ ...study, status: next }); toast({ title: next === "completed" ? "Estudio cerrado" : "Estudio reabierto" }); if (next === "completed") setActiveTab("report"); }
    catch (e) { toast({ title: "Error", description: (e as Error).message, variant: "destructive" }); }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-6 space-y-4"><Skeleton className="h-24 w-full rounded-lg" /><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!study) return null;
  const closed = study.status === "completed";

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {(!online || pendingCount > 0) && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 text-sm">
          <CloudOff className="h-4 w-4 shrink-0" />
          {!online ? `Sin conexión — ${pendingCount} actividad(es) pendiente(s) de sincronizar` : `Sincronizando ${pendingCount} actividad(es) pendiente(s)...`}
        </motion.div>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="label-caps text-[10px]">{study.plan_id ? `${study.plan_id} · ` : ""}{study.frente}</span>
          <h1 className="display-text">{study.position}{study.collaborator_name ? ` / ${study.collaborator_name}` : ""}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{study.created_by} · {study.semana || ""} {study.study_date || ""}{study.sede ? ` · ${study.sede}` : ""}</p>
          {study.objective && <p className="text-xs text-muted-foreground mt-1 max-w-2xl">Objetivo: {study.objective}</p>}
        </div>
        <Button variant={closed ? "outline" : "default"} size="sm" onClick={toggleStatus} className="press-in">
          {closed ? <><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reabrir</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Cerrar estudio</>}
        </Button>
      </div>

      {!closed && <ActiveTimer studyId={study.id} activityCount={activities.length} onActivityAdded={loadData} />}

      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {activeTab === t.key && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint" transition={{ type: "spring" as const, duration: 0.2, bounce: 0 }} />}
          </button>
        ))}
      </div>
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {activeTab === "timeline" && <ActivityTimeline activities={activities} onRefresh={loadData} />}
        {activeTab === "analysis" && <AnalysisPanel activities={activities} studyId={study.id} />}
        {activeTab === "report" && <ReportPanel study={study} activities={activities} />}
      </motion.div>
    </div>
  );
}
