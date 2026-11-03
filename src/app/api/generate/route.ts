import { NextRequest, NextResponse } from "next/server";
import { enqueueJob } from "@/lib/queue";
import { FAMOUS_CHARACTERS } from "@/data/characters";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AIProviderId, ApiKeysOverride } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let characterId = "";
    let petName = "Mi Mascota";
    let species: "dog" | "cat" | "both" = "cat";
    let petImageUrl = "";
    let secondPetImageUrl: string | null = null;
    let customThemeImageUrl: string | null = null;
    let customPrompt: string | null = null;
    let provider: AIProviderId = "openai";
    let apiKeys: ApiKeysOverride | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      characterId =
        (formData.get("characterId") as string) ||
        (formData.get("templateId") as string) ||
        "";
      petName = (formData.get("petName") as string) || "Mi Mascota";
      species = ((formData.get("species") as string) || "cat") as any;
      provider = ((formData.get("provider") as string) ||
        "openai") as AIProviderId;
      customPrompt = (formData.get("customPrompt") as string) || null;

      const file = formData.get("file") as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (isSupabaseConfigured && supabase) {
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("pet-uploads")
              .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
              });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("pet-uploads")
              .getPublicUrl(uploadData.path);
            petImageUrl = publicUrlData.publicUrl;
          }
        }

        if (!petImageUrl) {
          const base64 = buffer.toString("base64");
          petImageUrl = `data:${file.type};base64,${base64}`;
        }
      }
    } else {
      const body = await req.json();
      characterId = body.characterId || body.templateId;
      petName = body.petName || "Mi Mascota";
      species = body.species || "cat";
      petImageUrl = body.petImageUrl;
      secondPetImageUrl = body.secondPetImageUrl || null;
      customThemeImageUrl = body.customThemeImageUrl || null;
      customPrompt = body.customPrompt || null;
      provider = body.provider || "openai";
      apiKeys = body.apiKeys;
    }

    if (!characterId) {
      characterId = FAMOUS_CHARACTERS[0].id;
    }

    if (!petImageUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Se requiere al menos 1 imagen de tu mascota para realizar la fusión",
        },
        { status: 400 },
      );
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const job = await enqueueJob({
      jobId,
      characterId,
      petImageUrl,
      secondPetImageUrl,
      customThemeImageUrl,
      customPrompt,
      provider,
      apiKeys,
      petName,
      species,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tarea de fusión multimodal encolada con éxito",
        jobId: job.id,
        status: job.status,
        provider: job.provider,
        checkStatusUrl: `/api/jobs/${job.id}`,
        eventsUrl: `/api/jobs/${job.id}/events`,
      },
      { status: 202 },
    );
  } catch (error: any) {
    console.error("Error in POST /api/generate:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Error interno del servidor al procesar la solicitud",
      },
      { status: 500 },
    );
  }
}
