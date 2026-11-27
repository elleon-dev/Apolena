import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export interface DeleteUserResult {
  deletedUserId: string;
  deletedEmail: string;
  deletedOrders: number;
  deletedJobs: number;
  deletedStorageFiles: number;
  skippedSharedFiles: number;
}

/**
 * Prefijos de carpetas de Supabase Storage que contienen únicamente archivos
 * generados o subidos por usuarios. Cualquier ruta fuera de esta lista blanca
 * (ej. characters/, frames/, catalog/, samples/, watermarks/) NUNCA se elimina.
 */
const ALLOWED_USER_STORAGE_PREFIXES = [
  "pets/",
  "previews/",
  "artworks/",
  "proofs/",
  "uploads/",
];

function extractSafeUserStorageTarget(
  url?: string | null,
): { bucket: string; path: string; rawUrl: string } | null {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
  const match = url.match(
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?.*)?$/,
  );
  if (!match) return null;

  const bucket = decodeURIComponent(match[1]);
  const filePath = decodeURIComponent(match[2]).replace(/^\/+/, "");
  if (!bucket || !filePath || filePath.includes("..")) return null;

  const isAllowedPrefix = ALLOWED_USER_STORAGE_PREFIXES.some((prefix) =>
    filePath.startsWith(prefix),
  );
  if (!isAllowedPrefix) {
    return null;
  }

  return { bucket, path: filePath, rawUrl: url };
}

/**
 * Servicio reutilizable y seguro para eliminar definitivamente una cuenta de usuario
 * y TODOS los datos/archivos que le pertenecen exclusivamente.
 *
 * Reutilizable tanto para:
 * - Eliminación por Super Admin (`DELETE /api/admin/users`)
 * - Auto-eliminación / baja voluntaria del propio usuario (`DELETE /api/account`)
 *
 * Garantías de integridad:
 * 1. Todos los registros borrados en PostgreSQL se filtran estrictamente por `user_id` / `buyer_id` / `email` del usuario objetivo.
 * 2. Ningún archivo del catálogo (`characters/`, `frames/`, `catalog/`, etc.) puede ser eliminado (lista blanca estricta de prefijos).
 * 3. Antes de borrar cualquier archivo de Supabase Storage, se verifica que ningún otro usuario ni registro restante en BD lo referencie.
 */
