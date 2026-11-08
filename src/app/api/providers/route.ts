import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getEnvKeyLive(key: string): string {
  const fromProcess = (process.env[key] || "").trim();
  if (fromProcess && !fromProcess.includes("your_")) {
    return fromProcess;
  }
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match && match[1]) {
        const val = match[1].trim().replace(/^["']|["']$/g, "");
        if (val && !val.includes("your_")) {
          process.env[key] = val;
          return val;
        }
      }
    }
  } catch (e) {}
  return "";
}

export async function GET() {
  const hasOpenAI = getEnvKeyLive("OPENAI_API_KEY").length > 5;
  const hasGemini = getEnvKeyLive("GEMINI_API_KEY").length > 5;
  const hasFal = getEnvKeyLive("FAL_KEY").length > 5;

  return NextResponse.json({
    success: true,
    envConfigured: {
      openai: hasOpenAI,
      gemini: hasGemini,
      fal: hasFal,
    },
  });
}
