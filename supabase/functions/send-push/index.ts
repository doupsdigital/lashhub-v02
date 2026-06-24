import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── VAPID helpers ─────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:lashhubapp@gmail.com';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function importVapidKeys() {
  const privateKeyBytes = urlBase64ToUint8Array(VAPID_PRIVATE_KEY);
  const publicKeyBytes  = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  const privateKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveKey', 'deriveBits'],
  );
  const publicKey = await crypto.subtle.importKey(
    'raw', publicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, [],
  );
  return { privateKey, publicKey };
}

async function buildVapidJwt(audience: string): Promise<string> {
  const header  = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  const privateKeyBytes = urlBase64ToUint8Array(VAPID_PRIVATE_KEY);
  const signingKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign'],
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(unsignedToken),
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${unsignedToken}.${sigB64}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<void> {
  const url      = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt      = await buildVapidJwt(audience);

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body: new TextEncoder().encode(payload),
  });

  if (!res.ok && res.status !== 201) {
    console.error('Push falhou:', res.status, await res.text());
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const body = await req.json();
    // Database Webhook envia { type, table, record, old_record }
    const record = body.record;

    if (!record || record.status !== 'pendente' || record.origem !== 'portal') {
      return new Response('ignorado', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Busca a data/hora formatada
    const dataHora = new Date(record.data_hora).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

    // Busca as subscriptions da profissional deste estabelecimento
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('estabelecimento_id', record.estabelecimento_id);

    if (error || !subs?.length) {
      return new Response('sem subscriptions', { status: 200 });
    }

    const notification = JSON.stringify({
      title: '📅 Novo agendamento!',
      body: `Uma cliente agendou para ${dataHora}. Acesse o sistema para confirmar.`,
      url: '/agendamentos',
    });

    await Promise.allSettled(subs.map(sub => sendWebPush(sub, notification)));

    return new Response('enviado', { status: 200 });
  } catch (err) {
    console.error('Erro na Edge Function send-push:', err);
    return new Response('erro interno', { status: 500 });
  }
});
