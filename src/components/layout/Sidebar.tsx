import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Tag,
  Calendar,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Lock,
  CreditCard,
  BarChart2,
  Link2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSubscription } from '../../hooks/useSubscription';
import UpgradeModal from '../common/UpgradeModal';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const navigate = useNavigate();
  const { profile, user, signOut, estabelecimentoId } = useAuth();
  const [businessName, setBusinessName] = useState<string>('...');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const { hasFeature } = useSubscription();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (!estabelecimentoId) return;

    supabase
      .from('configuracao_negocio')
      .select('nome_negocio, logo_url')
      .eq('estabelecimento_id', estabelecimentoId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao carregar configuracoes da sidebar:', error);
          return;
        }
        if (data) {
          setBusinessName(data.nome_negocio || 'Studio');
          setLogoUrl(data.logo_url || null);
        }
      });
  }, [estabelecimentoId]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.nome_negocio !== undefined) setBusinessName(detail.nome_negocio);
        if (detail.logo_url !== undefined) setLogoUrl(detail.logo_url);
      }
    };
    window.addEventListener('business-config-updated', handleUpdate);
    return () => window.removeEventListener('business-config-updated', handleUpdate);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const userEmail = profile?.email || user?.email || '';
  const userName = profile?.nome || 'Usuário';
  const initials = userName
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const displayName = businessName && businessName !== '...'
    ? businessName
    : (profile?.nome || 'Lash Hub');

  // Persistence of sidebar state
  useEffect(() => {
    localStorage.setItem('rosae-sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  interface NavItem {
    name: string;
    path: string;
    icon: React.ComponentType<any>;
    feature?: 'scheduling' | 'crm' | 'dashboard';
  }

  const menuItems: NavItem[] = [
    { name: 'Meu Estúdio', path: '/meu-estudio', icon: LayoutGrid },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Serviços', path: '/servicos', icon: Tag },
    { name: 'Agendamentos', path: '/agendamentos', icon: Calendar, feature: 'scheduling' },
    { name: 'Meus Horários', path: '/meus-horarios', icon: Clock, feature: 'scheduling' },
    { name: 'Link de Agendamento', path: '/link-agendamento', icon: Link2 },
    { name: 'Relatórios', path: '/relatorios', icon: BarChart2 },
  ];

  const systemItems: NavItem[] = [
    { name: 'Minha Assinatura', path: '/assinatura', icon: CreditCard },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isLocked = item.feature === 'scheduling' && !hasFeature('scheduling');
      
      const handleClick = (e: React.MouseEvent) => {
        if (isLocked) {
          e.preventDefault();
          setIsUpgradeModalOpen(true);
        } else {
          setMobileOpen(false);
        }
      };

      return (
        <NavLink
          key={item.path}
          to={isLocked ? '#' : item.path}
          onClick={handleClick}
          className={({ isActive }) => `
            relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
            ${isLocked 
              ? 'text-text-muted hover:bg-rose-50/50 hover:text-rose-600/70 cursor-pointer' 
              : isActive 
                ? 'bg-rose-600 text-white font-medium' 
                : 'text-text-secondary hover:bg-rose-50 hover:text-rose-600'
            }
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? `${item.name} ${isLocked ? '(Premium)' : ''}` : undefined}
        >
          <div className="relative">
            <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105`} />
            {isLocked && collapsed && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full shadow-sm animate-pulse">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          {!collapsed && <span className="text-sm font-sans flex-1">{item.name}</span>}
          {isLocked && !collapsed && (
            <Lock className="w-3.5 h-3.5 text-text-muted group-hover:text-rose-600 transition-colors" />
          )}
        </NavLink>
      );
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 bg-white border-r border-border z-50 flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[64px]' : 'w-[220px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ paddingLeft: 'env(safe-area-inset-left)' }}
      >
        {/* Top Header / Logo */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className={`h-[60px] border-b border-border flex items-center px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-title font-semibold text-lg flex-shrink-0">
                  {initials}
                </div>
              )}
              {!collapsed && (
                <span className="font-title font-semibold text-xl text-text-primary tracking-wide whitespace-nowrap truncate max-w-[130px]" title={displayName}>
                  {displayName}
                </span>
              )}
            </div>

            {/* Desktop Collapse Button */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex absolute -right-3 top-[18px] w-6 h-6 rounded-full border border-border bg-white text-text-secondary hover:text-rose-600 items-center justify-center shadow-sm hover:scale-105 transition-all cursor-pointer z-50"
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* MENU SECTION */}
            <div className="space-y-1.5">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
                  Menu
                </p>
              )}
              <div className="space-y-1">
                {renderNavItems(menuItems)}
              </div>
            </div>

            {/* SYSTEM SECTION */}
            <div className="space-y-1.5">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
                  Sistema
                </p>
              )}
              <div className="space-y-1">
                {renderNavItems(systemItems)}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer: Logged in User Card */}
        <div className="p-3 border-t border-border bg-rose-50/30 flex flex-col gap-2">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={userName} 
                  className="w-9 h-9 rounded-full object-cover border border-rose-200 flex-shrink-0" 
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {initials}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{userName}</p>
                  <p className="text-[10px] text-text-secondary truncate">{userEmail}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleSignOut}
                title="Sair do sistema"
                className="p-1.5 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={handleSignOut}
              title="Sair do sistema"
              className="mx-auto p-1.5 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Upgrade Modal */}
      {isUpgradeModalOpen && (
        <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} />
      )}
    </>
  );
}
