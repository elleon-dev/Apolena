# Apolena — Plataforma de Retratos Artísticos Personalizados de Mascotas con IA

Plataforma integral para generar retratos al óleo y fotografías de estudio de alta fidelidad para mascotas (perros y gatos), fusionando su rostro con atuendos predefinidos mediante **FLUX.1 [dev] Inpainting** y escalando los resultados a **4K a 300 DPI** con **Clarity Upscaler** para impresión profesional sobre lienzo o cuadro.

---

## 1. Arquitectura del Sistema y Stack Tecnológico

```
[Usuario / Web Client] 
       │ (1. Carga foto mascota + Selección de plantilla)
       ▼
[Frontend: Next.js 14 App Router + Tailwind CSS]
       │ (2. Envío de Payload a POST /api/generate)
       ▼
[Backend: Next.js API Handlers] ───> [Supabase Storage: pet-uploads / templates]
       │ (3. Registro de Job en Postgres: generation_jobs)
       ▼
[Cola Asíncrona: Redis + BullMQ / Local Dispatch]
       │ (4. Petición POST con Webhook a fal.ai)
       ▼
[fal.ai Pipeline Serverless]
  ├── FLUX.1 [dev] Inpainting (Fusión orgánica de rostro y cuello | strength: 0.91, guidance: 3.5)
  └── Clarity Upscaler (Escalado 4K a 300 DPI | factor 2x, resemblance: 0.88)
       │ (5. Notificación vía Webhook POST /api/webhooks/fal)
       ▼
[Backend Webhook Handler] ───> [Supabase DB: Job completado + URL final]
       │ (6. Server-Sent Events / SSE o Polling a /api/jobs/[id])
       ▼
[Usuario: Visualizador de Resultado Final con Deep Zoom 4K & Antes/Después]
```

### Componentes Clave:
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons y Canvas Confetti.
- **Backend & Persistencia**: Route Handlers nativos en Next.js, Supabase PostgreSQL (`generation_jobs`) y Supabase Storage (`pet-uploads`, `templates`, `portraits-hd`).
- **Procesamiento Asíncrono**: Despacho desacoplado sin timeouts HTTP (BullMQ / Redis / Memory worker).
- **Pipeline de IA**:
  - `fal-ai/flux-general/inpainting` (strength: 0.88 - 0.94, guidance_scale: 3.0 - 4.0).
  - `fal-ai/clarity-upscaler` (resemblance: 0.88, creatividad: 0.25, resolución 2048×2048+ a 300 DPI).

---

## 2. Estandarización de Plantillas (Assets Base)

Cada atuendo del catálogo está estandarizado en `public/templates/[template-id]/` con:
1. `template.svg` / `template.jpg`: Base visual y lumínica del cuerpo sin rostro o con cuello neutro.
2. `mask.png`: Máscara monocromática 8-bit (Blanco `#FFFFFF` en cabeza/cuello; negro `#000000` en el cuerpo).
3. `config.json`: Prompts positivos/negativos, ángulo de luz (`studio_soft`, `chiaroscuro_side`, etc.), compatibilidad de especie y calibración de inferencia.

### Catálogo Inicial de 8 Atuendos:
1. **El Magnate Ejecutivo**: Traje de tres piezas italiano azul marino con corbata roja de seda.
2. **Oficial de Policía K-9**: Uniforme táctico policial con placa dorada, chaleco y gorra oficial.
3. **Lord / Lady Victoriano**: Atuendo aristocrático de terciopelo carmesí con gorguera de encaje.
4. **Comandante Astronauta**: Escafandra espacial NASA con parches de misión orbital.
5. **Chef de Alta Cocina**: Filipina clásica blanca con vivos negros y gorro blanche.
6. **Hacker Cyberpunk 2077**: Bomber con circuitos de neón cian/magenta y lluvia futurista.
7. **Duque del Renacimiento**: Retrato al óleo del siglo XVII con jubón de brocado y perlas.
8. **Sheriff del Lejano Oeste**: Chaleco de cuero gastado con estrella de plata y pañuelo rojo.

