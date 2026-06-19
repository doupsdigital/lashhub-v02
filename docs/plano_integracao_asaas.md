# Plano de Implementação — Integração Asaas (Pagamentos)

## Contexto técnico importante

O app hoje é **100% frontend** (React + Supabase). O Asaas exige chamadas de API com uma **chave secreta** que **nunca pode ficar exposta no navegador**. Por isso, precisamos de um intermediário seguro entre o frontend e o Asaas.

A solução natural para este projeto: **Supabase Edge Functions** — pequenas funções serverless que já rodam na infraestrutura do Supabase, têm acesso às variáveis secretas e podem receber webhooks do Asaas.

---

## O fluxo completo

```
Profissional clica "Assinar"
        ↓
Edge Function: cria cliente no Asaas (se não existir)
        ↓
Edge Function: cria assinatura → recebe QR Code Pix
        ↓
Frontend: exibe QR Code para a profissional pagar
        ↓
Profissional paga no banco
        ↓
Asaas dispara webhook → Edge Function recebe
        ↓
Edge Function atualiza banco: status_assinatura = 'ativo'
        ↓
Profissional tem acesso liberado automaticamente
```

---

## Plano dividido em 5 fases

---

### Fase 1 — Você: Criar conta no Asaas e configurar

1. Acesse [asaas.com](https://www.asaas.com) e crie uma conta como **pessoa física ou jurídica**
2. Após o cadastro, vá em **Configurações → Integrações → API**
3. Copie a **API Key de Sandbox** (começa com `$aact_...`) — para testes
4. Depois dos testes, você usará a **API Key de Produção** — para cobranças reais
5. Em **Configurações → Integrações → Webhooks**, você vai registrar a URL da Edge Function (feito na Fase 4)

---

### Fase 2 — Você: Configurar variáveis secretas no Supabase

No painel do Supabase → **Edge Functions → Secrets**, adicionar:

| Variável | Valor |
|---|---|
| `ASAAS_API_KEY` | API Key do Asaas (sandbox ou produção) |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` (sandbox) ou `https://www.asaas.com/api/v3` (produção) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do projeto Supabase (permite à Edge Function atualizar o banco com permissão total) |

---

### Fase 3 — Código: Criar 3 Edge Functions no Supabase

**`asaas-checkout`** — chamada pelo frontend quando a profissional clica em "Assinar"
- Cria ou recupera o cliente no Asaas usando o e-mail da profissional
- Cria a assinatura com o valor do plano escolhido e ciclo mensal
- Retorna o QR Code Pix + código copia-e-cola para o frontend exibir

**`asaas-webhook`** — chamada automaticamente pelo Asaas quando um pagamento ocorre
- Recebe o evento (pagamento confirmado, renovação, inadimplência, cancelamento)
- Atualiza `estabelecimentos.status_assinatura` e `plano` no banco
- Salva `billing_customer_id` e `billing_subscription_id` no banco

**`asaas-cancel`** — chamada pelo frontend quando a profissional cancela a assinatura
- Cancela a assinatura no Asaas via API
- Atualiza o banco para status `cancelado`

**Alterações no frontend (`Faturamento.tsx`)**
- Remover os botões de simulação de plano ("Mudar para Plano Básico (Teste)" etc.)
- Substituir "Assinar via Pix" pelo fluxo real: chama `asaas-checkout` e exibe QR Code retornado
- Exibir código Pix copia-e-cola
- Adicionar polling ou listener para detectar quando o pagamento for confirmado e atualizar a UI automaticamente

---

### Fase 4 — Você + Código: Configurar Webhook no Asaas

Após o deploy das Edge Functions, a URL do webhook ficará no formato:
```
https://[seu-projeto].supabase.co/functions/v1/asaas-webhook
```

Registre essa URL no painel do Asaas → **Configurações → Integrações → Webhooks**, marcando os eventos:

| Evento | O que representa |
|---|---|
| `PAYMENT_RECEIVED` | Pagamento Pix confirmado |
| `PAYMENT_OVERDUE` | Pagamento atrasado (inadimplência) |
| `SUBSCRIPTION_INACTIVATED` | Assinatura cancelada ou suspensa |

---

### Fase 5 — Você: Testes

**Fase 5a — Sandbox (sem dinheiro real)**

O Asaas tem um ambiente de sandbox completo. Para simular um pagamento:
1. Faça o fluxo completo pelo app (selecionar plano, gerar QR Code)
2. No painel do Asaas Sandbox → vá em **Cobranças** → encontre o pagamento criado
3. Clique em **"Simular pagamento recebido"**
4. O Asaas dispara o webhook automaticamente
5. Verifique no banco se `status_assinatura` foi atualizado para `'ativo'`
6. Verifique se o BillingGuard liberou o acesso no app

**Fase 5b — Produção com valor mínimo**

Quando o sandbox estiver funcionando 100%, troque a API Key para a de produção e faça um pagamento real de **R$ 1,00** (valor mínimo aceito pelo Asaas) para validar o fluxo completo de ponta a ponta com dinheiro real antes de subir os valores reais dos planos (R$ 59,90 / R$ 99,90).

---

## Resumo de responsabilidades

| Quem | O que faz |
|---|---|
| **Você** | Cria conta no Asaas, obtém API Keys, configura Secrets no Supabase, registra URL do webhook no painel do Asaas |
| **Código** | Cria as 3 Edge Functions, atualiza `Faturamento.tsx` (remove simulações, adiciona fluxo real + QR Code), atualiza banco para salvar IDs do Asaas |
| **Você** | Testa no sandbox, valida webhook, testa com R$ 1,00 real |

---

## Referências

- Documentação Asaas API: [asaas.com/ajuda/api](https://www.asaas.com/ajuda/api)
- Supabase Edge Functions: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- Arquivo de referência no projeto: `migracao_saas/etapa5_stripe_asaas.md`
