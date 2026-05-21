'use client';

import { upload } from '@vercel/blob/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CHANNELS, type ChannelId, type VideoItem, type VideoManifest } from '@/lib/types';
import { slugify } from '@/lib/slug';

function sizeLabel(bytes?: number) {
  if (!bytes) return 'Tamaño no disponible';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function mediaNode(video: VideoItem) {
  return JSON.stringify({
    id: `video_${video.channel}_${slugify(video.intentKey)}`,
    name: `Video ${video.title}`,
    type: 'media',
    message_type: 'm.video',
    url: video.blobUrl,
    text: `Te comparto el video: ${video.title}`,
    o_connection: 'to_nat_post_respuesta'
  }, null, 2);
}

export default function HomePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [manifest, setManifest] = useState<VideoManifest>({ version: 1, updatedAt: '', videos: [] });
  const [selectedChannel, setSelectedChannel] = useState<ChannelId | 'todos'>('tiendason');
  const [query, setQuery] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [form, setForm] = useState({ channel: 'tiendason' as ChannelId, title: '', intentKey: '', description: '', tags: '' });

  async function loadVideos() {
    const res = await fetch('/api/videos', { cache: 'no-store' });
    setManifest(await res.json());
  }

  useEffect(() => { loadVideos().catch(() => setStatus('No fue posible cargar los videos.')); }, []);

  const videos = useMemo(() => {
    const q = query.toLowerCase().trim();
    return manifest.videos.filter((v) => {
      const byChannel = selectedChannel === 'todos' || v.channel === selectedChannel;
      const text = `${v.title} ${v.intentKey} ${v.description} ${v.tags.join(' ')}`.toLowerCase();
      return byChannel && (!q || text.includes(q));
    });
  }, [manifest.videos, selectedChannel, query]);

  async function copy(text: string, message: string) {
    await navigator.clipboard.writeText(text);
    setStatus(message);
    setTimeout(() => setStatus(''), 2500);
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setStatus('Selecciona un archivo de video.');
    if (!adminPassword) return setStatus('Ingresa la contraseña admin.');
    if (!form.title.trim()) return setStatus('Escribe el título.');
    if (!form.intentKey.trim()) return setStatus('Escribe la clave de intención.');

    setUploading(true);
    setStatus('Subiendo video a Vercel Blob...');
    try {
      const blob = await upload(`videos/${form.channel}/${slugify(form.intentKey)}-${slugify(file.name)}`, file, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
        clientPayload: JSON.stringify({ adminPassword, channel: form.channel, title: form.title })
      });

      setStatus('Registrando video en la biblioteca...');
      const res = await fetch('/api/videos/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
        body: JSON.stringify({
          channel: form.channel,
          title: form.title,
          intentKey: form.intentKey,
          description: form.description,
          tags: form.tags,
          blobUrl: blob.url,
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: file.size
        })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'No se pudo registrar el video.');
      setManifest(payload.manifest);
      setActiveVideo(payload.video);
      setStatus('Video subido. Ya puedes copiar la URL directa o el nodo media.');
      setForm({ ...form, title: '', intentKey: '', description: '', tags: '' });
      if (fileRef.current) fileRef.current.value = '';
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(video: VideoItem) {
    if (!adminPassword) return setStatus('Ingresa la contraseña admin.');
    const res = await fetch('/api/videos/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
      body: JSON.stringify({ id: video.id, deleteBlob: false })
    });
    const payload = await res.json();
    if (!res.ok) return setStatus(payload.error || 'No se pudo eliminar.');
    setManifest(payload.manifest);
    setActiveVideo(null);
    setStatus('Video eliminado del listado. El archivo Blob se conserva.');
  }

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Biblioteca multicanal</p>
          <h1>{process.env.NEXT_PUBLIC_LIBRARY_TITLE || 'Videos de Canales ONOFF'}</h1>
          <p>Sube videos .mp4 autorizados, copia la URL directa y prueba el envío como media en WhatsApp desde Ikono/Menuflow.</p>
        </div>
        <div className="metric"><b>{manifest.videos.length}</b><span>videos registrados</span></div>
      </section>

      <section className="channels">
        {CHANNELS.map((channel) => (
          <button key={channel.id} onClick={() => setSelectedChannel(channel.id)} className={selectedChannel === channel.id ? 'active' : ''}>
            <b>{channel.name}</b><span>{channel.description}</span><small>{manifest.videos.filter((v) => v.channel === channel.id).length} videos</small>
          </button>
        ))}
        <button onClick={() => setSelectedChannel('todos')} className={selectedChannel === 'todos' ? 'active' : ''}>
          <b>Todos</b><span>Biblioteca completa</span><small>{manifest.videos.length} videos</small>
        </button>
      </section>

      <section className="grid">
        <form onSubmit={handleUpload} className="card">
          <h2>Subir video</h2>
          <label>Contraseña admin<input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} /></label>
          <label>Canal<select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as ChannelId })}>{CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Título<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ventas de contado" /></label>
          <label>Clave de intención<input value={form.intentKey} onChange={(e) => setForm({ ...form, intentKey: e.target.value })} placeholder="venta_contado" /></label>
          <label>Descripción<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>Tags<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ventas, contado, POS" /></label>
          <label>Archivo<input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" /></label>
          <button disabled={uploading}>{uploading ? 'Subiendo...' : 'Subir video'}</button>
          {status && <p className="status">{status}</p>}
        </form>

        <section className="card">
          <h2>Videos</h2>
          <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título, intención o tag" />
          <div className="list">
            {videos.map((video) => (
              <article key={video.id} className="videoItem" onClick={() => setActiveVideo(video)}>
                <b>{video.title}</b>
                <span>{CHANNELS.find((c) => c.id === video.channel)?.name} · {video.intentKey} · {sizeLabel(video.size)}</span>
                <small>{video.description || 'Sin descripción'}</small>
              </article>
            ))}
            {!videos.length && <p className="empty">No hay videos para este filtro.</p>}
          </div>
        </section>
      </section>

      {activeVideo && (
        <section className="card detail">
          <div className="detailHead"><div><h2>{activeVideo.title}</h2><p>{activeVideo.description}</p></div><button onClick={() => setActiveVideo(null)}>Cerrar</button></div>
          <video src={activeVideo.blobUrl} controls playsInline />
          <div className="actions">
            <a href={activeVideo.blobUrl} target="_blank">Abrir URL directa</a>
            <button onClick={() => copy(activeVideo.blobUrl, 'URL directa copiada')}>Copiar URL</button>
            <button onClick={() => copy(mediaNode(activeVideo), 'Nodo media copiado')}>Copiar nodo media</button>
            <button className="danger" onClick={() => handleDelete(activeVideo)}>Eliminar del listado</button>
          </div>
          <pre>{mediaNode(activeVideo)}</pre>
        </section>
      )}
    </main>
  );
}
