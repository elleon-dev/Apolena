import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { enqueueJob } from "@/lib/queue";
import { FAMOUS_CHARACTERS } from "@/data/characters";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AIProviderId, ApiKeysOverride } from "@/lib/types";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let characterId = "";
    let petName = "Mi Mascota";
    let species: "dog" | "cat" | "both" | "other" = "dog";
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
      species = ((formData.get("species") as string) || "dog") as any;
      provider = ((formData.get("provider") as string) ||
        "openai") as AIProviderId;
      customPrompt = (formData.get("customPrompt") as string) || null;

      const file = formData.get("file") as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (isSupabaseConfigured && supabase) {
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const objectPath = `pets/${fileName}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("apolena-media")
              .upload(objectPath, buffer, {
                contentType: file.type,
                upsert: true,
              });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("apolena-media")
              .getPublicUrl(objectPath);
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
      species = body.species || "dog";
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

    // UUID so the job can be persisted in `generation_jobs` and linked to `order_items.generation_job_id`
    const jobId = randomUUID();
    const sessionUser = await getSessionUser(req).catch(() => null);

    // Modelo Híbrido: 1ra generación gratis sin sesión; a partir de la 2da se requiere iniciar sesión
    if (!sessionUser) {
      const guestGenCount = Number(
        req.cookies.get("apolena_guest_gen_count")?.value || "0",
      );
      if (guestGenCount >= 1) {
        return NextResponse.json(
          {
            success: false,
            code: "AUTH_REQUIRED_FOR_NEXT_GENERATION",
            error:
              "Ya utilizaste tu creación gratuita de prueba. Inicia sesión para seguir probando estilos y guardar todas tus creaciones en tu cuenta.",
          },
          { status: 401 },
        );
      }
    }

    const job = await enqueueJob({
      jobId,
      userId: sessionUser?.id || null,
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

    const response = NextResponse.json(
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

    if (!sessionUser) {
      const cookieOptions = {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 días
      };
      response.cookies.set("apolena_guest_gen_count", "1", cookieOptions);
      response.cookies.set("apolena_guest_last_job", job.id, cookieOptions);
    }

    return response;
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
