import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  Clock, 
  AlertCircle, 
  X, 
  UserPlus,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import type { Profissional, HorarioProfissional } from '../types';
import { registrarLog } from '../utils/log';

interface HorarioDia {
  ativo: boolean;
  hora_inicio: string;
  hora_fim: string;
}

interface ProfissionalWithHorarios extends Profissional {
  horarios_profissional?: HorarioProfissional[];
}

const DIAS_SEMANA = [
  { valor: 0, nome: 'Domingo', sigla: 'Dom' },
  { valor: 1, nome: 'Segunda-feira', sigla: 'Seg' },
  { valor: 2, nome: 'Terça-feira', sigla: 'Ter' },
  { valor: 3, nome: 'Quarta-feira', sigla: 'Qua' },
  { valor: 4, nome: 'Quinta-feira', sigla: 'Qui' },
  { valor: 5, nome: 'Sexta-feira', sigla: 'Sex' },
  { valor: 6, nome: 'Sábado', sigla: 'Sáb' }
];

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState<ProfissionalWithHorarios[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState<ProfissionalWithHorarios | null>(null);

  // Form States
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  
  // Weekly hours state mapping index 0-6 (Sunday-Saturday)
  const [horarios, setHorarios] = useState<Record<number, HorarioDia>>({
    0: { ativo: false, hora_inicio: '09:00', hora_fim: '18:00' },
    1: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
    2: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
    3: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
    4: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
    5: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
    6: { ativo: false, hora_inicio: '09:00', hora_fim: '14:00' }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*, horarios_profissional(*)')
        .order('nome', { ascending: true });

      if (error) throw error;
      setProfissionais(data || []);
    } catch (err) {
      console.error('Erro ao carregar profissionais:', err);
      showTemporaryError('Falha ao carregar profissionais do banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };



  const handleOpenModal = (prof: ProfissionalWithHorarios | null = null) => {
    if (prof) {
      setEditingProfissional(prof);
      setNome(prof.nome);
      setSobrenome(prof.sobrenome);

      // Map existing schedules
      const currentHorarios = { ...horarios };
      // Reset all days to inactive first
      Object.keys(currentHorarios).forEach(key => {
        currentHorarios[Number(key)] = {
          ativo: false,
          hora_inicio: '09:00',
          hora_fim: '18:00'
        };
      });

      if (prof.horarios_profissional) {
        prof.horarios_profissional.forEach(h => {
          currentHorarios[h.dia_semana] = {
            ativo: true,
            hora_inicio: h.hora_inicio.substring(0, 5), // Format "HH:MM:SS" to "HH:MM"
            hora_fim: h.hora_fim.substring(0, 5)
          };
        });
      }
      setHorarios(currentHorarios);
    } else {
      setEditingProfissional(null);
      setNome('');
      setSobrenome('');
      // Set default hours (Monday to Friday active)
      setHorarios({
        0: { ativo: false, hora_inicio: '09:00', hora_fim: '18:00' },
        1: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
        2: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
        3: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
        4: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
        5: { ativo: true, hora_inicio: '09:00', hora_fim: '18:00' },
        6: { ativo: false, hora_inicio: '09:00', hora_fim: '14:00' }
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleDay = (dia: number) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        ativo: !prev[dia].ativo
      }
    }));
  };

  const handleHourChange = (dia: number, field: 'hora_inicio' | 'hora_fim', val: string) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [field]: val
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!nome.trim() || !sobrenome.trim()) {
      showTemporaryError('Nome e sobrenome são obrigatórios.');
      return;
    }

    const activeDays = Object.entries(horarios).filter(([_, h]) => h.ativo);
    if (activeDays.length === 0) {
      showTemporaryError('Você deve configurar o horário de atendimento de pelo menos 1 dia.');
      return;
    }

    // Check time conflicts (hora_fim must be > hora_inicio)
    for (const [diaIndex, val] of activeDays) {
      if (val.hora_fim <= val.hora_inicio) {
        const dayName = DIAS_SEMANA[Number(diaIndex)].nome;
        showTemporaryError(`No(a) ${dayName}, o horário de término deve ser posterior ao horário de início.`);
        return;
      }
    }

    try {
      let profissionalId = '';

      if (editingProfissional) {
        // Edit professional
        const { error } = await supabase
          .from('profissionais')
          .update({ nome, sobrenome })
          .eq('id', editingProfissional.id);

        if (error) throw error;
        profissionalId = editingProfissional.id;
        await registrarLog('editou', 'profissional', profissionalId, `Editou dados de "${nome} ${sobrenome}"`);
      } else {
        // Create professional
        const { data, error } = await supabase
          .from('profissionais')
          .insert({ nome, sobrenome })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Falha ao criar profissional.');
        profissionalId = data.id;
        await registrarLog('criou', 'profissional', profissionalId, `Cadastrou profissional "${nome} ${sobrenome}"`);
      }

      // Sync schedule: delete previous and insert new active ones
      await supabase
        .from('horarios_profissional')
        .delete()
        .eq('profissional_id', profissionalId);

      const inserts = activeDays.map(([dia, h]) => ({
        profissional_id: profissionalId,
        dia_semana: Number(dia),
        hora_inicio: `${h.hora_inicio}:00`,
        hora_fim: `${h.hora_fim}:00`
      }));

      const { error: schedulesError } = await supabase
        .from('horarios_profissional')
        .insert(inserts);

      if (schedulesError) throw schedulesError;

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao salvar profissional e horários.');
    }
  };

  const handleToggleStatus = async (prof: Profissional) => {
    const newStatus = !prof.ativo;
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({ ativo: newStatus })
        .eq('id', prof.id);

      if (error) throw error;
      await registrarLog(
        'editou', 
        'profissional', 
        prof.id, 
        `${newStatus ? 'Ativou' : 'Desativou'} profissional "${prof.nome} ${prof.sobrenome}"`
      );
      fetchData();
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao alternar status do profissional.');
    }
  };

  const handleDelete = async (prof: ProfissionalWithHorarios) => {
    try {
      // Rule: cannot delete professional with future appointments
      const { count, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('profissional_id', prof.id)
        .gte('data_hora', new Date().toISOString());

      if (appointmentsError) throw appointmentsError;

      if (count && count > 0) {
        showTemporaryError(`Não é permitido excluir "${prof.nome} ${prof.sobrenome}" pois ela possui ${count} agendamentos futuros.`);
        return;
      }

      if (!confirm(`Tem certeza que deseja excluir permanentemente a profissional "${prof.nome} ${prof.sobrenome}" e toda sua agenda?`)) return;

      const { error: delError } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', prof.id);

      if (delError) throw delError;

      await registrarLog('excluiu', 'profissional', prof.id, `Excluiu profissional "${prof.nome} ${prof.sobrenome}"`);
      fetchData();
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao verificar agendamentos ou excluir profissional.');
    }
  };

  // Helper to format days listing for the card
  const getDaysSummary = (horariosList?: HorarioProfissional[]) => {
    if (!horariosList || horariosList.length === 0) {
      return <span className="text-text-muted italic">Nenhum dia configurado</span>;
    }

    // Sort Sunday(0) to Saturday(6)
    const sorted = [...horariosList].sort((a, b) => a.dia_semana - b.dia_semana);
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {sorted.map(h => {
          const sigla = DIAS_SEMANA[h.dia_semana].sigla;
          const start = h.hora_inicio.substring(0, 5);
          const end = h.hora_fim.substring(0, 5);
          return (
            <span 
              key={h.id} 
              className="text-[10px] font-medium bg-rose-50 border border-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1"
              title={`${DIAS_SEMANA[h.dia_semana].nome}: ${start} - ${end}`}
            >
              <span className="font-semibold">{sigla}:</span>
              <span>{start}-{end}</span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Errors */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-border rounded-[14px] p-5 shadow-sm">
        <div>
          <h2 className="font-title font-semibold text-xl text-text-primary">Gerenciamento de Profissionais</h2>
          <p className="text-xs text-text-secondary mt-0.5">Cadastre profissionais e gerencie seus expedientes de atendimento.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Profissional
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2"></div>
          <p className="text-sm">Carregando profissionais...</p>
        </div>
      ) : profissionais.length === 0 ? (
        <div className="bg-white border border-border rounded-[14px] p-12 text-center text-text-secondary">
          <UserPlus className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="font-title font-medium text-lg text-text-primary">Nenhuma profissional cadastrada</p>
          <p className="text-sm text-text-muted mt-1">Clique no botão acima para adicionar a primeira profissional à clínica.</p>
        </div>
      ) : (
        /* Professionals Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profissionais.map(prof => {
            const initials = `${prof.nome[0] || ''}${prof.sobrenome[0] || ''}`.toUpperCase();
            return (
              <div 
                key={prof.id} 
                className={`bg-white border border-border rounded-[14px] p-5 flex flex-col justify-between shadow-sm transition-opacity duration-300 relative overflow-hidden ${!prof.ativo ? 'opacity-65 bg-gray-50/50' : ''}`}
              >
                {/* Status indicator pill top-right */}
                <span className={`absolute top-4 right-4 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${prof.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {prof.ativo ? 'Ativa' : 'Inativa'}
                </span>

                <div className="space-y-4">
                  {/* Card Header (Avatar + Name) */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-center font-title font-bold text-lg">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-title font-semibold text-lg text-text-primary">
                        {prof.nome} {prof.sobrenome}
                      </h3>
                      <p className="text-[10px] font-sans font-medium text-text-muted uppercase tracking-wide flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-rose-400" />
                        Profissional de Estética
                      </p>
                    </div>
                  </div>

                  {/* Configured hours summary */}
                  <div className="border-t border-border/60 pt-3">
                    <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-text-muted" />
                      Horários de Atendimento
                    </p>
                    {getDaysSummary(prof.horarios_profissional)}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="border-t border-border/60 mt-5 pt-3 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleOpenModal(prof)}
                    className="p-1.5 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Editar Profissional e Agenda"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(prof)}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${prof.ativo ? 'text-green-600 hover:bg-green-50' : 'text-text-muted hover:bg-gray-100'}`}
                    title={prof.ativo ? 'Desativar Profissional' : 'Ativar Profissional'}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <div className="relative group">
                    <button
                      onClick={() => handleDelete(prof)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Excluir Profissional"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {/* Tooltip trigger handles verification error, but let's have a help text */}
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-text-primary text-white text-[11px] rounded shadow-lg z-10 font-sans leading-relaxed">
                      Não é permitido excluir profissionais com agendamentos futuros. Desative-a em vez disso.
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-xl overflow-hidden my-8 animate-slide-up">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-rose-50/10">
              <h4 className="font-title font-semibold text-lg text-text-primary">
                {editingProfissional ? 'Editar Profissional' : 'Nova Profissional'}
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-secondary hover:text-rose-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Personal Data Section */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border pb-1">Dados Pessoais</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Amanda"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Sobrenome <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Rosa"
                      value={sobrenome}
                      onChange={(e) => setSobrenome(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Section */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border pb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  Horários de Atendimento Semanal
                </p>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {DIAS_SEMANA.map(dia => {
                    const hDia = horarios[dia.valor];
                    return (
                      <div 
                        key={dia.valor} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all duration-200 ${hDia.ativo ? 'bg-rose-50/20 border-rose-200' : 'bg-gray-50/50 border-border opacity-60'}`}
                      >
                        {/* Day toggle switch */}
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={hDia.ativo}
                            onChange={() => handleToggleDay(dia.valor)}
                            className="w-4.5 h-4.5 accent-rose-600 cursor-pointer"
                            id={`day-${dia.valor}`}
                          />
                          <label 
                            htmlFor={`day-${dia.valor}`}
                            className={`text-sm font-semibold cursor-pointer ${hDia.ativo ? 'text-text-primary' : 'text-text-secondary'}`}
                          >
                            {dia.nome}
                          </label>
                        </div>

                        {/* Hour pickers (start/end) */}
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            disabled={!hDia.ativo}
                            value={hDia.hora_inicio}
                            onChange={(e) => handleHourChange(dia.valor, 'hora_inicio', e.target.value)}
                            className="px-2 py-1.5 border border-border rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 disabled:opacity-50 disabled:bg-bg"
                          />
                          <span className="text-xs text-text-muted">até</span>
                          <input 
                            type="time" 
                            disabled={!hDia.ativo}
                            value={hDia.hora_fim}
                            onChange={(e) => handleHourChange(dia.valor, 'hora_fim', e.target.value)}
                            className="px-2 py-1.5 border border-border rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 disabled:opacity-50 disabled:bg-bg"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-bg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
