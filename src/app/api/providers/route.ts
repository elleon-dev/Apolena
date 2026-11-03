import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getEnvKeyLive(key: string): string {
  const fromProcess = (process.env[key] || '').trim();
  if (fromProcess && !fromProcess.includes('your_')) {
    return fromProcess;
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match && match[1]) {
        const val = match[1].trim().replace(/^["']|["']$/g, '');
        if (val && !val.includes('your_')) {
          process.env[key] = val;
          return val;
        }
      }
    }
  } catch (e) {}
  return '';
}

export async function GET() {
  const hasOpenAI = getEnvKeyLive('OPENAI_API_KEY').length > 5;
  const hasGemini = getEnvKeyLive('GEMINI_API_KEY').length > 5;
  const hasFal = getEnvKeyLive('FAL_KEY').length > 5;

  return NextResponse.json({
    success: true,
    envConfigured: {
      openai: hasOpenAI,
      gemini: hasGemini,
      fal: hasFal
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { openaiKey, geminiKey, falKey } = body;

    if (typeof openaiKey === 'string' && openaiKey.trim()) {
      process.env.OPENAI_API_KEY = openaiKey.trim();
    }
    if (typeof geminiKey === 'string' && geminiKey.trim()) {
      process.env.GEMINI_API_KEY = geminiKey.trim();
    }
    if (typeof falKey === 'string' && falKey.trim()) {
      process.env.FAL_KEY = falKey.trim();
    }

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const upsertEnvVar = (content: string, key: string, val?: string) => {
      if (typeof val !== 'string' || !val.trim()) return content;
      const cleanVal = val.trim();
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${cleanVal}`);
      }
      return `${content.trimEnd()}\n${key}=${cleanVal}\n`;
    };

    envContent = upsertEnvVar(envContent, 'OPENAI_API_KEY', openaiKey);
    envContent = upsertEnvVar(envContent, 'GEMINI_API_KEY', geminiKey);
    envContent = upsertEnvVar(envContent, 'FAL_KEY', falKey);

    fs.writeFileSync(envPath, envContent, 'utf8');

    return GET();
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'No se pudieron guardar las API Keys' },
      { status: 500 }
    );
  }
}
