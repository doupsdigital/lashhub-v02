import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://agcfngaegopeyutjgncl.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnY2ZuZ2FlZ29wZXl1dGpnbmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc4NTEsImV4cCI6MjA5NjgzMzg1MX0.0LCkbYQbiUNXuGs_VX-WjFOcPyo6rPGcN_fC94WMrlQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function purge() {
  console.log('Iniciando o login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@lashly.com',
    password: 'admin123',
  });

  if (authError) {
    console.error('Falha de Autenticação:', authError.message);
    return;
  }
  console.log('Login efetuado com sucesso!');

  const targetEst = 'e1000000-0000-0000-0000-000000000000';

  // Buscar IDs dos agendamentos para poder limpar os agendamento_servicos
  const { data: appts } = await supabase.from('agendamentos').select('id').eq('estabelecimento_id', targetEst);
  const apptIds = appts?.map(a => a.id) || [];

  // Apaga vínculos de serviços, atendimentos, agendamentos, clientes e logs
  const { error: err1 } = apptIds.length > 0 
    ? await supabase.from('agendamento_servicos').delete().in('agendamento_id', apptIds)
    : { error: null };
  const { error: err2 } = await supabase.from('atendimentos').delete().eq('estabelecimento_id', targetEst);
  const { error: err3 } = await supabase.from('agendamentos').delete().eq('estabelecimento_id', targetEst);
  const { error: err4 } = await supabase.from('clientes').delete().eq('estabelecimento_id', targetEst);
  const { error: err5 } = await supabase.from('logs').delete().eq('estabelecimento_id', targetEst);

  if (err1 || err2 || err3 || err4 || err5) {
    console.error('Ocorreu um erro ao limpar o banco:', { err1, err2, err3, err4, err5 });
    return;
  }

  // Re-inserir usuário profissional caso tenha sido deletado por CASCADE
  const { data: userExists, error: checkError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', authData.user.id)
    .maybeSingle();
  
  if (!userExists) {
    console.log('Usuário profissional não encontrado em "usuarios". Re-inserindo...');
    const { error: userInsertError } = await supabase.from('usuarios').insert({
      id: authData.user.id,
      nome: 'admin',
      email: 'admin@lashly.com',
      role: 'profissional',
      cliente_id: null,
      estabelecimento_id: targetEst
    });
    if (userInsertError) {
      console.error('Erro ao re-inserir usuário profissional:', userInsertError.message);
      return;
    }
    console.log('Usuário profissional re-inserido com sucesso!');
  }

  console.log('#############################################');
  console.log('   BANCO DE DADOS LIMPO COM SUCESSO!        ');
  console.log('   - Clientes, Agendamentos e Históricos    ');
  console.log('     foram completamente removidos.          ');
  console.log('   - Estrutura de serviços preservada.      ');
  console.log('#############################################');
}

purge();
