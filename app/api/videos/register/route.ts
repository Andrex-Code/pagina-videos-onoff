import { NextResponse } from 'next/server';
import { requireAdminPassword } from '@/lib/auth';
import { makeId } from '@/lib/slug';
import { upsertVideo } from '@/lib/manifest';
import type { ChannelId, VideoItem } from '@/lib/types';

const validChannels = ['tiendason', 'yadinero', 'trycontroller'];

export async function POST(request: Request) {
  try {
    requireAdminPassword(request);
    const body = await request.json();
    const channel = String(body.channel || '') as ChannelId;
    const title = String(body.title || '').trim();
    const intentKey = String(body.intentKey || '').trim();
    const blobUrl = String(body.blobUrl || '').trim();

    if (!validChannels.includes(channel)) throw new Error('Canal inválido.');
    if (!title) throw new Error('El título es obligatorio.');
    if (!intentKey) throw new Error('La clave de intención es obligatoria.');
    if (!blobUrl.startsWith('https://')) throw new Error('URL de video inválida.');

    const video: VideoItem = {
      id: body.id || makeId(`${channel}-${intentKey}`),
      channel,
      title,
      intentKey,
      description: String(body.description || '').trim(),
      tags: String(body.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      blobUrl,
      downloadUrl: body.downloadUrl || '',
      pathname: body.pathname || '',
      contentType: body.contentType || 'video/mp4',
      size: Number(body.size || 0),
      uploadedAt: new Date().toISOString()
    };

    const manifest = await upsertVideo(video);
    return NextResponse.json({ ok: true, video, manifest });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
