import fs from "fs";
import path from "path";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { PRINT_PRESETS, FRAME_OPTIONS } from "@/lib/print-export";
import { dispatchEmailWithResend } from "@/lib/email-service";

export type OrderStatus =
  | "manufacturing"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "partial_pending"
  | "partial_paid"
  | "paid_full"
  | "refunded";

export type PaymentMethod = "yape" | "plin" | "bank_transfer";

export type PaymentStage = "advance_50" | "final_50";

export interface ProfileRecord {
  id: string;
  email: string;
  password_hash: string | null;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCustomizationConfig {
  sizes: typeof PRINT_PRESETS;
  frames: typeof FRAME_OPTIONS;
  finishes: Array<{
    id: "full-bleed" | "museum-matte";
    name: string;
    description: string;
    priceModifierPen: number;
  }>;
}

export interface ProductRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  base_price: number;
  status: "active" | "inactive" | "archived";
  stock: number;
  specifications: Record<string, any>;
  customization_config: ProductCustomizationConfig;
  images: Array<{
    id: string;
    product_id: string;
    url: string;
    alt_text: string | null;
    position: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface OrderItemCustomizations {
  theme_id: string;
  theme_name: string;
  size_id: string;
  size_label: string;
  cm_dimensions: string;
  dpi: number;
  finish_mode: "full-bleed" | "museum-matte";
  finish_label: string;
  frame_id: string;
  frame_name: string;
  frame_price_pen: number;
  pet_count: number;
  notes?: string | null;
}

export interface OrderRecord {
  id: string;
  order_code: string;
  tracking_id: string;
  buyer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  advance_amount: number;
  remaining_amount: number;
  notes: string | null;
  manufacturing_started_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  shipping: {
    id: string;
    order_id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string;
    department: string | null;
    province: string | null;
    district: string | null;
    reference: string | null;
    document_type: string | null;
    document_number: string | null;
  } | null;
  invoice: {
    id: string;
    order_id: string;
    type: "boleta" | "factura";
    doc_type: string | null;
    number: string | null;
    legal_name: string | null;
    tax_address: string | null;
    sunat_status: string | null;
    sunat_pdf_url: string | null;
  } | null;
  packages: Array<{
    id: string;
    order_id: string;
    package_number: number;
    total_packages: number;
    status: OrderStatus;
    courier: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier_phone: string | null;
    estimated_delivery: string | null;
    destination_address: string | null;
    subtotal: number;
    items: Array<{
      id: string;
      package_id: string;
      product_id: string;
      generation_job_id: string | null;
      quantity: number;
      unit_price: number;
      subtotal: number;
      status: string;
      pet_photo_url: string | null;
      generated_art_url: string | null;
      customizations: OrderItemCustomizations;
    }>;
  }>;
  paymentTransactions: Array<{
    id: string;
    order_id: string;
    payment_stage: PaymentStage;
    payment_method: PaymentMethod;
    status: "pending_verification" | "verified" | "rejected";
    amount: number;
    currency: string;
    operation_number: string | null;
    proof_image_url: string | null;
    payer_name: string | null;
    payer_phone: string | null;
    notes: string | null;
    verified_by: string | null;
    verified_at: string | null;
    created_at: string;
  }>;
  reviews: Array<{
    id: string;
    product_id: string;
    buyer_id: string;
    order_id: string | null;
    rating: number;
    comment: string | null;
    photo_url: string | null;
    created_at: string;
  }>;
}

export interface EmailQueueRecord {
  id: string;
  to_email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  cc: string[];
  status: "pending" | "sent" | "failed";
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettingsMap {
  PAYMENT_METHODS_CONFIG: {
    advance_percentage: number;
    yape: {
      enabled: boolean;
      phone: string;
      holder_name: string;
      qr_url: string;
    };
    plin: {
      enabled: boolean;
      phone: string;
      holder_name: string;
      qr_url: string;
    };
    bank_transfer: {
      enabled: boolean;
      bank_name: string;
      account_number: string;
      cci: string;
      holder_name: string;
      ruc: string;
    };
  };
  SHIPPING_RATES_CONFIG: {
    lima_metropolitana_pen: number;
    provincias_pen: number;
    estimated_manufacturing_days: string;
  };
  ADMIN_NOTIFICATION_EMAILS: {
    emails: string[];
    whatsapp_support: string;
  };
}

interface LocalDbState {
  profiles: ProfileRecord[];
  products: ProductRecord[];
  orders: OrderRecord[];
  platform_settings: PlatformSettingsMap;
  email_queue: EmailQueueRecord[];
}

const LOCAL_DB_PATH = path.join(process.cwd(), ".apolena-dev-db.json");

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsMap = {
  PAYMENT_METHODS_CONFIG: {
    advance_percentage: 0.5,
    yape: {
      enabled: true,
      phone: "987 654 321",
      holder_name: "APOLENA STUDIO SAC",
      qr_url: "/samples/cat-suit.jpg",
    },
    plin: {
      enabled: true,
      phone: "987 654 321",
      holder_name: "APOLENA STUDIO SAC",
      qr_url: "/samples/cat-suit.jpg",
    },
    bank_transfer: {
      enabled: true,
      bank_name: "BCP Soles",
      account_number: "191-98451234-0-42",
      cci: "002-191009845123404251",
      holder_name: "APOLENA STUDIO SAC",
      ruc: "20612345678",
    },
  },
  SHIPPING_RATES_CONFIG: {
    lima_metropolitana_pen: 15,
    provincias_pen: 25,
    estimated_manufacturing_days: "3 a 5 días hábiles",
  },
  ADMIN_NOTIFICATION_EMAILS: {
    emails: ["admin@apolena.pe", "produccion@apolena.pe"],
    whatsapp_support: "+51 987 654 321",
  },
};

export const DEFAULT_WALL_ART_PRODUCT: ProductRecord = {
  id: "00000000-0000-4000-8000-000000000101",
  title: "Cuadro Artístico Personalizado para Mascota",
  slug: "personalized-wall-art",
  description:
    "Retrato de alta definición a 300 DPI fusionando a tu mascota con personajes históricos, realeza o temáticas personalizadas, impreso sobre lienzo de algodón de museo.",
  category: "wall_art",
  base_price: 100,
  status: "active",
  stock: 999,
  specifications: {
    dpi: 300,
    canvas_material: "Lienzo Fine Art Algodón 380g",
    ink: "Pigmentos minerales resistentes UV por 80+ años",
    customizable_frame: true,
  },
  customization_config: {
    sizes: PRINT_PRESETS,
    frames: FRAME_OPTIONS,
    finishes: [
      {
        id: "full-bleed",
        name: "Lienzo Completo (Full Bleed)",
        description: "La obra cubre de borde a borde todo el cuadro",
        priceModifierPen: 0,
      },
      {
        id: "museum-matte",
        name: "Con Paspartú de Galería (Museum Matte)",
        description: "Margen blanco museo alrededor de la obra principal",
        priceModifierPen: 0,
      },
    ],
  },
  images: [
    {
      id: "00000000-0000-4000-8000-000000000201",
      product_id: "00000000-0000-4000-8000-000000000101",
      url: "/samples/cat-suit.jpg",
      alt_text: "Cuadro Personalizado Mascota Ejecutivo",
      position: 0,
    },
    {
      id: "00000000-0000-4000-8000-000000000202",
      product_id: "00000000-0000-4000-8000-000000000101",
      url: "/samples/dog-sample.jpg",
      alt_text: "Muestra Retrato Perro",
      position: 1,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function createInitialLocalState(): Promise<LocalDbState> {
  const adminPasswordHash = await hashPassword("admin123", "apolenaadmin");
  const userPasswordHash = await hashPassword("cliente123", "apolenauser");
  const now = new Date().toISOString();

  const adminProfile: ProfileRecord = {
    id: "00000000-0000-4000-8000-000000000001",
    email: "admin@apolena.pe",
    password_hash: adminPasswordHash,
    name: "Administrador Apolena",
    phone: "987654321",
    avatar_url: null,
    role: "admin",
    address: "Av. Primavera 1240, Santiago de Surco",
    department: "Lima",
    province: "Lima",
    district: "Santiago de Surco",
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const demoUserProfile: ProfileRecord = {
    id: "00000000-0000-4000-8000-000000000002",
    email: "cliente@apolena.pe",
    password_hash: userPasswordHash,
    name: "Valeria Mendoza",
    phone: "999888777",
    avatar_url: null,
    role: "user",
    address: "Calle Los Pinos 450 Dpto 302, Miraflores",
    department: "Lima",
    province: "Lima",
    district: "Miraflores",
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const sampleOrderId = "00000000-0000-4000-8000-000000000501";
  const samplePackageId = "00000000-0000-4000-8000-000000000601";

  const sampleOrder: OrderRecord = {
    id: sampleOrderId,
    order_code: "ORD-2026-0001",
    tracking_id: "APO-2026-849201",
    buyer_id: demoUserProfile.id,
    status: "manufacturing",
    payment_status: "partial_paid",
    payment_method: "yape",
    subtotal: 215,
    shipping_cost: 15,
    tax_amount: 0,
    total_amount: 230,
    advance_amount: 115,
    remaining_amount: 115,
    notes: "Por favor resaltar el brillo de los ojos de mi gatito.",
    manufacturing_started_at: now,
    shipped_at: null,
    delivered_at: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
    shipping: {
      id: "00000000-0000-4000-8000-000000000701",
      order_id: sampleOrderId,
      name: "Valeria Mendoza",
      phone: "999888777",
      email: "cliente@apolena.pe",
      address: "Calle Los Pinos 450 Dpto 302",
      department: "Lima",
      province: "Lima",
      district: "Miraflores",
      reference: "Frente al Parque Reducto, edificio ladrillo visto",
      document_type: "DNI",
      document_number: "72849102",
    },
    invoice: {
      id: "00000000-0000-4000-8000-000000000801",
      order_id: sampleOrderId,
      type: "boleta",
      doc_type: "DNI",
      number: "72849102",
      legal_name: "Valeria Mendoza",
      tax_address: "Calle Los Pinos 450 Dpto 302, Miraflores",
      sunat_status: "pending",
      sunat_pdf_url: null,
    },
    packages: [
      {
        id: samplePackageId,
        order_id: sampleOrderId,
        package_number: 1,
        total_packages: 1,
        status: "manufacturing",
        courier: "Apolena Express Lima",
        tracking_number: "APO-2026-849201",
        tracking_url: "/track/APO-2026-849201",
        carrier_phone: "987 654 321",
        estimated_delivery: new Date(
          Date.now() + 4 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        destination_address: "Calle Los Pinos 450 Dpto 302, Miraflores, Lima",
        subtotal: 215,
        items: [
          {
            id: "00000000-0000-4000-8000-000000000901",
            package_id: samplePackageId,
            product_id: DEFAULT_WALL_ART_PRODUCT.id,
            generation_job_id: null,
            quantity: 1,
            unit_price: 215,
            subtotal: 215,
            status: "manufacturing",
            pet_photo_url: "/samples/cat-sample.jpg",
            generated_art_url: "/samples/cat-suit.jpg",
            customizations: {
              theme_id: "inca-emperor",
              theme_name: "Sapa Inca del Tahuantinsuyo",
              size_id: "lg-40x50",
              size_label: "Grande (L) · 40 × 50 cm",
              cm_dimensions: "40 × 50 cm",
              dpi: 300,
              finish_mode: "museum-matte",
              finish_label: "Con Paspartú de Galería",
              frame_id: "frame-oak",
              frame_name: "Marco de Madera Roble Natural",
              frame_price_pen: 35,
              pet_count: 1,
              notes: "Con marco de roble natural",
            },
          },
        ],
      },
    ],
    paymentTransactions: [
      {
        id: "00000000-0000-4000-8000-000000000951",
        order_id: sampleOrderId,
        payment_stage: "advance_50",
        payment_method: "yape",
        status: "verified",
        amount: 115,
        currency: "PEN",
        operation_number: "YAPE-492819",
        proof_image_url: null,
        payer_name: "Valeria Mendoza",
        payer_phone: "999888777",
        notes: "Adelanto del 50% validado para iniciar fabricación",
        verified_by: adminProfile.id,
        verified_at: now,
        created_at: now,
      },
    ],
    reviews: [],
  };

  return {
    profiles: [adminProfile, demoUserProfile],
    products: [DEFAULT_WALL_ART_PRODUCT],
    orders: [sampleOrder],
    platform_settings: DEFAULT_PLATFORM_SETTINGS,
    email_queue: [],
  };
}

export async function readLocalDb(): Promise<LocalDbState> {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      const parsed = JSON.parse(raw) as LocalDbState;
      if (parsed && Array.isArray(parsed.profiles)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Recreating local fallback DB:", err);
  }
  const initial = await createInitialLocalState();
  writeLocalDb(initial);
  return initial;
}

export function writeLocalDb(state: LocalDbState): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local DB:", err);
  }
}

export function generateTrackingId(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `APO-${year}-${randomDigits}`;
}

export function generateOrderCode(sequence: number): string {
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(sequence).padStart(4, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════════
// PROFILES & AUTHENTICATION REPOSITORY (Prisma + Local Fallback)
// ═══════════════════════════════════════════════════════════════════════

export async function findProfileByEmail(
  email: string,
): Promise<ProfileRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (isDatabaseConfigured()) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { email: cleanEmail },
      });
      if (profile) {
        return {
          ...profile,
          role: profile.role === "admin" ? "admin" : "user",
          created_at: profile.created_at.toISOString(),
          updated_at: profile.updated_at.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Prisma findProfileByEmail fallback:", e);
    }
  }
  const db = await readLocalDb();
  return (
    db.profiles.find((p) => p.email.toLowerCase() === cleanEmail) || null
  );
}

export async function findProfileById(
  id: string,
): Promise<ProfileRecord | null> {
  if (isDatabaseConfigured()) {
    try {
      const profile = await prisma.profile.findUnique({ where: { id } });
      if (profile) {
        return {
          ...profile,
          role: profile.role === "admin" ? "admin" : "user",
          created_at: profile.created_at.toISOString(),
          updated_at: profile.updated_at.toISOString(),
        };
      }
    } catch (e) {
      console.warn("Prisma findProfileById fallback:", e);
    }
  }
  const db = await readLocalDb();
  return db.profiles.find((p) => p.id === id) || null;
}

export async function createProfile(input: {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role?: "user" | "admin";
}): Promise<ProfileRecord> {
  const cleanEmail = input.email.trim().toLowerCase();
  const role = input.role === "admin" ? "admin" : "user";

  if (isDatabaseConfigured()) {
    try {
      const created = await prisma.profile.create({
        data: {
          email: cleanEmail,
          password_hash: input.passwordHash,
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          role,
        },
      });
      return {
        ...created,
        role: created.role === "admin" ? "admin" : "user",
        created_at: created.created_at.toISOString(),
        updated_at: created.updated_at.toISOString(),
      };
    } catch (e) {
      console.warn("Prisma createProfile fallback:", e);
    }
  }

  const db = await readLocalDb();
  const now = new Date().toISOString();
  const newProfile: ProfileRecord = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    password_hash: input.passwordHash,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    avatar_url: null,
    role,
    address: null,
    department: null,
    province: null,
    district: null,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
  db.profiles.push(newProfile);
  writeLocalDb(db);
  return newProfile;
}

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTS & SETTINGS REPOSITORY
// ═══════════════════════════════════════════════════════════════════════

export async function getProducts(
  onlyActive = true,
): Promise<ProductRecord[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.product.findMany({
        where: onlyActive ? { status: "active" } : undefined,
        include: { images: { orderBy: { position: "asc" } } },
        orderBy: { created_at: "asc" },
      });
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          description: r.description,
          category: r.category,
          base_price: Number(r.base_price),
          status: r.status as "active" | "inactive" | "archived",
          stock: r.stock,
          specifications: (r.specifications as Record<string, any>) || {},
          customization_config:
            (r.customization_config as unknown as ProductCustomizationConfig) ||
            DEFAULT_WALL_ART_PRODUCT.customization_config,
          images: r.images.map((img) => ({
            id: img.id,
            product_id: img.product_id,
            url: img.url,
            alt_text: img.alt_text,
            position: img.position,
          })),
          created_at: r.created_at.toISOString(),
          updated_at: r.updated_at.toISOString(),
        }));
      }
    } catch (e) {
      console.warn("Prisma getProducts fallback:", e);
    }
  }
  const db = await readLocalDb();
  return onlyActive
    ? db.products.filter((p) => p.status === "active")
    : db.products;
}

