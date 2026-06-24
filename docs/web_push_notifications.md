# Web Push Notifications — Lash Hub

**Status:** Implementado e funcionando  
**Data:** Junho 2026

---

## O que é e por que foi implementado

Web Push Notifications permite que o sistema notifique a profissional no celular quando uma cliente faz um agendamento pelo portal — sem depender de WhatsApp, sem API paga, sem risco de banimento.

Funciona via **PWA (Progressive Web App)**: quando a profissional instala o Lash Hub na tela inicial do celular e ativa as notificações, o sistema envia alertas diretamente no dispositivo dela, mesmo com o app fechado.

### Compatibilidade
| Plataforma | Suporte |
|---|---|
| Android (Chrome/Samsung) — PWA instalado | ✅ Funciona mesmo com app fechado |
| Android — browser normal | ✅ Funciona com browser aberto/minimizado |
| iOS 16.4+ — PWA instalado na tela inicial | ✅ Funciona |
| iOS — Safari sem instalar o PWA | ❌ Não suportado pela Apple |
| Desktop Chrome/Firefox | ✅ Funciona |

---

## Arquitetura do sistema

```
[Cliente faz agendamento no portal]
           ↓
  INSERT na tabela agendamentos
           ↓
  Trigger PostgreSQL (pg_net)
           ↓
  Edge Function Supabase "send-push"
           ↓
  Busca subscriptions da profissional
           ↓
  Protocolo Web Push (VAPID + criptografia)
           ↓
  [Notificação aparece no celular da profissional]
```

**Custo adicional: zero.** Supabase Pro inclui 2 milhões de invocações de Edge Functions/mês.

---

## Componentes implementados

### 1. Banco de dados

**Tabela `push_subscriptions`:**
```sql
CREATE TABLE public.push_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  estabelecimento_id  UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  endpoint            TEXT NOT NULL,
  p256dh              TEXT NOT NULL,
  auth                TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
```

- `endpoint`: URL única do push service do navegador da profissional
- `p256dh`: chave pública de criptografia do dispositivo
- `auth`: segredo de autenticação do dispositivo

