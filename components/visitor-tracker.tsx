"use client"

import { useEffect } from "react"

function generateVisitorId() {
  const stored = localStorage.getItem("visitor_id")
  if (stored) return stored
  
  const newId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem("visitor_id", newId)
  return newId
}

export default function VisitorTracker() {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const visitorId = generateVisitorId()
        
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            pageUrl: window.location.pathname
          })
        })
      } catch (error) {
        // Silently fail
      }
    }

    trackVisit()

    // Atualizar a cada 2 minutos para manter "online"
    const interval = setInterval(trackVisit, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
