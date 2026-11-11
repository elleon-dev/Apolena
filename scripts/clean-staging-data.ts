/**
 * Script de Limpieza Controlada de Datos y Storage para Deploy de Producción v1
 *
 * REGLAS INALTERABLES:
 * - CONSERVA INTACTOS: profiles, users, products, product_images, platform_settings, characters y personajes.
 * - PURGA: orders, order_items, order_packages, order_shippings, order_invoices,
 *          payment_transactions, email_queue, reviews, generation_jobs.
 * - STORAGE PURGA: apolena-media (artworks/, previews/, pets/, proofs/).
 * - STORAGE CONSERVA: apolena-media (characters/, products/).
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { supabase, isSupabaseConfigured } from "../src/lib/supabase";
import { SUPABASE_MEDIA_BUCKET } from "../src/lib/image-storage";

interface TableReport {
  table: string;
  countBefore: number;
  action: "KEEP" | "PURGE";
  countAfter?: number;
}

const STORAGE_SUBDIRS_TO_PURGE = ["artworks", "previews", "pets", "proofs"];
const STORAGE_SUBDIRS_TO_PRESERVE = ["characters", "products"];

async function run() {
  const isExecute = process.argv.includes("--execute") || process.argv.includes("--confirm");

  console.log("══════════════════════════════════════════════════════════════════════");
  console.log(" 🧹 APOLENA — SCRIPT DE LIMPIEZA PRE-DEPLOY PRODUCCIÓN V1");
  console.log(` MODO: ${isExecute ? "🚨 EJECUCIÓN REAL (--execute)" : "🔍 SIMULACIÓN / DRY RUN"}`);
  console.log("══════════════════════════════════════════════════════════════════════\n");

  // 1. REPORTE DE TABLAS DE BASE DE DATOS
  console.log("📊 1. Estado Actual de Tablas en PostgreSQL (Prisma):");

  const tables: TableReport[] = [
    { table: "profiles", countBefore: await prisma.profile.count(), action: "KEEP" },
    { table: "platform_settings", countBefore: await prisma.platformSetting.count(), action: "KEEP" },
    { table: "products", countBefore: await prisma.product.count(), action: "KEEP" },
    { table: "product_images", countBefore: await prisma.productImage.count(), action: "KEEP" },
    { table: "character_templates", countBefore: await prisma.characterTemplate.count(), action: "KEEP" },
    { table: "payment_transactions", countBefore: await prisma.paymentTransaction.count(), action: "PURGE" },
    { table: "order_invoices", countBefore: await prisma.orderInvoice.count(), action: "PURGE" },
    { table: "order_items", countBefore: await prisma.orderItem.count(), action: "PURGE" },
    { table: "order_packages", countBefore: await prisma.orderPackage.count(), action: "PURGE" },
    { table: "order_shippings", countBefore: await prisma.orderShipping.count(), action: "PURGE" },
    { table: "orders", countBefore: await prisma.order.count(), action: "PURGE" },
    { table: "generation_jobs", countBefore: await prisma.generationJob.count(), action: "PURGE" },
    { table: "reviews", countBefore: await prisma.review.count(), action: "PURGE" },
    { table: "email_queue", countBefore: await prisma.emailQueue.count(), action: "PURGE" },
  ];

  for (const t of tables) {
    const badge = t.action === "KEEP" ? "🛡️ CONSERVAR" : "🗑️ PURGAR";
    console.log(`   ${badge.padEnd(14)} ${t.table.padEnd(24)} -> ${t.countBefore} registros`);
  }

  // 2. REPORTE DE SUPABASE STORAGE
  console.log("\n📦 2. Estado de Supabase Storage (Bucket: apolena-media):");
  const storageFilesToPurge: string[] = [];

  if (isSupabaseConfigured && supabase) {
    for (const subdir of STORAGE_SUBDIRS_TO_PURGE) {
      const { data: files } = await supabase.storage.from(SUPABASE_MEDIA_BUCKET).list(subdir, { limit: 1000 });
      const count = files?.length || 0;
      console.log(`   🗑️ PURGAR      ${subdir.padEnd(24)} -> ${count} archivos`);
      if (files && files.length > 0) {
        files.forEach((f) => {
          if (f.name && f.name !== ".emptyFolderPlaceholder") {
            storageFilesToPurge.push(`${subdir}/${f.name}`);
          }
        });
      }
    }

    for (const subdir of STORAGE_SUBDIRS_TO_PRESERVE) {
      const { data: files } = await supabase.storage.from(SUPABASE_MEDIA_BUCKET).list(subdir, { limit: 1000 });
      const count = files?.length || 0;
      console.log(`   🛡️ CONSERVAR   ${subdir.padEnd(24)} -> ${count} archivos (Personajes / Catálogo)`);
    }
  } else {
    console.log("   ⚠️ Supabase no configurado o credenciales no detectadas.");
  }

  // 3. REPORTE DE ARCHIVOS LOCALES TEMPORALES
  const localPreviewsDir = path.join(process.cwd(), "public", "uploads", "previews");
  let localFiles: string[] = [];
  if (fs.existsSync(localPreviewsDir)) {
    localFiles = fs.readdirSync(localPreviewsDir).filter((f) => f !== ".gitkeep");
  }
  console.log(`\n💻 3. Archivos locales temporales (public/uploads/previews): ${localFiles.length} archivos`);

  // SI ES DRY RUN, TERMINAR AQUÍ
  if (!isExecute) {
    console.log("\n💡 Para ejecutar la purga real, ejecuta:");
    console.log("   npx tsx --env-file=.env.local scripts/clean-staging-data.ts --execute\n");
    return;
  }

  // EJECUCIÓN REAL
  console.log("\n🚀 EJECUTANDO PURGA DE DATOS...");

  await prisma.$transaction(async (tx) => {
    console.log("   - Eliminando transacciones de pago...");
    await tx.paymentTransaction.deleteMany({});

    console.log("   - Eliminando comprobantes fiscales...");
    await tx.orderInvoice.deleteMany({});

    console.log("   - Eliminando ítems de órdenes...");
    await tx.orderItem.deleteMany({});

    console.log("   - Eliminando paquetes de órdenes...");
    await tx.orderPackage.deleteMany({});

    console.log("   - Eliminando direcciones de envío de órdenes...");
    await tx.orderShipping.deleteMany({});

    console.log("   - Eliminando órdenes de compra...");
    await tx.order.deleteMany({});

    console.log("   - Eliminando tareas de generación IA de prueba...");
    await tx.generationJob.deleteMany({});

    console.log("   - Eliminando reseñas de prueba...");
    await tx.review.deleteMany({});

    console.log("   - Limpiando cola de emails...");
    await tx.emailQueue.deleteMany({});
  });

  console.log("   ✓ Base de datos purgada con éxito.");

  // PURGA DE STORAGE
  if (isSupabaseConfigured && supabase && storageFilesToPurge.length > 0) {
    console.log(`   - Eliminando ${storageFilesToPurge.length} archivos de prueba en Supabase Storage...`);
    const { error: delErr } = await supabase.storage.from(SUPABASE_MEDIA_BUCKET).remove(storageFilesToPurge);
    if (delErr) {
      console.warn("   ⚠️ Error al eliminar archivos de Storage:", delErr.message);
    } else {
      console.log("   ✓ Archivos de prueba eliminados de Supabase Storage.");
    }
  }

  // PURGA LOCAL PREVIEWS
  if (localFiles.length > 0) {
    console.log(`   - Limpiando ${localFiles.length} archivos locales temporales...`);
    for (const f of localFiles) {
      fs.unlinkSync(path.join(localPreviewsDir, f));
    }
    console.log("   ✓ Archivos locales eliminados.");
  }

  // VERIFICACIÓN FINAL POST-PURGA
  console.log("\n✅ ESTADO FINAL POST-PURGA:");
  const finalTables = [
    { name: "profiles", count: await prisma.profile.count() },
    { name: "platform_settings", count: await prisma.platformSetting.count() },
    { name: "products", count: await prisma.product.count() },
    { name: "product_images", count: await prisma.productImage.count() },
    { name: "orders", count: await prisma.order.count() },
    { name: "payment_transactions", count: await prisma.paymentTransaction.count() },
    { name: "email_queue", count: await prisma.emailQueue.count() },
  ];

  finalTables.forEach((t) => {
    console.log(`   - ${t.name.padEnd(24)}: ${t.count} registros`);
  });

  console.log("\n🎉 ¡Limpieza completada con éxito! La base de datos y storage quedaron listos para el deploy de producción.");
}

run()
  .catch((e) => {
    console.error("❌ Error durante la limpieza:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
