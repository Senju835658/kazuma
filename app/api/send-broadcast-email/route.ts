import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { subject, message } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: "Assunto e mensagem são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: adminData } = await supabase
      .from("admins")
      .select("*")
      .eq("user_id", user.id)

    if (!adminData || adminData.length === 0) {
      return NextResponse.json({ error: "Apenas admins podem enviar emails" }, { status: 403 })
    }

    // Buscar membros que querem receber notificações
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("email, name")
      .eq("notify_events", true)

    if (membersError) {
      console.error("Erro ao buscar membros:", membersError)
      return NextResponse.json({ error: "Erro ao buscar membros" }, { status: 500 })
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Nenhum membro com notificações ativadas" 
      })
    }

    // Enviar emails
    const emailPromises = members.map(async (member) => {
      try {
        await resend.emails.send({
          from: "Aliança FODA <noreply@resend.dev>",
          to: member.email,
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d0d0d; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                        <!-- Header -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">
                              ALIANÇA FODA
                            </h1>
                            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">
                              Servidor 159
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 30px;">
                            <p style="color: #e5e5e5; margin: 0 0 10px 0; font-size: 16px;">
                              Ola, ${member.name || "Membro"}!
                            </p>
                            
                            <div style="background-color: #252525; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
                              <p style="color: #ffffff; margin: 0; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
                                ${message}
                              </p>
                            </div>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #0d0d0d; padding: 25px 30px; text-align: center; border-top: 1px solid #333;">
                            <p style="color: #666; margin: 0; font-size: 12px;">
                              Voce recebeu este email porque esta inscrito na Aliança FODA.
                            </p>
                            <p style="color: #444; margin: 10px 0 0 0; font-size: 11px;">
                              © 2026 Aliança FODA - Servidor 159
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `
        })
        return { success: true, email: member.email }
      } catch (error) {
        console.error(`Erro ao enviar email para ${member.email}:`, error)
        return { success: false, email: member.email, error }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({ 
      success: true,
      message: `${successCount} emails enviados com sucesso${failCount > 0 ? `, ${failCount} falharam` : ""}`,
      sent: successCount,
      failed: failCount
    })

  } catch (error) {
    console.error("Erro ao enviar broadcast email:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
