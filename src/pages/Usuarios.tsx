import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, 
  X, 
  AlertCircle, 
  Sparkles, 
  UserPlus, 
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Usuario } from '../types';
import { registrarLog } from '../utils/log';
import { useAuth } from '../contexts/AuthContext';

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('rosae@2025');
  const [showSenha, setShowSenha] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      showTemporaryError('Falha ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleOpenModal = () => {
    setNome('');
    setEmail('');
    setSenha('rosae@2025');
    setShowSenha(false);
    setIsModalOpen(true);
  };

  const handleSaveUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      showTemporaryError('Todos os campos são obrigatórios.');
      return;
    }

    if (senha.trim().length < 6) {
      showTemporaryError('A senha de acesso deve conter no mínimo 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      // 1. Criar o cliente temporário não-persistente do Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase ausente.');
      }

      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      // 2. Registrar o usuário no Supabase Auth com a senha definida
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha.trim()
      });

      if (authError) {
        if (authError.message.includes('already') || authError.status === 400) {
          showTemporaryError('Este e-mail já está cadastrado no sistema.');
          setSaving(false);
          return;
        }
        throw authError;
      }

      const authUser = authData?.user;
      if (!authUser) {
        throw new Error('Falha ao obter o usuário cadastrado no Supabase Auth.');
      }

      // 3. Inserir o perfil do usuário na tabela de banco de dados 'usuarios' usando o UUID gerado
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          id: authUser.id,
          nome: nome.trim(),
          email: email.trim().toLowerCase()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          showTemporaryError('Este endereço de e-mail já está cadastrado para outro usuário.');
          setSaving(false);
          return;
        }
        throw error;
      }

      if (!data) throw new Error('Falha ao obter dados do usuário cadastrado.');

      // Audit Log
      await registrarLog('criou', 'usuário', data.id, `Cadastrou o usuário "${nome.trim()}" com o e-mail "${email.trim().toLowerCase()}"`);

      setIsModalOpen(false);
      showTemporarySuccess('Usuário cadastrado com sucesso!');
      fetchUsuarios();
    } catch (err: any) {
      console.error('Erro no cadastro de usuário:', err);
      showTemporaryError(err.message || 'Falha ao cadastrar novo usuário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Errors/Success */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 flex-shrink-0 text-green-600" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-border rounded-[14px] p-5 shadow-sm">
        <div>
          <h2 className="font-title font-semibold text-2xl text-text-primary">Usuários</h2>
          <p className="text-xs text-text-secondary mt-0.5">Gerencie os usuários com acesso ao CRM da clínica.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Usuário
          </button>
        )}
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2"></div>
          <p className="text-sm">Carregando usuários...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white border border-border rounded-[14px] p-12 text-center text-text-secondary shadow-sm">
          <Users className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="font-title font-medium text-lg text-text-primary">Nenhum usuário cadastrado</p>
          <p className="text-sm text-text-muted mt-1">Cadastre o primeiro usuário de acesso ao sistema.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[14px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-50/10 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Data de Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuarios.map(user => {
                  const initials = user.nome.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
                  
                  return (
                    <tr key={user.id} className="hover:bg-bg/25 transition-colors">
                      {/* Avatar + Name */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-center font-title font-semibold text-sm">
                          {initials}
                        </div>
                        <span className="text-sm font-semibold text-text-primary">
                          {user.nome}
                        </span>
                      </td>
                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {user.email}
                      </td>
                      {/* Registration Date */}
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-rose-50/10">
              <h4 className="font-title font-semibold text-lg text-text-primary flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-600" />
                Cadastrar Novo Usuário
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-secondary hover:text-rose-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveUsuario} className="p-6 space-y-4">
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Ana Souza"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="ana@rosaeclinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                  Senha de Acesso <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showSenha ? 'text' : 'password'} 
                    required
                    placeholder="No mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-rose-600 cursor-pointer"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-text-secondary mt-1">
                  Valor padrão: <code className="bg-rose-50 px-1 py-0.5 rounded text-rose-700 font-mono font-semibold">rosae@2025</code>. Pode ser editada.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-bg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-300 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
