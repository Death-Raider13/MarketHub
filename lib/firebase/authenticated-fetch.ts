"use client"

import { auth } from "./config"

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error("Please sign in again")

  const token = await currentUser.getIdToken()
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  const response = await fetch(input, { ...init, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.error || `Request failed (${response.status})`)
  }
  return response
}
