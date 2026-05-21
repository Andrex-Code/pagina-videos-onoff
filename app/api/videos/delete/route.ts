import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireAdminPassword } from '@/lib/auth';
import { removeVideo } from '@/lib/manifest';

export async function POST(request: Request) {
  try {
    requireAdminPassword(request);
    const { id, deleteBlob } = await request.json();
    if (!id) throw new Error('Falta id.');
    const { manifest, removed } = await removeVideo(String(id));
    if (deleteBlob && removed?.blobUrl) await del(removed.blobUrl);
    return NextResponse.json({ ok: true, manifest, removed });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
