import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

const MAX_DURATION_SEC = 30 * 60; // 30 min máximo

// Descarga el video completo a disco (para reproducirlo en la app sin depender de Facebook).
// Devuelve el path absoluto del archivo.
export async function downloadVideoToFile(url: string, destDir: string, filename: string): Promise<{ filePath: string; title: string; duration: number }> {
  const meta = await getMetadata(url);
  await mkdir(destDir, { recursive: true });
  const filePath = path.join(destDir, filename);

  await new Promise<void>((resolve, reject) => {
    const child = spawn('yt-dlp', [
      url,
      '--no-playlist',
      '--no-warnings',
      '--newline',
      '-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
      '--merge-output-format', 'mp4',
      '-o', filePath.replace(/\.mp4$/, '.%(ext)s'),
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`yt-dlp falló al descargar (${code}): ${stderr.slice(0, 300)}`));
      resolve();
    });
  });

  return { filePath, title: meta.title, duration: meta.duration };
}

// Descarga SOLO el audio del video a memoria (nunca toca disco).
// -o -  → salida por stdout; se captura en un Buffer en RAM.
export async function downloadAudioToBuffer(url: string): Promise<{ buffer: Buffer; title: string; duration: number }> {
  const meta = await getMetadata(url);
  const buffer = await fetchAudio(url);
  return { buffer, title: meta.title, duration: meta.duration };
}

function getMetadata(url: string): Promise<{ title: string; duration: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', [
      url,
      '--no-playlist',
      '--no-warnings',
      '--skip-download',
      '--print', '%(title)s|%(duration)s',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let stderr = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`yt-dlp falló (${code}): ${stderr.slice(0, 300)}`));
      const line = out.trim().split('\n')[0] || '';
      const sep = line.lastIndexOf('|');
      const title = sep > 0 ? line.slice(0, sep) : line;
      const duration = sep > 0 ? Number(line.slice(sep + 1)) || 0 : 0;
      resolve({ title, duration });
    });
  });
}

function fetchAudio(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', [
      url,
      '-o', '-',
      '-f', 'bestaudio/best',
      '--no-playlist',
      '--no-warnings',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    const chunks: Buffer[] = [];
    let size = 0;
    child.stdout.on('data', (d: Buffer) => {
      chunks.push(d);
      size += d.length;
      if (size > 150 * 1024 * 1024) {
        child.kill();
        reject(new Error('El audio es demasiado grande (límite ~150 MB).'));
      }
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`yt-dlp falló (${code}): ${stderr.slice(0, 300)}`));
      resolve(Buffer.concat(chunks));
    });
  });
}

// Transcribe con Whisper (acepta mp4/m4a/webm/etc.). Costo ~$0.006/min.
export async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
  if (!config.openai.apiKey) throw new Error('OPENAI_API_KEY no está configurada');
  if (buffer.length === 0) throw new Error('Audio vacío');

  const form = new FormData();
  form.append('model', 'whisper-1');
  form.append('file', new Blob([buffer], { type: 'audio/mpeg' }), filename);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.openai.apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Whisper ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text || '').trim();
}

export { MAX_DURATION_SEC };
