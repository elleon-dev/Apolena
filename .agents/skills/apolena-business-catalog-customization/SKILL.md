---
name: apolena-business-catalog-customization
description: Reglas de Negocio Oficiales para el Catálogo de Productos (products, product_images), Fusión IA (generation_jobs) y Arquitectura Extensible de Personalización (medidas, acabados, marcos de cuadros y futuros productos para mascotas) en Apolena.
---

# 🎨 Reglas de Negocio Oficiales: Catálogo y Personalización Extensible en Apolena

Este skill define la arquitectura de productos y personalizaciones en Apolena, garantizando que el primer producto (**Cuadros Personalizados para Mascotas**) funcione de extremo a extremo y que futuras personalizaciones (como **marcos de cuadros**, materiales, orientación, o nuevos productos como tazas, collares o mantas) se agreguen sin romper la base de datos.

> [!IMPORTANT]
> **REGLA DE GUARDIA:** Si algún cambio solicitado por el usuario requiere modificar las reglas de este skill, el agente DEBE emitir una alerta explícita informando que se está alterando la lógica de negocio establecida y solicitar confirmación antes de aplicar el cambio.

---

## 1. Estructura de Productos (`products` y `product_images`)

- **`Product` (`@@map("products")`)**:
  - `id`: UUID.
  - `title`: Nombre comercial (ej. `"Cuadro Artístico Personalizado para Mascota"`).
  - `slug`: Identificador URL único (ej. `"cuadros-personalizados"`).
  - `description`: Descripción detallada.
  - `base_price`: Precio base en Soles (`PEN`, `Decimal(10, 2)`).
  - `status`: `"active" | "inactive" | "archived"`.
  - `stock`: Stock disponible o capacidad operativa.
  - `specifications`: JSONB con especificaciones técnicas (ej. resolución 300 DPI, materiales base).
  - `customization_config`: JSONB extensible que define y persiste en Supabase PostgreSQL todas las opciones dinámicas del servicio **`cuadros-personalizados`**:
    - `characters`: Lista dinámica de Personajes y Escenas IA (`id`, `name`, `characterTitle`, `universe`, `description`, `characterImageUrl`, `fusionSampleUrl`, `prompt`, `negativePrompt`, `isAvailable`).
    - `frames`: Lista dinámica de Marcos y Bastidores (`id`, `name`, `description`, `priceModifierPen`, `colorHex`, `isAvailable`).
    - `sizes`: Lista dinámica de Medidas de Imprenta 300 DPI (`id`, `tier`, `cmDimensions`, `inchDimensions`, `baseWidthPx`, `baseHeightPx`, `dpi`, `recommendedUse`, `pricePen`, `isAvailable`).
    - `finishes`: Lista dinámica de Acabados de Lienzo (`full-bleed` / `museum-matte` con `name`, `description`, `priceModifierPen`, `isAvailable`).
  - **Gestión Dinámica en `/dashboard`:** Tanto `super_admin` como `admin` pueden crear, editar, activar/ocultar y eliminar personajes IA, marcos, medidas 300 DPI y acabados del servicio `cuadros-personalizados` desde la pestaña **"Cuadros Personalizados"** del Dashboard Administrativo (`PUT /api/admin/settings` con `{ productId, productUpdate }`).
  - **Asistente IA para Alta Rápida de Personajes (`/api/admin/analyze-character`):** En el modal de creación de personajes, el primer paso es la subida de la imagen de vestuario de referencia. Al cargarse, el sistema ejecuta un análisis multimodal con IA (Gemini Flash free-tier y motor heurístico local a costo $0) que deduce automáticamente el nombre, título, universo y descripción para el cliente. No se muestra ni se requiere ningún campo técnico `"Prompt Maestro IA"` en las tarjetas ni en el formulario de personajes. El Estudio IA (`/products/cuadros-personalizados`) y el worker de generación (`src/lib/queue.ts` vía `getWallArtCharacterById`) consumen esta configuración dinámica en tiempo real.
