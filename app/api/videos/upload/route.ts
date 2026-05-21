import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireAdminPassword } from '@/lib/auth';
import { makeId, slugify } from '@/lib/slug';
import { upsertVideo } from '@/lib/manifest';
import type { ChannelId, VideoItem } from '@/lib/types';

const validChannels = ['tiendason', 'yadinero', 'trycontroller'];

export async function POST(request: Request) {
  try {
    requireAdminPassword(request);
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const channel = String(form.get('channel') || '') as ChannelId;
    const title = String(form.get('title') || '').trim();
    const intentKey = String(form.get('intentKey') || '').trim();
    const description = String(form.get('description') || '').trim();
    const tags = String(form.get('tags') || '');

    if (!file) throw new Error('Selecciona un archivo de video.');
    if (!validChannels.includes(channel)) throw new Error('Canal inválido.');
    if (!title) throw new Error('El título es obligatorio.');
    if (!intentKey) throw new Error('La clave de intención es obligatoria.');
    if (!file.type.startsWith('video/')) throw new Error('El archivo debe ser un video.');

    const safeName = `${slugify(intentKey)}-${Date.now().toString(36)}-${slugify(file.name || 'video')}.mp4`;
    const pathname = `videos/${channel}/${safeName}`;

    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type || 'video/mp4',
      addRandomSuffix: false,
      multipart: true
    });

    const video: VideoItem = {
      id: makeId(`${channel}-${intentKey}`),
      channel,
      title,
      intentKey,
      description,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      blobUrl: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      contentType: blob.contentType || file.type || 'video/mp4',
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    const manifest = await upsertVideo(video);
    return NextResponse.json({ ok: true, video, manifest });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
