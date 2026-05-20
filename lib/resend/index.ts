import { Resend } from "resend"

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY

  return new Resend(apiKey || "re_dummy_key_for_build")
}