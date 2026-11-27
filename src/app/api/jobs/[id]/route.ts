import { NextRequest, NextResponse } from "next/server";
import { getJobById, updateJobSettings } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const jobId = params.id;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "ID de creación requerido." },
        { status: 400 },
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, deleted: true });
    }

    const sessionUser = await getSessionUser(req).catch(() => null);
    const guestJobId = req.cookies.get("apolena_guest_last_job")?.value || null;

    const existing = await prisma.generationJob.findUnique({
      where: { id: jobId },
      select: { id: true, user_id: true, settings: true },
    });

    if (!existing) {
      return NextResponse.json({ success: true, deleted: true });
    }

    const isOwner = Boolean(
      (sessionUser && existing.user_id && existing.user_id === sessionUser.id) ||
        (guestJobId && guestJobId === jobId && !existing.user_id),
    );

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para eliminar esta creación." },
        { status: 403 },
      );
    }

    // Seguridad: si la creación ya está vinculada a una orden comprada, NO eliminar el registro
    // para proteger el archivo maestro de la orden; solo ocultarla del historial del estudio.
    const linkedOrdersCount = await prisma.orderItem.count({
      where: { generation_job_id: jobId },
    });

    if (linkedOrdersCount > 0) {
      const prevSettings =
        existing.settings && typeof existing.settings === "object"
          ? (existing.settings as Record<string, unknown>)
          : {};
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          settings: {
            ...prevSettings,
            dismissed_from_studio: true,
          } as any,
        },
      });
      return NextResponse.json({ success: true, dismissed: true });
    }

    await prisma.generationJob.delete({
      where: { id: jobId },
    });

    const response = NextResponse.json({ success: true, deleted: true });
    if (guestJobId === jobId) {
      response.cookies.delete("apolena_guest_last_job");
    }
    return response;
  } catch (err) {
    console.warn("DELETE /api/jobs/[id] warning:", err);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar la creación." },
      { status: 500 },
    );
  }
}
