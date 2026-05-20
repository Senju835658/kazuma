import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "foda-alliance-secret-key-2024"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      email: string
      name: string
    }

    return NextResponse.json({ 
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    })

  } catch {
    // Token invalido ou expirado
    const response = NextResponse.json({ user: null }, { status: 200 })
    response.cookies.delete("auth_token")
    return response
  }
}
