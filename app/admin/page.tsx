"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  LogOut, 
  Calendar, 
  Zap, 
  Save,
  X,
  Home,
  ImageIcon,
  Users,
  UserPlus,
  Mail,
  Bell,
  BarChart3,
  Eye,
  UserCheck,
  Trophy,
  Crown,
  Clock,
  MessageCircle,
  User,
  Check,
  Music
} from "lucide-react"
import Image from "next/image"
import ChatComponent from "@/components/chat"
import AdminProfile from "@/components/admin-profile"

type Event = {
  id: string
  title: string
  description: string | null
  event_type: string
  is_live: boolean
  image_url: string | null
  start_time: string | null
  end_time: string | null
  rewards: string[] | null
  created_at: string
}

type Admin = {
  id: string
  user_id: string
  email: string
  role: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

type Analytics = {
  online: number
  todayVisitors: number
  totalVisits: number
  totalMembers: number
  newMembersToday: number
}

type Ranking = {
  id: string
  player_name: string
  ranking_type: "poder" | "eliminacoes" | "doacoes"
  value: number
  position: number | null
  created_at: string
}

type GameMusic = {
  id: string
  title: string
  artist: string
  url: string
  album_id: string | null
  created_at: string
}

type MusicAlbum = {
  id: string
  name: string
  description: string | null
  cover_color: string
  created_at: string
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [musicList, setMusicList] = useState<GameMusic[]>([])
  const [albums, setAlbums] = useState<MusicAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showRankingModal, setShowRankingModal] = useState(false)
  const [showMusicModal, setShowMusicModal] = useState(false)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"perfil" | "chat" | "eventos" | "admins" | "analytics" | "ranking" | "agendados" | "email" | "musicas">("perfil")
  const [activeRankingType, setActiveRankingType] = useState<"poder" | "eliminacoes" | "doacoes">("poder")
  const [editingRanking, setEditingRanking] = useState<Ranking | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [saving, setSaving] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [adminError, setAdminError] = useState("")
  const [notifying, setNotifying] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [pendingActivateEvent, setPendingActivateEvent] = useState<Event | null>(null)
  const [customEmailMessage, setCustomEmailMessage] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [rankingForm, setRankingForm] = useState({
    player_name: "",
    value: "",
    ranking_type: "poder" as "poder" | "eliminacoes" | "doacoes"
  })
  const [musicForm, setMusicForm] = useState({
    title: "",
    artist: "",
    url: "",
    album_id: "" as string | null
  })
  const [albumForm, setAlbumForm] = useState({
    name: "",
    description: "",
    cover_color: "#8b5cf6"
  })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "normal",
    is_live: false,
    image_url: "",
    start_time: "",
    end_time: "",
    rewards: ""
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchEvents()
    fetchAdmins()
    fetchAnalytics()
    fetchRankings()
    fetchMusic()
    fetchAlbums()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push("/admin/login")
      return
    }

    const { data: adminData, error } = await supabase
      .from("admins")
      .select("*")
      .eq("user_id", user.id)

    if (error || !adminData || adminData.length === 0) {
      await supabase.auth.signOut()
      router.push("/admin/login?error=unauthorized")
      return
    }
    
    setCurrentAdmin(adminData[0])
  }

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setAdmins(data)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Erro ao buscar analytics:", error)
    }
  }

  const fetchRankings = async () => {
    const { data, error } = await supabase
      .from("rankings")
      .select("*")
      .order("value", { ascending: false })

    if (!error && data) {
      setRankings(data)
    }
  }

  const fetchMusic = async () => {
    const { data, error } = await supabase
      .from("game_music")
      .select("*")
      .order("created_at", { ascending: true })

    if (!error && data) {
      setMusicList(data)
    }
  }

  const fetchAlbums = async () => {
    const { data, error } = await supabase
      .from("music_albums")
      .select("*")
      .order("created_at", { ascending: true })

    if (!error && data) {
      setAlbums(data)
    }
  }

  const handleSaveMusic = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Extrair video ID se for URL completa do YouTube
    let videoId = musicForm.url
    if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
      const match = videoId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (match) videoId = match[1]
    }

    const { error } = await supabase
      .from("game_music")
      .insert({
        title: musicForm.title,
        artist: musicForm.artist || "Desconhecido",
        url: videoId,
        album_id: musicForm.album_id || null
      })

    if (!error) {
      fetchMusic()
      closeMusicModal()
    }

    setSaving(false)
  }

  const handleDeleteMusic = async (music: GameMusic) => {
    if (!confirm(`Tem certeza que deseja remover "${music.title}"?`)) return

    const { error } = await supabase
      .from("game_music")
      .delete()
      .eq("id", music.id)

    if (!error) {
      setMusicList(musicList.filter(m => m.id !== music.id))
    }
  }

  const openMusicModal = () => {
    setMusicForm({ title: "", artist: "", url: "", album_id: null })
    setShowMusicModal(true)
  }

  const closeMusicModal = () => {
    setShowMusicModal(false)
    setMusicForm({ title: "", artist: "", url: "", album_id: null })
  }

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from("music_albums")
      .insert({
        name: albumForm.name,
        description: albumForm.description || null,
        cover_color: albumForm.cover_color
      })

    if (!error) {
      fetchAlbums()
      closeAlbumModal()
    }

    setSaving(false)
  }

  const handleDeleteAlbum = async (album: MusicAlbum) => {
    if (!confirm(`Tem certeza que deseja remover o album "${album.name}"? As musicas nao serao excluidas.`)) return

    const { error } = await supabase
      .from("music_albums")
      .delete()
      .eq("id", album.id)

    if (!error) {
      setAlbums(albums.filter(a => a.id !== album.id))
    }
  }

  const openAlbumModal = () => {
    setAlbumForm({ name: "", description: "", cover_color: "#8b5cf6" })
    setShowAlbumModal(true)
  }

  const closeAlbumModal = () => {
    setShowAlbumModal(false)
    setAlbumForm({ name: "", description: "", cover_color: "#8b5cf6" })
  }

  const handleSaveRanking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const rankingData = {
      player_name: rankingForm.player_name,
      value: parseInt(rankingForm.value) || 0,
      ranking_type: rankingForm.ranking_type
    }

    if (editingRanking) {
      const { error } = await supabase
        .from("rankings")
        .update({ ...rankingData, updated_at: new Date().toISOString() })
        .eq("id", editingRanking.id)

      if (!error) {
        fetchRankings()
        closeRankingModal()
      }
    } else {
      const { error } = await supabase
        .from("rankings")
        .insert(rankingData)

      if (!error) {
        fetchRankings()
        closeRankingModal()
      }
    }

    setSaving(false)
  }

  const handleDeleteRanking = async (ranking: Ranking) => {
    if (!confirm(`Tem certeza que deseja remover ${ranking.player_name} do ranking?`)) return

    const { error } = await supabase
      .from("rankings")
      .delete()
      .eq("id", ranking.id)

    if (!error) {
      setRankings(rankings.filter(r => r.id !== ranking.id))
    }
  }

  const openCreateRankingModal = () => {
    setEditingRanking(null)
    setRankingForm({
      player_name: "",
      value: "",
      ranking_type: activeRankingType
    })
    setShowRankingModal(true)
  }

  const openEditRankingModal = (ranking: Ranking) => {
    setEditingRanking(ranking)
    setRankingForm({
      player_name: ranking.player_name,
      value: ranking.value.toString(),
      ranking_type: ranking.ranking_type
    })
    setShowRankingModal(true)
  }

  const closeRankingModal = () => {
    setShowRankingModal(false)
    setEditingRanking(null)
    setRankingForm({
      player_name: "",
      value: "",
      ranking_type: "poder"
    })
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setAdminError("")

    // Criar conta no Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: newAdminEmail,
      password: newAdminPassword,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
          `${window.location.origin}/auth/callback`
      }
    })

    if (signUpError) {
      setAdminError(signUpError.message)
      setSaving(false)
      return
    }

    if (signUpData.user) {
      // Adicionar à tabela de admins
      const { error: insertError } = await supabase
        .from("admins")
        .insert({
          user_id: signUpData.user.id,
          email: newAdminEmail
        })

      if (insertError) {
        setAdminError("Erro ao adicionar admin: " + insertError.message)
        setSaving(false)
        return
      }

      // Atualizar lista
      fetchAdmins()
      setShowAdminModal(false)
      setNewAdminEmail("")
      setNewAdminPassword("")
    }

    setSaving(false)
  }

  const handleDeleteAdmin = async (admin: Admin) => {
    if (admin.email === "gb835658@gmail.com") {
      alert("Não é possível remover o administrador principal")
      return
    }

    if (!confirm(`Tem certeza que deseja remover ${admin.email} como administrador?`)) return

    const { error } = await supabase
      .from("admins")
      .delete()
      .eq("id", admin.id)

    if (!error) {
      setAdmins(admins.filter(a => a.id !== admin.id))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const openCreateModal = () => {
    setEditingEvent(null)
    setFormData({
      title: "",
      description: "",
      event_type: "normal",
      is_live: false,
      image_url: "",
      start_time: "",
      end_time: "",
      rewards: ""
    })
    setShowModal(true)
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      is_live: event.is_live,
      image_url: event.image_url || "",
      start_time: event.start_time ? event.start_time.slice(0, 16) : "",
      end_time: event.end_time ? event.end_time.slice(0, 16) : "",
      rewards: event.rewards?.join(", ") || ""
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const eventData = {
      title: formData.title,
      description: formData.description || null,
      event_type: formData.event_type,
      is_live: formData.is_live,
      image_url: formData.image_url || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      rewards: formData.rewards ? formData.rewards.split(",").map(r => r.trim()) : null,
      updated_at: new Date().toISOString()
    }

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingEvent.id)

      if (!error) {
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e))
      }
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single()

      if (!error && data) {
        setEvents([data, ...events])
      }
    }

    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)

    if (!error) {
      setEvents(events.filter(e => e.id !== id))
    }
  }

  const toggleLive = async (event: Event) => {
    // Se estamos ATIVANDO o evento, abrir modal para mensagem personalizada
    if (!event.is_live) {
      setPendingActivateEvent(event)
      setCustomEmailMessage(`O evento "${event.title}" comecou! Participe agora e garanta suas recompensas.`)
      setShowEmailModal(true)
      return
    }
    
    // Se estamos DESATIVANDO, apenas desativar
    const { error } = await supabase
      .from("events")
      .update({ is_live: false })
      .eq("id", event.id)

    if (!error) {
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_live: false } : e))
    }
  }

  const confirmActivateEvent = async () => {
    if (!pendingActivateEvent) return
    
    const event = pendingActivateEvent
    
    // Desativar outros eventos do mesmo tipo
    const { error: deactivateError } = await supabase
      .from("events")
      .update({ is_live: false, end_time: new Date().toISOString() })
      .eq("event_type", event.event_type)
      .eq("is_live", true)
      .neq("id", event.id)

    if (!deactivateError) {
      setEvents(prev => prev.map(e => 
        e.event_type === event.event_type && e.is_live && e.id !== event.id
          ? { ...e, is_live: false }
          : e
      ))
    }

    // Ativar o evento selecionado
    const { error } = await supabase
      .from("events")
      .update({ is_live: true })
      .eq("id", event.id)

    if (!error) {
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_live: true } : e))
      
      // Enviar email com mensagem personalizada
      try {
        await fetch("/api/notify-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: event.id,
            eventTitle: event.title,
            eventDescription: customEmailMessage || event.description,
            eventDate: event.start_time || new Date().toISOString(),
            eventEndDate: event.end_time,
            eventType: event.event_type,
            customMessage: customEmailMessage
          })
        })
      } catch (e) {
        console.error("Erro ao enviar notificacao por email:", e)
      }
    }
    
    // Fechar modal e limpar estados
    setShowEmailModal(false)
    setPendingActivateEvent(null)
    setCustomEmailMessage("")
  }

  const cancelActivateEvent = () => {
    setShowEmailModal(false)
    setPendingActivateEvent(null)
    setCustomEmailMessage("")
  }

  const sendBroadcastEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return
    
    setSendingEmail(true)
    setEmailSent(false)
    
    try {
      const response = await fetch("/api/send-broadcast-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailBody
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setEmailSent(true)
        setEmailSubject("")
        setEmailBody("")
        setTimeout(() => setEmailSent(false), 5000)
      } else {
        alert("Erro ao enviar email: " + (data.error || "Erro desconhecido"))
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      alert("Erro ao enviar email")
    } finally {
      setSendingEmail(false)
    }
  }

  const notifyMembers = async (event: Event) => {
    setNotifying(event.id)
    
    try {
      const response = await fetch("/api/notify-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          eventDescription: event.description,
          eventDate: event.start_time,
          eventEndDate: event.end_time,
          eventType: event.event_type
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Notificações enviadas! ${data.sent} de ${data.total} membros notificados.`)
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert("Erro ao enviar notificações")
    }
    
    setNotifying(null)
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
      <div className="absolute inset-0 bg-black/85" />
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-[#1a1a1a]/90 backdrop-blur border-b border-[#333] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 
              className="text-xl font-bold font-[family-name:var(--font-cinzel)]"
              style={{
                color: '#dc2626',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
              }}
            >
              Painel Admin
            </h1>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400 text-sm">Aliança FODA</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-[#252525] hover:bg-[#333] rounded-lg text-sm transition-colors"
            >
              <Home className="w-4 h-4" />
              Ver Site
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[#333] flex-wrap">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "perfil"
                ? "border-yellow-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <User className="w-4 h-4 inline-block mr-2" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "chat"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <MessageCircle className="w-4 h-4 inline-block mr-2" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("eventos")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "eventos"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Calendar className="w-4 h-4 inline-block mr-2" />
            Eventos
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "admins"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Administradores
          </button>
          <button
            onClick={() => { setActiveTab("analytics"); fetchAnalytics(); }}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "analytics"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-2" />
            Analytics
          </button>
          <button
            onClick={() => { setActiveTab("ranking"); fetchRankings(); }}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "ranking"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Trophy className="w-4 h-4 inline-block mr-2" />
            Ranking
          </button>
          <button
            onClick={() => setActiveTab("agendados")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "agendados"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Clock className="w-4 h-4 inline-block mr-2" />
            Agendados
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "email"
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Mail className="w-4 h-4 inline-block mr-2" />
            Email
          </button>
          <button
            onClick={() => { setActiveTab("musicas"); fetchMusic(); }}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "musicas"
                ? "border-purple-500 text-white"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Music className="w-4 h-4 inline-block mr-2" />
            Musicas
          </button>
        </div>

        {activeTab === "perfil" ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Meu Perfil</h2>
            {currentAdmin && (
              <AdminProfile
                admin={currentAdmin}
                onUpdate={(updated) => setCurrentAdmin(updated)}
              />
            )}
          </div>
        ) : activeTab === "chat" ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Chat da Alianca</h2>
            {currentAdmin && (
              <ChatComponent
                userId={currentAdmin.user_id}
                userName={currentAdmin.name || currentAdmin.email.split("@")[0]}
                userType="admin"
                userLanguage="pt"
                userAvatar={currentAdmin.avatar_url}
                userGameId={null}
              />
            )}
          </div>
        ) : activeTab === "eventos" ? (
          <>
            {/* Missoes Diarias Automatizadas */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Missoes Diarias (Automatizado)</h2>
                  <p className="text-gray-500 text-xs mt-1">As missoes mudam automaticamente todo dia baseado no dia da semana</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { day: 1, name: "Segunda", theme: "Coleta e Corvo", color: "green" },
                  { day: 2, name: "Terca", theme: "Construcao", color: "blue" },
                  { day: 3, name: "Quarta", theme: "Pesquisa", color: "purple" },
                  { day: 4, name: "Quinta", theme: "Herois", color: "yellow" },
                  { day: 5, name: "Sexta", theme: "Treinamento", color: "orange" },
                  { day: 6, name: "Sabado", theme: "Batalha", color: "red" },
                ].map((item) => {
                  const today = new Date().getDay()
                  const isToday = (today === 0 ? 7 : today) === item.day || (today === 0 && item.day === 6)
                  const adjustedToday = today === 0 ? 7 : today
                  const isTodayMatch = adjustedToday === item.day
                  
                  return (
                    <div
                      key={item.day}
                      className={`p-4 rounded-xl border transition-all ${
                        isTodayMatch 
                          ? "bg-red-500/20 border-red-500/50 ring-2 ring-red-500/30" 
                          : "bg-[#1a1a1a] border-[#333] hover:border-[#444]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold ${isTodayMatch ? "text-red-400" : "text-gray-500"}`}>
                          DIA {item.day}
                        </span>
                        {isTodayMatch && (
                          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                            HOJE
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className={`text-xs mt-1 ${
                        item.color === "green" ? "text-green-400" :
                        item.color === "blue" ? "text-blue-400" :
                        item.color === "purple" ? "text-purple-400" :
                        item.color === "yellow" ? "text-yellow-400" :
                        item.color === "orange" ? "text-orange-400" :
                        "text-red-400"
                      }`}>
                        {item.theme}
                      </p>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-xs">
                  As missoes sao exibidas automaticamente na pagina inicial baseado no dia da semana atual. Nenhuma acao necessaria.
                </p>
              </div>
            </div>

            <hr className="border-[#333] mb-8" />

            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold">Outros Eventos</h2>
                <p className="text-gray-400 text-sm mt-1">{events.length} evento(s) cadastrado(s)</p>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Evento
              </button>
            </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#333]">
            <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum evento cadastrado</p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-red-400 hover:text-red-300 text-xs"
            >
              Criar primeiro evento
            </button>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#333] text-xs text-gray-500 uppercase">
                  <th className="text-left px-4 py-3">Evento</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Data</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-[#333]/50 hover:bg-[#252525]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#252525] rounded-lg overflow-hidden flex-shrink-0">
                          {event.image_url ? (
                            <Image src={event.image_url} alt={event.title} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]">{event.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">{event.description || "Sem descricao"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-400 capitalize">{event.event_type}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-400">
                        {event.start_time ? new Date(event.start_time).toLocaleDateString("pt-BR") : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {event.is_live ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          <Zap className="w-3 h-3" />
                          LIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-600/30 text-gray-400 text-xs rounded-full">OFF</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => notifyMembers(event)}
                          disabled={notifying === event.id}
                          className="p-1.5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded transition-colors"
                          title="Notificar"
                        >
                          {notifying === event.id ? (
                            <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleLive(event)}
                          className={`p-1.5 rounded transition-colors ${event.is_live ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" : "hover:bg-green-500/20 text-gray-400 hover:text-green-400"}`}
                          title={event.is_live ? "Encerrar" : "Reativar"}
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(event)}
                          className="p-1.5 hover:bg-[#333] text-gray-400 hover:text-white rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === "email" ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Enviar Email</h2>
                <p className="text-gray-500 text-xs mt-1">Envie mensagens por email para todos os membros</p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-6">
              {emailSent && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Email enviado com sucesso para todos os membros!
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assunto do Email
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Ex: Novo evento na alianca!"
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={8}
                    placeholder="Digite a mensagem que sera enviada para todos os membros..."
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                  <p className="text-xs text-gray-500">
                    O email sera enviado para todos os membros que aceitaram receber notificacoes.
                  </p>
                  <button
                    onClick={sendBroadcastEmail}
                    disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {sendingEmail ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Enviar Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "musicas" ? (
          <div>
            {/* Albums Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Albums</h2>
                  <p className="text-gray-500 text-xs mt-1">Crie albums para organizar as musicas</p>
                </div>
                <button
                  onClick={openAlbumModal}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Album
                </button>
              </div>

              <div className="flex gap-3 flex-wrap">
                {albums.map((album) => {
                  const albumMusics = musicList.filter(m => m.album_id === album.id)
                  return (
                    <div
                      key={album.id}
                      className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 min-w-[180px] hover:border-[#444] transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: album.cover_color + "30" }}
                        >
                          <Music className="w-5 h-5" style={{ color: album.cover_color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{album.name}</h3>
                          <p className="text-gray-500 text-xs">{albumMusics.length} musicas</p>
                        </div>
                      </div>
                      {album.name !== "Geral" && (
                        <button
                          onClick={() => handleDeleteAlbum(album)}
                          className="text-xs text-red-400 hover:text-red-300 mt-2"
                        >
                          Excluir album
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <hr className="border-[#333] mb-6" />

            {/* Musicas Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Musicas</h2>
                <p className="text-gray-500 text-xs mt-1">Gerencie as musicas que tocam no site</p>
              </div>
              <button
                onClick={openMusicModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar Musica
              </button>
            </div>

            {musicList.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-12 text-center">
                <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Nenhuma musica cadastrada</h3>
                <p className="text-gray-500 text-sm mb-4">Adicione musicas do YouTube para tocar no site</p>
                <button
                  onClick={openMusicModal}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                >
                  Adicionar primeira musica
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {musicList.map((music, index) => {
                  const album = albums.find(a => a.id === music.album_id)
                  return (
                    <div
                      key={music.id}
                      className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex items-center justify-between hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{ 
                            backgroundColor: album?.cover_color ? album.cover_color + "30" : "#8b5cf630",
                            color: album?.cover_color || "#8b5cf6"
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{music.title}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-500 text-sm">{music.artist}</p>
                            {album && (
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: album.cover_color + "20",
                                  color: album.cover_color
                                }}
                              >
                                {album.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://youtube.com/watch?v=${music.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors text-xs"
                        >
                          Ver no YouTube
                        </a>
                        <button
                          onClick={() => handleDeleteMusic(music)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <h4 className="font-medium text-purple-400 mb-2">Como adicionar musicas</h4>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Encontre um video do YouTube que queira adicionar</li>
                <li>Copie a URL completa ou apenas o ID do video</li>
                <li>Selecione um album (opcional) para organizar</li>
                <li>Cole no campo URL ao adicionar a musica</li>
              </ol>
              <p className="text-xs text-gray-500 mt-2">Exemplo de ID: dQw4w9WgXcQ (parte apos v= na URL)</p>
            </div>
          </div>
        ) : activeTab === "admins" ? (
          <>
            {/* Admins Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Administradores</h2>
                <p className="text-gray-400 text-sm mt-1">{admins.length} administrador(es) cadastrado(s)</p>
              </div>
              <button
                onClick={() => setShowAdminModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Novo Admin
              </button>
            </div>

            {/* Admins List */}
            <div className="grid gap-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-gray-500 text-sm">
                        Adicionado em {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {admin.email === "gb835658@gmail.com" && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                        Lider
                      </span>
                    )}
                  </div>
                  {admin.email !== "gb835658@gmail.com" && (
                    <button
                      onClick={() => handleDeleteAdmin(admin)}
                      className="px-3 py-2 bg-[#252525] hover:bg-red-500/20 hover:text-red-400 rounded-lg text-sm transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : activeTab === "analytics" ? (
          <>
            {/* Analytics Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold">Analytics do Site</h2>
              <p className="text-gray-400 text-sm mt-1">Acompanhe visitantes e registros em tempo real</p>
            </div>

            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Online Agora */}
                <div className="bg-[#1a1a1a] border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Eye className="w-7 h-7 text-green-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Online Agora</p>
                      <p className="text-3xl font-bold text-green-500">{analytics.online}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-500 text-xs">Ativos nos ultimos 5 minutos</span>
                  </div>
                </div>

                {/* Visitantes Hoje */}
                <div className="bg-[#1a1a1a] border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Visitantes Hoje</p>
                      <p className="text-3xl font-bold text-blue-500">{analytics.todayVisitors}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-500 text-xs">Visitantes unicos desde meia-noite</span>
                  </div>
                </div>

                {/* Total de Visitas */}
                <div className="bg-[#1a1a1a] border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total de Visitas</p>
                      <p className="text-3xl font-bold text-purple-500">{analytics.totalVisits}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-500 text-xs">Desde o inicio do site</span>
                  </div>
                </div>

                {/* Membros Registrados */}
                <div className="bg-[#1a1a1a] border border-red-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
                      <UserCheck className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Membros Registrados</p>
                      <p className="text-3xl font-bold text-red-500">{analytics.totalMembers}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-500 text-xs">Total de contas criadas</span>
                  </div>
                </div>

                {/* Novos Membros Hoje */}
                <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <UserPlus className="w-7 h-7 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Novos Membros Hoje</p>
                      <p className="text-3xl font-bold text-yellow-500">{analytics.newMembersToday}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-500 text-xs">Registros desde meia-noite</span>
                  </div>
                </div>

                {/* Botao Atualizar */}
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 flex items-center justify-center">
                  <button
                    onClick={fetchAnalytics}
                    className="px-6 py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Atualizar Dados
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Carregando dados...</p>
              </div>
            )}
          </>
        ) : activeTab === "ranking" ? (
          <>
            {/* Ranking Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Ranking</h2>
                <p className="text-gray-400 text-sm mt-1">Atualize os rankings de poder, eliminacoes e doacoes</p>
              </div>
              <button
                onClick={openCreateRankingModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar Jogador
              </button>
            </div>

            {/* Ranking Type Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveRankingType("poder")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeRankingType === "poder"
                    ? "bg-yellow-500 text-black"
                    : "bg-[#252525] text-gray-400 hover:text-white"
                }`}
              >
                <Crown className="w-4 h-4 inline-block mr-2" />
                Poder
              </button>
              <button
                onClick={() => setActiveRankingType("eliminacoes")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeRankingType === "eliminacoes"
                    ? "bg-red-500 text-white"
                    : "bg-[#252525] text-gray-400 hover:text-white"
                }`}
              >
                <Trash2 className="w-4 h-4 inline-block mr-2" />
                Eliminacoes
              </button>
              <button
                onClick={() => setActiveRankingType("doacoes")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeRankingType === "doacoes"
                    ? "bg-green-500 text-white"
                    : "bg-[#252525] text-gray-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 inline-block mr-2" />
                Doacoes
              </button>
            </div>

            {/* Ranking List */}
            <div className="space-y-3">
              {rankings
                .filter(r => r.ranking_type === activeRankingType)
                .sort((a, b) => b.value - a.value)
                .map((ranking, index) => (
                  <div
                    key={ranking.id}
                    className={`bg-[#1a1a1a] border rounded-xl p-4 flex items-center gap-4 ${
                      index === 0 ? "border-yellow-500/50" : 
                      index === 1 ? "border-gray-400/50" : 
                      index === 2 ? "border-orange-600/50" : "border-[#333]"
                    }`}
                  >
                    {/* Position */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? "bg-yellow-500 text-black" : 
                      index === 1 ? "bg-gray-400 text-black" : 
                      index === 2 ? "bg-orange-600 text-white" : "bg-[#333] text-gray-400"
                    }`}>
                      {index + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-grow">
                      <p className="font-semibold">{ranking.player_name}</p>
                      <p className={`text-sm font-bold ${
                        activeRankingType === "poder" ? "text-yellow-500" :
                        activeRankingType === "eliminacoes" ? "text-red-500" : "text-green-500"
                      }`}>
                        {ranking.value.toLocaleString("pt-BR")}
                        {activeRankingType === "poder" ? " de poder" :
                         activeRankingType === "eliminacoes" ? " eliminacoes" : " doacoes"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditRankingModal(ranking)}
                        className="px-3 py-2 bg-[#252525] hover:bg-[#333] rounded-lg text-sm transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRanking(ranking)}
                        className="px-3 py-2 bg-[#252525] hover:bg-red-500/20 hover:text-red-400 rounded-lg text-sm transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

              {rankings.filter(r => r.ranking_type === activeRankingType).length === 0 && (
                <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-[#333]">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum jogador no ranking de {activeRankingType}</p>
                  <button
                    onClick={openCreateRankingModal}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Adicionar primeiro jogador
                  </button>
                </div>
              )}
            </div>
          </>
        ) : activeTab === "agendados" ? (
          <>
            {/* Eventos Agendados Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Eventos Agendados</h2>
                <p className="text-gray-500 text-xs mt-1">Liberados automaticamente no horario programado</p>
              </div>
            </div>

            {/* Lista de Eventos Agendados */}
            {events.filter(e => !e.is_live && e.start_time && new Date(e.start_time) > new Date()).length === 0 ? (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhum evento agendado</p>
                <p className="text-gray-500 text-xs mt-2">
                  Crie um evento na aba "Eventos" com data futura
                </p>
              </div>
            ) : (
              <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333] text-xs text-gray-500 uppercase">
                      <th className="text-left px-4 py-3">Evento</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Libera em</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events
                      .filter(e => !e.is_live && e.start_time && new Date(e.start_time) > new Date())
                      .sort((a, b) => new Date(a.start_time!).getTime() - new Date(b.start_time!).getTime())
                      .map((event) => (
                        <tr key={event.id} className="border-b border-[#333]/50 hover:bg-yellow-500/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#252525] rounded-lg overflow-hidden flex-shrink-0 border border-yellow-500/20">
                                {event.image_url ? (
                                  <Image src={event.image_url} alt={event.title} width={40} height={40} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-yellow-500/50" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]">{event.title}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">{event.description || "Sem descricao"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-yellow-400 font-medium">
                              {event.start_time && new Date(event.start_time).toLocaleString("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short"
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              <Clock className="w-3 h-3" />
                              AGENDADO
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleLive(event)}
                                className="p-1.5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded transition-colors"
                                title="Liberar agora"
                              >
                                <Zap className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(event)}
                                className="p-1.5 hover:bg-[#333] text-gray-400 hover:text-white rounded transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </main>
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowAdminModal(false)}
          />
          <div className="relative bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-md">
            <div className="border-b border-[#333] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Novo Administrador</h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1 hover:bg-[#333] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-5">
              {adminError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {adminError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="admin@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Minimo 6 caracteres"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Criar Admin
                    </>
                  )}
                </button>
              </div>

              <p className="text-gray-500 text-xs text-center">
                O novo admin precisara confirmar o email antes de fazer login.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Album Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={closeAlbumModal}
          />
          <div className="relative bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-md">
            <div className="border-b border-[#333] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-indigo-500" />
                Criar Novo Album
              </h3>
              <button
                onClick={closeAlbumModal}
                className="p-1 hover:bg-[#333] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Album *
                </label>
                <input
                  type="text"
                  required
                  value={albumForm.name}
                  onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Musicas de Guerra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descricao (opcional)
                </label>
                <input
                  type="text"
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Musicas para batalhas epicas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cor do Album
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={albumForm.cover_color}
                    onChange={(e) => setAlbumForm({ ...albumForm, cover_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={albumForm.cover_color}
                    onChange={(e) => setAlbumForm({ ...albumForm, cover_color: e.target.value })}
                    className="flex-1 px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAlbumModal}
                  className="flex-1 py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Criar Album
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Music Modal */}
      {showMusicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={closeMusicModal}
          />
          <div className="relative bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-md">
            <div className="border-b border-[#333] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-500" />
                Adicionar Musica
              </h3>
              <button
                onClick={closeMusicModal}
                className="p-1 hover:bg-[#333] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMusic} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titulo da Musica *
                </label>
                <input
                  type="text"
                  required
                  value={musicForm.title}
                  onChange={(e) => setMusicForm({ ...musicForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: Lofi Hip Hop Radio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artista
                </label>
                <input
                  type="text"
                  value={musicForm.artist}
                  onChange={(e) => setMusicForm({ ...musicForm, artist: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: Lofi Girl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL ou ID do YouTube *
                </label>
                <input
                  type="text"
                  required
                  value={musicForm.url}
                  onChange={(e) => setMusicForm({ ...musicForm, url: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: dQw4w9WgXcQ ou URL completa"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cole a URL completa do YouTube ou apenas o ID do video
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Album (opcional)
                </label>
                <select
                  value={musicForm.album_id || ""}
                  onChange={(e) => setMusicForm({ ...musicForm, album_id: e.target.value || null })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">Sem album</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>{album.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeMusicModal}
                  className="flex-1 py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-[#1a1a1a] border border-[#333] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#333] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingEvent ? "Editar Evento" : "Novo Evento"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-[#333] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Vale dos Cristais"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                  placeholder="Descrição do evento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Evento
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="normal">Normal</option>
                    <option value="guerra">Guerra</option>
                    <option value="caravana">Caravana</option>
                    <option value="especial">Especial</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer mt-6">
                    <input
                      type="checkbox"
                      checked={formData.is_live}
                      onChange={(e) => setFormData({ ...formData, is_live: e.target.checked })}
                      className="w-5 h-5 rounded border-[#333] bg-[#0d0d0d] text-red-500 focus:ring-red-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">Evento AO VIVO</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data e Hora de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data e Hora de Termino
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Checkbox para ativar AO VIVO */}
              <div className="flex items-center gap-3 p-4 bg-[#252525] rounded-lg border border-[#333]">
                <input
                  type="checkbox"
                  id="is_live"
                  checked={formData.is_live}
                  onChange={(e) => setFormData({ ...formData, is_live: e.target.checked })}
                  className="w-5 h-5 rounded border-[#333] bg-[#0d0d0d] text-red-600 focus:ring-red-500"
                />
                <label htmlFor="is_live" className="flex-grow cursor-pointer">
                  <span className="font-medium text-white">Ativar como AO VIVO</span>
                  <p className="text-gray-400 text-sm">Marque para exibir o evento com status ao vivo no site</p>
                </label>
                {formData.is_live && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    AO VIVO
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recompensas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.rewards}
                  onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Cristais, Ouro, Equipamentos"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Mensagem de Email */}
      {showEmailModal && pendingActivateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={cancelActivateEvent}
          />
          <div className="relative bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-lg border border-[#333]">
            <h3 className="text-xl font-bold mb-2">Ativar Evento</h3>
            <p className="text-gray-400 text-sm mb-4">
              Personalize a mensagem que sera enviada por email para todos os membros.
            </p>
            
            <div className="mb-4 p-3 bg-[#252525] rounded-lg border border-[#333]">
              <p className="text-sm text-gray-300">
                <span className="text-red-500 font-medium">{pendingActivateEvent.title}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mensagem do Email
              </label>
              <textarea
                value={customEmailMessage}
                onChange={(e) => setCustomEmailMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                placeholder="Digite a mensagem que sera enviada..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelActivateEvent}
                className="flex-1 py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmActivateEvent}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Ativar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
