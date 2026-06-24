import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Usuario } from '../types';
import { setCurrentUsuarioNome } from '../utils/log';

interface AuthContextType {
  user: User | null;
  profile: Usuario | null;
  role: 'profissional' | 'cliente' | null;
  isProfissional: boolean;
  isCliente: boolean;
  clienteId: string | null;
  estabelecimentoId: string | null;
  plano: string | null;
  statusAssinatura: string | null;
  estabelecimentoSlug: string | null;
  trialEndsAt: string | null;
  loading: boolean;
  isPaginaVista: (key: string) => boolean;
  markPageSeen: (key: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Usuario | null>(null);
  const profileRef = useRef<Usuario | null>(null);

  const setProfile = (val: Usuario | null) => {
    profileRef.current = val;
    setProfileState(val);
  };

  const [estabelecimentoId, setEstabelecimentoId] = useState<string | null>(null);
  const [plano, setPlano] = useState<string | null>(null);
  const [statusAssinatura, setStatusAssinatura] = useState<string | null>(null);
  const [estabelecimentoSlug, setEstabelecimentoSlug] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setEstabelecimentoId(null);
        setPlano(null);
        setEstabelecimentoSlug(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      if (!profileRef.current) {
        setLoading(true);
      }

      let data = null;
      let error = null;

      const fetchProfile = async () => {
        return await supabase
          .from('usuarios')
          .select('*, estabelecimentos(plano, status_assinatura, slug, trial_ends_at)')
          .eq('id', session.user.id)
          .maybeSingle();
      };

      let res = await fetchProfile();
      data = res.data;
      error = res.error;

      if (!data) {
        console.warn('[AuthContext] Profile not found on first attempt, retrying in 150ms...', error);
        await new Promise(resolve => setTimeout(resolve, 150));
        res = await fetchProfile();
        data = res.data;
        error = res.error;
      }

      const profileData = data as any;
      if (!profileData) {
        console.warn('[AuthContext] No profile found for', session.user.email, 'signing out. Error:', error);
        await supabase.auth.signOut();
        return;
      }

      setProfile(profileData);
      setCurrentUsuarioNome(profileData.nome ?? 'Usuário');
      setEstabelecimentoId(profileData.estabelecimento_id ?? null);
      setPlano(profileData.estabelecimentos?.plano ?? 'basico');
      setStatusAssinatura(profileData.estabelecimentos?.status_assinatura ?? 'trial');
      setEstabelecimentoSlug(profileData.estabelecimentos?.slug ?? null);
      setTrialEndsAt(profileData.estabelecimentos?.trial_ends_at ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('usuarios')
      .select('*, estabelecimentos(plano, status_assinatura, slug, trial_ends_at)')
      .eq('id', user.id)
      .maybeSingle();

    const profileData = data as any;
    if (profileData) {
      setProfile(profileData);
      setCurrentUsuarioNome(profileData.nome ?? 'Usuário');
      setEstabelecimentoId(profileData.estabelecimento_id ?? null);
      setPlano(profileData.estabelecimentos?.plano ?? 'basico');
      setStatusAssinatura(profileData.estabelecimentos?.status_assinatura ?? 'trial');
      setEstabelecimentoSlug(profileData.estabelecimentos?.slug ?? null);
      setTrialEndsAt(profileData.estabelecimentos?.trial_ends_at ?? null);
    }
  };

  const markPageSeen = async (key: string) => {
    if (!user) return;
    const current = profileRef.current?.onboarding_paginas_vistas ?? [];
    if (current.includes(key)) return;
    const updated = [...current, key];
    await supabase
      .from('usuarios')
      .update({ onboarding_paginas_vistas: updated })
      .eq('id', user.id);
    // Atualiza o profile local sem roundtrip ao banco
    if (profileRef.current) {
      setProfile({ ...profileRef.current, onboarding_paginas_vistas: updated });
    }
  };

  const isPaginaVista = (key: string): boolean => {
    return (profile?.onboarding_paginas_vistas ?? []).includes(key);
  };

  const role: 'profissional' | 'cliente' | null = profile?.role ?? null;
  const isProfissional = role === 'profissional';
  const isCliente = role === 'cliente';
  const clienteId = profile?.cliente_id ?? null;

  return (
    <AuthContext.Provider value={{
      user, profile, role, isProfissional, isCliente, clienteId,
      estabelecimentoId, plano, statusAssinatura, estabelecimentoSlug,
      trialEndsAt, loading, isPaginaVista, markPageSeen,
      signIn, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
