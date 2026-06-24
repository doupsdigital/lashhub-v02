import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useOnboarding, type OnboardingPageKey } from '../../hooks/useOnboarding';

function getPortalPageKey(pathname: string): OnboardingPageKey | null {
  if (pathname.endsWith('/catalogo')) return 'portal_catalogo';
  if (pathname.endsWith('/agendar') || pathname.includes('/agendar?')) return 'portal_agendar';
  if (pathname.endsWith('/meus-agendamentos')) return 'portal_agendamentos';
  if (pathname.endsWith('/perfil')) return 'portal_perfil';
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

export default function PortalFloatingHelpButton() {
  const { pathname } = useLocation();
  const pageKey = getPortalPageKey(pathname);
  if (!pageKey) return null;
  return <HelpButtonInner pageKey={pageKey} />;
}
