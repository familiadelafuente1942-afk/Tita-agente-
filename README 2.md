# Tita Agente

App completa (frontend + backend) que convierte a Tita en un agente que
ejecuta acciones reales usando Claude (tool use) como motor de decisión:
lee/escribe tus datos en Supabase, manda WhatsApp (Meta Business API),
manda mails y maneja tu Google Calendar. Login por magic link incluido.

Lista para: **push a GitHub → import en Vercel → deploy**. El backend
(Edge Functions) se despliega aparte, contra tu proyecto de Supabase.

## Estructura

```
index.html, vite.config.js, package.json, vercel.json   → app Vite/React
src/
  main.jsx, App.jsx                   → entrypoint, maneja sesión
  supabaseClient.js                   → cliente Supabase (frontend)
  components/
    Auth.jsx                         → login por magic link
    TitaChat.jsx                     → chat del agente
supabase/
  migrations/0001_agent_core.sql      → tablas + RLS
  functions/
    agent-loop/                       → loop principal del agente
      index.ts
      tools/
        registry.ts                  → definición de tools + dispatcher
        supabase-tools.ts            → lectura/escritura de datos propios
        whatsapp.ts                  → envío WhatsApp Business
        google.ts                    → Gmail + Calendar
    agent-confirm/                    → aprobar/rechazar acciones sensibles
    google-oauth/                     → conectar cuenta de Google (una vez)
docs/SETUP.md                         → guía paso a paso completa
.env.example                          → secrets del backend (Edge Functions)
.env.local.example                    → variables del frontend (Vercel)
```

## Empezar

Todo el paso a paso — crear las cuentas, sacar las API keys, correr la
migración SQL, deployar el backend, y subir el frontend a GitHub/Vercel —
está en **`docs/SETUP.md`**. Empezá por ahí, en orden.

Resumen rápido una vez que tengas las credenciales:

```bash
# Backend
supabase link --project-ref TU-PROYECTO
supabase secrets set --env-file .env
supabase functions deploy agent-loop
supabase functions deploy agent-confirm
supabase functions deploy google-oauth --no-verify-jwt

# Frontend: subir esta carpeta a un repo de GitHub, importarlo en Vercel,
# cargar las 3 variables VITE_* en Vercel → Environment Variables, Deploy.
```

## Cómo funciona el loop, en criollo

1. El usuario le escribe a Tita (ya logueado con magic link).
2. `agent-loop` le manda el mensaje + historial a Claude, con la lista de
   tools disponibles (consultar/escribir datos, WhatsApp, mail, calendario).
3. Claude responde pidiendo ejecutar una o más tools (o responde directo si
   no hace falta ninguna acción).
4. La function ejecuta esas tools de verdad contra Supabase/Meta/Google,
   guarda cada intento en `agent_actions` (éxito, error o bloqueado), y le
   devuelve el resultado a Claude.
5. Claude usa esos resultados para seguir decidiendo o para responderle al
   usuario en texto — "ejecuté X, acá está el resultado".
6. Las tools marcadas como sensibles (por defecto: escrituras en la base y
   borrar eventos de calendario) no se ejecutan solas: quedan pendientes en
   `agent_pending_confirmations` hasta que el usuario aprueba desde el chat.

## Seguridad, en corto

- Whitelist explícita de tablas (`ALLOWED_TABLES` en `supabase-tools.ts`) —
  el agente no puede tocar nada fuera de esa lista.
- Log de auditoría completo en `agent_actions`, se ejecute o no la acción.
- RLS en todas las tablas — cada usuario solo ve/opera lo suyo.
- Tokens de terceros (Google, WhatsApp) y la `service_role key` nunca tocan
  el frontend — viven solo como secrets de las Edge Functions.

Ver más detalle en `docs/SETUP.md` → sección "Notas de seguridad".

## Pendiente antes de que funcione con tus datos reales

En `supabase/functions/agent-loop/tools/supabase-tools.ts` → `ALLOWED_TABLES`
hoy hay nombres de ejemplo (`tita_tasks`, `tita_reminders`, etc.). Reemplazalos
por los nombres reales de tus tablas de Tita para que el agente pueda leerlas
y escribirlas.
