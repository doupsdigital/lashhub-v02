# Etapa 3: Portal de Agendamento Dinâmico (Multitenancy via Slug)

Esta etapa detalha como fazer o portal público de agendamento carregar dados, paletas de cores, serviços e configurações do estúdio específico com base no subcaminho da URL (ex: `/portal/brunalash`).

---

## 1. Rotas Dinâmicas no Frontend (`src/App.tsx`)

As rotas do portal do cliente serão ajustadas no roteador para exigir o parâmetro `:slug` correspondente ao estabelecimento.

### Alteração nas Rotas
```tsx
// Modificar de:
<Route path="/portal" element={<PortalLayout />}>
  <Route index element={<PortalHome />} />
  <Route path="agendar" element={<Agendamento />} />
  <Route path="perfil" element={<PortalPerfil />} />
</Route>

// Para:
<Route path="/portal/:slug" element={<PortalLayout />}>
  <Route index element={<PortalHome />} />
  <Route path="agendar" element={<Agendamento />} />
  <Route path="perfil" element={<PortalPerfil />} />
  <Route path="login" element={<PortalLogin />} />
  <Route path="cadastro" element={<PortalCadastro />} />
</Route>
```

---

## 2. Contexto do Portal (`src/contexts/PortalContext.tsx`)

Criaremos um novo contexto de React para buscar as configurações e a identidade visual do estabelecimento ativo e distribuí-las para todas as páginas filhas do portal.

### Estrutura do `PortalContext`
O contexto fará o seguinte fluxo ao ser montado:
1. Ler o parâmetro `slug` da URL via `useParams()`.
2. Fazer uma requisição ao Supabase buscando o estabelecimento com aquele slug:
   ```typescript
   const { data: est, error } = await supabase
     .from('estabelecimentos')
     .select('id, nome_negocio, plano, status_assinatura')
     .eq('slug', slug)
     .single();
   ```
3. Se encontrado, buscar as configurações visuais do estúdio na tabela `configuracao_negocio`:
   ```typescript
   const { data: config } = await supabase
     .from('configuracao_negocio')
     .select('*')
     .eq('estabelecimento_id', est.id)
     .single();
   ```
4. Disponibilizar os dados: `establishmentId`, `nomeNegocio`, `configuracao` (cores, logo, políticas) e estado de `loading`.
5. Se o slug não existir, redirecionar o cliente para uma tela genérica de "Estabelecimento não encontrado".

---

## 3. Adaptação Dinâmica do Design e Cores

O `PortalLayout` lerá a paleta de cores retornada do `PortalContext` e aplicará dinamicamente uma classe CSS ou variáveis customizadas ao container principal.

### Exemplo de Aplicação
```tsx
const { configuracao } = usePortal(); // rosa_rose, azul_sereno, ouro_velho, etc.

return (
  <div className={`theme-${configuracao.paleta_cores} min-h-screen bg-bg`}>
    <PortalHeader logoUrl={configuracao.logo_url} nomeNegocio={nomeNegocio} />
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Outlet />
    </main>
  </div>
);
```

---

## 4. Filtro por Estabelecimento nas Consultas do Portal

Em todas as páginas que o cliente final interage, as queries ao Supabase precisam ser filtradas pelo `estabelecimentoId` obtido através do `PortalContext`:

### Exemplos de Ajustes de Query:
- **Carregamento de Serviços** (`PortalHome.tsx`):
  ```typescript
  const { data } = await supabase
    .from('servicos')
    .select('*, categorias_servico(*)')
    .eq('estabelecimento_id', establishmentId)
    .eq('ativo', true);
  ```
- **Carregamento de Horários e Expediente** (`Agendamento.tsx`):
  ```typescript
  const { data } = await supabase
    .from('horarios_atendimento')
    .select('*')
    .eq('estabelecimento_id', establishmentId);
  ```
- **Inserção de Novo Agendamento**:
  ```typescript
  const { data, error } = await supabase
    .from('agendamentos')
    .insert({
      cliente_id: userClienteId,
      estabelecimento_id: establishmentId, // Inserção explícita no SaaS
      data_hora: dataHoraSelecionada,
      duracao_minutos: duracaoTotal,
      status: 'pendente',
      origem: 'portal'
    });
  ```

---

## 5. Plano de Testes

1. **Acessar URL do Estabelecimento Demo**: Abrir o navegador em `http://localhost:5173/portal/brunalash`.
   - Validar se o título "Bruna Lash" é carregado e se os serviços mockados aparecem.
2. **Acessar URL de um Estabelecimento Novo**: Abrir a URL com o slug do estabelecimento criado no teste da Etapa 2 (ex: `http://localhost:5173/portal/studio-bella`).
   - Validar se os dados da Bruna Lash **não** aparecem (isolamento de catálogo) e se o sistema exibe corretamente as configurações limpas da Bella.
3. **Simular Agendamento**: Fazer um agendamento no estúdio novo e verificar no banco de dados se a linha na tabela `agendamentos` foi inserida com o `estabelecimento_id` correto da profissional correspondente.
