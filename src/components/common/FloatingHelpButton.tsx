import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useOnboarding, type OnboardingPageKey } from '../../hooks/useOnboarding';

function getPageKey(pathname: string): OnboardingPageKey | null {
  if (pathname === '/meu-estudio') return 'meu_estudio';
  if (pathname.startsWith('/agendamentos')) return 'agendamentos';
  if (pathname.startsWith('/clientes')) return 'clientes';
  if (pathname.startsWith('/servicos')) return 'servicos';
  if (pathname === '/meus-horarios') return 'meus_horarios';
  if (pathname === '/relatorios') return 'relatorios';
  if (pathname === '/link-agendamento') return 'link_agendamento';
  if (pathname === '/configuracoes') return 'configuracoes';
  return null;
}

function HelpButtonInner({ pageKey }: { pageKey: OnboardingPageKey }) {
  const { startTour } = useOnboarding(pageKey);
  return (
    <button
      onClick={startTour}
      title="Ajuda — ver tutorial desta tela"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-full shadow-md text-text-secondary hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition-all hover:shadow-lg cursor-pointer"
    >
      <HelpCircle className="w-4 h-4" />
      <span>Ajuda</span>
    </button>
  );
}

export default function FloatingHelpButton() {
  const { pathname } = useLocation();
  const pageKey = getPageKey(pathname);
  if (!pageKey) return null;
  return <HelpButtonInner pageKey={pageKey} />;
}