export async function deleteUserAccountAndData(
  targetUserId: string,
): Promise<DeleteUserResult> {
  if (!isDatabaseConfigured()) {
    throw new Error("Base de datos no configurada.");
  }

  const targetProfile = await prisma.profile.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, role: true },
  });

  if (!targetProfile) {
    throw new Error("Usuario no encontrado.");
  }

  // 1. Obtener exclusivamente los jobs y órdenes propiedad de este usuario
  const [userJobs, userOrders] = await Promise.all([
    prisma.generationJob.findMany({
      where: { user_id: targetProfile.id },
      select: {
        id: true,
        pet_image_url: true,
        second_pet_image_url: true,
        output_image_url: true,
        hd_output_image_url: true,
        variants: true,
        settings: true,
      },
    }),
    prisma.order.findMany({
      where: { buyer_id: targetProfile.id },
      select: {
        id: true,
        packages: {
          select: {
            id: true,
            items: {
              select: {
                pet_photo_url: true,
                generated_art_url: true,
                customizations: true,
              },
            },
          },
        },
        paymentTransactions: {
          select: { proof_image_url: true },
        },
      },
    }),
  ]);

  const candidateUrls = new Set<string>();
  const addUrl = (val: unknown) => {
    if (typeof val === "string" && val.startsWith("http")) {
      candidateUrls.add(val);
    }
  };

  for (const job of userJobs) {
    addUrl(job.pet_image_url);
    addUrl(job.second_pet_image_url);
    addUrl(job.output_image_url);
    addUrl(job.hd_output_image_url);
    if (Array.isArray(job.variants)) {
      for (const v of job.variants as Array<{ imageUrl?: string }>) {
        addUrl(v?.imageUrl);
      }
    }
    if (job.settings && typeof job.settings === "object") {
      const mv = (job.settings as Record<string, unknown>).master_variants;
      if (mv && typeof mv === "object") {
        for (const val of Object.values(mv as Record<string, unknown>)) {
          addUrl(val);
        }
      }
    }
  }

  const orderIds: string[] = [];
  const packageIds: string[] = [];
  for (const order of userOrders) {
    orderIds.push(order.id);
    for (const pkg of order.packages) {
      packageIds.push(pkg.id);
      for (const item of pkg.items) {
        addUrl(item.pet_photo_url);
        addUrl(item.generated_art_url);
        if (item.customizations && typeof item.customizations === "object") {
          addUrl(
            (item.customizations as Record<string, unknown>).master_art_url,
          );
        }
      }
    }
    for (const tx of order.paymentTransactions) {
      addUrl(tx.proof_image_url);
    }
  }

  // 2. Eliminar primero todos los registros del usuario en PostgreSQL (transacción atómica)
  await prisma.$transaction(async (tx) => {
    if (orderIds.length > 0) {
      await tx.review.deleteMany({
        where: {
          OR: [{ buyer_id: targetProfile.id }, { order_id: { in: orderIds } }],
        },
      });
      await tx.paymentTransaction.deleteMany({
        where: { order_id: { in: orderIds } },
      });
      if (packageIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { package_id: { in: packageIds } },
        });
        await tx.orderPackage.deleteMany({
          where: { id: { in: packageIds } },
        });
      }
      await tx.orderInvoice.deleteMany({
        where: { order_id: { in: orderIds } },
      });
      await tx.orderShipping.deleteMany({
        where: { order_id: { in: orderIds } },
      });
      await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      });
    } else {
      await tx.review.deleteMany({ where: { buyer_id: targetProfile.id } });
    }

    await tx.generationJob.deleteMany({
      where: { user_id: targetProfile.id },
    });

    await tx.emailQueue.deleteMany({
      where: { to_email: targetProfile.email },
    });

    await tx.newsletterSubscriber.deleteMany({
      where: { email: targetProfile.email },
    });

    await tx.profile.delete({
      where: { id: targetProfile.id },
    });
  });

  // 3. Filtrar URLs candidatas mediante lista blanca de prefijos de usuario
  const safeTargets = Array.from(candidateUrls)
    .map((url) => extractSafeUserStorageTarget(url))
    .filter(
      (t): t is { bucket: string; path: string; rawUrl: string } => Boolean(t),
    );

  // 4. Verificación cruzada: comprobar que NINGÚN registro restante de otro usuario referencie estas URLs
  let deletedStorageFiles = 0;
  let skippedSharedFiles = 0;

  if (isSupabaseConfigured && supabase && safeTargets.length > 0) {
    const rawUrlList = safeTargets.map((t) => t.rawUrl);
    const [otherJobs, otherItems, otherTxs] = await Promise.all([
      prisma.generationJob.findMany({
        where: {
          OR: [
            { pet_image_url: { in: rawUrlList } },
            { second_pet_image_url: { in: rawUrlList } },
            { output_image_url: { in: rawUrlList } },
            { hd_output_image_url: { in: rawUrlList } },
          ],
        },
        select: {
          pet_image_url: true,
          second_pet_image_url: true,
          output_image_url: true,
          hd_output_image_url: true,
        },
      }),
      prisma.orderItem.findMany({
        where: {
          OR: [
            { pet_photo_url: { in: rawUrlList } },
            { generated_art_url: { in: rawUrlList } },
          ],
        },
        select: { pet_photo_url: true, generated_art_url: true },
      }),
      prisma.paymentTransaction.findMany({
        where: { proof_image_url: { in: rawUrlList } },
        select: { proof_image_url: true },
      }),
    ]);

    const stillReferenced = new Set<string>();
    for (const j of otherJobs) {
      if (j.pet_image_url) stillReferenced.add(j.pet_image_url);
      if (j.second_pet_image_url) stillReferenced.add(j.second_pet_image_url);
      if (j.output_image_url) stillReferenced.add(j.output_image_url);
      if (j.hd_output_image_url) stillReferenced.add(j.hd_output_image_url);
    }
    for (const i of otherItems) {
      if (i.pet_photo_url) stillReferenced.add(i.pet_photo_url);
      if (i.generated_art_url) stillReferenced.add(i.generated_art_url);
    }
    for (const t of otherTxs) {
      if (t.proof_image_url) stillReferenced.add(t.proof_image_url);
    }

    const bucketMap = new Map<string, Set<string>>();
    for (const target of safeTargets) {
      if (stillReferenced.has(target.rawUrl)) {
        skippedSharedFiles += 1;
        continue;
      }
      if (!bucketMap.has(target.bucket)) {
        bucketMap.set(target.bucket, new Set());
      }
      bucketMap.get(target.bucket)!.add(target.path);
    }

    for (const [bucket, pathSet] of Array.from(bucketMap.entries())) {
      const paths: string[] = Array.from(pathSet);
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { error } = await supabase.storage.from(bucket).remove(chunk);
        if (!error) {
          deletedStorageFiles += chunk.length;
        }
      }
    }
  }

  return {
    deletedUserId: targetProfile.id,
    deletedEmail: targetProfile.email,
    deletedOrders: orderIds.length,
    deletedJobs: userJobs.length,
    deletedStorageFiles,
    skippedSharedFiles,
  };
}