**RLS:**
```sql
CREATE POLICY "usuario_own_subscriptions"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Trigger `on_agendamento_insert`:**
Dispara ao inserir um agendamento com `status = 'pendente'` e `origem = 'portal'`, chamando a Edge Function via `pg_net` com um secret de autenticação no header.

---

### 2. Edge Function — `supabase/functions/send-push/index.ts`

Recebe o webhook do banco, valida o secret, busca subscriptions da profissional e envia a notificação usando `npm:web-push` (que cuida de toda a criptografia ECDH-AES128GCM obrigatória pelo protocolo Web Push).

**Conteúdo da notificação:**
```
Título: 📅 Novo agendamento!
Corpo: [Nome da cliente] • [Serviço] • [Data/Hora]
Exemplo: Flávia Cunha • Fio a Fio Clássico • 25/06, 11:00
```

---

### 3. Service Worker — `public/sw.js`

Atualizado para receber eventos `push` e `notificationclick`:
- Exibe a notificação com título, corpo e ícone do app
- Ao clicar na notificação, abre o sistema na tela de Agendamentos

---

### 4. Hook — `src/hooks/usePushNotifications.ts`

Hook React que gerencia:
- Verificação de suporte do browser
- Verificação de permissão atual (`default`, `granted`, `denied`)
- Solicitação de permissão ao usuário
- Registro da subscription no banco (`push_subscriptions`)
- Cancelamento da subscription

**Proteção multi-tenant:** verifica `role === 'profissional'` antes de registrar qualquer subscription.

---

### 5. Componente — `src/components/common/PushPermissionBanner.tsx`

Banner que aparece no Dashboard da profissional quando as notificações ainda não foram ativadas. Mostra uma vez — se a profissional dispensar, não aparece mais (salvo em `localStorage`).

---

## Variáveis de ambiente necessárias

### Frontend (Vercel)
| Variável | Descrição |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | Chave pública VAPID gerada com `npx web-push generate-vapid-keys` |

### Edge Function (Supabase Secrets)
| Variável | Descrição |
|---|---|
| `VAPID_PUBLIC_KEY` | Mesma chave pública VAPID |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID (nunca expor no frontend) |
| `VAPID_SUBJECT` | `mailto:lashhubapp@gmail.com` |
| `WEBHOOK_SECRET` | Segredo compartilhado entre trigger e Edge Function |
| `SUPABASE_URL` | Injetado automaticamente pelo Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Injetado automaticamente pelo Supabase |

---

## Segurança implementada

### 1. Webhook secret (Fix crítico)
O trigger do banco envia o header `x-webhook-secret` com um segredo gerado aleatoriamente. A Edge Function rejeita qualquer requisição sem esse header válido — impede que terceiros postem payloads falsos na URL da função.

### 2. Isolamento multi-tenant
Cada subscription é armazenada com `estabelecimento_id`. A Edge Function busca subscriptions exclusivamente do estabelecimento do agendamento. Uma profissional do Estúdio A jamais recebe notificações do Estúdio B.

### 3. Role check no frontend
`usePushNotifications` verifica `role === 'profissional'` antes de registrar qualquer subscription. Clientes não podem se inscrever para receber notificações profissionais.

### 4. FK na tabela
`push_subscriptions.estabelecimento_id` tem FOREIGN KEY para `estabelecimentos`, garantindo que não existam subscriptions com IDs inválidos no banco.

### 5. RLS na tabela
Cada usuário só pode ver e modificar as próprias subscriptions.

---

## Como ativar as notificações (fluxo da profissional)

1. Instalar o Lash Hub como PWA na tela inicial do celular
2. Abrir o painel → **Meu Estúdio**
3. O banner "Ative as notificações" aparece automaticamente
4. Clicar em **Ativar notificações**
5. Aceitar a permissão do browser

A partir daí, toda vez que uma cliente agendar pelo portal, a profissional recebe uma notificação push no celular.

---

## Deploy em produção (`lashhub-prod`)

Ao ativar o banco de produção, os seguintes passos adicionais são necessários:

1. **Rodar o `schema_definitivo.sql`** — a tabela `push_subscriptions`, o trigger e a extensão `pg_net` já estão incluídos
2. **Substituir a URL hardcoded** no trigger: trocar `acsjornxtcjaufprsbuw` pelo `project-ref` do banco prod
3. **Adicionar os mesmos secrets** na Edge Function do projeto prod (VAPID keys + WEBHOOK_SECRET)
4. **Adicionar `VITE_VAPID_PUBLIC_KEY`** nas variáveis de ambiente da Vercel para o ambiente de produção
5. **Fazer deploy da Edge Function** `send-push` no projeto prod

> As chaves VAPID podem ser as mesmas do dev — elas identificam o servidor, não o banco. Não precisam ser regeneradas.

---

## Personalizar o ícone da notificação (a fazer)

Atualmente a notificação exibe um **ícone quadrado** com o logo do Lash Hub sobre fundo colorido. Isso acontece porque o Android usa o `icon-192.png` (ícone do PWA) como ícone da notificação, e este tem fundo.

### Por que parece quadrado

O Android usa dois elementos visuais nas notificações:
- **Large icon** (`icon` no sw.js): ícone grande ao lado do texto — usa o `icon-192.png` atual
- **Badge** (`badge` no sw.js): ícone pequeno monocromático na barra de status

### Como melhorar (quando for criar o ícone)

Criar um arquivo `public/notification-badge.png` com as seguintes especificações:

| Propriedade | Valor |
|---|---|
| Tamanho | 96×96 px |
| Fundo | Transparente |
| Cor do ícone | Branco (#FFFFFF) |
| Conteúdo | Símbolo simples do Lash Hub (ex: só o símbolo dos cílios, sem texto) |

Depois atualizar o `public/sw.js`:

```js
self.registration.showNotification(data.title, {
  body: data.body,
  icon: '/icon-192.png',        // ícone grande (já existe)
  badge: '/notification-badge.png', // ← novo ícone monocromático
  data: { url: data.url },
  vibrate: [200, 100, 200],
});
```

O resultado: a barra de status do Android mostrará um ícone pequeno e limpo do Lash Hub, sem o fundo colorido.

**Ferramentas sugeridas para criar o badge:**
- [Figma](https://figma.com) — exportar como PNG 96×96 transparente
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator) — gera todos os tamanhos automaticamente
