import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import * as authApi from "../api/auth"
import { refreshSession, setSessionExpiredHandler } from "../api/client"
import type { User } from "../types/api"

interface AuthState {
  /** Null until the initial session restore has resolved. */
  user: User | null
  status: "restoring" | "authenticated" | "anonymous"
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: authApi.RegisterInput) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthState["status"]>("restoring")
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const restored = await refreshSession()
      if (cancelled) return
      if (!restored) {
        setStatus("anonymous")
        return
      }
      try {
        const current = await authApi.me()
        if (cancelled) return
        setUser(current)
        setStatus("authenticated")
      } catch {
        if (cancelled) return
        setStatus("anonymous")
      }
    }
    void restore()
    setSessionExpiredHandler(() => {
      setUser(null)
      setStatus("anonymous")
      queryClient.clear()
    })
    return () => {
      cancelled = true
      setSessionExpiredHandler(null)
    }
  }, [queryClient])

  const signIn = useCallback(
    async (email: string, password: string) => {
      await authApi.login(email, password)
      const current = await authApi.me()
      setUser(current)
      setStatus("authenticated")
    },
    [],
  )

  const signUp = useCallback(async (input: authApi.RegisterInput) => {
    await authApi.register(input)
  }, [])

  const signOut = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    setStatus("anonymous")
    queryClient.clear()
  }, [queryClient])

  const refreshUser = useCallback(async () => {
    const current = await authApi.me()
    setUser(current)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, status, signIn, signUp, signOut, refreshUser }),
    [user, status, signIn, signUp, signOut, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
