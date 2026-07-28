import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

/**
 * Recebe um arquivo (PDF, vídeo ou outro) via multipart/form-data e guarda
 * no Netlify Blobs. PDFs têm o texto extraído na hora — é a mesma extração
 * que a v2 (assistente de IA real) vai usar como entrada para o modelo.
 *
 * Limite de tamanho: o corpo de uma Netlify Function síncrona tem teto de
 * ~6MB. Ficamos em 4,5MB de margem para não estourar por causa do overhead
 * do multipart. Arquivos maiores (vídeos longos) precisam de storage externo
 * (S3/R2) — fora do escopo deste MVP.
 *
 * Escrita em JavaScript puro (não .mts): o bundler de funções da Netlify usa
 * análise estática via typescript-eslint, que hoje quebra contra o
 * TypeScript 7 (beta) usado pelo front-end deste monorepo. Sem tipos aqui,
 * o bundler nem passa por esse caminho.
 */
const MAX_BYTES = 4.5 * 1024 * 1024;

export default async (req, _context) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido.' }, 405);
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Envie o arquivo como multipart/form-data.' }, 400);
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return json({ error: 'Não consegui ler o formulário enviado.' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return json({ error: 'Nenhum arquivo encontrado no campo "file".' }, 400);
  }
  if (file.size === 0) {
    return json({ error: 'O arquivo está vazio.' }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json(
      {
        error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). O limite atual é ${(MAX_BYTES / 1024 / 1024).toFixed(1)}MB.`,
      },
      413,
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const id = randomUUID();
  const mimeType = file.type || 'application/octet-stream';

  const filesStore = getStore('materials-files');
  await filesStore.set(id, arrayBuffer, {
    metadata: { mimeType, name: file.name, sizeBytes: file.size },
  });

  let hasText = false;
  let numPages = null;

  if (mimeType === 'application/pdf') {
    try {
      // Import tardio: evita carregar a lib em requisições que não são PDF.
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(Buffer.from(arrayBuffer));
      const text = (result.text ?? '').slice(0, 200_000); // teto de segurança para o blob de texto
      numPages = result.numpages ?? null;
      if (text.trim()) {
        const textStore = getStore('materials-text');
        await textStore.set(id, text);
        hasText = true;
      }
    } catch {
      // PDF protegido, corrompido ou só imagem escaneada: segue sem texto.
      hasText = false;
    }
  }

  return json({
    id,
    mimeType,
    name: file.name,
    sizeBytes: file.size,
    hasText,
    numPages,
  });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/materials/upload' };
