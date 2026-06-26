import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  Search,
  AlertCircle,
  Sparkles,
  Clock,
  Coins,
  X,
  PlusCircle,
  HelpCircle,
  ImagePlus,
  Tag,
} from 'lucide-react';
import type { CategoriaServico, Servico, VariacaoServico } from '../../types';
import { registrarLog } from '../../utils/log';
import ConfirmModal from '../../components/common/ConfirmModal';
import { compressImage } from '../../utils/imageCompression';

// Extend types to include relations
interface VariacaoInput {
  id?: string;
  nome: string;
  valor: number | '';
}

interface ServicoWithRelations extends Servico {
  variacoes_servico?: VariacaoServico[];
  _count_atendimentos?: number;
  _count_agendamentos?: number;
}

interface CategoriaWithRelations extends CategoriaServico {
  servicos: ServicoWithRelations[];
}

export default function Servicos() {
  const { estabelecimentoId, profile } = useAuth();
  const { autoStart } = useOnboarding('servicos');
  useEffect(() => { if (profile) autoStart(); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps
  const [categorias, setCategorias] = useState<CategoriaWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');

  // Modals state
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isServicoModalOpen, setIsServicoModalOpen] = useState(false);

  // Selected items for editing
  const [editingCategoria, setEditingCategoria] = useState<CategoriaServico | null>(null);
  const [editingServico, setEditingServico] = useState<ServicoWithRelations | null>(null);

  // Form states - Categoria
  const [categoriaNome, setCategoriaNome] = useState('');

  // Form states - Servico
  const [servicoNome, setServicoNome] = useState('');
  const [servicoDescricao, setServicoDescricao] = useState('');
  const [servicoCategoriaId, setServicoCategoriaId] = useState('');
  const [servicoDuracao, setServicoDuracao] = useState<number | ''>(30);
  const [servicoValor, setServicoValor] = useState<number | ''>(100.0);
  const [servicoVariacoes, setServicoVariacoes] = useState<VariacaoInput[]>([]);

  // Imagem do serviço
  const [servicoImagemFile, setServicoImagemFile] = useState<File | null>(null);
  const [servicoImagemPreviewUrl, setServicoImagemPreviewUrl] = useState<string | null>(null);
  const [removerImagem, setRemoverImagem] = useState(false);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const imagemFileInputRef = useRef<HTMLInputElement>(null);

  // Tooltip / Notification state for delete locks
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline errors inside modals
  const [categoriaError, setCategoriaError] = useState<string | null>(null);
  const [servicoError, setServicoError] = useState<string | null>(null);

  // Confirm Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    description: string;
    warningText?: string;
    onConfirm: () => void;
  } | null>(null);

  const openConfirmModal = (config: typeof confirmModalConfig) => {
    setConfirmModalConfig(config);
    setConfirmModalOpen(true);
  };

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: ''
  });

  // Fetch all categories with services and their variations
  const fetchData = async () => {
    if (!estabelecimentoId) return;
    setLoading(true);
    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categorias_servico')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('created_at', { ascending: false });

      if (catError) throw catError;

      // 2. Fetch services with their variations
      const { data: servData, error: servError } = await supabase
        .from('servicos')
        .select('*, variacoes_servico(*)')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('nome', { ascending: true });

      if (servError) throw servError;

      // Match services to categories (order preserved from Supabase: created_at desc)
      const mapped: CategoriaWithRelations[] = (catData || []).map(cat => ({
        ...cat,
        servicos: (servData || [])
          .filter(s => s.categoria_id === cat.id)
          .map(s => ({ ...s }))
      }));

      setCategorias(mapped);
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
      showTemporaryError('Falha ao carregar dados do banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (estabelecimentoId) {
      fetchData();
    }
  }, [estabelecimentoId]);

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };



  // CATEGORIA ACTIONS
  const handleOpenCategoriaModal = (cat: CategoriaServico | null = null) => {
    setCategoriaError(null);
    if (cat) {
      setEditingCategoria(cat);
      setCategoriaNome(cat.nome);
    } else {
      setEditingCategoria(null);
      setCategoriaNome('');
    }
    setIsCategoriaModalOpen(true);
  };

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaNome.trim()) return;

    const normalizar = (s: string) =>
      s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const nomeNorm = normalizar(categoriaNome);
    const duplicata = categorias.find(
      c => normalizar(c.nome) === nomeNorm && c.id !== editingCategoria?.id
    );
    if (duplicata) {
      setCategoriaError(`Já existe uma categoria com o nome "${duplicata.nome}".`);
      return;
    }
    setCategoriaError(null);

    try {
      if (editingCategoria) {
        // Edit Categoria
        const { error } = await supabase
          .from('categorias_servico')
          .update({ nome: categoriaNome })
          .eq('id', editingCategoria.id);

        if (error) throw error;
        await registrarLog('editou', 'categoria', editingCategoria.id, `Editou categoria de serviço "${categoriaNome}"`);
      } else {
        // Create Categoria
        const { data, error } = await supabase
          .from('categorias_servico')
          .insert({ 
            nome: categoriaNome,
            estabelecimento_id: estabelecimentoId
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          await registrarLog('criou', 'categoria', data.id, `Criou categoria de serviço "${categoriaNome}"`);
        }
      }
      setIsCategoriaModalOpen(false);
      fetchData();
      setSuccessModal({
        isOpen: true,
        title: editingCategoria ? 'Categoria atualizada!' : 'Categoria criada!',
        description: editingCategoria
          ? `A categoria "${categoriaNome}" foi atualizada com sucesso.`
          : `A categoria "${categoriaNome}" foi criada com sucesso.`,
      });
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao salvar categoria.');
    }
  };


  const handleDeleteCategoria = async (cat: CategoriaWithRelations) => {
    // Regra: não pode excluir categoria com serviços vinculados
    if (cat.servicos && cat.servicos.length > 0) {
      showTemporaryError(`Não é permitido excluir a categoria "${cat.nome}" pois ela possui serviços vinculados.`);
      return;
    }

    openConfirmModal({
      title: 'Excluir Categoria?',
      description: `Tem certeza que deseja excluir a categoria "${cat.nome}"?`,
      warningText: 'Esta ação é permanente e não pode ser desfeita.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('categorias_servico')
            .delete()
            .eq('id', cat.id);

          if (error) throw error;
          await registrarLog('excluiu', 'categoria', cat.id, `Excluiu categoria de serviço "${cat.nome}"`);
          fetchData();
        } catch (err) {
          console.error(err);
          showTemporaryError('Falha ao excluir categoria.');
        }
      }
    });
  };

  // SERVICO ACTIONS
  const handleOpenServicoModal = (serv: ServicoWithRelations | null = null) => {
    setServicoError(null);
    setServicoImagemFile(null);
    setRemoverImagem(false);
    if (serv) {
      setEditingServico(serv);
      setServicoNome(serv.nome);
      setServicoDescricao(serv.descricao ?? '');
      setServicoCategoriaId(serv.categoria_id ?? '');
      setServicoDuracao(serv.duracao_minutos);
      setServicoValor(Number(serv.valor));
      setServicoVariacoes(
        (serv.variacoes_servico || []).map(v => ({
          id: v.id,
          nome: v.nome,
          valor: Number(v.valor)
        }))
      );
      setServicoImagemPreviewUrl(serv.imagem_url ?? null);
    } else {
      setEditingServico(null);
      setServicoNome('');
      setServicoDescricao('');
      setServicoCategoriaId(categorias.length > 0 ? categorias[0].id : '');
      setServicoDuracao(30);
      setServicoValor(100.0);
      setServicoVariacoes([]);
      setServicoImagemPreviewUrl(null);
    }
    setIsServicoModalOpen(true);
  };

  const handleImagemSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setServicoImagemFile(compressed);
      setServicoImagemPreviewUrl(URL.createObjectURL(compressed));
      setRemoverImagem(false);
    } catch {
      showTemporaryError('Não foi possível processar a imagem.');
    }
  };

  const handleRemoverImagem = () => {
    setServicoImagemFile(null);
    setServicoImagemPreviewUrl(null);
    setRemoverImagem(true);
    if (imagemFileInputRef.current) imagemFileInputRef.current.value = '';
  };

  const handleAddVariacaoField = () => {
    setServicoVariacoes([...servicoVariacoes, { nome: '', valor: '' }]);
  };

  const handleRemoveVariacaoField = (index: number) => {
    setServicoVariacoes(servicoVariacoes.filter((_, i) => i !== index));
  };

  const handleVariacaoChange = (index: number, field: 'nome' | 'valor', val: string) => {
    const updated = [...servicoVariacoes];
    if (field === 'nome') {
      updated[index].nome = val;
    } else {
      updated[index].valor = val === '' ? '' : parseFloat(val) || 0;
    }
    setServicoVariacoes(updated);
  };

  const handleSaveServico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoNome.trim() || !servicoCategoriaId) return;

    const normalizar = (s: string) =>
      s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const nomeNorm = normalizar(servicoNome);
    const todosServicos = categorias.flatMap(c => c.servicos);
    const duplicata = todosServicos.find(
      s => normalizar(s.nome) === nomeNorm && s.id !== editingServico?.id
    );
    if (duplicata) {
      setServicoError(`Já existe um serviço com o nome "${duplicata.nome}".`);
      return;
    }
    setServicoError(null);

    try {
      let servicoId = '';
      const duracaoFinal = servicoDuracao === '' ? 0 : servicoDuracao;
      const valorFinal = servicoValor === '' ? 0 : servicoValor;

      // Upload imagem se houver arquivo novo
      let imagemUrlFinal: string | null | undefined = undefined;
      if (servicoImagemFile && estabelecimentoId) {
        setUploadingImagem(true);
        const timestamp = Date.now();
        const filePath = `${estabelecimentoId}/servico-${timestamp}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('servicos-imagens')
          .upload(filePath, servicoImagemFile, { cacheControl: '3600', upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('servicos-imagens').getPublicUrl(filePath);
        imagemUrlFinal = urlData.publicUrl;
      } else if (removerImagem) {
        imagemUrlFinal = null;
      }

      if (editingServico) {
        const updatePayload: Record<string, unknown> = {
          nome: servicoNome,
          descricao: servicoDescricao.trim() || null,
          categoria_id: servicoCategoriaId,
          duracao_minutos: duracaoFinal,
          valor: valorFinal,
        };
        if (imagemUrlFinal !== undefined) updatePayload.imagem_url = imagemUrlFinal;

        const { error } = await supabase
          .from('servicos')
          .update(updatePayload)
          .eq('id', editingServico.id);

        if (error) throw error;
        servicoId = editingServico.id;
        await registrarLog('editou', 'servico', servicoId, `Editou serviço "${servicoNome}"`);
      } else {
        const { data, error } = await supabase
          .from('servicos')
          .insert({
            nome: servicoNome,
            descricao: servicoDescricao.trim() || null,
            categoria_id: servicoCategoriaId,
            duracao_minutos: duracaoFinal,
            valor: valorFinal,
            estabelecimento_id: estabelecimentoId,
            ...(imagemUrlFinal !== undefined ? { imagem_url: imagemUrlFinal } : {}),
          })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Falha ao criar serviço');
        servicoId = data.id;
        await registrarLog('criou', 'servico', servicoId, `Criou serviço "${servicoNome}"`);
      }

      if (editingServico) {
        await supabase.from('variacoes_servico').delete().eq('servico_id', servicoId);
      }

      const validVariacoes = servicoVariacoes.filter(v => v.nome.trim() !== '');
      if (validVariacoes.length > 0) {
        const insertData = validVariacoes.map(v => ({
          servico_id: servicoId,
          nome: v.nome,
          valor: v.valor === '' ? 0 : v.valor
        }));
        const { error: varError } = await supabase.from('variacoes_servico').insert(insertData);
        if (varError) throw varError;
      }

      setIsServicoModalOpen(false);
      fetchData();
      setSuccessModal({
        isOpen: true,
        title: editingServico ? 'Serviço atualizado!' : 'Serviço criado!',
        description: editingServico
          ? `O serviço "${servicoNome}" foi atualizado com sucesso.`
          : `O serviço "${servicoNome}" foi criado com sucesso.`
      });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('storage') || msg.toLowerCase().includes('upload')) {
        showTemporaryError('Falha ao enviar imagem. Tente novamente.');
      } else {
        showTemporaryError('Falha ao salvar serviço.');
      }
    } finally {
      setUploadingImagem(false);
    }
  };

  const handleToggleServicoStatus = async (serv: Servico) => {
    const newStatus = !serv.ativo;
    try {
      const { error } = await supabase
        .from('servicos')
        .update({ ativo: newStatus })
        .eq('id', serv.id);

      if (error) throw error;
      await registrarLog(
        'editou', 
        'servico', 
        serv.id, 
        `${newStatus ? 'Ativou' : 'Desativou'} serviço "${serv.nome}"`
      );
      fetchData();
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao atualizar status del serviço.');
    }
  };

  const handleDeleteServico = async (serv: ServicoWithRelations) => {
    // Regra: não pode excluir serviço com atendimentos registrados
    // Vamos fazer uma consulta no Supabase para verificar a tabela de atendimentos
    try {
      const { count: atendimentosCount, error: atendimentosError } = await supabase
        .from('atendimentos')
        .select('*', { count: 'exact', head: true })
        .eq('servico_id', serv.id);

      if (atendimentosError) throw atendimentosError;

      const { count: agendamentoServicosCount, error: agendamentoServicosError } = await supabase
        .from('agendamento_servicos')
        .select('*', { count: 'exact', head: true })
        .eq('servico_id', serv.id);

      if (agendamentoServicosError) throw agendamentoServicosError;

      const totalVinculos = (atendimentosCount || 0) + (agendamentoServicosCount || 0);

      if (totalVinculos > 0) {
        showTemporaryError(`Não é permitido excluir o serviço "${serv.nome}" pois existem ${totalVinculos} atendimentos/agendamentos vinculados.`);
        return;
      }

      openConfirmModal({
        title: 'Excluir Serviço?',
        description: `Tem certeza que deseja excluir o serviço "${serv.nome}"?`,
        warningText: 'Esta ação é permanente e não pode ser desfeita.',
        onConfirm: async () => {
          try {
            const { error: delError } = await supabase
              .from('servicos')
              .delete()
              .eq('id', serv.id);

            if (delError) throw delError;

            await registrarLog('excluiu', 'servico', serv.id, `Excluiu serviço "${serv.nome}"`);
            fetchData();
          } catch (err) {
            console.error(err);
            showTemporaryError('Falha ao excluir o serviço.');
          }
        }
      });
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao verificar atendimentos vinculados ou excluir.');
    }
  };

  // FILTER LOGIC
  // categorias_servico has no ativo column — status filter applies only to services
  const filteredCategorias = categorias.map(cat => {
    const filteredServicos = cat.servicos.filter(serv => {
      const matchesSearch = serv.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'ativos' && serv.ativo) ||
        (statusFilter === 'inativos' && !serv.ativo);
      return matchesSearch && matchesStatus;
    });

    if (searchTerm.trim() !== '' && filteredServicos.length === 0) return null;

    return { ...cat, servicos: filteredServicos };
  }).filter((cat): cat is CategoriaWithRelations => cat !== null);

  const activeCategoriesCount = categorias.length;

  return (
    <div className="space-y-6">
      {/* Floating Toast for Errors */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 pointer-events-none">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg animate-fade-in pointer-events-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-border rounded-[14px] p-5 shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar serviço por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativos">Apenas Ativos</option>
            <option value="inativos">Apenas Inativos</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="ob-servicos-nova-cat"
            onClick={() => handleOpenCategoriaModal()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>

          <button
            id="ob-servicos-novo-btn"
            onClick={() => handleOpenServicoModal()}
            disabled={activeCategoriesCount === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-200 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2"></div>
          <p className="text-sm">Carregando serviços...</p>
        </div>
      ) : filteredCategorias.length === 0 ? (
        <div className="bg-white border border-border rounded-[14px] p-12 text-center text-text-secondary">
          <Sparkles className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="font-title font-medium text-lg text-text-primary">Nenhum serviço ou categoria encontrado</p>
          <p className="text-sm text-text-muted mt-1">Experimente alterar os filtros ou cadastrar novas opções.</p>
        </div>
      ) : (
        /* Categorias Grouped List */
        <div id="ob-servicos-lista" className="space-y-8">
          {filteredCategorias.map(cat => (
            <div
              key={cat.id}
              className="bg-white border border-border rounded-[14px] shadow-sm"
            >
              {/* Category Header */}
              <div className="bg-rose-50/20 border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-[14px]">
                <div className="flex items-center gap-3">
                  <h3 className="font-title font-semibold text-xl text-text-primary flex items-center gap-2">
                    {cat.nome}
                    <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {cat.servicos.length} {cat.servicos.length === 1 ? 'serviço' : 'serviços'}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenCategoriaModal(cat)}
                    className="p-1.5 text-text-secondary hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Editar Categoria"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  

                  <div className="relative group">
                    <button
                      onClick={() => handleDeleteCategoria(cat)}
                      disabled={cat.servicos.length > 0}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${cat.servicos.length > 0 ? 'text-text-muted cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                      title={cat.servicos.length > 0 ? '' : 'Excluir Categoria'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {cat.servicos.length > 0 && (
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-text-primary text-white dark:bg-zinc-800 dark:text-zinc-100 border dark:border-zinc-700/50 text-[11px] rounded shadow-lg z-10 font-sans leading-relaxed">
                        Não é permitido excluir uma categoria com serviços vinculados. Desative-a em vez disso.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Services List inside Category */}
              {cat.servicos.length === 0 ? (
                <div className="p-6 text-center text-text-muted text-sm italic bg-white rounded-b-[14px]">
                  Nenhum serviço nesta categoria.
                </div>
              ) : (
                <div className="divide-y divide-border bg-white rounded-b-[14px]">
                  {cat.servicos.map(serv => (
                    <div 
                      key={serv.id} 
                      className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150 hover:bg-bg/10 last:rounded-b-[14px] ${!serv.ativo ? 'opacity-50' : ''}`}
                    >
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <p className="font-semibold text-text-primary text-base truncate">{serv.nome}</p>
                          {!serv.ativo && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wider">
                              Inativo
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-text-secondary">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            {serv.duracao_minutos} min
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-text-muted" />
                            R$ {Number(serv.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {serv.variacoes_servico && serv.variacoes_servico.length > 0 && (
                            <span className="bg-gold-light/40 text-gold text-[10px] font-medium px-2 py-0.5 rounded border border-gold-light/60">
                              Possui {serv.variacoes_servico.length} variações
                            </span>
                          )}
                        </div>

                        {/* Render variations text if any */}
                        {serv.variacoes_servico && serv.variacoes_servico.length > 0 && (
                          <div className="text-[11px] text-text-muted flex flex-wrap gap-x-2 gap-y-1 mt-1 bg-rose-50/10 p-1.5 rounded border border-border/40 max-w-xl">
                            <span className="font-medium">Opções:</span>
                            {serv.variacoes_servico.map((v, i) => (
                              <span key={v.id}>
                                {v.nome} (R$ {Number(v.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                {i < (serv.variacoes_servico?.length || 0) - 1 ? ' • ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenServicoModal(serv)}
                          className="p-1.5 text-text-secondary hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Editar Serviço"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleServicoStatus(serv)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${serv.ativo ? 'text-green-600 hover:bg-green-50' : 'text-text-muted hover:bg-gray-100'}`}
                          title={serv.ativo ? 'Desativar Serviço' : 'Ativar Serviço'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteServico(serv)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Excluir Serviço"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CATEGORIA MODAL */}
      {isCategoriaModalOpen && createPortal(<div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-rose-50/10">
              <h4 className="font-title font-semibold text-lg text-text-primary">
                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
              </h4>
              <button 
                onClick={() => setIsCategoriaModalOpen(false)}
                className="text-text-secondary hover:text-rose-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCategoria} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Nome da Categoria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Extensão de Cílios, Lash Lifting, Sobrancelhas..."
                  value={categoriaNome}
                  onChange={(e) => { setCategoriaNome(e.target.value); setCategoriaError(null); }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                />
              </div>

              {categoriaError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <p className="text-xs font-medium">{categoriaError}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCategoriaModalOpen(false)}
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
        </div>, document.body)}

      {/* SERVICO MODAL */}
      {isServicoModalOpen && createPortal(<div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-4xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden my-8 animate-slide-up">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-rose-50/10 flex-shrink-0">
              <h4 className="font-title font-semibold text-lg text-text-primary">
                {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
              </h4>
              <button
                onClick={() => setIsServicoModalOpen(false)}
                className="text-text-secondary hover:text-rose-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
              {/* ── FORMULÁRIO ── */}
              <form onSubmit={handleSaveServico} className="p-6 space-y-5 lg:overflow-y-auto flex-1 lg:border-r lg:border-border">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Nome do Serviço <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Volume Brasileiro - Aplicação"
                    value={servicoNome}
                    onChange={(e) => setServicoNome(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Descrição <span className="text-text-muted font-normal normal-case">(aparece no portal da cliente)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Fio sintético aplicado cílio a cílio. Efeito natural e discreto para o dia a dia."
                    value={servicoDescricao}
                    onChange={(e) => setServicoDescricao(e.target.value)}
                    maxLength={300}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted resize-none"
                  />
                  <p className="text-[11px] text-text-muted text-right">{servicoDescricao.length}/300</p>
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={servicoCategoriaId}
                    onChange={(e) => setServicoCategoriaId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
                  >
                    <option value="" disabled>Selecione uma categoria ativa</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Duração & Valor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Duração (min) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={servicoDuracao}
                      onChange={(e) => setServicoDuracao(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Valor (R$) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={servicoValor}
                      onChange={(e) => setServicoValor(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                </div>

                {/* Foto do serviço */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Foto do Serviço <span className="text-text-muted font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    ref={imagemFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImagemSelect}
                  />
                  {servicoImagemPreviewUrl ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border group">
                      <img src={servicoImagemPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => imagemFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-text-primary rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Trocar foto
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoverImagem}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imagemFileInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-rose-300 hover:bg-rose-50/30 transition-colors flex flex-col items-center justify-center gap-2 text-text-muted cursor-pointer"
                    >
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-xs font-medium">Clique para adicionar uma foto</span>
                      <span className="text-[10px]">A imagem será comprimida automaticamente</span>
                    </button>
                  )}
                </div>

                {/* Variações */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      Variações de Serviço
                      <span title="Use variações para cadastrar valores diferentes dependendo da região corporal ou técnica.">
                        <HelpCircle className="w-3.5 h-3.5 text-text-muted cursor-help" />
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddVariacaoField}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Adicionar variação
                    </button>
                  </div>

                  {servicoVariacoes.length === 0 ? (
                    <p className="text-xs text-text-muted italic">Nenhuma variação. O serviço usará apenas o valor padrão.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {servicoVariacoes.map((variacao, index) => (
                        <div key={index} className="flex items-center gap-3 bg-bg/40 p-2 rounded-lg border border-border/50 animate-fade-in">
                          <div className="flex-1">
                            <input
                              type="text"
                              required
                              placeholder="Ex: Manutenção Fio a Fio..."
                              value={variacao.nome}
                              onChange={(e) => handleVariacaoChange(index, 'nome', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-border rounded-md bg-white text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                            />
                          </div>
                          <div className="w-28">
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              placeholder="Valor"
                              value={variacao.valor || ''}
                              onChange={(e) => handleVariacaoChange(index, 'valor', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-border rounded-md bg-white text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariacaoField(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {servicoError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <p className="text-xs font-medium">{servicoError}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsServicoModalOpen(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-secondary hover:bg-bg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImagem}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    {uploadingImagem ? 'Enviando imagem...' : 'Salvar'}
                  </button>
                </div>
              </form>

              {/* ── PREVIEW ── */}
              <div className="flex flex-col lg:w-72 flex-shrink-0 bg-bg/40 p-5 gap-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-border">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-0.5">Como vai aparecer no portal</p>
                  <p className="text-[10px] text-text-muted">Atualiza em tempo real</p>
                </div>

                {/* Card preview — com imagem */}
                <div>
                  <p className="text-[10px] font-medium text-text-muted mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Com foto
                  </p>
                  <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                    {servicoImagemPreviewUrl ? (
                      <img src={servicoImagemPreviewUrl} alt="Preview" className="w-full aspect-video object-cover" />
                    ) : (
                      <div className="w-full aspect-video bg-rose-50 flex items-center justify-center">
                        <ImagePlus className="w-8 h-8 text-rose-200" />
                      </div>
                    )}
                    <div className="p-3 space-y-2">
                      <p className="font-title font-semibold text-sm text-text-primary leading-snug">
                        {servicoNome || 'Nome do Serviço'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-400" />
                          {servicoDuracao || 0} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-500" />
                          R$ {Number(servicoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold text-center">
                        Agendar
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card preview — sem imagem */}
                <div>
                  <p className="text-[10px] font-medium text-text-muted mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    Sem foto
                  </p>
                  <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm p-3 space-y-2">
                    <p className="font-title font-semibold text-sm text-text-primary leading-snug">
                      {servicoNome || 'Nome do Serviço'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-400" />
                        {servicoDuracao || 0} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-500" />
                        R$ {Number(servicoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold text-center">
                      Agendar
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-text-muted leading-relaxed mt-auto pt-2 border-t border-border">
                  A foto é opcional. Serviços sem foto exibem o card no formato simples, como mostrado acima.
                </p>
              </div>
            </div>
          </div>
        </div>, document.body)}

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmModalConfig?.onConfirm || (() => {})}
        title={confirmModalConfig?.title || ''}
        description={confirmModalConfig?.description || ''}
        warningText={confirmModalConfig?.warningText}
        type="danger"
      />

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
