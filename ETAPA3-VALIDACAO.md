# Etapa 3 — Validação e Refinamento

Análise crítica do que foi construído na Etapa 2, seguida do plano de evolução.
Formato de cada achado: **problema → impacto → solução recomendada → prioridade**.

Total: 34 achados — 12 Alta, 15 Média, 7 Baixa.

---

## 1. Arquitetura

### 1.1 As telas conversam direto com o store; não existe camada de serviços — **Alta**
- **Problema.** Todas as 17 páginas chamam `useAppStore` diretamente. Não há `services/` nem cliente HTTP, embora a Etapa 1 preveja uma API REST/GraphQL modular.
- **Impacto.** Quando o back-end entrar, cada tela precisa ser reescrita para lidar com assincronia, cache, erro de rede e estado de carregamento real. É o tipo de refatoração que costuma introduzir regressões em massa.
- **Solução.** Introduzir `src/services/` (um módulo por domínio, espelhando os módulos NestJS) e TanStack Query para cache/revalidação. O Zustand fica só com estado de UI e mutações otimistas. Fazer isso **antes** de plugar a API, com os serviços devolvendo os mocks atuais — a troca vira uma mudança de implementação, não de telas.

### 1.2 O motor de regras vive no front-end, mas pertence ao domínio — **Alta**
- **Problema.** `apps/web/src/features/engine/` concentra priorização, geração de plano, redistribuição, conflitos e revisão espaçada. A arquitetura aprovada coloca essas regras no worker (recalculo de cronograma, geração de revisões, notificações).
- **Impacto.** Duplicação garantida: o worker vai reimplementar as mesmas fórmulas e os dois lados vão divergir silenciosamente. Um aluno veria uma prioridade no dashboard e outra na notificação por push.
- **Solução.** Extrair para `packages/domain-engine` — são funções puras, sem dependência de React ou do store. `apps/web`, `apps/api` e `apps/worker` importam do mesmo pacote. Custo baixo agora, altíssimo depois.

### 1.3 `shared-types` e `ui-kit` são consumidos como código-fonte via alias — **Média**
- **Problema.** Ambos os pacotes são resolvidos por alias do Vite/TS apontando para `src/index.ts`, sem build.
- **Impacto.** Funciona para o Vite, mas o NestJS (que compila com `tsc` e resolve `node_modules`) não vai consumir assim sem configuração extra. Some-se a isso a ausência de *project references*: o typecheck do web compila os pacotes toda vez.
- **Solução.** Publicar internamente com `tsup` (ESM + `.d.ts`) e `exports` no `package.json`, ou adotar TypeScript project references com `composite: true`. Decidir antes de criar `apps/api`.

### 1.4 A simulação de latência está espalhada pelas páginas — **Baixa**
- **Problema.** `useSimulatedLoad()` é chamado em Dashboard, Library e Stats para exercitar os estados de carregamento.
- **Impacto.** Vira lixo quando a API real chegar; se esquecido, adiciona 450–600 ms artificiais a cada navegação em produção.
- **Solução.** Marcar com `// TODO: remover ao integrar a API` (feito parcialmente) e substituir pelos estados do TanStack Query no mesmo commit da integração.

---

## 2. Escalabilidade

### 2.1 Estado inteiro serializado em `localStorage` a cada mutação — **Alta**
- **Problema.** O `persist` do Zustand grava o objeto completo (usuário, disciplinas, ~90 sessões, revisões, materiais, eventos de XP) a cada `set`. Um semestre de demonstração já gera dezenas de KB; quatro semestres com flashcards passam facilmente de 1 MB, contra um teto de ~5 MB por origem.
- **Impacto.** `JSON.stringify` síncrono a cada clique — travadas perceptíveis no fim do semestre, e falha silenciosa de escrita ao estourar a cota (o usuário perde dados sem aviso).
- **Solução.** Curto prazo: `partialize` gravando só o que muda e *debounce* de escrita; trocar `localStorage` por IndexedDB (`idb-keyval` como storage do `persist`). Médio prazo: o servidor vira a fonte da verdade e o local passa a ser cache offline.

