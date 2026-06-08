import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import PerfilCliente from './pages/PerfilCliente';
import Servicos from './pages/Servicos';
import Profissionais from './pages/Profissionais';
import Agendamentos from './pages/Agendamentos';
import Usuarios from './pages/Usuarios';
import Logs from './pages/Logs';
import Configuracoes from './pages/Configuracoes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<PerfilCliente />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="profissionais" element={<Profissionais />} />
            <Route path="agendamentos" element={<Agendamentos />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
            <Route path="logs" element={<AdminRoute><Logs /></AdminRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

