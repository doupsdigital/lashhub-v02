import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  X, 
  AlertCircle, 
  Sparkles, 
  UserPlus, 
  Users
} from 'lucide-react';
import type { Usuario } from '../types';
import { registrarLog } from '../utils/log';

export default function Usuarios() {
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
    setIsModalOpen(true);
  };

  const handleSaveUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim()) {
      showTemporaryError('Nome e E-mail são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      // Insert new user record
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          nome: nome.trim(),
          email: email.trim().toLowerCase()
        })
        .select()
        .single();

      if (error) {
        // Handle uniqueness violation in Supabase (23505)
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
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao cadastrar novo usuário.');
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
        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Usuário
        </button>
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