### 2.2 Não há `migrate` na persistência versionada — **Alta**
- **Problema.** O store declara `version: 1` mas não implementa `migrate`. Qualquer mudança de formato (como a que fiz no seed durante a Etapa 2) simplesmente não alcança quem já tem estado salvo.
- **Impacto.** Usuário antigo com formato antigo + código novo = tela quebrada, sem caminho de recuperação além de "Redefinir" (que apaga tudo).
- **Solução.** Implementar `migrate(persisted, version)` com uma função por salto de versão, e testes para cada migração. Enquanto não houver, subir a versão deve vir acompanhado de migração ou de reset explícito com aviso.

### 2.3 Seletores derivados recalculam sobre a base inteira — **Média**
- **Problema.** `usePriorities` roda `computeAllPriorities` sobre **todas** as sessões (não só as do semestre corrente) a cada mudança de qualquer sessão; `useConflicts` reprocessa a semana inteira no render do Dashboard.
- **Impacto.** Hoje é irrelevante (~90 sessões). Com dois anos de histórico (~2.000 sessões × 6 disciplinas) o custo aparece em cada checkbox marcado.
- **Solução.** Filtrar por `semesterId` antes de agregar; memoizar por `(semestre, dia)`; e, com o back-end, servir agregados prontos via Redis, como já previsto na Etapa 1.

### 2.4 Componentes assinam fatias grandes do store — **Média**
- **Problema.** Padrão `useAppStore((s) => s.sessions)` em quase toda página: qualquer alteração em qualquer sessão re-renderiza a árvore inteira.
- **Impacto.** Concluir uma sessão re-renderiza Dashboard, sidebar e badges de uma vez.
- **Solução.** Seletores mais estreitos + `useShallow` para arrays derivados; extrair os contadores da sidebar para um seletor dedicado.

---

## 3. Segurança

### 3.1 `importData` aceita qualquer JSON sem validação — **Alta** — ✅ Corrigido
- **Problema.** `importData` faz `JSON.parse` e, checando apenas se existem `data.subjects` e `data.user`, aplica `set({ ...data })` no store.
- **Impacto.** Um arquivo malicioso (ou só corrompido) injeta estado arbitrário. Como o estado alimenta `href` de links e é persistido, isso vai de app quebrado a vetor de XSS assim que qualquer campo for renderizado sem escape ou usado em navegação.
- **Solução.** Validar com Zod contra o schema de `shared-types` antes de aplicar, rejeitar campos desconhecidos (`.strict()`), e mostrar ao usuário o que será sobrescrito. **Esta é a correção mais barata de alta severidade da lista.**
- **Aplicado em:** `apps/web/src/lib/import-schema.ts` (schema Zod `.strict()` espelhando `AppData`) + `importData` em `useAppStore.ts`, que agora atribui campo a campo em vez de `set({ ...data })` — fecha também a brecha de uma chave injetada sobrescrever uma ação do store. Não implementado: o aviso prévio "isto vai sobrescrever X" antes de aplicar (ficou para a correção de 4.4, que trata confirmação/desfazer de forma unificada).

### 3.2 Dados acadêmicos em claro no navegador — **Alta**
- **Problema.** Notas, materiais e desempenho ficam em `localStorage`, legíveis por qualquer script da origem e por qualquer pessoa com acesso ao perfil do navegador.
- **Impacto.** O cenário real do público-alvo é o laboratório da faculdade: o próximo aluno abre o app e vê as notas do anterior. Sob a LGPD, nota é dado pessoal.
- **Solução.** Migrar para sessão autenticada no servidor (Auth.js/Clerk, cookie `httpOnly` + `SameSite=Lax`); enquanto isso, oferecer "sair e limpar dados deste dispositivo" e avisar na primeira execução.

### 3.3 A chave da Anthropic não pode existir no front — **Alta** (v2)
- **Problema.** O stub atual é local, mas o caminho natural de implementação é chamar a API direto do navegador.
- **Impacto.** Chave exposta = custo ilimitado na conta do produto.
- **Solução.** Chamada exclusivamente pelo worker/API, com rate limit por usuário, teto de gasto e cache do resultado por material (a mesma apostila não deve ser resumida duas vezes).

