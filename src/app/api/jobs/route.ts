import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  claimGuestJobForUser,
  getRecentCompletedJobsByUser,
} from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: true, jobs: [] });
    }

    const guestJobId = req.cookies.get("apolena_guest_last_job")?.value || null;
    if (guestJobId) {
      await claimGuestJobForUser(guestJobId, user.id);
    }

    const jobs = await getRecentCompletedJobsByUser(user.id, 8);
    // Filtrar creaciones ocultadas del estudio y nunca exponer hdOutputImageUrl limpio
    const safeJobs = jobs
      .filter((job) => !(job.settings as any)?.dismissed_from_studio)
      .map((job) => ({
        ...job,
        hdOutputImageUrl: job.outputImageUrl,
      }));

    const response = NextResponse.json({
      success: true,
      jobs: safeJobs,
    });

    if (guestJobId || req.cookies.get("apolena_guest_gen_count")) {
      response.cookies.delete("apolena_guest_last_job");
      response.cookies.delete("apolena_guest_gen_count");
    }

    return response;
  } catch (err) {
    console.warn("GET /api/jobs warning:", err);
    return NextResponse.json({ success: true, jobs: [] });
  }
}
