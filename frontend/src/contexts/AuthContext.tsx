import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, type User } from '../lib/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string, avatarUrl?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    try {
      const me = await api.users.me()
      setUser({
        id: me.id,
        email: me.email,
        username: me.username,
        avatarUrl: me.avatarUrl ?? null,
        createdAt: me.createdAt,
      })
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: u } = await api.auth.login({ email, password })
      setUser(u)
    },
    []
  )

  const register = useCallback(
    async (email: string, password: string, username: string, avatarUrl?: string) => {
      const { user: u } = await api.auth.register({ email, password, username, avatarUrl })
      setUser(u)
    },
    []
  )

  const logout = useCallback(() => {
    api.auth.logout().catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
