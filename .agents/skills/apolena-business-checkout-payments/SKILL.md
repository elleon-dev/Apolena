---
name: apolena-business-checkout-payments
description: Reglas de Negocio Oficiales para el Checkout, Esquema de Pago Total 100% al Ordenar, Métodos de Pago (Yape, Plin, Transferencia Bancaria) y Registro de Transacciones (payment_transactions) en Apolena.
---

# 💳 Reglas de Negocio Oficiales: Checkout y Pago 100% al Ordenar en Apolena

Este skill define la lógica financiera y de checkout inalterable de Apolena, basada en el modelo de **pago único del 100% al confirmar el pedido** (sin cobros pendientes contraentrega).

> [!IMPORTANT]
> **REGLA DE GUARDIA:** Si algún cambio solicitado por el usuario requiere modificar las reglas de este skill, el agente DEBE emitir una alerta explícita informando que se está alterando la lógica de negocio establecida y solicitar confirmación antes de aplicar el cambio.

---

## 1. Flujo de Checkout del Comprador

Una vez que el usuario genera y selecciona el retrato de su mascota:

1. **Llenado Libre y Autenticación con Redirección Fluida:**
   - Para maximizar la conversión y comodidad del usuario, el comprador puede completar todos los datos de delivery y método de pago (100% del pedido) sin bloqueos iniciales.
   - Al hacer clic en **"Confirmar Orden"**:
     - Si el usuario **ya está autenticado**, la orden se procesa directamente en `/api/orders`.
     - Si el usuario **no está autenticado**, todos sus datos ingresados se guardan de forma segura en `localStorage` (`apolena_pending_checkout`) y se le redirige a `/auth/login` o `/auth/register` con parámetro `callbackUrl=/checkout?pendingOrder=true` (prellenando su correo, nombre y teléfono).
     - Al completar su inicio de sesión o registro, regresa automáticamente a `/checkout`, donde todos sus datos son restaurados instantáneamente para que confirme su orden con un solo clic.
   - En el backend, `/api/orders` responde con `401 Unauthorized` si no existe una sesión válida de `Profile`, garantizando que ninguna orden se cree sin un usuario real y verificado.
2. **Datos de Contacto y Ubicación para Delivery (`order_shippings`):**
   - Se solicita: Nombre completo (`name`), Teléfono/WhatsApp (`phone`), Email (`email`), Dirección exacta (`address`), Departamento (`department`), Provincia (`province`), Distrito / Ciudad (`district`), Referencia de ubicación (`reference`) y Documento (`document_type`: DNI/CE/RUC, `document_number`). Pre-llenados automáticamente con los datos del perfil activo.
   - **Mapa Interactivo con Pin Exacto (`DeliveryMapPicker`):** Incluye un mapa interactivo (con vista Satélite + Calles y Mapa de Calles, buscador de dirección, geolocalización GPS y auto-centrado por distrito) donde el usuario puede colocar o arrastrar un pin en su puerta exacta. Las coordenadas se guardan directamente en las columnas relacionales de PostgreSQL `order_shippings` (`latitude`, `longitude`, `map_url`), además de respaldarse en `customizations.delivery_location` y `order_shippings.reference`, mostrándose tanto al comprador (`/checkout`, `/orders`, `/track/[trackingId]`, email `order_created_buyer`) como al administrador (`/dashboard`, `EditOrderModal`, email `order_created_admin`).
3. **Datos de Comprobante (`order_invoices`):**
   - Selección de Boleta o Factura con sus datos respectivos.
