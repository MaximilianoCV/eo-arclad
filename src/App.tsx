import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TopNav from "@/components/TopNav";
import Index from "./pages/Index";
import NewStudy from "./pages/NewStudy";
import StudyPage from "./pages/StudyPage";
import StudiesPage from "./pages/StudiesPage";
import ResumenPage from "./pages/ResumenPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* HashRouter: funciona igual en GitHub Pages, en un archivo local y en Lovable. */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <TopNav />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/new" element={<NewStudy />} />
          <Route path="/studies" element={<StudiesPage />} />
          <Route path="/study/:id" element={<StudyPage />} />
          <Route path="/resumen" element={<ResumenPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;
