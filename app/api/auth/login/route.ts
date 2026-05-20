import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "foda-alliance-secret-key-2024"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha sao obrigatorios" }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar membro pelo email
    const { data: member, error } = await supabase
      .from("members")
      .select("*")
      .eq("email", email.toLowerCase())
      .single()

    if (error || !member) {
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 })
    }

    if (!member.password_hash) {
      return NextResponse.json({ error: "Conta criada com outro metodo. Use o login original." }, { status: 401 })
    }

    // Verificar se email foi confirmado
    if (!member.email_verified) {
      return NextResponse.json({ 
        error: "Email nao verificado. Verifique sua caixa de entrada.",
        needsVerification: true,
        email: member.email
      }, { status: 403 })
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, member.password_hash)

    if (!validPassword) {
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 })
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
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
