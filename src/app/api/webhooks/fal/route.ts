import { NextRequest, NextResponse } from "next/server";
import { getJobById, saveJob } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[FalWebhook] Received notification:", payload);

    const requestId = payload.request_id || payload.requestId;
    const status = payload.status; // 'OK' | 'ERROR'
    const imageUrl =
      payload.payload?.images?.[0]?.url || payload.payload?.image?.url;
    const customJobId =
      payload.custom_id || req.nextUrl.searchParams.get("jobId");

    if (!customJobId) {
      console.warn("[FalWebhook] Webhook payload missing jobId");
      return NextResponse.json({
        success: true,
        warning: "JobId missing in webhook",
      });
    }

    const job = await getJobById(customJobId);
    if (!job) {
      console.warn(`[FalWebhook] Job ${customJobId} not found in database`);
      return NextResponse.json({ success: true, warning: "Job not found" });
    }

    if (status === "OK" && imageUrl) {
      await saveJob({
        ...job,
        status: "completed",
        progress: 100,
        currentStep: "Completado vía webhook de fal.ai",
        outputImageUrl: imageUrl,
        hdOutputImageUrl: imageUrl,
        falRequestId: requestId,
      });
    } else if (status === "ERROR") {
      await saveJob({
        ...job,
        status: "failed",
        errorMessage: payload.error || "Error reportado por fal.ai",
        currentStep: "Fallo en fal.ai",
      });
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error: any) {
    console.error("[FalWebhook] Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error parsing webhook" },
      { status: 500 },
    );
  }
}
