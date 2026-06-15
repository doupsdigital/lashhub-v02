# Plano de Implementação: Etapa 5 - Integração de Cobranças e Assinaturas (Stripe / Asaas)

Este plano detalha a integração do faturamento automatizado no modelo SaaS, controlando o ciclo de vida das assinaturas dos estúdios e implementando os mecanismos de bloqueio administrativo em caso de inadimplência ou fim do período de testes (trial).

---

## Perguntas em Aberto (Open Questions)

> [!IMPORTANT]
> **1. Escolha do Gateway de Pagamento Primário:**
> Prefere priorizar a integração do **Stripe** (líder global, excelente sandbox/Stripe CLI e suporte nativo ao Stripe Customer Portal) ou do **Asaas** (muito popular no Brasil, com Pix e Boleto recorrentes simplificados)? *Propomos criar a estrutura baseada no Stripe, mas mantendo a lógica de banco agnóstica para facilitar a troca.*
>
> **2. Comportamento do Bloqueio Administrativo (BillingGuard):**
> Quando a conta do estúdio estiver suspensa (ex: inadimplência ou fim do trial), a profissional deve ser bloqueada de forma **restrita** (exibindo apenas a tela de cobrança e bloqueando qualquer outra rota) ou deve possuir acesso **somente leitura** aos dados históricos? *Propomos o bloqueio total para incentivar a regularização imediata.*
>
> **3. Período de Trial Padrão:**
> Qual o prazo padrão do período experimental gratuito no cadastro das novas profissionais? *Propomos 14 dias.*

---

## Proposta de Alterações

### 1. Banco de Dados (Supabase / Postgres)

#### [MODIFY] [Tabela `estabelecimentos`](file:///Users/donisilva/Downloads/lashly-saas/scripts/schema.sql)
Adicionar colunas para rastrear as referências da assinatura no gateway escolhido:
```sql
ALTER TABLE public.estabelecimentos 
  ADD COLUMN IF NOT EXISTS billing_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_subscription_id TEXT;
```

---

### 2. Backend (Supabase Edge Functions / Webhooks)

#### [NEW] [stripe-webhook/index.ts](file:///Users/donisilva/Downloads/lashly-saas/supabase/functions/stripe-webhook/index.ts)
Criar uma Supabase Edge Function (Deno) para tratar as notificações de eventos (webhooks) enviadas pelo Stripe/Asaas:
* **`checkout.session.completed`**: Capturar o `client_reference_id` (que conterá o `estabelecimento_id`) e atualizar o plano para `'premium'`, `status_assinatura` para `'ativo'` e salvar os IDs de faturamento.
* **`invoice.paid`**: Renovar e assegurar o status ativo da conta.
* **`invoice.payment_failed`**: Suspender preventivamente o estabelecimento (`status_assinatura = 'suspenso'`).
* **`customer.subscription.deleted`**: Mudar o status para `'cancelado'` e voltar o plano do estabelecimento para `'basico'`.

---

### 3. Frontend (Controle de Acesso e Tela de Bloqueio)

#### [NEW] [BillingGuard.tsx](file:///Users/donisilva/Downloads/lashly-saas/src/components/common/BillingGuard.tsx)
Criar o guardião de faturamento para proteger as rotas de gerenciamento administrativo da profissional:
* Ele lê `statusAssinatura` de `AuthContext`.
* Se o status for `'suspenso'` ou `'cancelado'`, intercepta todas as rotas filhas e renderiza uma **Tela de Bloqueio de Faturamento** (bloqueio administrativo).

#### [MODIFY] [App.tsx](file:///Users/donisilva/Downloads/lashly-saas/src/App.tsx)
Envolver todas as sub-rotas da profissional (exceto faturamento e perfil) dentro do `<BillingGuard>` para garantir o bloqueio total das funcionalidades operacionais da agenda e do catálogo em caso de suspensão:
```tsx
<Route element={<BillingGuard />}>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="clientes" element={<Clientes />} />
  {/* Outras rotas administrativas operacionais */}
</Route>
```

#### [NEW] [Faturamento.tsx](file:///Users/donisilva/Downloads/lashly-saas/src/pages/Faturamento.tsx)
Criar uma página moderna de faturamento dentro de `/configuracoes` ou como aba própria:
* Exibe o plano atual (Básico vs. Premium).
* Exibe o status da assinatura (Em testes, Ativo, Suspenso).
* Botão **"Ir para Checkout"** para profissionais Básicas/Trial fazerem upgrade.
* Botão **"Gerenciar Assinatura"** que chama a Edge Function para gerar um link seguro para o Stripe Customer Portal, permitindo trocar cartão, baixar faturas ou cancelar o plano.

---

## Plano de Verificação

### Testes Automatizados / Compilação
- Executar `npx tsc -b` para certificar que os novos componentes e rotas estão em conformidade com as tipagens do TypeScript.

### Verificação Manual (Via Scripts e Sandbox)
1. **Verificação de Webhooks:**
   * Criar um script local de teste (ex: `scripts/test_webhook_simulation.js`) para enviar requisições POST simulando o payload do webhook do Stripe diretamente na Edge Function local.
   * Validar se a tabela `estabelecimentos` é atualizada corretamente de `trial` para `ativo` e o plano para `premium`.
2. **Verificação da Tela de Bloqueio (BillingGuard):**
   * Atualizar manualmente o banco de dados definindo o status do estabelecimento da Amanda para `'suspenso'`:
     `UPDATE estabelecimentos SET status_assinatura = 'suspenso' WHERE slug = 'amandalash';`
   * Tentar navegar pelo painel administrativo da Amanda e validar se ela é forçada a ver a tela de bloqueio de assinatura e bloqueada de acessar clientes, serviços ou configurações operacionais.
   * Clicar no botão de regularizar pagamento e validar o redirecionamento.
