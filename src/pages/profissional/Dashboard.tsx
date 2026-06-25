import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import PushPermissionBanner from '../../components/common/PushPermissionBanner';
import InstallBanner from '../../components/common/InstallBanner';
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Coins,
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Tag,
  UserPlus,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from 'recharts';

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const WEEK_DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const getDateString = () => {
  const now = new Date();
  return `${WEEK_DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS_PT[now.getMonth()]}`;
};

export default function Dashboard() {
  const { estabelecimentoId, profile } = useAuth();
  const navigate = useNavigate();
  const { autoStart } = useOnboarding('meu_estudio');

  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [heroRevenue, setHeroRevenue] = useState(0);
  const [heroNewClients, setHeroNewClients] = useState(0);
  const [last7DaysRevData, setLast7DaysRevData] = useState<{ name: string; Valor: number }[]>([]);
  const [revenueGrowth, setRevenueGrowth] = useState<number | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);

  const firstName = profile?.nome?.split(' ')[0] || '';

  // Dispara o tour de onboarding na primeira visita
  useEffect(() => {
    if (!profile) return;
    autoStart();
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    if (!estabelecimentoId) return;
    setHeroLoading(true);
    setLoading(true);
    setErrorMsg(null);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const last7End = new Date(); last7End.setHours(23, 59, 59, 999);
      const last7Start = new Date(); last7Start.setDate(now.getDate() - 6); last7Start.setHours(0, 0, 0, 0);
      const prev7End = new Date(); prev7End.setDate(now.getDate() - 7); prev7End.setHours(23, 59, 59, 999);
      const prev7Start = new Date(); prev7Start.setDate(now.getDate() - 13); prev7Start.setHours(0, 0, 0, 0);

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      const monthStartDate = monthStart.split('T')[0];
      const monthEndDate = monthEnd.split('T')[0];
      const last7StartDate = formatDateStr(last7Start);
      const last7EndDate = formatDateStr(last7End);
      const prev7StartDate = formatDateStr(prev7Start);
      const prev7EndDate = formatDateStr(prev7End);

      const [monthRevRes, newClientsRes, last7Res, prev7Res, pendingRes, todayRes,
             monthAtendRes, last7AtendRes, prev7AtendRes] = await Promise.all([
        supabase.from('agendamentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').gte('data_hora', monthStart).lte('data_hora', monthEnd),
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estabelecimento_id', estabelecimentoId).gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('agendamentos').select('data_hora, valor_cobrado').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').gte('data_hora', last7Start.toISOString()).lte('data_hora', last7End.toISOString()),
        supabase.from('agendamentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').gte('data_hora', prev7Start.toISOString()).lte('data_hora', prev7End.toISOString()),
        supabase.from('agendamentos').select('id', { count: 'exact', head: true }).eq('estabelecimento_id', estabelecimentoId).eq('status', 'pendente'),
        supabase.from('agendamentos').select(`id, data_hora, status, cliente:clientes(id, nome, sobrenome), agendamento_servicos(servico:servicos(nome))`).eq('estabelecimento_id', estabelecimentoId).gte('data_hora', todayStart).lte('data_hora', todayEnd).neq('status', 'cancelado').order('data_hora', { ascending: true }),
        supabase.from('atendimentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).gte('data_atendimento', monthStartDate).lte('data_atendimento', monthEndDate),
        supabase.from('atendimentos').select('data_atendimento, valor_cobrado').eq('estabelecimento_id', estabelecimentoId).gte('data_atendimento', last7StartDate).lte('data_atendimento', last7EndDate),
        supabase.from('atendimentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).gte('data_atendimento', prev7StartDate).lte('data_atendimento', prev7EndDate),
      ]);

      const agendMonthRev = (monthRevRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      const atendMonthRev = (monthAtendRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      setHeroRevenue(agendMonthRev + atendMonthRev);
      setHeroNewClients(newClientsRes.count ?? 0);
      setPendingAppointments(pendingRes.count ?? 0);
      setTodayAppointments(todayRes.data || []);

      const last7Rev = (last7Res.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0)
                     + (last7AtendRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      const prev7Rev = (prev7Res.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0)
                     + (prev7AtendRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      if (prev7Rev > 0) setRevenueGrowth(((last7Rev - prev7Rev) / prev7Rev) * 100);
      else if (last7Rev > 0) setRevenueGrowth(100);
      else setRevenueGrowth(null);

      const dailyMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        dailyMap.set(formatDateStr(d), 0);
      }
      (last7Res.data || []).forEach(a => {
        const k = formatDateStr(new Date(a.data_hora));
        if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k)! + Number(a.valor_cobrado || 0));
      });
      (last7AtendRes.data || []).forEach(a => {
        const k = a.data_atendimento;
        if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k)! + Number(a.valor_cobrado || 0));
      });
      setLast7DaysRevData(
        Array.from(dailyMap.entries()).map(([dateStr, valor]) => ({
          name: dateStr.slice(8) + '/' + dateStr.slice(5, 7),
          Valor: valor,
        }))
      );

    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao carregar dados da tela inicial.');
    } finally {
      setHeroLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (estabelecimentoId) fetchData();
  }, [estabelecimentoId]);

  const quickActions = [
    { label: 'Novo Agendamento', id: 'onboarding-btn-novo-agendamento', Icon: CalendarCheck, to: '/agendamentos', state: {} },
    { label: 'Bloquear Horário', id: 'onboarding-btn-bloquear', Icon: CalendarX, to: '/meus-horarios', state: {} },
    { label: 'Novo Serviço', id: 'onboarding-btn-novo-servico', Icon: Tag, to: '/servicos', state: {} },
    { label: 'Ver Agenda do Dia', id: 'onboarding-btn-agenda-dia', Icon: CalendarDays, to: '/agendamentos', state: { filterToday: true } },
  ];

  return (
    <div className="space-y-6">

      <PushPermissionBanner />
      <InstallBanner />

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* ── BANNER DE SAUDAÇÃO ── */}
      <div className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}>
        <div className="absolute top-4 right-5 text-white/50 pointer-events-none select-none leading-none text-lg font-light">
          ✦<br /><span className="text-sm">✦</span>
        </div>
        <h1 className="font-title font-bold text-3xl md:text-4xl">
          {getGreeting()}{firstName ? `, ${firstName}!` : '!'}
        </h1>
        <p className="text-sm text-white/70 mt-1.5">
          Aqui está o resumo do seu dia — {getDateString()}.
        </p>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <div id="onboarding-card-faturamento" className="bg-white border border-border rounded-2xl p-4 flex items-start justify-between shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted leading-tight">Faturamento do Mês</p>
            <p className="font-title font-semibold text-2xl text-rose-600 mt-1.5">
              {heroLoading ? '—' : `R$ ${heroRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 flex-shrink-0 ml-2">
            <Coins className="w-4 h-4" />
          </div>
        </div>

        <div
          id="onboarding-card-hoje"
          onClick={() => navigate('/agendamentos', { state: { filterToday: true } })}
          className="bg-white border border-border rounded-2xl p-4 flex items-start justify-between shadow-sm cursor-pointer hover:border-rose-200 hover:shadow-md transition-all"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted leading-tight">Agendamentos Hoje</p>
            <p className="font-title font-semibold text-2xl text-text-primary mt-1.5">
              {loading ? '—' : todayAppointments.length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 flex-shrink-0 ml-2">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>

        <div
          id="onboarding-card-pendentes"
          onClick={() => pendingAppointments > 0 && navigate('/agendamentos', { state: { openPending: true } })}
          className={`bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between shadow-sm ${pendingAppointments > 0 ? 'cursor-pointer hover:bg-amber-100/60 transition-colors' : ''}`}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 leading-tight">Aguardando Confirmação</p>
            <p className="font-title font-semibold text-2xl text-amber-700 mt-1.5">
              {loading ? '—' : pendingAppointments}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 flex-shrink-0 ml-2">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div id="onboarding-card-clientes" className="bg-white border border-border rounded-2xl p-4 flex items-start justify-between shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted leading-tight">Novas Clientes</p>
            <p className="font-title font-semibold text-2xl text-text-primary mt-1.5">
              {heroLoading ? '—' : heroNewClients}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 flex-shrink-0 ml-2">
            <UserPlus className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* ── AÇÕES RÁPIDAS + PRÓXIMOS ATENDIMENTOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div>
            <h2 className="font-sans font-semibold text-base text-text-primary mb-3">Ações Rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, id, Icon, to, state }) => (
                <button
                  key={label}
                  id={id}
                  onClick={() => navigate(to, { state })}
                  className="hover:brightness-95 active:brightness-90 text-white rounded-2xl p-5 flex flex-col items-start gap-4 transition-all cursor-pointer shadow-sm text-left"
                  style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
                >
                  <Icon className="w-5 h-5 opacity-90" />
                  <span className="font-semibold text-sm leading-snug">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mini Revenue Chart */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans font-semibold text-sm text-text-primary">Receita · últimos 7 dias</span>
              {revenueGrowth !== null && (
                <span className={`text-xs font-bold flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {revenueGrowth >= 0
                    ? <TrendingUp className="w-3.5 h-3.5" />
                    : <TrendingDown className="w-3.5 h-3.5" />
                  }
                  {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(0)}%
                </span>
              )}
            </div>
            {heroLoading ? (
              <div className="h-[100px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-600" />
              </div>
            ) : (
              <div className="h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7DaysRevData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid rgba(180,150,130,0.2)', fontSize: 11 }}
                    />
                    <Line type="monotone" dataKey="Valor" stroke="var(--rose-600)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--rose-600)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* Right column: Próximos atendimentos */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col">
          <h2 className="font-sans font-semibold text-base text-text-primary flex items-center gap-2 mb-4 flex-shrink-0">
            <CalendarDays className="w-4 h-4 text-rose-600" />
            Próximos atendimentos de hoje
          </h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600" />
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-text-muted border border-dashed border-border/60 rounded-xl">
              <Sparkles className="w-6 h-6 text-rose-200 mb-2" />
              <p className="text-xs font-semibold">Nenhum atendimento hoje.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {todayAppointments.map((appt: any) => {
                const hora = new Date(appt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const cliente = appt.cliente;
                const servicos = (appt.agendamento_servicos || []).map((as: any) => as.servico?.nome).filter(Boolean).join(', ');
                const isPending = appt.status === 'pendente';
                const isFalta = appt.status === 'falta';
                return (
                  <div
                    key={appt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors 
                      ${isPending ? 'border-amber-200 bg-amber-50/40' : 
                        isFalta ? 'border-red-200 bg-red-50/30 hover:bg-red-50/50' : 
                        'border-border bg-bg/30 hover:bg-bg/60'}`}
                  >
                    <span className={`text-sm font-title font-bold w-11 flex-shrink-0 
                      ${isPending ? 'text-amber-700' : isFalta ? 'text-red-700' : 'text-rose-600'}`}
                    >
                      {hora}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {cliente?.nome} {cliente?.sobrenome}
                      </p>
                      <p className="text-[11px] text-text-secondary truncate">{servicos || 'Sem serviços'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap
                      ${appt.status === 'confirmado' ? 'bg-green-100 text-green-700' : ''}
                      ${appt.status === 'pendente' ? 'bg-amber-100 text-amber-700' : ''}
                      ${appt.status === 'concluido' ? 'bg-blue-100 text-blue-700' : ''}
                      ${appt.status === 'falta' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {appt.status === 'confirmado' ? 'Confirmado' : 
                       appt.status === 'pendente' ? 'Aguardando' : 
                       appt.status === 'falta' ? 'Falta' : 'Concluído'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
