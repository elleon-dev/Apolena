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
- **`ProductImage` (`@@map("product_images")`)**:
  - Galería de imágenes de muestra del producto (`product_id`, `url`, `position`, `alt_text`).

---

## 2. Flujo de Creación de Retratos en el Atelier Digital

1. **Carga de Fotografía de Mascota:** El usuario sube la foto de su mascota (1 o 2 mascotas para retrato individual o dúo).
2. **Selección de Personaje o Temática:** El usuario escoge una obra del catálogo de Apolena o sube una referencia personalizada.
3. **Generación Dual de Atelier (OpenAI + Gemini en paralelo):**
   - **Invisibilidad de la IA para el cliente:** La plataforma opera bajo la identidad de un atelier artístico de lujo ("Atelier Apolena"). La interfaz del cliente (`/products/cuadros-personalizados`) **NO** expone selectores técnicos de modelos de IA, nombres de motores ni tarifas por generación.
   - **2 Propuestas Artísticas Simultáneas:** Al presionar "Crear Retrato Ahora", el sistema ejecuta en paralelo los motores de OpenAI y Google Gemini para entregar **2 propuestas artísticas complementarias**:
     - *Propuesta 1 · Óleo Fine Art* (técnica con rica textura de óleo y calidez clásica).
     - *Propuesta 2 · Claroscuro y Detalle* (contrastes profundos, realce de brillo y mirada).
   - **Prioridad Absoluta de la Mascota del Usuario y Personaje como Guía Temática:**
     - Antes de generar la obra, el sistema extrae la huella fisonómica exacta de la mascota del usuario (`extractPetIdentityFingerprint`: especie exacta perro/gato, raza, hocico, orejas, pelaje y mirada) y la coloca como **Prioridad #1 (Protagonista)** al inicio del prompt maestro.
     - El personaje o temática escogida (`character.prompt` o vestuario personalizado) actúa **únicamente como guía secundaria de vestuario, accesorios, iluminación y escenario** alrededor de la mascota del cliente, prohibiendo que coronas, sombreros o prendas oculten, deformen o reemplacen las orejas, el rostro o las facciones reales de la mascota.
     - Los prompts de catálogo (`character.prompt`) y el analizador de personajes (`/api/admin/analyze-character`) deben ser **100% neutros respecto a la especie** (`"the uploaded pet from the reference photo"`, nunca hardcodear `"cat"`, `"tabby cat"` o `"dog"` aunque la imagen de muestra del vestuario tenga un gato o un perro).
     - En el pipeline de generación (`src/lib/ai-providers.ts`), los endpoints de edición/generación de imágenes reciben como entrada visual (`image[]` / `inlineData`) **únicamente las fotografías de las mascotas subidas por el cliente** (`pet1Data` y `pet2Data`), evitando que la cara o especie del animal de muestra del vestuario de referencia contamine o reemplace al perro o gato real del usuario.
4. **Elección de la Propuesta Favorita y Personalización del Cuadro:**
   - En el Paso 3, el cliente visualiza ambas propuestas lado a lado con sus miniaturas y selecciona 1 con un solo clic (`selectedVariantId`).
   - La propuesta elegida se proyecta de inmediato en el marco interactivo, el visor de lienzo y la lupa de inspección.
   - El cliente selecciona la medida de imprenta (300 DPI). Los selectores de marcos externos y paspartú quedan desactivados en el frontend para el inicio (resultado full screen sin marco), manteniendo la arquitectura en el backend para reactivarse a futuro.
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
    "finish_mode": "museum-matte",
    "frame": {
      "id": "wood-oak",
      "name": "Marco de Madera Roble Natural",
      "price_modifier": 35.0
    },
    "notes": "Ojos bien iluminados"
  }
  ```
- **Cálculo de Precio Unitario (`unit_price`):**
  $$\text{unit\_price} = \text{base\_price (según medida)} + \sum \text{price\_modifiers (marco, acabado, extras)}$$
