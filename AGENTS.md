# 🛡️ Guía Global de Agentes e Inmutabilidad de Reglas de Negocio en Apolena

Este archivo define las directrices obligatorias para **CUALQUIER MODELO DE IA** (Gemini, Claude, GPT, etc.) que trabaje en la plataforma **Apolena** (E-commerce de Productos Personalizados para Mascotas con IA).

---

## 📌 Protocolo de Consulta Obligatoria de Skills

Antes de realizar cualquier investigación, refactorización, creación o modificación de código en este repositorio, la IA **DEBE** consultar obligatoriamente los skills ubicados en la carpeta `.agents/skills/`:

1. **Protocolo Maestro:**
   - [`apolena-business-rules`](.agents/skills/apolena-business-rules/SKILL.md): Protocolo de Guardia Inalterable y listado maestro de dominios de negocio.
   - [`apolena-engineering-standards`](.agents/skills/apolena-engineering-standards/SKILL.md): Estándar de desarrollo de 9 fases, auto-auditoría exhaustiva, código limpio, reutilización, consistencia con Prisma y verificación automatizada.

2. **Skills de Dominio de Negocio:**
   - [`apolena-business-auth-rbac`](.agents/skills/apolena-business-auth-rbac/SKILL.md): Autenticación con Prisma, Perfiles (`profiles`), Roles (`user` / `admin`) y Rutas Privadas (`/dashboard`, `/admin`).
   - [`apolena-business-catalog-customization`](.agents/skills/apolena-business-catalog-customization/SKILL.md): Catálogo Escalable (`products`, `product_images`), Fusión IA (`generation_jobs`) y Arquitectura Extensible de Personalizaciones (tamaños, acabados, marcos futuros y nuevos productos).
   - [`apolena-business-checkout-payments`](.agents/skills/apolena-business-checkout-payments/SKILL.md): Checkout, Modalidad 50% Adelanto + 50% Contraentrega, Métodos de Pago (`yape`, `plin`, `bank_transfer`) y Transacciones (`payment_transactions`).
   - [`apolena-business-logistics-tracking`](.agents/skills/apolena-business-logistics-tracking/SKILL.md): Ciclo de Vida de la Orden, `tracking_id`, 3 Pasos Logísticos (`manufacturing` → `in_transit` → `delivered`) y Cierre Exitoso (`completed`) tras el pago del 50% restante.
   - [`apolena-business-notifications-invoicing`](.agents/skills/apolena-business-notifications-invoicing/SKILL.md): Cola de Correos (`email_queue`) al Usuario y Administradores, Comprobantes (`order_invoices`), Reseñas (`reviews`) y Configuración Dinámica (`platform_settings`).

---

## 🚨 Regla de Guardia Inalterable

Si una solicitud requiere alterar o romper alguna regla de negocio plasmada en los skills anteriores, la IA **NO DEBE APLICAR EL CAMBIO AUTOMÁTICAMENTE**. En su lugar, emitirá una alerta explícita informando el impacto en la lógica de negocio y solicitará confirmación previa al usuario.

---

## 🔄 Protocolo de Sincronización Obligatoria de Skills (Post-Cambio / Commit)

Ninguna tarea o ciclo de desarrollo se considera terminado sin ejecutar la **sincronización de skills**:

1. **Si se modificó o amplió un dominio existente:**
   - La IA **DEBE** actualizar inmediatamente el archivo `SKILL.md` del dominio correspondiente en `.agents/skills/` reflejando fórmulas, estados, columnas o contratos nuevos.
2. **Si se creó un nuevo dominio de negocio o módulo (ej. nuevo tipo de producto o pasarela):**
   - La IA **DEBE** crear la carpeta `.agents/skills/apolena-business-[nuevo-dominio]/SKILL.md` con su frontmatter YAML, descripción, reglas inalterables y registrarlo en este `AGENTS.md` y en `apolena-business-rules/SKILL.md`.
3. **Si el cambio fue meramente visual / cosmético:**
   - No se requiere modificar skills.
