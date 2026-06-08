import { supabase } from '../lib/supabase';

export const registrarLog = async (
  acao: 'criou' | 'editou' | 'excluiu',
  entidade: string,
  entidadeId: string,
  descricao: string
) => {
  try {
    await supabase.from('logs').insert({
      usuario_nome: 'Usuário do Sistema',
      acao,
      entidade,
      entidade_id: entidadeId,
      descricao
    });
  } catch (err) {
    console.error('Erro ao registrar log de atividade:', err);
  }
};