export async function updateProductCustomizationConfig(
  productId: string,
  updates: Partial<{
    title: string;
    description: string;
    base_price: number;
    stock: number;
    customization_config: ProductCustomizationConfig;
  }>,
): Promise<ProductRecord | null> {
  if (isDatabaseConfigured()) {
    try {
      await prisma.product.update({
        where: { id: productId },
        data: {
          title: updates.title,
          description: updates.description,
          base_price: updates.base_price,
          stock: updates.stock,
          customization_config: updates.customization_config as any,
        },
      });
    } catch (e) {
      console.warn("Prisma updateProductCustomizationConfig fallback:", e);
    }
  }
  const db = await readLocalDb();
  const idx = db.products.findIndex((p) => p.id === productId);
  if (idx === -1) return null;
  db.products[idx] = {
    ...db.products[idx],
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.description !== undefined
      ? { description: updates.description }
      : {}),
    ...(updates.base_price !== undefined
      ? { base_price: updates.base_price }
      : {}),
    ...(updates.stock !== undefined ? { stock: updates.stock } : {}),
    ...(updates.customization_config !== undefined
      ? { customization_config: updates.customization_config }
      : {}),
    updated_at: new Date().toISOString(),
  };
  writeLocalDb(db);
  return db.products[idx];
}

