# Estudios de Observación · ARclad México · LCG

Misma base que la app compartida en Lovable (Vite + React + TypeScript + Tailwind + shadcn/ui + Supabase), con marca LCG, los 7 EO del Plan de Vuelo DX y un módulo de Resumen agrupable.

**Módulos:** 1. Registro (`/new`) · 2. Llenado (`/studies` → `/study/:id`, cronómetro por actividad, timeline, análisis con "cómo cree" y "cómo le gustaría", reporte) · 3. Resumen (`/resumen`, filtros y agrupación por frente, puesto, consultor, sede, semana).

Sin Supabase configurado trabaja en **modo local** (localStorage, solo ese navegador) con 3 estudios demo.

## Correr local
```bash
npm install
npm run dev          # http://localhost:8080
```

## Supabase (una vez, ~10 min)
1. Crea un proyecto en supabase.com.
2. SQL Editor → corre `supabase/migrations/00001_eo_arclad.sql` (tablas, vista Power BI, políticas, 7 EO del plan).
3. Project Settings → API → copia URL y anon/publishable key.
4. O bien `.env` (copiar `.env.example`), o bien en la app: botón "Local" arriba a la derecha → pegar → Guardar.

## Publicar
- **GitHub Pages / cualquier hosting estático:** `npm run build:single` genera `dist/index.html` con todo inline (más `dist/logo-lcg.png`). Sube ambos.
- **Lovable:** sube este repo a GitHub y en Lovable usa "Import from GitHub" (o conecta un proyecto nuevo al repo). Ya trae `lovable-tagger`.
- **Vercel/Netlify:** `npm run build`, carpeta `dist`.

## Power BI
Obtener datos → PostgreSQL (credenciales en Project Settings → Database). Tablas `studies`, `activities`, `perceptions` y vista `v_resumen_estudio`.

## Seguridad
Equipo interno sin login: la anon key permite leer y escribir. No publicarla fuera del equipo. Para endurecer: Supabase Auth y cambiar `anon` por `authenticated` en las políticas.
