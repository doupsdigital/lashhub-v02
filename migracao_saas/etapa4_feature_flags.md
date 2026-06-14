# Etapa 4: Feature Flags e Controle de Recursos por Plano

Esta etapa detalha como implementar as limitações de recursos e regras de acesso no frontend (React) com base no plano contratado pelo estabelecimento (Básico vs. Premium).

---

## 1. Regras de Negócio e Recursos por Plano

| Recurso | Plano Básico | Plano Premium |
| :--- | :---: | :---: |
| **Cadastro de Clientes e Fichas** | Liberado | Liberado |
| **Catálogo de Serviços** | Liberado | Liberado |
| **Histórico Financeiro & Dashboard** | Liberado | Liberado |
| **Calendário Administrativo (Agenda)** | **Bloqueado** | Liberado |
| **Configuração de Expediente Comercial** | **Bloqueado** | Liberado |
| **Portal de Agendamento Online** | **Bloqueado** (Exibe contato direto) | Liberado |

---

## 2. Implementação do Hook de Permissões (`src/hooks/useSubscription.ts`)

Criaremos um hook utilitário que lê o plano e o status da assinatura diretamente do `AuthContext` e fornece helpers de validação.

```typescript
import { useAuth } from '../contexts/AuthContext';

export function useSubscription() {
  const { profile, plano, loading } = useAuth();

  const isPremium = plano === 'premium';
  const isBasico = plano === 'basico';

  const hasFeature = (feature: 'scheduling' | 'crm' | 'dashboard'): boolean => {
    if (loading || !profile) return false;
    
    switch (feature) {
      case 'crm':
      case 'dashboard':
        return true; // Ambos os planos têm acesso
      case 'scheduling':
        return isPremium; // Apenas plano Premium
      default:
        return false;
    }
  };

  const isSubscriptionActive = (): boolean => {
    if (!profile) return false;
    const status = profile.status_assinatura;
    return status === 'trial' || status === 'ativo';
  };

  return {
    hasFeature,
    isPremium,
    isBasico,
    isSubscriptionActive,
    plano,
    status: profile?.status_assinatura ?? null
  };
}
```

---

## 3. Bloqueio Visual e Comportamento na Sidebar (`Sidebar.tsx`)

Na barra lateral de navegação do painel administrativo, os links que levam a recursos exclusivos do plano Premium (ex: "Agenda", "Meus Horários") receberão um tratamento diferenciado.

### Abordagens de UX:
1. **Ocultar**: Simplesmente remover os itens da lista caso o plano seja Básico.
2. **Exibir com Cadeado (Recomendado - Mais Comercial)**:
   - Exibir os itens na barra lateral com um ícone de cadeado discreto.
   - Ao clicar, em vez de navegar para a rota, disparar a abertura de um **Modal de Upgrade** com uma chamada comercial: *"Acelere seu estúdio com o Agendamento Online! Faça o upgrade para o Plano Premium agora mesmo."*

---

## 4. Proteção de Rotas Administrativas (`PlanGuard.tsx`)

Para evitar que o usuário acesse as páginas Premium digitando a URL manualmente no navegador, criaremos um componente guardião no React Router.

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

export function PlanGuard({ requiredFeature }: { requiredFeature: 'scheduling' | 'crm' }) {
  const { hasFeature, loading } = useSubscription();

  if (loading) return <div>Carregando...</div>;

  if (!hasFeature(requiredFeature)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```
No arquivo `src/App.tsx`, envolvemos as rotas da agenda com este guardião.

---

## 5. Bloqueio no Portal do Cliente (Portal de Agendamento)

No portal do cliente (`PortalContext.tsx`), se o estabelecimento consultado tiver o `plano = 'basico'`, a interface se adaptará para ocultar os fluxos de agendamento automático.

### Comportamento do Portal Básico:
- Desabilitar ou ocultar o botão "Agendar Horário" na página inicial do portal.
- Exibir em destaque um banner do WhatsApp do estabelecimento: *"Agendamentos online não estão ativos para este estabelecimento. Clique no botão abaixo para agendar diretamente via WhatsApp."*

---

## 6. Plano de Testes

1. **Testar com a Profissional Premium (Bruna Lash)**:
   - Fazer login com `admin@lashly.com` / `admin123`.
   - Garantir que todas as opções da barra lateral (Agenda, Serviços, Clientes) estão liberadas.
   - Acessar `http://localhost:5173/portal/brunalash` e confirmar que o agendamento de horários funciona de ponta a ponta.
2. **Testar com Profissional no Plano Básico**:
   - Atualizar temporariamente o plano de um estúdio para `'basico'` no banco de dados.
   - Fazer login e validar se a sidebar oculta/bloqueia os links de Agenda e se a rota `/dashboard/agenda` redireciona o usuário para a home.
   - Acessar o portal do cliente deste estúdio básico e verificar se o banner de contato direto por WhatsApp é renderizado no lugar do botão de agendamento de horários.