### 3.4 Consentimento para enviar material do aluno a terceiro — **Alta** (v2)
- **Problema.** Resumir PDFs implica enviar conteúdo do aluno (às vezes material protegido por direitos autorais do professor) para um provedor externo.
- **Impacto.** Risco jurídico e de confiança; é exatamente o tipo de coisa que derruba a adoção institucional.
- **Solução.** Consentimento explícito por disciplina, aviso claro na tela do assistente (o texto já existe no stub), opção de desativar a IA por completo, e política de retenção documentada.

### 3.5 Upload de arquivos ainda não tem controles — **Média** (preventivo)
- **Problema.** A tela já prevê upload; o back ainda não existe.
- **Impacto.** PDF é vetor conhecido; upload direto sem limites permite abuso de armazenamento.
- **Solução.** URLs pré-assinadas (S3/R2), limite de tamanho e MIME verificado no servidor, varredura antivírus assíncrona, e servir sempre por domínio separado com `Content-Disposition: attachment`.

---

## 4. Usabilidade

### 4.1 O drag-and-drop permite criar conflitos — **Alta**
- **Problema.** Ao soltar um bloco em outro dia, o horário é preservado sem verificação; o choque com aula ou o estouro do teto diário só aparecem depois, no painel de alertas.
- **Impacto.** O produto promete "o sistema decide quando e se ajusta sozinho", mas deixa o aluno criar um plano inválido e só reclama depois.
- **Solução.** Validar no `onDragOver`: destacar a coluna em vermelho quando não couber e, ao soltar, encaixar no primeiro intervalo livre do dia (`freeIntervals` já devolve isso), avisando no toast qual horário foi escolhido.

### 4.2 Não dá para editar nem excluir quase nada — **Alta** — ✅ Corrigido
- **Problema.** Existem telas de criação para disciplina, trabalho, prova, material e meta, mas nenhuma de edição ou exclusão — embora `updateSubject`, `updateExam` e `deleteSession` já existam no store.
- **Impacto.** Um erro de digitação na carga horária contamina o cálculo de prioridade pelo semestre inteiro, sem saída.
- **Solução.** Um `<EntityFormModal>` reaproveitável em modo criar/editar, mais exclusão com confirmação e desfazer. É a maior lacuna funcional do que foi entregue.
- **Aplicado em:** editar/excluir agora existem nas 5 telas (Disciplinas já tinha editar — ganhou também o horário de aula, ver 4.3; Trabalhos, Provas, Metas e Materiais ganharam ambos). Adicionadas `deleteAssignment`, `deleteExam`, `deleteMaterial` em `useAppStore.ts`, com limpeza em cascata de revisões e sessões órfãs. Optei por reaproveitar os modais `New*` existentes com um prop `initial` (modo criar/editar) em vez de um `<EntityFormModal>` genérico novo — ganho equivalente, risco menor de regressão nesta etapa. Exclusão usa `confirm()` nativo, mesmo padrão já usado em "Arquivar" — o diálogo próprio + desfazer da 4.4 continua pendente.

### 4.3 Cadastro de disciplina não coleta horário de aula — **Alta** — ✅ Corrigido
- **Problema.** `NewSubjectModal` cria a disciplina com `classSlots: []`.
- **Impacto.** A detecção de choque com aula — uma das inteligências centrais da Etapa 1 — nunca dispara para disciplinas criadas pelo usuário. A regra existe e fica inerte.
- **Solução.** Incluir um editor de horários no cadastro (dia + início + fim + sala, repetível), com atalho "copiar do horário anterior".
- **Aplicado em:** `Subjects.tsx` — editor de horários (dia/início/fim/sala, múltiplas linhas) no modal de criar/editar. Também corrigido um defeito descoberto ao implementar: o modo edição salvava `classSlots: []` fixo, ou seja, **editar uma disciplina apagava o horário dela**. Não implementado: o atalho "copiar do horário anterior".

### 4.4 Nenhuma ação é reversível — **Média**
- **Problema.** "Gerar plano" descarta todos os blocos automáticos planejados da semana; "Redefinir" apaga tudo atrás de um `confirm()` nativo.
- **Impacto.** Perda de trabalho e medo de explorar o produto.
- **Solução.** Toast com "Desfazer" (guardando o estado anterior por ~10 s) nas ações destrutivas e um diálogo próprio no lugar do `confirm()`.

