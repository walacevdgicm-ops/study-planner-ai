# Study Planner AI — Plano de Design (Etapa 2)

> Escrito **antes** do código, conforme exigido pelo prompt. Inclui a autocrítica contra os padrões genéricos de design gerado por IA.

---

## 1. Conceito: "Marca-texto & Fichário"

O produto é sobre **estudar de verdade** — não sobre produtividade corporativa. A referência não é Notion/Linear, é a mesa do estudante: fichário com abas coloridas por matéria, marca-texto passado no que importa, caneta azul, caneta vermelha de correção.

A tradução digital disso tem uma vantagem funcional, não só estética: o **sistema de cores por disciplina** — que a Etapa 1 já exige como atributo da entidade Disciplina — deixa de ser um bullet colorido genérico e vira a linguagem visual inteira do produto. O aluno reconhece "Cálculo II" pela cor antes de ler o texto, em qualquer tela.

---

## 2. Paleta (6 cores nomeadas — núcleo do sistema)

| Nome | Hex | Papel no sistema |
|---|---|---|
| **Papel** | `#F5F7FA` | Fundo do modo claro. Branco levemente **azulado** (papel sob luz fria), nunca creme. |
| **Grafite** | `#141A2A` | Texto/tinta no claro; base de superfície no escuro. |
| **Tinta** | `#3B3BD9` | Ação primária — a caneta esferográfica azul. Botões, links, foco. |
| **Marca-texto** | `#FFE24D` | Energia/hábito: streak, XP, item destacado do dia. |
| **Caneta Vermelha** | `#E5484D` | Atraso, conflito, prazo estourado, erro. |
| **Verde-quadro** | `#12B886` | Concluído, meta batida, sucesso. |

### Escala de disciplinas (paralela, 6 tons de marcador)

`Amarelo #FFE24D` · `Limão #9BF06B` · `Rosa #FF7BC5` · `Ciano #5CE1FF` · `Lilás #B79BFF` · `Laranja #FFA24D`

**Regra dura:** cor de disciplina **nunca** carrega significado de sistema (nada de "verde = ok"). Identidade semântica fica só nas 3 cores semânticas do núcleo. Isso evita a ambiguidade clássica de dashboards multicoloridos.

---

## 3. Tipografia (3 papéis)

| Papel | Fonte | Uso |
|---|---|---|
| **Display** | Bricolage Grotesque | Títulos, números grandes do Dashboard, nome de disciplina. Grotesca variável, com personalidade e largura ajustável. Só ≥18px. |
| **Corpo** | Public Sans | Texto de interface, listas, formulários. Neutra, alta legibilidade, sem ser Inter (onipresente). |
| **Dados** | JetBrains Mono | Timer Pomodoro, horas, contagem regressiva, XP, tabelas numéricas. Tabular por natureza — números não "dançam" ao atualizar. |

---

## 4. Elemento de assinatura visual

Quatro manifestações da cor da disciplina — é isso que ninguém mais tem:

1. **Swipe de marca-texto** — a cor passa *atrás* do nome da disciplina como um traço irregular (bordas onduladas, extremidades desalinhadas), em `mix-blend-mode: multiply`. Nunca um retângulo perfeito.
2. **Aba de fichário** — barra de 6px na borda esquerda dos cards, com "orelha" arredondada no topo. O item ativo do menu lateral ganha a mesma aba.
3. **Wash** — blocos de estudo na grade semanal usam a cor da disciplina a ~14% de opacidade com a aba em cor cheia. Legibilidade preservada: texto sempre Grafite.
4. **Pauta de caderno** — superfícies de planejamento (semana, dia, calendário) têm linhas horizontais a 4% de opacidade, como folha pautada.

---

## 5. Autocrítica — isso foge do genérico?

Confronto direto com os três padrões vetados no prompt:

| Padrão vetado | Por que este design não cai nele |
|---|---|
| Fundo creme + serifada + terracota | O papel é **frio/azulado** (`#F5F7FA`), a tipografia é **grotesca** em todos os papéis, e os acentos são de **marcador saturado**, o oposto do terracota dessaturado. |
| Quase-preto + um acento neon | O **padrão é o modo claro**; o escuro é Grafite azulado (não preto) e mantém as **seis** cores de marcador — não há acento único. |
| Layout jornal com hairlines | A hierarquia vem de **blocos de cor, abas e washes**, não de fios de 1px e capitulares. Divisórias finas são exceção, não sistema. |

**Riscos que eu mesmo vejo, e as mitigações que já entram no código:**

- *Paleta de marcador pode parecer infantil.* → Cor forte só em superfícies pequenas (abas, swipes, chips), sempre <10% da área da tela; nada de fundos saturados; texto **nunca** branco sobre marcador.
- *`multiply` quebra no dark mode.* → Tokens separados: no escuro o swipe vira `screen` com alfa reduzido e a cor sobe em luminosidade.
- *Bricolage Grotesque cansa em texto corrido.* → Restrita a ≥18px; todo corpo é Public Sans.
- *Seis cores de disciplina não bastam para 8+ matérias.* → A escala cicla com variação de padrão (swipe sólido / swipe listrado), não só de cor.
- *Contraste.* → Alvo AA: Grafite sobre Papel = ~15:1; Tinta sobre Papel = ~7:1; texto sobre wash a 14% permanece >12:1.

---

## 6. Decisões técnicas (com alternativa considerada)

| Decisão | Alternativa | Por que a escolhida |
|---|---|---|
| **Calendário próprio sobre `date-fns`** | FullCalendar (citado na Etapa 1 como "ou") | A Etapa 1 já autoriza as duas. FullCalendar traria ~200kb, CSS próprio brigando com a identidade (pauta, washes, abas) e um segundo sistema de drag-and-drop. Com `date-fns` + `@dnd-kit`, semana/mês/kanban compartilham **um** motor de DnD e o visual é 100% nosso. |
| **`@dnd-kit`** | `react-beautiful-dnd` | RBD está em manutenção mínima e tem suporte fraco a React 19; `@dnd-kit` tem sensores de **teclado** nativos — requisito de acessibilidade do prompt. |
| **Zustand + `persist`** | Redux Toolkit | Sem back-end nesta etapa, o estado é local e persistido em `localStorage`; RTK adicionaria cerimônia sem ganho. A Etapa 1 já cita "Zustand/Redux". |
| **Tailwind v4 com tokens em CSS** | Tailwind v3 + `tailwind.config.js` | v4 declara o design system em `@theme`, o que mantém paleta e tipografia em **um só arquivo** — exatamente o que um design system precisa para não derivar. |
| **Componentes próprios no `packages/ui-kit`** | shadcn/ui via CLI | shadcn é copiar-e-colar de qualquer forma; escrevendo direto no `ui-kit` (estrutura já aprovada na Etapa 1) os primitivos já nascem com aba, swipe e tokens do produto, em vez de serem "descaracterizados" depois. A API segue as mesmas convenções (Radix-like, `cn()`, variantes). |