- **`CharacterTemplate` (`@@map("character_templates")`)**:
  - Tabla relacional dedicada para el catálogo de personajes y escenas IA, diseñada para escalar a cientos de temáticas sin deuda técnica.
  - Campos: `id` (UUID), `slug` (único, ej. `joker`, `jack-sparrow`), `name`, `character_title`, `universe` (ej. `Colección Cine`, `Imperio Inca`), `description`, `character_image_url`, `mask_url`, `fusion_sample_url`, `accent_color`, `tag_color`, `prompt`, `negative_prompt`, `is_available` (booleano), `position` (entero de ordenación), `created_at` y `updated_at`.
  - Índices: `[is_available]`, `[universe]`, `[position]` para búsquedas y paginación ultra rápidas.
  - Sincronización transparente: Las APIs de catálogo (`/api/products`, `/api/templates`) y el dashboard administrativo leen y sincronizan atómicamente con esta tabla manteniendo compatibilidad completa con el personalizador.

- **`ProductImage` (`@@map("product_images")`)**:
  - Galería de imágenes de muestra del producto (`product_id`, `url`, `position`, `alt_text`).

---

## 2. Almacenamiento Cloud Escalable (Supabase Storage: `apolena-media`)

Para garantizar que el catálogo escale a múltiples tipos de productos y que el repositorio Git no se sobrecargue con archivos binarios ni dependa de sistemas de archivos locales efímeros (como en Vercel o Railway), todas las imágenes se gestionan a través de **Supabase Storage** (`src/lib/image-storage.ts`):

- **Bucket Central (`apolena-media`):**
  - `artworks/`: Obras maestras de alta resolución (300 DPI) para taller y producción.
  - `previews/`: Vistas previas optimizadas para web con marca de agua oficial Apolena.
  - `pets/`: Fotografías originales de las mascotas subidas por los usuarios.
  - `proofs/`: Comprobantes de pago de transacciones (Yape, Plin, Transferencia).
  - `characters/`: Diseños y vestuarios de personajes y temáticas del atelier.
  - `products/`: Fotografías de catálogo y recursos de nuevos productos futuros (tazas, collares, mantas, etc.).
- **Deduplicación SHA-1:** Toda imagen procesada por `externalizeBase64Image` se optimiza con `sharp` y se almacena bajo su hash de contenido para evitar duplicaciones innecesarias de archivos.
- **Fallback Automático:** En entornos de desarrollo local sin credenciales de Supabase, se mantiene un respaldo automático a disco local.

---

## 3. Flujo de Creación de Retratos en el Atelier Digital

