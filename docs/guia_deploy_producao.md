# Guia: Como Ligar o Banco de Produção

Este documento é o seu manual para quando chegar a hora de ativar o `lashhub-prod`. Guarde-o e use-o como checklist a cada deploy.

---

## Contexto

O projeto tem dois bancos no Supabase:

| Projeto | Uso | Status |
|---|---|---|
| `lashhub-desenv` | Desenvolvimento e testes | Ativo e em uso |
| `lashhub-prod` | Produção (usuários reais) | Vazio, aguardando ativação |

O arquivo `scripts/schema_definitivo.sql` contém toda a estrutura necessária para criar o banco do zero. Ele deve estar sempre atualizado com o que existe no banco de desenvolvimento.

---

## Quando atualizar o schema_definitivo.sql

Sempre que você rodar um SQL manualmente no banco de desenvolvimento (ex: adicionar coluna, criar função, alterar policy), anote aqui ou peça para o Claude atualizar o arquivo. O schema fica desatualizado quando SQLs são rodados sem registrar no arquivo.

**Mudanças já registradas na v1.3:**
- Coluna `telefone` na tabela `usuarios`
- Coluna `imagem_url` na tabela `servicos`
- Função `sync_cliente_email` (RPC)
- Bucket `servicos-imagens` e suas policies

---

## Checklist completo para ativar o prod

### Passo 1 — Gerar o schema atualizado (opcional mas recomendado)

Antes de rodar no prod, garanta que o `schema_definitivo.sql` reflete o banco de dev atual. Abra o terminal e rode:

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login na sua conta Supabase
supabase login

# Gerar dump do banco de desenvolvimento
# O project-ref está na URL do Supabase: acsjornxtcjaufprsbuw
supabase db dump --project-ref acsjornxtcjaufprsbuw -f scripts/schema_definitivo.sql
```

Se preferir não fazer isso, use o `schema_definitivo.sql` atual — ele cobre as principais estruturas.

---

### Passo 2 — Rodar o schema no banco de produção

1. Acesse o Supabase → projeto `lashhub-prod`
2. Vá em **SQL Editor**
3. Copie todo o conteúdo de `scripts/schema_definitivo.sql`
4. Cole no editor e clique em **Run**

Se tudo correr bem, você verá todas as tabelas criadas na aba **Table Editor**.

---

### Passo 3 — Verificar os buckets de Storage

O schema já cria os buckets automaticamente, mas verifique:

1. Acesse **Storage** no painel do prod
2. Confirme que existem dois buckets:
   - `avatars` — marcado como **Public**
   - `servicos-imagens` — marcado como **Public**
3. Clique em cada bucket → aba **Policies** — confirme que há pelo menos 1 policy

Se os buckets não aparecerem, crie manualmente:
- Nome: `avatars` | Public: sim
- Nome: `servicos-imagens` | Public: sim

E rode no SQL Editor:
```sql
-- Policy para avatars
CREATE POLICY "avatars_public_access" ON storage.objects FOR ALL TO public
USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- Policy para servicos-imagens
CREATE POLICY "servicos_imagens_public_access" ON storage.objects FOR ALL TO public
USING (bucket_id = 'servicos-imagens') WITH CHECK (bucket_id = 'servicos-imagens');
```

---

### Passo 4 — Migrar imagens padrão dos serviços ⚠️ IMPORTANTE

O trigger de onboarding cria serviços padrão com imagens que estão no storage do projeto `lashhub-desenv`. Se você deletar o projeto dev depois, essas imagens quebram em prod para todas as profissionais.

**Antes de deletar o `lashhub-desenv`, siga estes passos:**

1. Acesse o Supabase → `lashhub-desenv` → **Storage → servicos-imagens**
2. Baixe as 11 imagens da pasta do estabelecimento de referência
3. No `lashhub-prod` → **Storage → servicos-imagens**, faça upload dessas mesmas imagens em qualquer pasta (ex: `defaults/`)
4. Copie as novas URLs públicas de cada imagem
5. Atualize o trigger no `lashhub-prod` com as novas URLs rodando no SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
-- ... cole aqui o conteúdo do trigger do schema_definitivo.sql
-- substituindo todas as URLs de imagem pelas novas URLs do prod
$$;
```

> **Dica:** As URLs seguem o padrão `https://<ref-do-prod>.supabase.co/storage/v1/object/public/servicos-imagens/<caminho>`.
> Você pode usar busca e substituição: trocar `acsjornxtcjaufprsbuw` pelo ref do prod e `508cda55-2819-427d-9a11-bc0f17e680f4` pelo caminho da nova pasta.

---

### Passo 5 — Configurar Authentication

1. No painel do prod → **Authentication → URL Configuration**
   - **Site URL**: URL do seu app em produção (ex: `https://lashhub.vercel.app`)
   - **Redirect URLs**: mesma URL + `/auth/callback`

2. **Authentication → Email Templates** (opcional)
   - Personalizar o email de confirmação de cadastro com a identidade visual do Lash Hub

---

### Passo 6 — Atualizar o .env do projeto

Crie um arquivo `.env.production` (ou variáveis de ambiente no Vercel/host) com as credenciais do banco de **produção**:

```env
VITE_SUPABASE_URL=https://<ref-do-prod>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-do-prod>
```

As credenciais do prod estão em: Supabase → `lashhub-prod` → **Project Settings → API**.

---

### Passo 7 — Deploy do frontend

Se estiver usando Vercel:
1. Configure as variáveis de ambiente do prod no painel da Vercel
2. Faça o deploy do branch `main`

---

### Passo 8 — Teste rápido pós-deploy

Antes de divulgar para clientes:

- [ ] Criar uma conta de profissional no app de produção
- [ ] Confirmar que as categorias e serviços padrão foram criados (trigger de onboarding)
- [ ] Confirmar que os horários padrão (Seg–Sex) foram criados
- [ ] Acessar o portal da profissional e conferir que aparece o catálogo
- [ ] Criar uma conta de cliente via portal
- [ ] Fazer um agendamento de teste
- [ ] Fazer upload de imagem em um serviço

---

## O que NÃO é migrado automaticamente

| Item | O que fazer |
|---|---|
| Dados do banco de dev (clientes, agendamentos de teste) | Não migrar — prod começa limpo |
| Imagens já no storage de dev | Não migrar — cada profissional faz upload no prod |
| Configurações de Auth (templates, URLs) | Configurar manualmente (Passo 4) |
| Variáveis de ambiente | Trocar para as do prod (Passo 5) |

---

## Como pedir ajuda ao Claude

Quando for ligar o prod, abra uma conversa e diga:

> "Vou ativar o banco de produção do Lash Hub. Me ajuda a seguir o guia em docs/guia_deploy_producao.md e verificar se tem alguma atualização pendente no schema_definitivo.sql."

O Claude vai verificar o arquivo, comparar com mudanças recentes no código e te guiar pelo checklist.
