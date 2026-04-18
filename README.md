# Cooitza — catalogo publico de paquetes

Vista publica de paquetes de viaje conectada a Supabase de la plataforma VXM.
Los paquetes se editan desde la plataforma principal; Cooitza solo lee los que
tienen `is_public_cooitza = true`.

## Stack
- Next.js 16 + React 19 + TypeScript + Tailwind
- Supabase (solo lectura via anon key)

## Setup local
```bash
npm install
cp .env.example .env.local
# completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Deploy en Vercel
Configurar estas variables en Vercel:

**Requeridas**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Opcionales**
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_AGENCY_NAME`
- `NEXT_PUBLIC_AGENCY_LOGO_URL`

## Rutas
- `/` landing Cooitza
- `/paquetes` catalogo
- `/paquetes/[slug]` detalle + CTA WhatsApp
