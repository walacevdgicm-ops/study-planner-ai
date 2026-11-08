# 🎓 Study Planner AI

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)

Plataforma de organização acadêmica para estudantes universitários — disciplinas, prazos, materiais, planejamento semanal/diário, revisão espaçada, metas e estatísticas em um único painel, com um motor de regras que prioriza, redistribui e alerta automaticamente.

> **Status:** front-end completo, com **17 telas** e motor de regras funcionando 100% no navegador. Próxima etapa: back-end e IA real.

## 🧩 Destaques

- 🧠 **Motor de priorização** que decide o que estudar primeiro (prova, nota, carga e prazos)
- 📅 **Plano semanal e diário gerados automaticamente**, com redistribuição de atrasos
- 🔁 **Revisão espaçada** (1-3-7-15-30-60 dias)
- ⏱️ **Pomodoro**, metas, **XP e streak** (gamificação)
- 📄 **Leitor de PDF** de materiais e assistente de IA (resumos, flashcards e quiz)
- 🏗️ **Monorepo** com `apps/web` + `packages/ui-kit` + `packages/shared-types`

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

## 👨‍💻 Autor

**Walace Soares Vidigal Junior** · [GitHub](https://github.com/walacevdgicm-ops)

Licença [MIT](LICENSE)
