import { NextResponse } from 'next/server';
import { readManifest } from '@/lib/manifest';

export async function GET() {
  const manifest = await readManifest();
  return NextResponse.json(manifest, { headers: { 'Cache-Control': 'no-store' } });
}
