import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/redefinir-senha`
      });

      if (error) throw error;

      setSuccessMsg('Instruções de redefinição enviadas! Verifique sua caixa de entrada.');
      setEmail('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao solicitar redefinição de senha.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12 relative overflow-hidden font-sans">
      {/* Background blurs matching Login.tsx */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] bg-white border border-border rounded-[20px] shadow-xl p-8 md:p-10 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-4">
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
          <h2 className="font-title font-semibold text-xl text-text-primary mt-5">
            Esqueci minha senha
          </h2>
          <p className="text-sm text-text-secondary mt-2 font-medium italic leading-relaxed max-w-[300px]">
            Digite seu e-mail para receber instruções de redefinição.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer mt-6"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Enviar e-mail de redefinição'
            )}
          </button>
        </form>

        <div className="flex justify-center mt-6">
          <Link to="/login" className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
