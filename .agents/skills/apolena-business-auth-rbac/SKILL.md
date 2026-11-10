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
  2. **Proveedor Google OAuth (vía Supabase Auth):** El botón _"Continuar con Google"_ en `/auth/login` y `/auth/register` inicia `supabaseBrowser.auth.signInWithOAuth({ provider: "google" })`, redirige a `/auth/callback` y sincroniza el perfil (`email`, `name`, `avatar_url` y `role`) mediante `POST /api/auth/oauth/google` y `upsertOAuthProfile`.
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
   - **Acceso Total:** Posee control absoluto sobre el Dashboard Administrativo (`/dashboard` y `/admin`), gestión de órdenes, gestión de **todos** los usuarios y roles (`user`, `admin`, `super_admin`) y edición de la configuración global de Apolena (`platform_settings` y catálogo `products`).

2. **`admin` (Administrador de Apolena):**
   - Rol para el equipo administrativo y operativo de Apolena.
   - Tiene acceso al Dashboard Administrativo (`/dashboard` y `/admin`) para:
     - **Gestionar Órdenes:** Validar pagos del 50% inicial y del 50% contraentrega, avanzar los 3 steps logísticos (`manufacturing` → `in_transit` → `delivered` → `completed`) y consultar `email_queue`.
     - **Gestionar Usuarios (`user` y `admin`):** Puede crear y editar usuarios con roles `user` y `admin` (`/api/admin/users`), pero **NO** puede asignar el rol `super_admin` ni modificar cuentas con rol `super_admin`.
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
| `/dashboard`, `/dashboard/*`, `/admin`, `/admin/*` | **Dashboard Privado Exclusivo (`admin` y `super_admin`)** | Si no está autenticado → redirige a `/auth/login`. Si está autenticado con `role === "user"` → redirige a `/orders` (código 403 en `/api/admin/*`).                                                           |

---

## 4. Aislamiento de Datos en la Vista Común de Órdenes (`/orders`)

- En todas las consultas de `/orders` y `/api/orders` (modo cliente), las consultas **DEBEN** filtrar obligatoriamente por el `user_id` o `email` del usuario en sesión.
- Un usuario con rol `user` jamás puede listar ni modificar órdenes pertenecientes a otro comprador.
