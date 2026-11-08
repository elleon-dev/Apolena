import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
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

  // Never expose the clean unwatermarked hdOutputImageUrl to the public studio polling endpoint
  const safeClientJob = {
    ...job,
    hdOutputImageUrl: job.outputImageUrl,
  };

  return NextResponse.json({
    success: true,
    job: safeClientJob,
  });
}
