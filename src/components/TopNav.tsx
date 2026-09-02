import { Link, useLocation } from "react-router-dom";
import { Plus, Timer, BarChart3, Cloud, CloudOff, LogOut } from "lucide-react";
import { signOut, type Session } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { isCloud } from "@/lib/api";
import ConfigDialog from "./ConfigDialog";
import { useState } from "react";

const LINKS = [
  { to: "/new", label: "Registro", icon: Plus, match: (p: string) => p === "/new" },
  { to: "/studies", label: "Llenado", icon: Timer, match: (p: string) => p === "/studies" || p.startsWith("/study/") },
  { to: "/resumen", label: "Resumen", icon: BarChart3, match: (p: string) => p === "/resumen" },
];

export default function TopNav({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const cloud = isCloud();
  return (
    <header className="h-14 border-b bg-card sticky top-0 z-20 flex items-center px-4 sm:px-6 justify-between gap-3">
      <Link to="/" className="flex items-center gap-3 min-w-0">
        <img src="logo-lcg.png" alt="London Consulting Group" className="h-6 w-auto" />
        <span className="hidden sm:block border-l pl-3 font-semibold text-sm tracking-tight text-primary truncate">Estudios de Observación</span>
      </Link>
      <nav className="flex items-center gap-1">
        {LINKS.map(l => (
          <Link key={l.to} to={l.to}>
            <Button variant="ghost" size="sm" className={`text-xs font-semibold ${l.match(pathname) ? "text-primary bg-secondary" : "text-muted-foreground"}`}>
              <l.icon className="h-3.5 w-3.5 mr-1.5" /> {l.label}
            </Button>
          </Link>
        ))}
        <button onClick={() => setOpen(true)} title={cloud ? "Supabase conectado" : "Modo local · configurar Supabase"}
          className={`ml-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${cloud ? "bg-accent/10 text-accent" : "bg-amber-100 text-amber-800"}`}>
          {cloud ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
          <span className="hidden sm:inline">{cloud ? "Supabase" : "Local"}</span>
        </button>
      </nav>
      <ConfigDialog open={open} onOpenChange={setOpen} />
    </header>
  );
}
