# Study Planner AI

Plataforma de organização acadêmica para estudantes universitários — disciplinas, prazos, materiais, planejamento semanal/diário, revisão espaçada, metas e estatísticas em um único painel, com um motor de regras que prioriza, redistribui e alerta automaticamente.

> **Status: Etapa 2 (front-end) concluída.** A Etapa 1 (lógica e arquitetura) está em `../study-planner-ai-etapa1-arquitetura.md` e é a fonte da verdade. A Etapa 3 (validação e refinamento) ainda não foi iniciada.

## Como rodar

```bash
npm install
```

```bash
npm run dev
```

O app sobe em `http://localhost:5173`. Outros scripts: `npm run build`, `npm run typecheck`, `npm run preview`.

## Estrutura

```
study-planner-ai/
├── apps/
│   └── web/                     # front-end React + TypeScript + Vite
│       └── src/
│           ├── pages/           # as 17 telas
│           ├── components/      # shell, cards e blocos compartilhados
│           ├── features/        # engine/ (regras), pomodoro/, ai/
│           ├── store/           # Zustand + seletores derivados
│           ├── data/            # semestre mockado (seed determinístico)
│           ├── lib/             # datas, cores, hooks
│           └── styles/theme.css # design system em tokens (Tailwind v4)
├── packages/
│   ├── shared-types/            # entidades da Etapa 1, compartilháveis com api/worker
│   └── ui-kit/                  # primitivos de interface do produto
└── DESIGN.md                    # identidade visual e autocrítica
```

## O que já funciona (sem back-end)

- **Motor de regras determinístico** (`src/features/engine/`): priorização por prova/nota/carga/entrega, geração automática do plano semanal, redistribuição de atrasos, detecção de conflitos e sobrecarga, revisão espaçada 1-3-7-15-30-60, streak e XP.
- **Estado local persistido** em `localStorage` com exportação/importação em JSON (Configurações → Seus dados).
- **Assistente de IA como stub**: fluxo completo de resumo, flashcards e quiz, com resposta simulada e marcada como tal. A conexão real com a API da Anthropic entra na v2 — apenas `src/features/engine/ai-assistant.ts` precisa mudar.

## Dados de demonstração

O app já abre com um semestre completo (6 disciplinas, provas, trabalhos, materiais, ~90 sessões de histórico). Para voltar ao estado inicial depois de mexer: **Configurações → Seus dados → Redefinir**.
