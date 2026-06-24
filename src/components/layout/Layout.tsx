import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TabBar from './TabBar';
import TrialBanner from '../common/TrialBanner';
import FloatingHelpButton from '../common/FloatingHelpButton';
import { Sparkles } from 'lucide-react';

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

const iosRepaint = () => {
  requestAnimationFrame(() => {
    window.scrollTo(0, 1);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  });
};

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('rosae-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [welcomeToast, setWelcomeToast] = useState<string | null>(() => {
    const state = location.state as { welcomePlano?: string } | null;
    if (!state?.welcomePlano) return null;
    return state.welcomePlano === 'premium'
      ? 'Plano Premium ativo! Configure seus horários e comece a receber agendamentos.'
      : 'Plano Básico ativo! Seus clientes e serviços estão prontos para uso.';
  });

  // Auto-dismiss do toast de boas-vindas após 5 segundos
  useEffect(() => {
    if (!welcomeToast) return;
    const t = setTimeout(() => setWelcomeToast(null), 5000);
    return () => clearTimeout(t);
  }, [welcomeToast]);

  // iOS: força repaint após montagem do layout para corrigir
  // o padding-top que não é renderizado na primeira pintura visual.
  useEffect(() => {
    if (!isIOS) return;
    const timer = setTimeout(iosRepaint, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="min-h-screen bg-bg flex font-sans"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
          ${collapsed ? 'md:pl-[64px]' : 'md:pl-[220px]'}
        `}
      >
        <Header setMobileOpen={setMobileOpen} />
        <TrialBanner />

        {/* Toast de boas-vindas após ativação do plano */}
        {welcomeToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
            <div className="bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 max-w-sm">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-medium leading-snug">{welcomeToast}</p>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 pb-[76px] md:pb-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* TabBar — mobile only */}
      <TabBar onMoreClick={() => setMobileOpen(true)} />

      {/* Botão de ajuda flutuante */}
      <FloatingHelpButton />
    </div>
  );
}
