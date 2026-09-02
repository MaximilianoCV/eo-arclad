import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn } from "lucide-react";
import { USERS, signIn } from "@/lib/auth";
import { PROYECTO } from "@/data/plan";
import { isCloud } from "@/lib/api";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [name, setName] = useState(localStorage.getItem("eo.who") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await signIn(name, password); onLogin(); } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.4, bounce: 0 }} className="w-full max-w-sm rounded-xl border border-border bg-card p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-3">
          <img src="logo-lcg.png" alt="London Consulting Group" className="h-7 w-auto mx-auto" />
          <div>
            <span className="label-caps text-[10px]">{PROYECTO} · Diagnóstico</span>
            <h1 className="display-text text-2xl mt-1">Gemba Walk</h1>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="label-caps text-[10px]">Usuario</Label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger><SelectValue placeholder="Elige tu nombre" /></SelectTrigger>
              <SelectContent>{USERS.map(u => <SelectItem key={u.email} value={u.name}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="label-caps text-[10px]">Contraseña</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
        <Button type="submit" disabled={!name || !password || loading} className="w-full press-in h-11 font-semibold"><LogIn className="h-4 w-4 mr-2" />{loading ? "Entrando..." : "Entrar"}</Button>
        <p className="text-[11px] text-muted-foreground text-center">{isCloud() ? "Base compartida del equipo" : "Modo local: los datos se guardan solo en este navegador"}</p>
      </motion.form>
    </div>
  );
}