export async function getPlatformSettings(): Promise<PlatformSettingsMap> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.platformSetting.findMany();
      if (rows.length > 0) {
        const merged = { ...DEFAULT_PLATFORM_SETTINGS };
        for (const row of rows) {
          if (row.key in merged) {
            (merged as any)[row.key] = row.value;
          }
        }
        return merged;
      }
    } catch (e) {
      console.warn("Prisma getPlatformSettings fallback:", e);
    }
  }
  const db = await readLocalDb();
  return db.platform_settings || DEFAULT_PLATFORM_SETTINGS;
}

export async function updatePlatformSettings(
  partial: Partial<PlatformSettingsMap>,
  updatedBy?: string,
): Promise<PlatformSettingsMap> {
  if (isDatabaseConfigured()) {
    try {
      for (const [key, value] of Object.entries(partial)) {
        if (value) {
          await prisma.platformSetting.upsert({
            where: { key },
            update: { value: value as any, updated_by: updatedBy || null },
            create: {
              key,
              value: value as any,
              category: "general",
              updated_by: updatedBy || null,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Prisma updatePlatformSettings fallback:", e);
    }
  }
  const db = await readLocalDb();
  db.platform_settings = {
    ...db.platform_settings,
    ...partial,
  };
  writeLocalDb(db);
  return db.platform_settings;
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL QUEUE REPOSITORY & NOTIFICATION DISPATCHER
// ═══════════════════════════════════════════════════════════════════════

export async function enqueueEmail(input: {
  to_email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  cc?: string[];
}): Promise<EmailQueueRecord> {
  const now = new Date().toISOString();
  const dispatchResult = await dispatchEmailWithResend({
    to: input.to_email,
    cc: input.cc,
    subject: input.subject,
    template: input.template,
    data: input.data,
  });

  const record: EmailQueueRecord = {
    id: crypto.randomUUID(),
    to_email: input.to_email,
    subject: input.subject,
    template: input.template,
    data: input.data,
    cc: input.cc || [],
    status: dispatchResult.sent ? "sent" : "failed",
    attempts: 1,
    max_attempts: 3,
    last_error: dispatchResult.error || null,
    created_at: now,
    updated_at: now,
  };

  if (isDatabaseConfigured()) {
    try {
      await prisma.emailQueue.create({
        data: {
          id: record.id,
          to_email: record.to_email,
          subject: record.subject,
          template: record.template,
          data: record.data as any,
          cc: record.cc,
          status: record.status,
          attempts: record.attempts,
          max_attempts: record.max_attempts,
        },
      });
    } catch (e) {
      console.warn("Prisma enqueueEmail fallback:", e);
    }
  }

  const db = await readLocalDb();
  db.email_queue.unshift(record);
  writeLocalDb(db);
  return record;
}

export async function getEmailQueue(limit = 50): Promise<EmailQueueRecord[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.emailQueue.findMany({
        orderBy: { created_at: "desc" },
        take: limit,
      });
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          to_email: r.to_email,
          subject: r.subject,
          template: r.template,
          data: (r.data as Record<string, any>) || {},
          cc: r.cc,
          status: r.status as "pending" | "sent" | "failed",
          attempts: r.attempts,
          max_attempts: r.max_attempts,
          last_error: r.last_error,
          created_at: r.created_at.toISOString(),
          updated_at: r.updated_at.toISOString(),
        }));
      }
    } catch (e) {
      console.warn("Prisma getEmailQueue fallback:", e);
    }
  }
  const db = await readLocalDb();
  return db.email_queue.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════
// ORDERS, 50/50 PAYMENTS & 3-STEP LOGISTICS TRACKING
// ═══════════════════════════════════════════════════════════════════════

function mapPrismaOrderToRecord(o: any): OrderRecord {
  return {
    id: o.id,
    order_code: o.order_code,
    tracking_id: o.tracking_id,
    buyer_id: o.buyer_id,
    status: o.status as OrderStatus,
    payment_status: o.payment_status as PaymentStatus,
    payment_method: o.payment_method as PaymentMethod,
    subtotal: Number(o.subtotal),
    shipping_cost: Number(o.shipping_cost),
    tax_amount: Number(o.tax_amount),
    total_amount: Number(o.total_amount),
    advance_amount: Number(o.advance_amount),
    remaining_amount: Number(o.remaining_amount),
    notes: o.notes,
    manufacturing_started_at:
      o.manufacturing_started_at?.toISOString?.() ||
      o.manufacturing_started_at ||
      null,
    shipped_at: o.shipped_at?.toISOString?.() || o.shipped_at || null,
    delivered_at: o.delivered_at?.toISOString?.() || o.delivered_at || null,
    completed_at: o.completed_at?.toISOString?.() || o.completed_at || null,
    created_at: o.created_at?.toISOString?.() || o.created_at,
    updated_at: o.updated_at?.toISOString?.() || o.updated_at,
    shipping: o.shipping || null,
    invoice: o.invoice || null,
    packages: (o.packages || []).map((pkg: any) => ({
      ...pkg,
      subtotal: Number(pkg.subtotal),
      estimated_delivery:
        pkg.estimated_delivery?.toISOString?.() ||
        pkg.estimated_delivery ||
        null,
      items: (pkg.items || []).map((it: any) => ({
        ...it,
        unit_price: Number(it.unit_price),
        subtotal: Number(it.subtotal),
      })),
    })),
    paymentTransactions: (o.paymentTransactions || []).map((pt: any) => ({
      ...pt,
      amount: Number(pt.amount),
      verified_at: pt.verified_at?.toISOString?.() || pt.verified_at || null,
      created_at: pt.created_at?.toISOString?.() || pt.created_at,
    })),
    reviews: (o.reviews || []).map((rev: any) => ({
      ...rev,
      created_at: rev.created_at?.toISOString?.() || rev.created_at,
    })),
  };
}

export async function createOrderWithSplitPayment(input: {
  buyer_id: string;
  product_id?: string;
  generation_job_id?: string | null;
  pet_photo_url?: string | null;
  generated_art_url: string;
  quantity?: number;
  unit_price: number;
  shipping_cost: number;
  payment_method: PaymentMethod;
  operation_number: string;
  proof_image_url?: string | null;
  notes?: string | null;
  customizations: OrderItemCustomizations;
  shipping: {
    name: string;
    phone: string;
    email: string;
    address: string;
    department: string;
    province: string;
    district: string;
    reference?: string;
    document_type?: string;
    document_number?: string;
  };
  invoice: {
    type: "boleta" | "factura";
    doc_type: string;
    number: string;
    legal_name?: string;
    tax_address?: string;
  };
}): Promise<OrderRecord> {
  const db = await readLocalDb();
  const settings = await getPlatformSettings();
  const quantity = Math.max(1, input.quantity || 1);
  const subtotal = Number((input.unit_price * quantity).toFixed(2));
  const shippingCost = Number(input.shipping_cost.toFixed(2));
  const totalAmount = Number((subtotal + shippingCost).toFixed(2));

  // Regla de Negocio Inalterable: 50% de adelanto + 50% contraentrega
  const advanceAmount = Number((totalAmount * 0.5).toFixed(2));
  const remainingAmount = Number((totalAmount - advanceAmount).toFixed(2));

  const orderCode = generateOrderCode(db.orders.length + 1);
  const trackingId = generateTrackingId();
  const now = new Date().toISOString();
  const estimatedDelivery = new Date(
    Date.now() + 4 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const orderId = crypto.randomUUID();
  const packageId = crypto.randomUUID();
  const productId = input.product_id || DEFAULT_WALL_ART_PRODUCT.id;

  const newOrder: OrderRecord = {
    id: orderId,
    order_code: orderCode,
    tracking_id: trackingId,
    buyer_id: input.buyer_id,
    status: "manufacturing",
    payment_status: "partial_pending",
    payment_method: input.payment_method,
    subtotal,
    shipping_cost: shippingCost,
    tax_amount: 0,
    total_amount: totalAmount,
    advance_amount: advanceAmount,
    remaining_amount: remainingAmount,
    notes: input.notes || null,
    manufacturing_started_at: now,
    shipped_at: null,
    delivered_at: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
    shipping: {
      id: crypto.randomUUID(),
      order_id: orderId,
      name: input.shipping.name.trim(),
      phone: input.shipping.phone.trim(),
      email: input.shipping.email.trim(),
      address: input.shipping.address.trim(),
      department: input.shipping.department.trim(),
      province: input.shipping.province.trim(),
      district: input.shipping.district.trim(),
      reference: input.shipping.reference?.trim() || null,
      document_type: input.shipping.document_type || "DNI",
      document_number: input.shipping.document_number?.trim() || null,
    },
    invoice: {
      id: crypto.randomUUID(),
      order_id: orderId,
      type: input.invoice.type,
      doc_type: input.invoice.doc_type,
      number: input.invoice.number.trim(),
      legal_name:
        input.invoice.legal_name?.trim() || input.shipping.name.trim(),
      tax_address:
        input.invoice.tax_address?.trim() || input.shipping.address.trim(),
      sunat_status: "pending",
      sunat_pdf_url: null,
    },
    packages: [
      {
        id: packageId,
        order_id: orderId,
        package_number: 1,
        total_packages: 1,
        status: "manufacturing",
        courier: "Apolena Express Delivery",
        tracking_number: trackingId,
        tracking_url: `/track/${trackingId}`,
        carrier_phone:
          settings.ADMIN_NOTIFICATION_EMAILS.whatsapp_support || "987 654 321",
        estimated_delivery: estimatedDelivery,
        destination_address: `${input.shipping.address}, ${input.shipping.district}, ${input.shipping.department}`,
        subtotal,
        items: [
          {
            id: crypto.randomUUID(),
            package_id: packageId,
            product_id: productId,
            generation_job_id: input.generation_job_id || null,
            quantity,
            unit_price: input.unit_price,
            subtotal,
            status: "manufacturing",
            pet_photo_url: input.pet_photo_url || null,
            generated_art_url: input.generated_art_url,
            customizations: input.customizations,
          },
        ],
      },
    ],
    paymentTransactions: [
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        payment_stage: "advance_50",
        payment_method: input.payment_method,
        status: "pending_verification",
        amount: advanceAmount,
        currency: "PEN",
        operation_number: input.operation_number.trim(),
        proof_image_url: input.proof_image_url || null,
        payer_name: input.shipping.name.trim(),
        payer_phone: input.shipping.phone.trim(),
        notes: "Pago inicial del 50% al confirmar pedido",
        verified_by: null,
        verified_at: null,
        created_at: now,
      },
    ],
    reviews: [],
  };

  if (isDatabaseConfigured()) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            id: newOrder.id,
            order_code: newOrder.order_code,
            tracking_id: newOrder.tracking_id,
            buyer_id: newOrder.buyer_id,
            status: newOrder.status,
            payment_status: newOrder.payment_status,
            payment_method: newOrder.payment_method,
            subtotal: newOrder.subtotal,
            shipping_cost: newOrder.shipping_cost,
            tax_amount: newOrder.tax_amount,
            total_amount: newOrder.total_amount,
            advance_amount: newOrder.advance_amount,
            remaining_amount: newOrder.remaining_amount,
            notes: newOrder.notes,
            shipping: newOrder.shipping
              ? {
                  create: {
                    name: newOrder.shipping.name,
                    phone: newOrder.shipping.phone,
                    email: newOrder.shipping.email,
                    address: newOrder.shipping.address,
                    department: newOrder.shipping.department,
                    province: newOrder.shipping.province,
                    district: newOrder.shipping.district,
                    reference: newOrder.shipping.reference,
                    document_type: newOrder.shipping.document_type,
                    document_number: newOrder.shipping.document_number,
                  },
                }
              : undefined,
            invoice: newOrder.invoice
              ? {
                  create: {
                    type: newOrder.invoice.type,
                    doc_type: newOrder.invoice.doc_type,
                    number: newOrder.invoice.number,
                    legal_name: newOrder.invoice.legal_name,
                    tax_address: newOrder.invoice.tax_address,
                    sunat_status: "pending",
                  },
                }
              : undefined,
            packages: {
              create: {
                id: packageId,
                package_number: 1,
                total_packages: 1,
                status: "manufacturing",
                courier: "Apolena Express Delivery",
                tracking_number: trackingId,
                tracking_url: `/track/${trackingId}`,
                destination_address: `${input.shipping.address}, ${input.shipping.district}`,
                subtotal,
                items: {
                  create: {
                    product_id: productId,
                    generation_job_id: input.generation_job_id || null,
                    quantity,
                    unit_price: input.unit_price,
                    subtotal,
                    status: "manufacturing",
                    pet_photo_url: input.pet_photo_url || null,
                    generated_art_url: input.generated_art_url,
                    customizations: input.customizations as any,
                  },
                },
              },
            },
            paymentTransactions: {
              create: {
                payment_stage: "advance_50",
                payment_method: input.payment_method,
                status: "pending_verification",
                amount: advanceAmount,
                currency: "PEN",
                operation_number: input.operation_number.trim(),
                proof_image_url: input.proof_image_url || null,
                payer_name: input.shipping.name.trim(),
                payer_phone: input.shipping.phone.trim(),
                notes: "Pago inicial del 50% al confirmar pedido",
              },
            },
          },
        });
      });
    } catch (e) {
      console.warn("Prisma createOrderWithSplitPayment fallback:", e);
    }
  }

  db.orders.unshift(newOrder);
  writeLocalDb(db);

  // Doble notificación obligatoria en email_queue:
  // 1. Al comprador confirmando su orden y su tracking_id
  await enqueueEmail({
    to_email: input.shipping.email,
    subject: `¡Tu orden ${orderCode} en Apolena está en Fabricación! · Tracking: ${trackingId}`,
    template: "order_created_buyer",
    data: {
      order_code: orderCode,
      tracking_id: trackingId,
      buyer_name: input.shipping.name,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      payment_method: input.payment_method,
      customizations: input.customizations,
      tracking_url: `/track/${trackingId}`,
    },
  });

  // 2. A los administradores notificando la nueva orden y el comprobante del 50%
  const adminEmails = settings.ADMIN_NOTIFICATION_EMAILS.emails;
  await enqueueEmail({
    to_email: adminEmails[0] || "admin@apolena.pe",
    cc: adminEmails.slice(1),
    subject: `[NUEVA ORDEN APOLENA] ${orderCode} · S/ ${totalAmount.toFixed(2)} (Adelanto 50%: S/ ${advanceAmount.toFixed(2)})`,
    template: "order_created_admin",
    data: {
      order_id: orderId,
      order_code: orderCode,
      tracking_id: trackingId,
      buyer_name: input.shipping.name,
      buyer_phone: input.shipping.phone,
      buyer_email: input.shipping.email,
      shipping_address: `${input.shipping.address}, ${input.shipping.district}, ${input.shipping.department}`,
      payment_method: input.payment_method,
      operation_number: input.operation_number,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      customizations: input.customizations,
    },
  });

  return newOrder;
}

