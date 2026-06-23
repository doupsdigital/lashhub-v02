import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { applyPalette } from './utils/theme';
import ProfissionalRoute from './components/common/ProfissionalRoute';
import ClienteRoute from './components/common/ClienteRoute';
import Layout from './components/layout/Layout';
import PortalLayout from './components/layout/PortalLayout';
import Login from './pages/profissional/Login';
import Dashboard from './pages/profissional/Dashboard';
import Clientes from './pages/profissional/Clientes';
import PerfilCliente from './pages/profissional/PerfilCliente';
import Servicos from './pages/profissional/Servicos';
import Agendamentos from './pages/profissional/Agendamentos';
import Configuracoes from './pages/profissional/Configuracoes';
import MeusHorarios from './pages/profissional/MeusHorarios';
import CadastroProfissional from './pages/profissional/CadastroProfissional';
import PortalCatalogo from './pages/portal-clientes/PortalCatalogo';
import PortalAgendar from './pages/portal-clientes/PortalAgendar';
import PortalMeusAgendamentos from './pages/portal-clientes/PortalMeusAgendamentos';
import PortalPerfil from './pages/portal-clientes/PortalPerfil';
import CadastroCliente from './pages/portal-clientes/CadastroCliente';
import PortalLogin from './pages/portal-clientes/PortalLogin';
import { PortalProvider } from './contexts/PortalContext';
import RecuperarSenha from './pages/profissional/RecuperarSenha';
import RedefinirSenha from './pages/profissional/RedefinirSenha';

import PlanGuard from './components/common/PlanGuard';
import BillingGuard from './components/common/BillingGuard';
import Faturamento from './pages/profissional/Faturamento';
import Relatorios from './pages/profissional/Relatorios';
import InstallBanner from './components/common/InstallBanner';

export default function App() {
  useEffect(() => {
    // 1. Aplica o tema salvo localmente de forma imediata (carregamento rápido)
    const cachedPalette = localStorage.getItem('app_theme_palette') || 'rosa_rose';
    const cachedDarkMode = localStorage.getItem('app_theme_dark_mode') === 'true';
    applyPalette(cachedPalette, cachedDarkMode);

    // 2. Consulta o banco para manter o tema atualizado de forma isolada por tenant
    async function fetchTheme() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        // Buscar estabelecimento_id do usuário logado
        const { data: profile } = await supabase
          .from('usuarios')
          .select('estabelecimento_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.estabelecimento_id) {
          const { data, error } = await supabase
            .from('configuracao_negocio')
            .select('paleta_cores, modo_escuro')
            .eq('estabelecimento_id', profile.estabelecimento_id)
            .maybeSingle();
          
          if (!error && data) {
            const dbPalette = data.paleta_cores || 'rosa_rose';
            const dbDarkMode = data.modo_escuro ?? false;
            applyPalette(dbPalette, dbDarkMode);
            
            // Sincronizar cache local para a próxima inicialização rápida
            localStorage.setItem('app_theme_palette', dbPalette);
            localStorage.setItem('app_theme_dark_mode', String(dbDarkMode));
          }
        }
      } catch (err) {
        console.error('Erro ao sincronizar tema:', err);
      }
    }
    fetchTheme();
  }, []);

  return (
    <AuthProvider>
      <InstallBanner />
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<CadastroProfissional />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          {/* Rotas da profissional */}
          <Route
            path="/"
            element={
              <ProfissionalRoute>
                <Layout />
              </ProfissionalRoute>
            }
          >
            {/* Páginas acessíveis independente de faturamento */}
            <Route path="assinatura" element={<Faturamento />} />
            <Route path="configuracoes" element={<Configuracoes />} />

            {/* Proteção de Faturamento Ativo / Trial Válido */}
            <Route element={<BillingGuard />}>
              <Route path="meu-estudio" element={<Dashboard />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="clientes/:id" element={<PerfilCliente />} />
              <Route path="servicos" element={<Servicos />} />
              
              {/* Recursos Premium/Agendamento protegidos por plano */}
              <Route element={<PlanGuard requiredFeature="scheduling" />}>
                <Route path="agendamentos" element={<Agendamentos />} />
                <Route path="meus-horarios" element={<MeusHorarios />} />
              </Route>
            </Route>
          </Route>

          {/* Portal da cliente */}
          <Route
            path="/portal/:slug"
            element={
              <PortalProvider>
                <PortalLayout />
              </PortalProvider>
            }
          >
            <Route index element={<Navigate to="catalogo" replace />} />
            <Route path="catalogo" element={<PortalCatalogo />} />
            <Route path="login" element={<PortalLogin />} />
            <Route path="cadastro" element={<CadastroCliente />} />

            {/* Rotas protegidas do cliente */}
            <Route
              element={
                <ClienteRoute>
                  <Outlet />
                </ClienteRoute>
              }
            >
              <Route path="agendar" element={<PortalAgendar />} />
              <Route path="meus-agendamentos" element={<PortalMeusAgendamentos />} />
              <Route path="perfil" element={<PortalPerfil />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
