-- =========================================================================
-- LASH HUB — SCHEMA DEFINITIVO v1.3
-- =========================================================================
-- Execute este script completo no SQL Editor de qualquer novo projeto
-- Supabase para recriar toda a estrutura do banco do zero.
--
-- Ordem de execução:
--   1. Tabelas
--   2. Funções auxiliares de segurança
--   3. Função RPC get_slots_ocupados (portal de agendamento)
--   4. Trigger de onboarding automático
--   5. RLS — habilitar e criar políticas
--   6. Storage bucket para avatares/logos
-- =========================================================================


-- =========================================================================
-- 1. TABELAS
-- =========================================================================

-- Estabelecimentos (um por profissional — o "tenant" do SaaS)
CREATE TABLE IF NOT EXISTS public.estabelecimentos (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_negocio            TEXT        NOT NULL,
  slug                    TEXT        UNIQUE NOT NULL,
  plano                   TEXT        NOT NULL DEFAULT 'basico'
                          CHECK (plano IN ('basico', 'premium')),
  status_assinatura       TEXT        NOT NULL DEFAULT 'trial'
                          CHECK (status_assinatura IN ('trial', 'ativo', 'cancelado', 'suspenso')),
  billing_customer_id     TEXT,
  billing_subscription_id TEXT,
  trial_ends_at           TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Clientes (pertencentes a um estabelecimento)
CREATE TABLE IF NOT EXISTS public.clientes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome              TEXT        NOT NULL,
  sobrenome         TEXT,
  email             TEXT,
  whatsapp          TEXT,
  data_nascimento   DATE,
  cpf               TEXT,
  endereco          TEXT,
  observacoes       TEXT,
  alergias          TEXT,
  medicamentos      TEXT,
  doencas_cronicas  TEXT,
  gestante          BOOLEAN     DEFAULT false,
  anamnese_lash     JSONB       DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Usuários (profissionais e clientes autenticados)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id                UUID        PRIMARY KEY,  -- mesmo ID do auth.users
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome              TEXT        NOT NULL,
  email             TEXT        UNIQUE NOT NULL,
  avatar_url        TEXT,
  telefone          TEXT,
  onboarding_paginas_vistas TEXT[] DEFAULT '{}',
  role              TEXT        NOT NULL DEFAULT 'cliente'
                    CHECK (role IN ('profissional', 'cliente')),
  cliente_id        UUID        REFERENCES public.clientes(id),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Categorias de Serviço
CREATE TABLE IF NOT EXISTS public.categorias_servico (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome              TEXT        NOT NULL,
  descricao         TEXT,
  ordem             INTEGER     DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Serviços
CREATE TABLE IF NOT EXISTS public.servicos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  categoria_id      UUID        REFERENCES public.categorias_servico(id) ON DELETE SET NULL,
  nome              TEXT        NOT NULL,
  descricao         TEXT,
  duracao_minutos   INTEGER     NOT NULL DEFAULT 60,
  valor             NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo             BOOLEAN     DEFAULT true,
  imagem_url        TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Variações de Serviço (ex: Volume Russo, Clássico, Híbrido)
CREATE TABLE IF NOT EXISTS public.variacoes_servico (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id      UUID        NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  nome            TEXT        NOT NULL,
  duracao_minutos INTEGER,
  valor           NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Horários de Atendimento (dias/horas que a profissional trabalha)
CREATE TABLE IF NOT EXISTS public.horarios_atendimento (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  dia_semana        INTEGER     NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio       TIME        NOT NULL,
  hora_fim          TIME        NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_dia_semana_estabelecimento UNIQUE (estabelecimento_id, dia_semana)
);

-- Bloqueios de Agenda (férias, feriados, horários indisponíveis)
CREATE TABLE IF NOT EXISTS public.bloqueios_agenda (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  data_inicio       DATE        NOT NULL,
  data_fim          DATE        NOT NULL,
  motivo            TEXT,
  dia_inteiro       BOOLEAN     DEFAULT true,
  hora_inicio       TIME,       -- preenchido apenas quando dia_inteiro = false
  hora_fim          TIME,       -- preenchido apenas quando dia_inteiro = false
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Agendamentos
-- ATENÇÃO: status 'falta' representa no-show (cliente não compareceu)
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  cliente_id        UUID        NOT NULL REFERENCES public.clientes(id),
  data_hora         TIMESTAMPTZ NOT NULL,
  duracao_minutos   INTEGER     NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido', 'falta')),
  origem            TEXT        DEFAULT 'admin' CHECK (origem IN ('admin', 'portal')),
  observacoes       TEXT,
  valor_cobrado     NUMERIC(10,2),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Itens / Serviços de cada Agendamento
CREATE TABLE IF NOT EXISTS public.agendamento_servicos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id  UUID        NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  servico_id      UUID        NOT NULL REFERENCES public.servicos(id),
  variacao_id     UUID        REFERENCES public.variacoes_servico(id),
  valor_cobrado   NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Atendimentos manuais (histórico registrado diretamente pela profissional)
CREATE TABLE IF NOT EXISTS public.atendimentos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  cliente_id        UUID        NOT NULL REFERENCES public.clientes(id),
  servico_id        UUID        NOT NULL REFERENCES public.servicos(id),
  variacao_id       UUID        REFERENCES public.variacoes_servico(id),
  data_atendimento  DATE        NOT NULL,
  valor_cobrado     NUMERIC(10,2) NOT NULL,
  observacoes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Configurações do Negócio (visual, regras, mensagens)
CREATE TABLE IF NOT EXISTS public.configuracao_negocio (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id              UUID        NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  nome_negocio                    TEXT        NOT NULL DEFAULT 'Meu Studio',
  descricao                       TEXT,
  instagram                       TEXT,
  endereco                        TEXT,
  logo_url                        TEXT,
  aprovacao_automatica            BOOLEAN     DEFAULT false,
  antecedencia_cancelamento_horas INTEGER     DEFAULT 24,
  mensagem_pos_agendamento        TEXT        DEFAULT 'Seu agendamento foi recebido! Aguarde a confirmação.',
  paleta_cores                    TEXT        DEFAULT 'rosa_rose',
  modo_escuro                     BOOLEAN     DEFAULT false,
  created_at                      TIMESTAMPTZ DEFAULT now()
);

-- Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID       NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  usuario_id        UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  acao              TEXT        NOT NULL,
  detalhes          JSONB,
  created_at        TIMESTAMPTZ DEFAULT now()
);


-- =========================================================================
-- 2. FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER — evita recursão RLS)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_establishment()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT estabelecimento_id FROM public.usuarios WHERE id = auth.uid();
$$;


-- =========================================================================
-- 3. FUNÇÃO RPC: get_slots_ocupados
-- Usada pelo portal de agendamento para buscar horários já ocupados
-- de forma segura, contornando RLS do lado do cliente.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_slots_ocupados(
  p_estabelecimento_id UUID,
  p_data               DATE
)
RETURNS TABLE (data_hora TIMESTAMPTZ, duracao_minutos INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.data_hora, a.duracao_minutos
  FROM public.agendamentos a
  WHERE a.estabelecimento_id = p_estabelecimento_id
    AND a.data_hora::date = p_data
    AND a.status NOT IN ('cancelado', 'falta');
$$;


-- =========================================================================
-- 4. TRIGGER DE ONBOARDING AUTOMÁTICO
-- Disparado após INSERT em auth.users — cria o estabelecimento, o usuário,
-- as configurações iniciais E os serviços padrão para cada nova profissional.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_est_id   UUID;
  negocio_nome TEXT;
  negocio_slug TEXT;
  user_role    TEXT;
  client_uuid  UUID;
  cat_ext_id   UUID;
  cat_lift_id  UUID;
  cat_des_id   UUID;
  cat_man_id   UUID;
  srv_man_id   UUID;
BEGIN
  negocio_nome := new.raw_user_meta_data ->> 'nome_negocio';
  negocio_slug := new.raw_user_meta_data ->> 'slug';
  user_role    := COALESCE(new.raw_user_meta_data ->> 'role', 'profissional');

  IF user_role = 'profissional' AND negocio_nome IS NOT NULL THEN

    -- 1. Criar o estabelecimento com trial de 14 dias no plano Premium
    INSERT INTO public.estabelecimentos (nome_negocio, slug, plano, status_assinatura, trial_ends_at)
    VALUES (
      negocio_nome,
      COALESCE(negocio_slug, lower(regexp_replace(negocio_nome, '[^a-zA-Z0-9]', '-', 'g'))),
      'premium',
      'trial',
      now() + INTERVAL '14 days'
    )
    RETURNING id INTO new_est_id;

    -- 2. Criar registro do usuário profissional
    INSERT INTO public.usuarios (id, nome, email, role, estabelecimento_id)
    VALUES (new.id, negocio_nome, new.email, 'profissional', new_est_id);

    -- 3. Criar configurações padrão do negócio
    INSERT INTO public.configuracao_negocio (estabelecimento_id, nome_negocio)
    VALUES (new_est_id, negocio_nome);

    -- 4. Criar categorias de serviço padrão
    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Extensão de Cílios', 'Técnicas de alongamento de cílios fio a fio e volumes.', 1)
    RETURNING id INTO cat_ext_id;

    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Lash Lifting & Tratamentos', 'Curvatura e tratamentos para cílios naturais.', 2)
    RETURNING id INTO cat_lift_id;

    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Design de Sobrancelhas', 'Modelagem, alinhamento e coloração para sobrancelhas.', 3)
    RETURNING id INTO cat_des_id;

    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Manutenções e Remoções', 'Cuidados periódicos e remoção segura de extensões.', 4)
    RETURNING id INTO cat_man_id;

    -- 5. Criar serviços padrão — Extensão de Cílios
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES
      (new_est_id, cat_ext_id, 'Fio a Fio Clássico', 'Um fio sintético acoplado a cada cílio natural. Efeito natural e discreto para o dia a dia.', 120, 150.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255826335.jpg'),
      (new_est_id, cat_ext_id, 'Volume Russo', 'Fans artesanais de 3 a 6 fios super finos aplicados em cada cílio. Efeito volumoso, denso e marcante.', 150, 200.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255890760.jpg'),
      (new_est_id, cat_ext_id, 'Volume Híbrido', 'Mescla perfeita de Fio a Fio com Volume Russo. Oferece volume com textura e leveza.', 135, 180.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255869354.jpg'),
      (new_est_id, cat_ext_id, 'Volume Brasileiro (Cílios Y)', 'Extensões em formato de Y aplicadas individualmente. Proporciona olhar preenchido e moderno.', 120, 160.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255852596.jpg');

    -- 5b. Serviços padrão — Lash Lifting & Tratamentos
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES
      (new_est_id, cat_lift_id, 'Lash Lifting Completo', 'Curvatura natural e elevação dos cílios com aplicação de nutrição (Lash Botox) e tintura escura.', 60, 120.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255909251.jpg'),
      (new_est_id, cat_lift_id, 'Spa de Cílios', 'Higienização profunda dos fios, hidratação terapêutica e massagem relaxante na área dos olhos.', 30, 50.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255924503.jpg');

    -- 5c. Serviços padrão — Design de Sobrancelhas
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES
      (new_est_id, cat_des_id, 'Design de Sobrancelhas Simples', 'Modelagem personalizada respeitando a simetria e visagismo facial. Feito com pinça/linha.', 45, 50.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782256014481.jpg'),
      (new_est_id, cat_des_id, 'Design com Henna', 'Modelagem personalizada com aplicação de Henna de alta fixação para preencher falhas e destacar o design.', 60, 70.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782256001778.jpg'),
      (new_est_id, cat_des_id, 'Brow Lamination', 'Procedimento de alinhamento, estilização e nutrição química dos fios naturais das sobrancelhas.', 60, 130.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255982713.jpg');

    -- 5d. Serviços padrão — Manutenções e Remoções
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES (new_est_id, cat_man_id, 'Manutenção de Extensão', 'Reposição dos fios crescidos ou caídos. Válido até 20 dias após a aplicação original.', 90, 100.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255946912.jpg')
    RETURNING id INTO srv_man_id;

    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES (new_est_id, cat_man_id, 'Remoção de Extensão', 'Retirada segura e indolor de extensões antigas usando removedor em gel profissional.', 45, 40.00, true, 'https://acsjornxtcjaufprsbuw.supabase.co/storage/v1/object/public/servicos-imagens/508cda55-2819-427d-9a11-bc0f17e680f4/servico-1782255957203.jpg');

    -- 6. Variações da Manutenção de Extensão
    INSERT INTO public.variacoes_servico (servico_id, nome, duracao_minutos, valor)
    VALUES
      (srv_man_id, 'Manutenção Fio a Fio',          90,  90.00),
      (srv_man_id, 'Manutenção Volume Brasileiro',   90, 100.00),
      (srv_man_id, 'Manutenção Volume Híbrido',     100, 110.00),
      (srv_man_id, 'Manutenção Volume Russo',        120, 120.00);

    -- 7. Criar horários de atendimento padrão (Seg–Sex, 09:00–18:00)
    -- ON CONFLICT DO NOTHING garante idempotência caso o frontend também execute o seed
    INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim)
    VALUES
      (new_est_id, 1, '09:00', '18:00'),
      (new_est_id, 2, '09:00', '18:00'),
      (new_est_id, 3, '09:00', '18:00'),
      (new_est_id, 4, '09:00', '18:00'),
      (new_est_id, 5, '09:00', '18:00')
    ON CONFLICT (estabelecimento_id, dia_semana) DO NOTHING;

  ELSIF user_role = 'cliente' THEN

    client_uuid := (new.raw_user_meta_data ->> 'cliente_id')::UUID;

    -- Criar registro do usuário cliente (vinculado ao cliente já existente)
    INSERT INTO public.usuarios (id, nome, email, role, cliente_id, estabelecimento_id)
    VALUES (
      new.id,
      new.raw_user_meta_data ->> 'nome',
      new.email,
      'cliente',
      client_uuid,
      (new.raw_user_meta_data ->> 'estabelecimento_id')::UUID
    );

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();


-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =========================================================================

ALTER TABLE public.estabelecimentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_servico     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variacoes_servico      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_atendimento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_agenda       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamento_servicos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_negocio   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs                   ENABLE ROW LEVEL SECURITY;

-- ESTABELECIMENTOS
CREATE POLICY "estabelecimentos_anon_select"
  ON public.estabelecimentos FOR SELECT TO anon USING (true);

CREATE POLICY "estabelecimentos_profissional"
  ON public.estabelecimentos FOR ALL TO authenticated
  USING (id = public.get_auth_user_establishment())
  WITH CHECK (id = public.get_auth_user_establishment());

-- USUARIOS
CREATE POLICY "usuarios_select"
  ON public.usuarios FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (public.get_auth_user_role() = 'profissional'
        AND estabelecimento_id = public.get_auth_user_establishment())
  );

CREATE POLICY "usuarios_insert"
  ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update"
  ON public.usuarios FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- CLIENTES
CREATE POLICY "clientes_profissional"
  ON public.clientes FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

CREATE POLICY "clientes_self_select"
  ON public.clientes FOR SELECT TO authenticated
  USING (
    id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    AND public.get_auth_user_role() = 'cliente'
  );

CREATE POLICY "clientes_self_update"
  ON public.clientes FOR UPDATE TO authenticated
  USING (
    id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    AND public.get_auth_user_role() = 'cliente'
  )
  WITH CHECK (
    id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    AND public.get_auth_user_role() = 'cliente'
  );

CREATE POLICY "clientes_anon_insert"
  ON public.clientes FOR INSERT TO anon
  WITH CHECK (true);

-- Função RPC usada no cadastro do portal para verificar se a profissional já
-- cadastrou a cliente manualmente (bypass de RLS — retorna apenas o UUID).
-- Tenta match por email primeiro; fallback por WhatsApp (apenas dígitos) quando
-- o registro manual não possui email — e só se ainda não há conta de acesso.
CREATE OR REPLACE FUNCTION public.get_cliente_id_by_email_or_whatsapp(
  p_email              TEXT,
  p_whatsapp_digits    TEXT,
  p_estabelecimento_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- 1ª tentativa: match por email
  SELECT id INTO v_id
  FROM public.clientes
  WHERE LOWER(email) = LOWER(p_email)
    AND estabelecimento_id = p_estabelecimento_id
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- 2ª tentativa: fallback por WhatsApp (apenas dígitos) quando sem email
  -- e somente se o registro ainda não tem conta de acesso (sem usuarios)
  SELECT c.id INTO v_id
  FROM public.clientes c
  WHERE REGEXP_REPLACE(c.whatsapp, '[^0-9]', '', 'g') = p_whatsapp_digits
    AND c.estabelecimento_id = p_estabelecimento_id
    AND (c.email IS NULL OR c.email = '')
    AND NOT EXISTS (
      SELECT 1 FROM public.usuarios u WHERE u.cliente_id = c.id
    )
  LIMIT 1;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cliente_id_by_email_or_whatsapp TO anon;

-- Função RPC usada no cadastro do portal para sincronizar o email da cliente
-- quando ela se cadastra e já existe um registro manual sem email.
-- SECURITY DEFINER: contorna RLS (anon não tem UPDATE em clientes).
CREATE OR REPLACE FUNCTION public.sync_cliente_email(
  p_cliente_id UUID,
  p_email      TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clientes
  SET email = p_email
  WHERE id = p_cliente_id
    AND (email IS NULL OR email = '');
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_cliente_email TO anon;

-- CATEGORIAS DE SERVIÇO
CREATE POLICY "categorias_public_select"
  ON public.categorias_servico FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "categorias_profissional_write"
  ON public.categorias_servico FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

-- SERVIÇOS
CREATE POLICY "servicos_public_select"
  ON public.servicos FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "servicos_profissional_write"
  ON public.servicos FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

-- VARIAÇÕES DE SERVIÇO
CREATE POLICY "variacoes_public_select"
  ON public.variacoes_servico FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "variacoes_profissional_write"
  ON public.variacoes_servico FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.servicos s
      WHERE s.id = servico_id
        AND s.estabelecimento_id = public.get_auth_user_establishment()
    )
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servicos s
      WHERE s.id = servico_id
        AND s.estabelecimento_id = public.get_auth_user_establishment()
    )
    AND public.get_auth_user_role() = 'profissional'
  );

-- HORÁRIOS DE ATENDIMENTO
CREATE POLICY "horarios_public_select"
  ON public.horarios_atendimento FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "horarios_profissional_write"
  ON public.horarios_atendimento FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

-- BLOQUEIOS DE AGENDA
CREATE POLICY "bloqueios_public_select"
  ON public.bloqueios_agenda FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "bloqueios_profissional_write"
  ON public.bloqueios_agenda FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

-- CONFIGURAÇÃO DO NEGÓCIO
CREATE POLICY "config_public_select"
  ON public.configuracao_negocio FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "config_profissional_write"
  ON public.configuracao_negocio FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

-- AGENDAMENTOS
CREATE POLICY "agendamentos_profissional"
  ON public.agendamentos FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

CREATE POLICY "agendamentos_cliente_select"
  ON public.agendamentos FOR SELECT TO authenticated
  USING (
    cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    AND public.get_auth_user_role() = 'cliente'
  );

CREATE POLICY "agendamentos_cliente_insert"
  ON public.agendamentos FOR INSERT TO authenticated
  WITH CHECK (
    cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    AND public.get_auth_user_role() = 'cliente'
  );

CREATE POLICY "agendamentos_cliente_update"
  ON public.agendamentos FOR UPDATE TO authenticated
  USING (
    cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    AND public.get_auth_user_role() = 'cliente'
  )
  WITH CHECK (
    cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    AND public.get_auth_user_role() = 'cliente'
  );

-- AGENDAMENTO_SERVICOS
CREATE POLICY "agendamento_servicos_profissional"
  ON public.agendamento_servicos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id
        AND a.estabelecimento_id = public.get_auth_user_establishment()
    )
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id
        AND a.estabelecimento_id = public.get_auth_user_establishment()
    )
    AND public.get_auth_user_role() = 'profissional'
  );

CREATE POLICY "agendamento_servicos_cliente"
  ON public.agendamento_servicos FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id
        AND a.cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    )
    AND public.get_auth_user_role() = 'cliente'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.id = agendamento_id
        AND a.cliente_id = (SELECT cliente_id FROM public.usuarios WHERE id = auth.uid())
    )
    AND public.get_auth_user_role() = 'cliente'
  );

-- ATENDIMENTOS
CREATE POLICY "atendimentos_profissional"
  ON public.atendimentos FOR ALL TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  )
  WITH CHECK (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

-- LOGS
CREATE POLICY "logs_profissional_select"
  ON public.logs FOR SELECT TO authenticated
  USING (
    estabelecimento_id = public.get_auth_user_establishment()
    AND public.get_auth_user_role() = 'profissional'
  );

CREATE POLICY "logs_profissional_insert"
  ON public.logs FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = auth.uid()
    AND public.get_auth_user_role() = 'profissional'
  );


-- Subscriptions de Push Notifications (Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  estabelecimento_id  UUID        NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  endpoint            TEXT        NOT NULL,
  p256dh              TEXT        NOT NULL,
  auth                TEXT        NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_own_subscriptions"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- =========================================================================
-- 6. WEB PUSH NOTIFICATIONS — trigger via pg_net
-- =========================================================================

-- Extensão necessária para HTTP requests a partir do banco
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função que dispara a Edge Function quando um agendamento do portal é criado
-- ATENÇÃO: substituir WEBHOOK_SECRET_AQUI pelo valor real configurado nos secrets da Edge Function
CREATE OR REPLACE FUNCTION public.notify_new_agendamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'pendente' AND NEW.origem = 'portal' THEN
    PERFORM net.http_post(
      url     := 'https://acsjornxtcjaufprsbuw.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'WEBHOOK_SECRET_AQUI'
      ),
      body    := jsonb_build_object('record', row_to_json(NEW))
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Nota: substituir a URL pelo endereço real do projeto ao fazer o deploy em prod
-- Exemplo: ALTER FUNCTION public.notify_new_agendamento() ...
-- Ou ajustar a URL manualmente após rodar o schema no novo projeto.

DROP TRIGGER IF EXISTS on_agendamento_insert ON public.agendamentos;
CREATE TRIGGER on_agendamento_insert
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_agendamento();


-- =========================================================================
-- 7. STORAGE BUCKETS E POLICIES
-- =========================================================================

-- Bucket: avatares de usuários e logos de estúdio
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_access" ON storage.objects;
CREATE POLICY "avatars_public_access"
  ON storage.objects FOR ALL TO public
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Bucket: imagens dos serviços (portal da cliente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('servicos-imagens', 'servicos-imagens', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "servicos_imagens_public_access" ON storage.objects;
CREATE POLICY "servicos_imagens_public_access"
  ON storage.objects FOR ALL TO public
  USING (bucket_id = 'servicos-imagens')
  WITH CHECK (bucket_id = 'servicos-imagens');


-- =========================================================================
-- FIM DO SCRIPT
-- Após executar, acesse o painel do Supabase e configure:
--   • Authentication → URL Configuration → Site URL (URL do seu app)
--   • Authentication → Email Templates (opcional: personalizar emails)
--   • Project Settings → API → copie a URL e anon key para o .env do projeto
-- =========================================================================
