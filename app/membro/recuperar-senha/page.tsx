"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/membro/nova-senha`
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email enviado!</h2>
            <p className="text-gray-400 mb-6">
              Enviamos um link de recuperacao para <span className="text-white">{email}</span>. 
              Verifique sua caixa de entrada e spam.
            </p>
            <Link
              href="/membro/login"
              className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/bg-panels.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 
              className="text-3xl font-bold font-[family-name:var(--font-cinzel)]"
              style={{
                color: '#dc2626',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.8), 0 0 20px rgba(220, 38, 38, 0.6)'
              }}
            >
              Alianca FODA
            </h1>
          </Link>
          <p className="text-gray-400 mt-2">Recuperar senha</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
          <p className="text-gray-400 text-sm mb-6">
            Digite seu email e enviaremos um link para voce criar uma nova senha.
          </p>

          <form onSubmit={handleRecover} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperacao"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/membro/login" 
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}
