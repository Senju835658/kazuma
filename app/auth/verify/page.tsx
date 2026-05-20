"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token")
      const email = searchParams.get("email")

      if (!token || !email) {
        setStatus("error")
        setMessage("Link de verificacao invalido")
        return
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage("Email verificado com sucesso!")
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push("/membro/login")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.error || "Erro ao verificar email")
        }
      } catch {
        setStatus("error")
        setMessage("Erro de conexao")
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verificando email...</h2>
              <p className="text-gray-400">Aguarde um momento</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verificado!</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">Redirecionando para o login...</p>
              <Link
                href="/membro/login"
                className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-white transition-colors"
              >
                Ir para Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Erro na Verificacao</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/membro/cadastro"
                  className="block px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-white transition-colors"
                >
                  Tentar Cadastrar Novamente
                </Link>
                <Link
                  href="/membro/login"
                  className="block px-6 py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium text-white transition-colors"
                >
                  Ir para Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
