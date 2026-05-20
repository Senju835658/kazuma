"use client"

import { useEffect, useState } from "react"

// Missões de cada dia do Duelo de Aliança
const DAILY_MISSIONS = {
  // Segunda-feira - Dia 1: Corvo e Coleta
  1: {
    day: 1,
    dayName: "Segunda-feira",
    theme: "Corvo e Coleta",
    missions: [
      { task: "Consuma 1 de Vigor", points: "+300" },
      { task: "Complete a Missao Falcao 1 vez", points: "+23.500", highlight: true },
      { task: "Use 660 de Antitoxina", points: "+2" },
      { task: "Compre um pacote contendo Diamantes [1 Diamante]", points: "+30" },
      { task: "Colete 100 de Comida", points: "+10" },
      { task: "Colete 100 de Madeira", points: "+10" },
      { task: "Colete 60 de Ervas", points: "+10" },
      { task: "Consuma 1 Fruto do Corvo", points: "+6" },
      { task: "Consuma 1 Essencia do Corvo", points: "+5.000", highlight: true },
    ],
    tips: [
      "Guardem Essencias do Corvo para usar hoje",
      "Facam todas as Missoes Falcao possiveis",
      "Nunca deixem tropas paradas - mandem coletar",
      "Usem aceleracao de coleta se tiverem",
      "Gastem stamina em monstros e ralis"
    ]
  },
  // Terça-feira - Dia 2: Construção e Caravana
  2: {
    day: 2,
    dayName: "Terca-feira",
    theme: "Construcao e Caravana",
    missions: [
      { task: "Compre um pacote contendo Diamantes [1 Diamante]", points: "+30" },
      { task: "Use Acelerar Construcao - 1min", points: "+117.5" },
      { task: "Aumente o Poder de 1 Edificio", points: "+21" },
      { task: "Execute 1 Operacao Secreta UR", points: "+157.500", highlight: true },
      { task: "Envie uma Caravana UR", points: "+200.000", highlight: true },
      { task: "Recrute sobreviventes uma vez", points: "+3.000" },
    ],
    tips: [
      "PRIORIDADE MAXIMA: Enviar Caravana UR (+200k pontos!)",
      "Guardem Operacoes Secretas UR para hoje",
      "Usem aceleradores de construcao",
      "Recrutem sobreviventes varias vezes",
      "Nao desperdicem filas de construcao"
    ]
  },
  // Quarta-feira - Dia 3: Pesquisa e Baú do Corvo
  3: {
    day: 3,
    dayName: "Quarta-feira",
    theme: "Pesquisa e Bau do Corvo",
    missions: [
      { task: "Complete a Missao Falcao 1 vez", points: "+23.500", highlight: true },
      { task: "Compre um pacote contendo Diamantes [1 Diamante]", points: "+30" },
      { task: "Use Acelerar Pesquisa - 1min", points: "+117.5" },
      { task: "Consumir 1 Pergaminho de Estudo", points: "+600" },
      { task: "Aumente o Poder de 1 Tecnologia", points: "+21.5" },
      { task: "Para cada Bau de Equipamento do Corvo Nv.1 aberto", points: "+2.200" },
      { task: "Para cada Bau de Equipamento do Corvo Nv.2 aberto", points: "+6.600" },
      { task: "Para cada Bau de Equipamento do Corvo Nv.3 aberto", points: "+20.000", highlight: true },
      { task: "Para cada Bau de Equipamento do Corvo Nv.4 aberto", points: "+60.000", highlight: true },
    ],
    tips: [
      "Guardem Baus de Equipamento do Corvo para hoje",
      "Bau Nv.4 da 60k pontos - muito valioso!",
      "Usem todos os aceleradores de pesquisa",
      "Completem pesquisas que estao quase prontas",
      "Facam Missao Falcao para pontos extras"
    ]
  },
  // Quinta-feira - Dia 4: Heróis
  4: {
    day: 4,
    dayName: "Quinta-feira",
    theme: "Herois e Fragmentos",
    missions: [
      { task: "Use 660 de Antitoxina", points: "+2" },
      { task: "Compre um pacote contendo Diamantes [1 Diamante]", points: "+30" },
      { task: "Recrute herois uma vez", points: "+3.525" },
      { task: "Consuma 1 Fragmento de Heroi UR", points: "+20.000", highlight: true },
      { task: "Consumir 1 Fragmento de Heroi SSR", points: "+7.000", highlight: true },
      { task: "Consuma 1 Fragmento de Heroi SR", points: "+2.000" },
      { task: "Use 1 Insignia de Habilidade", points: "+20" },
    ],
    tips: [
      "Guardem Fragmentos de Heroi UR para hoje (+20k cada!)",
      "Fragmentos SSR tambem dao bons pontos (+7k)",
      "Recrutem herois varias vezes",
      "Usem Insignias de Habilidade",
      "Priorizem fragmentos de maior raridade"
    ]
  },
  // Sexta-feira - Dia 5: Treinamento/Construção/Pesquisa
  5: {
    day: 5,
    dayName: "Sexta-feira",
    theme: "Treinamento, Construcao e Pesquisa",
    missions: [
      { task: "Complete a Missao Falcao 1 vez", points: "+23.500", highlight: true },
      { task: "Compre um pacote contendo Diamantes [1 Diamante]", points: "+30" },
      { task: "Use Acelerar Construcao - 1min", points: "+117.5" },
      { task: "Aumente o Poder de 1 Edificio", points: "+21" },
      { task: "Use Acelerar Pesquisa - 1min", points: "+117.5" },
      { task: "Aumente o Poder de 1 Tecnologia", points: "+21.5" },
      { task: "Use 1min de Impulso de Treinamento", points: "+117.5" },
      { task: "Treine 1 soldado Nv.1", points: "+46" },
      { task: "Treine 1 soldado Nv.2", points: "+69" },
    ],
    tips: [
      "Dia completo - foquem em tudo!",
      "Usem aceleradores de construcao, pesquisa E treinamento",
      "Treinem soldados de tier mais alto",
      "Nao deixem filas paradas",
      "Missao Falcao da muitos pontos"
    ]
  },
  // Sábado - Dia 6: Operação Secreta e Batalha
  6: {
    day: 6,
    dayName: "Sabado",
    theme: "Operacao Secreta e Batalha",
    missions: [
      { task: "Use Acelerar Construcao - 1min", points: "+117.5" },
      { task: "Execute 1 Operacao Secreta UR", points: "+157.500", highlight: true },
      { task: "Use Acelerar Pesquisa - 1min", points: "+117.5" },
      { task: "Use 1min de Impulso de Treinamento", points: "+117.5" },
      { task: "Use Acelerar Cura - 1min", points: "+117.5" },
      { task: "Para cada soldado Nv.1 derrotado (partida especifica)", points: "+23" },
      { task: "Para cada soldado Nv.2 derrotado (partida especifica)", points: "+34.5" },
      { task: "Para cada soldado Nv.3 derrotado (partida especifica)", points: "+46" },
      { task: "Para cada soldado Nv.4 derrotado (partida especifica)", points: "+57.5" },
    ],
    tips: [
      "ULTIMO DIA - va com tudo!",
      "Operacao Secreta UR da 157k pontos!",
      "Participem de batalhas para pontos de eliminacao",
      "Usem todos os aceleradores restantes",
      "Curem tropas para usar aceleradores de cura"
    ]
  }
}

