"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Sword, Shield, Users, Target, Gem, LogIn, UserPlus, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import DailyMissions from "@/components/daily-missions"

type RankingItem = {
  id: string
  player_name: string
  ranking_type: "poder" | "eliminacoes" | "doacoes"
  value: number
}

const missoes = [
  { texto: "Completar 5 ataques nos monstros", icon: Sword },
  { texto: "Coletar recursos da alianca", icon: Gem },
  { texto: "Participar da guerra diaria", icon: Target },
  { texto: "Ajudar membros da guilda", icon: Users },
  { texto: "Fazer upgrade da base", icon: Shield },
  { texto: "Derrotar chefes do evento", icon: Target },
]

const regras = [
  "Respeito entre todos os membros.",
  "Não atacar aliados.",
  "Participar dos eventos semanais.",
  "Usar escudo quando for ficar muito tempo off ou no sábado que é dia de expurgo.",
  "Ajudar membros novos da guilda.",
]

const outrosEventos = [
  {
    titulo: "Guerra de Aliança",
    descricao: "Prepare escudos e organize tropas para o combate principal.",
  },
  {
    titulo: "Caça as Caravanas",
    descricao: "Cace caravanas de outros servidores para ganhar recursos extras. NÃO atacar caravanas do servidor 159!",
  },
  {
    titulo: "Caravana",
    descricao: "A caravana sai todo dia às 17:00 do horário de Brasília. Proteja a sua e ataque as de outros servidores!",
  },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<"poder" | "eliminacoes" | "doacoes">("poder")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchRankings = async () => {
      const { data, error } = await supabase
        .from("rankings")
        .select("*")
        .order("value", { ascending: false })

      if (!error && data) {
        setRankings(data)
      }
    }
    fetchRankings()
  }, [])

  const getColumnHeader = () => {
    switch (activeTab) {
      case "poder": return "Poder"
      case "eliminacoes": return "Eliminações"
      case "doacoes": return "Doações"
    }
  }

  return (
    <div className="min-h-screen text-white relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/background.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Top Auth Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-red-900/30">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <span className="text-red-600 font-bold text-sm tracking-wider">FODA</span>
          <div className="flex items-center gap-1">
            <Link
              href="/membro/login"
              className="px-3 py-1.5 text-xs text-gray-300 hover:text-white border border-transparent hover:border-red-600/50 rounded transition-all"
            >
              <LogIn className="w-3.5 h-3.5 inline mr-1" />
              Entrar
            </Link>
            <Link
              href="/membro/login?tab=chat"
              className="px-3 py-1.5 text-xs text-gray-300 hover:text-white border border-transparent hover:border-red-600/50 rounded transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
              Chat
            </Link>
            <Link
              href="/membro/cadastro"
              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-all font-medium"
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1" />
              Inscrever-se
            </Link>
          </div>
        </div>
      </div>
      <div className="h-10" /> {/* Spacer for fixed header */}

      {/* Hero Section */}
      <header className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-4">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-cinzel)]"
              style={{
                color: '#dc2626',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.8), 0 0 20px rgba(220, 38, 38, 0.6), 0 0 40px rgba(220, 38, 38, 0.4), 0 0 60px rgba(220, 38, 38, 0.3)',
                animation: 'glow-pulse 2s ease-in-out infinite'
              }}
            >
              Aliança FODA
            </h1>
            <p className="text-gray-400 text-lg max-w-xl whitespace-pre-line">
              {`Soldados…
Não lutamos apenas por pontos ou território.
Lutamos para que nosso nome ecoe acima de todos neste servidor.
Cada batalha, cada evento, cada sacrifício… nos aproxima da vitória.
Avancem. Dominem. E façam nossos inimigos temerem nossos nomes`}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://discord.gg/pEv73UQCP"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded-lg text-sm font-medium transition-colors"
              >
                Entrar no Discord
              </a>
              <a
                href="https://chat.whatsapp.com/JK3lREHbKhHKxh9ejLAY0i"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-lg text-sm font-medium transition-colors"
              >
                Grupo WhatsApp
              </a>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] rounded-xl overflow-hidden border border-[#333]">
              <Image
                src="/guild-image.jpg"
                alt="Imagem representando o universo da Aliança FODA"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur border-b border-[#222]">
        <div className="container mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto py-3 text-sm">
            {["Eventos", "Missões", "Regras", "Ranking", "Recrutamento"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                className="text-gray-400 hover:text-white whitespace-nowrap transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 py-8 space-y-16">
        {/* Eventos Section */}
        <section id="eventos">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-[family-name:var(--font-cinzel)]">
            Eventos da Semana
          </h2>
          
          {/* Componente automatizado de missões diárias */}
          <DailyMissions />

          {/* Evento Vale dos Cristais - ENCERRADO */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-gray-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                  ENCERRADO
                </span>
                <span className="text-gray-400 text-sm">
                  Evento finalizado
                </span>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold text-[#22c55e]">
                    Evento Vale dos Cristais
                  </h3>
                  <p className="text-gray-300">
                    Prepare suas tropas, organize sua aliança e aproveite cada minuto restante para acumular o máximo de Cristais Purificados!
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#252525] p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-1">Como funciona:</h4>
                      <p className="text-gray-400 text-sm">Colete e purifique cristais espalhados pelo mapa</p>
                    </div>
                    <div className="bg-[#252525] p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-1">Monstros Infectados:</h4>
                      <p className="text-gray-400 text-sm">Derrote para ganhar cristais de habilidade e buffs</p>
                    </div>
                    <div className="bg-[#252525] p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-1">Caverna Sagrada:</h4>
                      <p className="text-gray-400 text-sm">Ponto mais importante - controle para vantagem estratégica</p>
                    </div>
                    <div className="bg-[#252525] p-4 rounded-lg">
                      <h4 className="font-semibold text-white mb-1">Cristais Instantâneos:</h4>
                      <p className="text-gray-400 text-sm">Surgem nos minutos 10, 11, 12, 20, 21 e 22</p>
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-[300px] flex-shrink-0">
                  <div 
                    className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#333] cursor-pointer group"
                    onClick={() => setImageModalOpen(true)}
                  >
                    <Image
                      src="/evento-cristais.png"
                      alt="Guia completo do evento Vale dos Cristais"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm">Clique para ampliar</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs text-center mt-2">Clique para ampliar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Outros Eventos */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">Outros Eventos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {outrosEventos.map((evento, index) => (
                <div key={index} className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333]">
                  <h4 className="font-bold text-white mb-2">{evento.titulo}</h4>
                  <p className="text-gray-400 text-sm">{evento.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Missões Section */}
        <section id="missoes">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-[family-name:var(--font-cinzel)]">
            Missões Diárias
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {missoes.map((missao, index) => (
              <div key={index} className="flex items-center gap-3 bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
                <CheckCircle className="w-5 h-5 text-[#22c55e] flex-shrink-0" />
                <span className="text-gray-300">{missao.texto}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Regras Section */}
        <section id="regras">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-[family-name:var(--font-cinzel)]">
            Regras da Aliança
          </h2>
          <div className="space-y-3">
            {regras.map((regra, index) => (
              <div key={index} className="flex items-start gap-3 bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
                <span className="text-[#22c55e] mt-0.5">✓</span>
                <span className="text-gray-300">{regra}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Ranking Section */}
        <section id="ranking">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-[family-name:var(--font-cinzel)]">
            Ranking da Guilda
          </h2>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("poder")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "poder"
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
              }`}
            >
              ⚡ Poder
            </button>
            <button
              onClick={() => setActiveTab("eliminacoes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "eliminacoes"
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
              }`}
            >
              💀 Eliminações
            </button>
            <button
              onClick={() => setActiveTab("doacoes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "doacoes"
                  ? "bg-white text-black"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
              }`}
            >
              🎁 Doações
            </button>
          </div>

          {/* Table */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#22c55e] text-black">
                  <th className="text-left py-3 px-4 font-semibold">Posicao</th>
                  <th className="text-left py-3 px-4 font-semibold">Jogador</th>
                  <th className="text-left py-3 px-4 font-semibold">{getColumnHeader()}</th>
                </tr>
              </thead>
              <tbody>
                {rankings
                  .filter(r => r.ranking_type === activeTab)
                  .sort((a, b) => b.value - a.value)
                  .map((item, index) => (
                  <tr key={item.id} className="border-t border-[#333]">
                    <td className="py-3 px-4">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                      {index > 2 && (index + 1)}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{item.player_name}</td>
                    <td className="py-3 px-4 text-gray-400">{item.value.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
                {rankings.filter(r => r.ranking_type === activeTab).length === 0 && (
                  <tr className="border-t border-[#333]">
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      Nenhum jogador no ranking ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recrutamento Section */}
        <section id="recrutamento" className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-2xl p-8 md:p-12 text-center border border-[#333]">
          <h2 
            className="text-2xl md:text-3xl font-bold mb-4 font-[family-name:var(--font-cinzel)]"
            style={{
              color: '#dc2626',
              textShadow: '0 0 10px rgba(220, 38, 38, 0.8), 0 0 20px rgba(220, 38, 38, 0.6), 0 0 40px rgba(220, 38, 38, 0.4), 0 0 60px rgba(220, 38, 38, 0.3)',
              animation: 'glow-pulse 2s ease-in-out infinite'
            }}
          >
            JUNTE-SE À ALIANÇA FODA
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-3">
            Procuramos jogadores ativos para fortalecer nossa aliança. Entre no Discord ou WhatsApp e participe da guerra.
          </p>
          <p className="text-gray-500 text-sm mb-2">
            Jogo: <a href="https://play.google.com/store/apps/details?id=com.phs.global" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 underline underline-offset-2 transition-colors">Last Asylum</a>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Servidor 159
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://discord.gg/pEv73UQCP"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] rounded-lg font-medium transition-colors"
            >
              Discord
            </a>
            <a
              href="https://chat.whatsapp.com/JK3lREHbKhHKxh9ejLAY0i"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-lg font-medium transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#222] mt-16 bg-[#0d0d0d]/80">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="text-gray-500 text-xs">
            © 2026 <span className="text-red-600">Aliança FODA</span> <span className="text-gray-600">| Servidor 159</span>
          </div>
          <a
            href="/admin/login"
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-500 hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            R5&R4
          </a>
        </div>
      </footer>

      {/* Image Modal */}
      {imageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full">
            <Image
              src="/evento-cristais.png"
              alt="Guia completo do evento Vale dos Cristais"
              width={800}
              height={1067}
              className="object-contain w-full h-auto rounded-lg"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
              onClick={() => setImageModalOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
