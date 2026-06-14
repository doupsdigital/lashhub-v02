# Etapa 1: Modelagem do Banco de Dados e Isolamento (SaaS Core)
> **Status: CONCLUÍDO**

Esta etapa estruturou o banco de dados para suportar múltiplos estabelecimentos (inquilinos/tenants) e garantiu que um estúdio não consiga visualizar ou modificar os dados de outro estúdio (Row Level Security).

---

## 1. Alterações no Banco de Dados

### Nova Tabela: `public.estabelecimentos`
Armazena as informações de cada estúdio/assinante do SaaS:
```sql
CREATE TABLE public.estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_negocio TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Usado na URL do portal público (ex: brunalash)
  plano TEXT NOT NULL DEFAULT 'basico' CHECK (plano IN ('basico', 'premium')),
  status_assinatura TEXT NOT NULL DEFAULT 'trial' CHECK (status_assinatura IN ('trial', 'ativo', 'cancelado', 'suspenso')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Inquilino Padrão (Showroom / Demo)
Para que os dados existentes no banco LASHLY-DEMO fossem preservados, criamos um estabelecimento padrão:
- **ID**: `e1000000-0000-0000-0000-000000000000`
- **Nome**: Bruna Lash
- **Slug**: `brunalash`

### Associação de Tabelas
A coluna `estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE` foi adicionada às seguintes tabelas:
1. `public.configuracao_negocio`
2. `public.usuarios`
3. `public.clientes`
4. `public.categorias_servico`
5. `public.servicos`
6. `public.horarios_atendimento`
7. `public.bloqueios_agenda`
8. `public.agendamentos`
9. `public.atendimentos`
10. `public.logs`

*Nota: Todas as linhas pré-existentes no banco foram atualizadas para o `estabelecimento_id` padrão e a coluna foi alterada para `NOT NULL`.*

---

## 2. Segurança: Row Level Security (RLS)

### Funções Auxiliares (Prevenção de Recursão)
Para evitar loops infinitos no RLS ao consultar a tabela `usuarios` nas regras, criamos duas funções `SECURITY DEFINER`:
```sql
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_user_establishment()
RETURNS UUID AS $$
  SELECT estabelecimento_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
```

### Regras Multi-Tenant RLS Aplicadas
- **Acesso Administrativo (Profissionais)**: Todas as tabelas transacionais e cadastrais filtram os registros pelo `estabelecimento_id` retornado pela função `get_auth_user_establishment()`.
- **Acesso do Cliente**: Podem consultar seus próprios agendamentos e seu perfil na tabela `clientes` pelo ID associado.
- **Acesso Público**: As tabelas `servicos`, `categorias_servico`, `horarios_atendimento`, `bloqueios_agenda` e `configuracao_negocio` permitem `SELECT` livre (`USING (true)`), pois são usadas de forma anônima na página de agendamento externa (o filtro de exibição ocorre na query GraphQL/PostgREST do frontend usando o `estabelecimento_id`).

---

## 3. Atualização dos Scripts locais
Os scripts de banco foram atualizados para contemplar o `estabelecimento_id`:
- **`scripts/migrate_to_saas.sql`**: Executou a migração.
- **`scripts/seed_demo_data.sql` & `scripts/seed_lash_designer.sql`**: Ajustados para injetar o `estabelecimento_id` demo.
- **`scripts/seed_demo.js`**: Atualizado para incluir o `estabelecimento_id` nos objetos JSON gerados em lote e utilizar as novas credenciais de login (`admin@lashly.com` / `admin123`).
- **`scripts/purge_db.js`**: Alterado para deletar os registros **apenas** do estabelecimento demo (`e1000000-0000-0000-0000-000000000000`), evitando apagar dados de outras profissionais do SaaS.
