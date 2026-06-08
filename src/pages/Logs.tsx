import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  History,
  Clock,
  User
} from 'lucide-react';
import type { Log } from '../types';

type PeriodType = 'hoje' | 'ontem' | '7dias' | 'esteMes' | 'mesPassado' | 'esteAno' | 'personalizado';
type ActionType = 'todos' | 'criou' | 'editou' | 'excluiu';

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
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case '7dias':
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
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

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters state
  const [period, setPeriod] = useState<PeriodType>('esteMes');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    return formatDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [customEndDate, setCustomEndDate] = useState(() => formatDateStr(new Date()));
  
  const [selectedUser, setSelectedUser] = useState<string>('todos');
  const [userDropdownList, setUserDropdownList] = useState<string[]>([]);
  
  const [selectedAction, setSelectedAction] = useState<ActionType>('todos');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Base query with counts
      let query = supabase
        .from('logs')
        .select('*', { count: 'exact' });

      // 2. Filter by date boundaries
      const { start, end } = getPeriodDates(period, customStartDate, customEndDate);
      query = query
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // 3. Filter by User if selected
      if (selectedUser !== 'todos') {
        query = query.eq('usuario_nome', selectedUser);
      }

      // 4. Filter by Action type if selected
      if (selectedAction !== 'todos') {
        query = query.eq('acao', selectedAction);
      }

      // 5. Ordering and pagination range
      const fromIndex = (currentPage - 1) * itemsPerPage;
      const toIndex = fromIndex + itemsPerPage - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(fromIndex, toIndex);

      if (error) throw error;
      setLogs(data || []);
      setTotalRecords(count || 0);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
      setErrorMessage('Falha ao carregar os logs de atividade do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterDropdownData = async () => {
    try {
      // Load user names from DB
      const { data: usersData } = await supabase
        .from('usuarios')
        .select('nome');

      const names = usersData?.map(u => u.nome) || [];
      // Combine with historic/mock names to ensure all filters function
      const combined = Array.from(new Set(['Dra. Amanda Rosa', 'Usuário do Sistema', ...names]));
      setUserDropdownList(combined);
    } catch (err) {
      console.error('Erro ao carregar filtros de usuários:', err);
    }
  };

  useEffect(() => {
    loadFilterDropdownData();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [period, customStartDate, customEndDate, selectedUser, selectedAction, currentPage]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [period, customStartDate, customEndDate, selectedUser, selectedAction]);

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  const getActionBadgeStyle = (acao: string) => {
    switch (acao) {
      case 'criou':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'editou':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'excluiu':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
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

      {/* Header and Control Box */}
      <div className="bg-white border border-border rounded-[14px] p-5 shadow-sm space-y-5">
        <div>
          <h2 className="font-title font-semibold text-2xl text-text-primary">Logs de Atividade</h2>
          <p className="text-xs text-text-secondary mt-0.5">Auditoria e histórico de modificações realizadas no sistema.</p>
        </div>

        {/* Filters Grid */}
        <div className="space-y-4 pt-1 border-t border-border/60">
          
          {/* Period selector row */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-rose-600" />
              Período de Auditoria
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'hoje', label: 'Hoje' },
                { id: 'ontem', label: 'Ontem' },
                { id: '7dias', label: 'Últimos 7 dias' },
                { id: 'esteMes', label: 'Este mês' },
                { id: 'mesPassado', label: 'Mês passado' },
                { id: 'esteAno', label: 'Este ano' },
                { id: 'personalizado', label: 'Personalizado' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPeriod(item.id as PeriodType)}
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

          {/* Custom Datepicker bounds */}
          {period === 'personalizado' && (
            <div className="flex items-center gap-3 bg-bg/30 p-3 rounded-lg border border-border/40 w-fit animate-fade-in">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Início:</label>
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 border border-border rounded bg-white text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
              <span className="text-xs text-text-muted">—</span>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Fim:</label>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 border border-border rounded bg-white text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>
          )}

          {/* User and Action Dropdown row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {/* User filter select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-rose-600" />
                Filtrar por Usuário
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
              >
                <option value="todos">Todos os Usuários</option>
                {userDropdownList.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Action filter select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-600" />
                Filtrar por Tipo de Ação
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
              >
                <option value="todos">Todas as Ações</option>
                <option value="criou">Criou</option>
                <option value="editou">Editou</option>
                <option value="excluiu">Excluiu</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Logs Table Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary bg-white border border-border rounded-[14px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2"></div>
          <p className="text-sm">Carregando logs de auditoria...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-border rounded-[14px] p-12 text-center text-text-secondary shadow-sm">
          <History className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="font-title font-medium text-lg text-text-primary">Nenhum log de atividade registrado</p>
          <p className="text-sm text-text-muted mt-1">Nenhuma modificação corresponde aos filtros ativos no período.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[14px] overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-50/10 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="px-6 py-4">Data e Hora</th>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Entidade</th>
                  <th className="px-6 py-4">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => {
                  const logDate = log.created_at ? new Date(log.created_at) : null;
                  const formattedDate = logDate 
                    ? `${logDate.toLocaleDateString('pt-BR')} ${logDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                    : 'N/A';
                  
                  return (
                    <tr key={log.id} className="hover:bg-bg/10 transition-colors">
                      {/* DateTime */}
                      <td className="px-6 py-4 text-xs font-semibold text-text-secondary">
                        {formattedDate}
                      </td>
                      {/* User */}
                      <td className="px-6 py-4 text-sm font-semibold text-text-primary">
                        {log.usuario_nome}
                      </td>
                      {/* Action Type Badge */}
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${getActionBadgeStyle(log.acao)}`}>
                          {log.acao}
                        </span>
                      </td>
                      {/* Entity */}
                      <td className="px-6 py-4 text-xs font-semibold text-rose-800 uppercase tracking-wide">
                        {log.entidade}
                      </td>
                      {/* Description */}
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {log.descricao}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between text-xs text-text-secondary bg-rose-50/5">
              <span>Página {currentPage} de {totalPages} ({totalRecords} logs no total)</span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-border rounded-lg bg-white hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-border rounded-lg bg-white hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
