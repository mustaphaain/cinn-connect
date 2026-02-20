const BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3001'

const TOKEN_KEY = 'cineconnect_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export type User = { id: number; email: string; username: string }

async function request<T>(path: string, options: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...init } = options
  const headers: HeadersInit = { ...(init.headers as Record<string, string>) }
  if (json !== undefined) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) {
    (headers as Record<string, string>)['Authorization'] = 'Bearer ' + token
  }
  const res = await fetch(BASE + path, {
    ...init,
    headers,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'HTTP ' + res.status)
  }
  return data as T
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; username: string }) =>
      request<{ user: User; token: string }>('/auth/register', { method: 'POST', json: body }),
    login: (body: { email: string; password: string }) =>
      request<{ user: User; token: string }>('/auth/login', { method: 'POST', json: body }),
  },
  users: {
    me: () => request<User & { createdAt?: string }>('/users/me'),
  },
  messages: {
    list: () =>
      request<
        { id: number; content: string; createdAt: string; username: string; senderId: number }[]
      >('/messages'),
  },
}

export function getApiBase() {
  return BASE
}
