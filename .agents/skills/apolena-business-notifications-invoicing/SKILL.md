---
name: apolena-business-notifications-invoicing
description: Reglas de Negocio Oficiales para la Cola de Emails (email_queue), Notificaciones a Usuario y Administradores, Comprobantes (order_invoices), Reseñas (reviews) y Configuración de Plataforma (platform_settings) en Apolena.
---

# 📧 Reglas de Negocio Oficiales: Notificaciones, Facturación, Reseñas y Configuración en Apolena

Este skill define las reglas para las notificaciones transaccionales vía `email_queue`, facturación en `order_invoices`, reseñas en `reviews` y parámetros dinámicos en `platform_settings`.

> [!IMPORTANT]
> **REGLA DE GUARDIA:** Si algún cambio solicitado por el usuario requiere modificar las reglas de este skill, el agente DEBE emitir una alerta explícita informando que se está alterando la lógica de negocio establecida y solicitar confirmación antes de aplicar el cambio.

---

## 1. Cola de Correos (`email_queue`) y Notificaciones Obligatorias

Toda notificación por correo electrónico se registra primero en la tabla `email_queue` (`to_email`, `subject`, `template`, `data`, `cc`, `status`, `attempts`, `max_attempts`, `last_error`) y se despacha de forma resiliente:

1. **Al Crearse una Orden (Doble Notificación Obligatoria):**
   - **Email 1 — Al Usuario Comprador (`template = "order_created_buyer"`):**
     - Confirma que su orden ha sido generada exitosamente.
     - Incluye la miniatura/enlace de su cuadro personalizado, el monto del 50% inicial, el saldo del 50% contraentrega, la dirección de envío y su **`tracking_id`** con enlace directo para rastrear los 3 pasos (`Fabricación` → `En camino` → `Entregado`).
   - **Email 2 — A los Administradores (`template = "order_created_admin"`):**
     - Se envía al correo de administración configurado en `platform_settings` (y/o usuarios con `role = "admin"`).
     - Incluye todos los detalles del cliente, teléfono/WhatsApp, dirección de delivery, opciones de personalización (tamaño, acabado, marco), imagen HD para impresión, método de pago elegido (`yape`, `plin`, `bank_transfer`) y enlace directo al Panel Admin (`/admin/orders/[id]`).

2. **Al Cambiar el Estado del Tracking (`template = "order_status_updated"`):**
   - Notifica al comprador cuando su pedido avanza a **En camino (`in_transit`)**, **Entregado (`delivered`)** y cuando culmina como **Exitoso (`completed`)** tras abonar el 50% final.

---

## 2. Comprobantes de Pago (`order_invoices`)

- Relación 1:1 inmutable con `orders` (`order_id @unique`).
- Soporta:
  - `type`: `"boleta"` (con DNI) o `"factura"` (con RUC, `legal_name` y `tax_address`).
  - `sunat_status`: `"pending" | "submitted" | "accepted" | "rejected"`.
  - `sunat_pdf_url`: Enlace al PDF del comprobante emitido.

---

## 3. Reseñas de Clientes (`reviews`)

- Un usuario comprador (`buyer_id`) puede registrar una reseña (`rating` de 1 a 5, `comment` e imagen opcional del cuadro recibido con su mascota) asociada a su `order_id` y `product_id` una vez que la orden alcance los estados `delivered` o `completed`.
- Restricción de unicidad: `@@unique([buyer_id, order_id, product_id])`.

---

## 4. Configuración Dinámica (`platform_settings`)

- Ningún dato operativo cambiante debe estar hardcodeado en el frontend o backend.
- Claves estándar en `platform_settings`:
  - `PAYMENT_METHODS_CONFIG`: Números de celular titulares de **Yape** y **Plin**, configuración bancaria con campos desagregados (**Banco / Moneda**, **Número de Cuenta**, **Código de Cuenta Interbancario `cci`** y **Nombre Completo del Titular `holder_name`**), y porcentaje de adelanto (`advance_percentage: 0.50`). Estos datos alimentan dinámicamente las tarjetas de pago con copiado en `/checkout`, las transacciones en `payment_transactions` y el email `order_created_buyer`.
  - `SHIPPING_RATES_CONFIG`: Tarifas de delivery por Lima Metropolitana / Provincias y tiempo estimado de fabricación.
  - `ADMIN_NOTIFICATION_EMAILS`: Lista de correos de los administradores que reciben alertas de nuevas órdenes.
