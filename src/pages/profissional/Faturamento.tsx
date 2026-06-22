import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import {
  Check,
  Sparkles,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Users,
  Copy,
  CheckCircle2,
  Loader2,
  X,
  CreditCard,
  Lock,
  Info,
} from 'lucide-react';

function PixIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0.002L0.002 12 12 23.998 23.998 12 12 0.002zm0 4.238L19.76 12 12 19.76 4.24 12 12 4.24zm0 3.398L7.638 12 12 16.362 16.362 12 12 7.638z" />
    </svg>
  );
}

function PaymentButtons({
  onPix, onCard, pixLoading, cardLoading, showAsaasInfo, onToggleAsaasInfo,
}: {
  onPix: () => void;
  onCard: () => void;
  pixLoading: boolean;
  cardLoading: boolean;
  showAsaasInfo: boolean;
  onToggleAsaasInfo: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Pix */}
      <button
        onClick={onPix}
        disabled={pixLoading || cardLoading}
        className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:shadow-rose-600/15 disabled:opacity-60 disabled:pointer-events-none"
      >
        {pixLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PixIcon className="w-4 h-4" />}
        Pagar com Pix
      </button>

      {/* Cartão */}
      <div className="space-y-2">
        <button
          onClick={onCard}
          disabled={pixLoading || cardLoading}
          className="btn-outline-payment w-full py-3 px-4 bg-surface border border-border hover:bg-bg active:scale-[0.99] text-text-primary rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-60 disabled:pointer-events-none"
        >
          {cardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Pagar com Cartão de Crédito
        </button>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-muted pt-1">
          <Lock className="w-3 h-3" />
          <span>Processado com segurança pelo</span>
          <button
            onClick={onToggleAsaasInfo}
            className="font-semibold text-text-secondary underline decoration-dotted cursor-pointer flex items-center gap-0.5"
          >
            Asaas
            <Info className="w-3 h-3" />
          </button>
        </div>

        {/* Tooltip Asaas */}
        {showAsaasInfo && (
          <div className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 p-2.5 rounded-lg leading-relaxed animate-fade-in">
            <strong>Asaas</strong> é uma fintech brasileira regulada pelo Banco Central do Brasil, usada por mais de 300 mil empresas para cobranças seguras via Pix, Cartão e Boleto.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Faturamento() {
  const { profile, refreshProfile } = useAuth();
  const { isSubscriptionActive, isPremium, status, trialEndsAt } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'none' | 'cpf' | 'pix' | 'success'>('none');
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<'basico' | 'premium'>('premium');
  const [cpfInput, setCpfInput] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);

  const [pixQrCodeImage, setPixQrCodeImage] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [showAsaasInfo, setShowAsaasInfo] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const daysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  // Para o polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
  };

  // Polling dual: consulta Asaas diretamente (fallback) + verifica DB (captura webhook)
  // Para automaticamente após 15 minutos
  const startPolling = (estabelecimentoId: string, paymentId: string | null) => {
    stopPolling();

    const checkPayment = async () => {
      // 1. Se tiver paymentId, consulta Asaas diretamente (não depende do webhook)
      if (paymentId) {
        try {
          const { data } = await supabase.functions.invoke('asaas-check-payment', {
            body: { payment_id: paymentId, estabelecimento_id: estabelecimentoId },
          });
          if (data?.ativo) {
            stopPolling();
            await refreshProfile();
            setCheckoutMode('success');
            return;
          }
        } catch {
          // Falha na Edge Function → fallback para verificação no DB abaixo
        }
      }

      // 2. Fallback: verifica se webhook já atualizou o banco
      const { data: est } = await supabase
        .from('estabelecimentos')
        .select('status_assinatura')
        .eq('id', estabelecimentoId)
        .single();

      if (est?.status_assinatura === 'ativo') {
        stopPolling();
        await refreshProfile();
        setCheckoutMode('success');
      }
    };

    pollingRef.current = setInterval(checkPayment, 10000);

    // Para o polling após 15 minutos independente do resultado
    pollingTimeoutRef.current = setTimeout(stopPolling, 15 * 60 * 1000);
  };

  const validateCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 || digits.length === 14;
  };

  const handleOpenCpfStep = (plano: 'basico' | 'premium') => {
    setSelectedPlanToBuy(plano);
    setCpfInput('');
    setCpfError(null);
    setCheckoutError(null);
    setCheckoutMode('cpf');
  };

  const handleCpfSubmit = () => {
    if (!validateCpfCnpj(cpfInput)) {
      setCpfError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }
    handleAsaasCheckout(selectedPlanToBuy, cpfInput.replace(/\D/g, ''));
  };

  // Checkout via cartão — cria assinatura e abre invoiceUrl do Asaas em nova aba
  const handleCardCheckout = async (plano: 'basico' | 'premium') => {
    if (!profile?.estabelecimento_id) return;
    setSelectedPlanToBuy(plano);
    setCardLoading(true);
    setCheckoutError(null);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-checkout', {
        body: {
          estabelecimento_id: profile.estabelecimento_id,
          plano,
          email: profile.email,
          nome:  profile.nome,
          mode:  'card',
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.invoiceUrl) throw new Error('Link de pagamento não disponível.');

      window.open(data.invoiceUrl, '_blank');
      // Cartão não retorna paymentId — polling usa só DB como fallback
      startPolling(profile.estabelecimento_id, data.paymentId ?? null);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Erro ao gerar link de pagamento.');
    } finally {
      setCardLoading(false);
    }
  };

  // Chama a Edge Function asaas-checkout e exibe QR Code
  const handleAsaasCheckout = async (plano: 'basico' | 'premium', cpfCnpj: string) => {
    if (!profile?.estabelecimento_id) return;
    setLoading(true);
    setCheckoutError(null);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-checkout', {
        body: {
          estabelecimento_id: profile.estabelecimento_id,
          plano,
          email: profile.email,
          nome:  profile.nome,
          cpf_cnpj: cpfCnpj,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setPixQrCodeImage(data.pixQrCodeImage);
      setPixKey(data.pixKey);
      setCurrentPaymentId(data.paymentId ?? null);
      setCheckoutMode('pix');
      startPolling(profile.estabelecimento_id, data.paymentId ?? null);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Erro ao gerar cobrança. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!profile?.estabelecimento_id) return;
    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-cancel', {
        body: { estabelecimento_id: profile.estabelecimento_id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
      setCancelConfirm(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar assinatura.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBackFromCheckout = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCheckoutMode('none');
    setPixQrCodeImage(null);
    setPixKey(null);
    setCheckoutError(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto font-sans">

      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="font-title font-bold text-3xl text-text-primary">Minha Assinatura</h1>
        <p className="text-sm text-text-secondary mt-1">Gerencie os planos do seu estúdio e formas de pagamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Painel Esquerdo: Status */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Assinatura Atual</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-secondary">Plano Ativo</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-bold font-title ${isPremium ? 'text-rose-600' : 'text-text-primary'}`}>
                    {isPremium ? 'Premium (Agenda Digital)' : 'Básico (Apenas CRM)'}
                  </span>
                  {isPremium && <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />}
                </div>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Status</p>
                <div className="mt-1.5">
                  {status === 'ativo' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Assinatura Ativa
                    </span>
                  )}
                  {status === 'trial' && isSubscriptionActive() && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                      <Calendar className="w-3.5 h-3.5 animate-pulse" /> Período de Testes ({daysRemaining} dias)
                    </span>
                  )}
                  {status === 'trial' && !isSubscriptionActive() && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Trial Expirado
                    </span>
                  )}
                  {status === 'suspenso' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Suspenso por Inadimplência
                    </span>
                  )}
                  {status === 'cancelado' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Assinatura Cancelada
                    </span>
                  )}
                </div>
              </div>

              {trialEndsAt && status === 'trial' && (
                <div>
                  <p className="text-xs text-text-secondary">Término do Teste</p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {new Date(trialEndsAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {status === 'ativo' && (
                <div className="pt-4 border-t border-border">
                  {!cancelConfirm ? (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50/50 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar Assinatura
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-text-secondary text-center">Tem certeza? Você perderá o acesso às funcionalidades do plano.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCancelConfirm(false)}
                          className="flex-1 py-2 border border-border rounded-xl text-xs font-semibold text-text-secondary cursor-pointer"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={handleCancelSubscription}
                          disabled={cancelLoading}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1"
                        >
                          {cancelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel Direito */}
        <div className="md:col-span-2 space-y-8">

          {checkoutMode === 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* PLANO BÁSICO */}
              <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ${!isPremium ? 'border-text-primary ring-2 ring-text-primary/10' : 'border-border'}`}>
                <div>
                  <div className="p-6 bg-gradient-to-tr from-rose-500/10 via-pink-500/5 to-transparent border-b border-border">
                    <h2 className="font-title font-bold text-lg text-text-primary flex items-center gap-2">
                      <Users className="w-5 h-5 text-text-secondary" /> Plano Básico (CRM)
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">Ideal para organizar a carteira de clientes e prontuários.</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold font-title text-text-primary">R$ 59,90</span>
                      <span className="text-xs font-semibold text-text-secondary">/ mês</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {!isPremium && status === 'trial' && (
                      <div className="py-1.5 text-center text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                        Seu plano de testes atual
                      </div>
                    )}
                    <ul className="space-y-2.5 text-xs text-text-secondary">
                      {['Cadastro de Clientes ilimitado', 'Fichas de Anamnese Customizadas', 'Meu Estúdio (Relatórios)', 'Histórico de Atendimentos', 'Suporte por E-mail'].map(feat => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />{feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6 border-t border-border space-y-2">
                  {!isPremium && status === 'ativo' ? (
                    <div className="py-2 text-center text-xs font-semibold text-green-700 bg-green-50 rounded-xl border border-green-200">Plano Ativo</div>
                  ) : (
                    <PaymentButtons
                      onPix={() => handleOpenCpfStep('basico')}
                      onCard={() => handleCardCheckout('basico')}
                      pixLoading={loading && selectedPlanToBuy === 'basico'}
                      cardLoading={cardLoading && selectedPlanToBuy === 'basico'}
                      showAsaasInfo={showAsaasInfo}
                      onToggleAsaasInfo={() => setShowAsaasInfo(v => !v)}
                    />
                  )}
                </div>
              </div>

              {/* PLANO PREMIUM */}
              <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ${isPremium ? 'border-rose-600 ring-2 ring-rose-100' : 'border-border'}`}>
                <div>
                  <div className="p-6 bg-gradient-to-tr from-rose-500/10 via-pink-500/5 to-transparent border-b border-border">
                    <h2 className="font-title font-bold text-lg text-text-primary flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-rose-600" /> Plano Premium (Agenda)
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">Para quem quer automatizar o agendamento 24h por dia.</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold font-title text-text-primary">R$ 99,90</span>
                      <span className="text-xs font-semibold text-text-secondary">/ mês</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {isPremium && status === 'trial' && (
                      <div className="py-1.5 text-center text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                        Seu plano de testes atual
                      </div>
                    )}
                    <ul className="space-y-2.5 text-xs text-text-secondary">
                      {['TUDO do Plano Básico', 'Portal de Agendamento Online', 'Horários Dinâmicos', 'Bloqueios Rápidos de Agenda', 'Aprovação Manual/Automática', 'Suporte Prioritário'].map(feat => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                          <span className={feat.startsWith('TUDO') ? 'font-semibold text-text-primary' : ''}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6 border-t border-border space-y-2">
                  {isPremium && status === 'ativo' ? (
                    <div className="py-2 text-center text-xs font-semibold text-green-700 bg-green-50 rounded-xl border border-green-200">Plano Ativo</div>
                  ) : (
                    <PaymentButtons
                      onPix={() => handleOpenCpfStep('premium')}
                      onCard={() => handleCardCheckout('premium')}
                      pixLoading={loading && selectedPlanToBuy === 'premium'}
                      cardLoading={cardLoading && selectedPlanToBuy === 'premium'}
                      showAsaasInfo={showAsaasInfo}
                      onToggleAsaasInfo={() => setShowAsaasInfo(v => !v)}
                    />
                  )}
                </div>
              </div>

              {checkoutError && (
                <div className="md:col-span-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

            </div>
          )}

          {/* Passo CPF/CNPJ */}
          {checkoutMode === 'cpf' && (
            <div className="bg-white border border-border rounded-2xl shadow-sm p-6 md:p-8 animate-fade-in">
              <h2 className="font-title font-bold text-xl text-text-primary mb-1">
                Informação para cobrança
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                O Asaas exige CPF ou CNPJ para processar cobranças via Pix. Seus dados são usados apenas para emissão da cobrança.
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="Somente números — CPF (11 dígitos) ou CNPJ (14 dígitos)"
                    value={cpfInput}
                    onChange={(e) => { setCpfInput(e.target.value); setCpfError(null); }}
                    className="w-full px-3 py-2.5 border border-border rounded-xl bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                    onKeyDown={(e) => e.key === 'Enter' && handleCpfSubmit()}
                  />
                  {cpfError && <p className="text-xs text-red-600">{cpfError}</p>}
                </div>
                {checkoutError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleCpfSubmit}
                    disabled={loading}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg hover:shadow-rose-600/15 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PixIcon className="w-4 h-4" />}
                    Gerar QR Code Pix
                  </button>
                  <button
                    onClick={() => setCheckoutMode('none')}
                    className="w-full py-3 border border-border hover:bg-bg active:scale-[0.99] text-text-secondary rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-center"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Pix */}
          {checkoutMode === 'pix' && (
            <div className="bg-white border border-border rounded-2xl shadow-sm p-6 md:p-8 animate-fade-in">
              <h2 className="font-title font-bold text-xl text-text-primary mb-1 flex items-center gap-2">
                <PixIcon className="w-5 h-5 text-rose-600" />
                Pague via Pix — Plano {selectedPlanToBuy === 'premium' ? 'Premium' : 'Básico'}
              </h2>
              <p className="text-sm text-text-secondary mb-6">Escaneie o QR Code ou copie o código Pix abaixo. O acesso é liberado automaticamente após a confirmação.</p>

              <div className="flex flex-col items-center gap-6">
                {/* QR Code */}
                {pixQrCodeImage ? (
                  <div className="p-3 bg-white border-2 border-border rounded-2xl shadow-inner">
                    <img src={`data:image/png;base64,${pixQrCodeImage}`} alt="QR Code Pix" className="w-52 h-52" />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-bg border border-border rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                  </div>
                )}

                {/* Código copia e cola */}
                {pixKey && (
                  <div className="w-full space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Código Pix — Copia e Cola</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-bg border border-border rounded-xl text-xs font-mono text-text-secondary break-all select-all">
                        {pixKey}
                      </div>
                      <button
                        onClick={handleCopyPix}
                        className="shrink-0 p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
                        title="Copiar código Pix"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {copied && <p className="text-xs text-green-600 font-semibold">Copiado!</p>}
                  </div>
                )}

                {/* Status de aguardo */}
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>

                <button
                  onClick={handleBackFromCheckout}
                  className="text-xs text-text-secondary hover:text-rose-600 underline cursor-pointer transition-colors"
                >
                  Cancelar e voltar
                </button>
              </div>
            </div>
          )}

          {/* Sucesso */}
          {checkoutMode === 'success' && (
            <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-8 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-title font-bold text-xl text-text-primary mb-1">Pagamento Confirmado!</h2>
              <p className="text-sm text-text-secondary mb-6">
                Seu Plano {selectedPlanToBuy === 'premium' ? 'Premium' : 'Básico'} está ativo. Bem-vinda!
              </p>
              <button
                onClick={() => setCheckoutMode('none')}
                className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:shadow-rose-600/15"
              >
                Voltar para Minha Assinatura
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
