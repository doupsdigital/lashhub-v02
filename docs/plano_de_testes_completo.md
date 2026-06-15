# Plano de Testes Completo e Roteiro de Validação (Lashly SaaS)

Este documento descreve o plano de testes completo para homologar todas as funcionalidades do **Lashly SaaS**. Ele está estruturado em fluxos lógicos e organizados por listas hierárquicas para facilitar a leitura e a marcação dos resultados diretamente no arquivo.

Use as caixas de seleção `[ ]` para marcar o status de cada teste.

---

## 📅 Histórico de Execução de Testes
* **Responsável pelo Teste**: [Nome do Testador]
* **Data da Execução**: [__/__/____]
* **Resultado Geral**: `[ ] Aprovado para Produção` | `[ ] Ajustes Pendentes`

---

## 🔗 Massa de Dados Útil para Teste Local
* **URL do Admin**: `http://localhost:5174/`
* **Usuário Demo (Bruna Lash)**: `contato@brunalash.com.br` | Senha: `123456`
* **Portal da Cliente (Demo)**: `http://localhost:5174/portal/brunalash`

---

## 🛠️ FLUXO 1: Cadastro (Onboarding) e Período de Testes (Trial)
Este fluxo valida a jornada de uma nova profissional se registrando no SaaS.

### **[ ] T1.1: Cadastro de Nova Profissional**
* **Cenário**: Cadastro de um novo negócio de estética.
* **Passos para Executar**:
  1. Acesse `http://localhost:5174/cadastro`
  2. Preencha todos os campos (Nome, Nome do Estúdio, E-mail, Senha e Confirmação) com dados válidos.
  3. Clique no botão **Cadastrar**.
* **Resultado Esperado**:
  * O sistema deve realizar o cadastro e redirecionar automaticamente para a página `/dashboard`.
  * Um novo registro de estabelecimento e usuário deve ser inserido corretamente no Supabase.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T1.2: Atribuição de Trial Premium**
* **Cenário**: Garantir que novos cadastros comecem no plano completo para teste.
* **Passos para Executar**:
  1. Logo após o cadastro no **T1.1**, observe o menu lateral da aplicação.
  2. Tente navegar e clicar nos menus **Agenda** e **Horários**.
* **Resultado Esperado**:
  * A nova profissional inicia com o plano **Premium (Trial)** liberado por padrão.
  * Todas as páginas e recursos da agenda e portal online devem estar desbloqueados para uso.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T1.3: Exibição do Status do Trial em Faturamento**
* **Cenário**: Exibição da contagem regressiva de testes.
* **Passos para Executar**:
  1. Acesse a página de **Faturamento** no menu lateral.
  2. Localize a seção **Assinatura Atual** (painel esquerdo).
* **Resultado Esperado**:
  * O campo de status deve exibir o texto: **"Período de Testes (14 dias restantes)"** em uma badge amarela/laranja.
  * A data de término deve ser calculada exatamente com 14 dias de antecedência a partir da data de criação.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T1.4: Destaque do Plano Premium Atual**
* **Cenário**: Indicação visual de qual plano está sendo testado.
* **Passos para Executar**:
  1. Na aba **Faturamento**, observe os cards de planos do lado direito.
* **Resultado Esperado**:
  * O card do **Plano Premium (Agenda)** deve exibir a badge **"Seu plano de testes atual"** em destaque.
  * Ambos os planos devem apresentar as opções de checkout ("Assinar via Pix" e "Assinar via Cartão") ativas para o usuário poder realizar a assinatura definitiva.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

---

## 👥 FLUXO 2: Gestão de Clientes e Ficha de Anamnese (Profissional)
Valida o cadastro de clientes, histórico de atendimentos e personalização das fichas.

### **[ ] T2.1: Cadastro Manual de Clientes**
* **Cenário**: Registrar um cliente pelo painel administrativo.
* **Passos para Executar**:
  1. Acesse a aba **Clientes** no painel administrativo.
  2. Clique em **Adicionar Cliente**.
  3. Preencha os dados (Nome, Sobrenome, WhatsApp, Data de Nascimento e Endereço).
  4. Clique em **Salvar**.
