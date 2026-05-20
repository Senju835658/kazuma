import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "foda-alliance-secret-key-2024"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    console.log("[v0] Signup attempt for:", email)

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email e senha sao obrigatorios" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("[v0] Password too short")
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    // Verificar se email ja existe
    const { data: existing, error: existingError } = await supabase
      .from("members")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    console.log("[v0] Check existing email result:", existing, existingError)

    if (existing) {
      return NextResponse.json({ error: "Este email ja esta cadastrado" }, { status: 400 })
    }

    // Verificar limite de 200 membros
    const { count, error: countError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })

    console.log("[v0] Member count:", count, countError)

    if (count !== null && count >= 200) {
      return NextResponse.json({ error: "Limite de 200 membros atingido" }, { status: 400 })
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)
    console.log("[v0] Password hashed")

    // Criar membro (user_id será gerado automaticamente pelo banco)
    const { data: member, error: insertError } = await supabase
      .from("members")
      .insert({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        password_hash: passwordHash,
        notify_events: true
      })
      .select()
      .single()

    console.log("[v0] Insert result:", member, insertError)

    if (insertError) {
      console.error("[v0] Erro ao criar membro:", insertError)
      return NextResponse.json({ error: "Erro ao criar conta: " + insertError.message }, { status: 500 })
    }

    // Gerar JWT
    const token = jwt.sign(
      { 
        id: member.id, 
        email: member.email, 
        name: member.name
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    // Criar response com cookie
    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: member.id, 
        email: member.email, 
        name: member.name 
      } 
    })

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/"
    })

    return response

  } catch (error) {
    console.error("Erro no signup:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