export default function DailyMissions() {
  const [currentDay, setCurrentDay] = useState<number>(1)
  const [isEventActive, setIsEventActive] = useState(true)

  useEffect(() => {
    // Pegar o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    // Mapear para os dias do evento (Segunda = 1, Terça = 2, ..., Sábado = 6)
    // Domingo (0) não tem evento
    if (dayOfWeek === 0) {
      setIsEventActive(false)
    } else {
      setIsEventActive(true)
      setCurrentDay(dayOfWeek)
    }
  }, [])

  // Se for domingo, mostrar mensagem
  if (!isEventActive) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden mb-6">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">😴</div>
          <h3 className="text-xl font-bold text-gray-400 mb-2">Domingo - Dia de Descanso</h3>
          <p className="text-gray-500">
            O Duelo de Alianca reinicia na segunda-feira. Aproveite para se preparar!
          </p>
        </div>
      </div>
    )
  }

  const dayData = DAILY_MISSIONS[currentDay as keyof typeof DAILY_MISSIONS]

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-red-600/50 overflow-hidden mb-6">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded animate-pulse">
            AO VIVO
          </span>
          <span className="text-gray-400 text-sm">
            {dayData.dayName} | Dia {dayData.day} de 6
          </span>
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-2">
          Duelo de Alianca - Dia {dayData.day}
        </h3>
        <p className="text-yellow-500 font-medium mb-6">
          Tema: {dayData.theme}
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Missões */}
          <div className="bg-[#252525] p-5 rounded-lg border border-[#333]">
            <h4 className="font-bold text-yellow-500 mb-4 flex items-center gap-2">
              <span>🏆</span> MISSOES DO DIA
            </h4>
            <div className="space-y-2">
              {dayData.missions.map((mission, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center py-2 px-3 rounded ${
                    mission.highlight 
                      ? "bg-yellow-500/10 border border-yellow-500/30" 
                      : "bg-[#1a1a1a]"
                  }`}
                >
                  <span className={`text-sm ${mission.highlight ? "text-yellow-300" : "text-gray-300"}`}>
                    {mission.task}
                  </span>
                  <span className={`font-bold text-sm whitespace-nowrap ml-2 ${
                    mission.highlight ? "text-green-400" : "text-green-500"
                  }`}>
                    {mission.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dicas */}
          <div className="bg-[#252525] p-5 rounded-lg border border-[#333]">
            <h4 className="font-bold text-yellow-500 mb-4 flex items-center gap-2">
              <span>⚔️</span> ESTRATEGIA
            </h4>
            <ul className="space-y-3">
              {dayData.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-green-400 mt-0.5">✅</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Rodapé */}
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-orange-400 text-sm font-medium text-center">
            🔥 Dia {dayData.day} - {dayData.theme}. Nao percam tempo, cada ponto conta!
          </p>
        </div>

        {/* Navegação entre dias */}
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((day) => (
            <button
              key={day}
              onClick={() => setCurrentDay(day)}
              className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                day === currentDay
                  ? "bg-red-600 text-white"
                  : "bg-[#252525] text-gray-400 hover:bg-[#333] hover:text-white"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <p className="text-center text-gray-500 text-xs mt-2">
          Clique nos numeros para ver as missoes de outros dias
        </p>
      </div>
    </div>
  )
}
