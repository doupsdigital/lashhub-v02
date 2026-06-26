import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { applyPalette } from '../utils/theme';

interface PortalContextType {
  establishmentId: string | null;
  nomeNegocio: string | null;
  logoUrl: string | null;
  paletaCores: string | null;
  loading: boolean;
  slug: string | null;
  plano: string | null;
  nomeProfissional: string | null;
  descricao: string | null;
  instagram: string | null;
  endereco: string | null;
  telefoneProfissional: string | null;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [paletaCores, setPaletaCores] = useState<string | null>(null);
  const [plano, setPlano] = useState<string | null>(null);
  const [nomeProfissional, setNomeProfissional] = useState<string | null>(null);
  const [descricao, setDescricao] = useState<string | null>(null);
  const [instagram, setInstagram] = useState<string | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [telefoneProfissional, setTelefoneProfissional] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function loadPortalData() {
      setLoading(true);
      try {
        // 1. Buscar estabelecimento pelo slug
        const { data: est, error: estError } = await supabase
          .from('estabelecimentos')
          .select('id, nome_negocio, plano')
          .eq('slug', slug)
          .maybeSingle();

        if (estError || !est) {
          console.error('Estabelecimento não encontrado para o slug:', slug);
          navigate('/login', { replace: true });
          return;
        }

        setEstablishmentId(est.id);
        setNomeNegocio(est.nome_negocio);
        setPlano(est.plano || 'basico');

        // 2. Buscar configurações do estabelecimento
        const { data: config, error: configError } = await supabase
          .from('configuracao_negocio')
          .select('logo_url, paleta_cores, modo_escuro, descricao, instagram, endereco')
          .eq('estabelecimento_id', est.id)
          .maybeSingle();

        if (!configError && config) {
          setLogoUrl(config.logo_url);
          setPaletaCores(config.paleta_cores || 'rosa_rose');
          setDescricao(config.descricao || null);
          setInstagram(config.instagram || null);
          setEndereco(config.endereco || null);
          applyPalette(config.paleta_cores || 'rosa_rose', config.modo_escuro || false);
        } else {
          setLogoUrl(null);
          setPaletaCores('rosa_rose');
          applyPalette('rosa_rose', false);
        }

        // 3. Buscar nome e telefone da profissional via RPC (contorna RLS para anon)
        const { data: profRows, error: profError } = await supabase
          .rpc('get_portal_profissional_info', { p_estabelecimento_id: est.id });

        const profData = profRows?.[0] ?? null;

        if (!profError && profData) {
          setNomeProfissional(profData.nome);
          setTelefoneProfissional(profData.telefone || null);
        } else {
          setNomeProfissional(null);
          setTelefoneProfissional(null);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do portal:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [slug, navigate]);

  return (
    <PortalContext.Provider
      value={{
        establishmentId,
        nomeNegocio,
        logoUrl,
        paletaCores,
        loading,
        slug: slug || null,
        plano,
        nomeProfissional,
        descricao,
        instagram,
        endereco,
        telefoneProfissional,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal deve ser usado dentro de um PortalProvider');
  }
  return context;
}
