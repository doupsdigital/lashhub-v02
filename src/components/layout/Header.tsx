import { useLocation } from 'react-router-dom';
import {
  Menu,
  LayoutGrid,
  Users,
  Tag,
  Calendar,
  Clock,
  Settings,
  CreditCard,
  BarChart2,
} from 'lucide-react';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export default function Header({ setMobileOpen }: HeaderProps) {
  const location = useLocation();

  // Mapeamento de rotas para títulos + ícones (mesmos do Sidebar)
  const getPageInfo = (pathname: string): {
    title: string;
    subtitle?: string;
    Icon: React.ComponentType<{ className?: string }>;
  } => {
    switch (pathname) {
      case '/meu-estudio':
        return { title: 'Meu Estúdio', Icon: LayoutGrid };
      case '/clientes':
        return { title: 'Clientes', Icon: Users };
      case '/servicos':
        return { title: 'Serviços', Icon: Tag };
      case '/agendamentos':
        return { title: 'Agendamentos', Icon: Calendar };
      case '/meus-horarios':
        return {
          title: 'Meus Horários',
          subtitle: 'Gerencie seu expediente e bloqueios de agenda',
          Icon: Clock,
        };
      case '/configuracoes':
        return { title: 'Configurações', Icon: Settings };
      case '/assinatura':
        return { title: 'Minha Assinatura', Icon: CreditCard };
      case '/relatorios':
        return { title: 'Relatórios', Icon: BarChart2 };
      default:
        if (pathname.startsWith('/clientes/')) return { title: 'Perfil do Cliente', Icon: Users };
        return { title: 'Studio', Icon: LayoutGrid };
    }
  };

  const { title, subtitle, Icon } = getPageInfo(location.pathname);

  return (
    <header className="h-[60px] bg-white border-b border-border sticky top-0 z-[1]">

      {/* ── MOBILE ── */}
      <div className="flex md:hidden items-center justify-between px-4 h-full relative">
        {/* Ícone sanduíche — esquerda */}
        <button
          onClick={() => setMobileOpen(true)}
          className="text-text-secondary hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 cursor-pointer flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Título — absolutamente centralizado */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="font-title font-semibold text-2xl text-text-primary leading-tight">
            {title}
          </h1>
        </div>

        {/* Ícone da página — direita */}
        <div className="p-1.5 flex-shrink-0 text-text-secondary">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex items-center px-6 h-full">
        <div>
          <h1 className="font-title font-semibold text-2xl text-text-primary leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

    </header>
  );
}
