import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, AlertCircle, Loader2, ClipboardList, Info, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePortal } from '../../contexts/PortalContext';
import { useOnboarding } from '../../hooks/useOnboarding';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgendamentoServicoWithRelations {
  id: string;
  agendamento_id: string;
  servico_id: string;
  variacao_id: string | null;
  valor_cobrado: number | null;
  servico?: { nome: string };
  variacao?: { nome: string };
}

interface AgendamentoWithServices {
  id: string;
  cliente_id: string;
  data_hora: string;
  duracao_minutos: number;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  origem: 'admin' | 'portal';
  observacoes: string | null;
  created_at?: string;
  agendamento_servicos?: AgendamentoServicoWithRelations[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES_GENITIVO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

const DIAS_SEMANA_LONGO = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

function formatDataHoraExtenso(isoStr: string): string {
  const date = new Date(isoStr);
  const dia = date.getDate();
  const mes = MESES_GENITIVO[date.getMonth()];
  const diaSemana = DIAS_SEMANA_LONGO[date.getDay()];
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${diaSemana}, ${dia} de ${mes} · ${horas}:${minutos}`;
}

function formatDuracao(min: number): string {
  if (min <= 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatValor(val: number): string {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pendente': return 'Pendente';
    case 'confirmado': return 'Confirmado';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pendente': return 'bg-amber-50 text-amber-700 border-amber-200/60';
    case 'confirmado': return 'bg-blue-50 text-blue-700 border-blue-200/60';
    case 'concluido': return 'bg-green-50 text-green-700 border-green-200/60';
    case 'cancelado': return 'bg-gray-50 text-text-muted border-border';
    default: return 'bg-gray-50 text-text-secondary border-border';
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PortalMeusAgendamentos() {
  const navigate = useNavigate();
  const { clienteId } = useAuth();
  const { establishmentId, slug } = usePortal();
  const { autoStart, loading: onboardingLoading } = useOnboarding('portal_agendamentos');
  useEffect(() => { autoStart(); }, [onboardingLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const [agendamentos, setAgendamentos] = useState<AgendamentoWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [antecedenciaMinima, setAntecedenciaMinima] = useState<number>(24);
  const [apptParaCancelar, setApptParaCancelar] = useState<AgendamentoWithServices | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [cancelamentoSucesso, setCancelamentoSucesso] = useState(false);

  const fetchAgendamentos = async () => {
    if (!clienteId || !establishmentId) return;
    setLoading(true);
    setError(false);
    try {
      const { data, error: fetchErr } = await supabase
        .from('agendamentos')
        .select(`
          *,
          agendamento_servicos (
            *,
            servico:servicos ( nome ),
            variacao:variacoes_servico ( nome )
          )
        `)
        .eq('cliente_id', clienteId)
        .eq('estabelecimento_id', establishmentId)
        .order('data_hora', { ascending: false });

      if (fetchErr) throw fetchErr;
      setAgendamentos(data || []);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentos();

    if (establishmentId) {
      supabase
        .from('configuracao_negocio')
        .select('antecedencia_cancelamento_horas')
        .eq('estabelecimento_id', establishmentId)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.antecedencia_cancelamento_horas != null) {
            setAntecedenciaMinima(data.antecedencia_cancelamento_horas);
          }
        });
    }
  }, [clienteId, establishmentId]);

  // Dividir os agendamentos em Próximos e Passados com base no horário atual do navegador
  // Recalcula "agora" sempre que os agendamentos são recarregados
  const agora = useMemo(() => new Date(), [agendamentos]);

  const proximos = useMemo(() => {
    return agendamentos
      .filter(a => new Date(a.data_hora) >= agora)
      .sort((a, b) => {
        // Agendamentos ativos (pendente/confirmado) sempre primeiro
        const aAtivo = a.status === 'pendente' || a.status === 'confirmado';
        const bAtivo = b.status === 'pendente' || b.status === 'confirmado';
        if (aAtivo && !bAtivo) return -1;
        if (!aAtivo && bAtivo) return 1;
        // Dentro do mesmo grupo, ordenar por data/hora mais cedo primeiro
        return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
      });
  }, [agendamentos, agora]);

  const passados = useMemo(() => {
    return agendamentos
      .filter(a => new Date(a.data_hora) < agora)
      .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  }, [agendamentos, agora]);

  const handleConfirmarCancelamento = async () => {
    if (!apptParaCancelar) return;
    const apptId = apptParaCancelar.id;
    const motivo = motivoCancelamento.trim() || null;
    setCancelandoId(apptId);
    setApptParaCancelar(null);
    setMotivoCancelamento('');

    try {
      const { error: cancelErr } = await supabase
        .from('agendamentos')
        .update({
          status: 'cancelado',
          ...(motivo && { observacoes: motivo }),
        })
        .eq('id', apptId);

      if (cancelErr) throw cancelErr;

      setAgendamentos(prev =>
        prev.map(a => (a.id === apptId ? { ...a, status: 'cancelado' } : a))
      );
      setCancelamentoSucesso(true);
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      alert('Não foi possível cancelar o agendamento. Tente novamente.');
    } finally {
      setCancelandoId(null);
    }
  };

  function canCancel(appt: AgendamentoWithServices): { allowed: boolean; reason?: string } {
    if (appt.status !== 'pendente' && appt.status !== 'confirmado') {
      return { allowed: false };
    }

    const apptTime = new Date(appt.data_hora).getTime();
    const currentTime = new Date().getTime();
    const diffHours = (apptTime - currentTime) / (1000 * 60 * 60);

    if (diffHours <= antecedenciaMinima) {
      return {
        allowed: false,
        reason: `Cancelamento permitido apenas com ${antecedenciaMinima}h de antecedência.`
      };
    }

    return { allowed: true };
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-9 bg-gray-200 rounded-lg w-64 animate-pulse mb-8"></div>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/2"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="font-title font-bold text-xl text-text-primary">
          Não foi possível carregar seus agendamentos.
        </h3>
        <p className="text-sm text-text-secondary">
          Ocorreu um erro ao carregar as informações. Por favor, tente novamente.
        </p>
        <button
          onClick={fetchAgendamentos}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-8 h-8 text-rose-600" />
        <h1 className="font-title font-bold text-3xl text-text-primary">Meus Agendamentos</h1>
      </div>

      {/* PRÓXIMOS AGENDAMENTOS */}
      <section id="ob-portal-proximos" className="space-y-4">
        <h2 className="font-title font-semibold text-2xl text-text-primary border-b border-border pb-2">
          Próximos Agendamentos
        </h2>

        {proximos.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <Calendar className="w-10 h-10 text-rose-300 mx-auto" />
            <div className="space-y-1">
              <p className="font-medium text-text-primary">Você não tem agendamentos futuros.</p>
              <p className="text-sm text-text-secondary">Que tal agendar um horário agora?</p>
            </div>
            <button
              onClick={() => navigate(`/portal/${slug}/agendar`)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Agendar Agora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {proximos.map(appt => {
              const valorTotal = appt.agendamento_servicos?.reduce((sum, s) => sum + Number(s.valor_cobrado || 0), 0) || 0;
              const cancelStatus = canCancel(appt);
              const isPendingOrSaving = cancelandoId === appt.id;

              return (
                <div
                  key={appt.id}
                  className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden"
                >
                  <div className="space-y-3.5 flex-1">
                    {/* Header: Date and badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-text-primary text-base flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
                        {formatDataHoraExtenso(appt.data_hora)}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 border rounded-full shrink-0 ${getStatusBadgeClass(appt.status)}`}>
                        {getStatusLabel(appt.status)}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-50/50 text-rose-700 border border-rose-100/60 rounded-full shrink-0">
                        {appt.origem === 'portal' ? 'Agendado online' : 'Agendado pela profissional'}
                      </span>
                    </div>

                    {/* Services list */}
                    <div className="space-y-1.5 border-l-2 border-rose-100/60 pl-3">
                      {appt.agendamento_servicos?.map(as => (
                        <div key={as.id} className="text-sm text-text-primary flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{as.servico?.nome}</span>
                          {as.variacao && (
                            <span className="text-xs text-text-secondary bg-bg px-2 py-0.5 rounded-md">
                              {as.variacao.nome}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Metadata: Duration & Value */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-text-muted" />
                        {formatDuracao(appt.duracao_minutos)}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-text-primary">
                        <Tag className="w-4 h-4 text-gold" />
                        {formatValor(valorTotal)}
                      </span>
                    </div>

                    {/* Observations */}
                    {appt.observacoes && (
                      <div className="bg-bg/40 border border-border/20 rounded-xl p-3 text-xs text-text-secondary leading-relaxed">
                        <span className="font-semibold block mb-0.5">Observações:</span>
                        {appt.observacoes}
                      </div>
                    )}
                  </div>

                  {/* Actions (Cancel button) */}
                  <div className="flex flex-col justify-end items-end gap-2 shrink-0">
                    {appt.status !== 'cancelado' && (
                      <div className="w-full md:w-auto text-right space-y-1">
                        <button
                          disabled={!cancelStatus.allowed || isPendingOrSaving}
                          onClick={() => setApptParaCancelar(appt)}
                          className={`w-full md:w-auto px-4 py-2 border text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            cancelStatus.allowed
                              ? 'border-red-200 text-red-700 hover:bg-red-50 bg-white'
                              : 'border-border text-text-muted bg-gray-50/50 cursor-not-allowed'
                          }`}
                        >
                          {isPendingOrSaving ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelando...</>
                          ) : (
                            'Cancelar Agendamento'
                          )}
                        </button>
                        
                        {!cancelStatus.allowed && cancelStatus.reason && (
                          <p className="text-[10px] text-text-muted flex items-center justify-end gap-1 select-none">
                            <Info className="w-3 h-3 text-text-muted" />
                            {cancelStatus.reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HISTÓRICO / PASSADOS */}
      <section id="ob-portal-historico" className="space-y-4">
        <h2 className="font-title font-semibold text-2xl text-text-primary border-b border-border pb-2">
          Histórico
        </h2>

        {passados.length === 0 ? (
          <p className="text-center text-text-secondary text-sm bg-white border border-border rounded-2xl py-8 shadow-sm">
            Nenhum atendimento realizado ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {passados.map(appt => {
              const valorTotal = appt.agendamento_servicos?.reduce((sum, s) => sum + Number(s.valor_cobrado || 0), 0) || 0;

              return (
                <div
                  key={appt.id}
                  className="bg-white border border-border rounded-2xl p-5 shadow-sm opacity-85 hover:opacity-100 transition-opacity flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Header: Date and badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-text-secondary text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                        {formatDataHoraExtenso(appt.data_hora)}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full shrink-0 ${getStatusBadgeClass(appt.status)}`}>
                        {getStatusLabel(appt.status)}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-50 text-text-muted border border-border/80 rounded-full shrink-0">
                        {appt.origem === 'portal' ? 'Agendado online' : 'Agendado pela profissional'}
                      </span>
                    </div>

                    {/* Services list */}
                    <div className="space-y-1.5 border-l-2 border-border pl-3">
                      {appt.agendamento_servicos?.map(as => (
                        <div key={as.id} className="text-sm text-text-secondary flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{as.servico?.nome}</span>
                          {as.variacao && (
                            <span className="text-[11px] text-text-muted bg-bg px-2 py-0.5 rounded-md">
                              {as.variacao.nome}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Metadata: Duration & Value */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {formatDuracao(appt.duracao_minutos)}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Tag className="w-3.5 h-3.5 text-text-muted" />
                        {formatValor(valorTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {apptParaCancelar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 animate-slide-up relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setApptParaCancelar(null); setMotivoCancelamento(''); }}
              className="absolute top-4 right-4 text-text-secondary hover:text-rose-600 p-1 rounded-full hover:bg-bg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-title font-semibold text-lg text-text-primary">
                Cancelar Agendamento
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Tem certeza que deseja cancelar este agendamento?
                Esta ação não poderá ser desfeita e o horário será liberado.
              </p>
            </div>

            {/* Resumo do agendamento */}
            <div className="bg-bg rounded-xl border border-border p-3 text-xs text-text-secondary space-y-1">
              <p className="font-semibold text-text-primary text-sm">
                {formatDataHoraExtenso(apptParaCancelar.data_hora)}
              </p>
              <p>
                {apptParaCancelar.agendamento_servicos?.map(s => s.servico?.nome).join(', ')}
              </p>
            </div>

            {/* Motivo (opcional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Motivo do cancelamento <span className="text-text-muted font-normal normal-case tracking-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                value={motivoCancelamento}
                onChange={e => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Não vou conseguir comparecer, surgiu um imprevisto..."
                className="w-full px-3 py-2 border border-border rounded-xl bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none placeholder:text-text-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setApptParaCancelar(null); setMotivoCancelamento(''); }}
                className="px-4 py-2.5 border border-border hover:bg-bg text-text-secondary rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmarCancelamento}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO DO CANCELAMENTO */}
      {cancelamentoSucesso && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4 animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-title font-semibold text-lg text-text-primary">
                Agendamento cancelado
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Seu agendamento foi cancelado com sucesso. O horário já está liberado.
              </p>
            </div>
            <button
              onClick={() => setCancelamentoSucesso(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
