import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getResend } from "@/lib/resend"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email obrigatorio" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: member } = await supabase
      .from("members")
      .select("id, name, email_verified")
      .eq("email", email.toLowerCase())
      .single()

    if (!member) {
      return NextResponse.json({ error: "Email nao encontrado" }, { status: 404 })
    }

    if (member.email_verified) {
      return NextResponse.json({ error: "Email ja verificado" }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString("hex")

    await supabase
      .from("members")
      .update({ verification_token: token })
      .eq("id", member.id)

    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`

    const resend = getResend()

    const { error: emailError } = await resend.emails.send({
      from: "ZERO111 <onboarding@resend.dev>",
      to: email,
      subject: "Confirme seu email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Confirme seu email</h1>
          <p>Olá ${member.name || "membro"}!</p>
          <p>Clique no botão abaixo para confirmar sua conta.</p>

          <a
            href="${verifyUrl}"
            style="
              display:inline-block;
              padding:12px 24px;
              background:#dc2626;
              color:white;
              text-decoration:none;
              border-radius:8px;
              margin-top:20px;
            "
          >
            Confirmar Email
          </a>
        </div>
      `,
    })

    if (emailError) {
      return NextResponse.json(
        { error: emailError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Email enviado",
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}