import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, Tag, Menu } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import UpgradeModal from '../common/UpgradeModal';

interface TabBarProps {
  onMoreClick: () => void;
}

const tabs = [
  { label: 'Início', icon: Home, to: '/meu-estudio' },
  { label: 'Agenda', icon: Calendar, to: '/agendamentos' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
  { label: 'Serviços', icon: Tag, to: '/servicos' },
];

export default function TabBar({ onMoreClick }: TabBarProps) {
  const { hasFeature } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  return (
    <>
      <nav
        id="onboarding-tabbar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-[60px]">
          {tabs.map(({ label, icon: Icon, to }) => {
            const isLocked = to === '/agendamentos' && !hasFeature('scheduling');
            
            const handleClick = (e: React.MouseEvent) => {
              if (isLocked) {
                e.preventDefault();
                setIsUpgradeModalOpen(true);
              }
            };

            return (
              <NavLink
                key={to}
                to={isLocked ? '#' : to}
                onClick={handleClick}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors
                  ${isActive && !isLocked ? 'text-rose-600' : 'text-text-muted hover:text-text-secondary'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive && !isLocked ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Mais — abre sidebar */}
          <button
            onClick={onMoreClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 stroke-[1.75px]" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {/* Upgrade Modal */}
      {isUpgradeModalOpen && (
        <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} />
      )}
    </>
  );
}
