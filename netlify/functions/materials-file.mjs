import { getStore } from '@netlify/blobs';

/**
 * Serve os bytes de um material enviado (PDF, vídeo, etc).
 *
 * Sem autenticação: quem tiver o id (um UUID, não listável) consegue ler o
 * arquivo. Aceitável para o uso pessoal deste MVP, mas não é isolamento real
 * por usuário — isso só vem com contas de verdade (v1.0 do plano de evolução).
 */
export default async (req, _context) => {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return new Response('Faltou o parâmetro "id".', { status: 400 });

  const store = getStore('materials-files');
  const entry = await store.getWithMetadata(id, { type: 'arrayBuffer' });
  if (!entry) return new Response('Arquivo não encontrado.', { status: 404 });

  const meta = entry.metadata ?? {};
  const safeName = (meta.name ?? id).replace(/["\r\n]/g, '');

  return new Response(entry.data, {
    headers: {
      'content-type': meta.mimeType || 'application/octet-stream',
      'content-disposition': `inline; filename="${safeName}"`,
      'cache-control': 'private, max-age=3600',
    },
  });
};

export const config = { path: '/api/materials/file' };
