-- =========================================================================
-- MIGRATION: TRANSIÇÃO PARA SAAS MULTI-TENANT
-- =========================================================================

-- 1. Criar tabela de estabelecimentos
CREATE TABLE IF NOT EXISTS public.estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_negocio TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plano TEXT NOT NULL DEFAULT 'basico' CHECK (plano IN ('basico', 'premium')),
  status_assinatura TEXT NOT NULL DEFAULT 'trial' CHECK (status_assinatura IN ('trial', 'ativo', 'cancelado', 'suspenso')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS na tabela de estabelecimentos
ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;

-- 3. Inserir estabelecimento de demonstração padrão (para migrar os dados existentes)
INSERT INTO public.estabelecimentos (id, nome_negocio, slug, plano, status_assinatura)
VALUES ('e1000000-0000-0000-0000-000000000000', 'Bruna Lash', 'brunalash', 'premium', 'ativo')
ON CONFLICT (id) DO NOTHING;

-- 4. Adicionar coluna estabelecimento_id nas tabelas principais
-- configuracao_negocio
ALTER TABLE public.configuracao_negocio ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.configuracao_negocio SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.configuracao_negocio ALTER COLUMN estabelecimento_id SET NOT NULL;

-- usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.usuarios SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.usuarios ALTER COLUMN estabelecimento_id SET NOT NULL;

-- clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.clientes SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.clientes ALTER COLUMN estabelecimento_id SET NOT NULL;

-- categorias_servico
ALTER TABLE public.categorias_servico ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.categorias_servico SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.categorias_servico ALTER COLUMN estabelecimento_id SET NOT NULL;

-- servicos
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.servicos SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.servicos ALTER COLUMN estabelecimento_id SET NOT NULL;

-- horarios_atendimento
ALTER TABLE public.horarios_atendimento ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.horarios_atendimento SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.horarios_atendimento ALTER COLUMN estabelecimento_id SET NOT NULL;

-- bloqueios_agenda
ALTER TABLE public.bloqueios_agenda ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.bloqueios_agenda SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.bloqueios_agenda ALTER COLUMN estabelecimento_id SET NOT NULL;

-- agendamentos
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.agendamentos SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.agendamentos ALTER COLUMN estabelecimento_id SET NOT NULL;

-- atendimentos
ALTER TABLE public.atendimentos ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.atendimentos SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.atendimentos ALTER COLUMN estabelecimento_id SET NOT NULL;

-- logs
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE CASCADE;
UPDATE public.logs SET estabelecimento_id = 'e1000000-0000-0000-0000-000000000000' WHERE estabelecimento_id IS NULL;
ALTER TABLE public.logs ALTER COLUMN estabelecimento_id SET NOT NULL;


-- 5. Criar funções auxiliares de segurança para evitar recursão nas políticas RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_user_establishment()
RETURNS UUID AS $$
  SELECT estabelecimento_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;


-- 6. Recriar Políticas de RLS com base no isolamento de múltiplos estabelecimentos

-- ESTABELECIMENTOS
DROP POLICY IF EXISTS "public_read_estabelecimento" ON public.estabelecimentos;
DROP POLICY IF EXISTS "profissional_update_estabelecimento" ON public.estabelecimentos;

CREATE POLICY "public_read_estabelecimento" ON public.estabelecimentos
  FOR SELECT USING (true);

CREATE POLICY "profissional_update_estabelecimento" ON public.estabelecimentos
  FOR UPDATE USING (
    id = (SELECT estabelecimento_id FROM public.usuarios WHERE id = auth.uid() AND role = 'profissional')
  );

-- USUARIOS
DROP POLICY IF EXISTS "usuarios_own_data" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (
    id = auth.uid()
    OR (
      public.get_auth_user_role() = 'profissional'
      AND estabelecimento_id = public.get_auth_user_establishment()
    )
  );

CREATE POLICY "usuarios_insert" ON public.usuarios
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update" ON public.usuarios
  FOR UPDATE USING (id = auth.uid());

-- CLIENTES
DROP POLICY IF EXISTS "profissional_full_access_clientes" ON public.clientes;
DROP POLICY IF EXISTS "clientes_own_data" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT USING (
    id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    OR (
      public.get_auth_user_role() = 'profissional'
      AND estabelecimento_id = public.get_auth_user_establishment()
    )
  );

CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE USING (
    id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    OR (
      public.get_auth_user_role() = 'profissional'
      AND estabelecimento_id = public.get_auth_user_establishment()
    )
  );

CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- CATEGORIAS_SERVICO
DROP POLICY IF EXISTS "profissional_full_access_categorias" ON public.categorias_servico;
DROP POLICY IF EXISTS "categorias_public_read" ON public.categorias_servico;
DROP POLICY IF EXISTS "categorias_select" ON public.categorias_servico;
DROP POLICY IF EXISTS "categorias_modify" ON public.categorias_servico;

CREATE POLICY "categorias_select" ON public.categorias_servico FOR SELECT USING (true);
CREATE POLICY "categorias_modify" ON public.categorias_servico
  FOR ALL USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- SERVICOS
DROP POLICY IF EXISTS "profissional_full_access_servicos" ON public.servicos;
DROP POLICY IF EXISTS "servicos_public_read" ON public.servicos;
DROP POLICY IF EXISTS "servicos_select" ON public.servicos;
DROP POLICY IF EXISTS "servicos_modify" ON public.servicos;

CREATE POLICY "servicos_select" ON public.servicos FOR SELECT USING (true);
CREATE POLICY "servicos_modify" ON public.servicos
  FOR ALL USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- VARIACOES_SERVICO
DROP POLICY IF EXISTS "profissional_full_access_variacoes" ON public.variacoes_servico;
DROP POLICY IF EXISTS "variacoes_public_read" ON public.variacoes_servico;
DROP POLICY IF EXISTS "variacoes_select" ON public.variacoes_servico;
DROP POLICY IF EXISTS "variacoes_modify" ON public.variacoes_servico;

CREATE POLICY "variacoes_select" ON public.variacoes_servico FOR SELECT USING (true);
CREATE POLICY "variacoes_modify" ON public.variacoes_servico
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.servicos s
      WHERE s.id = servico_id
      AND s.estabelecimento_id = public.get_auth_user_establishment()
      AND public.get_auth_user_role() = 'profissional'
    )
  );