export async function getOrdersByBuyer(
  buyerId: string,
): Promise<OrderRecord[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.order.findMany({
        where: { buyer_id: buyerId },
        include: {
          shipping: true,
          invoice: true,
          packages: { include: { items: true } },
          paymentTransactions: true,
          reviews: true,
        },
        orderBy: { created_at: "desc" },
      });
      if (rows.length > 0) {
        return rows.map(mapPrismaOrderToRecord);
      }
    } catch (e) {
      console.warn("Prisma getOrdersByBuyer fallback:", e);
    }
  }
  const db = await readLocalDb();
  return db.orders.filter((o) => o.buyer_id === buyerId);
}

export async function getAllOrdersForAdmin(): Promise<OrderRecord[]> {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.order.findMany({
        include: {
          shipping: true,
          invoice: true,
          packages: { include: { items: true } },
          paymentTransactions: true,
          reviews: true,
        },
        orderBy: { created_at: "desc" },
      });
      if (rows.length > 0) {
        return rows.map(mapPrismaOrderToRecord);
      }
    } catch (e) {
      console.warn("Prisma getAllOrdersForAdmin fallback:", e);
    }
  }
  const db = await readLocalDb();
  return db.orders;
}

export async function findOrderById(
  orderId: string,
): Promise<OrderRecord | null> {
  if (isDatabaseConfigured()) {
    try {
      const row = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          shipping: true,
          invoice: true,
          packages: { include: { items: true } },
          paymentTransactions: true,
          reviews: true,
        },
      });
      if (row) return mapPrismaOrderToRecord(row);
    } catch (e) {
      console.warn("Prisma findOrderById fallback:", e);
    }
  }
  const db = await readLocalDb();
  return db.orders.find((o) => o.id === orderId) || null;
}

