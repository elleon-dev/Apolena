---
name: apolena-business-auth-rbac
description: Reglas de Negocio Oficiales para Autenticación con Prisma, Perfiles de Usuario (profiles), Roles (user vs admin) y Protección de Rutas Privadas (/dashboard y /admin) en Apolena. Usar antes de modificar cualquier flujo de login, registro, sesión o middleware.
---

# 🔐 Reglas de Negocio Oficiales: Autenticación, Perfiles y RBAC en Apolena

Este skill define la lógica de negocio inalterable para la autenticación gestionada con Prisma, el modelo `Profile` (`profiles`) y el control de acceso basado en roles (RBAC) en Apolena.

> [!IMPORTANT]
> **REGLA DE GUARDIA:** Si algún cambio solicitado por el usuario requiere modificar las reglas de este skill, el agente DEBE emitir una alerta explícita informando que se está alterando la lógica de negocio establecida y solicitar confirmación antes de aplicar el cambio.

---

## 1. Modelo de Perfil (`profiles`) y Autenticación con Prisma

- La tabla `profiles` es la entidad central de identidad en la base de datos gestionada por Prisma.
- Campos clave de `Profile` (`@@map("profiles")`):
  - `id`: UUID (`@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`).
  - `email`: Único (`@unique`).
  - `password_hash`: Hash seguro (`bcrypt` / `scrypt`) para autenticación con credenciales, compatible también con proveedores OAuth / Supabase Auth.
  - `name`, `phone`, `avatar_url`, `location`, `address`, `department`, `province`, `district`.
  - `role`: Rol de acceso en la plataforma (`"user"` por defecto, o `"admin"`).
  - `is_active`: Booleano (`default(true)`).
  - `created_at`, `updated_at`.

---

## 2. Jerarquía de Roles (`Profile.role`)

1. **`user` (Cliente / Comprador):**
   - Rol asignado por defecto a todo usuario registrado en Apolena.
   - Puede crear retratos con IA, generar órdenes de compra, subir comprobantes de pago, consultar sus órdenes en su panel privado (`/dashboard/*`) y dejar reseñas (`reviews`) de órdenes completadas.
   - **Prohibición estricta:** No tiene visibilidad de enlaces hacia `/admin` ni acceso a ninguna ruta `/admin/*` o endpoint `/api/admin/*`.

2. **`admin` (Administrador de Apolena):**
   - Rol reservado al equipo administrativo y operativo de Apolena.
   - Tiene acceso completo al Panel de Administración (`/admin/*`) además de las vistas de usuario.
   - Puede gestionar órdenes, validar pagos del 50% inicial y del 50% contraentrega, avanzar los estados de fabricación/envío/entrega (`manufacturing` → `in_transit` → `delivered` → `completed`), gestionar catálogo (`products`, `product_images`, personalizaciones/marcos), revisar `email_queue` y editar `platform_settings`.

---

## 3. Matriz de Rutas Privadas y Públicas

| Ruta / Prefijo | Acceso | Comportamiento si no cumple |
| :--- | :--- | :--- |
| `/`, `/products/*`, `/track/*` | **Público** | Accesible para cualquier visitante (permite explorar, probar fusión y rastrear por `tracking_id`). |
| `/auth/login`, `/auth/register` | **Público (Solo invitados)** | Si ya tiene sesión activa, redirige a `/dashboard` (o `/admin` si es administrador). |
| `/dashboard`, `/dashboard/*` | **Privado (`user` y `admin`)** | Si no está autenticado, redirige a `/auth/login?callbackUrl=...`. Muestra las órdenes, tracking y retratos del propio usuario. |
| `/admin`, `/admin/*` | **Privado Exclusivo (`admin`)** | Si no está autenticado → redirige a `/auth/login`. Si está autenticado con `role === "user"` → redirige a `/dashboard` (código 403 en `/api/admin/*`). |

---

## 4. Aislamiento de Datos en el Dashboard de Usuario

- En todas las consultas de `/dashboard/*` y `/api/orders` (modo cliente), las consultas Prisma **DEBEN** filtrar obligatoriamente por `buyer_id: session.user.id`.
- Un usuario con rol `user` jamás puede listar ni modificar órdenes pertenecientes a otro `buyer_id`.
