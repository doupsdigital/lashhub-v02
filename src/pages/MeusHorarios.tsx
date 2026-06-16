import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CalendarOff, Plus, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import type { HorarioAtendimento, BloqueioAgenda } from '../types';
import ConfirmModal from '../components/common/ConfirmModal';

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

interface DiaConfig {
  ativo: boolean;
  hora_inicio: string;
  hora_fim: string;
  existingId?: string;
}

const createDefaultDias = (): DiaConfig[] =>
  DIAS_SEMANA.map(() => ({ ativo: false, hora_inicio: '09:00', hora_fim: '18:00' }));

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function MeusHorarios() {
  const { estabelecimentoId } = useAuth();
  const [dias, setDias] = useState<DiaConfig[]>(createDefaultDias);
  const [loadingHorarios, setLoadingHorarios] = useState(true);
  const [savingHorarios, setSavingHorarios] = useState(false);
  const [horariosError, setHorariosError] = useState<string | null>(null);
  const [horariosSuccess, setHorariosSuccess] = useState<string | null>(null);

  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);
  const [loadingBloqueios, setLoadingBloqueios] = useState(true);
  const [savingBloqueio, setSavingBloqueio] = useState(false);
  const [bloqueioError, setBloqueioError] = useState<string | null>(null);
  const [bloqueioSuccess, setBloqueioSuccess] = useState<string | null>(null);

  const [novoDataInicio, setNovoDataInicio] = useState('');
  const [novoDataFim, setNovoDataFim] = useState('');
  const [novoMotivo, setNovoMotivo] = useState('');

  const [bloqueioToDelete, setBloqueioToDelete] = useState<BloqueioAgenda | null>(null);

  useEffect(() => {
    async function loadHorarios() {
      if (!estabelecimentoId) return;
      setLoadingHorarios(true);
      const { data, error } = await supabase
        .from('horarios_atendimento')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('dia_semana');

      if (!error && data) {
        const hasInitialized = localStorage.getItem(`horarios_inicializados_${estabelecimentoId}`) === 'true';
        
        if (!hasInitialized) {
          const existingDays = (data as HorarioAtendimento[]).map(h => h.dia_semana);
          const missingWeekdays = [1, 2, 3, 4, 5].filter(day => !existingDays.includes(day));
          
          if (missingWeekdays.length > 0) {
            const defaults = missingWeekdays.map(day => ({
              estabelecimento_id: estabelecimentoId,
              dia_semana: day,
              hora_inicio: '09:00',
              hora_fim: '18:00'
            }));
            
            const { error: seedError } = await supabase
              .from('horarios_atendimento')
              .insert(defaults);
              
            if (!seedError) {
              localStorage.setItem(`horarios_inicializados_${estabelecimentoId}`, 'true');
              // Reload
              const { data: reloadedData, error: reloadError } = await supabase
                .from('horarios_atendimento')
                .select('*')
                .eq('estabelecimento_id', estabelecimentoId)
                .order('dia_semana');
                
              if (!reloadError && reloadedData) {
                const newDias = createDefaultDias();
                (reloadedData as HorarioAtendimento[]).forEach((h) => {
                  if (h.dia_semana >= 0 && h.dia_semana <= 6) {
                    newDias[h.dia_semana] = {
                      ativo: true,
                      hora_inicio: h.hora_inicio.substring(0, 5),
                      hora_fim: h.hora_fim.substring(0, 5),
                      existingId: h.id,
                    };
                  }
                });
                setDias(newDias);
              }
              setLoadingHorarios(false);
              return;
            } else {
              console.error('Erro ao inicializar horários padrão:', seedError);
            }
          } else {
            localStorage.setItem(`horarios_inicializados_${estabelecimentoId}`, 'true');
          }
        }

        const newDias = createDefaultDias();
        (data as HorarioAtendimento[]).forEach((h) => {
          if (h.dia_semana >= 0 && h.dia_semana <= 6) {
            newDias[h.dia_semana] = {
              ativo: true,
              hora_inicio: h.hora_inicio.substring(0, 5),
              hora_fim: h.hora_fim.substring(0, 5),
              existingId: h.id,
            };
          }
        });
        setDias(newDias);
      }
      setLoadingHorarios(false);
    }
    loadHorarios();
  }, [estabelecimentoId]);

  async function loadBloqueios() {
    if (!estabelecimentoId) return;
    setLoadingBloqueios(true);
    const { data, error } = await supabase
      .from('bloqueios_agenda')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('data_inicio');
    if (!error && data) setBloqueios(data as BloqueioAgenda[]);
    setLoadingBloqueios(false);
  }

  useEffect(() => {
    loadBloqueios();
  }, [estabelecimentoId]);

  const handleDiaToggle = (index: number) => {
    setDias((prev) => prev.map((d, i) => (i === index ? { ...d, ativo: !d.ativo } : d)));
  };

  const handleHorarioChange = (index: number, field: 'hora_inicio' | 'hora_fim', value: string) => {
    setDias((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleSaveHorarios = async () => {
    setSavingHorarios(true);
    setHorariosError(null);
    setHorariosSuccess(null);

    const updatedDias = [...dias];

    try {
      for (let i = 0; i < 7; i++) {
        const dia = updatedDias[i];

        if (dia.ativo) {
          if (dia.existingId) {
            const { error } = await supabase
              .from('horarios_atendimento')
              .update({ hora_inicio: dia.hora_inicio, hora_fim: dia.hora_fim })
              .eq('id', dia.existingId);
            if (error) throw error;
          } else {
            const { data, error } = await supabase
              .from('horarios_atendimento')
              .insert({ 
                dia_semana: i, 
                hora_inicio: dia.hora_inicio, 
                hora_fim: dia.hora_fim,
                estabelecimento_id: estabelecimentoId
              })
              .select()
              .single();
            if (error) throw error;
            updatedDias[i] = { ...updatedDias[i], existingId: (data as HorarioAtendimento).id };
          }
        } else {
          if (dia.existingId) {
            const { error } = await supabase
              .from('horarios_atendimento')
              .delete()
              .eq('id', dia.existingId);
            if (error) throw error;
            updatedDias[i] = { ...updatedDias[i], existingId: undefined };
          }
        }
      }

      setDias(updatedDias);
      setHorariosSuccess('Expediente salvo com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar expediente.';
      setHorariosError(msg);
    } finally {
      setSavingHorarios(false);
    }
  };

  const handleAddBloqueio = async (e: React.FormEvent) => {
    e.preventDefault();
    setBloqueioError(null);
    setBloqueioSuccess(null);

    if (!novoDataInicio || !novoDataFim) {
      setBloqueioError('Preencha as datas de início e fim.');
      return;
    }
    if (novoDataFim < novoDataInicio) {
      setBloqueioError('A data fim deve ser maior ou igual à data início.');
      return;
    }

    setSavingBloqueio(true);
    try {
      const { error } = await supabase.from('bloqueios_agenda').insert({
        data_inicio: novoDataInicio,
        data_fim: novoDataFim,
        motivo: novoMotivo.trim() || null,
        estabelecimento_id: estabelecimentoId,
      });
      if (error) throw error;

      setNovoDataInicio('');
      setNovoDataFim('');
      setNovoMotivo('');
      setBloqueioSuccess('Bloqueio adicionado com sucesso!');
      await loadBloqueios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar bloqueio.';
      setBloqueioError(msg);
    } finally {
      setSavingBloqueio(false);
    }
  };

  const handleDeleteBloqueio = async () => {
    if (!bloqueioToDelete) return;
    try {
      const { error } = await supabase
        .from('bloqueios_agenda')
        .delete()
        .eq('id', bloqueioToDelete.id);
      if (error) throw error;
      await loadBloqueios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir bloqueio.';
      setBloqueioError(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm">
        <h2 className="font-title font-semibold text-2xl text-text-primary">Meus Horários</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure seu expediente semanal e registre períodos de folga ou indisponibilidade.
        </p>
      </div>

      {/* Seção 1: Expediente Semanal */}
      <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
        <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <Clock className="w-5 h-5 text-rose-600" />
          Expediente Semanal
        </h3>

        {loadingHorarios ? (
          <p className="text-sm text-text-secondary mt-4">Carregando...</p>
        ) : (
          <div className="mt-4 space-y-2">
            {DIAS_SEMANA.map((nomeDia, i) => (
              <div
                key={i}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-colors ${
                  dias[i].ativo ? 'border-rose-200 bg-rose-50/30' : 'border-border bg-bg'
                }`}
              >
                <label className="flex items-center gap-2.5 cursor-pointer min-w-[170px]">
                  <input
                    type="checkbox"
                    checked={dias[i].ativo}
                    onChange={() => handleDiaToggle(i)}
                    className="w-4 h-4 accent-rose-600 cursor-pointer"
                  />
                  <span
                    className={`text-sm font-medium ${
                      dias[i].ativo ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {nomeDia}
                  </span>
                </label>

                {dias[i].ativo && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-text-secondary whitespace-nowrap">Início</label>
                      <input
                        type="time"
                        value={dias[i].hora_inicio}
                        onChange={(e) => handleHorarioChange(i, 'hora_inicio', e.target.value)}
                        className="px-2 py-1.5 border border-border rounded-lg text-sm text-text-primary bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-text-secondary whitespace-nowrap">Fim</label>
                      <input
                        type="time"
                        value={dias[i].hora_fim}
                        onChange={(e) => handleHorarioChange(i, 'hora_fim', e.target.value)}
                        className="px-2 py-1.5 border border-border rounded-lg text-sm text-text-primary bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {horariosError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs font-medium">{horariosError}</p>
          </div>
        )}
        {horariosSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-xs font-medium">{horariosSuccess}</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveHorarios}
            disabled={savingHorarios || loadingHorarios}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {savingHorarios ? 'Salvando...' : 'Salvar Expediente'}
          </button>
        </div>
      </div>

      {/* Seção 2: Bloqueios e Folgas */}
      <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
        <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3">
          <CalendarOff className="w-5 h-5 text-rose-600" />
          Bloqueios e Folgas
        </h3>

        <form onSubmit={handleAddBloqueio} className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Data Início <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={novoDataInicio}
                onChange={(e) => setNovoDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Data Fim <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={novoDataFim}
                min={novoDataInicio || undefined}
                onChange={(e) => setNovoDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={novoMotivo}
                onChange={(e) => setNovoMotivo(e.target.value)}
                placeholder="Ex: Férias, feriado..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          </div>

          {bloqueioError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-xs font-medium">{bloqueioError}</p>
            </div>
          )}
          {bloqueioSuccess && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-xs font-medium">{bloqueioSuccess}</p>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={savingBloqueio}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {savingBloqueio ? 'Adicionando...' : 'Adicionar Bloqueio'}
            </button>
          </div>
        </form>

        {/* Lista de bloqueios */}
        <div className="mt-6 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
            Bloqueios Cadastrados
          </h4>

          {loadingBloqueios ? (
            <p className="text-sm text-text-secondary">Carregando...</p>
          ) : bloqueios.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum bloqueio cadastrado.</p>
            </div>
          ) : (
            bloqueios.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg bg-bg hover:border-rose-200 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDate(b.data_inicio)} a {formatDate(b.data_fim)}
                  </p>
                  {b.motivo && (
                    <p className="text-xs text-text-secondary mt-0.5">{b.motivo}</p>
                  )}
                </div>
                <button
                  onClick={() => setBloqueioToDelete(b)}
                  className="p-1.5 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  title="Excluir bloqueio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!bloqueioToDelete}
        onClose={() => setBloqueioToDelete(null)}
        onConfirm={handleDeleteBloqueio}
        title="Excluir Bloqueio"
        description={
          bloqueioToDelete
            ? `Tem certeza que deseja excluir o bloqueio de ${formatDate(bloqueioToDelete.data_inicio)} a ${formatDate(bloqueioToDelete.data_fim)}?`
            : ''
        }
        confirmText="Excluir"
      />
    </div>
  );
}
