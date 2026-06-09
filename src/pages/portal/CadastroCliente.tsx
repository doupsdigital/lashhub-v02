import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
}

export default function CadastroCliente() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('Studio');
  const [form, setForm] = useState({
    nome: '',
    sobrenome: '',
    whatsapp: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from('configuracao_negocio')
      .select('nome_negocio')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.nome_negocio) setBusinessName(data.nome_negocio);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'whatsapp') {
      setForm((prev) => ({ ...prev, whatsapp: applyPhoneMask(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = (): string | null => {
    if (!form.nome || !form.sobrenome || !form.whatsapp || !form.email || !form.senha || !form.confirmarSenha) {
      return 'Preencha todos os campos obrigatórios.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Informe um e-mail válido.';
    if (form.senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (form.senha !== form.confirmarSenha) return 'As senhas não coincidem.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Passo 1 — Criar usuário no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.senha,
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          throw new Error('Este e-mail já está cadastrado.');
        }
        if (msg.includes('rate limit') || authError.status === 429) {
          throw new Error('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.');
        }
        console.error('[cadastro] auth error:', authError.message);
        throw new Error('Ocorreu um erro ao criar sua conta. Tente novamente.');
      }

      if (!data.user) throw new Error('Ocorreu um erro ao criar sua conta. Tente novamente.');

      // Passos 2 e 3 via RPC (SECURITY DEFINER) — imune ao RLS e à condição de corrida do AuthContext
      const { error: rpcError } = await supabase.rpc('cadastrar_cliente_portal', {
        p_user_id:   data.user.id,
        p_nome:      form.nome.trim(),
        p_sobrenome: form.sobrenome.trim(),
        p_email:     form.email.trim().toLowerCase(),
        p_whatsapp:  form.whatsapp,
      });

      if (rpcError) {
        console.error('[cadastro] rpc error:', rpcError.message, rpcError.details);
        if (rpcError.message.includes('already registered')) {
          throw new Error('Este e-mail já está cadastrado.');
        }
        throw new Error('Ocorreu um erro ao criar sua conta. Tente novamente.');
      }

      // Faz login automático — neste ponto usuarios já existe, AuthContext não vai encerrar a sessão
      await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.senha,
      });

      setSuccess(true);
      setTimeout(() => navigate('/portal', { replace: true }), 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocorreu um erro ao criar sua conta. Tente novamente.');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-border rounded-xl bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[460px] bg-white border border-border rounded-[20px] shadow-xl p-8 md:p-10 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-title font-semibold text-3xl shadow-md mb-4 hover:scale-105 transition-transform duration-300">
            {businessName[0]?.toUpperCase() || 'S'}
          </div>
          <h2 className="font-title font-bold text-3xl text-text-primary tracking-wide">
            {businessName}
          </h2>
          <p className="text-xs text-text-secondary mt-1 uppercase tracking-widest font-medium">
            Criar sua conta
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">Cadastro realizado com sucesso! Bem-vinda 🎉</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Nome
              </label>
              <input
                name="nome"
                type="text"
                required
                autoComplete="given-name"
                placeholder="Maria"
                value={form.nome}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Sobrenome
              </label>
              <input
                name="sobrenome"
                type="text"
                required
                autoComplete="family-name"
                placeholder="Silva"
                value={form.sobrenome}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              WhatsApp
            </label>
            <input
              name="whatsapp"
              type="tel"
              required
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={form.whatsapp}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              Senha
            </label>
            <div className="relative">
              <input
                name="senha"
                type={showSenha ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={handleChange}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-rose-600 cursor-pointer"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                name="confirmarSenha"
                type={showConfirmar ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={form.confirmarSenha}
                onChange={handleChange}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-rose-600 cursor-pointer"
              >
                {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || success}
            className="w-full py-3 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-300 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-text-secondary mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-rose-600 font-semibold hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
