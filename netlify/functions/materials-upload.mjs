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
      const extracted = await extractPdfText(arrayBuffer);
      numPages = extracted.numPages;
      const text = extracted.text.slice(0, 200_000); // teto de segurança para o blob de texto
      if (text.trim()) {
        const textStore = getStore('materials-text');
        await textStore.set(id, text);
        hasText = true;
      }
    } catch (err) {
      // PDF protegido, corrompido ou só imagem escaneada: segue sem texto.
      console.error('Falha ao extrair texto do PDF', err);
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

/**
 * Extrai o texto de um PDF com `pdfjs-dist` (build "legacy", sem DOM).
 *
 * Não usa `pdf-parse`: a lib empacota uma versão travada e antiga do pdf.js
 * (v1.10.100, de ~2018) que, carregada via `import()` dentro de uma função
 * `.mjs`, falha de forma determinística com "bad XRef entry" em PDFs
 * perfeitamente válidos — reproduzido também com `require`/`createRequire`
 * a partir de um processo iniciado como ESM. Ou seja: `hasText` nunca dava
 * `true` de verdade, e o assistente de IA nunca tinha texto real para usar.
 * `pdfjs-dist` já é dependência do projeto (o `react-pdf` do front-end usa a
 * mesma lib) e funciona normalmente neste contexto.
 */
async function extractPdfText(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const numPages = doc.numPages;
  const pagesToRead = Math.min(numPages, 60); // teto de segurança para tempo/memória da function
  let text = '';
  for (let i = 1; i <= pagesToRead; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n\n';
  }
  await doc.destroy();

  return { text, numPages };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/materials/upload' };
