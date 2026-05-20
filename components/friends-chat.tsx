"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Search, 
  X, 
  Check, 
  ArrowLeft,
  Send,
  Smile,
  Clock,
  UserX,
  Bell
} from "lucide-react"

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😅", "😊",
  "👍", "👎", "👏", "🙌", "💪", "🔥", "⚔️", "🛡️",
  "❤️", "💜", "💙", "💚", "🎮", "🎯", "🏆", "⭐"
]

type Friend = {
  id: string
  user_id: string
  friend_id: string
  status: "pending" | "accepted" | "blocked"
  created_at: string
  friend_name?: string
  friend_email?: string
}

type PrivateMessage = {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  read_at: string | null
  created_at: string
}

type Member = {
  user_id: string
  name: string
  email: string
}

type Props = {
  userId: string
  userName: string
}

export default function FriendsChat({ userId, userName }: Props) {
  const [activeView, setActiveView] = useState<"list" | "requests" | "search" | "chat">("list")
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showEmojis, setShowEmojis] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchFriends()
    fetchPendingRequests()
    fetchAllMembers()

    // Realtime para amizades
    const friendsChannel = supabase
      .channel("friendships_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        fetchFriends()
        fetchPendingRequests()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(friendsChannel)
    }
  }, [])

  useEffect(() => {
    if (selectedFriend && activeView === "chat") {
      fetchMessages()
      
      const messagesChannel = supabase
        .channel(`private_messages_${selectedFriend.id}`)
        .on("postgres_changes", 
          { event: "INSERT", schema: "public", table: "private_messages" }, 
          (payload) => {
            const msg = payload.new as PrivateMessage
            const friendUserId = selectedFriend.user_id === userId ? selectedFriend.friend_id : selectedFriend.user_id
            if ((msg.sender_id === friendUserId && msg.receiver_id === userId) ||
                (msg.sender_id === userId && msg.receiver_id === friendUserId)) {
              setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev
                return [...prev, msg]
              })
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(messagesChannel)
      }
    }
  }, [selectedFriend, activeView])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchFriends = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted")

    if (data) {
      // Buscar nomes dos amigos
      const friendsWithNames = await Promise.all(data.map(async (f) => {
        const friendUserId = f.user_id === userId ? f.friend_id : f.user_id
        const { data: memberData } = await supabase
          .from("members")
          .select("name, email")
          .eq("user_id", friendUserId)
          .single()
        
        return {
          ...f,
          friend_name: memberData?.name || memberData?.email?.split("@")[0] || "Usuario",
          friend_email: memberData?.email
        }
      }))
      setFriends(friendsWithNames)
    }
    setLoading(false)
  }

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .eq("friend_id", userId)
      .eq("status", "pending")

    if (data) {
      const requestsWithNames = await Promise.all(data.map(async (f) => {
        const { data: memberData } = await supabase
          .from("members")
          .select("name, email")
          .eq("user_id", f.user_id)
          .single()
        
        return {
          ...f,
          friend_name: memberData?.name || memberData?.email?.split("@")[0] || "Usuario",
          friend_email: memberData?.email
        }
      }))
      setPendingRequests(requestsWithNames)
    }
  }

  const searchMembers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from("members")
      .select("user_id, name, email")
      .neq("user_id", userId)
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(10)

    if (data) {
      setSearchResults(data)
    }
  }

  const fetchAllMembers = async () => {
    // Buscar todos os membros exceto o usuario atual
    const { data: members } = await supabase
      .from("members")
      .select("user_id, name, email")
      .neq("user_id", userId)
      .order("name", { ascending: true })
      .limit(50)

    // Buscar amizades existentes (aceitas ou pendentes enviadas)
    const { data: existingFriendships } = await supabase
      .from("friendships")
      .select("friend_id, user_id")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (members) {
      // Filtrar membros que ja sao amigos ou tem solicitacao pendente
      const friendIds = new Set<string>()
      existingFriendships?.forEach(f => {
        if (f.user_id === userId) friendIds.add(f.friend_id)
        if (f.friend_id === userId) friendIds.add(f.user_id)
      })

      const availableMembers = members.filter(m => !friendIds.has(m.user_id))
      setAllMembers(availableMembers)
    }
  }

  const sendFriendRequest = async (friendUserId: string) => {
    const { error } = await supabase
      .from("friendships")
      .insert({
        user_id: userId,
        friend_id: friendUserId,
        status: "pending"
      })

    if (!error) {
      setSearchResults(prev => prev.filter(m => m.user_id !== friendUserId))
    }
  }

  const acceptRequest = async (requestId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId)

    fetchFriends()
    fetchPendingRequests()
  }

  const rejectRequest = async (requestId: string) => {
    await supabase
      .from("friendships")
      .delete()
      .eq("id", requestId)

    fetchPendingRequests()
  }

  const removeFriend = async (friendshipId: string) => {
    if (!confirm("Tem certeza que deseja remover este amigo?")) return

    await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)

    setSelectedFriend(null)
    setActiveView("list")
    fetchFriends()
  }

  const fetchMessages = async () => {
    if (!selectedFriend) return

    const friendUserId = selectedFriend.user_id === userId ? selectedFriend.friend_id : selectedFriend.user_id

    const { data } = await supabase
      .from("private_messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendUserId}),and(sender_id.eq.${friendUserId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data)
      
      // Marcar como lidas
      await supabase
        .from("private_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", userId)
        .eq("sender_id", friendUserId)
        .is("read_at", null)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedFriend || sending) return

    const friendUserId = selectedFriend.user_id === userId ? selectedFriend.friend_id : selectedFriend.user_id
    const messageText = newMessage.trim()
    setNewMessage("")
    setShowEmojis(false)

    const tempId = `temp-${Date.now()}`
    const tempMessage: PrivateMessage = {
      id: tempId,
      sender_id: userId,
      receiver_id: friendUserId,
      message: messageText,
      read_at: null,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempMessage])
    setSending(true)

    const { error } = await supabase.from("private_messages").insert({
      sender_id: userId,
      receiver_id: friendUserId,
      message: messageText
    })

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageText)
    }

    setSending(false)
  }

  const openChat = (friend: Friend) => {
    setSelectedFriend(friend)
    setMessages([])
    setActiveView("chat")
  }

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojis(false)
  }

  return (
    <div className="flex flex-col h-[500px] rounded-xl border border-[#333] overflow-hidden relative">
      {/* Background Image with Effects */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/chat-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#252525]/80 backdrop-blur-sm px-4 py-3 border-b border-[#333]/50 flex items-center justify-between">
        {activeView === "chat" && selectedFriend ? (
          <>
            <button
              onClick={() => { setActiveView("list"); setSelectedFriend(null) }}
              className="p-1 hover:bg-[#333] rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 ml-3">
              <p className="font-medium">{selectedFriend.friend_name}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <button
              onClick={() => removeFriend(selectedFriend.id)}
              className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
              title="Remover amigo"
            >
              <UserX className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="font-medium">Amigos</span>
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView("requests")}
                className={`p-2 rounded transition-colors relative ${
                  activeView === "requests" ? "bg-[#333] text-white" : "hover:bg-[#333] text-gray-400"
                }`}
                title="Solicitacoes"
              >
                <Bell className="w-4 h-4" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveView("search")}
                className={`p-2 rounded transition-colors ${
                  activeView === "search" ? "bg-[#333] text-white" : "hover:bg-[#333] text-gray-400"
                }`}
                title="Adicionar amigo"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === "list" && (
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum amigo ainda</p>
                <button
                  onClick={() => setActiveView("search")}
                  className="mt-3 text-sm text-green-500 hover:text-green-400"
                >
                  Adicionar amigos
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => openChat(friend)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#252525] rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-semibold">
                      {friend.friend_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.friend_name}</p>
                      <p className="text-xs text-gray-500 truncate">{friend.friend_email}</p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "requests" && (
          <div className="p-2">
            <button
              onClick={() => setActiveView("list")}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma solicitacao pendente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 bg-[#252525] rounded-lg"
                  >
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 font-semibold">
                      {request.friend_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{request.friend_name}</p>
                      <p className="text-xs text-gray-500">Quer ser seu amigo</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg transition-colors"
                        title="Aceitar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
                        title="Recusar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === "search" && (
          <div className="p-4">
            <button
              onClick={() => setActiveView("list")}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!e.target.value.trim()) setSearchResults([])
                }}
                onKeyDown={(e) => e.key === "Enter" && searchMembers()}
                placeholder="Buscar por nome ou email..."
                className="flex-1 px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                onClick={searchMembers}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            
            {/* Resultados da busca */}
            {searchQuery.trim() && searchResults.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500 mb-2">Resultados da busca</p>
                {searchResults.map(member => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 bg-[#252525] rounded-lg"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 font-semibold">
                      {(member.name || member.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name || member.email.split("@")[0]}</p>
                    </div>
                    <button
                      onClick={() => {
                        sendFriendRequest(member.user_id)
                        fetchAllMembers()
                      }}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Lista de todos os membros disponiveis */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Pessoas para adicionar ({allMembers.length})</p>
              {allMembers.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum membro disponivel</p>
                </div>
              ) : (
                allMembers.map(member => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-semibold">
                      {(member.name || member.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name || member.email.split("@")[0]}</p>
                    </div>
                    <button
                      onClick={() => {
                        sendFriendRequest(member.user_id)
                        setAllMembers(prev => prev.filter(m => m.user_id !== member.user_id))
                      }}
                      className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600 border border-green-600/50 text-green-400 hover:text-white rounded-lg text-sm transition-colors flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeView === "chat" && selectedFriend && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Envie a primeira mensagem!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === userId ? "justify-end chat-message-right" : "justify-start chat-message-left"}`}
                  >
                    <div
                      className={`chat-bubble max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.sender_id === userId
                          ? "bg-green-600 text-white rounded-br-sm"
                          : "bg-[#333]/90 text-white rounded-bl-sm"
                      }`}
                    >
                      <p className="break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${
                        msg.sender_id === userId ? "text-green-200" : "text-gray-500"
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {msg.sender_id === userId && msg.read_at && " ✓✓"}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input (only for chat view) */}
      {activeView === "chat" && selectedFriend && (
        <div className="p-3 border-t border-[#333]/50 bg-[#252525]/80 backdrop-blur-sm">
          {showEmojis && (
            <div className="mb-3 p-2 bg-[#0d0d0d] border border-[#333] rounded-lg">
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="chat-emoji-btn p-1.5 text-lg hover:bg-[#333] rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={`chat-emoji-btn px-3 py-2 rounded-lg transition-colors ${
                showEmojis ? "bg-green-500/20 text-green-500" : "bg-[#333] text-gray-400 hover:text-white"
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="chat-input-glow flex-1 px-4 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="chat-send-btn px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg transition-all"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      )}
      </div>
    </div>
  )
}
