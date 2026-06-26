import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore — web-push é importado via npm para Deno
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:lashhubapp@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');

serve(async (req) => {
  // Valida o segredo compartilhado com o trigger do banco
  const incomingSecret = req.headers.get('x-webhook-secret');
  if (!WEBHOOK_SECRET || incomingSecret !== WEBHOOK_SECRET) {
    return new Response('não autorizado', { status: 401 });
  }

  try {
    const body = await req.json();
    const record = body.record;

    const statusValidos = ['pendente', 'confirmado'];
    if (!record || !statusValidos.includes(record.status) || record.origem !== 'portal') {
      return new Response('ignorado', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const dataHora = new Date(record.data_hora).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

    // Busca nome da cliente e serviços em paralelo
    const [clienteRes, servicosRes] = await Promise.all([
      supabase.from('clientes').select('nome, sobrenome').eq('id', record.cliente_id).maybeSingle(),
      supabase.from('agendamento_servicos').select('servico:servicos(nome)').eq('agendamento_id', record.id),
    ]);

    const nomeCliente = clienteRes.data
      ? `${clienteRes.data.nome}${clienteRes.data.sobrenome ? ' ' + clienteRes.data.sobrenome : ''}`
      : 'Uma cliente';

    const nomeServicos = (servicosRes.data ?? [])
      .map((s: any) => s.servico?.nome)
      .filter(Boolean)
      .join(', ') || null;

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('estabelecimento_id', record.estabelecimento_id);

    if (error || !subs?.length) {
      console.log('Sem subscriptions para:', record.estabelecimento_id);
      return new Response('sem subscriptions', { status: 200 });
    }

    const bodyText = nomeServicos
      ? `${nomeCliente} • ${nomeServicos} • ${dataHora}`
      : `${nomeCliente} agendou para ${dataHora}`;

    const title = record.status === 'confirmado'
      ? '✅ Novo agendamento confirmado!'
      : '📅 Novo agendamento pendente!';

    const payload = JSON.stringify({
      title,
      body: bodyText,
      url: '/agendamentos',
    });

    const results = await Promise.allSettled(
      subs.map((sub: any) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    );

    const invalidEndpoints: string[] = [];
    results.forEach((r: any, i: number) => {
      if (r.status === 'rejected') {
        const statusCode = r.reason?.statusCode;
        console.error(`Push falhou para subscription ${i} (status ${statusCode}):`, r.reason?.message);
        if (statusCode === 410 || statusCode === 404) {
          invalidEndpoints.push(subs[i].endpoint);
        }
      } else {
        console.log(`Push enviado para subscription ${i}: status ${r.value.statusCode}`);
      }
    });

    if (invalidEndpoints.length > 0) {
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', invalidEndpoints);
      if (deleteError) {
        console.error('Erro ao remover subscriptions inválidas:', deleteError.message);
      } else {
        console.log(`${invalidEndpoints.length} subscription(s) inválida(s) removida(s).`);
      }
    }

    return new Response('enviado', { status: 200 });
  } catch (err) {
    console.error('Erro na Edge Function send-push:', err);
    return new Response('erro interno', { status: 500 });
  }
});