1. **Carga de Fotografía de Mascota y Selección de Especie:** El usuario sube la foto de su mascota y selecciona o confirma su especie (🐶 Perro, 🐱 Gato, 🐾 Otra Mascota) para garantizar fidelidad fisonómica total. Queda estrictamente prohibido inferir la especie mediante búsquedas de texto (`.includes('cat')`) en cadenas base64 o URLs.
2. **Selección de Personaje o Temática:** El usuario escoge una obra del catálogo de Apolena o sube una referencia personalizada.
3. **Generación Dual de Atelier (OpenAI + Gemini en paralelo):**
   - **Invisibilidad de la IA para el cliente:** La plataforma opera bajo la identidad de un atelier artístico de lujo ("Atelier Apolena"). La interfaz del cliente (`/products/cuadros-personalizados`) **NO** expone selectores técnicos de modelos de IA, nombres de motores ni tarifas por generación.
   - **Transparencia en Modo Contingencia (Cuota de API Excedida 429):** En caso de agotamiento de cuotas o créditos en las cuentas de IA de OpenAI o Google Cloud, el sistema informa con un banner elegante y claro en el Paso 3 que se desplegó una muestra ilustrativa del catálogo, respetando rigurosamente la especie seleccionada (un perro jamás mostrará una muestra de gato).
   - **2 Propuestas Artísticas Simultáneas:** Al presionar "Crear Retrato Ahora", el sistema ejecuta en paralelo los motores de OpenAI y Google Gemini para entregar **2 propuestas artísticas complementarias**:
     - _Propuesta 1 · Óleo Fine Art_ (técnica con rica textura de óleo y calidez clásica).
     - _Propuesta 2 · Claroscuro y Detalle_ (contrastes profundos, realce de brillo y mirada).
   - **Prioridad Absoluta de la Mascota del Usuario y Personaje como Guía Temática:**
     - Antes de generar la obra, el sistema extrae la huella fisonómica exacta de la mascota del usuario (`extractPetIdentityFingerprint`: especie exacta perro/gato, raza, hocico, orejas, pelaje y mirada) y la coloca como **Prioridad #1 (Protagonista)** al inicio del prompt maestro.
     - El personaje o temática escogida (`character.prompt` o vestuario personalizado) actúa **únicamente como guía secundaria de vestuario, accesorios, iluminación y escenario** alrededor de la mascota del cliente, prohibiendo que coronas, sombreros o prendas oculten, deformen o reemplacen las orejas, el rostro o las facciones reales de la mascota.
     - Los prompts de catálogo (`character.prompt`) y el analizador de personajes (`/api/admin/analyze-character`) deben ser **100% neutros respecto a la especie** (`"the uploaded pet from the reference photo"`, nunca hardcodear `"cat"`, `"tabby cat"` o `"dog"` aunque la imagen de muestra del vestuario tenga un gato o un perro).
     - En el pipeline de generación (`src/lib/ai-providers.ts`), los endpoints de edición/generación de imágenes reciben como entrada visual (`image[]` / `inlineData`) **únicamente las fotografías de las mascotas subidas por el cliente** (`pet1Data` y `pet2Data`), evitando que la cara o especie del animal de muestra del vestuario de referencia contamine o reemplace al perro o gato real del usuario.
     - **Encuadre Completo de Cabeza, Orejas y Rostro para Lienzo en Bastidor (`1024x1536` vertical con 20-25% de aire superior):** Todo retrato individual se genera en proporción vertical de retrato (`1024x1536`) y retrato doble en horizontal (`1536x1024`), exigiendo explícitamente un plano medio-abierto (pecho hacia arriba) con un **margen libre obligatorio del 20% al 25% sobre la cabeza/orejas/corona** y 15% a los lados para que la cabeza, frente y orejas de cada mascota salgan **100% completas y sin recortes** al tensar el lienzo sobre el bastidor de madera.
