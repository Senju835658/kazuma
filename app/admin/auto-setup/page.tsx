"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AutoSetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const setupAdmin = async () => {
    setStatus("loading")
    setMessage("Criando conta do líder...")

    try {
      // Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: "gb835658@gmail.com",
        password: "GT200215",
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
            `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        // Se o usuário já existe, tentar fazer login
        if (authError.message.includes("already registered")) {
          setMessage("Conta já existe. Fazendo login...")
          
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: "gb835658@gmail.com",
            password: "GT200215",
          })

          if (loginError) {
            throw loginError
          }

          if (loginData.user) {
            // Verificar se já é admin
            const { data: existingAdmin } = await supabase
              .from("admins")
              .select("id")
              .eq("email", "gb835658@gmail.com")
              .single()

            if (!existingAdmin) {
              // Adicionar como admin
              const { error: adminError } = await supabase
                .from("admins")
                .insert({
                  user_id: loginData.user.id,
                  email: "gb835658@gmail.com",
                })

              if (adminError && !adminError.message.includes("duplicate")) {
                // Erro silencioso - nao expor detalhes
              }
            }

            setStatus("success")
            setMessage("Login realizado com sucesso! Redirecionando...")
            setTimeout(() => router.push("/admin"), 2000)
            return
          }
        } else {
          throw authError
        }
      }

      if (authData.user) {
        // Adicionar como admin
        const { error: adminError } = await supabase
          .from("admins")
          .insert({
            user_id: authData.user.id,
            email: "gb835658@gmail.com",
          })

        if (adminError && !adminError.message.includes("duplicate")) {
          // Erro silencioso - nao expor detalhes
        }

        setStatus("success")
        setMessage("Conta criada! Verifique seu email para confirmar e depois faça login.")
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "Erro ao criar conta")
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
          <h1 
            className="text-2xl font-bold text-center mb-6"
            style={{
              color: '#dc2626',
              textShadow: '0 0 10px rgba(220, 38, 38, 0.8), 0 0 20px rgba(220, 38, 38, 0.6)',
            }}
          >
            Configurar Líder
          </h1>

          <div className="space-y-4 text-center">
            <div className="bg-[#0d0d0d] rounded-lg p-4 text-left">
              <p className="text-gray-400 text-sm mb-2">Email:</p>
              <p className="text-white font-mono">gb835658@gmail.com</p>
            </div>

            <div className="bg-[#0d0d0d] rounded-lg p-4 text-left">
              <p className="text-gray-400 text-sm mb-2">Senha:</p>
              <p className="text-white font-mono">GT200215</p>
            </div>

            {status === "idle" && (
              <button
                onClick={setupAdmin}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Configurar Conta do Líder
              </button>
            )}

            {status === "loading" && (
              <div className="py-3 text-yellow-500">{message}</div>
            )}

            {status === "success" && (
              <div className="py-3 text-green-500">{message}</div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <div className="py-3 text-red-500">{message}</div>
                <button
                  onClick={() => setStatus("idle")}
                  className="w-full py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg font-medium transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            <a
              href="/admin/login"
              className="block mt-4 text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Ir para página de login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
