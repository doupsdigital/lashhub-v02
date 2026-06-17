import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { ShieldAlert, CreditCard, LogOut, ArrowRight, Sparkles } from 'lucide-react';

export default function BillingGuard() {
  const { isProfissional, signOut, loading: authLoading } = useAuth();
  const { isSubscriptionActive, status, loading: subLoading } = useSubscription();
  const location = useLocation();

  const loading = authLoading || subLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não for profissional (ex: cliente final no portal), não aplica este bloqueio
  if (!isProfissional) {
    return <Outlet />;
  }

  // Se a assinatura estiver ativa, libera o acesso normalmente
  if (isSubscriptionActive()) {
    return <Outlet />;
  }

  // Permite acesso direto à rota de faturamento para que a profissional possa assinar/regularizar
  if (location.pathname === '/assinatura' || location.pathname === '/configuracoes') {
    return <Outlet />;
  }

  // Determinar o conteúdo com base no status da assinatura
  let title = 'Acesso Administrativo Bloqueado';
  let message = 'Assinatura inativa. Entre em contato ou ative seu plano para acessar o sistema.';
  let iconColor = 'text-rose-500 bg-rose-50';
  let badgeText = 'Faturamento';

  if (status === 'trial') {
    badgeText = 'Trial Expirado';
    title = 'Seu período de testes grátis expirou';
    message = 'Seu período experimental de 14 dias chegou ao fim. Para continuar usando todos os recursos de agenda, prontuários de clientes e relatórios financeiros, escolha um plano premium.';
    iconColor = 'text-amber-500 bg-amber-50';
  } else if (status === 'suspenso') {
    badgeText = 'Assinatura Suspensa';
    title = 'Assinatura suspensa por falta de pagamento';
    message = 'Não conseguimos processar o pagamento de renovação da sua mensalidade no Asaas. Atualize suas informações de faturamento para liberar seu acesso imediatamente.';
    iconColor = 'text-red-500 bg-red-50';
  } else if (status === 'cancelado') {
    badgeText = 'Assinatura Cancelada';
    title = 'Sua assinatura foi cancelada';
    message = 'Sua conta administrativa foi desativada temporariamente. Reative sua assinatura premium para reestabelecer o funcionamento da sua agenda e dados dos clientes.';
    iconColor = 'text-gray-500 bg-gray-50';
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorações em degradê de fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[500px] bg-white border border-border rounded-[24px] shadow-2xl p-8 md:p-10 relative z-10 text-center animate-fade-in">
        
        {/* Ícone de Alerta */}
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-2xl ${iconColor} shadow-inner transition-transform duration-300 hover:scale-105`}>
            {status === 'trial' ? (
              <Sparkles className="w-10 h-10" />
            ) : (
              <ShieldAlert className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Badge do Status */}
        <span className="inline-block text-[10px] font-bold tracking-widest text-rose-600 uppercase px-3 py-1 bg-rose-50 border border-rose-100 rounded-full mb-4">
          {badgeText}
        </span>

        {/* Título Principal */}
        <h2 className="font-title font-bold text-2xl text-text-primary mb-3 leading-snug">
          {title}
        </h2>

        {/* Descrição Amigável */}
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">
          {message}
        </p>

        {/* Caixa de Benefícios em Destaque */}
        <div className="bg-rose-50/30 border border-rose-100/50 rounded-xl p-4 mb-8 text-left">
          <p className="text-xs font-semibold text-text-primary mb-2.5">O plano Premium inclui:</p>
          <ul className="space-y-2 text-xs text-text-secondary">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Portal de agendamento online personalizado
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Controle de agenda completo e histórico financeiro
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Prontuários e fichas de anamnese ilimitadas
            </li>
          </ul>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <Link
            to="/assinatura"
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-rose-100 hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Regularizar Financeiro</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 border border-border hover:bg-bg rounded-xl text-xs font-semibold text-text-secondary hover:text-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Minha Conta</span>
          </button>
        </div>

      </div>
    </div>
  );
}
