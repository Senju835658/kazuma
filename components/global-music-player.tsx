"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Music, Play, Pause, SkipForward, SkipBack, ChevronUp, Disc3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MusicAlbum {
  id: string
  name: string
  description: string | null
  cover_color: string
  created_at: string
}

interface GameMusic {
  id: string
  title: string
  artist: string
  url: string
  album_id: string | null
  created_at: string
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string
          width: string
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number; target: YTPlayer }) => void
            onError?: (event: { data: number }) => void
          }
        }
      ) => YTPlayer
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  loadVideoById: (videoId: string) => void
  destroy: () => void
  getPlayerState: () => number
}

export default function GlobalMusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [albums, setAlbums] = useState<MusicAlbum[]>([])
  const [musicList, setMusicList] = useState<GameMusic[]>([])
  const [filteredMusic, setFilteredMusic] = useState<GameMusic[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [apiReady, setApiReady] = useState(false)
  
  const playerRef = useRef<YTPlayer | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()

  // Carregar YouTube IFrame API
  useEffect(() => {
    if (typeof window !== "undefined" && !window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setApiReady(true)
      }
    } else if (window.YT) {
      setApiReady(true)
    }
  }, [])

  useEffect(() => {
    loadAlbums()
    loadMusicList()
  }, [])

  useEffect(() => {
    if (selectedAlbum) {
      const filtered = musicList.filter(m => m.album_id === selectedAlbum)
      setFilteredMusic(filtered)
      setCurrentTrack(0)
    } else {
      setFilteredMusic(musicList)
    }
  }, [selectedAlbum, musicList])

  const filteredMusicLengthRef = useRef(filteredMusic.length)
  
  useEffect(() => {
    filteredMusicLengthRef.current = filteredMusic.length
  }, [filteredMusic.length])

  const handleStateChange = useCallback((event: { data: number }) => {
    console.log("[v0] YouTube state changed:", event.data)
    // 0 = ENDED
    if (event.data === 0) {
      console.log("[v0] Music ended, skipping to next")
      // Musica terminou, pular para proxima
      setCurrentTrack((prev) => {
        const next = (prev + 1) % filteredMusicLengthRef.current
        console.log("[v0] Next track:", next)
        return next
      })
      setIsPlaying(true)
    }
    // 1 = PLAYING
    if (event.data === 1) {
      setIsPlaying(true)
    }
    // 2 = PAUSED
    if (event.data === 2) {
      setIsPlaying(false)
    }
  }, [])

  // Criar/atualizar player quando a musica muda
  useEffect(() => {
    if (!apiReady || !hasInteracted || filteredMusic.length === 0) return

    const currentMusic = filteredMusic[currentTrack]
    if (!currentMusic) return

    console.log("[v0] Loading track:", currentTrack, currentMusic.title)

    // Se o player ja existe, apenas carregar novo video
    if (playerRef.current) {
      try {
        playerRef.current.loadVideoById(currentMusic.url)
        console.log("[v0] Loaded video by ID:", currentMusic.url)
      } catch (e) {
        console.log("[v0] Error loading video, recreating player")
        playerRef.current = null
      }
      return
    }

    // Criar novo player
    if (playerContainerRef.current && window.YT && window.YT.Player) {
      console.log("[v0] Creating new YouTube player")
      playerRef.current = new window.YT.Player("yt-player-global", {
        height: "1",
        width: "1",
        videoId: currentMusic.url,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event) => {
            console.log("[v0] Player ready, playing video")
            event.target.playVideo()
            setIsPlaying(true)
          },
          onStateChange: handleStateChange,
          onError: (e) => {
            console.log("[v0] Player error:", e.data)
            // Pular para proxima em caso de erro
            setCurrentTrack((prev) => (prev + 1) % filteredMusicLengthRef.current)
          },
        },
      })
    }
  }, [apiReady, hasInteracted, currentTrack, filteredMusic, handleStateChange])

  // Controlar play/pause
  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo()
      } else {
        playerRef.current.pauseVideo()
      }
    }
  }, [isPlaying])

  const loadAlbums = async () => {
    const { data } = await supabase
      .from("music_albums")
      .select("*")
      .order("created_at", { ascending: true })

    if (data) {
      setAlbums(data)
    }
  }

  const loadMusicList = async () => {
    const { data } = await supabase
      .from("game_music")
      .select("*")
      .order("created_at", { ascending: true })

    if (data && data.length > 0) {
      setMusicList(data)
      setFilteredMusic(data)
    }
  }

  const togglePlay = () => {
    if (filteredMusic.length === 0) return
    setHasInteracted(true)
    setIsPlaying(!isPlaying)
  }

  const nextTrack = () => {
    if (filteredMusic.length === 0) return
    setCurrentTrack((prev) => (prev + 1) % filteredMusic.length)
    setIsPlaying(true)
    setHasInteracted(true)
  }

  const prevTrack = () => {
    if (filteredMusic.length === 0) return
    setCurrentTrack((prev) => (prev - 1 + filteredMusic.length) % filteredMusic.length)
    setIsPlaying(true)
    setHasInteracted(true)
  }

  const selectAlbum = (albumId: string | null) => {
    setSelectedAlbum(albumId)
    setCurrentTrack(0)
    // Destruir player antigo para recriar com nova playlist
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }
    if (hasInteracted) {
      setIsPlaying(true)
    }
  }

  const currentMusic = filteredMusic[currentTrack]
  const currentAlbum = albums.find(a => a.id === selectedAlbum)

  if (musicList.length === 0) return null

  return (
    <>
      {/* YouTube Player Container (hidden) */}
      <div 
        ref={playerContainerRef}
        className="fixed opacity-0 pointer-events-none"
        style={{ width: 1, height: 1, top: -9999, left: -9999 }}
      >
        <div id="yt-player-global" />
      </div>

      {/* Player UI */}
      <div className="fixed bottom-4 left-4 z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className={`relative p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-full shadow-lg transition-all hover:scale-105 ${
              isPlaying ? "animate-pulse" : ""
            }`}
          >
            <Music className="w-6 h-6 text-white" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full">
                <span className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
              </span>
            )}
            {!isPlaying && musicList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
            )}
          </button>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl w-80 overflow-hidden">
            {/* Header */}
            <div 
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${currentAlbum?.cover_color || '#8b5cf6'}, ${currentAlbum?.cover_color || '#8b5cf6'}dd)` }}
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">
                  {currentAlbum?.name || "Todas as Musicas"}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <ChevronUp className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Albums */}
            {albums.length > 0 && (
              <div className="px-3 py-2 border-b border-[#333] flex gap-2 overflow-x-auto">
                <button
                  onClick={() => selectAlbum(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedAlbum === null
                      ? "bg-purple-600 text-white"
                      : "bg-[#252525] text-gray-400 hover:bg-[#333]"
                  }`}
                >
                  Todas
                </button>
                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => selectAlbum(album.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      selectedAlbum === album.id
                        ? "text-white"
                        : "bg-[#252525] text-gray-400 hover:bg-[#333]"
                    }`}
                    style={selectedAlbum === album.id ? { backgroundColor: album.cover_color } : {}}
                  >
                    <Disc3 className="w-3 h-3" />
                    {album.name}
                  </button>
                ))}
              </div>
            )}

            {/* Track Info */}
            <div className="p-4">
              {filteredMusic.length > 0 ? (
                <>
                  <div className="mb-4 text-center">
                    <h4 className="font-medium text-white truncate">
                      {currentMusic?.title || "Nenhuma musica"}
                    </h4>
                    <p className="text-gray-400 text-sm truncate">
                      {currentMusic?.artist || ""}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {currentTrack + 1} de {filteredMusic.length}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={prevTrack}
                      className="p-2 hover:bg-[#333] rounded-full transition-colors"
                    >
                      <SkipBack className="w-5 h-5 text-gray-300" />
                    </button>
                    
                    <button
                      onClick={togglePlay}
                      className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={nextTrack}
                      className="p-2 hover:bg-[#333] rounded-full transition-colors"
                    >
                      <SkipForward className="w-5 h-5 text-gray-300" />
                    </button>
                  </div>

                  {/* Track list */}
                  {filteredMusic.length > 1 && (
                    <div className="pt-3 border-t border-[#333]">
                      <p className="text-xs text-gray-500 mb-2">
                        Playlist ({filteredMusic.length} musicas)
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {filteredMusic.map((track, index) => (
                          <button
                            key={track.id}
                            onClick={() => {
                              setCurrentTrack(index)
                              setIsPlaying(true)
                              setHasInteracted(true)
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                              index === currentTrack
                                ? "bg-purple-600/20 text-purple-400"
                                : "hover:bg-[#252525] text-gray-400"
                            }`}
                          >
                            <span className="truncate block">{track.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasInteracted && (
                    <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 text-center">
                      Clique em Play para iniciar
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Disc3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma musica neste album</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
