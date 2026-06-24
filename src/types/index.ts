export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar_url?: string | null;
  role: 'profissional' | 'cliente';
  cliente_id?: string | null;
  estabelecimento_id?: string | null;
  telefone?: string | null;
  onboarding_paginas_vistas?: string[];
  created_at?: string;
}

export interface CategoriaServico {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativo?: boolean; // campo legado — não existe no novo schema
  created_at?: string;
}

export interface Servico {
  id: string;
  categoria_id?: string | null;
  nome: string;
  descricao?: string | null;
  duracao_minutos: number;
  valor: number;
  ativo: boolean;
  imagem_url?: string | null;
  created_at?: string;
  categoria?: CategoriaServico;
}

export interface VariacaoServico {
  id: string;
  servico_id: string;
  nome: string;
  duracao_minutos?: number | null;
  valor?: number | null;
  created_at?: string;
}

export interface HorarioAtendimento {
  id: string;
  dia_semana: number; // 0=Domingo, 1=Segunda...
  hora_inicio: string; // "HH:MM"
  hora_fim: string; // "HH:MM"
  created_at?: string;
}

export interface BloqueioAgenda {
  id: string;
  data_inicio: string;
  data_fim: string;
  dia_inteiro?: boolean;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  motivo?: string | null;
  created_at?: string;
}

export interface Cliente {
  id: string;
  estabelecimento_id?: string;
  nome: string;
  sobrenome?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  data_nascimento?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  alergias?: string | null;
  medicamentos?: string | null;
  doencas_cronicas?: string | null;
  gestante: boolean;
  anamnese_lash?: {
    fez_extensao_antes?: boolean;
    reacao_alergica_anterior?: boolean;
    usa_lentes_contato?: boolean;
    olhos_sensiveis?: boolean;
    doencas_oculares?: boolean;
    habito_esfregar_olhos?: boolean;
    posicao_dormir?: 'lado' | 'costas' | 'de_brucos' | 'variada' | '';
    maquiagem_prova_agua?: boolean;
    exposicao_calor_agua?: boolean;
    problemas_tireoide?: boolean;
    quimioterapia_recente?: boolean;
    queda_cabelo_alopecia?: boolean;
    alergia_produtos?: boolean;
  } | null;
  // campos legados — não existem no novo schema
  ativo?: boolean;
  como_conheceu?: string | null;
  tipo_pele?: string | null;
  restricoes?: string | null;
  created_at?: string;
}

export interface Agendamento {
  id: string;
  cliente_id: string;
  data_hora: string;
  duracao_minutos: number;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido' | 'falta';
  origem: 'admin' | 'portal';
  observacoes?: string | null;
  created_at?: string;
  cliente?: Cliente;
}

export interface AgendamentoServico {
  id: string;
  agendamento_id: string;
  servico_id: string;
  variacao_id?: string | null;
  valor_cobrado?: number | null;
  servico?: Servico;
  variacao?: VariacaoServico;
}

export interface Atendimento {
  id: string;
  cliente_id: string;
  servico_id: string;
  variacao_id?: string | null;
  data_atendimento: string;
  valor_cobrado: number;
  observacoes?: string | null;
  created_at?: string;
  cliente?: Cliente;
  servico?: Servico;
  variacao?: VariacaoServico;
}

export interface ConfiguracaoNegocio {
  id: string;
  nome_negocio: string;
  descricao?: string | null;
  instagram?: string | null;
  endereco?: string | null;
  logo_url?: string | null;
  aprovacao_automatica: boolean;
  antecedencia_cancelamento_horas: number;
  mensagem_pos_agendamento: string;
  paleta_cores?: string | null;
  modo_escuro?: boolean | null;
  created_at?: string;
}

export interface Log {
  id: string;
  usuario_id?: string | null;
  acao: string;
  detalhes?: Record<string, unknown> | null;
  created_at?: string;
}
