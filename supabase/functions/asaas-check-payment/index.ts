// Edge Function: asaas-check-payment
// Consulta o status do pagamento direto no Asaas.
// Se confirmado, atualiza o banco (plano + status_assinatura = ativo).
// Funciona como fallback caso o webhook não dispare.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id, estabelecimento_id } = await req.json()

    if (!payment_id || !estabelecimento_id) {
      return new Response(
        JSON.stringify({ error: 'payment_id e estabelecimento_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ASAAS_API_KEY  = Deno.env.get('ASAAS_API_KEY')!
    const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL')!
    const SB_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_ROLE_KEY')!
    const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!

    // 1. Consulta status do pagamento no Asaas
    const res = await fetch(`${ASAAS_BASE_URL}/payments/${payment_id}`, {
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
    })
    const payment = await res.json()

    const confirmado = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'

    if (!confirmado) {
      return new Response(
        JSON.stringify({ ativo: false, status: payment.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Determina o plano pelo valor pago
    const valor = parseFloat(String(payment.value ?? 0))
    const novoPlano = valor >= 90 ? 'premium' : 'basico'

    // 3. Atualiza o banco (mesma lógica do webhook, funciona como fallback)
    const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY)
    await supabase
      .from('estabelecimentos')
      .update({ status_assinatura: 'ativo', plano: novoPlano })
      .eq('id', estabelecimento_id)

    return new Response(
      JSON.stringify({ ativo: true, plano: novoPlano }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