-- HORARIOS_ATENDIMENTO
DROP POLICY IF EXISTS "profissional_full_access_horarios" ON public.horarios_atendimento;
DROP POLICY IF EXISTS "horarios_public_read" ON public.horarios_atendimento;
DROP POLICY IF EXISTS "horarios_select" ON public.horarios_atendimento;
DROP POLICY IF EXISTS "horarios_modify" ON public.horarios_atendimento;

CREATE POLICY "horarios_select" ON public.horarios_atendimento FOR SELECT USING (true);
CREATE POLICY "horarios_modify" ON public.horarios_atendimento
  FOR ALL USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- BLOQUEIOS_AGENDA
DROP POLICY IF EXISTS "profissional_full_access_bloqueios" ON public.bloqueios_agenda;
DROP POLICY IF EXISTS "bloqueios_public_read" ON public.bloqueios_agenda;
DROP POLICY IF EXISTS "bloqueios_select" ON public.bloqueios_agenda;
DROP POLICY IF EXISTS "bloqueios_modify" ON public.bloqueios_agenda;

CREATE POLICY "bloqueios_select" ON public.bloqueios_agenda FOR SELECT USING (true);
CREATE POLICY "bloqueios_modify" ON public.bloqueios_agenda
  FOR ALL USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- CONFIGURACAO_NEGOCIO
DROP POLICY IF EXISTS "profissional_full_access_config" ON public.configuracao_negocio;
DROP POLICY IF EXISTS "config_public_read" ON public.configuracao_negocio;
DROP POLICY IF EXISTS "config_select" ON public.configuracao_negocio;
DROP POLICY IF EXISTS "config_modify" ON public.configuracao_negocio;

CREATE POLICY "config_select" ON public.configuracao_negocio FOR SELECT USING (true);
CREATE POLICY "config_modify" ON public.configuracao_negocio
  FOR ALL USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- AGENDAMENTOS
DROP POLICY IF EXISTS "profissional_full_access_agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "clientes_own_agendamentos_select" ON public.agendamentos;
DROP POLICY IF EXISTS "clientes_create_agendamento" ON public.agendamentos;
DROP POLICY IF EXISTS "clientes_cancel_agendamento" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_select" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_update" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete" ON public.agendamentos;

CREATE POLICY "agendamentos_select" ON public.agendamentos
  FOR SELECT USING (
    cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    OR (
      public.get_auth_user_role() = 'profissional'
      AND estabelecimento_id = public.get_auth_user_establishment()
    )
  );

CREATE POLICY "agendamentos_insert" ON public.agendamentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "agendamentos_update" ON public.agendamentos
  FOR UPDATE USING (
    cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    OR (
      public.get_auth_user_role() = 'profissional'
      AND estabelecimento_id = public.get_auth_user_establishment()
    )
  );

CREATE POLICY "agendamentos_delete" ON public.agendamentos
  FOR DELETE USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- AGENDAMENTO_SERVICOS
DROP POLICY IF EXISTS "clientes_own_agendamento_servicos" ON public.agendamento_servicos;
DROP POLICY IF EXISTS "agendamento_servicos_select" ON public.agendamento_servicos;
DROP POLICY IF EXISTS "agendamento_servicos_modify" ON public.agendamento_servicos;

CREATE POLICY "agendamento_servicos_select" ON public.agendamento_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id
      AND (
        a.cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
        OR (
          public.get_auth_user_role() = 'profissional'
          AND a.estabelecimento_id = public.get_auth_user_establishment()
        )
      )
    )
  );

CREATE POLICY "agendamento_servicos_modify" ON public.agendamento_servicos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id
      AND (
        a.cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
        OR (
          public.get_auth_user_role() = 'profissional'
          AND a.estabelecimento_id = public.get_auth_user_establishment()
        )
      )
    )
  );

-- ATENDIMENTOS
DROP POLICY IF EXISTS "profissional_full_access_atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "atendimentos_policy" ON public.atendimentos;

CREATE POLICY "atendimentos_policy" ON public.atendimentos
  FOR ALL USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );

-- LOGS
DROP POLICY IF EXISTS "profissional_full_access_logs" ON public.logs;
DROP POLICY IF EXISTS "logs_policy" ON public.logs;

CREATE POLICY "logs_policy" ON public.logs
  FOR ALL USING (
    public.get_auth_user_role() = 'profissional'
    AND estabelecimento_id = public.get_auth_user_establishment()
  );
