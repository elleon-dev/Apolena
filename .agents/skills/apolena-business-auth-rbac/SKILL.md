---
name: apolena-business-auth-rbac
description: Reglas de Negocio Oficiales para Autenticación con Prisma, Perfiles de Usuario (profiles), Roles (user, admin y super_admin), Vista Común de Órdenes (/orders) y Dashboard Privado de Administración (/dashboard y /admin) en Apolena. Usar antes de modificar cualquier flujo de login, registro, sesión o middleware.
---

# 🔐 Reglas de Negocio Oficiales: Autenticación, Perfiles y RBAC en Apolena

Este skill define la lógica de negocio inalterable para la autenticación gestionada con Prisma, el modelo `Profile` (`profiles`), la vista común de órdenes (`/orders`) y el control de acceso basado en roles (RBAC) en el Dashboard Administrativo (`/dashboard`) de Apolena.

> [!IMPORTANT]
> **REGLA DE GUARDIA:** Si algún cambio solicitado por el usuario requiere modificar las reglas de este skill, el agente DEBE emitir una alerta explícita informando que se está alterando la lógica de negocio establecida y solicitar confirmación antes de aplicar el cambio.

---

## 1. Modelo de Perfil (`profiles`) y Autenticación con Prisma + Google OAuth

- La tabla `profiles` es la entidad central de identidad en la base de datos gestionada por Prisma.
- Soporta dos modalidades de inicio de sesión que convergen en la misma sesión firmada (`apolena_session`) y en `public.profiles`:
  1. **Credenciales (Correo + Contraseña):** `/api/auth/login` y `/api/auth/register`.
  2. **Proveedor Google OAuth 2.0 Directo (`www.apolena.shop`):** El botón _"Continuar con Google"_ en `/auth/login` y `/auth/register` inicia el flujo OAuth 2.0 directo en `GET /api/auth/google` (con cookie `httpOnly` de estado anti-CSRF y marca verificada de Apolena en Google Cloud), recibe el retorno en `GET /api/auth/google/callback`, exige `email_verified === true` en Google OpenID Connect y sincroniza/vincula el perfil en `public.profiles` mediante `upsertOAuthProfile` sin sobrescribir `password_hash`, `name` ni `avatar_url` personalizados (permitiendo acceso dual con contraseña y Google sobre la misma cuenta) y emite la cookie firmada `apolena_session`.
- **Recuperación Segura de Contraseña:** Flujo con token criptográfico HMAC SHA-256 (`signPasswordResetToken` / `verifyPasswordResetToken` con TTL de 60 min) enviado a la cola `email_queue` (`template: "password_reset"`), procesado en `/auth/forgot-password`, `/auth/reset-password` y `/api/auth/reset-password`.
- **Autenticación Obligatoria en Checkout:** Queda prohibida la generación de órdenes anónimas o la creación silenciosa de cuentas con contraseñas por defecto (`"cliente123"`). Todo comprador debe identificarse o registrarse previamente en `/checkout` antes de emitir la orden en `/api/orders`.
- **Sincronización en Tiempo Real de Roles y Cookie de Sesión (`getAuthoritativeSessionUser` + `/api/auth/me` + `middleware.ts`):**
  - Cuando un usuario cambia de rol en PostgreSQL (`user` ↔ `admin` ↔ `super_admin`), su acceso se actualiza de forma **inmediata** sin requerir cerrar sesión:
    - `GET /api/auth/me` consulta siempre PostgreSQL en tiempo real y, si el rol, ID o nombre difiere del token en la cookie `apolena_session`, re-firma y actualiza automáticamente la cookie `Set-Cookie: apolena_session=...`.
    - `src/middleware.ts` verifica en tiempo real contra `/api/auth/me` en navegaciones a `/dashboard`, `/admin` o cuando el token en cookie aún indica `"user"`, propagando la nueva cookie `Set-Cookie` para evitar redirecciones erróneas a `/orders`.
    - Todas las rutas `/api/admin/*` y `/api/orders` utilizan `getAuthoritativeSessionUser()` (`src/lib/db-service.ts`), resolviendo el rol y estado `is_active` directamente desde PostgreSQL en cada petición.
