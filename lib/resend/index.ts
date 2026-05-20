import { Resend } from "resend"

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing")
  }

  return new Resend(apiKey)
}