---

## 3. Matriz de Costos Estimada por Generación (fal.ai)

| Operación | Modelo / Servicio | Tiempo aprox. | Costo estimado por imagen |
| :--- | :--- | :--- | :--- |
| **Inpainting / Fusión** | FLUX.1 [dev] Inpainting | 5 - 8 seg | ~$0.025 - $0.035 USD |
| **Super-Resolución 4K** | Clarity Upscaler (2x / 300 DPI) | 4 - 6 seg | ~$0.015 - $0.020 USD |
| **Almacenamiento y Webhook** | Supabase Storage + Compute | Instantáneo | < $0.001 USD |
| **Costo Total Unitario** | **Pipeline Completo E2E** | **~10 - 14 seg** | **~$0.040 - $0.055 USD** |

---

## 4. Criterios de Aceptación del MVP

- ✅ **Fidelidad del rostro**: El patrón de coloración, mirada y orejas son inmediatamente reconocibles respecto a la foto original.
- ✅ **Integración anatómica**: Cuello fundido de forma orgánica con la solapa sin cortes duros ni artefactos borrosos.
- ✅ **Tiempo total de respuesta**: < 25 segundos desde que el usuario presiona "Generar".
- ✅ **Calidad de salida**: Formato PNG con resolución mínima de 2048×2048 px (apto para impresión en A4 o lienzos de 50×70 cm a 300 DPI).

---

## 5. Instalación y Ejecución Local

### Prerrequisitos
- Node.js 18+ o 20+
- npm o pnpm

### Pasos:
1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```
> *Nota*: Si dejas `FAL_KEY` en blanco, el sistema operará automáticamente en **Modo Demo/Simulación de Alta Fidelidad**, simulando cada paso del pipeline en tiempo real y entregando las muestras de alta definición para que puedas probar la aplicación inmediatamente sin costo.

3. **Iniciar servidor de desarrollo**:
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 6. Estructura del Proyecto

```
apolena/
├── public/
│   ├── samples/              # Fotos de muestra (gato en traje ejecutivo, etc.)
│   ├── masks/                # Máscaras morfológicas 8-bit
│   └── templates/            # Catálogo estandarizado (template.svg, mask.png, config.json)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/     # POST /api/generate (Crea y encola el job)
│   │   │   ├── jobs/[id]/    # GET /api/jobs/[id] (Polling) & /events (SSE)
│   │   │   ├── webhooks/fal/ # POST /api/webhooks/fal (Notificación de fal.ai)
│   │   │   └── templates/    # GET /api/templates (Catálogo)
│   │   ├── globals.css       # Estilos globales y temas
│   │   ├── layout.tsx        # Shell HTML y fuentes
│   │   └── page.tsx          # Orquestador del flujo de pantallas
│   ├── components/
│   │   ├── Header.tsx        # Barra superior con métricas y spec
│   │   ├── CatalogScreen.tsx # Pantalla 1: Catálogo y filtros
│   │   ├── UploadScreen.tsx  # Pantalla 2: Carga, recorte facial y validaciones
│   │   ├── LoadingScreen.tsx # Pantalla 3: Barra de progreso y pasos del pipeline
│   │   ├── ResultScreen.tsx  # Pantalla 4: Visor 4K, deep zoom, antes/después y lienzo
│   │   └── ArchitectureModal.tsx # Modal con diagrama de arquitectura y costos
│   ├── data/
│   │   └── templates.ts      # Registro y configuraciones de plantillas
│   └── lib/
│       ├── fal.ts            # Cliente FLUX Inpainting + Clarity Upscaler
│       ├── queue.ts          # Motor de colas asíncrono
│       ├── supabase.ts       # Cliente y persistencia Supabase
│       └── types.ts          # Interfaces TypeScript
├── supabase/
│   └── migrations/           # Migraciones SQL para Supabase Postgres y Storage
├── package.json
└── README.md
```
