import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useOnboarding, type OnboardingPageKey } from '../../hooks/useOnboarding';
import { useAuth } from '../../contexts/AuthContext';
import { usePortal } from '../../contexts/PortalContext';

function getPortalPageKey(pathname: string, isLoggedIn: boolean): OnboardingPageKey | null {
  if (pathname.endsWith('/catalogo')) return isLoggedIn ? 'portal_catalogo' : 'portal_catalogo_anonimo';
  if (pathname.endsWith('/agendar') || pathname.includes('/agendar?')) return 'portal_agendar';
  if (pathname.endsWith('/meus-agendamentos')) return 'portal_agendamentos';
  if (pathname.endsWith('/perfil')) return 'portal_perfil';
  return null;
}

function HelpButtonInner({ pageKey, studioName, bannerVisible }: { pageKey: OnboardingPageKey; studioName?: string | null; bannerVisible?: boolean }) {
  const { startTour } = useOnboarding(pageKey, { studioName });
  return (
    <button
      onClick={startTour}
      title="Ajuda — ver tutorial desta tela"
      className="fixed right-4 z-50 flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-full shadow-md text-text-secondary hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition-all hover:shadow-lg cursor-pointer"
      style={{ bottom: window.matchMedia('(min-width: 768px)').matches
        ? '5rem'
        : bannerVisible
          ? 'calc(13rem + env(safe-area-inset-bottom, 0px))'
          : 'calc(9rem + env(safe-area-inset-bottom, 0px))'
      }}
    >
      <HelpCircle className="w-4 h-4" />
      <span>Ajuda</span>
    </button>
  );
}

export default function PortalFloatingHelpButton({ bannerVisible }: { bannerVisible?: boolean }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { nomeNegocio } = usePortal();
  const pageKey = getPortalPageKey(pathname, !!user);
  if (!pageKey) return null;
  return <HelpButtonInner pageKey={pageKey} studioName={nomeNegocio} bannerVisible={bannerVisible} />;
}