4. **Elección de la Propuesta Favorita y Personalización del Cuadro:**
   - En el Paso 3, el cliente visualiza ambas propuestas lado a lado con sus miniaturas y selecciona 1 con un solo clic (`selectedVariantId`).
   - La propuesta elegida se proyecta de inmediato en el marco interactivo, el visor de lienzo y la lupa de inspección.
   - **Protección Anti-Fuga Comercial en 3 Capas y Marca de Agua Oficial Apolena:**
     1. **Capa 1 — Marca de Agua Quemada en Servidor (`sharp`) y Bóveda Master (`src/lib/server-watermark.ts`):**
        - Al finalizar la generación en el backend (`src/lib/queue.ts`), el servidor incrusta a nivel de bytes (con `sharp`) el logotipo oficial de Apolena (`public/logo.png`), un patrón diagonal repetitivo de seguridad y un sello inferior en todas las variantes enviadas al navegador (limitadas a máx. 1080 px JPEG 82%).
        - El navegador y el panel Network (DevTools) **jamás reciben la imagen original sin marca de agua** durante la vista previa; los archivos maestros limpios a resolución completa quedan resguardados exclusivamente en el servidor (`protectAndStoreJobVariants` / `resolveCleanMasterArtwork`).
     2. **Capa 2 — Visor Protegido en `<canvas>` (`src/components/ProtectedArtworkCanvas.tsx`) y Muestra Web:**
        - El visor principal en `/products/cuadros-personalizados` renderiza la obra dentro de un elemento `<canvas>` HTML5 en lugar de una etiqueta `<img>` expuesta, bloqueando el clic derecho (`onContextMenu`), el arrastre (`draggable={false}`) y pintando una capa adicional de protección sobre el buffer de píxeles.
        - El botón de descarga disponible en el estudio (`exportWatermarkedPreviewImage`) genera únicamente una **Muestra Digital con Marca de Agua** con el logotipo oficial de Apolena incrustado (resolución web máx. 900 px JPEG comprimido, no apta para impresión física en bastidor).
     3. **Capa 3 — Custodia del Archivo Master 300 DPI y Desbloqueo Post-Entrega (`completed` + `paid_full`):**
        - Al crearse una orden (`POST /api/orders`), el servidor vincula el archivo maestro limpio en `customizations.master_art_url`.
        - Los administradores en `/dashboard` siempre visualizan y descargan el archivo maestro limpio (`master_art_url`) para enviarlo a imprenta a 300 DPI.
        - Para el comprador (`/orders` y `/track/[trackingId]`), las APIs filtran y ocultan `master_art_url` mientras el pedido está en curso. Únicamente cuando la orden alcanza el estado **`completed`** (entregada físicamente y con el 100% pagado, `payment_status === 'paid_full'`), el sistema desbloquea automáticamente el botón **"Descargar Recuerdo Digital HD (Sin Marca de Agua)"** como beneficio exclusivo post-compra.
   - El cliente selecciona la medida de imprenta (300 DPI) según la **Guía de Tamaños y Precios Oficial Apolena**:
     - **30 × 20 cm (S/ 180.00):** Ideal para espacios reducidos, repisas o composiciones con varios cuadros. Un detalle decorativo sutil y versátil.
     - **45 × 30 cm (S/ 210.00):** Ideal para paredes pequeñas o para complementar otros elementos decorativos. También funciona muy bien en galerías de cuadros.
     - **60 × 40 cm (S/ 240.00):** Ideal para espacios pequeños y medianos. Tiene buena presencia sin dominar la decoración.
     - **75 × 50 cm (S/ 270.00):** Ideal para aportar carácter y presencia sin convertirse en el foco principal del ambiente.
     - **90 × 60 cm (S/ 300.00):** Ideal como cuadro principal. Destaca visualmente sin ocupar demasiado espacio.
     - **105 × 70 cm (S/ 360.00):** Ideal para crear un punto focal. Perfecto sobre sofás, camas, escritorios y otros muebles pequeños.
     - **120 × 80 cm (S/ 420.00):** Ideal para paredes amplias y espacios donde el cuadro será protagonista. Una pieza de gran presencia e impacto visual. Perfecto para cabeceras de camas y muebles medianos y grandes.
   - **Detalles del Producto y Material:** Los cuadros son elaborados en **lienzo de tela canvas**, tensados artesanalmente sobre bastidor de madera maciza (listos para colgar con acabado Full Screen sin marco).
   - Al continuar a checkout, la obra elegida viaja en el borrador de orden (`apolena_checkout_draft`) como `generated_art_url`.

---

## 3. Contrato Extensible de Personalización en `OrderItem`

Para que Apolena escale a nuevas personalizaciones (ej. **marcos para cada cuadro**, textos grabados, empaques de regalo) sin requerir migraciones destructivas, cada `OrderItem` (`order_items`) almacena:

- `product_id`: Referencia al producto en `products`.
- `generation_job_id`: Referencia opcional al job de IA en `generation_jobs`.
- `pet_photo_url`: URL de la foto original de la mascota subida por el cliente.
- `generated_art_url`: URL de la imagen final fusionada aprobada por el cliente para fabricación.
- `customizations` (`Json`): Objeto estructurado y extensible con el snapshot inmutable de las opciones elegidas al momento de la compra:
  ```json
  {
    "theme_id": "inca-emperor",
    "theme_name": "Emperador Inca",
    "size_id": "size-l",
    "size_label": "50 × 70 cm (L)",
    "dpi": 300,
    "finish_mode": "full-bleed",
    "frame_id": "canvas-bastidor",
    "frame_name": "Lienzo en Bastidor de Madera",
    "pet_inscription": {
      "enabled": true,
      "pet_name": "Max",
      "style": "brush-white-diagonal"
    },
    "dedication_note": "Con todo el cariño para mamá en su cumpleaños.",
    "notes": "Ojos bien iluminados"
  }
  ```
- **Cálculo de Precio Unitario (`unit_price`):**
  $$\text{unit\_price} = \text{base\_price (según medida)} + \sum \text{price\_modifiers (marco, acabado, extras)}$$
