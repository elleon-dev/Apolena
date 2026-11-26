import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRecentCompletedJobsByUser } from "@/lib/supabase";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: true, jobs: [] });
    }

    const jobs = await getRecentCompletedJobsByUser(user.id, 8);
    // Never expose clean master hdOutputImageUrl in studio creation history
    const safeJobs = jobs.map((job) => ({
      ...job,
      hdOutputImageUrl: job.outputImageUrl,
    }));

    return NextResponse.json({
      success: true,
      jobs: safeJobs,
    });
  } catch (err) {
    console.warn("GET /api/jobs warning:", err);
    return NextResponse.json({ success: true, jobs: [] });
  }
}
