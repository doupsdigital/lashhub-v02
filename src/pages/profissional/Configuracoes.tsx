import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PALETTES_LIST, applyPalette } from '../../utils/theme';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  Camera,
  Trash2,
  Key,
  User,
  Mail,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  AtSign,
  MapPin,
  CalendarClock,
  MessageSquare,
  Timer,
  Palette,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Share2,
} from 'lucide-react';

export default function Configuracoes() {
  const { profile, user, refreshProfile, estabelecimentoId, estabelecimentoSlug } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Estados do Perfil
  const [nome, setNome] = useState(profile?.nome || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estados da Senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Estados do Negócio
  const [configuracaoId, setConfiguracaoId] = useState<string | null>(null);
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [descricaoNegocio, setDescricaoNegocio] = useState('');
  const [instagramNegocio, setInstagramNegocio] = useState('');
  const [enderecoNegocio, setEnderecoNegocio] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [aprovacaoAutomatica, setAprovacaoAutomatica] = useState(false);
  const [antecedenciaHoras, setAntecedenciaHoras] = useState<number | ''>(24);
  const [mensagemPosAgendamento, setMensagemPosAgendamento] = useState('');
  const [paletaCores, setPaletaCores] = useState('rosa_rose');
  const [modoEscuro, setModoEscuro] = useState(false);
  const [loadingNegocio, setLoadingNegocio] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Estados de Salvamento Separados
  const [savingDados, setSavingDados] = useState(false);
  const [dadosSuccess, setDadosSuccess] = useState<string | null>(null);
  const [dadosError, setDadosError] = useState<string | null>(null);

  const [savingVisual, setSavingVisual] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);

  const [savingAgendamento, setSavingAgendamento] = useState(false);
  const [agendamentoError, setAgendamentoError] = useState<string | null>(null);

  // Estados do Link de Agendamento
  const [slugEdit, setSlugEdit] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugCopied, setSlugCopied] = useState(false);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const userName = profile?.nome || 'Usuário';
  const userEmail = profile?.email || user?.email || '';
  const initials = userName
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .substring(0, 2)
    .toUpperCase();

  useEffect(() => {
    async function loadNegocio() {
      if (!estabelecimentoId) return;
      setLoadingNegocio(true);
      const { data, error } = await supabase
        .from('configuracao_negocio')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .maybeSingle();

      if (!error && data) {
        setConfiguracaoId(data.id);
        setNomeNegocio(data.nome_negocio || '');
        setDescricaoNegocio(data.descricao || '');
        setInstagramNegocio(data.instagram || '');
        setEnderecoNegocio(data.endereco || '');
        setLogoUrl(data.logo_url || null);
        setAprovacaoAutomatica(data.aprovacao_automatica ?? false);
        setAntecedenciaHoras(data.antecedencia_cancelamento_horas ?? 24);
        setMensagemPosAgendamento(data.mensagem_pos_agendamento || '');
        setPaletaCores(data.paleta_cores || 'rosa_rose');
        setModoEscuro(data.modo_escuro ?? false);
      }
      
      setLoadingNegocio(false);
    }
    loadNegocio();
  }, [estabelecimentoId]);

  // Inicializar slug editável quando o slug do contexto carregar
  useEffect(() => {
    if (estabelecimentoSlug) {
      setSlugEdit(estabelecimentoSlug);
    }
  }, [estabelecimentoSlug]);

  // 1. Atualizar informações de perfil (Nome)
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!nome.trim()) {
      setProfileError('O nome completo não pode ficar em branco.');
      return;
    }

    setLoadingProfile(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nome: nome.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      setSuccessModal({
        isOpen: true,
        title: 'Perfil atualizado!',
        description: 'Os dados do seu perfil foram salvos com sucesso.',
      });
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar o perfil.';
      setProfileError(msg);
    } finally {
      setLoadingProfile(false);
    }
  };

  // 2. Fazer Upload do Avatar para Supabase Storage
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setProfileError(null);
    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccessModal({
        isOpen: true,
        title: 'Foto de perfil atualizada!',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      });
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar foto de perfil.';
      setProfileError(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Remover foto de perfil
  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    setProfileError(null);
    setUploadingAvatar(true);

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessModal({
        isOpen: true,
        title: 'Foto de perfil removida!',
        description: 'Sua foto de perfil foi removida com sucesso.',
      });
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover foto de perfil.';
      setProfileError(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 4. Atualizar Senha
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (novaSenha.length < 6) {
      setPasswordError('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setPasswordError('As senhas não coincidem. Verifique a confirmação.');
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      setSuccessModal({
        isOpen: true,
        title: 'Senha alterada!',
        description: 'Sua senha de acesso foi alterada com sucesso.',
      });
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar a senha.';
      setPasswordError(msg);
    } finally {
      setLoadingPassword(false);
    }
  };

  // 5. Upload de Logo do Negócio
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setDadosError(null);
    setDadosSuccess(null);
    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      setDadosSuccess('Logo enviada! Clique em "Salvar Dados" para confirmar.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar logo.';
      setDadosError(msg);
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setDadosSuccess('Logo removida. Clique em "Salvar Dados" para confirmar.');
  };

  // 6. Salvar Dados do Negócio (Dados do Perfil/Negócio)
  const handleSaveDadosNegocio = async () => {
    if (!configuracaoId) return;
    setSavingDados(true);
    setDadosError(null);
    setDadosSuccess(null);

    try {
      const { error } = await supabase
        .from('configuracao_negocio')
        .update({
          nome_negocio: nomeNegocio.trim(),
          descricao: descricaoNegocio.trim() || null,
          instagram: instagramNegocio.trim() || null,
          endereco: enderecoNegocio.trim() || null,
          logo_url: logoUrl,
        })
        .eq('id', configuracaoId);

      if (error) throw error;
      setDadosSuccess(null);
      setSuccessModal({
        isOpen: true,
        title: 'Dados salvos!',
        description: 'Os dados do seu estúdio foram salvos com sucesso.',
      });
      
      // Notificar layouts sobre a atualização do nome e logotipo em tempo real
      window.dispatchEvent(
        new CustomEvent('business-config-updated', {
          detail: {
            nome_negocio: nomeNegocio.trim(),
            logo_url: logoUrl,
          },
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar dados do negócio.';
      setDadosError(msg);
    } finally {
      setSavingDados(false);
    }
  };

  // 7. Salvar Identidade Visual e Cores
  const handleSaveVisual = async () => {
    if (!configuracaoId) return;
    setSavingVisual(true);
    setVisualError(null);

    try {
      const { error } = await supabase
        .from('configuracao_negocio')
        .update({
          paleta_cores: paletaCores,
          modo_escuro: modoEscuro,
        })
        .eq('id', configuracaoId);

      if (error) throw error;
      setSuccessModal({
        isOpen: true,
        title: 'Cores salvas!',
        description: 'A identidade visual do seu negócio foi atualizada com sucesso.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar identidade visual.';
      setVisualError(msg);
    } finally {
      setSavingVisual(false);
    }
  };

  // 8. Salvar Configurações de Agendamento
  const handleSaveAgendamento = async () => {
    if (!configuracaoId) return;
    setSavingAgendamento(true);
    setAgendamentoError(null);

    try {
      const { error } = await supabase
        .from('configuracao_negocio')
        .update({
          aprovacao_automatica: aprovacaoAutomatica,
          antecedencia_cancelamento_horas: antecedenciaHoras === '' ? 0 : Number(antecedenciaHoras),
          mensagem_pos_agendamento: mensagemPosAgendamento.trim(),
        })
        .eq('id', configuracaoId);

      if (error) throw error;
      setSuccessModal({
        isOpen: true,
        title: 'Configurações salvas!',
        description: 'As configurações de agendamento foram salvas com sucesso.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar configurações de agendamento.';
      setAgendamentoError(msg);
    } finally {
      setSavingAgendamento(false);
    }
  };

  // 9. Copiar link do portal
  const handleCopyLink = async () => {
    if (!estabelecimentoSlug) return;
    const portalUrl = `${window.location.origin}/portal/${estabelecimentoSlug}`;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2500);
    } catch {
      // Fallback para browsers sem suporte
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

  // 10. Salvar novo slug
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
      // Verificar unicidade (apenas se o slug mudou)
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm">
        <h2 className="font-title font-semibold text-2xl text-text-primary">Configurações</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Gerencie seu perfil, dados do negócio e preferências de agendamento.
        </p>
      </div>

      {/* Grid: Avatar + Perfil/Senha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Panel */}
        <div className="md:col-span-1 bg-white border border-border rounded-[14px] p-6 shadow-sm flex flex-col items-center justify-center text-center h-fit">
          <div className="relative group">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={userName}
                className="w-28 h-28 rounded-full object-cover border-2 border-rose-200 shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-rose-100 border-2 border-rose-200 text-rose-800 flex items-center justify-center font-title font-bold text-3xl shadow-sm">
                {initials}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer duration-200"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          <h3 className="font-title font-bold text-lg text-text-primary mt-4 truncate w-full">
            {userName}
          </h3>
          <p className="text-xs text-text-secondary truncate w-full">{userEmail}</p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col gap-2 w-full mt-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {uploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
            </button>
            {profile?.avatar_url && (
              <button
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remover Foto
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Forms Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Profile Details */}
          <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
            <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3">
              <User className="w-5 h-5 text-rose-600" />
              Dados do Perfil
            </h3>

            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium">{profileError}</p>
                </div>
              )}


              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={userEmail}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg text-text-muted text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-text-secondary">
                  O e-mail de acesso não pode ser alterado diretamente.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={loadingProfile}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingProfile}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {loadingProfile ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Security (Password Change) */}
          <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
            <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3">
              <Key className="w-5 h-5 text-rose-600" />
              Segurança e Acesso
            </h3>

            <form onSubmit={handleUpdatePassword} className="mt-4 space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium">{passwordError}</p>
                </div>
              )}


              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                  Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    required
                    placeholder="No mínimo 6 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    disabled={loadingPassword}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    disabled={loadingPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-rose-600 cursor-pointer disabled:opacity-50"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                  Confirmar Nova Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmSenha ? 'text' : 'password'}
                    required
                    placeholder="Repita a nova senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={loadingPassword}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmSenha(!showConfirmSenha)}
                    disabled={loadingPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-rose-600 cursor-pointer disabled:opacity-50"
                  >
                    {showConfirmSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingPassword}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {loadingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Section 3: Dados do Meu Negócio */}
      <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
        <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Building2 className="w-5 h-5 text-rose-600" />
          Dados do Meu Negócio
        </h3>

        {loadingNegocio ? (
          <p className="text-sm text-text-secondary mt-4">Carregando...</p>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Logo / Foto do Estúdio
              </label>
              <div className="flex items-center gap-4">
                <div className="relative group flex-shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo do negócio"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-rose-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-rose-100 border-2 border-rose-200 border-dashed text-rose-400 flex items-center justify-center">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer duration-200"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    {uploadingLogo ? 'Enviando...' : 'Alterar Logo'}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nome do negócio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Nome do Negócio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nomeNegocio}
                  onChange={(e) => setNomeNegocio(e.target.value)}
                  placeholder="Ex: Lashes by Amanda, Studio da Ju"
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Descrição / Bio
              </label>
              <textarea
                value={descricaoNegocio}
                onChange={(e) => setDescricaoNegocio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Breve apresentação do seu trabalho..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all resize-none"
              />
              <p className="text-[10px] text-text-secondary text-right">
                {descricaoNegocio.length}/300
              </p>
            </div>

            {/* Instagram + Endereço */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                  Instagram
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={instagramNegocio}
                    onChange={(e) => setInstagramNegocio(e.target.value)}
                    placeholder="@seuperfil ou seuperfil"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                  Endereço / Local de Atendimento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={enderecoNegocio}
                    onChange={(e) => setEnderecoNegocio(e.target.value)}
                    placeholder="Ex: Rua X, nº Y — Setor Z"
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Feedback e botão de salvar */}
            {dadosError && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-xs font-medium">{dadosError}</p>
              </div>
            )}
            {dadosSuccess && (
              <div className="mt-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium">{dadosSuccess}</p>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-border mt-6">
              <button
                type="button"
                onClick={handleSaveDadosNegocio}
                disabled={savingDados || loadingNegocio || !configuracaoId}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {savingDados ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 3.5: Link de Agendamento */}
      <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
        <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Link2 className="w-5 h-5 text-rose-600" />
          Link de Agendamento
        </h3>

        <p className="text-xs text-text-secondary mt-3 mb-4">
          Este é o link único do seu portal. Suas clientes acessam para ver seus serviços e agendar. Coloque na bio do Instagram ou compartilhe no WhatsApp.
        </p>

        {/* Exibição do link atual */}
        <div className="flex items-center gap-0 p-3 bg-bg rounded-xl border border-border mb-5 overflow-hidden">
          <span className="text-xs text-text-muted flex-shrink-0 hidden sm:block">
            {window.location.origin}/portal/
          </span>
          <span className="text-xs font-bold text-primary truncate">
            {estabelecimentoSlug || '...'}
          </span>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            id="btn-copiar-link-agendamento"
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
        <div className="border-t border-border pt-5">
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
              id="input-slug-agendamento"
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
              id="btn-salvar-link-agendamento"
              onClick={handleSaveSlug}
              disabled={savingSlug || !slugEdit.trim() || slugEdit.trim() === estabelecimentoSlug}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {savingSlug ? 'Salvando...' : 'Salvar Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Identidade Visual e Cores */}
      <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2">
            <Palette className="w-5 h-5 text-rose-600" />
            Identidade Visual e Cores
          </h3>

          {/* Switch Modo Escuro */}
          <div className="flex items-center gap-3 bg-bg/40 p-2 rounded-lg border border-border/50">
            <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Modo Escuro (Dark Mode)</span>
            <button
              type="button"
              role="switch"
              aria-checked={modoEscuro}
              onClick={() => {
                const newMode = !modoEscuro;
                setModoEscuro(newMode);
                applyPalette(paletaCores, newMode); // Instant reflection!
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 ${
                modoEscuro ? 'bg-rose-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  modoEscuro ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <p className="text-xs text-text-secondary mt-2">
          Selecione a paleta de cores geral do sistema. A alteração é refletida em tempo real tanto no seu painel administrativo quanto no portal da cliente.
        </p>

        {loadingNegocio ? (
          <p className="text-sm text-text-secondary mt-4">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {PALETTES_LIST.map((palette) => {
              const isSelected = paletaCores === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => {
                    setPaletaCores(palette.id);
                    applyPalette(palette.id, modoEscuro); // Aplicação instantânea!
                  }}
                  className={`
                    flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer relative group
                    ${isSelected 
                      ? 'border-rose-600 bg-rose-50/5 ring-1 ring-rose-400' 
                      : 'border-border bg-bg/5 hover:bg-bg/15 hover:border-text-muted'}
                  `}
                >
                  {/* Nome da Paleta */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-text-primary">{palette.name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                    )}
                  </div>

                  {/* Descrição */}
                  <span className="text-[11px] text-text-secondary mt-1 leading-relaxed flex-grow">
                    {palette.description}
                  </span>

                  {/* Pré-visualização das Cores */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40 w-full">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Cores:</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Cor Primária */}
                      <span 
                        className="w-5 h-5 rounded-full border border-black/5 shadow-sm block" 
                        style={{ backgroundColor: palette.primaryColor }}
                        title="Cor Principal"
                      />
                      {/* Cor Secundária */}
                      <span 
                        className="w-5 h-5 rounded-full border border-black/5 shadow-sm block" 
                        style={{ backgroundColor: palette.accentColor }}
                        title="Cor de Destaque"
                      />
                      {/* Cor de Fundo */}
                      <span 
                        className="w-5 h-5 rounded-full border border-black/5 shadow-sm block" 
                        style={{ backgroundColor: palette.bgColor }}
                        title="Fundo"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback e botão de salvar */}
        {visualError && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs font-medium">{visualError}</p>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-border mt-6">
          <button
            type="button"
            onClick={handleSaveVisual}
            disabled={savingVisual || loadingNegocio || !configuracaoId}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {savingVisual ? 'Salvando...' : 'Salvar Cores'}
          </button>
        </div>
      </div>

      {/* Section 4: Configurações de Agendamento */}
      <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
        <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <CalendarClock className="w-5 h-5 text-rose-600" />
          Configurações de Agendamento
        </h3>

        {loadingNegocio ? (
          <p className="text-sm text-text-secondary mt-4">Carregando...</p>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Toggle: Aprovação automática */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Agendamento Automático
              </label>
              <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-lg bg-bg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    Confirmar agendamentos do portal automaticamente
                  </p>
                <p className="text-xs text-text-secondary mt-1">
                  {aprovacaoAutomatica
                    ? 'Agendamentos feitos pelas clientes já ficam confirmados.'
                    : 'Agendamentos feitos pelas clientes ficam pendentes até você confirmar.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={aprovacaoAutomatica}
                onClick={() => setAprovacaoAutomatica((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 ${
                  aprovacaoAutomatica ? 'bg-rose-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    aprovacaoAutomatica ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Antecedência mínima */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Horas mínimas para cancelamento pela cliente
              </label>
              <div className="relative w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Timer className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={0}
                  value={antecedenciaHoras}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAntecedenciaHoras(val === '' ? '' : Number(val));
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all"
                />
              </div>
              <p className="text-[10px] text-text-secondary">
                A cliente não poderá cancelar dentro desse prazo antes do horário agendado.
              </p>
            </div>

            {/* Mensagem pós-agendamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Mensagem exibida para a cliente após agendar
              </label>
              <textarea
                value={mensagemPosAgendamento}
                onChange={(e) => setMensagemPosAgendamento(e.target.value)}
                rows={3}
                placeholder="Ex: Agendamento recebido! Confirmarei em breve pelo WhatsApp."
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Feedback e botão de salvar */}
        {agendamentoError && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs font-medium">{agendamentoError}</p>
          </div>
        )}


        <div className="flex justify-end pt-6 border-t border-border mt-6">
          <button
            type="button"
            onClick={handleSaveAgendamento}
            disabled={savingAgendamento || loadingNegocio || !configuracaoId}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {savingAgendamento ? 'Salvando...' : 'Salvar Configurações'}
          </button>
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
        singleAction
      />
    </div>
  );
}
