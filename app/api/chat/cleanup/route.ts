import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Esta rota limpa mensagens com mais de 2 horas
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calcular timestamp de 2 horas atras
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    // Deletar mensagens antigas
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .lt("created_at", twoHoursAgo)

    if (error) {
      console.error("Erro ao limpar mensagens:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Mensagens antigas removidas"
    })
  } catch (error) {
    console.error("Erro ao limpar mensagens:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
