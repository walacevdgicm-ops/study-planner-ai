import { getStore } from '@netlify/blobs';

/**
 * Devolve o texto extraído de um PDF (quando houve extração no upload).
 * Serve tanto para a leitura dentro da plataforma quanto — na v2 — para
 * alimentar o assistente de IA real.
 */
export default async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return json({ error: 'Faltou o parâmetro "id".' }, 400);

  const store = getStore('materials-text');
  const text = await store.get(id, { type: 'text' });

  return json({ text: text ?? null });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/materials/text' };
