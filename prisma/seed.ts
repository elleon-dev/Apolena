import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import {
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_WALL_ART_PRODUCT,
} from "../src/lib/db-service";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de Apolena en PostgreSQL con Prisma...");

  const adminPasswordHash = await hashPassword("admin123", "apolenaadmin");
  const userPasswordHash = await hashPassword("cliente123", "apolenauser");

  // 1. Perfiles: Admin y Cliente Demo
  await prisma.profile.upsert({
    where: { email: "admin@apolena.pe" },
    update: { role: "admin" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      email: "admin@apolena.pe",
      password_hash: adminPasswordHash,
      name: "Administrador Apolena",
      phone: "987654321",
      role: "admin",
      address: "Av. Primavera 1240, Santiago de Surco",
      department: "Lima",
      province: "Lima",
      district: "Santiago de Surco",
    },
  });

  await prisma.profile.upsert({
    where: { email: "cliente@apolena.pe" },
    update: { role: "user" },
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      email: "cliente@apolena.pe",
      password_hash: userPasswordHash,
      name: "Valeria Mendoza",
      phone: "999888777",
      role: "user",
      address: "Calle Los Pinos 450 Dpto 302, Miraflores",
      department: "Lima",
      province: "Lima",
      district: "Miraflores",
    },
  });

  // 2. Producto extensible inicial: Cuadro Artístico Personalizado para Mascota
  await prisma.product.upsert({
    where: { slug: DEFAULT_WALL_ART_PRODUCT.slug },
    update: {
      title: DEFAULT_WALL_ART_PRODUCT.title,
      description: DEFAULT_WALL_ART_PRODUCT.description,
      base_price: DEFAULT_WALL_ART_PRODUCT.base_price,
      customization_config: DEFAULT_WALL_ART_PRODUCT.customization_config as any,
      specifications: DEFAULT_WALL_ART_PRODUCT.specifications as any,
    },
    create: {
      id: DEFAULT_WALL_ART_PRODUCT.id,
      title: DEFAULT_WALL_ART_PRODUCT.title,
      slug: DEFAULT_WALL_ART_PRODUCT.slug,
      description: DEFAULT_WALL_ART_PRODUCT.description,
      category: DEFAULT_WALL_ART_PRODUCT.category,
      base_price: DEFAULT_WALL_ART_PRODUCT.base_price,
      status: "active",
      stock: 999,
      specifications: DEFAULT_WALL_ART_PRODUCT.specifications as any,
      customization_config: DEFAULT_WALL_ART_PRODUCT.customization_config as any,
      images: {
        create: DEFAULT_WALL_ART_PRODUCT.images.map((img) => ({
          url: img.url,
          alt_text: img.alt_text,
          position: img.position,
        })),
      },
    },
  });

  // 3. Configuración dinámica de plataforma (Yape, Plin, Transferencia, Envíos, Emails)
  for (const [key, value] of Object.entries(DEFAULT_PLATFORM_SETTINGS)) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: {
        key,
        value: value as any,
        category: "general",
      },
    });
  }

  console.log("✅ Seed de Apolena completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
