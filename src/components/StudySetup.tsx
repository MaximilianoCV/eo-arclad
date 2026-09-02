import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DEFAULT_OBJECTIVE } from "@/types/study";
import { createStudy } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CONSULTORES, FRENTES, SEDES, SEMANAS, PLAN_EO } from "@/data/plan";

const NONE = "__none__";

export default function StudySetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    plan_id: "", frente: "", sede: "", position: "", collaborator_name: "",
    created_by: localStorage.getItem("eo.who") || "", study_date: new Date().toISOString().slice(0, 10), semana: "", objective: DEFAULT_OBJECTIVE,
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  /** Al elegir un EO del Plan de Vuelo se llenan frente, puesto, consultor, semana y objetivo. */
  const applyPlan = (planId: string) => {
    if (planId === NONE) { set("plan_id", ""); return; }
    const p = PLAN_EO.find(x => x.plan_id === planId); if (!p) return;
    setForm(f => ({ ...f, plan_id: p.plan_id, frente: p.frente, position: p.puesto, created_by: p.consultor, semana: p.semana, objective: p.objetivo || f.objective }));
  };

  const canSubmit = form.frente && form.position && form.created_by;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canSubmit) return; setLoading(true);
    try {
      localStorage.setItem("eo.who", form.created_by);
      const study = await createStudy({
        plan_id: form.plan_id || null, frente: form.frente, sede: form.sede || null, position: form.position, collaborator_name: form.collaborator_name,
        created_by: form.created_by, study_date: form.study_date || null, semana: form.semana || null, objective: form.objective,
      });
      toast({ title: "Estudio registrado", description: `${form.position} · ${form.created_by}` });
      navigate(`/study/${study.id}`);
    } catch (err) { toast({ title: "Error", description: (err as Error).message || "No se pudo crear el estudio.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring" as const, duration: 0.3, bounce: 0 }} className="w-full max-w-2xl">
        <div className="mb-8">
          <span className="label-caps text-[10px]">Módulo 1</span>
          <h1 className="display-text text-2xl">Registro de estudio</h1>
          <p className="text-sm text-muted-foreground mt-1">Se captura una sola vez. Elige un EO del Plan de Vuelo o llena a mano.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="label-caps text-[10px]">EO del Plan de Vuelo (opcional)</Label>
            <Select value={form.plan_id || NONE} onValueChange={applyPlan}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Captura manual</SelectItem>
                {PLAN_EO.map(p => <SelectItem key={p.plan_id} value={p.plan_id}><span className="font-mono text-muted-foreground mr-2">{p.plan_id}</span>{p.puesto}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="label-caps text-[10px]">Área / frente</Label>
              <Select value={form.frente} onValueChange={v => set("frente", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar frente" /></SelectTrigger>
                <SelectContent>{FRENTES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="label-caps text-[10px]">Sede</Label>
              <Select value={form.sede} onValueChange={v => set("sede", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                <SelectContent>{SEDES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="label-caps text-[10px]">Puesto observado</Label><Input value={form.position} onChange={e => set("position", e.target.value)} placeholder="Ej. Ejecutivo de Compras" /></div>
            <div className="space-y-1.5"><Label className="label-caps text-[10px]">Persona observada</Label><Input value={form.collaborator_name} onChange={e => set("collaborator_name", e.target.value)} placeholder="Nombre" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="label-caps text-[10px]">Consultor</Label>
              <Select value={form.created_by} onValueChange={v => set("created_by", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{CONSULTORES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="label-caps text-[10px]">Fecha</Label><Input type="date" value={form.study_date} onChange={e => set("study_date", e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label className="label-caps text-[10px]">Semana plan</Label>
              <Select value={form.semana} onValueChange={v => set("semana", v)}>
                <SelectTrigger><SelectValue placeholder="S1–S4" /></SelectTrigger>
                <SelectContent>{Object.entries(SEMANAS).map(([k, v]) => <SelectItem key={k} value={k}>{k} · {v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="label-caps text-[10px]">Objetivo / qué medir</Label><Textarea value={form.objective} onChange={e => set("objective", e.target.value)} rows={3} /></div>
          <Button type="submit" disabled={!canSubmit || loading} className="w-full press-in h-12 text-sm font-semibold">{loading ? "Registrando..." : "Registrar e ir a Llenado"}</Button>
        </form>
      </motion.div>
    </div>
  );
}
