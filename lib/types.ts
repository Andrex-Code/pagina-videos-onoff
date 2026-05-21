export type ChannelId = 'tiendason' | 'yadinero' | 'trycontroller';

export type VideoItem = {
  id: string;
  channel: ChannelId;
  title: string;
  intentKey: string;
  description: string;
  tags: string[];
  blobUrl: string;
  downloadUrl?: string;
  pathname?: string;
  contentType?: string;
  size?: number;
  uploadedAt: string;
};

export type VideoManifest = {
  version: number;
  updatedAt: string;
  videos: VideoItem[];
};

export const CHANNELS: { id: ChannelId; name: string; description: string }[] = [
  { id: 'tiendason', name: 'TiendasOn', description: 'Videos instructivos para soporte y operación POS.' },
  { id: 'yadinero', name: 'YaDinero', description: 'Videos y recursos para YaDinero/Yabot.' },
  { id: 'trycontroller', name: 'TryController', description: 'Videos y recursos para TryController.' }
];
