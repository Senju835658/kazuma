import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Validar UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Validar visitor ID (alphanumerico, max 64 chars)
function isValidVisitorId(str: string): boolean {
  return typeof str === "string" && str.length > 0 && str.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(str)
}

export async function POST(request: NextRequest) {
  try {
    const { visitorId, pageUrl, userId } = await request.json()

    // Validar inputs
    if (!visitorId || !isValidVisitorId(visitorId)) {
      return NextResponse.json({ error: "Invalid visitor ID" }, { status: 400 })
    }

    if (pageUrl && typeof pageUrl !== "string") {
      return NextResponse.json({ error: "Invalid page URL" }, { status: 400 })
    }

    if (userId && !isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se ja existe uma visita deste visitor
    const { data: existingVisit } = await supabase
      .from("site_visits")
      .select("id")
      .eq("visitor_id", visitorId)
      .single()

    if (existingVisit) {
      // Atualizar last_seen
      await supabase
        .from("site_visits")
        .update({ 
          last_seen: new Date().toISOString(),
          page_url: pageUrl,
          user_id: userId || null
        })
        .eq("visitor_id", visitorId)
    } else {
      // Criar nova visita
      await supabase
        .from("site_visits")
        .insert({
          visitor_id: visitorId,
          page_url: pageUrl,
          user_id: userId || null
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao rastrear visita:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Visitantes online (last_seen nos ultimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: onlineVisitors, error: onlineError } = await supabase
      .from("site_visits")
      .select("*")
      .gte("last_seen", fiveMinutesAgo)

    // Total de visitantes hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayVisitors, error: todayError } = await supabase
      .from("site_visits")
      .select("*")
      .gte("created_at", today.toISOString())

    // Total de membros registrados
    const { count: totalMembers, error: membersError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })

    // Membros registrados hoje
    const { count: newMembersToday, error: newMembersError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())

    // Total de visitas (todos os tempos)
    const { count: totalVisits, error: totalError } = await supabase
      .from("site_visits")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      online: onlineVisitors?.length || 0,
      todayVisitors: todayVisitors?.length || 0,
      totalVisits: totalVisits || 0,
      totalMembers: totalMembers || 0,
      newMembersToday: newMembersToday || 0
    })
  } catch (error) {
    console.error("Erro ao buscar analytics:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
