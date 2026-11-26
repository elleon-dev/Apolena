import { NextRequest, NextResponse } from "next/server";
import { getJobById, updateJobSettings } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import type { GenerationJobSettings } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const jobId = params.id;
  const job = await getJobById(jobId);

  if (!job) {
    return NextResponse.json(
      { success: false, error: "Trabajo no encontrado" },
      { status: 404 },
    );
  }

  // Never expose the clean unwatermarked hdOutputImageUrl to the public studio endpoint
  const safeClientJob = {
    ...job,
    hdOutputImageUrl: job.outputImageUrl,
  };

  return NextResponse.json({
    success: true,
    job: safeClientJob,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const jobId = params.id;
    const body = await req.json();

    const allowedSettings: GenerationJobSettings = {};
    if (typeof body.productSlug === "string") {
      allowedSettings.productSlug = body.productSlug.slice(0, 60);
    }
    if (typeof body.selectedVariantId === "string" || body.selectedVariantId === null) {
      allowedSettings.selectedVariantId = body.selectedVariantId;
    }
    if (typeof body.selectedPrintPresetId === "string" || body.selectedPrintPresetId === null) {
      allowedSettings.selectedPrintPresetId = body.selectedPrintPresetId;
    }
    if (typeof body.selectedFrameId === "string" || body.selectedFrameId === null) {
      allowedSettings.selectedFrameId = body.selectedFrameId;
    }
    if (typeof body.includePetInscription === "boolean") {
      allowedSettings.includePetInscription = body.includePetInscription;
    }
    if (typeof body.petInscriptionName === "string") {
      allowedSettings.petInscriptionName = body.petInscriptionName.slice(0, 40);
    }
    if (typeof body.dedicationNote === "string") {
      allowedSettings.dedicationNote = body.dedicationNote.slice(0, 300);
    }

    const sessionUser = await getSessionUser().catch(() => null);
    const updated = await updateJobSettings(
      jobId,
      allowedSettings,
      sessionUser?.id || null,
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Creación no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (err) {
    console.warn("PATCH /api/jobs/[id] warning:", err);
    return NextResponse.json(
      { success: false, error: "No se pudo guardar el avance." },
      { status: 400 },
    );
  }
}