### 4.5 O onboarding pode ser pulado, deixando dados de demonstração — **Média**
- **Problema.** "Pular por agora" leva ao app com o semestre fictício de Rayane.
- **Impacto.** O usuário real não distingue o que é dele e o que é demonstração.
- **Solução.** Sinalizar visualmente o modo demonstração e oferecer "limpar dados de exemplo" em um banner persistente até o primeiro cadastro próprio.

### 4.6 A redistribuição de atrasos só enxerga a semana corrente — **Alta** (defeito concreto) — ✅ Corrigido
- **Problema.** Em `redistributeLate`, o horizonte é montado como `[...weekRange(today), ...weekRange(todayISO())]` — a **mesma semana duplicada**, deduplicada logo em seguida. A intenção era semana atual + próxima.
- **Impacto.** Atrasos acumulados numa sexta-feira não encontram espaço e caem em `unplaced`; o usuário recebe "não couberam" quando havia espaço na semana seguinte.
- **Solução.** `[...weekRange(today), ...weekRange(addDaysISO(today, 7))]` e teste unitário cobrindo o caso de virada de semana.
- **Aplicado em:** `useAppStore.ts` — corrigida a linha exatamente como sugerido. O teste unitário fica pendente (depende de 7.3, que ainda não foi atacado — o projeto não tem Vitest configurado).

---

## 5. Performance

### 5.1 O Pomodoro perde tempo em aba de fundo — **Média**
- **Problema.** O timer decrementa um contador a cada `setInterval` de 1 s. Navegadores limitam timers em abas ocultas a ~1 disparo/minuto.
- **Impacto.** O aluno minimiza a aba para estudar (o uso esperado!) e o Pomodoro atrasa vários minutos.
- **Solução.** Guardar o timestamp de início e calcular o restante por diferença de relógio a cada tick, com `Page Visibility API` para recalcular ao voltar.

### 5.2 Fontes carregadas do Google Fonts — **Média**
- **Problema.** Três famílias variáveis vindas de `fonts.googleapis.com` em `<link>` bloqueante.
- **Impacto.** Atraso de primeira renderização em rede ruim (público universitário em 4G) e transferência de IP para terceiro — questionável sob a LGPD.
- **Solução.** Auto-hospedar com subset `latin`, `font-display: swap` e `preload` só do peso do display.

### 5.3 Listas sem virtualização, contornadas com corte manual — **Média**
- **Problema.** O histórico de sessões da disciplina usa `.slice(0, 40)` para não pesar.
- **Impacto.** Dado escondido sem que o usuário saiba, e o problema volta em qualquer lista que cresça.
- **Solução.** Paginação vinda da API + `@tanstack/react-virtual` nas listas longas.

### 5.4 Recharts responde por 394 kB do bundle — **Média**
- **Problema.** Mesmo isolado em rota preguiçosa, é de longe o maior pedaço do app.
- **Impacto.** Estatísticas demora visivelmente na primeira visita em conexão lenta.
- **Solução.** Avaliar `uPlot` ou gráficos SVG próprios (os três gráficos usados são simples); manter Recharts só se novos tipos de gráfico justificarem.

---

## 6. Banco de dados (para a modelagem Prisma da próxima etapa)

### 6.1 `Review` tem referência polimórfica sem integridade — **Alta**
- **Problema.** `sourceType: 'material' | 'exam' | 'flashcard'` + `sourceId: ID` não pode virar chave estrangeira.
- **Impacto.** Revisões órfãs após excluir um material; o banco não consegue impedir.
- **Solução.** Três colunas nulas (`materialId`, `examId`, `flashcardId`) com `CHECK` garantindo exatamente uma preenchida, cada uma com FK e `ON DELETE CASCADE`.

### 6.2 Horários sem fuso — **Alta**
- **Problema.** `MinuteOfDay` e `ISODate` são locais implícitos; não há `timezone` no usuário.
- **Impacto.** Intercâmbio, mudança de estado ou horário de verão deslocam o plano inteiro; notificações agendadas pelo worker (que roda em UTC) disparam na hora errada.
- **Solução.** Guardar `timezone` (IANA) no usuário, persistir instantes em UTC (`timestamptz`) e converter na borda. Decidir isso **antes** da primeira migração.