* **Resultado Esperado**:
  * O cliente deve aparecer listado imediatamente na tabela de clientes.
  * Usar a barra de pesquisa rápida digitando o WhatsApp ou nome deve localizar o cliente sem atraso.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T2.2: Edição de Ficha Cadastral**
* **Cenário**: Alterar dados básicos de um cliente.
* **Passos para Executar**:
  1. Na lista de **Clientes**, clique no cliente cadastrado no teste **T2.1**.
  2. Na página do perfil, clique no botão **Editar Dados** (ou no ícone correspondente).
  3. Altere o WhatsApp e a data de nascimento, depois clique em **Salvar**.
* **Resultado Esperado**:
  * Os dados do cliente no cabeçalho e perfil devem ser atualizados instantaneamente na interface.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T2.3: Ficha de Anamnese Customizada**
* **Cenário**: Preenchimento e salvamento dos parâmetros da ficha de cílios (lash).
* **Passos para Executar**:
  1. No perfil do cliente, selecione a seção **Ficha de Anamnese**.
  2. Preencha informações nos campos de mapeamento (Ex: tamanho, espessura, curvatura, formato dos olhos, alergias, restrições).
  3. Clique em **Salvar Ficha**.
  4. Atualize a página do navegador (`F5`).
* **Resultado Esperado**:
  * Os dados da ficha devem persistir intactos após o recarregamento.
  * O registro de anamnese é salvo no formato estruturado (JSONB) no Supabase.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T2.4: Histórico e Linha do Tempo**
* **Cenário**: Registrar notas rápidas de atendimento.
* **Passos para Executar**:
  1. No perfil do cliente, localize o bloco de **Histórico de Atendimentos / Notas**.
  2. Digite uma anotação na caixa de notas rápidas (Ex: "Cliente relatou desconforto leve no olho esquerdo no final").
  3. Envie a nota.
* **Resultado Esperado**:
  * A nota deve constar na linha do tempo exibindo a data, o horário atual e o nome da profissional autora do texto.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T2.5: Exclusão de Cliente**
* **Cenário**: Apagar um cadastro permanentemente.
* **Passos para Executar**:
  1. Retorne para a página de **Clientes**.
  2. Localize o cliente de teste e clique no botão de lixeira (excluir).
  3. Confirme o alerta de confirmação do navegador.
* **Resultado Esperado**:
  * O cliente deve sumir instantaneamente da lista geral.
  * O cadastro e os históricos vinculados devem ser removidos ou arquivados no banco de dados.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

---

## 💅 FLUXO 3: Catálogo de Serviços e Variações (Profissional)
Valida a montagem do portfólio de serviços oferecidos com preços e durações flexíveis.

### **[ ] T3.1: Criação de Categoria de Serviço**
* **Cenário**: Adicionar um agrupador para classificar os serviços.
* **Passos para Executar**:
  1. Acesse a aba **Serviços** no menu lateral.
  2. Clique em **Nova Categoria**.
  3. Digite o nome da categoria (Ex: `Extensão de Cílios`) e opcionalmente uma descrição.
  4. Clique em **Salvar**.
* **Resultado Esperado**:
  * A categoria deve aparecer listada na tela como um bloco aguardando serviços.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T3.2: Criação de Serviço Simples (Preço Único)**
* **Cenário**: Cadastrar um serviço básico.
* **Passos para Executar**:
  1. No bloco da categoria recém-criada, clique em **Adicionar Serviço**.
  2. Preencha: Nome (`Volume Brasileiro Clássico`), Preço (`R$ 150,00`), Duração (`90 minutos`).
  3. Clique em **Salvar**.
* **Resultado Esperado**:
  * O serviço deve constar listado sob a categoria correta com preço e tempo bem legíveis.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T3.3: Criação de Serviço com Variações de Preço/Tempo**
* **Cenário**: Cadastrar um serviço que muda de valor conforme escolhas da cliente.
* **Passos para Executar**:
  1. Adicione outro serviço na categoria (Ex: `Manutenção Volume Brasileiro`).
  2. Deixe o preço e tempo padrão do serviço principal em branco.
  3. Adicione duas variações na lista:
     * Var 1: Nome `Manutenção 15 dias` - Preço `R$ 90,00` - Tempo `60 minutos`.
     * Var 2: Nome `Manutenção 30 dias` - Preço `R$ 120,00` - Tempo `90 minutos`.
  4. Clique em **Salvar**.
