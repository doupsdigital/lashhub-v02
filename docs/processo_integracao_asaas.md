# Processo Prático — Integração Asaas (O que fizemos)

Este documento descreve passo a passo tudo o que foi feito para implementar e testar a integração de pagamentos Pix via Asaas no Lash Hub. Serve como referência para replicar o processo em outros projetos.

---

## 1. Criação da conta no Asaas

- Acessamos [asaas.com](https://asaas.com) e criamos uma conta como pessoa física
- Preenchemos os dados do negócio:
  - **Atividade comercial:** Software (licenças e programas)
  - **Renda mensal:** estimativa
  - **Endereço** completo
- Aguardamos a conta ser aprovada
- Para gerar a API Key, foi necessário preencher todos os campos em **Minha Conta → Informações**, incluindo faturamento

### Contas necessárias
| Ambiente | URL | Finalidade |
|---|---|---|
| Sandbox | [sandbox.asaas.com](https://sandbox.asaas.com) | Testes sem dinheiro real |
| Produção | [asaas.com](https://asaas.com) | Cobranças reais |

---

## 2. Obtenção das API Keys

1. Painel do Asaas → **Configurações → Integrações → API Keys**
2. Clicamos em **"Gerar Chave de API"**
3. Copiamos a chave (começa com `$aact_...`) — **aparece apenas uma vez**
4. Repetimos o processo no Asaas Sandbox para a chave de testes

---

## 3. Configuração dos Secrets no Supabase

No painel do Supabase → **Edge Functions → Secrets → New secret**, adicionamos:

| Nome | Valor |
|---|---|
| `ASAAS_API_KEY` | Chave do Asaas Sandbox (`$aact_...`) |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` |
| `SB_SERVICE_ROLE_KEY` | Service role key do Supabase (Project Settings → API) |

> **Observação:** O prefixo `SUPABASE_` é reservado pelo Supabase — usamos `SB_SERVICE_ROLE_KEY` como alternativa.

---

## 4. Criação das Edge Functions

Criamos 3 funções em `supabase/functions/`:

### `asaas-checkout`
**O que faz:** Chamada pelo frontend quando a profissional clica em "Assinar via Pix"
1. Busca cliente no Asaas pelo e-mail
2. Se existir → atualiza com CPF/CNPJ via PUT (se PUT falhar → exclui e recria)
3. Se não existir → cria cliente com nome, e-mail e CPF/CNPJ
4. Cria assinatura mensal via Pix
5. Busca o primeiro pagamento gerado e seu QR Code
6. Salva `billing_customer_id` e `billing_subscription_id` no banco
7. Retorna QR Code (imagem base64 + código copia-e-cola + expiração)

**Configuração:** JWT ativado (é chamada pelo frontend com usuário autenticado)

### `asaas-webhook`
**O que faz:** Recebida automaticamente pelo Asaas quando ocorre um evento de pagamento
- `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` → `status_assinatura = 'ativo'`
- `PAYMENT_OVERDUE` → `status_assinatura = 'suspenso'`
- `PAYMENT_DELETED` / `SUBSCRIPTION_INACTIVATED` → `status_assinatura = 'cancelado'`

**Configuração:** ⚠️ JWT **desativado** — o Asaas chama de fora do app sem token

### `asaas-cancel`
**O que faz:** Chamada pelo frontend quando a profissional cancela a assinatura
1. Busca `billing_subscription_id` do estabelecimento
2. Cancela no Asaas via `DELETE /subscriptions/{id}`
3. Atualiza banco: `status_assinatura = 'cancelado'`

**Configuração:** JWT ativado

---

## 5. Deploy das Edge Functions no Supabase

Para cada função:
1. Supabase → **Edge Functions → Deploy a new function → Via Editor**
2. Nome exato: `asaas-checkout`, `asaas-webhook`, `asaas-cancel`
3. Colar o conteúdo do arquivo correspondente em `supabase/functions/[nome]/index.ts`
4. Clicar em **Deploy**

**Passo extra importante para `asaas-webhook`:**
- Após o deploy → aba **Settings** → desativar **"Verify JWT with legacy secret"**
- Sem isso, o Asaas não consegue chamar o webhook (retorna 401)

---

## 6. Configuração do Webhook no Asaas Sandbox

1. Asaas Sandbox → **Configurações → Integrações → Webhooks → Adicionar Webhook**
2. Preencher:
   - **Nome:** `lashhub sandbox`
   - **URL:** `https://[project-ref].supabase.co/functions/v1/asaas-webhook`
   - **Versão da API:** v3
   - **Token de autenticação:** gerar com o botão "Gerar Token" (guardar para uso futuro)
   - **Tipo de envio:** Sequencial
3. Ativar os eventos:
   - `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED` (em Cobranças)
   - `PAYMENT_OVERDUE` (em Cobranças)
   - `SUBSCRIPTION_INACTIVATED` (em Assinaturas)
4. Ativar o toggle **"Este Webhook ficará ativo?"**
5. Ativar o toggle **"Fila de sincronização ativada?"**

---

## 7. Atualização do Frontend (Faturamento.tsx)

Removemos os botões de simulação e implementamos o fluxo real:

**Novo fluxo de checkout:**
1. Profissional clica "Assinar via Pix" → abre tela para informar CPF/CNPJ
2. Preenche CPF (11 dígitos) ou CNPJ (14 dígitos) → clica "Gerar QR Code Pix"
3. Frontend chama `supabase.functions.invoke('asaas-checkout', { body: { ... } })`
4. QR Code aparece com imagem + código copia-e-cola + botão de copiar
5. Polling a cada 5 segundos verifica se `status_assinatura` mudou para `'ativo'` no banco
6. Quando o pagamento é confirmado → tela de sucesso exibida automaticamente

**Cancelamento:**
- Botão "Cancelar Assinatura" com confirmação inline
- Chama `supabase.functions.invoke('asaas-cancel', { body: { estabelecimento_id } })`

---

## 8. Problema encontrado: CPF obrigatório para Pix

**Erro:** `"Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente."`

**Causa:** O Asaas exige CPF/CNPJ para cobranças Pix (exigência regulatória brasileira). A implementação inicial não coletava esse dado.

**Solução:** Adicionamos uma etapa de coleta de CPF/CNPJ antes de iniciar o checkout. O CPF é validado no frontend (11 ou 14 dígitos) e enviado para a Edge Function.

---

## 9. Testes realizados

### Teste via botão "Test" no Supabase
Usado para depurar a Edge Function diretamente, sem passar pelo frontend. Payload de teste:
```json
{
  "estabelecimento_id": "uuid-do-estabelecimento",
  "plano": "basico",
  "email": "email@exemplo.com",
  "nome": "Nome da Profissional",
  "cpf_cnpj": "11111111111"
}
```

### Simulação de pagamento no Asaas Sandbox
1. Asaas Sandbox → **Cobranças** → encontrar o pagamento com status "Pendente"
2. Clicar em **"Simular pagamento recebido"**
3. Asaas dispara o webhook → `asaas-webhook` atualiza o banco
4. Polling no frontend detecta a mudança → tela de sucesso exibida

### Simulação de trial expirado
```sql
-- Forçar expiração do trial para testar o BillingGuard
UPDATE public.estabelecimentos
SET trial_ends_at = now() - INTERVAL '1 day'
WHERE slug = 'slug-da-profissional';

-- Restaurar
UPDATE public.estabelecimentos
SET trial_ends_at = now() + INTERVAL '14 days'
WHERE slug = 'slug-da-profissional';
```

---

## 10. Resultado final

O fluxo end-to-end foi testado e validado no sandbox:

✅ Profissional cria conta → trial inicia automaticamente (14 dias Premium)  
✅ Clica "Assinar via Pix" → informa CPF → QR Code real gerado  
✅ Paga via Pix → Asaas confirma → webhook atualiza banco → acesso liberado  
✅ Cancela assinatura → Asaas cancela → banco atualizado  
✅ Trial expira → BillingGuard bloqueia → tela de assinatura exibida  

---

## O que falta para ir a produção

Após terminar os testes no sandbox, estes são os únicos passos restantes:

### 1. Trocar credenciais no Supabase (banco de produção)
No Supabase do projeto **`lashhub-prd`** → **Edge Functions → Secrets**, atualizar:

| Secret | Valor de produção |
|---|---|
| `ASAAS_API_KEY` | Chave de **produção** do Asaas (não sandbox) |
| `ASAAS_BASE_URL` | `https://www.asaas.com/api/v3` |
| `SB_SERVICE_ROLE_KEY` | Service role key do projeto `lashhub-prd` |

### 2. Deploy das Edge Functions no banco de produção
Repetir o processo do passo 5 no Supabase do `lashhub-prd` (as 3 funções).

### 3. Registrar webhook no Asaas de produção
Repetir o processo do passo 6, mas no painel de **produção** do Asaas ([asaas.com](https://asaas.com)), com a URL do Supabase de produção:
```
https://[project-ref-prd].supabase.co/functions/v1/asaas-webhook
```

### 4. Testar com valor mínimo real (R$ 1,00)
Antes de subir os valores reais dos planos (R$ 59,90 / R$ 99,90), fazer um pagamento real de **R$ 1,00** para validar o fluxo completo em produção.

### 5. Ajustar os valores dos planos para produção
Garantir que os valores na Edge Function `asaas-checkout` correspondem aos planos reais.
