"use client"

import Link from "next/link"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Erro na Confirmacao</h2>
          <p className="text-gray-400 mb-6">
            O link de confirmacao expirou ou e invalido. 
            Isso pode acontecer se o link ja foi usado ou se passou muito tempo.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/membro/cadastro"
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar cadastrar novamente
            </Link>
            
            <Link
              href="/membro/login"
              className="w-full py-3 bg-[#252525] hover:bg-[#333] rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Se voce ja confirmou seu email anteriormente, tente fazer login diretamente.
          </p>
        </div>
      </div>
    </div>
  )
}