* **Resultado Esperado**:
  * O serviço deve ser exibido indicando que possui variações de preço, detalhando os prazos, valores e tempos de cada opção na lista.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T3.4: Desativação Temporária de Serviço**
* **Cenário**: Tirar serviço de circulação sem apagá-lo.
* **Passos para Executar**:
  1. Edite o serviço cadastrado no teste **T3.2**.
  2. Desmarque a opção **Ativo** (Status ativo = falso).
  3. Clique em **Salvar**.
* **Resultado Esperado**:
  * O serviço deve ficar com aspecto cinza ou indicativo de "Inativo" no painel.
  * O serviço não deve aparecer como opção no catálogo público para agendamento online.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

---

## ⏰ FLUXO 4: Agenda, Expediente e Bloqueios (Profissional)
Valida a configuração de horários de funcionamento e regras da agenda.

### **[ ] T4.1: Ajuste dos Horários de Funcionamento**
* **Cenário**: Mudar a janela horária de atendimento de um dia da semana.
* **Passos para Executar**:
  1. Acesse a aba **Horários** no menu lateral.
  2. Modifique os limites da Segunda-feira (Ex: de `09:00 - 18:00` para `10:00 - 17:00`).
  3. Clique em **Salvar**.
* **Resultado Esperado**:
  * A grade horária na aba **Agenda** deve se ajustar e indicar a nova faixa de horários habilitados.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T4.2: Dias Fechados (Desativar Dias)**
* **Cenário**: Definir dia que o estúdio não trabalha.
* **Passos para Executar**:
  1. Na aba **Horários**, desmarque o dia **Domingo** para que fique inativo.
  2. Clique em **Salvar**.
* **Resultado Esperado**:
  * O Domingo deve constar como inativo.
  * No portal online da cliente, a seleção de Domingo deve estar desabilitada (cinza) no calendário.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T4.3: Criação de Bloqueios de Agenda**
* **Cenário**: Trancar a agenda em datas específicas (Feriados/Recessos).
* **Passos para Executar**:
  1. Na aba **Horários**, localize a seção de **Bloqueios de Agenda**.
  2. Clique em **Adicionar Bloqueio**.
  3. Defina a data de início e fim (Ex: amanhã o dia todo), escreva o motivo (`Feriado Municipal`) e salve.
* **Resultado Esperado**:
  * O bloqueio deve aparecer na lista de bloqueios ativos.
  * No portal de autoagendamento da cliente, a data bloqueada deve constar como indisponível para marcações.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

---

## 🗓️ FLUXO 5: Grade de Agendamentos Administrativa (Profissional)
Valida as operações no calendário do painel administrativo.

### **[ ] T5.1: Criação de Agendamento Manual**
* **Cenário**: A profissional marcando um horário para uma cliente pelo painel.
* **Passos para Executar**:
  1. Acesse a aba **Agenda**.
  2. Clique em um horário vazio ou no botão **Novo Agendamento**.
  3. Selecione uma cliente da lista, a data/hora, selecione o serviço correspondente e salve.
* **Resultado Esperado**:
  * O card do agendamento deve aparecer na grade de horários imediatamente no dia e horário escolhidos.
  * Por padrão, agendamentos manuais (feitos no admin) devem entrar com status **Confirmado** (cor de destaque do tema).
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T5.2: Alteração de Status (Concluir Atendimento)**
* **Cenário**: Mudar status do agendamento pós-sessão.
* **Passos para Executar**:
  1. Clique no card de agendamento criado no teste **T5.1**.
  2. Na janela de detalhes, mude o status para **Concluído**.
  3. Clique em **Salvar**.
* **Resultado Esperado**:
  * A cor do card de agendamento deve mudar na grade para a cor indicativa de conclusão (tom verde/esmeralda).
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T5.3: Cancelar e Liberar Horário**
* **Cenário**: Cancelamento administrativo de agendamento.
* **Passos para Executar**:
  1. Clique em outro agendamento na grade da agenda.
  2. Mude seu status para **Cancelado** e salve.