- Campos clave de `Profile` (`@@map("profiles")`):
  - `id`: UUID (`@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`).
  - `email`: Único (`@unique`).
  - `password_hash`: Hash seguro (`SHA-256` con salt + `AUTH_SECRET`) para autenticación con credenciales (o `null` cuando el usuario ingresa exclusivamente con Google OAuth).
  - `name`, `phone`, `avatar_url`, `address`, `department`, `province`, `district`.
  - `role`: Rol de acceso en la plataforma (`"user"` por defecto, `"admin"` o `"super_admin"`).
  - `is_active`: Booleano (`default(true)`).
  - `created_at`, `updated_at`.

---

## 2. Jerarquía de Roles (`Profile.role`) y Permisos Granulares

1. **`super_admin` (Super Administrador — `nmoriano26@gmail.com`):**
   - **Regla Inalterable:** El usuario con el correo electrónico **`nmoriano26@gmail.com`** **SIEMPRE** debe tener el rol **`"super_admin"`** y `is_active: true` (se asigna y sincroniza de forma automática e irrevocable en `resolveUserRole`, registro, login, Google OAuth, checkout y seed).
   - **Acceso Total:** Posee control absoluto sobre el Dashboard Administrativo (`/dashboard` y `/admin`), gestión de órdenes, gestión de **todos** los usuarios y roles (`user`, `admin`, `super_admin`), **eliminación definitiva de usuarios** (`DELETE /api/admin/users` — exclusivo de `super_admin`, prohibido eliminar cuentas `super_admin`) y edición de la configuración global de Apolena (`platform_settings` y catálogo `products`).

2. **`admin` (Administrador de Apolena):**
   - Rol para el equipo administrativo y operativo de Apolena.
   - Tiene acceso al Dashboard Administrativo (`/dashboard` y `/admin`) para:
     - **Gestionar Órdenes:** Validar el pago total del 100%, despachar órdenes pagadas al proveedor de fabricación, avanzar los 3 steps logísticos (`manufacturing` → `in_transit` → `delivered` → `completed`) y consultar `email_queue`.
     - **Gestionar Usuarios (`user` y `admin`):** Puede crear y editar usuarios con roles `user` y `admin` (`/api/admin/users`), pero **NO** puede asignar el rol `super_admin`, modificar cuentas con rol `super_admin` ni eliminar usuarios definitivamente.
     - **Configuración de Apolena:** Visualización en modo lectura de `platform_settings` (la edición de parámetros globales y cuentas receptoras está reservada a `super_admin`).

3. **`user` (Cliente / Comprador):**
   - Rol asignado por defecto a cualquier otro usuario registrado en Apolena.
   - Puede crear retratos con IA, generar órdenes de compra, subir comprobantes de pago, visualizar sus órdenes y su estado con steps en la **vista común `/orders`** y dejar reseñas (`reviews`) de órdenes completadas.
   - **Prohibición estricta:** No tiene acceso al Dashboard Administrativo (`/dashboard/*` ni `/admin/*`) ni a `/api/admin/*`.

---

## 3. Matriz de Rutas Privadas y Públicas

