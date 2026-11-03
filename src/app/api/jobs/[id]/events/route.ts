import { NextRequest } from 'next/server';
import { getJobById } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isDone = false;
      let lastProgress = -1;
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes maximum

      const interval = setInterval(async () => {
        attempts++;
        const job = await getJobById(jobId);

        if (!job) {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Job no encontrado' })}\n\n`)
          );
          clearInterval(interval);
          controller.close();
          return;
        }

        // Send update if progress or status changed
        if (job.progress !== lastProgress || job.status === 'completed' || job.status === 'failed') {
          lastProgress = job.progress;
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(job)}\n\n`)
          );
        }

        if (job.status === 'completed' || job.status === 'failed' || attempts >= maxAttempts) {
          isDone = true;
          clearInterval(interval);
          controller.close();
        }
      }, 500);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        if (!isDone) controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