* **Resultado Esperado**:
  * O card do agendamento deve mudar de cor (tom cinza/riscado) ou sumir da grade principal de acordo com as preferências de exibição de cancelados.
  * O horário deve ser liberado para novos agendamentos imediatamente.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

---

## 🌐 FLUXO 6: Portal do Cliente (Experiência da Cliente Final)
Valida a ponta final onde o cliente final faz o cadastro e autoagendamento online.

### **[ ] T6.1: Cadastro de Cliente no Portal**
* **Cenário**: O auto-cadastro de uma cliente.
* **Passos para Executar**:
  1. Acesse o link do portal público da sua profissional demo: `http://localhost:5174/portal/brunalash/cadastro`
  2. Preencha Nome, WhatsApp, E-mail e Senha.
  3. Clique em **Criar Conta**.
* **Resultado Esperado**:
  * A conta é criada com sucesso, vinculada ao estabelecimento `Bruna Lash` e redireciona a cliente logada para o catálogo.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T6.2: Catálogo de Serviços do Portal**
* **Cenário**: Visualizar os serviços sob a ótica do cliente.
* **Passos para Executar**:
  1. Navegue pelo catálogo do portal público (`/portal/brunalash/catalogo`).
* **Resultado Esperado**:
  * Os serviços de teste devem aparecer ordenados pelas respectivas categorias.
  * Os valores, durações e descrições devem coincidir 100% com o configurado no painel da profissional.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T6.3: Agendamento Online em 4 Passos**
* **Cenário**: O fluxo completo do agendamento online.
* **Passos para Executar**:
  1. Clique em **Agendar** em um serviço no catálogo do portal.
  2. **Passo 1 (Serviço)**: Escolha o serviço/variação e avance.
  3. **Passo 2 (Data)**: Selecione um dia no calendário (Valide que Domingos inativos e dias bloqueados estão indisponíveis).
  4. **Passo 3 (Horário)**: Selecione uma hora na grade de slots livres.
  5. **Passo 4 (Confirmação)**: Escreva uma observação de teste e confirme o agendamento.
* **Resultado Esperado**:
  * O portal deve exibir a tela de sucesso com a **Mensagem Pós-Agendamento** correta.
  * A reserva deve constar na aba **Meus Agendamentos** da cliente.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T6.4: Meus Agendamentos (Cliente)**
* **Cenário**: Visualização de reservas passadas e futuras da cliente.
* **Passos para Executar**:
  1. No Portal do Cliente, acesse a aba **Meus Agendamentos**.
* **Resultado Esperado**:
  * O agendamento feito no teste **T6.3** deve estar listado indicando o status correspondente (ex: `Pendente` ou `Confirmado`).
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

---

## 🎨 FLUXO 7: Configurações do Estúdio e Customização (Profissional)
Valida a flexibilidade visual e alteração de regras do agendamento online.

### **[ ] T7.1: Customização do Tema e Cores**
* **Cenário**: Mudar as cores e estilo visual do SaaS.
* **Passos para Executar**:
  1. No painel admin, acesse a aba **Configurações**.
  2. Mude a paleta de cores para outra opção (Ex: de `Rosa Rose` para `Lilás Lavender`).
  3. Marque a opção **Modo Escuro** (caso queira testar a inversão de cores) e salve.
* **Resultado Esperado**:
  * O painel administrativo deve atualizar sua coloração de forma instantânea.
  * Abra o Portal do Cliente e certifique-se de que ele também aplicou a nova paleta de cores automaticamente.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T7.2: Regra de Aprovação Online (Manual vs. Automática)**
* **Cenário**: Alterar a forma de recepção de agendamentos.
* **Passos para Executar**:
  1. Em **Configurações**, altere o parâmetro **Aprovação Automática** para **Não** (Aprovação Manual) e salve.
  2. Realize um agendamento de teste no Portal da Cliente.
  3. No painel admin da profissional, acesse a **Agenda** e depois a seção de **Agendamentos Pendentes**.
