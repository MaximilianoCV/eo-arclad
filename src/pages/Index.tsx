import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Timer, BarChart3 } from "lucide-react";
import { PROYECTO } from "@/data/plan";

const MODULES = [
  { to: "/new", icon: Plus, n: "1", title: "Registro", desc: "Da de alta el estudio: frente, puesto, persona y consultor" },
  { to: "/studies", icon: Timer, n: "2", title: "Llenado", desc: "Cronómetro por actividad y cómo va el día" },
  { to: "/resumen", icon: BarChart3, n: "3", title: "Resumen", desc: "Todo lo capturado, agrupado por frente, puesto o consultor" },
];

export default function Index() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.4, bounce: 0 }} className="w-full max-w-3xl text-center space-y-8">
        <div>
          <span className="label-caps text-[10px]">{PROYECTO} · Etapa de Diagnóstico</span>
          <h1 className="display-text text-3xl mt-2">Gemba Walk</h1>
          <p className="text-sm text-muted-foreground mt-2">Registro, llenado en piso y resumen del contenido de trabajo del puesto</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODULES.map(m => (
            <Link key={m.to} to={m.to} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 hover:border-accent/50 hover:shadow-md transition-all">
              <span className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center"><m.icon className="h-5 w-5" /></span>
              <span className="font-semibold text-sm"><span className="font-mono text-muted-foreground mr-1.5">{m.n}</span>{m.title}</span>
              <span className="text-xs text-muted-foreground">{m.desc}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
