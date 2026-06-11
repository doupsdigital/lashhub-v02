import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { applyPalette } from './utils/theme';
import ProfissionalRoute from './components/common/ProfissionalRoute';
import ClienteRoute from './components/common/ClienteRoute';
import Layout from './components/layout/Layout';
import PortalLayout from './components/layout/PortalLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import PerfilCliente from './pages/PerfilCliente';
import Servicos from './pages/Servicos';
import Agendamentos from './pages/Agendamentos';
import Configuracoes from './pages/Configuracoes';
import MeusHorarios from './pages/MeusHorarios';
import CadastroCliente from './pages/portal/CadastroCliente';
import PortalCatalogo from './pages/portal/PortalCatalogo';
import PortalAgendar from './pages/portal/PortalAgendar';
import PortalMeusAgendamentos from './pages/portal/PortalMeusAgendamentos';
import PortalPerfil from './pages/portal/PortalPerfil';

export default function App() {
  useEffect(() => {
    // 1. Aplica o tema salvo localmente de forma imediata (carregamento rápido)
    const cachedPalette = localStorage.getItem('app_theme_palette') || 'rosa_rose';
    const cachedDarkMode = localStorage.getItem('app_theme_dark_mode') === 'true';
    applyPalette(cachedPalette, cachedDarkMode);

    // 2. Consulta o banco para manter o tema atualizado
    async function fetchTheme() {
      try {
        const { data, error } = await supabase
          .from('configuracao_negocio')
          .select('paleta_cores')
          .maybeSingle();
        
        if (!error && data) {
          const dbPalette = data.paleta_cores || 'rosa_rose';
          const cachedDarkMode = localStorage.getItem('app_theme_dark_mode') === 'true';
          applyPalette(dbPalette, cachedDarkMode);
        }
      } catch (err) {
        console.error('Erro ao sincronizar tema:', err);
      }
    }
    fetchTheme();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<CadastroCliente />} />

          {/* Rotas da profissional */}
          <Route
            path="/"
            element={
              <ProfissionalRoute>
                <Layout />
              </ProfissionalRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<PerfilCliente />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="agendamentos" element={<Agendamentos />} />
            <Route path="meus-horarios" element={<MeusHorarios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Portal da cliente */}
          <Route
            path="/portal"
            element={
              <ClienteRoute>
                <PortalLayout />
              </ClienteRoute>
            }
          >
            <Route index element={<Navigate to="catalogo" replace />} />
            <Route path="catalogo" element={<PortalCatalogo />} />
            <Route path="agendar" element={<PortalAgendar />} />
            <Route path="meus-agendamentos" element={<PortalMeusAgendamentos />} />
            <Route path="perfil" element={<PortalPerfil />} />

          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
