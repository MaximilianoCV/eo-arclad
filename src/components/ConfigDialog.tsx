import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseConfig, saveSupabaseConfig } from "@/integrations/supabase/client";

export default function ConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const cfg = getSupabaseConfig();
  const [url, setUrl] = useState(cfg?.url ?? "");
  const [key, setKey] = useState(cfg?.key ?? "");
  const save = () => { saveSupabaseConfig(url && key ? { url: url.trim(), key: key.trim() } : null); window.location.reload(); };
  const local = () => { saveSupabaseConfig(null); window.location.reload(); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conexión a Supabase</DialogTitle>
          <DialogDescription>Se guarda solo en este navegador. Primero corre <code className="font-mono text-xs">supabase/migrations/00001_eo_arclad.sql</code> en el SQL Editor del proyecto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="label-caps text-[10px]">Project URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" /></div>
          <div className="space-y-1.5"><Label className="label-caps text-[10px]">Anon / publishable key</Label><Input value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGciOi... o sb_publishable_..." /></div>
          <p className="text-xs text-muted-foreground">Sin conexión la app trabaja en modo local (solo este navegador) con datos demo. Dentro del visor de artifacts de Claude la red está bloqueada; la conexión real funciona desde GitHub Pages, Lovable o local.</p>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={local}>Usar modo local</Button><Button onClick={save} disabled={!url || !key}>Guardar y conectar</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
