---
name: apolena-business-checkout-payments
description: Reglas de Negocio Oficiales para el Checkout, Esquema de Pago 50% Adelanto + 50% Contraentrega, Métodos de Pago (Yape, Plin, Transferencia Bancaria) y Registro de Transacciones (payment_transactions) en Apolena.
---

# 💳 Reglas de Negocio Oficiales: Checkout y Pagos 50% / 50% en Apolena

Este skill define la lógica financiera y de checkout inalterable de Apolena, basada en el modelo de **50% de adelanto al confirmar el pedido** y **50% restante contraentrega** al recibir el producto.

> [!IMPORTANT]
> **REGLA DE GUARDIA:** Si algún cambio solicitado por el usuario requiere modificar las reglas de este skill, el agente DEBE emitir una alerta explícita informando que se está alterando la lógica de negocio establecida y solicitar confirmación antes de aplicar el cambio.

---

## 1. Flujo de Checkout del Comprador

Una vez que el usuario genera y selecciona el retrato de su mascota:

1. **Datos de Contacto y Ubicación para Delivery (`order_shippings`):**
   - Se solicita: Nombre completo (`name`), Teléfono/WhatsApp (`phone`), Email (`email`), Dirección exacta (`address`), Departamento (`department`), Provincia (`province`), Distrito (`district`), Referencia de ubicación (`reference`) y Documento (`document_type`: DNI/CE/RUC, `document_number`).
2. **Datos de Comprobante (`order_invoices`):**
   - Selección de Boleta o Factura con sus datos respectivos.
3. **Cálculo de Importes en la Orden (`orders`):**
   - `subtotal`: Suma de los `order_items`.
   - `shipping_cost`: Costo de delivery según ubicación (obtenido de `platform_settings`).
   - `total_amount`: $\text{subtotal} + \text{shipping\_cost}$.
   - `advance_amount`: $\text{round}(\text{total\_amount} \times 0.50, 2)$ (**50% del total** a pagar para iniciar fabricación).
   - `remaining_amount`: $\text{total\_amount} - \text{advance\_amount}$ (**50% restante** a pagar contraentrega al recibir el producto).

---

## 2. Métodos de Pago Soportados (`payment_method`)

Por el momento, todos los pagos operan bajo modalidad manual verificable / contraentrega usando exclusivamente:

- `yape`: Pago vía Yape (QR / Número configurado en `platform_settings`).
- `plin`: Pago vía Plin (QR / Número configurado en `platform_settings`).
- `bank_transfer`: Transferencia bancaria (BCP, Interbank, BBVA, CCI configurados en `platform_settings`).

---

## 3. Ciclo de Pagos y Tabla `payment_transactions`

Cada orden tiene un ciclo financiero de **2 pagos (50% + 50%)** respaldados en la tabla `payment_transactions`:

### Etapa 1 — Pago del 50% de Adelanto (`payment_stage = "advance_50"`)

- Al generar la orden en el checkout, el usuario abona el **50% del total** (`advance_amount`) con Yape, Plin o Transferencia Bancaria.
- Se crea un registro en `payment_transactions` con:
  - `order_id`: ID de la orden.
  - `payment_stage`: `"advance_50"`.
  - `payment_method`: `"yape" | "plin" | "bank_transfer"`.
  - `amount`: Monto equivalente al 50% inicial.
  - `reference_code` / `operation_number`: Número de operación ingresado por el cliente.
  - `proof_image_url`: Captura o voucher de pago (opcional/recomendado).
  - `status`: `"pending_verification"` (o `"verified"` una vez validado por el Admin).
- Estado de pago en `orders.payment_status`:
  - Inicia en `"partial_pending"` al enviar la orden, y pasa a `"partial_paid"` (50% pagado) cuando el Admin valida el adelanto.

### Etapa 2 — Pago del 50% Restante Contraentrega (`payment_stage = "final_50"`)

- Una vez que el pedido llega al paso **Entregado (`delivered`)**, el usuario completa el **otro 50%** (`remaining_amount`) al recibir el producto (vía Yape, Plin o Transferencia).
- Se registra la segunda transacción en `payment_transactions` con `payment_stage = "final_50"`, `amount = remaining_amount` y `status = "verified"`.
- Estado de pago en `orders.payment_status` pasa a `"paid_full"` (100% pagado).
- En ese instante, el estatus general de la orden (`orders.status`) cambia automáticamente a **`completed` ("Exitoso")**, culminando el proceso.
