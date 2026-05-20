"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Send, Trash2, Globe, Shield, User, Smile, Mic, Square, Play, Pause } from "lucide-react"

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😅", "😊",
  "👍", "👎", "👏", "🙌", "💪", "🔥", "⚔️", "🛡️",
  "🎮", "🎯", "🏆", "⭐", "💎", "💰", "🎁", "🎉",
  "❤️", "💜", "💙", "💚", "💛", "🧡", "🤍", "🖤",
  "✅", "❌", "⚠️", "💬", "👋", "🤝", "💯", "🚀"
]

type Message = {
  id: string
  sender_id: string
  sender_name: string
  sender_type: "admin" | "member"
  sender_avatar?: string | null
  sender_game_id?: string | null
  message: string
  original_language: string
  created_at: string
  translated_message?: string
  audio_url?: string | null
  message_type?: "text" | "audio"
}

type ChatProps = {
  userId: string
  userName: string
  userType: "admin" | "member"
  userLanguage: string
  userAvatar?: string | null
  userGameId?: string | null
}

export default function ChatComponent({ userId, userName, userType, userLanguage, userAvatar, userGameId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [translating, setTranslating] = useState<string | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    fetchMessages()
    
    // Pedir permissao de notificacao
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission()
    }
    
    // Limpar mensagens antigas a cada minuto
    const cleanupInterval = setInterval(() => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      setMessages(prev => prev.filter(msg => new Date(msg.created_at) > twoHoursAgo))
      fetch("/api/chat/cleanup").catch(() => {})
    }, 60000)
    
    // Subscription para mensagens em tempo real
    const channel = supabase
      .channel("chat_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new as Message
          // Evitar duplicata se for mensagem propria (ja adicionada otimisticamente)
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id || (m.id.startsWith("temp-") && m.sender_id === newMsg.sender_id && m.message === newMsg.message))) {
              return prev.map(m => m.id.startsWith("temp-") && m.sender_id === newMsg.sender_id && m.message === newMsg.message ? newMsg : m)
            }
            return [...prev, newMsg]
          })
          
          // Notificar se nao for mensagem propria
          if (newMsg.sender_id !== userId) {
            // Notificacao do navegador
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(`${newMsg.sender_name} no Chat`, {
                body: newMsg.message_type === "audio" ? "Enviou um audio" : newMsg.message.substring(0, 50),
                icon: newMsg.sender_avatar || "/icon.png",
                tag: "chat-message"
              })
            }
            // Som de notificacao usando Web Audio API
            try {
              const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
              const oscillator = audioContext.createOscillator()
              const gainNode = audioContext.createGain()
              oscillator.connect(gainNode)
              gainNode.connect(audioContext.destination)
              oscillator.frequency.value = 800
              oscillator.type = "sine"
              gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.3)
            } catch (e) {}
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const deletedId = payload.old.id
          setMessages((prev) => prev.filter((m) => m.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      clearInterval(cleanupInterval)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    setLoading(true)
    // Buscar apenas mensagens das ultimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, sender_id, sender_name, sender_type, sender_avatar, sender_game_id, message, original_language, created_at, audio_url, message_type")
      .gt("created_at", twoHoursAgo)
      .order("created_at", { ascending: true })
      .limit(50)

    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojis(false)
  }

  const translateMessage = async (message: Message) => {
    if (message.translated_message || translating === message.id) return
    
    // Se a mensagem ja esta no idioma do usuario, nao traduzir
    if (message.original_language === userLanguage) return

    setTranslating(message.id)
    
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.message,
          targetLang: userLanguage,
          sourceLang: message.original_language
        })
      })

      const data = await response.json()
      
      if (data.translatedText) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? { ...m, translated_message: data.translatedText }
              : m
          )
        )
      }
    } catch (error) {
      console.error("Translation error:", error)
    } finally {
      setTranslating(null)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setNewMessage("")
    setShowEmojis(false)
    
    // Criar mensagem temporaria para aparecer instantaneamente
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      sender_id: userId,
      sender_name: userName,
      sender_type: userType,
      sender_avatar: userAvatar,
      sender_game_id: userGameId,
      message: messageText,
      original_language: userLanguage,
      created_at: new Date().toISOString()
    }
    
    // Adicionar mensagem imediatamente
    setMessages(prev => [...prev, tempMessage])
    setSending(true)

    const { error } = await supabase.from("chat_messages").insert({
      sender_id: userId,
      sender_name: userName,
      sender_type: userType,
      sender_avatar: userAvatar,
      sender_game_id: userGameId,
      message: messageText,
      original_language: userLanguage
    })

    if (error) {
      // Remover mensagem temporaria se falhou
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageText)
    }

    setSending(false)
  }

  // Funcoes de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach(track => track.stop())
        await sendAudioMessage(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Erro ao acessar microfone:", error)
      alert("Permita o acesso ao microfone para enviar audio")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      mediaRecorderRef.current = null
      audioChunksRef.current = []
      setIsRecording(false)
      setRecordingTime(0)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const sendAudioMessage = async (audioBlob: Blob) => {
    setSending(true)
    
    // Converter para base64
    const reader = new FileReader()
    reader.readAsDataURL(audioBlob)
    reader.onloadend = async () => {
      const base64Audio = reader.result as string
      
      // Criar mensagem temporaria
      const tempId = `temp-${Date.now()}`
      const tempMessage: Message = {
        id: tempId,
        sender_id: userId,
        sender_name: userName,
        sender_type: userType,
        sender_avatar: userAvatar,
        sender_game_id: userGameId,
        message: "Audio",
        audio_url: base64Audio,
        message_type: "audio",
        original_language: userLanguage,
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, tempMessage])

      const { error } = await supabase.from("chat_messages").insert({
        sender_id: userId,
        sender_name: userName,
        sender_type: userType,
        sender_avatar: userAvatar,
        sender_game_id: userGameId,
        message: "Audio",
        audio_url: base64Audio,
        message_type: "audio",
        original_language: userLanguage
      })

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== tempId))
      }

      setSending(false)
      setRecordingTime(0)
    }
  }

  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      audioRef.current.onended = () => setPlayingAudio(null)
      setPlayingAudio(messageId)
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId)

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  return (
    <div className="flex flex-col h-[600px] sm:h-[650px] rounded-2xl border border-[#333] overflow-hidden relative shadow-2xl">
      {/* Background Image with Effects */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/chat-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#252525]/90 to-[#1a1a1a]/90 backdrop-blur-md px-5 py-4 border-b border-[#333]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30" />
          </div>
          <span className="font-semibold text-lg">Chat da Alianca</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">Expira em 2h</span>
          <span className="text-xs text-gray-400">{messages.length} msgs</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === userId
            const isAdmin = message.sender_type === "admin"

            return (
              <div
                key={message.id}
                className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}
              >
                <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                {/* Avatar - lado esquerdo para mensagens de outros */}
                {!isOwnMessage && (
                  <div className="flex-shrink-0">
                    {message.sender_avatar ? (
                      <img 
                        src={message.sender_avatar} 
                        alt={message.sender_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#333] hover:scale-110 transition-transform shadow-lg"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${isAdmin ? "bg-gradient-to-br from-yellow-600/40 to-yellow-800/40 border-2 border-yellow-500/30" : "bg-gradient-to-br from-[#333] to-[#222] border-2 border-[#444]"}`}>
                        {isAdmin ? <Shield className="w-5 h-5 text-yellow-500" /> : <User className="w-5 h-5 text-gray-400" />}
                      </div>
                    )}
                  </div>
                )}
                
                <div
                  className={`chat-bubble max-w-[75%] rounded-2xl p-4 shadow-lg ${
                    isOwnMessage
                      ? "bg-gradient-to-br from-red-600/30 to-red-800/20 border border-red-500/30"
                      : isAdmin
                      ? "bg-gradient-to-br from-yellow-600/20 to-yellow-800/10 border border-yellow-500/30"
                      : "bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border border-[#3a3a3a]"
                  }`}
                >
                  {/* Sender Info */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold ${
                        isAdmin ? "text-yellow-400" : "text-gray-200"
                      }`}
                    >
                      {message.sender_name}
                      {isAdmin && " (ADM)"}
                    </span>
                    {message.sender_game_id && (
                      <span className="text-xs text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full font-medium">
                        ID: {message.sender_game_id}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>

                  {/* Message or Audio */}
                  {message.message_type === "audio" && message.audio_url ? (
                    <div className="flex items-center gap-3 py-2">
                      <button
                        onClick={() => playAudio(message.audio_url!, message.id)}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] hover:from-[#444] hover:to-[#333] flex items-center justify-center transition-all shadow-lg hover:scale-105"
                      >
                        {playingAudio === message.id ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="h-1.5 bg-[#444] rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${isOwnMessage ? "from-red-500 to-red-400" : "from-blue-500 to-blue-400"} ${playingAudio === message.id ? "animate-pulse w-full" : "w-0"} transition-all duration-300`} />
                        </div>
                        <span className="text-xs text-gray-400 mt-1.5 block">Mensagem de audio</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white leading-relaxed">{message.message}</p>
                  )}

                  {/* Translated Message */}
                  {message.translated_message && (
                    <div className="mt-2 pt-2 border-t border-[#333]">
                      <div className="flex items-center gap-1 mb-1">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-blue-400">Traduzido</span>
                      </div>
                      <p className="text-sm text-gray-300">{message.translated_message}</p>
                    </div>
                  )}
                </div>
                
                {/* Avatar - lado direito para mensagens proprias */}
                {isOwnMessage && (
                  <div className="flex-shrink-0">
                    {message.sender_avatar ? (
                      <img 
                        src={message.sender_avatar} 
                        alt={message.sender_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-red-500/40 chat-avatar-pulse shadow-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-red-600/40 to-red-800/30 border-2 border-red-500/30 chat-avatar-pulse shadow-lg">
                        <User className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Actions - Abaixo do balão, centralizado */}
              <div className="flex items-center justify-center gap-3 mt-2">
                {/* Translate Button */}
                {!message.translated_message && message.original_language !== userLanguage && (
                  <button
                    onClick={() => translateMessage(message)}
                    disabled={translating === message.id}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10 border border-blue-500/20"
                  >
                    {translating === message.id ? (
                      <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>Traduzir</span>
                  </button>
                )}

                {/* Delete Button */}
                {(isOwnMessage || userType === "admin") && (
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-5 border-t border-[#333]/50 bg-gradient-to-r from-[#252525]/90 to-[#1a1a1a]/90 backdrop-blur-md">
        {/* Recording UI */}
        {isRecording && (
          <div className="mb-4 p-4 bg-gradient-to-r from-red-500/15 to-red-600/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-30" />
              </div>
              <span className="text-red-400 font-semibold">Gravando...</span>
              <span className="text-white font-mono text-lg">{formatRecordingTime(recordingTime)}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-gray-300 rounded-xl transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl transition-all text-sm flex items-center gap-2 font-medium shadow-lg"
              >
                <Square className="w-3 h-3" />
                Enviar
              </button>
            </div>
          </div>
        )}
        
        {/* Emoji Picker */}
        {showEmojis && !isRecording && (
          <div className="mb-4 p-4 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#333] rounded-xl">
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="chat-emoji-btn p-2.5 text-2xl hover:bg-[#333] rounded-lg transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        {!isRecording && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`chat-emoji-btn p-3 rounded-xl transition-all flex-shrink-0 ${
              showEmojis 
                ? "bg-gradient-to-r from-yellow-500/30 to-yellow-600/20 text-yellow-400 shadow-lg" 
                : "bg-[#333] text-gray-400 hover:text-white hover:bg-[#444]"
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="chat-input-glow flex-1 min-w-0 px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-all text-sm"
            maxLength={500}
          />
          <button
            type="button"
            onClick={startRecording}
            disabled={sending}
            className="chat-emoji-btn p-3 bg-[#333] hover:bg-[#444] text-gray-400 hover:text-white rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
            title="Gravar audio"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="chat-send-btn p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-red-600/50 disabled:to-red-700/50 rounded-xl transition-all flex-shrink-0 shadow-lg"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        )}
      </form>
      </div>
    </div>
  )
}