### 6.3 Falta `updatedAt` e estratégia de sincronização — **Alta**
- **Problema.** Nenhuma entidade tem `updatedAt`/`deletedAt`, mas "sincronização entre dispositivos" é requisito da Etapa 1.
- **Impacto.** Sem carimbo de tempo não há como resolver conflito entre celular e notebook; edições somem sem rastro.
- **Solução.** `createdAt`/`updatedAt`/`deletedAt` em todas as tabelas, *last-write-wins* por campo no MVP, e um log de mudanças por usuário para sincronização incremental.

### 6.4 Crescimento sem limite de sessões, revisões e XP — **Média**
- **Problema.** Três tabelas crescem linearmente com o uso diário e são sempre consultadas por intervalo.
- **Impacto.** Dashboard degrada ao longo dos semestres.
- **Solução.** Índices compostos `(userId, date)` e `(subjectId, status, date)`; agregados diários materializados por semestre; arquivar semestres encerrados.

### 6.5 Exclusão de disciplina sem política definida — **Média**
- **Problema.** `Subject` tem `archived`, mas trabalhos, provas e materiais não têm equivalente; a UI só arquiva.
- **Impacto.** Comportamento inconsistente entre entidades e risco de apagar histórico usado nas estatísticas.
- **Solução.** Padronizar *soft delete* em tudo que alimenta relatório, com exclusão definitiva apenas por ação explícita do usuário.

---

## 7. Componentização e padrões

### 7.1 Cinco modais de formulário repetem o mesmo padrão — **Média**
- **Problema.** `NewSubjectModal`, `NewAssignmentModal`, `NewExamModal`, `NewMaterialModal` e `NewGoalModal` reimplementam estado local, validação ad hoc e rodapé.
- **Impacto.** Cada regra nova precisa ser escrita cinco vezes; a validação já está inconsistente entre eles.
- **Solução.** `<FormModal>` genérico + `react-hook-form` + schemas Zod em `shared-types`, reutilizados na validação do back-end.

### 7.2 Validação de entrada praticamente ausente — **Média**
- **Problema.** Só nome de disciplina e título de trabalho são validados. Passam prazo no passado, carga horária negativa, prova antes do início do semestre, meta com alvo zero.
- **Impacto.** Dado inválido alimenta o motor de regras e produz prioridades sem sentido.
- **Solução.** Schemas Zod por entidade, com mensagens em português, aplicados no formulário e no serviço.

### 7.3 Nenhum teste automatizado — **Alta**
- **Problema.** O projeto não tem Vitest, Testing Library nem Playwright.
- **Impacto.** O motor de regras é lógica pura, densa e com muitos casos de borda (virada de semana, escada de revisão, sobrecarga) — exatamente o que quebra em silêncio numa refatoração.
- **Solução.** Vitest cobrindo `features/engine` (meta: >85% naquele diretório), Testing Library nos fluxos críticos (concluir sessão, avaliar revisão, mover cartão) e um Playwright de fumaça pelas 17 rotas.

### 7.4 Sem ESLint, Prettier ou CI — **Alta**
- **Problema.** Só `tsc --noEmit` protege o repositório.
- **Impacto.** Erros que o TypeScript não pega (dependências de hooks, `key` ausente, imports não usados) entram sem barreira; formatação diverge assim que houver duas pessoas.
- **Solução.** ESLint (`react-hooks`, `jsx-a11y`, `@typescript-eslint`), Prettier, `lint-staged` no pre-commit e um workflow de CI rodando lint + typecheck + testes + build.

### 7.5 Textos em português espalhados no JSX — **Baixa**
- **Problema.** Nenhuma camada de i18n.
- **Impacto.** Internacionalizar depois significa tocar em todos os arquivos de tela.
- **Solução.** `react-i18next` com um único namespace `pt-BR` agora; o custo é baixo e evita a varredura futura.

