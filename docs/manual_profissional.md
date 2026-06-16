# Guia de Uso Completo: LashCenter (Painel da Profissional)

Bem-vinda ao **LashCenter**! Este manual foi projetado para ajudar você, profissional da beleza e estética (Lash Designers, Micropigmentadoras, Esteticistas, etc.), a dominar todas as funcionalidades da sua nova plataforma de gestão.

Com o LashCenter, você centraliza seu controle de clientes, serviços, faturamento, agenda e ainda oferece um portal de agendamentos online para as suas clientes marcarem sozinhas, reduzindo o tempo gasto respondendo mensagens no WhatsApp.

---

## Sumário
1. [Primeiro Acesso e Onboarding](#1-primeiro-acesso-e-onboarding)
2. [Configurações Iniciais do Estúdio](#2-configurações-iniciais-do-estúdio)
3. [Gestão de Serviços](#3-gestão-de-serviços)
4. [Gestão de Clientes e Ficha Cadastral](#4-gestão-de-clientes-e-ficha-cadastral)
5. [Configuração de Expediente (Meus Horários)](#5-configuração-de-expediente-meus-horários)
6. [Controle da Agenda (Agendamentos)](#6-controle-da-agenda-agendamentos)
7. [Entendendo o Dashboard (Métricas)](#7-entendendo-o-dashboard-métricas)
8. [Faturamento, Planos e Bloqueio Financeiro](#8-faturamento-planos-e-bloqueio-financeiro)
9. [Prompts de Apoio (Vídeos e Marketing)](#9-prompts-de-apoio-vídeos-e-marketing)

---

## 1. Primeiro Acesso e Onboarding

O primeiro passo para utilizar o LashCenter é criar sua conta de acesso como administradora do estúdio.

### Passo a Passo:
1. Acesse a tela de cadastro em `/cadastro`.
2. Preencha seus dados de forma cuidadosa:
   * **Nome Completo**: Seu nome profissional.
   * **E-mail**: Escolha um e-mail de uso profissional ativo.
   * **WhatsApp**: Insira seu celular principal.
   * **Senha**: Crie uma senha segura (mínimo de 6 caracteres).
3. Clique em **Criar Conta**.
4. O sistema irá criar seu cadastro e criar automaticamente uma estrutura isolada para o seu estúdio no banco de dados.
5. Você será redirecionada automaticamente para a página de **Configurações** para preencher as informações do seu negócio.

> [!NOTE]
> O LashCenter separa os dados de cada estúdio de forma totalmente segura. Nenhuma outra profissional cadastrada no sistema terá acesso às suas clientes, serviços ou faturamento.

---

## 2. Configurações Iniciais do Estúdio
*Rota: `/configuracoes` (Menu Lateral -> Configurações)*

Antes de começar a atender ou enviar o link para suas clientes, você precisa configurar os detalhes do seu estúdio. Esta página é dividida em três abas ou blocos:

### A. Dados do Perfil
* **O que ajustar**: Seu nome de exibição e sua foto de perfil.
* **Redefinição de Senha**: Caso queira alterar sua senha, você pode digitar a nova senha e clicar em salvar.

### B. Dados do Negócio (Estúdio)
* **Nome do Negócio**: Nome do seu estúdio (ex: *Bruna Lash Center*). Este nome aparecerá no topo do portal do cliente.
* **Descrição do Estúdio**: Uma mini-biografia explicando seus diferenciais ou especialidades (pode ser o mesmo texto da bio do seu Instagram).
* **Instagram**: Seu usuário do Instagram (sem o `@`). O sistema gerará um link clicável direto no portal da cliente.
* **Endereço do Estúdio**: Endereço físico completo. Essencial para que as clientes saibam onde ir no dia do atendimento.
* **Logotipo**: Clique em **Carregar Logo** para enviar uma foto quadrada com o logotipo da sua marca. Ela aparecerá no menu lateral e no portal de agendamentos.

### C. Identidade Visual (Design Personalizado)
* **Paleta de Cores**: Escolha a cor que melhor combina com a sua marca. O LashCenter oferece cores elegantes pensadas no ramo da estética (como *Rosa Rose*, *Nude Clássico*, *Cereja Intenso*, *Lavanda Suave*, etc.).
* **Modo Escuro**: Ative para visualizar o painel em um layout escuro e moderno, ideal para reduzir a fadiga visual.

### D. Regras de Agendamento Online
* **Aprovação Automática**:
  * **Ativado (Recomendado)**: Quando a cliente escolhe um horário no portal, o agendamento é marcado e confirmado instantaneamente na sua agenda.
  * **Desativado**: O agendamento entra como "Pendente" e você precisará aprovar ou recusar manualmente na aba de *Agendamentos*.
* **Antecedência Mínima para Cancelamento**: Defina quantas horas de antecedência a cliente precisa ter para conseguir cancelar ou remarcar um horário sozinha (ex: 24 horas). Se ela tentar cancelar com menos tempo, o portal bloqueará e mandará ela falar direto com você.
* **Mensagem Pós-Agendamento**: Texto personalizado exibido para a cliente assim que ela conclui um agendamento (ex: *"Olá! Por favor, venha sem maquiagem nos olhos e evite trazer acompanhantes. Nos vemos em breve!"*).

---

## 3. Gestão de Serviços
*Rota: `/servicos` (Menu Lateral -> Serviços)*

Para que a agenda funcione, você precisa definir quais serviços oferece, quanto cobra e qual a duração de cada um.

### Facilitador de Início:
* Ao acessar a tela de serviços pela primeira vez, o LashCenter pode vir com alguns serviços comuns pré-carregados (como *Extensão Fio a Fio*, *Volume Russo*, *Lash Lifting*). Você pode usá-los como base, editando-os ou removendo-os.

### Como Cadastrar um Novo Serviço:
1. No canto superior direito, clique em **Novo Serviço**.
2. Preencha os campos:
   * **Nome do Serviço**: Nome claro e atraente (ex: *Volume Brasileiro - Aplicação*).
   * **Preço (R$)**: Valor cobrado pelo procedimento.
   * **Duração (Minutos)**: Tempo exato de duração em minutos (ex: 120 para 2 horas). **Atenção:** Essa duração é crucial, pois o sistema usará esse valor para calcular os horários livres na sua agenda.
   * **Descrição**: Explique brevemente o que está incluso no serviço ou para quem ele é indicado.
3. Clique em **Salvar**.

### Como Editar ou Excluir:
* Na listagem, clique no ícone de lápis para editar valores, tempos ou nomes.
* Clique no ícone de lixeira vermelha para excluir. Excluir um serviço não apaga os agendamentos antigos que já foram realizados com ele.

---

## 4. Gestão de Clientes e Ficha Cadastral
*Rota: `/clientes` (Menu Lateral -> Clientes)*

Aqui fica o seu banco de dados de clientes, que funciona como um CRM dedicado.

### Como Cadastrar uma Cliente Manualmente:
1. Clique em **Nova Cliente**.
2. Preencha as informações obrigatórias:
   * **Nome e Sobrenome**.
   * **WhatsApp**: Digite o número com DDD. O sistema formata automaticamente.
3. Preencha as informações opcionais:
   * **Email, Data de Nascimento e Endereço**
   * **CPF**: Opcional, útil se você emitir notas ou precisar de maior controle.
4. Clique em **Salvar**.

> [!TIP]
> Você não precisa cadastrar todas as clientes manualmente! Sempre que uma nova cliente acessar seu portal online e fizer um cadastro para agendar, ela será inserida nesta lista de forma automática com o status de cadastro ativo.

### Visualizando o Histórico Detalhado (Perfil da Cliente):
Clique sobre o nome de qualquer cliente na tabela para abrir o perfil avançado dela, que é organizado da seguinte forma:
* **Resumo Rápido (Painel Lateral)**: Exibe rapidamente os principais dados cadastrais (WhatsApp, e-mail, idade/data de nascimento, canal de origem/como conheceu o estúdio e a data/hora exata do cadastro).
* **Aba Dados Pessoais**: Permite visualizar e editar as informações cadastrais básicas da cliente (nome, sobrenome, contato, CPF e origem). Também há um botão rápido no topo da página para criar um **Novo Agendamento** direto para ela.
* **Aba Ficha Clínica (Anamnese)**: Ficha com perguntas fundamentais para a segurança do procedimento, dividida entre:
  * *Histórico & Cuidados Oculares*: Informações sobre procedimentos anteriores, uso de lentes de contato, sensibilidade nos olhos ou infecções recentes.
  * *Hábitos & Retenção*: Detalhes como posição ao dormir (como costuma dormir), uso de maquiagem à prova d'água e contato com fontes de vapor/calor.
* **Aba Histórico de Atendimentos**: Lista de todos os registros de procedimentos realizados e cobrados. Através do botão **+ Registrar Atendimento**, você pode lançar manualmente novos atendimentos, adicionando o relatório detalhado e os valores cobrados.

---

## 5. Configuração de Expediente (Meus Horários)
*Rota: `/meus-horarios` (Menu Lateral -> Meus Horários)*

> [!IMPORTANT]
> Esta funcionalidade está disponível a partir do **Plano Profissional/Premium**.

Para que suas clientes agendem online de forma correta, você precisa definir os dias e horários em que trabalha.

### Configurando o Turno Semanal:
Para cada dia da semana (Segunda a Domingo), você pode:
1. **Ativar/Desativar o Dia**: Marque ou desmarque a chave ao lado do dia. Dias desativados não estarão disponíveis para agendamento.
2. **Definir Horário de Início e Término**: Horário que você abre o estúdio e horário que encerra as atividades.
3. **Definir Intervalo (Almoço)**: Preencha o horário de saída para o almoço e retorno (ex: Saída 12:00, Retorno 13:00). O sistema removerá essa faixa de horários livres no portal do cliente para você poder almoçar com calma.

### Bloqueios de Agenda (Férias, Feriados ou Imprevistos):
Precisa ir ao médico na próxima terça à tarde ou vai tirar férias de uma semana? 
1. Na aba **Bloqueios**, clique em **Adicionar Bloqueio**.
2. Preencha:
   * **Data do Bloqueio**: O dia do imprevisto/folga.
   * **Tipo de Bloqueio**:
     * **Dia Inteiro**: Fica indisponível o dia todo.
     * **Horário Específico**: Define a hora inicial e final do bloqueio (ex: bloqueado das 14:00 às 17:00).
   * **Motivo**: Apenas para seu controle interno (ex: *"Consulta médica"*).
3. Salve. As clientes não conseguirão marcar nada nesse período.

---

## 6. Controle da Agenda (Agendamentos)
*Rota: `/agendamentos` (Menu Lateral -> Agendamentos)*

> [!IMPORTANT]
> Esta funcionalidade está disponível a partir do **Plano Profissional/Premium**.

Esta é a tela principal de operação do dia a dia do estúdio.

### Visualizações Disponíveis:
* **Calendário**: Visão gráfica clássica. Você pode alternar os botões no topo para ver o **Mês**, a **Semana** ou apenas o **Dia** atual.
* **Lista de Solicitações**: Caso você tenha desativado a *Aprovação Automática*, todos os agendamentos feitos por clientes pelo portal aparecerão aqui aguardando seu clique em "Aprovar" ou "Recusar".

### Como Criar um Agendamento Manual:
Se uma cliente ligar ou mandar mensagem direta no WhatsApp e você quiser reservar o horário dela:
1. Clique no botão **Novo Agendamento** (ou clique diretamente em um espaço vazio no calendário).
2. Selecione a **Cliente** (pesquise digitando o nome).
3. Escolha o **Serviço**.
4. Defina a **Data** e o **Horário**.
5. Clique em **Confirmar**. O sistema calculará o término com base na duração do serviço escolhido e marcará o bloco de tempo na agenda.

### Alterando o Status de um Agendamento:
Clique sobre o card de um agendamento no calendário para abrir os detalhes e alterar seu status:
* **Confirmado**: Agendamento agendado e garantido.
* **Concluído**: Atendimento finalizado. O valor deste agendamento será computado no seu faturamento mensal do Dashboard.
* **Falta (No-show)**: A cliente não apareceu e não avisou. O sistema registrará essa falta no perfil dela para que você saiba do histórico de faltas no futuro.
* **Cancelado**: O horário é liberado imediatamente no portal para outras clientes poderem agendar.

---

## 7. Entendendo o Dashboard (Métricas)
*Rota: `/dashboard` (Menu Lateral -> Dashboard)*

O Dashboard consolida a saúde financeira e operacional do seu negócio. Ele atualiza em tempo real sempre que você altera o status dos agendamentos.

### O que cada indicador significa:
1. **Faturamento Mensal (R$)**: A soma do valor de todos os agendamentos com o status **Concluído** dentro do mês atual. Te dá a visão real do seu ganho.
2. **Agendamentos Realizados**: Quantidade total de atendimentos concluídos no mês.
3. **Taxa de Ocupação da Agenda (%)**: Indica a porcentagem de horas em que você esteve trabalhando comparado com o total de horas que você configurou como disponíveis em "Meus Horários". Se a taxa estiver baixa (ex: 30%), significa que você tem muitos horários ociosos e precisa fazer ações de marketing.
4. **Novas Clientes**: Número de novas clientes cadastradas (manualmente ou pelo portal) no mês corrente.

Abaixo dos cards, você conta com um gráfico com a evolução do seu faturamento e uma lista rápida com os **Agendamentos de Hoje**, para você saber quem vai atender a seguir sem precisar entrar na aba da agenda.

---

## 8. Faturamento, Planos e Bloqueio Financeiro
*Rota: `/faturamento` (Menu Lateral -> Faturamento)*

Como administradora de um sistema SaaS, você gerencia sua assinatura do LashCenter diretamente pelo painel.

### Comparativo de Planos:
* **Plano Básico (CRM)**:
  * Acesso ao Dashboard financeiro.
  * Cadastro ilimitado de clientes e fichas.
  * Cadastro ilimitado de serviços.
  * *Bloqueado*: Agenda de agendamentos e Portal de agendamento online para clientes.
* **Plano Profissional/Premium (Agenda Inteligente)**:
  * Todas as funções do plano básico.
  * Agenda completa no sistema.
  * Configuração de expediente e bloqueios de horários.
  * Portal online de agendamentos exclusivo do seu estúdio (ex: `lashly.com/portal/seu-slug`).

### Contratação e Pagamento (Integração Asaas):
1. Acesse a aba **Faturamento**.
2. Clique no plano desejado.
3. Selecione a forma de pagamento integrada:
   * **Pix**: O sistema gerará um QR Code Pix dinâmico. O desbloqueio do plano é instantâneo assim que o pagamento for concluído.
   * **Cartão de Crédito**: Insira os dados do cartão de forma segura. A cobrança é recorrente mensalmente.

### Em caso de Inadimplência ou Atraso:
Caso sua assinatura expire ou ocorra alguma falha na cobrança do cartão, o sistema entrará em status **Suspenso**.
* **O que acontece**: O `BillingGuard` será ativado. Você não conseguirá visualizar a agenda, clientes ou serviços. Uma tela de bloqueio total será exibida.
* **Como regularizar**: Na própria tela de bloqueio, haverá um botão **Regularizar Financeiro** que te levará para a tela de faturamento para efetuar o pagamento. O desbloqueio ocorre de forma imediata após a confirmação.

---

## 9. Prompts de Apoio (Vídeos e Marketing)

Copie e cole os textos abaixo nas suas ferramentas de IA favoritas (ChatGPT, Claude, Gemini) para gerar os materiais de marketing e treinamento do LashCenter.

### Prompt A: Roteiro para Vídeo de Demonstração (YouTube/Instagram)
```text
Com base no manual do LashCenter para profissionais de cílios e estética, crie um roteiro de vídeo narrado de 3 minutos. O vídeo deve mostrar a tela do sistema.
O roteiro deve conter:
1. Uma introdução chamativa focando na dor da profissional ("Cansada de passar horas respondendo cliente no WhatsApp para marcar horário?").
2. Demonstração prática do painel: configurando o estúdio, cadastrando um serviço de Extensão de Cílios e ajustando os horários de trabalho.
3. Demonstração de como a cliente agenda em segundos pelo portal.
4. Conclusão mostrando o ganho de tempo, aumento de faturamento que aparece no dashboard e chamada para ação para assinar o LashCenter.
Use uma linguagem leve, dinâmica, feminina e profissional.
```

### Prompt B: Copy para Página de Vendas (Landing Page)
```text
Atue como um Copywriter especialista em lançamentos de ferramentas SaaS. Escreva os textos estruturados de uma página de vendas para o "LashCenter".
A página de vendas deve ter:
- Headline chamativa conectando controle de agenda + aumento de faturamento.
- Sub-headline focando na liberdade de ter um robô agendando para você 24h por dia.
- Sessão de "Dores Comuns" (clientes que desistem por demora no atendimento, agenda confusa no papel, esquecimento de horários).
- Sessão de Recursos (Portal de agendamento, Ficha de Anamnese com histórico e métricas, Dashboard financeiro profissional, Bloqueio inteligente de horários).
- Tabela comparativa de planos: Básico (apenas gestão de fichas) e Profissional/Premium (agenda e portal).
- Seção de FAQ (Perguntas Frequentes) curta.
```

### Prompt C: Mensagem de Lançamento da Agenda para Clientes (WhatsApp)
```text
Crie 3 modelos de mensagens de WhatsApp para a profissional enviar para sua lista de clientes anunciando que agora ela usa o LashCenter e que as clientes podem agendar sozinhas.
Modelo 1: Mensagem curta e direta para clientes recorrentes.
Modelo 2: Mensagem detalhada com benefícios (ex: ver todos os horários de madrugada, escolher o serviço preferido).
Modelo 3: Mensagem de incentivo (ex: "Agende seu primeiro horário pelo portal e ganhe um mimo/desconto no dia do atendimento").
Deixe espaços demarcados como [Link do Portal] e [Nome da Cliente] para substituição de dados.
```
