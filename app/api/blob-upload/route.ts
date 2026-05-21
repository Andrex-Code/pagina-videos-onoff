import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

const allowedChannels = ['tiendason', 'yadinero', 'trycontroller'];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}');
        if (!process.env.ADMIN_PASSWORD || payload.adminPassword !== process.env.ADMIN_PASSWORD) {
          throw new Error('No autorizado.');
        }
        if (!allowedChannels.includes(payload.channel)) throw new Error('Canal inválido.');
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ channel: payload.channel, title: payload.title })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Video subido:', blob.url);
      }
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