| Ruta / Prefijo                                     | Acceso                                                    | Comportamiento si no cumple                                                                                                                                                                                   |
| :------------------------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`, `/products/*`, `/track/*`                     | **Público**                                               | Accesible para cualquier visitante (permite explorar, probar fusión y rastrear por `tracking_id`).                                                                                                            |
| `/auth/login`, `/auth/register`                    | **Público (Solo invitados)**                              | Si ya tiene sesión activa, redirige a `/dashboard` (si es `admin` o `super_admin`) o a `/orders` (si es `user`).                                                                                              |
| `/orders`, `/orders/*`                             | **Vista Común Privada (`user`, `admin`, `super_admin`)**  | Si no está autenticado, redirige a `/auth/login?callbackUrl=/orders`. Permite a todo tipo de usuario visualizar sus órdenes, buscar por `tracking_id` y seguir el progreso en los 3 steps + estado `Exitoso`. |
| `/profile`, `/api/account`                         | **Perfil Privado del Usuario (`user`, `admin`, `super_admin`)** | Si no está autenticado, redirige a `/auth/login?callbackUrl=/profile`. Permite actualizar datos personales, dirección predeterminada de envío, foto de perfil (`uploads/` en Supabase Storage, máx. 3 MB, sin incrustar `data:` en la cookie JWT) y darse de baja voluntariamente (excepto `super_admin`). |
| `/dashboard`, `/dashboard/*`, `/admin`, `/admin/*` | **Dashboard Privado Exclusivo (`admin` y `super_admin`)** | Si no está autenticado → redirige a `/auth/login`. Si está autenticado con `role === "user"` → redirige a `/orders` (código 403 en `/api/admin/*`).                                                           |

---

## 4. Aislamiento de Datos en `/orders` y Eliminación Segura Reutilizable de Cuentas (`deleteUserAccountAndData`)

- En todas las consultas de `/orders` y `/api/orders` (modo cliente), las consultas **DEBEN** filtrar obligatoriamente por el `user_id` o `email` del usuario en sesión.
- Un usuario con rol `user` jamás puede listar ni modificar órdenes pertenecientes a otro comprador.
- **Servicio Centralizado de Eliminación Segura (`src/lib/user-deletion.ts`):**
  - Reutilizado tanto por **`DELETE /api/admin/users`** (exclusivo `super_admin`) como por **`DELETE /api/account`** (baja voluntaria del usuario en `/profile` escribiendo `ELIMINAR`).
  - Las cuentas `super_admin` están protegidas contra eliminación y auto-eliminación.
  - **Regla de Integridad de BD:** Dentro de `prisma.$transaction`, elimina únicamente registros filtrados estrictamente por `user_id`, `buyer_id`, `order_id` propios y `email` (case-insensitive) en `reviews`, `payment_transactions`, `order_items`, `order_packages`, `order_invoices`, `order_shippings`, `orders`, `generation_jobs`, `email_queue`, `newsletter_subscribers` y `profiles`.
  - **Regla de Integridad de Storage:** Solo puede borrar archivos de Supabase Storage bajo la lista blanca de prefijos de usuario (`pets/`, `previews/`, `artworks/`, `proofs/`, `uploads/`) — **nunca** `characters/`, `products/`, `frames/` o `watermarks/` — y ejecuta una **verificación cruzada previa** en `generation_jobs`, `order_items`, `payment_transactions` y `profiles` para asegurar que ningún otro usuario ni registro restante referencie la URL antes de eliminarla.

---

## 5. Seguridad a Nivel de Filas en Supabase (Row Level Security - RLS)

Todas las 15 tablas del esquema `public` tienen activado `ROW LEVEL SECURITY = true` y 30 políticas granulares:

1. **Acceso de Servicio Backend (`service_role` / Prisma):** Acceso total (`FOR ALL`) reservado al backend y Prisma.
2. **Catálogo Público (`products`, `product_images`, `character_templates`, `reviews`, `platform_settings`):** Lectura pública (`SELECT`) para visitantes (`anon` y `authenticated`).
3. **Suscripción (`newsletter_subscribers`):** Permiso de inserción pública (`INSERT`).
4. **Datos Protegidos de Usuarios (`profiles`, `orders`, `order_items`, `order_packages`, `order_shippings`, `order_invoices`, `payment_transactions`, `generation_jobs`):**
   - Lectura y actualización estrictamente restringida al propietario mediante `auth.uid() = buyer_id` o `auth.uid() = id`.
   - Bloqueado de forma absoluta para consultas anónimas directas desde PostgREST.
5. **Colas Confidenciales (`email_queue`):** Bloqueo total para clientes; acceso restringido exclusivamente a `service_role`.