export async function findOrderByTrackingId(
  trackingId: string,
): Promise<OrderRecord | null> {
  const clean = trackingId.trim().toUpperCase();
  if (isDatabaseConfigured()) {
    try {
      const row = await prisma.order.findFirst({
        where: {
          OR: [
            { tracking_id: { equals: clean, mode: "insensitive" } },
            { order_code: { equals: clean, mode: "insensitive" } },
          ],
        },
        include: {
          shipping: true,
          invoice: true,
          packages: { include: { items: true } },
          paymentTransactions: true,
          reviews: true,
        },
      });
      if (row) return mapPrismaOrderToRecord(row);
    } catch (e) {
      console.warn("Prisma findOrderByTrackingId fallback:", e);
    }
  }
  const db = await readLocalDb();
  return (
    db.orders.find(
      (o) =>
        o.tracking_id.toUpperCase() === clean ||
        o.order_code.toUpperCase() === clean,
    ) || null
  );
}

/**
 * Actualiza el estado de la orden (3 pasos: manufacturing -> in_transit -> delivered)
 * y/o verifica pagos (adelanto 50% o cobro del 50% restante contraentrega que culmina la orden en "completed" / Exitoso)
 */
export async function updateOrderAdminLifecycle(input: {
  orderId: string;
  adminId: string;
  action:
    | "verify_advance_50"
    | "set_step_manufacturing"
    | "set_step_in_transit"
    | "set_step_delivered"
    | "complete_final_50_payment"
    | "cancel_order";
  courier?: string;
  carrierPhone?: string;
  finalPaymentMethod?: PaymentMethod;
  finalOperationNumber?: string;
  notes?: string;
}): Promise<OrderRecord | null> {
  const db = await readLocalDb();
  const idx = db.orders.findIndex((o) => o.id === input.orderId);
  if (idx === -1) return null;

  const order = db.orders[idx];
  const now = new Date().toISOString();

  if (input.action === "verify_advance_50") {
    order.payment_status = "partial_paid";
    const advTx = order.paymentTransactions.find(
      (t) => t.payment_stage === "advance_50",
    );
    if (advTx) {
      advTx.status = "verified";
      advTx.verified_by = input.adminId;
      advTx.verified_at = now;
    }
  } else if (input.action === "set_step_manufacturing") {
    order.status = "manufacturing";
    order.manufacturing_started_at = order.manufacturing_started_at || now;
    order.packages.forEach((pkg) => {
      pkg.status = "manufacturing";
      pkg.items.forEach((it) => (it.status = "manufacturing"));
    });
  } else if (input.action === "set_step_in_transit") {
    order.status = "in_transit";
    order.shipped_at = now;
    order.packages.forEach((pkg) => {
      pkg.status = "in_transit";
      if (input.courier) pkg.courier = input.courier;
      if (input.carrierPhone) pkg.carrier_phone = input.carrierPhone;
      pkg.items.forEach((it) => (it.status = "in_transit"));
    });
  } else if (input.action === "set_step_delivered") {
    order.status = "delivered";
    order.delivered_at = now;
    order.packages.forEach((pkg) => {
      pkg.status = "delivered";
      pkg.items.forEach((it) => (it.status = "delivered"));
    });
  } else if (input.action === "complete_final_50_payment") {
    // Regla Inalterable: Al entregarse y pagarse el otro 50% contraentrega,
    // el estatus de la orden cambia a "completed" (Exitoso) y culmina el proceso.
    order.delivered_at = order.delivered_at || now;
    order.completed_at = now;
    order.status = "completed";
    order.payment_status = "paid_full";

    // Asegurar que el adelanto también esté marcado como verificado
    order.paymentTransactions.forEach((tx) => {
      if (tx.payment_stage === "advance_50") {
        tx.status = "verified";
        tx.verified_at = tx.verified_at || now;
      }
    });

    const existingFinal = order.paymentTransactions.find(
      (t) => t.payment_stage === "final_50",
    );
    if (!existingFinal) {
      order.paymentTransactions.push({
        id: crypto.randomUUID(),
        order_id: order.id,
        payment_stage: "final_50",
        payment_method: input.finalPaymentMethod || order.payment_method,
        status: "verified",
        amount: order.remaining_amount,
        currency: "PEN",
        operation_number:
          input.finalOperationNumber?.trim() || "CONTRAENTREGA-OK",
        proof_image_url: null,
        payer_name: order.shipping?.name || null,
        payer_phone: order.shipping?.phone || null,
        notes:
          input.notes ||
          "Pago del 50% restante contraentrega verificado. Orden culminada exitosamente.",
        verified_by: input.adminId,
        verified_at: now,
        created_at: now,
      });
    } else {
      existingFinal.status = "verified";
      existingFinal.verified_by = input.adminId;
      existingFinal.verified_at = now;
    }

    order.packages.forEach((pkg) => {
      pkg.status = "completed";
      pkg.items.forEach((it) => (it.status = "completed"));
    });
  } else if (input.action === "cancel_order") {
    order.status = "cancelled";
    order.packages.forEach((pkg) => {
      pkg.status = "cancelled";
      pkg.items.forEach((it) => (it.status = "cancelled"));
    });
  }

  order.updated_at = now;
  db.orders[idx] = order;
  writeLocalDb(db);

  if (isDatabaseConfigured()) {
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: order.status,
          payment_status: order.payment_status,
          shipped_at: order.shipped_at ? new Date(order.shipped_at) : null,
          delivered_at: order.delivered_at
            ? new Date(order.delivered_at)
            : null,
          completed_at: order.completed_at
            ? new Date(order.completed_at)
            : null,
        },
      });
    } catch (e) {
      console.warn("Prisma updateOrderAdminLifecycle fallback:", e);
    }
  }

  // Encolar email de notificación de cambio de estado al comprador
  if (order.shipping?.email) {
    const stepLabels: Record<OrderStatus, string> = {
      manufacturing: "En Fabricación (Paso 1 de 3)",
      in_transit: "En Camino a tu Domicilio (Paso 2 de 3)",
      delivered: "Entregado en tu Domicilio (Paso 3 de 3)",
      completed: "¡Orden Exitosa! Pago 100% Completado",
      cancelled: "Orden Cancelada",
    };
    await enqueueEmail({
      to_email: order.shipping.email,
      subject: `Actualización de tu orden ${order.order_code}: ${stepLabels[order.status]}`,
      template: "order_status_updated",
      data: {
        order_code: order.order_code,
        tracking_id: order.tracking_id,
        status: order.status,
        status_label: stepLabels[order.status],
        payment_status: order.payment_status,
      },
    });
  }

  return order;
}

