import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import {
  Users,
  CalendarDays,
  Coins,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Briefcase,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

type PeriodType = 'hoje' | 'ontem' | '7dias' | 'esteMes' | 'mesPassado' | 'esteAno' | 'personalizado';

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getPeriodDates = (period: PeriodType, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (period) {
    case 'hoje':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'ontem':
      start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1); end.setHours(23, 59, 59, 999);
      break;
    case '7dias':
      start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'esteMes':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'mesPassado':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'esteAno':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'personalizado':
      if (customStart && customEnd) {
        const [sy, sm, sd] = customStart.split('-').map(Number);
        const [ey, em, ed] = customEnd.split('-').map(Number);
        start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
      break;
  }
  return { start, end };
};

const getWeekLabel = (date: Date, start: Date) => {
  const diffDays = Math.ceil(Math.abs(date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return 'Semana 1';
  if (diffDays <= 14) return 'Semana 2';
  if (diffDays <= 21) return 'Semana 3';
  return 'Semana 4';
};

export default function Relatorios() {
  const { estabelecimentoId, profile } = useAuth();
  const { autoStart } = useOnboarding('relatorios');
  useEffect(() => { if (profile) autoStart(); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps
  const [period, setPeriod] = useState<PeriodType>('esteMes');
  const [customStartDate, setCustomStartDate] = useState(() =>
    formatDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [customEndDate, setCustomEndDate] = useState(() => formatDateStr(new Date()));

  const [totalClients, setTotalClients] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [revenueTimeData, setRevenueTimeData] = useState<any[]>([]);
  const [appointmentsWeekdayData, setAppointmentsWeekdayData] = useState<any[]>([]);
  const [clientsNewRecurrentData, setClientsNewRecurrentData] = useState<any[]>([]);
  const [topServicesData, setTopServicesData] = useState<any[]>([]);
  const [faltasCancelamentosData, setFaltasCancelamentosData] = useState({ totalFaltas: 0, totalCancelamentos: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    if (!estabelecimentoId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { start, end } = getPeriodDates(period, customStartDate, customEndDate);
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      const [catsRes, servsRes] = await Promise.all([
        supabase.from('categorias_servico').select('id, nome').eq('estabelecimento_id', estabelecimentoId),
        supabase.from('servicos').select('id, nome, categoria_id').eq('estabelecimento_id', estabelecimentoId),
      ]);
      if (catsRes.error) throw catsRes.error;
      if (servsRes.error) throw servsRes.error;

      const categoryMap = new Map<string, string>();
      catsRes.data?.forEach(c => categoryMap.set(c.id, c.nome));
      const serviceMap = new Map<string, { nome: string }>();
      servsRes.data?.forEach(s => serviceMap.set(s.id, { nome: s.nome }));

      const [clientsRes, apptsRes, concludedRes, pendingRes, atendimentosRes] = await Promise.all([
        supabase.from('clientes').select('id, created_at').eq('estabelecimento_id', estabelecimentoId).gte('created_at', startIso).lte('created_at', endIso),
        supabase.from('agendamentos').select('id, data_hora, status').eq('estabelecimento_id', estabelecimentoId).gte('data_hora', startIso).lte('data_hora', endIso),
        supabase.from('agendamentos').select('id, cliente_id, data_hora, valor_cobrado, agendamento_servicos(servico_id, valor_cobrado)').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').gte('data_hora', startIso).lte('data_hora', endIso),
        supabase.from('agendamentos').select('id', { count: 'exact', head: true }).eq('estabelecimento_id', estabelecimentoId).eq('status', 'pendente'),
        supabase.from('atendimentos').select('id, data_atendimento, valor_cobrado').eq('estabelecimento_id', estabelecimentoId).gte('data_atendimento', startIso.split('T')[0]).lte('data_atendimento', endIso.split('T')[0]),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (apptsRes.error) throw apptsRes.error;
      if (concludedRes.error) throw concludedRes.error;

      const clientRecords = clientsRes.data || [];
      const apptRecords = apptsRes.data || [];
      const concludedRecords = concludedRes.data || [];
      const atendimentoRecords = atendimentosRes.data || [];

      const agendamentosRevenue = concludedRecords.reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      const atendimentosRevenue = atendimentoRecords.reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);

      setTotalClients(clientRecords.length);
      setTotalAppointments(apptRecords.length);
      setPendingAppointments(pendingRes.count ?? 0);
      setTotalEarned(agendamentosRevenue + atendimentosRevenue);

      // Revenue over time
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 31) {
        const dailyMap = new Map<string, number>();
        let cur = new Date(start);
        while (cur <= end) { dailyMap.set(formatDateStr(cur), 0); cur.setDate(cur.getDate() + 1); }
        concludedRecords.forEach(a => {
          const k = formatDateStr(new Date(a.data_hora));
          if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k)! + Number(a.valor_cobrado || 0));
        });
        atendimentoRecords.forEach(a => {
          const k = a.data_atendimento;
          if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k)! + Number(a.valor_cobrado || 0));
        });
        setRevenueTimeData(
          Array.from(dailyMap.entries()).map(([dateStr, valor]) => {
            const [, m, d] = dateStr.split('-');
            return { name: `${d}/${m}`, Valor: valor, dateStr };
          }).sort((a, b) => a.dateStr.localeCompare(b.dateStr))
        );
      } else {
        const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyMap = new Map<string, number>();
        let cur = new Date(start);
        while (cur <= end) {
          const mKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
          monthlyMap.set(mKey, 0);
          cur.setMonth(cur.getMonth() + 1);
        }
        concludedRecords.forEach(a => {
          const mKey = formatDateStr(new Date(a.data_hora)).substring(0, 7);
          if (monthlyMap.has(mKey)) monthlyMap.set(mKey, monthlyMap.get(mKey)! + Number(a.valor_cobrado || 0));
        });
        atendimentoRecords.forEach(a => {
          const mKey = a.data_atendimento.substring(0, 7);
          if (monthlyMap.has(mKey)) monthlyMap.set(mKey, monthlyMap.get(mKey)! + Number(a.valor_cobrado || 0));
        });
        setRevenueTimeData(
          Array.from(monthlyMap.entries()).map(([mKey, valor]) => {
            const [y, m] = mKey.split('-');
            return { name: `${MONTHS[parseInt(m) - 1]}/${y.substring(2)}`, Valor: valor, mKey };
          }).sort((a, b) => a.mKey.localeCompare(b.mKey))
        );
      }

      // Weekday distribution
      const wCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
      apptRecords.forEach(a => { const w = new Date(a.data_hora).getDay(); wCount[w as keyof typeof wCount]++; });
      setAppointmentsWeekdayData([
        { name: 'Seg', Quantidade: wCount[1] }, { name: 'Ter', Quantidade: wCount[2] },
        { name: 'Qua', Quantidade: wCount[3] }, { name: 'Qui', Quantidade: wCount[4] },
        { name: 'Sex', Quantidade: wCount[5] }, { name: 'Sáb', Quantidade: wCount[6] },
        { name: 'Dom', Quantidade: wCount[0] },
      ]);

      // New vs recurrent clients
      const uniqueIds = [...new Set(concludedRecords.map(a => a.cliente_id))];
      let recurrentSet = new Set<string>();
      if (uniqueIds.length > 0) {
        const { data: past } = await supabase.from('agendamentos').select('cliente_id').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').in('cliente_id', uniqueIds).lt('data_hora', startIso);
        past?.forEach(p => recurrentSet.add(p.cliente_id));
      }
      const clientFirstDate = new Map<string, string>();
      concludedRecords.forEach(a => {
        const ds = formatDateStr(new Date(a.data_hora));
        if (recurrentSet.has(a.cliente_id)) { clientFirstDate.set(a.cliente_id, 'past'); }
        else { const cur = clientFirstDate.get(a.cliente_id); if (!cur || ds < cur) clientFirstDate.set(a.cliente_id, ds); }
      });

      if (diffDays <= 7) {
        const slots = new Map<string, { Novos: Set<string>; Recorrentes: Set<string> }>();
        let cur = new Date(start);
        while (cur <= end) { slots.set(formatDateStr(cur), { Novos: new Set(), Recorrentes: new Set() }); cur.setDate(cur.getDate() + 1); }
        concludedRecords.forEach(a => {
          const ds = formatDateStr(new Date(a.data_hora));
          const slot = slots.get(ds);
          if (slot) { if (clientFirstDate.get(a.cliente_id) === ds) slot.Novos.add(a.cliente_id); else slot.Recorrentes.add(a.cliente_id); }
        });
        setClientsNewRecurrentData(Array.from(slots.entries()).map(([ds, s]) => { const [, m, d] = ds.split('-'); return { name: `${d}/${m}`, Novos: s.Novos.size, Recorrentes: s.Recorrentes.size, ds }; }).sort((a, b) => a.ds.localeCompare(b.ds)));
      } else if (diffDays <= 31) {
        const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        const slots = new Map<string, { Novos: Set<string>; Recorrentes: Set<string> }>();
        weeks.forEach(w => slots.set(w, { Novos: new Set(), Recorrentes: new Set() }));
        concludedRecords.forEach(a => {
          const wLabel = getWeekLabel(new Date(a.data_hora), start);
          const slot = slots.get(wLabel) || slots.get('Semana 4')!;
          const first = clientFirstDate.get(a.cliente_id);
          if (first !== 'past' && getWeekLabel(new Date(first! + 'T12:00:00'), start) === wLabel) slot.Novos.add(a.cliente_id);
          else slot.Recorrentes.add(a.cliente_id);
        });
        setClientsNewRecurrentData(weeks.map(w => ({ name: w, Novos: slots.get(w)!.Novos.size, Recorrentes: slots.get(w)!.Recorrentes.size })));
      } else {
        const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const slots = new Map<string, { Novos: Set<string>; Recorrentes: Set<string> }>();
        let cur = new Date(start);
        while (cur <= end) {
          const mKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
          slots.set(mKey, { Novos: new Set(), Recorrentes: new Set() });
          cur.setMonth(cur.getMonth() + 1);
        }
        concludedRecords.forEach(a => {
          const mKey = formatDateStr(new Date(a.data_hora)).substring(0, 7);
          const slot = slots.get(mKey);
          if (slot) {
            const first = clientFirstDate.get(a.cliente_id);
            if (first !== 'past' && first!.substring(0, 7) === mKey) slot.Novos.add(a.cliente_id);
            else slot.Recorrentes.add(a.cliente_id);
          }
        });
        setClientsNewRecurrentData(Array.from(slots.entries()).map(([mKey, s]) => { const [y, m] = mKey.split('-'); return { name: `${MONTHS[parseInt(m) - 1]}/${y.substring(2)}`, Novos: s.Novos.size, Recorrentes: s.Recorrentes.size, mKey }; }).sort((a, b) => a.mKey.localeCompare(b.mKey)));
      }

      // Top services
      const srvCounts = new Map<string, number>();
      concludedRecords.forEach(a => {
        (a.agendamento_servicos || []).forEach((as: any) => {
          const name = serviceMap.get(as.servico_id)?.nome || 'Serviço removido';
          srvCounts.set(name, (srvCounts.get(name) || 0) + 1);
        });
      });
      setTopServicesData(Array.from(srvCounts.entries()).map(([nome, quantidade]) => ({ name: nome, Quantidade: quantidade })).sort((a, b) => b.Quantidade - a.Quantidade).slice(0, 8).reverse());

      // Faltas e cancelamentos
      setFaltasCancelamentosData({
        totalFaltas: apptRecords.filter(a => a.status === 'falta').length,
        totalCancelamentos: apptRecords.filter(a => a.status === 'cancelado').length,
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha ao carregar os relatórios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (estabelecimentoId) fetchData();
  }, [period, customStartDate, customEndDate, estabelecimentoId]);

  const empty = (msg = 'Nenhum dado encontrado para o período.') => (
    <div className="flex flex-col items-center justify-center py-20 text-center text-text-muted bg-rose-50/5 border border-dashed border-border/60 rounded-xl h-[300px]">
      <Sparkles className="w-8 h-8 text-rose-200 mb-2.5 animate-pulse" />
      <p className="text-xs font-semibold">{msg}</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Filtro de período */}
      <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-title font-semibold text-2xl text-text-primary">Relatórios</h2>
            <p className="text-xs text-text-secondary mt-0.5">Selecione o período para filtrar as análises.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'hoje', label: 'Hoje' },
              { id: 'ontem', label: 'Ontem' },
              { id: '7dias', label: 'Últimos 7 dias' },
              { id: 'esteMes', label: 'Este mês' },
              { id: 'mesPassado', label: 'Mês passado' },
              { id: 'esteAno', label: 'Este ano' },
              { id: 'personalizado', label: 'Personalizado' },
            ] as { id: PeriodType; label: string }[]).map(item => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  period === item.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-bg text-text-secondary hover:text-rose-600 border border-border/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'personalizado' && (
          <div className="flex items-center gap-3 bg-bg/30 p-3 rounded-lg border border-border/40 w-fit animate-fade-in">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Início:</label>
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-2.5 py-1 border border-border rounded bg-white text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400" />
            </div>
            <span className="text-xs text-text-muted">—</span>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Fim:</label>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-2.5 py-1 border border-border rounded bg-white text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400" />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 text-text-secondary bg-surface border rounded-[14px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2" />
          <p className="text-sm">Carregando relatórios...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div id="ob-relatorios-kpis" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-white border border-border rounded-[14px] p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Valor Total Ganho</span>
                <p className="text-3xl font-title font-semibold text-rose-800">
                  R$ {totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-text-muted">Atendimentos finalizados</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-border rounded-[14px] p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Total de Agendamentos</span>
                <p className="text-3xl font-title font-semibold text-text-primary">{totalAppointments}</p>
                <p className="text-[10px] text-text-muted">Agendados no período</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-[14px] p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Aguardando Confirmação</span>
                <p className="text-3xl font-title font-semibold text-amber-700">{pendingAppointments}</p>
                <p className="text-[10px] text-amber-500">Agendamentos pendentes</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-border rounded-[14px] p-5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Novas Clientes</span>
                <p className="text-3xl font-title font-semibold text-text-primary">{totalClients}</p>
                <p className="text-[10px] text-text-muted">Cadastradas no período</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Receita ao longo do tempo */}
          <div id="ob-relatorios-graficos" className="bg-white border border-border rounded-[14px] p-5 shadow-sm">
            <h3 className="font-title font-semibold text-lg text-text-primary flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-rose-600" />
              Receita ao longo do tempo
            </h3>
            {revenueTimeData.length === 0 || revenueTimeData.every(d => d.Valor === 0) ? empty('Sem receita registrada no período selecionado.') : (
              <div className="h-[300px] w-full font-sans text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTimeData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(180,150,130,0.12)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="var(--text-secondary)" interval={Math.max(0, Math.ceil(revenueTimeData.length / 6) - 1)} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} stroke="var(--text-secondary)" tickFormatter={v => `R$ ${v}`} />
                    <Tooltip formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid rgba(180,150,130,0.2)' }} />
                    <Line type="monotone" dataKey="Valor" stroke="#A85560" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#A85560' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Agendamentos por dia da semana */}
            <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm">
              <h3 className="font-title font-semibold text-lg text-text-primary flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-rose-600" />
                Agendamentos por dia da semana
              </h3>
              {appointmentsWeekdayData.every(d => d.Quantidade === 0) ? empty('Sem agendamentos no período selecionado.') : (
                <div className="h-[300px] w-full font-sans text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentsWeekdayData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(180,150,130,0.12)" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                      <YAxis tickLine={false} axisLine={false} stroke="var(--text-secondary)" allowDecimals={false} />
                      <Tooltip formatter={v => [v, 'Agendamentos']} contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid rgba(180,150,130,0.2)' }} />
                      <Bar dataKey="Quantidade" fill="#C9A96E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Clientes novas vs fiéis */}
            <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm">
              <h3 className="font-title font-semibold text-lg text-text-primary flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-rose-600" />
                Clientes Novas vs Fiéis
              </h3>
              {clientsNewRecurrentData.every(d => d.Novos === 0 && d.Recorrentes === 0) ? empty('Sem atendimentos de clientes no período.') : (
                <div className="h-[300px] w-full font-sans text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientsNewRecurrentData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(180,150,130,0.12)" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
                      <YAxis tickLine={false} axisLine={false} stroke="var(--text-secondary)" allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid rgba(180,150,130,0.2)' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar dataKey="Novos" stackId="a" fill="#A85560" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Recorrentes" stackId="a" fill="#B0A097" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Serviços mais realizados */}
            <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm">
              <h3 className="font-title font-semibold text-lg text-text-primary flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-rose-600" />
                Serviços mais realizados
              </h3>
              {topServicesData.length === 0 ? empty('Sem atendimentos registrados no período.') : (
                <div className="h-[300px] w-full font-sans text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topServicesData} margin={{ top: 10, right: 15, left: 25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(180,150,130,0.12)" />
                      <XAxis type="number" tickLine={false} axisLine={false} stroke="var(--text-secondary)" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} stroke="var(--text-secondary)" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={v => [v, 'Realizado']} contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid rgba(180,150,130,0.2)' }} />
                      <Bar dataKey="Quantidade" fill="#7A2E38" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Faltas e cancelamentos */}
            <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm">
              <h3 className="font-title font-semibold text-lg text-text-primary flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Faltas e Cancelamentos
              </h3>
              <p className="text-xs text-text-secondary mb-6">Agendamentos perdidos no período selecionado.</p>
              {faltasCancelamentosData.totalFaltas === 0 && faltasCancelamentosData.totalCancelamentos === 0 ? empty('Nenhuma falta ou cancelamento no período.') : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-xl p-6 gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Faltas (No-show)</p>
                    <p className="font-title font-bold text-4xl text-red-600">{faltasCancelamentosData.totalFaltas}</p>
                    <p className="text-[10px] text-text-muted">cliente não apareceu</p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-xl p-6 gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cancelamentos</p>
                    <p className="font-title font-bold text-4xl text-gray-600">{faltasCancelamentosData.totalCancelamentos}</p>
                    <p className="text-[10px] text-text-muted">agendamentos cancelados</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
}
