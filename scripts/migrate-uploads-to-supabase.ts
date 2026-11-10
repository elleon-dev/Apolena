import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();
const BUCKET = "apolena-media";
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function main() {
  console.log("🚀 Starting migration of public/uploads to Supabase Storage...");

  // 1. Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === BUCKET);
  if (!exists) {
    console.log(`Creating bucket ${BUCKET}...`);
    await supabase.storage.createBucket(BUCKET, { public: true });
  }

  // 2. Scan and upload all files from public/uploads
  const urlMap = new Map<string, string>(); // "/uploads/subdir/file.jpg" -> "https://...supabase.co/..."
  const subdirs = ["artworks", "previews", "pets", "proofs", "characters"];

  for (const sub of subdirs) {
    const subDirFullPath = path.join(UPLOADS_DIR, sub);
    if (!fs.existsSync(subDirFullPath)) continue;

    const files = fs
      .readdirSync(subDirFullPath)
      .filter((f) => !f.startsWith("."));
    console.log(`Uploading ${files.length} files from ${sub}...`);

    for (const file of files) {
      const filePath = path.join(subDirFullPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      const objectPath = `${sub}/${file}`;
      const localRelPath = `/uploads/${sub}/${file}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, fileBuffer, {
          contentType: file.endsWith(".png") ? "image/png" : "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error(`Error uploading ${objectPath}:`, error.message);
        continue;
      }

      const { data: pubData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(objectPath);
      urlMap.set(localRelPath, pubData.publicUrl);
    }
  }

  console.log(
    `✅ Uploaded ${urlMap.size} files to Supabase Storage successfully.`,
  );

  // Helper to replace all known local upload URLs in any string
  function replaceUrls(str: string): string {
    let result = str;
    for (const [localUrl, cloudUrl] of Array.from(urlMap.entries())) {
      if (result.includes(localUrl)) {
        result = result.replaceAll(localUrl, cloudUrl);
      }
    }
    return result;
  }

  // 3. Update PostgreSQL tables via Prisma
  console.log("🔄 Updating PostgreSQL references in Supabase...");

  // 3a. Order Items
  const items = await prisma.orderItem.findMany();
  for (const it of items) {
    let updated = false;
    let nextGen = it.generated_art_url;
    let nextPet = it.pet_photo_url;
    let nextCustom = it.customizations
      ? JSON.parse(JSON.stringify(it.customizations))
      : null;

    if (nextGen && urlMap.has(nextGen)) {
      nextGen = urlMap.get(nextGen)!;
      updated = true;
    }
    if (nextPet && urlMap.has(nextPet)) {
      nextPet = urlMap.get(nextPet)!;
      updated = true;
    }
    if (nextCustom?.master_art_url && urlMap.has(nextCustom.master_art_url)) {
      nextCustom.master_art_url = urlMap.get(nextCustom.master_art_url)!;
      updated = true;
    }

    if (updated) {
      await prisma.orderItem.update({
        where: { id: it.id },
        data: {
          generated_art_url: nextGen,
          pet_photo_url: nextPet,
          customizations: nextCustom,
        },
      });
      console.log(`Updated OrderItem ${it.id}`);
    }
  }

  // 3b. Payment Transactions
  const txs = await prisma.paymentTransaction.findMany();
  for (const tx of txs) {
    if (tx.proof_image_url && urlMap.has(tx.proof_image_url)) {
      const nextProof = urlMap.get(tx.proof_image_url)!;
      await prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: { proof_image_url: nextProof },
      });
      console.log(`Updated PaymentTransaction ${tx.id}`);
    }
  }

  // 3c. Products
  const products = await prisma.product.findMany();
  for (const prod of products) {
    if (prod.customization_config) {
      const rawStr = JSON.stringify(prod.customization_config);
      const replacedStr = replaceUrls(rawStr);
      if (rawStr !== replacedStr) {
        await prisma.product.update({
          where: { id: prod.id },
          data: { customization_config: JSON.parse(replacedStr) },
        });
        console.log(`Updated Product ${prod.slug}`);
      }
    }
  }

  // 3d. Reviews
  const reviews = await prisma.review.findMany();
  for (const rev of reviews) {
    if (rev.photo_url && urlMap.has(rev.photo_url)) {
      await prisma.review.update({
        where: { id: rev.id },
        data: { photo_url: urlMap.get(rev.photo_url)! },
      });
      console.log(`Updated Review ${rev.id}`);
    }
  }

  // 4. Update local JSON state files
  const devDbPath = path.join(process.cwd(), ".apolena-dev-db.json");
  if (fs.existsSync(devDbPath)) {
    const raw = fs.readFileSync(devDbPath, "utf8");
    const updated = replaceUrls(raw);
    fs.writeFileSync(devDbPath, updated, "utf8");
    console.log("Updated .apolena-dev-db.json");
  }

  const vaultPath = path.join(process.cwd(), ".apolena-master-art-vault.json");
  if (fs.existsSync(vaultPath)) {
    const raw = fs.readFileSync(vaultPath, "utf8");
    const updated = replaceUrls(raw);
    fs.writeFileSync(vaultPath, updated, "utf8");
    console.log("Updated .apolena-master-art-vault.json");
  }

  await prisma.$disconnect();
  console.log("🎉 Migration completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
