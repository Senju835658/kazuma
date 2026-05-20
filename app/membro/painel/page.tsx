"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { 
  Home, 
  LogOut, 
  Bell, 
  BellOff, 
  Calendar, 
  CalendarPlus,
  User,
  Mail,
  Settings,
  Zap,
  MessageCircle,
  Users,
  Swords
} from "lucide-react"
import ChatComponent from "@/components/chat"
import FriendsChat from "@/components/friends-chat"
import Profile from "@/components/profile"
import WorldDominationGame from "@/components/world-domination-game"

type Event = {
  id: string
  title: string
  description: string | null
  event_type: string
  is_live: boolean
  image_url: string | null
  start_time: string | null
  end_time: string | null
  created_at: string
}

type Member = {
  id: string
  user_id: string
  email: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  game_id: string | null
  language: string | null
  notify_events: boolean
  created_at: string
}

export default function MemberPanelPage() {
  const [member, setMember] = useState<Member | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [subscribedEvents, setSubscribedEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<"eventos" | "chat" | "amigos" | "perfil" | "jogo">("perfil")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchEvents()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push("/membro/login")
      return
    }

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", user.id)

    if (!memberData || memberData.length === 0) {
      // Criar membro se nao existir
      const { data: newMember } = await supabase
        .from("members")
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || "",
          notify_events: true
        })
        .select()
        .single()
      
      if (newMember) {
        setMember(newMember)
      }
    } else {
      setMember(memberData[0])
      
      // Buscar inscricoes
      const { data: subs } = await supabase
        .from("event_subscriptions")
        .select("event_id")
        .eq("member_id", memberData[0].id)
      
      if (subs) {
        setSubscribedEvents(subs.map(s => s.event_id))
      }
    }
    
    setLoading(false)
  }

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setEvents(data)
    }
  }

  const toggleNotifications = async () => {
    if (!member) return
    setSavingSettings(true)

    const { error } = await supabase
      .from("members")
      .update({ notify_events: !member.notify_events })
      .eq("id", member.id)

    if (!error) {
      setMember({ ...member, notify_events: !member.notify_events })
    }

    setSavingSettings(false)
  }

  const subscribeToEvent = async (eventId: string) => {
    if (!member) return

    if (subscribedEvents.includes(eventId)) {
      // Desinscrever
      await supabase
        .from("event_subscriptions")
        .delete()
        .eq("member_id", member.id)
        .eq("event_id", eventId)
      
      setSubscribedEvents(subscribedEvents.filter(id => id !== eventId))
    } else {
      // Inscrever
      await supabase
        .from("event_subscriptions")
        .insert({
          member_id: member.id,
          event_id: eventId
        })
      
      setSubscribedEvents([...subscribedEvents, eventId])
    }
  }

  const addToGoogleCalendar = (event: Event) => {
    const startDate = event.start_time 
      ? new Date(event.start_time).toISOString().replace(/-|:|\.\d+/g, "")
      : new Date().toISOString().replace(/-|:|\.\d+/g, "")
    
    const endDate = event.end_time
      ? new Date(event.end_time).toISOString().replace(/-|:|\.\d+/g, "")
      : new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, "")

    const title = encodeURIComponent(event.title)
    const details = encodeURIComponent(event.description || "Evento da Alianca FODA")
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`
    
    window.open(googleCalendarUrl, "_blank")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen text-white relative"
      style={{
        backgroundImage: "url('/bg-panels.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10">
      {/* Header */}
      <header className="border-b border-[#222] bg-[#0d0d0d]/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <h1 
              className="text-xl font-bold font-[family-name:var(--font-cinzel)]"
              style={{
                color: '#dc2626',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.6)'
              }}
            >
              Alianca FODA
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded-lg text-sm transition-colors"
            >
              <Home className="w-4 h-4" />
              Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-500 rounded-lg text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Ola, {member?.name || "Membro"}!
          </h2>
          <p className="text-gray-400">
            Gerencie suas notificacoes e acompanhe os eventos da alianca.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "perfil"
                ? "bg-red-600 text-white"
                : "bg-[#252525] text-gray-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab("eventos")}
            className={`px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "eventos"
                ? "bg-red-600 text-white"
                : "bg-[#252525] text-gray-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Eventos
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "chat"
                ? "bg-red-600 text-white"
                : "bg-[#252525] text-gray-400 hover:text-white"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("amigos")}
            className={`px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "amigos"
                ? "bg-red-600 text-white"
                : "bg-[#252525] text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Amigos
          </button>
          <button
            onClick={() => setActiveTab("jogo")}
            className={`px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "jogo"
                ? "bg-red-600 text-white"
                : "bg-[#252525] text-gray-400 hover:text-white"
            }`}
          >
            <Swords className="w-4 h-4" />
            Jogo
          </button>
        </div>

        {activeTab === "perfil" ? (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Meu Perfil</h3>
              <p className="text-gray-400 text-sm">Personalize seu perfil e configuracoes.</p>
            </div>
            {member && (
              <Profile
                member={member}
                onUpdate={(updated) => setMember(updated)}
              />
            )}
          </div>
        ) : activeTab === "eventos" ? (
        <>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Membro desde</p>
                <p className="font-medium">
                  {member?.created_at ? new Date(member.created_at).toLocaleDateString("pt-BR") : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Eventos inscritos</p>
                <p className="font-medium">{subscribedEvents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${member?.notify_events ? "bg-blue-600/20" : "bg-gray-600/20"} rounded-lg flex items-center justify-center`}>
                {member?.notify_events ? (
                  <Bell className="w-5 h-5 text-blue-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-gray-400 text-sm">Notificacoes</p>
                <p className="font-medium">{member?.notify_events ? "Ativas" : "Desativadas"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuracoes
          </h3>
          
          <div className="flex items-center justify-between py-4 border-b border-[#333]">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-gray-400 text-sm">{member?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Notificacoes por Email</p>
                <p className="text-gray-400 text-sm">Receba alertas sobre novos eventos</p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              disabled={savingSettings}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                member?.notify_events ? "bg-red-600" : "bg-[#333]"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  member?.notify_events ? "left-8" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Events */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Eventos Disponiveis
          </h3>

          {events.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
              <p className="text-gray-400">Nenhum evento disponivel no momento.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {event.image_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#252525] flex-shrink-0">
                          <Image
                            src={event.image_url}
                            alt={event.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          {event.is_live && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                              AO VIVO
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {event.description || "Sem descricao"}
                        </p>
                        {event.start_time && (
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(event.start_time).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => subscribeToEvent(event.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          subscribedEvents.includes(event.id)
                            ? "bg-green-600/20 text-green-400 border border-green-600/50"
                            : "bg-[#252525] hover:bg-[#333] border border-[#333]"
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                        {subscribedEvents.includes(event.id) ? "Inscrito" : "Inscrever"}
                      </button>
                      <button
                        onClick={() => addToGoogleCalendar(event)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                        title="Adicionar ao Google Calendar"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        Calendario
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        ) : activeTab === "chat" ? (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Chat da Alianca</h3>
              <p className="text-gray-400 text-sm">Converse com outros membros e administradores. Clique em "Traduzir" para ver mensagens em seu idioma.</p>
            </div>
            {member && (
              <ChatComponent
                userId={member.user_id}
                userName={member.name || member.email.split("@")[0]}
                userType="member"
                userLanguage={member.language || "pt"}
                userAvatar={member.avatar_url}
                userGameId={member.game_id}
              />
            )}
          </div>
        ) : activeTab === "amigos" ? (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Amigos</h3>
              <p className="text-gray-400 text-sm">Adicione amigos e converse no privado.</p>
            </div>
            {member && (
              <FriendsChat
                userId={member.user_id}
                userName={member.name || member.email.split("@")[0]}
              />
            )}
          </div>
        ) : activeTab === "jogo" ? (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Dominacao Mundial</h3>
              <p className="text-gray-400 text-sm">Conquiste territorios e domine o mapa!</p>
            </div>
            {member && (
              <WorldDominationGame
                userId={member.user_id}
                userName={member.name || member.email.split("@")[0]}
              />
            )}
          </div>
        ) : null}
      </main>
      </div>
    </div>
  )
}