### 7.6 `useAppStore` concentra ~40 ações em um arquivo — **Média**
- **Problema.** Mais de 500 linhas misturando UI, domínio e persistência.
- **Impacto.** Conflitos de merge constantes e dificuldade de testar isoladamente.
- **Solução.** Dividir em slices por domínio (`createSubjectsSlice`, `createPlannerSlice`…) compostos no store raiz.

---

## 8. Acessibilidade

### 8.1 O texto terciário não atinge contraste AA — **Alta** — ✅ Corrigido
- **Problema.** O token `--ink-3` (`#7B869C`) rende **3,7:1** sobre o papel claro e **4,4:1** sobre a superfície escura — abaixo do mínimo de 4,5:1 do WCAG AA. E ele é usado justamente em legendas de 11–12 px (metadados, contadores, datas).
- **Impacto.** Boa parte das informações secundárias do produto é difícil de ler — inclusive para quem não tem deficiência, em telas ruins ou sob luz forte.
- **Solução.** Escurecer para algo como `#5C6880` no claro e clarear para `#98A3B8` no escuro, e nunca usar `ink-3` abaixo de 12 px. Correção de duas linhas no `theme.css`, com efeito em todas as telas.
- **Aplicado em:** `theme.css` — exatamente os valores sugeridos. A regra "nunca abaixo de 12px" não foi auditada tela a tela; vale uma verificação futura com um linter de contraste.

### 8.2 O drag-and-drop por teclado não se anuncia — **Alta**
- **Problema.** O `KeyboardSensor` está configurado, mas sem `screenReaderInstructions` nem `announcements` do dnd-kit.
- **Impacto.** Quem usa leitor de tela não descobre que pode mover blocos e não recebe confirmação do que aconteceu — na prática, a funcionalidade não existe para essas pessoas.
- **Solução.** Fornecer instruções e anúncios em português no `DndContext` ("Bloco de Cálculo II movido para quinta-feira, 19:00") e oferecer, como alternativa, mover por menu de contexto.

### 8.3 Gráficos sem equivalente textual — **Média**
- **Problema.** Os gráficos do Recharts não expõem os dados a tecnologias assistivas; só a tabela de comparação semanal é acessível.
- **Impacto.** A tela de Estatísticas fica parcialmente inacessível.
- **Solução.** `role="img"` com `aria-label` resumindo a tendência, mais um `<table>` visualmente oculto com os mesmos dados (ou um alternador "ver como tabela").

### 8.4 Cor como diferenciador principal no calendário — **Média**
- **Problema.** No calendário, os eventos são distinguidos por cor de disciplina, com prova marcada por `★` e entrega por borda tracejada.
- **Impacto.** Para daltonismo, disciplinas diferentes viram blocos iguais.
- **Solução.** Prefixo textual curto com o código da disciplina (`MAT02`) nos chips, além da cor.

### 8.5 `Switch` sem `aria-describedby` — **Baixa**
- **Problema.** A descrição de cada opção em Configurações é apenas visual.
- **Impacto.** O leitor de tela anuncia o rótulo sem a explicação.
- **Solução.** Ligar descrição e controle por `aria-describedby`.

### 8.6 Fundo do modal não fica inerte — **Baixa**
- **Problema.** Há trap de foco por teclado, mas o conteúdo atrás continua no fluxo do leitor de tela.
- **Impacto.** Navegação por rotor sai do diálogo.
- **Solução.** `inert` no container principal enquanto o modal estiver aberto.

---

## 9. Manutenibilidade

### 9.1 Sem observabilidade — **Média**
- **Problema.** O `ErrorBoundary` só faz `console.error`.
- **Impacto.** Erro em produção só existe se o usuário reclamar.
- **Solução.** Sentry (ou OTel) no boundary e nos serviços, com *release tagging* e *source maps*.

### 9.2 Seed de ~600 linhas dentro do app web — **Média**
- **Problema.** `src/data/seed.ts` mistura dados de demonstração com o código do produto.
- **Impacto.** Vai ao bundle de produção e não serve ao `prisma/seed.ts` do back-end.
- **Solução.** Mover para `packages/fixtures`, carregar sob demanda apenas em modo demonstração e reutilizar no seed do banco e nos testes.

