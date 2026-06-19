import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export default function Header({ setMobileOpen }: HeaderProps) {
  const location = useLocation();

  // Mapeamento de rotas para títulos da página
  const getPageInfo = (pathname: string): { title: string; subtitle?: string } => {
    switch (pathname) {
      case '/meu-estudio':
        return { title: 'Meu Estúdio' };
      case '/clientes':
        return { title: 'Clientes' };
      case '/servicos':
        return { title: 'Serviços' };
      case '/agendamentos':
        return { title: 'Agendamentos' };
      case '/meus-horarios':
        return { title: 'Meus Horários', subtitle: 'Gerencie seu expediente e bloqueios de agenda' };
      case '/configuracoes':
        return { title: 'Configurações' };
      default:
        if (pathname.startsWith('/clientes/')) return { title: 'Perfil do Cliente' };
        return { title: 'Studio' };
    }
  };

  const { title, subtitle } = getPageInfo(location.pathname);

  return (
    <header className="h-[60px] bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-30">
      <div className="flex items-center gap-3">
        {/* Acionador do menu Mobile */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-text-secondary hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

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
