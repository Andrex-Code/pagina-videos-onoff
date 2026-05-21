import { put, list } from '@vercel/blob';
import type { VideoItem, VideoManifest } from './types';

const MANIFEST_PATH = 'videos/manifest.json';

function emptyManifest(): VideoManifest {
  return { version: 1, updatedAt: new Date().toISOString(), videos: [] };
}

export async function readManifest(): Promise<VideoManifest> {
  try {
    const result = await list({ prefix: MANIFEST_PATH, limit: 1 });
    const item = result.blobs.find((b) => b.pathname === MANIFEST_PATH);
    if (!item) return emptyManifest();
    const response = await fetch(item.url, { cache: 'no-store' });
    if (!response.ok) return emptyManifest();
    return (await response.json()) as VideoManifest;
  } catch {
    return emptyManifest();
  }
}

export async function writeManifest(manifest: VideoManifest) {
  manifest.updatedAt = new Date().toISOString();
  await put(MANIFEST_PATH, JSON.stringify(manifest, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });
  return manifest;
}

export async function upsertVideo(video: VideoItem) {
  const manifest = await readManifest();
  const idx = manifest.videos.findIndex((v) => v.id === video.id);
  if (idx >= 0) manifest.videos[idx] = video;
  else manifest.videos.unshift(video);
  return writeManifest(manifest);
}

export async function removeVideo(id: string) {
  const manifest = await readManifest();
  const removed = manifest.videos.find((v) => v.id === id);
  manifest.videos = manifest.videos.filter((v) => v.id !== id);
  await writeManifest(manifest);
  return { manifest, removed };
}