4. **Cálculo de Importes en la Orden (`orders`) y Cupones de Descuento (`src/lib/coupons.ts`):**
   - `subtotal`: Suma de los `order_items`.
   - `discount_amount` (opcional vía cupón en `platform_settings.DISCOUNT_COUPONS`):
     - Soporta cupones por **porcentaje (`percentage`, 1%–100%)** o **monto fijo (`fixed`, S/)**, con controles opcionales de pedido mínimo (`minOrderAmount`), límite de usos (`maxUses` / `usedCount`), fecha de vencimiento (`expiresAt`) y estado `isActive`.
     - Validación en vivo en `POST /api/coupons/validate` (disponible en Estudio IA Paso 3 y `/checkout`, sincronizado vía `apolena_checkout_draft`).
     - **Validación autoritativa en servidor:** Al emitir la orden (`POST /api/orders` → `createOrderWithSplitPayment`), el backend revalida el cupón contra PostgreSQL, aplica el descuento, guarda el snapshot en `order_items.customizations.coupon` e incrementa `usedCount`.
     - **Órdenes de Cortesía (Cupón 100% / Total S/ 0.00):** Cuando el cupón cubre el 100% del total (`total_amount === 0`), `/checkout` oculta el bloque de Yape/Plin/Transferencia y no exige subir voucher; el servidor crea la orden en estado logístico `pending` con `payment_status = "paid_full"` y `payment_transactions[0].status = "verified"` (`verified_by = "Sistema (Cupón 100%)"`), lista para que el administrador revise el arte y despache a fabricación.
     - Gestión completa para administradores en `GET/POST/PATCH/DELETE /api/admin/coupons` y pestaña dedicada **`Cupones`** en `/dashboard` (`src/components/AdminCouponsTab.tsx`).
   - `shipping_cost`: Costo de delivery según ubicación (obtenido de `platform_settings`; Lima Metropolitana = S/ 0.00 incluido, Provincias = S/ 20.00).
   - `total_amount`: $\max(0,\; \text{subtotal} - \text{discount\_amount} + \text{shipping\_cost})$.
   - `advance_amount`: $\text{total\_amount}$ (**100% del total** a pagar al confirmar la orden).
   - `remaining_amount`: $0$ (sin saldos pendientes contraentrega).

---

## 2. Métodos de Pago Soportados (`payment_method`)

Todos los pagos operan bajo modalidad verificable al confirmar el pedido usando exclusivamente:

- `yape`: Pago vía Yape (Número de celular y titular configurados en `platform_settings`).
- `plin`: Pago vía Plin (Número de celular y titular configurados en `platform_settings`).
- `bank_transfer`: Transferencia bancaria (Banco, Número de Cuenta, Código de Cuenta Interbancario `cci` y Nombre del Titular `holder_name` configurados por separado en `platform_settings`).

En el checkout (`/checkout`), cada dato se muestra en bloques interactivos individuales con botones de copiado rápido al portapapeles para evitar errores de digitación del comprador.

---

## 3. Ciclo de Pagos y Tabla `payment_transactions`

Cada nueva orden tiene un ciclo financiero de **pago único del 100%** respaldado en la tabla `payment_transactions` (manteniendo compatibilidad retroactiva en lectura y gestión para órdenes históricas creadas con `remaining_amount > 0`):

### Pago Único del 100% al Ordenar (`payment_stage = "advance_50"`)

- Al generar la orden en el checkout, el usuario abona el **100% del total** (`advance_amount = total_amount`, `remaining_amount = 0`) con Yape, Plin o Transferencia Bancaria.
- Se crea un registro en `payment_transactions` con:
  - `order_id`: ID de la orden.
  - `payment_stage`: `"advance_50"` (se conserva el identificador interno para mantener 100% compatibilidad de esquema y consultas con órdenes históricas).
  - `payment_method`: `"yape" | "plin" | "bank_transfer"`.
  - `amount`: Monto equivalente al **100% del total** (`total_amount`).
  - `operation_number`: Número de operación ingresado por el cliente (opcional).
  - `proof_image_url`: Captura o voucher de pago (requerido en checkout; visible con zoom y descarga para los administradores en `/dashboard`).
  - `status`: `"pending_verification"` (o `"verified"` una vez validado por el Admin).
- Estado de pago en `orders.payment_status`:
  - Inicia en `"partial_pending"` (Pago por verificar) al enviar la orden.
  - Cuando el Admin valida el pago (`verify_advance_50`), como `remaining_amount === 0`, `orders.payment_status` pasa automáticamente a **`"paid_full"` (100% Pagado)**.
- **Compatibilidad Retroactiva (Órdenes Históricas 50%/50%):**
  - Si una orden antigua posee `remaining_amount > 0`, la interfaz y `updateOrderAdminLifecycle` siguen mostrando el saldo pendiente y permitiendo la verificación en dos etapas (`partial_paid` → `paid_full` con `final_50`) sin errores ni pérdida de datos.
