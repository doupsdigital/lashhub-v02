import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProfissionalRoute from './components/common/ProfissionalRoute';
import ClienteRoute from './components/common/ClienteRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import PerfilCliente from './pages/PerfilCliente';
import Servicos from './pages/Servicos';
import Agendamentos from './pages/Agendamentos';
import Configuracoes from './pages/Configuracoes';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      <p className="text-text-secondary mt-2">Em breve...</p>
    </div>
  );
}

function PortalLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Placeholder title="Cadastro de Cliente" />} />

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
            <Route path="meus-horarios" element={<Placeholder title="Meus Horários" />} />
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
            <Route path="catalogo" element={<Placeholder title="Catálogo de Serviços" />} />
            <Route path="agendar" element={<Placeholder title="Agendar Serviço" />} />
            <Route path="meus-agendamentos" element={<Placeholder title="Meus Agendamentos" />} />
            <Route path="perfil" element={<Placeholder title="Meu Perfil" />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
