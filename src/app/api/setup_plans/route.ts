import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: d1, error: e1 } = await supabase
    .from('plans')
    .update({ 
      price: 100, 
      provider_plan_id: '5b5d763dad834d3e9f7c69eb55475df0', 
      provider: 'mercadopago' 
    })
    .eq('code', 'pro_monthly')

  const { data: d2, error: e2 } = await supabase
    .from('plans')
    .update({ 
      price: 150, 
      provider_plan_id: '21174900dccf40ab9d244591d2e07129', 
      provider: 'mercadopago' 
    })
    .eq('code', 'pro_yearly')

  return NextResponse.json({ e1, e2, ok: true })
}
