import { getResend } from "@/lib/resend"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"


function createGoogleCalendarUrl(title: string, description: string, startDate: string, endDate?: string) {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 horas depois
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, 15) + "Z"
  }
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description || "",
    dates: `${formatDate(start)}/${formatDate(end)}`,
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export async function POST(request: NextRequest) {
  try {
    const resend = getResend()
    const { eventId, eventTitle, eventDescription, eventDate, eventEndDate, eventType, customMessage } = await request.json()

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
      return NextResponse.json({ error: "Apenas admins podem enviar notificações" }, { status: 403 })
    }

    // Buscar membros que querem receber notificações
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("email, name")
      .eq("notify_events", true)

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 })
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ message: "Nenhum membro para notificar", sent: 0 })
    }

    // Formatar data
    const formattedDate = eventDate 
      ? new Date(eventDate).toLocaleString("pt-BR", {
          dateStyle: "full",
          timeStyle: "short"
        })
      : "Data a confirmar"

    // Criar link do Google Calendar
    const calendarUrl = eventDate 
      ? createGoogleCalendarUrl(
          eventTitle, 
          eventDescription || `Evento da Aliança FODA: ${eventTitle}`,
          eventDate,
          eventEndDate
        )
      : null

    // Enviar emails para todos os membros
    const emailPromises = members.map(async (member) => {
      try {
        await resend.emails.send({
          from: "Aliança FODA <eventos@resend.dev>",
          to: member.email,
          subject: `🎮 Novo Evento: ${eventTitle}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: Arial, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                  <!-- Header -->
                  <div style="background-color: #dc2626; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                      ALIANÇA FODA
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                      Notificação de Evento
                    </p>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 30px;">
                    <p style="color: #9ca3af; margin: 0 0 20px 0; font-size: 16px;">
                      Olá${member.name ? `, <strong style="color: white;">${member.name}</strong>` : ""}!
                    </p>
                    
                    <div style="background-color: #252525; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #dc2626;">
                      <span style="display: inline-block; background-color: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 15px;">
                        ${eventType === "guerra" ? "⚔️ GUERRA" : eventType === "especial" ? "⭐ ESPECIAL" : "📅 EVENTO"}
                      </span>
                      
                      <h2 style="color: white; margin: 0 0 15px 0; font-size: 22px;">
                        ${eventTitle}
                      </h2>
                      
                      ${customMessage ? `
                        <p style="color: #fbbf24; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; background-color: #1a1a1a; padding: 15px; border-radius: 8px; border-left: 3px solid #fbbf24;">
                          ${customMessage}
                        </p>
                      ` : ""}
                      
                      ${eventDescription && !customMessage ? `
                        <p style="color: #9ca3af; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                          ${eventDescription}
                        </p>
                      ` : ""}
                      
                      <div style="display: flex; align-items: center; gap: 8px; color: #22c55e;">
                        <span style="font-size: 14px;">📅</span>
                        <span style="font-size: 14px; font-weight: bold;">${formattedDate}</span>
                      </div>
                    </div>
                    
                    ${calendarUrl ? `
                    <div style="text-align: center; margin-bottom: 25px;">
                      <a href="${calendarUrl}" target="_blank" style="display: inline-block; background-color: #4285f4; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                        📅 Adicionar ao Google Calendar
                      </a>
                    </div>
                    ` : ""}
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                      Prepare-se para a batalha! Não perca esse evento importante da nossa aliança.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="border-top: 1px solid #333; padding: 20px 30px; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                      Você recebeu este email porque está inscrito nas notificações da Aliança FODA.
                      <br>
                      <a href="#" style="color: #dc2626; text-decoration: none;">Gerenciar preferências</a>
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        })
        return { email: member.email, success: true }
      } catch (err) {
        console.error(`Erro ao enviar para ${member.email}:`, err)
        return { email: member.email, success: false }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.success).length

    return NextResponse.json({ 
      message: `Notificações enviadas`, 
      sent: successCount,
      total: members.length
    })

  } catch (error) {
    console.error("Erro ao enviar notificações:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
