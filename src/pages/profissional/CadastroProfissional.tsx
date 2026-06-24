import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Mail, Lock, User, Sparkles, Calendar, Link2, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function CadastroProfissional() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
  });
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
      setForm((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = (): string | null => {
    if (!form.nome || !form.email || !form.telefone || !form.senha || !form.confirmarSenha) {
      return 'Preencha todos os campos obrigatórios.';
    }
    const phoneDigits = form.telefone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return 'Informe um número de telefone/WhatsApp válido com DDD.';
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
      // Gerar o slug do negócio amigável para URL (a partir do nome pessoal da profissional)
      const slug = form.nome
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-')     // Sequências de caracteres inválidos → único hífen
        .replace(/^-+|-+$/g, '');        // Remove hífens nas bordas

      const phoneDigits = form.telefone.replace(/\D/g, '');

      // Criar usuário profissional no Supabase Auth com metadados
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.senha,
        options: {
          data: {
            nome_negocio: form.nome.trim(),
            slug: slug,
            role: 'profissional',
            telefone: phoneDigits
          }
        }
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          throw new Error('Este e-mail já está cadastrado.');
        }
        if (msg.includes('rate limit') || authError.status === 429) {
          throw new Error('Muitas tentativas em pouco tempo. Aguarde alguns minutos.');
        }
        throw authError;
      }

      if (!data.user) throw new Error('Erro ao criar conta.');

      // Login automático após cadastro
      await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.senha,
      });

      // Atualiza o telefone na tabela public.usuarios após login automático
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ telefone: phoneDigits })
        .eq('id', data.user.id);

      if (updateError) throw updateError;

      // Seed dos horários padrão (Seg–Sex, 09:00–18:00) para o novo estabelecimento
      const { data: userProfile } = await supabase
        .from('usuarios')
        .select('estabelecimento_id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (userProfile?.estabelecimento_id) {
        const defaultHorarios = [1, 2, 3, 4, 5].map(dia => ({
          estabelecimento_id: userProfile.estabelecimento_id,
          dia_semana: dia,
          hora_inicio: '09:00',
          hora_fim: '18:00',
        }));
        await supabase.from('horarios_atendimento').insert(defaultHorarios);
      }

      setSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocorreu um erro ao criar seu cadastro. Tente novamente.');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] bg-white border border-border rounded-[20px] shadow-xl p-8 md:p-10 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-lg mb-4 hover:scale-105 transition-transform duration-300 overflow-hidden">
            <img
              src="/logo-login.png"
              alt="Lash Hub"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-title font-bold text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400">
            Lash Hub
          </h1>
          
          <h2 className="font-title font-bold text-2xl text-text-primary mt-2.5">
            Comece grátis agora
          </h2>
          <p className="text-rose-600 font-semibold text-sm mt-0.5">
            14 dias sem compromisso
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* O modal de boas-vindas é renderizado fora do card abaixo */}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              Seu Nome
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                name="nome"
                type="text"
                required
                placeholder="Ex: Amanda Souza"
                value={form.nome}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>



          {/* Telefone / WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              Telefone / WhatsApp <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center px-3.5 border border-border rounded-xl bg-bg text-text-secondary text-sm font-medium select-none">
                +55
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  name="telefone"
                  type="text"
                  required
                  placeholder="Seu número de WhatsApp"
                  value={form.telefone}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                name="senha"
                type={showSenha ? 'text' : 'password'}
                required
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={handleChange}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowSenha(!showSenha)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-rose-600 cursor-pointer"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              Confirmar Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                name="confirmarSenha"
                type={showConfirmar ? 'text' : 'password'}
                required
                placeholder="Repita a senha"
                value={form.confirmarSenha}
                onChange={handleChange}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                tabIndex={-1}
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
            className="w-full py-3 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer mt-6"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Criar Conta Gratuitamente'
            )}
          </button>

          <div className="mt-4 flex flex-col items-center gap-1 text-[11px] text-text-secondary select-none">
            <span>✓ Sem cartão de crédito necessário</span>
            <span>✓ Cancele a qualquer momento</span>
          </div>
        </form>

        <p className="text-center text-xs text-text-secondary mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-rose-600 font-semibold hover:underline">
            Faça login
          </Link>
        </p>
      </div>

      {/* Modal de Boas-Vindas */}
      {success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center animate-slide-up">

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg mb-5 overflow-hidden">
              <img
                src="/logo-login.png"
                alt="Lash Hub"
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className="font-title font-bold text-2xl text-text-primary mb-1">
              Bem-vinda ao Lash Hub!
            </h2>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Seu espaço <span className="font-semibold text-rose-600">{form.nome}</span> foi criado com sucesso. Agora é só configurar e começar a receber agendamentos.
            </p>

            <div className="w-full space-y-3 mb-7 text-left">
              <div className="flex items-start gap-3 bg-rose-50/50 border border-rose-100 rounded-xl p-3.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Cadastre seus serviços</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Adicione os procedimentos, preços e durações que você oferece.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-rose-50/50 border border-rose-100 rounded-xl p-3.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Configure seus horários</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Defina os dias e horários em que você atende.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-rose-50/50 border border-rose-100 rounded-xl p-3.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Compartilhe seu link</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Envie o link do portal para suas clientes agendarem online.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/configuracoes', { replace: true })}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              Começar a configurar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

