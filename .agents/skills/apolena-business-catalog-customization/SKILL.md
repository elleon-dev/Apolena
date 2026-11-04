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
  - `slug`: Identificador URL único (ej. `"personalized-wall-art"`).
  - `description`: Descripción detallada.
  - `base_price`: Precio base en Soles (`PEN`, `Decimal(10, 2)`).
  - `status`: `"active" | "inactive" | "archived"`.
  - `stock`: Stock disponible o capacidad operativa.
  - `specifications`: JSONB con especificaciones técnicas (ej. resolución 300 DPI, materiales base).
  - `customization_config`: JSONB extensible que define las opciones personalizables soportadas por el producto (tamaños, estilos/temáticas, acabados, **marcos / frames**, etc.) y sus modificadores de precio (`price_modifier`).
- **`ProductImage` (`@@map("product_images")`)**:
  - Galería de imágenes de muestra del producto (`product_id`, `url`, `position`, `alt_text`).

---

## 2. Flujo de Personalización con IA (Retrato de Mascota)

1. **Carga de Fotografía de Mascota:** El usuario sube la foto de su mascota (1 o 2 mascotas).
2. **Selección de Personaje o Temática:** El usuario escoge un personaje/temática del catálogo de Apolena o sube una referencia personalizada.
3. **Generación de Fusión IA (`generation_jobs`):** Se genera el retrato artístico fusionando la mascota con la temática elegida.
4. **Selección de Variantes y Configuración del Producto:**
   - El usuario escoge la imagen fusionada resultante (`selected_image_url` / `generation_job_id`).
   - Elige las opciones del producto (Tamaño del cuadro, acabado y, cuando esté habilitado, tipo/color de **marco**).

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