### 9.3 Manipulação de data por `slice(0, 10)` espalhada — **Média**
- **Problema.** Existem helpers em `lib/date.ts`, mas vários pontos ainda fatiam ISO string na mão (`completedAt.slice(0, 10)`).
- **Impacto.** Quando entrar fuso horário (6.2), cada um desses pontos vira um bug independente.
- **Solução.** Proibir manipulação direta por lint e centralizar tudo em `lib/date.ts`.

### 9.4 Documentação de decisão inexistente além do DESIGN.md — **Baixa**
- **Problema.** As justificativas técnicas estão em `DESIGN.md` e em comentários.
- **Impacto.** A próxima pessoa não sabe por que o calendário é próprio e não FullCalendar.
- **Solução.** ADRs curtos em `docs/adr/` (um por decisão relevante).

---

## Plano de evolução

### Versão 1.0 — MVP

**Entregue na Etapa 2:** front-end completo e navegável com as 17 telas, design system próprio ("Marca-texto & Fichário") em `packages/ui-kit`, motor de regras determinístico funcionando (priorização, geração e redistribuição de plano, conflitos, sobrecarga, revisão espaçada 1-3-7-15-30-60), **streak e XP** visíveis no dashboard e no perfil, metas como desafios com barra de ritmo, estatísticas com comparação entre semanas, e o **assistente de IA como stub funcional** — tela, fluxo, loading, erro e envio de flashcards para a fila de revisão, tudo pronto para receber a API.

**Falta para chamar de 1.0 de produção** (ordem sugerida):
1. ~~Correções de prioridade Alta desta análise — com destaque para contraste AA (8.1), validação do import (3.1), edição/exclusão de entidades (4.2), horário de aula no cadastro (4.3) e o defeito da redistribuição (4.6).~~ ✅ Esses 5 já foram corrigidos (ver marcações acima). Restam da lista de Alta: 1.1, 1.2, 2.1, 2.2, 3.2, 6.1–6.3, 7.3, 7.4, 8.2.
2. Fundação de qualidade: ESLint + Prettier + CI + testes do motor de regras (7.3, 7.4).
3. Extração de `packages/domain-engine` e criação da camada de serviços (1.1, 1.2).
4. Back-end NestJS + Prisma + PostgreSQL com o modelo já corrigido (6.1–6.5), autenticação e uploads em S3/R2.
5. Worker com BullMQ para recalculo de cronograma, geração de revisões e notificações.

### Versão 2.0 — assistente de IA de verdade

- Substituir o stub por chamadas reais à **API da Anthropic**, sempre pelo back-end: extração de texto de PDFs/slides e transcrição de vídeos no worker, geração de **resumos, flashcards e quizzes a partir do material real do aluno**, com citação do trecho de origem.
- Flashcards gerados entram direto na fila de revisão espaçada (o fluxo já existe na interface).
- **Sugestões em linguagem natural para o cronograma**: "você tem 11h de lacuna para a prova de Cálculo e três noites livres — sugiro concentrar frações parciais na terça".
- Explicação de tópicos difíceis a partir do próprio material, no lugar de conteúdo genérico.
- Infraestrutura que isso exige: consentimento por disciplina, cache por material, teto de gasto e rate limit por usuário, e trilha de auditoria do que foi enviado ao modelo.

### Versão 3.0 — social, mobile e integrações

- **Colaboração entre estudantes**: grupos por disciplina, materiais e resumos compartilhados com controle de permissão.
- **Compartilhamento de planos de estudo** como modelo público ("plano de revisão para Cálculo II"), clonável por outros alunos.
- **App mobile** (React Native reaproveitando `shared-types` e `domain-engine`) com notificações push nativas e Pomodoro em segundo plano.
- **Integração com calendários externos** (Google/Apple/Outlook via CalDAV e ICS), bidirecional, respeitando compromissos já existentes na hora de gerar o plano.
- **Sistema de recompensas mais completo**: conquistas, ligas entre amigos, metas coletivas — mantendo o princípio de reforço de hábito, sem transformar o app em competição.
- **Relatórios avançados**: previsão de nota final por disciplina, correlação entre horas investidas e desempenho, e exportação em PDF para orientação acadêmica.
