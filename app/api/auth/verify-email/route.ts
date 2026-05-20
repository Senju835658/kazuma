import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json({ error: "Token e email obrigatorios" }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar membro com o token
    const { data: member } = await supabase
      .from("members")
      .select("id, verification_token, email_verified")
      .eq("email", email.toLowerCase())
      .single()

    if (!member) {
      return NextResponse.json({ error: "Email nao encontrado" }, { status: 404 })
    }

    if (member.email_verified) {
      return NextResponse.json({ error: "Email ja verificado" }, { status: 400 })
    }

    if (member.verification_token !== token) {
      return NextResponse.json({ error: "Token invalido ou expirado" }, { status: 400 })
    }

    // Marcar email como verificado
    const { error: updateError } = await supabase
      .from("members")
      .update({ 
        email_verified: true, 
        verification_token: null 
      })
      .eq("id", member.id)

    if (updateError) {
      console.error("Erro ao atualizar membro:", updateError)
      return NextResponse.json({ error: "Erro ao verificar email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Email verificado com sucesso" })

  } catch (error) {
    console.error("Erro:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
