---
name: apolena-business-rules
description: Protocolo Central y Colección de Skills de Lógica de Negocio de Apolena. OBLIGATORIO consultar antes de realizar cualquier cambio funcional, de base de datos o arquitectónico en la plataforma.
---

# 🛡️ Protocolo Principal de Lógica de Negocio en Apolena

Este skill es la **referencia central e inalterable** para el desarrollo de funcionalidades, base de datos y refactorizaciones en **Apolena** (Plataforma de Productos Personalizados para Mascotas).

> [!CAUTION]
> **REGLA DE GUARDIA OBLIGATORIA DE CAMBIOS DE NEGOCIO:**
> Antes de realizar cualquier modificación en el código, el agente DEBE consultar los skills de negocio aplicables.
> Si una solicitud o cambio requiere modificar o romper alguna regla contenida en estos skills, el agente **NO DEBE APLICAR EL CAMBIO AUTOMÁTICAMENTE**.
> En su lugar, DEBE emitir una **alerta explícita al usuario** indicando:
>
> 1. Qué regla de negocio se estaría modificando.
> 2. Por qué el cambio solicitado afecta la lógica establecida.
> 3. Solicitar la aprobación explícita del usuario para actualizar el skill y la lógica de negocio.

---

## 📚 Skills de Dominio de Negocio Disponibles

### 🔐 Dominio 1: Autenticación, Perfiles y Control de Acceso (RBAC)

1. **`apolena-business-auth-rbac`:**
   - Autenticación persistida con Prisma (`profiles`).
   - Dos roles oficiales: `user` (comprador/cliente) y `admin` (administrador de Apolena).
   - Rutas privadas protegidas por Middleware y validación server-side:
     - `/dashboard/*`: Panel privado para todos los usuarios autenticados (`user` y `admin`) donde consultan sus retratos, órdenes y seguimiento.
     - `/admin/*`: Panel privado **exclusivo** para `role === "admin"`. Invisible e inaccesible para usuarios con rol `user`.

---

### 🎨 Dominio 2: Catálogo Escalable, Fusión IA y Personalizaciones Extensibles

2. **`apolena-business-catalog-customization`:**
   - Tablas centrales: `products`, `product_images`, `generation_jobs`.
   - Producto inicial: **Cuadros Personalizados para Mascotas** (`slug: "personalized-wall-art"`).
   - Flujo del producto:
     1. Usuario sube foto(s) de su mascota.
     2. Selecciona personaje/temática (o sube referencia propia) y genera la fusión con IA.
     3. Escoge la obra generada y configura las opciones del producto.
   - **Arquitectura Extensible de Personalización:**
     - `products.customization_schema` (JSONB) define los grupos de opciones disponibles para ese tipo de producto (ej. hoy: `size` [XL, L, M, Square, S] y `finish_mode` [lienzo completo, con paspartú]; mañana: `frame_style` [Marco de Madera Roble, Marco Negro Mate, Marco Dorado, Sin Marco], dedicatoria, etc.).
     - `order_items.customizations` (JSONB) congela el snapshot exacto de las personalizaciones elegidas + `generation_job_id` + `generated_image_url` + recargos adicionales por personalización (`frame_price`, `size_price`).

---

### 💳 Dominio 3: Checkout y Pagos Fraccionados 50% / 50%

3. **`apolena-business-checkout-payments`:**
   - Tablas centrales: `orders`, `payment_transactions`, `platform_settings`.
   - **Regla de Pago 50% / 50% (Adelanto + Contraentrega):**
     - **Primer Pago (50% de Adelanto al crear la orden):** El usuario abona el `50%` del `total_amount` mediante **Yape**, **Plin** o **Transferencia Bancaria** (`yape`, `plin`, `bank_transfer`) adjuntando código de operación y/o captura de comprobante.
     - **Segundo Pago (50% Restante Contraentrega):** El usuario abona el `50%` restante al momento de recibir el producto físicamente en su domicilio.
   - Toda transacción queda registrada en `payment_transactions` indicando su etapa (`payment_stage: "advance_50" | "final_50"`), método, monto y estado de verificación.

---

### 🚚 Dominio 4: Logística, Tracking ID y Máquina de Estados (3 Pasos + Cierre Exitoso)

4. **`apolena-business-logistics-tracking`:**
   - Tablas centrales: `orders`, `order_shippings`, `order_packages`, `order_items`.
   - **Tracking ID Único (`tracking_id`):** Cada orden genera un código único de seguimiento público y amigable (ej. `APO-2026-XXXXXX`) con el cual el usuario puede rastrear su pedido en tiempo real.
   - **Flujo de Tracking en 3 Pasos Operativos + Culminación Exitosa:**
     1. **Paso 1 — Fabricación (`manufacturing`):** El cuadro personalizado está en impresión 300 DPI, enmarcado y control de calidad.
     2. **Paso 2 — En Camino (`in_transit`):** El paquete ha salido del taller hacia la dirección de delivery del cliente.
     3. **Paso 3 — Entregado (`delivered`):** El producto fue entregado en manos del cliente.
   - **Culminación del Proceso (`completed` / Exitoso):**
     - Una vez entregado el producto (`delivered`) y confirmado el pago del **50% restante** contraentrega (`payment_status = "paid_full"`), el estatus de la orden cambia a **`completed` ("Exitoso")**, culminando el ciclo de vida de la orden.

---

### 📧 Dominio 5: Notificaciones por Email, Facturación, Reseñas y Configuración

5. **`apolena-business-notifications-invoicing`:**
   - Tablas centrales: `email_queue`, `order_invoices`, `reviews`, `platform_settings`.
   - **Doble Notificación Obligatoria al Crear Orden:**
     1. Email al **Usuario comprador** confirmando su orden exitosa, resumen del 50% abonado, saldo pendiente contraentrega y su `tracking_id`.
     2. Email a los **Administradores** notificando la nueva orden, archivo HD para fabricación, datos de contacto/ubicación y comprobante del 50% inicial.
   - Todos los correos se encolan en `email_queue` con soporte de reintentos (`attempts`, `max_attempts`, `last_error`).