* **Resultado Esperado**:
  * O agendamento online deve entrar com status de pendente, exigindo que a profissional clique em "Confirmar" para inseri-lo definitivamente na grade.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

---

## 💳 FLUXO 8: Faturamento, Gateway Asaas e Restrições de Planos (SaaS)
Valida as principais regras financeiras desenvolvidas para a Etapa 5 (modelo de cobrança).

### **[ ] T8.1: Checkout Pix Simulado**
* **Cenário**: Testar a ativação da assinatura usando a simulação do Pix do Asaas.
* **Passos para Executar**:
  1. Vá para a página de **Faturamento**.
  2. No card do plano Premium, clique em **Assinar via Pix**.
  3. Veja o QR Code e código Pix copia e cola simulados.
  4. Clique no botão verde **Confirmar Pagamento Pix** para simular o aviso de recebimento do webhook.
* **Resultado Esperado**:
  * O sistema atualiza o banco e atualiza o status de faturamento da profissional para **Assinatura Ativa**.
  * A badge de testes some e o plano se torna oficialmente ativo.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T8.2: Checkout Cartão de Crédito Simulado**
* **Cenário**: Testar ativação usando o formulário de cartão.
* **Passos para Executar**:
  1. Em **Faturamento**, selecione qualquer plano e clique em **Assinar via Cartão**.
  2. Preencha campos simulados de Nome, Número de Cartão, Validade e CVV.
  3. Clique em **Assinar com Cartão**.
* **Resultado Esperado**:
  * O sistema processa o pagamento de forma simulada e exibe aviso de sucesso, alterando o status para **Assinatura Ativa**.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T8.3: Trancamento de Rota / Bloqueio Total (Conta Suspensa)**
* **Cenário**: Simulação de inadimplência (suspensão).
* **Passos para Executar**:
  1. No seu terminal de comandos local (ou inserindo manualmente no banco), altere o status de assinatura do estúdio para suspenso. Exemplo com script local:
     `node scripts/simular_webhook_asaas.js suspend brunalash`
  2. Tente navegar na aplicação para a rota `/dashboard` ou `/clientes`.
* **Resultado Esperado**:
  * A tela de bloqueio total do `BillingGuard` deve interceptar o acesso imediatamente.
  * O usuário profissional fica impedido de acessar qualquer aba do sistema, sendo apresentado à mensagem de inadimplência e à opção de ir para **Faturamento** regularizar ou fazer logout.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T8.4: Restrições de Recursos por Plano (Downgrade Básico)**
* **Cenário**: Validação das restrições do plano Básico (CRM sem Agenda).
* **Passos para Executar**:
  1. No painel de **Faturamento**, clique em **Mudar para Plano Básico (Teste)** (ou force o plano do estúdio para `basico` no banco).
  2. Tente acessar a aba **Agenda** ou **Horários** no menu lateral do admin.
  3. Tente acessar diretamente a rota de agendamento no Portal do Cliente: `/portal/brunalash/agendar`
* **Resultado Esperado**:
  * No painel da profissional, o acesso às abas de agenda e horários deve estar trancado (bloqueado pelo `PlanGuard`).
  * No Portal do Cliente, ao tentar acessar a rota de agendar, o sistema deve interceptar e redirecionar automaticamente a cliente de volta para o catálogo `/catalogo`, impossibilitando a marcação online.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________

### **[ ] T8.5: Regularização e Desbloqueio Instantâneo**
* **Cenário**: Fazer o pagamento com a conta bloqueada/suspensa.
* **Passos para Executar**:
  1. Com a tela de bloqueio do **T8.3** ativa, clique em **Regularizar Financeiro**.
  2. Na página de faturamento aberta, clique em **Assinar via Pix** e confirme o pagamento Pix simulado.
  3. Clique em **Dashboard** no menu lateral.
* **Resultado Esperado**:
  * A tela de bloqueio total do `BillingGuard` deve sumir imediatamente.
  * Acesso pleno e irrestrito ao sistema restabelecido de forma automática pós-confirmação do webhook/banco.
* **Status**: `[ ] Aprovado` | `[ ] Reprovado`
* **Observações**: __________________________________________________
