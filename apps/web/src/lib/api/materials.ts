/**
 * Cliente para as Netlify Functions de upload/armazenamento de materiais.
 * Único ponto do front-end que fala com o "back-end" (ainda que seja só
 * uma função serverless + Netlify Blobs, sem banco de dados de verdade).
 */

export interface UploadedFile {
  id: string;
  mimeType: string;
  name: string;
  sizeBytes: number;
  hasText: boolean;
  numPages: number | null;
}

export class UploadError extends Error {}

export async function uploadMaterialFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);

  let res: Response;
  try {
    res = await fetch('/api/materials/upload', { method: 'POST', body: form });
  } catch {
    throw new UploadError('Não consegui me conectar ao servidor. Verifique sua internet e tente de novo.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new UploadError(body?.error ?? `Falha no upload (código ${res.status}).`);
  }

  return res.json();
}

export function materialFileUrl(fileId: string): string {
  return `/api/materials/file?id=${encodeURIComponent(fileId)}`;
}

export async function fetchMaterialText(fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/materials/text?id=${encodeURIComponent(fileId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.text ?? null;
  } catch {
    return null;
  }
}

/** Duração de um vídeo local (antes do upload), em minutos inteiros (mínimo 1). */
export function readVideoDurationMinutes(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      cleanup();
      resolve(Math.max(1, Math.round(video.duration / 60)));
    };
    video.onerror = () => {
      cleanup();
      resolve(1);
    };
    video.src = url;
  });
}