export async function createOrderReview(input: {
  order_id: string;
  buyer_id: string;
  rating: number;
  comment: string;
}): Promise<OrderRecord | null> {
  const db = await readLocalDb();
  const idx = db.orders.findIndex(
    (o) => o.id === input.order_id && o.buyer_id === input.buyer_id,
  );
  if (idx === -1) return null;

  const order = db.orders[idx];
  const productId =
    order.packages[0]?.items[0]?.product_id || DEFAULT_WALL_ART_PRODUCT.id;

  const review = {
    id: crypto.randomUUID(),
    product_id: productId,
    buyer_id: input.buyer_id,
    order_id: order.id,
    rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
    comment: input.comment.trim(),
    photo_url: order.packages[0]?.items[0]?.generated_art_url || null,
    created_at: new Date().toISOString(),
  };

  order.reviews = [review];
  db.orders[idx] = order;
  writeLocalDb(db);

  if (isDatabaseConfigured()) {
    try {
      await prisma.review.upsert({
        where: {
          buyer_id_order_id_product_id: {
            buyer_id: input.buyer_id,
            order_id: order.id,
            product_id: productId,
          },
        },
        update: {
          rating: review.rating,
          comment: review.comment,
        },
        create: {
          id: review.id,
          product_id: productId,
          buyer_id: input.buyer_id,
          order_id: order.id,
          rating: review.rating,
          comment: review.comment,
          photo_url: review.photo_url,
        },
      });
    } catch (e) {
      console.warn("Prisma createOrderReview fallback:", e);
    }
  }

  return order;
}
