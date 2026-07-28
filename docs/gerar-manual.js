/**
 * Gerador do manual do usuário do Study Planner AI.
 * Aplica a identidade "Marca-texto & Fichário" definida na Etapa 2.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const C = {
  papel: '#F5F7FA',
  grafite: '#141A2A',
  tinta: '#3B3BD9',
  marca: '#FFE24D',
  caneta: '#E5484D',
  quadro: '#12B886',
  ink2: '#4A5468',
  ink3: '#5C6880', // já com o contraste corrigido apontado na Etapa 3
  hair: '#DFE4EE',
  surface2: '#EEF1F7',
  amarelo: '#FFE24D',
  limao: '#9BF06B',
  rosa: '#FF7BC5',
  ciano: '#5CE1FF',
  lilas: '#B79BFF',
  laranja: '#FFA24D',
};

const DISC = [C.amarelo, C.limao, C.rosa, C.ciano, C.lilas, C.laranja];

/* ------------------------------------------------------------------ *
 * Conteúdo
 * ------------------------------------------------------------------ */

const CHAPTERS = [
  {
    title: 'Antes de começar',
    lead: 'O Study Planner AI é o seu fichário digital: você diz o que precisa estudar, e ele decide quando, avisa quando algo atrasa e reorganiza o plano sozinho.',
    steps: [
      'Abra o app pelo endereço que você publicou (ou por http://localhost:5173 se estiver rodando no seu computador).',
      'Ele abre já com um semestre de demonstração: 6 disciplinas, provas, trabalhos e materiais. Serve para você mexer em tudo sem medo.',
      'Quando quiser trocar pelas suas matérias de verdade, vá em Configurações, desça até "Seus dados" e clique em "Começar do zero com meus dados" — isso apaga o exemplo e te leva direto para o cadastro inicial.',
      'Tudo o que você faz fica salvo automaticamente no seu navegador. Não existe botão "salvar" — não tem como esquecer.',
    ],
    tips: [
      'Os dados ficam apenas neste navegador e neste computador. Se limpar o histórico, eles somem — por isso o manual ensina a fazer backup no capítulo 17.',
    ],
  },
  {
    title: 'Conhecendo a tela',
    lead: 'Toda tela do app tem a mesma estrutura. Aprender esta parte faz o resto ficar fácil.',
    steps: [
      'Menu lateral (esquerda): todas as telas, organizadas em Hoje, Planejamento, Acadêmico, Biblioteca e Progresso. No celular, ele aparece ao tocar no ícone de três riscos.',
      'Números vermelhos no menu: são coisas atrasadas pedindo sua atenção — revisões vencidas ou entregas com prazo estourado.',
      'Topo da tela: mostra sua sequência de dias estudados (chama) e seus pontos de experiência (raio).',
      'Botão Buscar (ou as teclas Ctrl e K juntas): procura qualquer disciplina, trabalho, prova ou material pelo nome.',
      'Ícone de lua/sol: alterna entre tema claro e escuro.',
      'Cada disciplina tem uma cor fixa. Ela aparece como um risco de marca-texto no nome e como uma abinha colorida na lateral dos cartões — é assim que você reconhece a matéria sem precisar ler.',
    ],
    tips: ['Use Ctrl+K para chegar em qualquer lugar sem navegar pelo menu. É o atalho mais útil do app.'],
  },
  {
    title: 'Primeira configuração (Onboarding)',
    lead: 'São quatro passos rápidos para o sistema entender a sua rotina e montar o primeiro cronograma.',
    steps: [
      'Acesse pelo Perfil, no final da página, em "Repetir o onboarding".',
      'Passo 1 — Quem é você: informe nome, curso e instituição.',
      'Passo 2 — Suas disciplinas: digite o nome da matéria e a carga horária e clique em Adicionar. Repita para cada uma. Cada disciplina recebe uma cor automaticamente.',
      'Passo 3 — Seu tempo: marque os dias em que você costuma estudar, quantas horas por dia aguenta e o tamanho do bloco de estudo (50 minutos é o padrão).',
      'Passo 4 — Clique em "Gerar meu plano". Pronto: o sistema já distribui os blocos de estudo na sua semana.',
    ],
    tips: [
      'Seja honesta(o) nas horas por dia. Esse número vira o limite que dispara o alerta de sobrecarga — se você exagerar, o app deixa você se afogar em blocos.',
    ],
  },
  {
    title: 'Dashboard: o resumo do dia',
    lead: 'É a tela inicial. Ela responde "o que eu faço agora?" sem você precisar procurar.',
    steps: [
      'No topo, quatro números: sua sequência de dias, seu nível e XP, as horas estudadas na semana e a porcentagem do que você planejou e realmente cumpriu.',
      'Agenda de hoje: seus blocos de estudo. O botão de play inicia o cronômetro Pomodoro; o de check marca como concluído.',
      'O que priorizar: a lista das matérias em ordem de urgência, com o motivo escrito embaixo ("Prova em 8 dias", "Média atual 5.8"). Quem está no topo é quem precisa de você hoje.',
      'Na coluna da direita: revisões pendentes, prazos que estão chegando e o andamento da sua meta da semana.',
      'Se aparecer o botão "Redistribuir atrasos", clique nele: o app pega o que você não conseguiu fazer e realoca nos próximos dias com espaço livre.',
    ],
    tips: [
      'Na barra da meta existe um risquinho vertical: ele marca onde você deveria estar hoje para fechar no prazo. Barra antes do risco significa que você está atrasada(o).',
    ],
  },
  {
    title: 'Disciplinas',
    lead: 'O cadastro das matérias do semestre. Tudo no app pendura em uma disciplina.',
    steps: [
      'Clique em Disciplinas no menu lateral.',
      'Para criar: botão "Nova disciplina". Preencha nome, código, professor, carga horária, peso (1 = tranquila, 5 = crítica) e escolha a cor.',
      'O peso diz ao sistema o quanto essa matéria puxa a sua atenção — use 5 para aquela que você tem medo de reprovar.',
      'Clique na estrela para marcar como favorita e no nome da disciplina para abrir os detalhes.',
      'Ícone de lápis: edita a disciplina — nome, código, professor, carga horária, peso, média atual e cor. Use para corrigir algo cadastrado errado, sem precisar apagar e criar de novo.',
      'Ícone de arquivo (a caixinha ao lado do lápis): arquiva a disciplina. Ela some das suas listas e do cronograma, mas os trabalhos, provas e materiais que já estavam ligados a ela continuam guardados no histórico.',
      'Dentro da disciplina, as abas mostram Visão geral (por que ela está nessa prioridade), Materiais, Trabalhos, Provas e o histórico de Sessões.',
      'Use o filtro "Por prioridade" para ver a lista na ordem em que o sistema recomenda estudar.',
    ],
    tips: [
      'A barra "Carga cumprida" compara as horas que você já estudou com a carga total da matéria. É o jeito mais rápido de ver qual disciplina está abandonada.',
      'Arquivar pede confirmação e não tem um botão de "desarquivar" ainda. Se for só um erro de digitação, prefira editar em vez de arquivar e recriar.',
    ],
  },
  {
    title: 'Planejamento semanal',
    lead: 'A grade da semana, com os blocos de estudo distribuídos. É aqui que você negocia com a realidade.',
    steps: [
      'Clique em Semana no menu.',
      'Botão "Gerar plano": o sistema distribui os blocos automaticamente, dando mais espaço às matérias de maior prioridade e respeitando os horários que você marcou como livres.',
      'Para mover um bloco: passe o mouse sobre ele, segure o ícone de arrastar (os seis pontinhos) e solte em outro dia. No teclado, dê Tab até o ícone, aperte Espaço, use as setas e solte com Espaço de novo.',
      'A barrinha no topo de cada dia mostra o quanto daquele dia já está comprometido. Se ficar vermelha, você passou do seu limite diário.',
      'A faixa vermelha de alertas avisa sobre choque de horário, dois blocos no mesmo momento ou dia sobrecarregado.',
      '"Redistribuir atrasos" pega o que ficou para trás e encaixa nos próximos dias com espaço.',
      'No rodapé, "Sugestão com base no seu histórico" mostra em que período do dia você realmente cumpre o que planeja.',
    ],
    tips: [
      'Gerar o plano de novo apaga apenas os blocos criados automaticamente que ainda não aconteceram. Os que você criou ou moveu na mão são preservados.',
    ],
  },
  {
    title: 'Planejamento diário e Pomodoro',
    lead: 'A visão de um dia só, com checklist. É a tela para deixar aberta enquanto estuda.',
    steps: [
      'Clique em "Planejamento diário" no menu. Use as setas para ver outros dias.',
      'Cada bloco tem dois botões: play (inicia o Pomodoro) e check (marca como concluído sem cronômetro).',
      'No Pomodoro: o círculo mostra o tempo restante. Pause com o botão do meio e reinicie com a seta circular.',
      'Terminado o tempo, o app avisa e passa sozinho para a pausa. Ao acabar de estudar, clique em "Concluir sessão" para registrar no seu histórico e ganhar XP.',
      'Mais abaixo, "Entregas com prazo hoje" traz as subtarefas dos trabalhos que vencem — dá para ir marcando ali mesmo.',
      '"Janelas livres" mostra os horários vagos do dia, caso você queira encaixar algo extra.',
      'Para adicionar um bloco manualmente: botão "Adicionar bloco", escolha disciplina, horário e duração.',
    ],
    tips: [
      'Evite trocar de aba durante o Pomodoro: alguns navegadores atrasam o cronômetro quando a janela fica escondida.',
    ],
  },
  {
    title: 'Calendário',
    lead: 'Provas, entregas, blocos de estudo e revisões no mesmo mês.',
    steps: [
      'Clique em Calendário. Alterne entre Mês e Semana no canto superior direito.',
      'Os botõezinhos Prova, Entrega, Estudo e Revisão ligam e desligam cada tipo de evento. Clique para deixar só o que interessa.',
      'Provas aparecem com uma estrela e em vermelho; entregas com borda tracejada; blocos de estudo na cor da disciplina.',
      'Clique em qualquer dia para ver, no painel da direita, as aulas daquele dia e a agenda completa com horários.',
    ],
    tips: ['Se um dia estiver com "+3" no cantinho, é porque há mais eventos do que cabem: clique nele para ver todos.'],
  },
  {
    title: 'Trabalhos (quadro Kanban)',
    lead: 'Um quadro com quatro colunas para acompanhar suas entregas do começo ao fim.',
    steps: [
      'Clique em Trabalhos. As colunas são: A fazer, Em andamento, Em revisão e Entregue.',
      'Para cadastrar: "Novo trabalho" — título, disciplina, prazo e quantas horas você acha que vai levar.',
      'Para mudar de coluna: arraste o cartão pelo ícone dos seis pontinhos.',
      'Clique no cartão para abrir os detalhes: ali você marca subtarefas, adiciona novas e vê os anexos.',
      'Cartão com borda vermelha é prazo vencido.',
      'Ao arrastar para "Entregue" (ou clicar em "Marcar como entregue"), você ganha 60 XP.',
    ],
    tips: [
      'Quebre trabalhos grandes em subtarefas. A barrinha de progresso do cartão mostra o quanto já andou, e é bem mais motivador que um item gigante parado.',
    ],
  },
  {
    title: 'Provas',
    lead: 'Cada prova cadastrada puxa a prioridade da disciplina para cima conforme a data se aproxima.',
    steps: [
      'Clique em Provas e depois em "Nova prova".',
      'Informe título, disciplina, data, quantas horas você acha que precisa estudar e o conteúdo cobrado (separando os tópicos por vírgula).',
      'O círculo à esquerda de cada prova mostra quantos dias faltam. Abaixo de 7 dias ele fica vermelho.',
      'A barra "Preparo" compara as horas que você já estudou daquela matéria com as horas que você definiu como necessárias.',
      'No rodapé do cartão aparecem as datas de revisão que ainda cabem antes da prova.',
      'Provas já realizadas ficam numa tabela no fim da página, com a nota.',
    ],
    tips: [
      'Cadastre a prova assim que o professor anunciar, mesmo sem saber o conteúdo. É a data que faz o cronograma se reorganizar a seu favor.',
    ],
  },
  {
    title: 'PDFs, materiais e o assistente de IA',
    lead: 'Sua biblioteca por disciplina — e o lugar onde a inteligência artificial trabalha em cima do SEU material.',
    steps: [
      'Clique em "PDFs e materiais". Filtre por disciplina ou busque por título e tag.',
      'Para adicionar: botão "Adicionar" — título, disciplina, total de páginas e tags.',
      'Cada cartão mostra o progresso de leitura. Ao terminar, clique em "Marcar como estudado".',
      'Importante: marcar como estudado é o que coloca o conteúdo na fila de revisão espaçada. É esse clique que faz a memorização funcionar.',
      'Botão "Resumo · flashcards · quiz": abre o assistente. Escolha a aba desejada e clique em Gerar.',
      'Na aba Flashcards, o botão "Enviar para revisão espaçada" transforma cada cartão numa revisão futura.',
      'Na aba Quiz, clique nas alternativas para responder: a certa fica verde e aparece a explicação.',
    ],
    tips: [
      'Nesta versão o assistente é uma simulação (aparece o aviso "stub" na tela). As telas e o fluxo já são os definitivos — quando a conexão com a IA de verdade for ligada, nada muda para você.',
    ],
  },
  {
    title: 'Vídeo-aulas e Leituras',
    lead: 'Funcionam exatamente como os materiais, mudando só a unidade de medida.',
    steps: [
      'Vídeo-aulas conta minutos assistidos; Leituras conta páginas lidas.',
      'O cadastro e os botões são os mesmos: adicionar, favoritar, marcar como estudado e usar o assistente.',
      'Serve para livros e artigos da bibliografia, não só para PDF de slide.',
    ],
    tips: ['Cadastre o livro inteiro como uma leitura só e vá atualizando a página atual: o app calcula o quanto falta.'],
  },
  {
    title: 'Revisão espaçada',
    lead: 'A técnica que faz o conteúdo grudar: você revê o mesmo assunto em intervalos cada vez maiores — 1, 3, 7, 15, 30 e 60 dias.',
    steps: [
      'Clique em "Revisão espaçada". No topo, quantas estão vencidas, para hoje, agendadas e concluídas.',
      'A fila mostra um assunto por vez. Primeiro tente lembrar do conteúdo de cabeça, sem consultar nada.',
      'Clique em "Tentei lembrar — mostrar orientação" e então avalie com sinceridade.',
      'Esqueci: volta ao começo da escada, você revê amanhã. Difícil: o intervalo encurta. Fácil: avança para o próximo degrau.',
      'Cada revisão feita vale 12 XP e o próximo assunto aparece na hora.',
      'As abas Próximas e Histórico mostram o que está agendado e o que você já fechou.',
    ],
    tips: [
      'Avaliar tudo como "Fácil" só engana você mesma(o): o intervalo aumenta rápido demais e o conteúdo some antes da prova. Seja honesta(o) no "Difícil".',
    ],
  },
  {
    title: 'Metas, sequência e XP',
    lead: 'A parte de jogo, feita para sustentar o hábito ao longo do semestre.',
    steps: [
      'Clique em Metas. No topo aparece seu nível, seu título (de "Caloura(o)" até "Mestre do cronograma") e quanto falta para subir.',
      'Para criar uma meta: "Nova meta" — título, o que contar (horas, sessões, revisões, entregas ou materiais), o alvo, o período e, se quiser, uma disciplina específica.',
      'Cada meta mostra o número atual, o alvo e o risquinho do ritmo esperado para hoje.',
      'Meta marcada como "em risco" significa que, no ritmo atual, você não fecha no prazo.',
      'A sequência (chama, no topo da tela) conta dias seguidos com pelo menos uma sessão concluída. Se você passar um dia inteiro sem estudar, ela zera.',
      'XP: 20 por sessão de estudo, 12 por revisão feita e 60 por trabalho entregue.',
    ],
    tips: [
      'Metas curtas e realistas funcionam melhor. Prefira "12h nesta semana" que você cumpre a "30h" que só gera culpa.',
    ],
  },
  {
    title: 'Estatísticas',
    lead: 'Os números que dizem se o seu plano está funcionando de verdade.',
    steps: [
      'Clique em Estatísticas.',
      'O gráfico de barras compara, nas últimas 6 semanas, o que você planejou e o que cumpriu. Barras muito diferentes significam que você planeja demais.',
      'A rosquinha mostra como as horas se dividiram entre as matérias na semana.',
      'A grade de quadradinhos é a sua constância nos últimos 84 dias: quanto mais forte o amarelo, mais horas naquele dia.',
      'A tabela do fim compara cada disciplina com a semana anterior, mostrando se você subiu ou caiu.',
      '"Melhor faixa" indica o período do dia em que você mais cumpre o que planeja.',
    ],
    tips: [
      'Se o cumprimento estiver abaixo de 60%, o problema quase nunca é preguiça: é plano ambicioso demais. Reduza as horas por dia em Configurações.',
    ],
  },
  {
    title: 'Notificações',
    lead: 'A central de avisos do sistema: o que atrasou, o que está apertando e o que corre risco.',
    steps: [
      'Clique no sininho, no topo, ou em Notificações no menu.',
      'Use as abas Todas, Não lidas e "Requerem ação" para filtrar.',
      'Cada aviso tem um botão Abrir que leva direto para a tela onde você resolve o problema.',
      '"Marcar todas como lidas" limpa a lista de uma vez.',
      'Os tipos são: prazo, prova, revisão vencida, meta em risco, sobrecarga, conflito de horário e sequência.',
    ],
    tips: ['Você escolhe quais avisos quer receber em Configurações, na seção Notificações.'],
  },
  {
    title: 'Configurações',
    lead: 'Onde você ajusta o app ao seu ritmo — e onde faz o backup dos seus dados.',
    steps: [
      'Ritmo de estudo: teto de horas por dia, duração do bloco, pausa curta, pausa longa e quantos ciclos até a pausa longa.',
      'Revisão espaçada: os intervalos, separados por vírgula. O padrão é 1, 3, 7, 15, 30, 60 — só mude se souber o que está fazendo (o botão "restaurar padrão" volta atrás).',
      'Disponibilidade semanal: marque os dias em que você estuda. Só esses dias recebem blocos automáticos.',
      'Notificações: ligue e desligue cada tipo de aviso.',
      'Aparência: tema claro, escuro ou igual ao do seu sistema.',
      'Seus dados — Exportar: baixa um arquivo .json com tudo. Faça isso de vez em quando, é o seu backup.',
      'Seus dados — Importar: recupera esse arquivo em outro computador ou depois de limpar o navegador.',
      'Seus dados — "Redefinir para o exemplo": apaga suas alterações e volta ao semestre de demonstração (Cálculo II e companhia). Bom para testar o app do zero.',
      'Seus dados — "Começar do zero com meus dados": apaga TUDO (inclusive as disciplinas de demonstração) e te leva direto para o cadastro inicial, para você montar o seu semestre de verdade.',
    ],
    tips: [
      'Exporte seus dados no fim de cada mês. Como tudo fica salvo no navegador, limpar o cache sem backup significa perder o semestre.',
      'Tanto "Redefinir para o exemplo" quanto "Começar do zero" são irreversíveis. Se tiver dúvida, exporte antes de clicar em qualquer um dos dois.',
    ],
  },
  {
    title: 'Perfil',
    lead: 'Seus dados, seus números do semestre e seu histórico de conquistas.',
    steps: [
      'Clique no círculo com suas iniciais, no canto superior direito.',
      '"Editar dados" muda nome, e-mail, curso e instituição.',
      'Os cartões mostram disciplinas ativas, horas estudadas, revisões feitas e entregas concluídas.',
      'À esquerda, seu nível e a tabela de quanto vale cada ação.',
      '"Atividade recente" lista os últimos pontos ganhos, com data.',
      'A chama mostra sua sequência atual; o troféu, o seu recorde.',
    ],
    tips: [],
  },
  {
    title: 'Perguntas frequentes',
    lead: 'As dúvidas que aparecem primeiro.',
    steps: [
      'Preciso de internet? Só para abrir o site. Depois disso, tudo funciona no seu navegador.',
      'Meus dados vão para algum servidor? Não. Ficam apenas neste navegador, neste dispositivo.',
      'Usei em dois computadores e os dados não são os mesmos. Correto: ainda não há sincronização. Use Exportar e Importar para levar seus dados de um lado ao outro.',
      'Apaguei sem querer. Se você tiver um arquivo exportado, use Importar. Sem backup, não há como recuperar.',
      'O plano não gerou nenhum bloco. Verifique em Configurações se há dias marcados na disponibilidade semanal e se o teto de horas é maior que zero.',
      'A IA está inventando o resumo? Nesta versão ela é uma simulação, sim — e a tela avisa isso. A geração real a partir do seu PDF entra na próxima versão.',
      'Posso apagar uma disciplina? Dá para arquivar (ícone de caixinha no card da disciplina) — ela some das listas e do cronograma, mas o histórico de trabalhos e provas ligados a ela fica guardado. Ainda não existe exclusão definitiva.',
      'Como troco os dados de demonstração pelos meus? Configurações → Seus dados → "Começar do zero com meus dados". Isso apaga o exemplo e abre o cadastro inicial para você.',
    ],
    tips: [],
  },
  {
    title: 'Rotina sugerida e atalhos',
    lead: 'Como usar o app no dia a dia sem virar mais uma tarefa.',
    steps: [
      'Todo domingo (10 minutos): abra o Plano da semana, clique em "Gerar plano" e ajuste arrastando o que não couber na sua vida real.',
      'Todo dia (2 minutos): abra o Planejamento diário, faça os blocos com o Pomodoro e marque o que concluiu.',
      'Todo dia (5 minutos): passe pela fila de Revisão espaçada. É o hábito de maior retorno do app.',
      'Toda sexta (5 minutos): olhe Estatísticas e veja se o planejado e o cumprido estão perto um do outro.',
      'Quando o professor anunciar algo: cadastre a prova ou o trabalho na hora. O cronograma se ajusta sozinho.',
      'Atalho Ctrl + K: busca global. Tab e Shift+Tab: navega pelos botões. Espaço: pega e solta um bloco arrastável. Esc: fecha qualquer janela.',
    ],
    tips: [
      'Se um dia der tudo errado e você não estudar nada, use "Redistribuir atrasos" no dia seguinte em vez de tentar recuperar tudo de uma vez.',
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Renderização
 * ------------------------------------------------------------------ */

const M = { top: 62, bottom: 66, left: 58, right: 58 };
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CW = PAGE_W - M.left - M.right;

function build(tocPages) {
  const doc = new PDFDocument({
    size: 'A4',
    autoFirstPage: false,
    bufferPages: true,
    // O layout é controlado à mão pelas constantes M/room(); com as margens
    // padrão, qualquer texto escrito abaixo delas (rodapé) faz o pdfkit
    // inserir uma página em branco automaticamente.
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: 'Study Planner AI — Manual do usuário',
      Author: 'Study Planner AI',
      Subject: 'Guia passo a passo de todas as funcionalidades',
    },
  });

  let chapterColor = C.tinta;
  const pageOf = {};

  function pageChrome() {
    // fundo papel
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(C.papel);
    // aba de fichário na borda esquerda (assinatura do produto)
    doc.rect(0, 96, 7, 132).fill(chapterColor);
  }

  function newPage() {
    doc.addPage();
    pageChrome();
    doc.y = M.top;
  }

  function room(h) {
    if (doc.y + h > PAGE_H - M.bottom) newPage();
  }

  function text(str, opts = {}) {
    const {
      size = 10.5,
      color = C.ink2,
      font = 'Helvetica',
      gap = 3,
      indent = 0,
      width = CW - indent,
      space = 6,
    } = opts;
    doc.font(font).fontSize(size).fillColor(color);
    const h = doc.heightOfString(str, { width, lineGap: gap });
    room(h);
    doc.text(str, M.left + indent, doc.y, { width, lineGap: gap });
    doc.y += space;
  }

  /* ---------- capa ---------- */
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(C.papel);
  doc.rect(0, 0, PAGE_W, 250).fill(C.grafite);

  doc.roundedRect(M.left, 66, 34, 34, 9).fill(C.papel);
  doc.font('Helvetica-Bold').fontSize(20).fillColor(C.grafite).text('S', M.left + 11, 76);
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(C.papel)
    .text('Study Planner AI', M.left + 46, 78);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#98A3B8')
    .text('organização acadêmica para quem estuda de verdade', M.left + 46, 94);

  doc.font('Helvetica-Bold').fontSize(40).fillColor(C.papel).text('Manual do', M.left, 148);

  // passada de marca-texto sobre a palavra
  doc.save();
  doc.rotate(-1.1, { origin: [M.left, 214] });
  doc.rect(M.left - 5, 212, 196, 30).fill(C.marca);
  doc.restore();
  doc.font('Helvetica-Bold').fontSize(40).fillColor(C.grafite).text('usuário', M.left, 208);

  doc
    .font('Helvetica')
    .fontSize(12.5)
    .fillColor(C.ink2)
    .text(
      'Um guia passo a passo de todas as funcionalidades, escrito para quem nunca abriu o aplicativo.',
      M.left,
      280,
      { width: CW - 110, lineGap: 5 },
    );

  // amostra das cores de disciplina
  DISC.forEach((hex, i) => {
    doc.roundedRect(M.left + i * 30, 350, 22, 10, 3).fill(hex);
  });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(C.ink3)
    .text('cada disciplina tem a sua cor', M.left, 368);

  // destaques da capa
  const highlights = [
    ['17 telas', 'do dashboard ao perfil'],
    ['Revisão 1-3-7-15-30-60', 'para o conteúdo grudar'],
    ['Pomodoro e metas', 'para manter o ritmo'],
  ];
  let hy = 430;
  highlights.forEach(([a, b]) => {
    doc.roundedRect(M.left, hy, CW - 110, 46, 10).fillAndStroke('#FFFFFF', C.hair);
    doc.rect(M.left, hy + 10, 5, 26).fill(C.tinta);
    doc.font('Helvetica-Bold').fontSize(11.5).fillColor(C.grafite).text(a, M.left + 18, hy + 12);
    doc.font('Helvetica').fontSize(9.5).fillColor(C.ink3).text(b, M.left + 18, hy + 27);
    hy += 56;
  });

  doc.rect(M.left, PAGE_H - 120, 40, 3).fill(C.caneta);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(C.ink3)
    .text('Versão 1.1 · Etapa 2 (front-end) · dados salvos no seu navegador', M.left, PAGE_H - 104, {
      width: CW,
    });

  /* ---------- sumário ---------- */
  newPage();
  chapterColor = C.tinta;
  doc.font('Helvetica-Bold').fontSize(24).fillColor(C.grafite).text('Sumário', M.left, doc.y);
  doc.y += 18;

  CHAPTERS.forEach((ch, i) => {
    const y = doc.y;
    doc.roundedRect(M.left, y + 1, 20, 14, 4).fill(DISC[i % 6]);
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(C.grafite)
      .text(String(i + 1).padStart(2, '0'), M.left + 4, y + 4);
    doc.font('Helvetica').fontSize(11).fillColor(C.grafite).text(ch.title, M.left + 30, y + 2);

    const pageNum = tocPages ? tocPages[i] : null;
    if (pageNum) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(C.ink3)
        .text(String(pageNum), M.left, y + 2, { width: CW, align: 'right' });
    }
    doc.y = y + 22;
  });

  doc.y += 10;
  doc.roundedRect(M.left, doc.y, CW, 62, 10).fillAndStroke('#FFF8DB', C.marca);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(C.grafite)
    .text('Com pressa?', M.left + 14, doc.y + 12);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(C.ink2)
    .text(
      'Leia os capítulos 2 (Conhecendo a tela), 6 (Planejamento semanal) e 13 (Revisão espaçada). Com esses três você já usa o essencial do aplicativo.',
      M.left + 14,
      doc.y + 28,
      { width: CW - 28, lineGap: 2 },
    );

  doc.y += 74;
  doc.roundedRect(M.left, doc.y, CW, 74, 10).fillAndStroke('#FFFFFF', C.quadro);
  doc.rect(M.left, doc.y + 12, 5, 50).fill(C.quadro);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(C.grafite)
    .text('Novidades desta atualização', M.left + 18, doc.y + 12);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(C.ink2)
    .text(
      '• Agora dá para editar e arquivar disciplinas (capítulo 5).\n' +
        '• Novo botão "Começar do zero com meus dados", em Configurações, para trocar o semestre de demonstração pelas suas matérias reais (capítulos 1 e 17).',
      M.left + 18,
      doc.y + 28,
      { width: CW - 32, lineGap: 3 },
    );

  /* ---------- capítulos ---------- */
  CHAPTERS.forEach((ch, i) => {
    chapterColor = DISC[i % 6];
    newPage();
    pageOf[i] = doc.bufferedPageRange().count; // número humano da página atual

    // número do capítulo
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(C.ink3)
      .text(`CAPÍTULO ${String(i + 1).padStart(2, '0')}`, M.left, doc.y);
    doc.y += 16;

    // título com passada de marca-texto
    doc.font('Helvetica-Bold').fontSize(21);
    const tw = Math.min(doc.widthOfString(ch.title), CW);
    const ty = doc.y;
    doc.save();
    doc.rotate(-0.7, { origin: [M.left, ty + 20] });
    doc.rect(M.left - 4, ty + 7, tw + 12, 19).fill(chapterColor);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(21).fillColor(C.grafite).text(ch.title, M.left, ty, { width: CW });
    doc.y += 12;

    text(ch.lead, { size: 11.5, color: C.grafite, gap: 4, space: 16 });

    // passos
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(C.ink3)
      .text('PASSO A PASSO', M.left, doc.y);
    doc.y += 12;

    ch.steps.forEach((s, k) => {
      doc.font('Helvetica').fontSize(10.5);
      const h = doc.heightOfString(s, { width: CW - 30, lineGap: 3.5 });
      room(h + 12);
      const y = doc.y;
      doc.circle(M.left + 8, y + 7, 8).fill(C.surface2);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(C.tinta)
        .text(String(k + 1), M.left + (k + 1 > 9 ? 3 : 5.5), y + 4);
      doc
        .font('Helvetica')
        .fontSize(10.5)
        .fillColor(C.ink2)
        .text(s, M.left + 26, y, { width: CW - 30, lineGap: 3.5 });
      doc.y += 9;
    });

    // dicas
    ch.tips.forEach((t) => {
      doc.font('Helvetica').fontSize(9.8);
      const h = doc.heightOfString(t, { width: CW - 44, lineGap: 3 }) + 34;
      room(h + 8);
      const y = doc.y + 8;
      doc.roundedRect(M.left, y, CW, h - 8, 9).fillAndStroke('#FFFFFF', C.hair);
      doc.rect(M.left, y + 10, 5, h - 28).fill(C.marca);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.ink3).text('DICA', M.left + 18, y + 11);
      doc
        .font('Helvetica')
        .fontSize(9.8)
        .fillColor(C.ink2)
        .text(t, M.left + 18, y + 24, { width: CW - 44, lineGap: 3 });
      doc.y = y + h;
    });
  });

  /* ---------- rodapés ---------- */
  const range = doc.bufferedPageRange();
  for (let p = 1; p < range.count; p++) {
    doc.switchToPage(p);
    doc.rect(M.left, PAGE_H - 52, CW, 0.8).fill(C.hair);
    // lineBreak:false é essencial: sem isso o pdfkit tenta paginar o rodapé
    // (que fica abaixo da margem inferior) e cria uma página em branco por chamada.
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(C.ink3)
      .text('Study Planner AI — Manual do usuário', M.left, PAGE_H - 44, {
        width: CW / 2,
        lineBreak: false,
      });
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(C.ink3)
      .text(String(p + 1), M.left, PAGE_H - 44, { width: CW, align: 'right', lineBreak: false });
  }

  return { doc, pageOf };
}

/* Passo 1: descobrir em que página cada capítulo cai. */
const first = build(null);
const tmp = path.join(process.env.TEMP || '.', 'manual-pass1.pdf');
first.doc.pipe(fs.createWriteStream(tmp));
first.doc.end();

const tocPages = CHAPTERS.map((_, i) => first.pageOf[i]);

/* Passo 2: gerar de novo, agora com o sumário numerado. */
const out = path.resolve(process.argv[2] || 'Manual-Study-Planner-AI.pdf');
const final = build(tocPages);
const stream = fs.createWriteStream(out);
final.doc.pipe(stream);
final.doc.end();
stream.on('finish', () => {
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`OK: ${out} (${kb} KB, ${final.doc.bufferedPageRange().count} páginas)`);
});
