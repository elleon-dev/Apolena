import { NextResponse } from 'next/server';
import { TEMPLATES } from '@/data/templates';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: TEMPLATES.length,
    templates: TEMPLATES
  });
}
