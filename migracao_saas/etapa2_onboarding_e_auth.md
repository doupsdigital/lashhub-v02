# Etapa 2: Onboarding de Profissional e Ajuste no AuthContext

Esta etapa descreve a implementação do cadastro de novas profissionais no SaaS, a criação automática da estrutura do seu estabelecimento e a atualização do contexto de autenticação no React para carregar os dados específicos do inquilino ativo.

---

## 1. Banco de Dados: Automatização do Cadastro via Trigger

Para garantir atomicidade e segurança no momento do cadastro de um usuário no Supabase Auth, utilizaremos um **Database Trigger** em `auth.users`. O fluxo interpretará os metadados do usuário enviado no cadastro do frontend.

### SQL para Criar o Trigger de Onboarding
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  new_est_id UUID;
  negocio_nome TEXT;
  negocio_slug TEXT;
  user_role TEXT;
  client_uuid UUID;
BEGIN
  -- Extrair dados dos metadados fornecidos no cadastro (options.data)
  negocio_nome := new.raw_user_meta_data ->> 'nome_negocio';
  negocio_slug := new.raw_user_meta_data ->> 'slug';
  user_role := COALESCE(new.raw_user_meta_data ->> 'role', 'profissional');

  IF user_role = 'profissional' AND negocio_nome IS NOT NULL THEN
    -- 1. Criar o estabelecimento para a profissional
    INSERT INTO public.estabelecimentos (nome_negocio, slug, plano, status_assinatura)
    VALUES (negocio_nome, COALESCE(negocio_slug, lower(regexp_replace(negocio_nome, '[^a-zA-Z0-9]', '', 'g'))), 'basico', 'trial')
    RETURNING id INTO new_est_id;

    -- 2. Vincular o usuário como profissional do estabelecimento recém-criado
    INSERT INTO public.usuarios (id, nome, email, role, estabelecimento_id)
    VALUES (new.id, negocio_nome, new.email, 'profissional', new_est_id);

    -- 3. Criar uma linha de configurações básicas padrão para este negócio
    INSERT INTO public.configuracao_negocio (estabelecimento_id, nome_negocio)
    VALUES (new_est_id, negocio_nome);

  ELSIF user_role = 'cliente' THEN
    -- Se for um cliente final cadastrando-se no portal
    client_uuid := (new.raw_user_meta_data ->> 'cliente_id')::UUID;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar a função ao evento de criação de novos usuários na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding();
```

---

## 2. Frontend: Tela de Cadastro (`src/pages/Cadastro.tsx`)

Na tela de cadastro de novos usuários administradores (profissionais), o formulário deverá coletar as seguintes informações:
1. Nome da Profissional
2. E-mail
3. Senha
4. Nome do Negócio (ex: "Studio Cílios de Ouro")

### Envio dos dados de Onboarding
No envio do formulário, o método de registro deve incluir o nome do negócio e um `slug` limpo nos metadados do Supabase Auth:
```typescript
const slug = nomeNegocio
  .toLowerCase()
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '') // Remove acentos
  .replace(/[^a-z0-9]/g, '-');     // Substitui espaços e símbolos por hifens

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nome_negocio: nomeNegocio,
      slug: slug,
      role: 'profissional'
    }
  }
});
```

---

## 3. Frontend: Ajustes no Contexto de Autenticação (`src/contexts/AuthContext.tsx`)

O `AuthContext` precisa ser expandido para disponibilizar o `estabelecimento_id` e o `plano` da profissional logada para toda a aplicação React.

### Modificações no `AuthContext`
1. **Adicionar propriedades ao `AuthContextType`**:
   ```typescript
   estabelecimentoId: string | null;
   plano: string | null;
   ```
2. **Atualizar o Estado de Carregamento**:
   No hook `useEffect` que observa o `onAuthStateChange`, assim que o perfil for recuperado da tabela `public.usuarios`, salvar o `estabelecimento_id` e o `plano` no estado:
   ```typescript
   const [estabelecimentoId, setEstabelecimentoId] = useState<string | null>(null);
   const [plano, setPlano] = useState<string | null>(null);

   // No fluxo de carregamento de perfil:
   const { data } = await supabase
     .from('usuarios')
     .select('*, estabelecimentos(plano)')
     .eq('id', session.user.id)
     .maybeSingle();

   if (data) {
     setProfile(data);
     setEstabelecimentoId(data.estabelecimento_id);
     setPlano(data.estabelecimentos?.plano ?? 'basico');
   }
   ```

---

## 4. Plano de Testes

1. **Cadastrar nova profissional**: Acessar `/cadastro`, preencher o formulário (ex: "Studio Bella", "bella@studio.com", "senha123").
2. **Validar Criação**: Consultar o banco via painel do Supabase para verificar se:
   - A tabela `estabelecimentos` possui uma linha para "Studio Bella" com o slug "studio-bella".
   - A tabela `usuarios` possui um usuário correspondente associado a esta empresa.
   - A tabela `configuracao_negocio` possui a linha padrão correspondente.
3. **Logar**: Acessar o sistema com a nova conta e verificar no console do navegador se o `estabelecimentoId` está correto e apenas dados vazios são renderizados (já que é uma profissional nova).
