import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Share2,
  AlertCircle,
} from 'lucide-react';

export default function LinkAgendamento() {
  const { estabelecimentoId, estabelecimentoSlug, refreshProfile, profile } = useAuth();
  const { autoStart } = useOnboarding('link_agendamento');
  useEffect(() => { if (profile) autoStart(); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const [slugEdit, setSlugEdit] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugCopied, setSlugCopied] = useState(false);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({ isOpen: false, title: '', description: '' });

  useEffect(() => {
    if (estabelecimentoSlug) setSlugEdit(estabelecimentoSlug);
  }, [estabelecimentoSlug]);

  const handleCopyLink = async () => {
    if (!estabelecimentoSlug) return;
    const portalUrl = `${window.location.origin}/portal/${estabelecimentoSlug}`;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = portalUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2500);
    }
  };

  const handleSaveSlug = async () => {
    if (!estabelecimentoId) return;
    const cleanSlug = slugEdit.trim().toLowerCase();

    if (!cleanSlug) {
      setSlugError('O link não pode ficar em branco.');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(cleanSlug) && cleanSlug.length > 1) {
      setSlugError('Use apenas letras minúsculas, números e hífens. Não pode começar ou terminar com hífen.');
      return;
    }
    if (cleanSlug.length < 3) {
      setSlugError('O link deve ter pelo menos 3 caracteres.');
      return;
    }

    setSavingSlug(true);
    setSlugError(null);

    try {
      if (cleanSlug !== estabelecimentoSlug) {
        const { data: existing } = await supabase
          .from('estabelecimentos')
          .select('id')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (existing) {
          setSlugError('Este link já está em uso. Tente outro nome.');
          setSavingSlug(false);
          return;
        }
      }

      const { error } = await supabase
        .from('estabelecimentos')
        .update({ slug: cleanSlug })
        .eq('id', estabelecimentoId);

      if (error) throw error;

      await refreshProfile();
      setSuccessModal({
        isOpen: true,
        title: 'Link atualizado!',
        description: `Seu link de agendamento agora é: ${window.location.origin}/portal/${cleanSlug}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar o link.';
      setSlugError(msg);
    } finally {
      setSavingSlug(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-title font-bold text-2xl text-text-primary flex items-center gap-2">
          <Link2 className="w-6 h-6 text-rose-600" />
          Link de Agendamento
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Compartilhe este link com suas clientes para que elas possam ver seus serviços e agendar horários.
        </p>
      </div>

      <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm space-y-5">
        <p className="text-xs text-text-secondary">
          Este é o link único do seu portal. Suas clientes acessam para ver seus serviços e agendar. Coloque na bio do Instagram ou compartilhe no WhatsApp.
        </p>

        {/* Link atual */}
        <div id="ob-link-display" className="flex items-center gap-0 p-3 bg-bg rounded-xl border border-border overflow-hidden">
          <span className="text-xs text-text-muted flex-shrink-0 hidden sm:block">
            {window.location.origin}/portal/
          </span>
          <span className="text-xs font-bold text-primary truncate">
            {estabelecimentoSlug || '...'}
          </span>
        </div>

        {/* Botões de ação */}
        <div id="ob-link-acoes" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!estabelecimentoSlug}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-300 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            {slugCopied ? (
              <><Check className="w-4 h-4" /> Link copiado!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copiar link</>
            )}
          </button>

          <a
            href={estabelecimentoSlug ? `/portal/${estabelecimentoSlug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-bg hover:bg-border text-text-primary border border-border rounded-lg text-xs font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver portal
          </a>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Você pode agendar um horário comigo aqui: ${window.location.origin}/portal/${estabelecimentoSlug || ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar no WhatsApp
          </a>
        </div>

        {/* Personalizar slug */}
        <div id="ob-link-personalizar" className="border-t border-border pt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-1">
            Personalizar link
          </label>
          <p className="text-[10px] text-text-secondary mb-3">
            Use apenas letras minúsculas, números e hífens. Ex: <strong>studio-da-ju</strong>, <strong>lashes-by-ana</strong>
          </p>

          <div className="flex items-center rounded-lg border border-border bg-bg overflow-hidden focus-within:ring-1 focus-within:ring-rose-400">
            <span className="text-xs text-text-muted px-3 py-2 bg-bg border-r border-border flex-shrink-0 hidden sm:block whitespace-nowrap">
              /portal/
            </span>
            <input
              type="text"
              value={slugEdit}
              onChange={(e) => {
                setSlugError(null);
                setSlugEdit(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder="meu-studio"
              maxLength={60}
              className="flex-1 px-3 py-2 bg-transparent text-text-primary text-sm focus:outline-none"
            />
          </div>

          {slugError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-xs font-medium">{slugError}</p>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleSaveSlug}
              disabled={savingSlug || !slugEdit.trim() || slugEdit.trim() === estabelecimentoSlug}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {savingSlug ? 'Salvando...' : 'Salvar Link'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        onConfirm={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        description={successModal.description}
        type="success"
        confirmText="OK"
      />
    </div>
  );
}
