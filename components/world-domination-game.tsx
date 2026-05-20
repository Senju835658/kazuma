"use client"

import { useState, useEffect, useRef, memo } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { createClient } from "@/lib/supabase/client"
import { Crown, Swords, Shield, Users, Trophy, RefreshCw, MessageCircle, X, Send, User } from "lucide-react"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// Cores dos 5 jogadores
const PLAYER_COLORS = [
  "#ef4444", // vermelho
  "#3b82f6", // azul
  "#22c55e", // verde
  "#f59e0b", // amarelo
  "#8b5cf6", // roxo
]

// Regioes do mundo agrupadas
const WORLD_REGIONS: Record<string, string[]> = {
  "America do Norte": ["United States of America", "Canada", "Mexico"],
  "America Central": ["Guatemala", "Belize", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama", "Cuba", "Jamaica", "Haiti", "Dominican Rep."],
  "America do Sul": ["Brazil", "Argentina", "Chile", "Colombia", "Peru", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Guyana", "Suriname"],
  "Europa Ocidental": ["United Kingdom", "France", "Spain", "Portugal", "Ireland", "Belgium", "Netherlands", "Luxembourg"],
  "Europa Central": ["Germany", "Poland", "Czech Rep.", "Austria", "Switzerland", "Hungary", "Slovakia"],
  "Europa Oriental": ["Russia", "Ukraine", "Belarus", "Romania", "Bulgaria", "Moldova"],
  "Europa do Norte": ["Sweden", "Norway", "Finland", "Denmark", "Iceland", "Estonia", "Latvia", "Lithuania"],
  "Europa do Sul": ["Italy", "Greece", "Croatia", "Serbia", "Albania", "North Macedonia", "Montenegro", "Bosnia and Herz.", "Slovenia"],
  "Africa do Norte": ["Egypt", "Libya", "Tunisia", "Algeria", "Morocco", "Sudan", "W. Sahara"],
  "Africa Ocidental": ["Nigeria", "Ghana", "Senegal", "Mali", "Burkina Faso", "Niger", "Côte d'Ivoire", "Guinea", "Benin", "Togo", "Sierra Leone", "Liberia", "Mauritania", "Gambia", "Guinea-Bissau", "Cabo Verde"],
  "Africa Central": ["Dem. Rep. Congo", "Cameroon", "Central African Rep.", "Chad", "Congo", "Gabon", "Eq. Guinea", "São Tomé and Príncipe"],
  "Africa Oriental": ["Kenya", "Tanzania", "Uganda", "Ethiopia", "Somalia", "Eritrea", "Djibouti", "Rwanda", "Burundi", "South Sudan"],
  "Africa Austral": ["South Africa", "Zimbabwe", "Zambia", "Mozambique", "Madagascar", "Malawi", "Botswana", "Namibia", "Angola", "Lesotho", "eSwatini"],
  "Oriente Medio": ["Turkey", "Iran", "Iraq", "Saudi Arabia", "Syria", "Jordan", "Israel", "Lebanon", "Yemen", "Oman", "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Cyprus"],
  "Asia Central": ["Kazakhstan", "Uzbekistan", "Turkmenistan", "Tajikistan", "Kyrgyzstan", "Afghanistan", "Pakistan"],
  "Asia do Sul": ["India", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan", "Maldives"],
  "Sudeste Asiatico": ["Thailand", "Vietnam", "Malaysia", "Indonesia", "Philippines", "Myanmar", "Cambodia", "Laos", "Singapore", "Brunei", "Timor-Leste"],
  "Asia Oriental": ["China", "Japan", "South Korea", "North Korea", "Mongolia", "Taiwan"],
  "Oceania": ["Australia", "New Zealand", "Papua New Guinea", "Fiji", "Solomon Is.", "Vanuatu", "New Caledonia"],
}

// Mapeamento de país para região
const countryToRegion: Record<string, string> = {}
Object.entries(WORLD_REGIONS).forEach(([region, countries]) => {
  countries.forEach(country => {
    countryToRegion[country] = region
  })
})

interface Player {
  id: string
  name: string
  color: string
  territories: number
  troops: number
  isCurrentUser?: boolean
}

interface Territory {
  region: string
  owner_id: string | null
  troops: number
}

interface GameState {
  id: string
  players: Player[]
  territories: Record<string, Territory>
  current_turn: string
  phase: "deploy" | "attack" | "fortify"
  round: number
  winner: string | null
}

const MemoizedGeography = memo(({ 
  geo, 
  territory, 
  players, 
  selectedRegion,
  onRegionClick 
}: {
  geo: any
  territory: Territory | undefined
  players: Player[]
  selectedRegion: string | null
  onRegionClick: (region: string) => void
}) => {
  const countryName = geo.properties.name
  const region = countryToRegion[countryName]
  
  if (!region) {
    return (
      <Geography
        geography={geo}
        style={{
          default: { fill: "#1a1a1a", stroke: "#333", strokeWidth: 0.5 },
          hover: { fill: "#1a1a1a", stroke: "#333", strokeWidth: 0.5 },
          pressed: { fill: "#1a1a1a", stroke: "#333", strokeWidth: 0.5 },
        }}
      />
    )
  }

  const owner = territory?.owner_id ? players.find(p => p.id === territory.owner_id) : null
  const fillColor = owner ? owner.color : "#2a2a2a"
  const isSelected = selectedRegion === region

  return (
    <Geography
      geography={geo}
      onClick={() => onRegionClick(region)}
      style={{
        default: {
          fill: fillColor,
          stroke: isSelected ? "#fff" : "#333",
          strokeWidth: isSelected ? 1.5 : 0.5,
          opacity: territory?.owner_id ? 0.8 : 0.4,
          cursor: "pointer",
          transition: "all 0.2s",
        },
        hover: {
          fill: fillColor,
          stroke: "#fff",
          strokeWidth: 1,
          opacity: 1,
          cursor: "pointer",
        },
        pressed: {
          fill: fillColor,
          stroke: "#fff",
          strokeWidth: 1.5,
          opacity: 1,
        },
      }}
    />
  )
})
MemoizedGeography.displayName = "MemoizedGeography"

interface GameMessage {
  id: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

interface BattleLog {
  id: string
  attacker: string
  defender: string
  from: string
  to: string
  result: "win" | "lose"
  timestamp: number
}

interface Props {
  userId: string
  userName: string
}

export default function WorldDominationGame({ userId, userName }: Props) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameDbId, setGameDbId] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [targetRegion, setTargetRegion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [deployTroops, setDeployTroops] = useState(1)
  
  // Chat states
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<GameMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Battle log
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    loadGame()
    
    // Realtime subscription
    const channel = supabase
      .channel("world_domination_realtime")
      .on(
        "postgres_changes", 
        { 
          event: "*", 
          schema: "public", 
          table: "world_domination_game" 
        }, 
        (payload) => {
          // Atualizar estado do jogo em tempo real
          if (payload.new && (payload.new as { game_state: GameState; id: string }).game_state) {
            const newData = payload.new as { game_state: GameState; id: string }
            setGameState(newData.game_state)
            setGameDbId(newData.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Chat useEffect
  useEffect(() => {
    loadChatMessages()

    const chatChannel = supabase
      .channel("game_chat_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_chat_messages" },
        (payload) => {
          const newMsg = payload.new as GameMessage
          setChatMessages(prev => [...prev, newMsg])
          
          // Se o chat esta fechado e a msg nao e do usuario, incrementar notificacao
          if (newMsg.sender_id !== userId) {
            setChatOpen(prev => {
              if (!prev) {
                setUnreadCount(c => c + 1)
                // Tocar som de notificacao
                playNotificationSound()
              }
              return prev
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
    }
  }, [userId])

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
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
    } catch (e) {
      console.log("Audio not supported")
    }
  }

  const loadChatMessages = async () => {
    const { data } = await supabase
      .from("game_chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100)

    if (data) {
      setChatMessages(data)
    }
  }

  const sendChatMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    setSendingMessage(true)

    await supabase.from("game_chat_messages").insert({
      sender_id: userId,
      sender_name: userName,
      message: newMessage.trim()
    })

    setNewMessage("")
    setSendingMessage(false)
  }

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0)
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatOpen, chatMessages])

  const loadGame = async () => {
    const { data } = await supabase
      .from("world_domination_game")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setGameState(data.game_state as GameState)
      setGameDbId(data.id)
    }
    setLoading(false)
  }

  const createNewGame = async () => {
    setJoining(true)
    
    // Inicializar territórios
    const territories: Record<string, Territory> = {}
    Object.keys(WORLD_REGIONS).forEach(region => {
      territories[region] = { region, owner_id: null, troops: 0 }
    })

    // Criar novo jogo com o primeiro jogador
    const newPlayer: Player = {
      id: userId,
      name: userName,
      color: PLAYER_COLORS[0],
      territories: 0,
      troops: 20,
      isCurrentUser: true
    }

    const newGame: GameState = {
      id: crypto.randomUUID(),
      players: [newPlayer],
      territories,
      current_turn: userId,
      phase: "deploy",
      round: 1,
      winner: null
    }

    await supabase.from("world_domination_game").insert({
      game_state: newGame
    })

    setGameState(newGame)
    setJoining(false)
  }

  const joinGame = async () => {
    if (!gameState || !gameDbId || gameState.players.length >= 5) return
    if (gameState.players.some(p => p.id === userId)) return

    setJoining(true)

    const newPlayer: Player = {
      id: userId,
      name: userName,
      color: PLAYER_COLORS[gameState.players.length],
      territories: 0,
      troops: 20
    }

    const updatedGame = {
      ...gameState,
      players: [...gameState.players, newPlayer]
    }

    await supabase
      .from("world_domination_game")
      .update({ game_state: updatedGame })
      .eq("id", gameDbId)

    setJoining(false)
  }

  const deployTroopsToRegion = async () => {
    if (!gameState || !gameDbId || !selectedRegion || gameState.current_turn !== userId) return
    
    const currentPlayer = gameState.players.find(p => p.id === userId)
    if (!currentPlayer || currentPlayer.troops < deployTroops) return

    setActionLoading(true)

    const territory = gameState.territories[selectedRegion]
    
    // Só pode deploy em território próprio ou neutro
    if (territory.owner_id && territory.owner_id !== userId) {
      setActionLoading(false)
      return
    }

    const updatedTerritories = {
      ...gameState.territories,
      [selectedRegion]: {
        ...territory,
        owner_id: userId,
        troops: territory.troops + deployTroops
      }
    }

    const updatedPlayers = gameState.players.map(p => {
      if (p.id === userId) {
        const hadTerritory = territory.owner_id === userId
        return {
          ...p,
          troops: p.troops - deployTroops,
          territories: hadTerritory ? p.territories : p.territories + 1
        }
      }
      return p
    })

    const updatedGame = {
      ...gameState,
      territories: updatedTerritories,
      players: updatedPlayers
    }

    await supabase
      .from("world_domination_game")
      .update({ game_state: updatedGame })
      .eq("id", gameDbId)

    setSelectedRegion(null)
    setActionLoading(false)
  }

  const attackRegion = async () => {
    if (!gameState || !gameDbId || !selectedRegion || !targetRegion || gameState.current_turn !== userId) return

    const attackerTerritory = gameState.territories[selectedRegion]
    const defenderTerritory = gameState.territories[targetRegion]

    if (attackerTerritory.owner_id !== userId) return
    if (attackerTerritory.troops <= 1) return
    if (defenderTerritory.owner_id === userId) return

    setActionLoading(true)

    // Simulação de batalha simples
    const attackPower = Math.floor(Math.random() * attackerTerritory.troops)
    const defensePower = Math.floor(Math.random() * (defenderTerritory.troops + 1))

    let updatedTerritories = { ...gameState.territories }
    let updatedPlayers = [...gameState.players]
    let battleResult: "win" | "lose" = "lose"

    if (attackPower > defensePower) {
      // Atacante vence
      battleResult = "win"
      const previousOwner = defenderTerritory.owner_id
      const troopsToMove = Math.ceil(attackerTerritory.troops / 2)

      updatedTerritories[selectedRegion] = {
        ...attackerTerritory,
        troops: attackerTerritory.troops - troopsToMove
      }
      updatedTerritories[targetRegion] = {
        ...defenderTerritory,
        owner_id: userId,
        troops: troopsToMove
      }

      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === userId) {
          return { ...p, territories: p.territories + 1 }
        }
        if (p.id === previousOwner) {
          return { ...p, territories: p.territories - 1 }
        }
        return p
      })
    } else {
      // Defensor vence
      const attackerLoss = Math.max(1, Math.floor(attackerTerritory.troops * 0.3))
      const defenderLoss = Math.max(0, Math.floor(defenderTerritory.troops * 0.2))

      updatedTerritories[selectedRegion] = {
        ...attackerTerritory,
        troops: Math.max(1, attackerTerritory.troops - attackerLoss)
      }
      updatedTerritories[targetRegion] = {
        ...defenderTerritory,
        troops: Math.max(1, defenderTerritory.troops - defenderLoss)
      }
    }

    // Verificar se alguém venceu
    const territoriesPerPlayer: Record<string, number> = {}
    Object.values(updatedTerritories).forEach(t => {
      if (t.owner_id) {
        territoriesPerPlayer[t.owner_id] = (territoriesPerPlayer[t.owner_id] || 0) + 1
      }
    })

    const totalTerritories = Object.keys(WORLD_REGIONS).length
    let winner: string | null = null
    Object.entries(territoriesPerPlayer).forEach(([playerId, count]) => {
      if (count >= totalTerritories * 0.7) { // 70% dos territórios para vencer
        winner = playerId
      }
    })

    const updatedGame = {
      ...gameState,
      territories: updatedTerritories,
      players: updatedPlayers,
      winner
    }

    // Adicionar ao log de batalhas
    const defenderName = gameState.players.find(p => p.id === defenderTerritory.owner_id)?.name || "Neutro"
    const newLog: BattleLog = {
      id: crypto.randomUUID(),
      attacker: userName,
      defender: defenderName,
      from: selectedRegion,
      to: targetRegion,
      result: battleResult,
      timestamp: Date.now()
    }
    setBattleLogs(prev => [newLog, ...prev].slice(0, 10)) // Manter apenas os 10 ultimos

    await supabase
      .from("world_domination_game")
      .update({ game_state: updatedGame })
      .eq("id", gameDbId)

    setSelectedRegion(null)
    setTargetRegion(null)
    setActionLoading(false)
  }

  const endTurn = async () => {
    if (!gameState || !gameDbId || gameState.current_turn !== userId) return

    setActionLoading(true)

    const currentIndex = gameState.players.findIndex(p => p.id === userId)
    const nextIndex = (currentIndex + 1) % gameState.players.length
    const nextPlayer = gameState.players[nextIndex]

    // Dar tropas bonus baseado em territorios
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === nextPlayer.id) {
        const bonus = Math.max(3, Math.floor(p.territories / 3))
        return { ...p, troops: p.troops + bonus }
      }
      return p
    })

    const updatedGame = {
      ...gameState,
      current_turn: nextPlayer.id,
      phase: "deploy" as const,
      round: nextIndex === 0 ? gameState.round + 1 : gameState.round,
      players: updatedPlayers
    }

    await supabase
      .from("world_domination_game")
      .update({ game_state: updatedGame })
      .eq("id", gameDbId)

    setSelectedRegion(null)
    setTargetRegion(null)
    setActionLoading(false)
  }

  const handleRegionClick = (region: string) => {
    if (!gameState) return

    const territory = gameState.territories[region]
    
    if (gameState.phase === "deploy") {
      setSelectedRegion(region)
      setTargetRegion(null)
    } else if (gameState.phase === "attack") {
      if (!selectedRegion) {
        if (territory.owner_id === userId && territory.troops > 1) {
          setSelectedRegion(region)
        }
      } else if (selectedRegion === region) {
        setSelectedRegion(null)
        setTargetRegion(null)
      } else {
        if (territory.owner_id !== userId) {
          setTargetRegion(region)
        }
      }
    }
  }

  const setPhase = async (phase: "deploy" | "attack" | "fortify") => {
    if (!gameState || gameState.current_turn !== userId) return

    const updatedGame = { ...gameState, phase }
    await supabase
      .from("world_domination_game")
      .update({ game_state: updatedGame })
      .eq("id", gameDbId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  const currentPlayer = gameState?.players.find(p => p.id === userId)
  const isMyTurn = gameState?.current_turn === userId
  const currentTurnPlayer = gameState?.players.find(p => p.id === gameState.current_turn)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-500" />
            Dominacao Mundial
          </h2>
          <p className="text-gray-500 text-xs">Conquiste territorios e domine o mundo!</p>
        </div>
        {gameState && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rodada {gameState.round}</span>
            <button
              onClick={loadGame}
              className="p-2 hover:bg-[#333] rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Winner Banner */}
      {gameState?.winner && (
        <div className="p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl text-center">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-400 font-bold text-xl mb-2">
            {gameState.players.find(p => p.id === gameState.winner)?.name} venceu o jogo!
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Dominou {Math.floor(Object.keys(WORLD_REGIONS).length * 0.7)} de {Object.keys(WORLD_REGIONS).length} territorios
          </p>
          <button
            onClick={async () => {
              // Deletar jogo atual e criar novo
              if (gameDbId) {
                await supabase.from("world_domination_game").delete().eq("id", gameDbId)
              }
              setGameState(null)
              setGameDbId(null)
              loadGame()
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Novo Jogo
          </button>
        </div>
      )}

      {/* No Game */}
      {!gameState && (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#333]">
          <Swords className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Nenhum jogo em andamento</p>
          <button
            onClick={createNewGame}
            disabled={joining}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            {joining ? "Criando..." : "Criar Novo Jogo"}
          </button>
        </div>
      )}

      {/* Game Lobby */}
      {gameState && gameState.players.length < 2 && !gameState.winner && (
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Aguardando jogadores...</p>
              <p className="text-xs text-gray-500">{gameState.players.length}/5 jogadores</p>
            </div>
            {!currentPlayer && (
              <button
                onClick={joinGame}
                disabled={joining}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                {joining ? "Entrando..." : "Entrar no Jogo"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {gameState.players.map(player => (
              <div
                key={player.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: player.color + "30" }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                <span className="text-sm">{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Active */}
      {gameState && gameState.players.length >= 2 && !gameState.winner && (
        <>
          {/* Turn Info */}
          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl border border-[#333]">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: currentTurnPlayer?.color }}
              />
              <span className={`text-sm ${isMyTurn ? "text-green-400 font-medium" : "text-gray-400"}`}>
                {isMyTurn ? "Sua vez!" : `Vez de ${currentTurnPlayer?.name}`}
              </span>
            </div>
            {isMyTurn && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPhase("deploy")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    gameState.phase === "deploy" ? "bg-green-600" : "bg-[#333] hover:bg-[#444]"
                  }`}
                >
                  Deploy
                </button>
                <button
                  onClick={() => setPhase("attack")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    gameState.phase === "attack" ? "bg-red-600" : "bg-[#333] hover:bg-[#444]"
                  }`}
                >
                  Atacar
                </button>
                <button
                  onClick={endTurn}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Passar
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="bg-[#0d0d0d] rounded-xl border border-[#333] overflow-hidden">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 120 }}
              style={{ width: "100%", height: "400px" }}
            >
              <ZoomableGroup center={[0, 30]} zoom={1}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const region = countryToRegion[geo.properties.name]
                      const territory = region ? gameState.territories[region] : undefined
                      
                      return (
                        <MemoizedGeography
                          key={geo.rsmKey}
                          geo={geo}
                          territory={territory}
                          players={gameState.players}
                          selectedRegion={selectedRegion}
                          onRegionClick={handleRegionClick}
                        />
                      )
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Action Panel */}
          {isMyTurn && selectedRegion && (
            <div className="p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <p className="text-sm text-gray-400 mb-3">
                Regiao selecionada: <span className="text-white font-medium">{selectedRegion}</span>
                {targetRegion && (
                  <> → <span className="text-red-400 font-medium">{targetRegion}</span></>
                )}
              </p>

              {gameState.phase === "deploy" && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Tropas:</span>
                  <input
                    type="number"
                    min={1}
                    max={currentPlayer?.troops || 1}
                    value={deployTroops}
                    onChange={(e) => setDeployTroops(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-center"
                  />
                  <span className="text-xs text-gray-500">({currentPlayer?.troops} disponiveis)</span>
                  <button
                    onClick={deployTroopsToRegion}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {actionLoading ? "..." : "Posicionar"}
                  </button>
                </div>
              )}

              {gameState.phase === "attack" && targetRegion && (
                <button
                  onClick={attackRegion}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  {actionLoading ? "Atacando..." : "Atacar!"}
                </button>
              )}
            </div>
          )}

          {/* Players List */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {gameState.players.map(player => (
              <div
                key={player.id}
                className={`p-3 rounded-xl border ${
                  player.id === gameState.current_turn
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : "border-[#333] bg-[#1a1a1a]"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                  <span className="text-xs font-medium truncate">{player.name}</span>
                  {player.id === userId && <Crown className="w-3 h-3 text-yellow-500" />}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {player.territories}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {player.troops}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Battle Log */}
          {battleLogs.length > 0 && (
            <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Swords className="w-3 h-3" />
                Ultimas Batalhas
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {battleLogs.map(log => (
                  <div 
                    key={log.id} 
                    className={`text-xs p-2 rounded ${
                      log.result === "win" 
                        ? "bg-green-500/10 text-green-400" 
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    <span className="font-medium">{log.attacker}</span>
                    {log.result === "win" ? " conquistou " : " perdeu ataque em "}
                    <span className="font-medium">{log.to}</span>
                    <span className="text-gray-500"> (de {log.from})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Join Game (if not in game) */}
        {gameState && !currentPlayer && gameState.players.length < 5 && !gameState.winner && (
        <div className="text-center">
          <button
            onClick={joinGame}
            disabled={joining}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
          >
            {joining ? "Entrando..." : "Entrar no Jogo"}
          </button>
        </div>
      )}

      {/* Chat Minimizado */}
      <div className="fixed bottom-4 right-4 z-50">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="relative p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-full shadow-lg transition-all hover:scale-105"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        ) : (
          <div className="w-80 h-96 bg-[#1a1a1a] rounded-2xl border border-[#333] shadow-2xl flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="font-medium text-white text-sm">Chat do Jogo</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  Nenhuma mensagem ainda
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.sender_id === userId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] ${isOwn ? "bg-red-600/20" : "bg-[#252525]"} rounded-lg px-3 py-2`}>
                        {!isOwn && (
                          <p className="text-xs text-red-400 font-medium mb-1">{msg.sender_name}</p>
                        )}
                        <p className="text-sm text-white break-words">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-[#333]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 px-3 py-2 bg-[#0d0d0d] border border-[#333] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
