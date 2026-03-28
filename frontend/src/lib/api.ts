import type { OmdbMovieDetails, OmdbSearchResponse } from './omdb'

const BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3001'

export type User = {
  id: number
  email: string
  username: string
  avatarUrl?: string | null
  createdAt?: string
}
export type UserWithAvatar = User
export type PublicUser = {
  id: number
  username: string
  avatarUrl?: string | null
  createdAt: string
  friendsCount: number
}
export type ReviewItem = {
  id: number
  rating: number
  comment: string | null
  createdAt: string
  filmTitle: string
  filmPoster: string | null
  filmImdbId: string
  filmYear: string | null
}

export type FilmRatingSummary = {
  average: number | null
  votes: number
}

export type FavoriteFilm = {
  imdbId: string
  title: string
  poster: string | null
  year: string | null
  createdAt: string
}
export type ChatMessage = {
  id: number
  content: string
  createdAt: string
  username: string
  avatarUrl?: string | null
  senderId: number
  recipientId?: number | null
}

async function request<T>(path: string, options: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...init } = options
  const headers: HeadersInit = { ...(init.headers as Record<string, string>) }
  if (json !== undefined) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }
  let res: Response
  try {
    res = await fetch(BASE + path, {
      ...init,
      credentials: 'include',
      headers,
      body: json !== undefined ? JSON.stringify(json) : init.body,
    })
  } catch (err) {
    let message = 'Erreur réseau'

    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      message = `Impossible de joindre le serveur (${BASE}). Vérifie que le backend tourne : pnpm -C backend dev. Si ton front est sur :5174, assure-toi que le backend autorise aussi cette origin (CORS).`
    } else if (err instanceof Error) {
      message = err.message
    }

    throw new Error(message)
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'HTTP ' + res.status)
  }
  return data as T
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; username: string; avatarUrl?: string }) =>
      request<{ user: UserWithAvatar }>('/auth/register', { method: 'POST', json: body }),
    login: (body: { email: string; password: string }) =>
      request<{ user: UserWithAvatar }>('/auth/login', { method: 'POST', json: body }),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
    googleComplete: (body: { username: string }) =>
      request<{ user: UserWithAvatar }>('/auth/google/complete', { method: 'POST', json: body }),
  },
  users: {
    me: () => request<UserWithAvatar>('/users/me'),
    updateMe: (body: { username?: string; avatarUrl?: string }) =>
      request<{ user: UserWithAvatar }>('/users/me', { method: 'PATCH', json: body }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ ok: true }>('/users/me/password', { method: 'PATCH', json: body }),
    getPublic: (id: number) => request<PublicUser>('/users/' + id),
    avatarPresets: () => request<{ presets: string[] }>('/users/avatars/presets'),
    search: (username: string) =>
      request<{ id: number; username: string; avatarUrl?: string | null }[]>(
        '/users/search?username=' + encodeURIComponent(username)
      ),
  },
  friends: {
    list: () =>
      request<{
        friends: { id: number; username: string; email: string; avatarUrl?: string | null }[]
        pendingReceived: { id: number; username: string; userId: number }[]
        pendingSent: { id: number; username: string; userId: number }[]
      }>('/friends'),
    request: (friendId: number) => request<{ message: string }>('/friends', { method: 'POST', json: { friendId } }),
    accept: (friendId: number) => request('/friends/' + friendId + '/accept', { method: 'PATCH' }),
    refuse: (friendId: number) => request<{ ok: true }>('/friends/' + friendId + '/refuse', { method: 'DELETE' }),
    cancel: (friendId: number) => request<{ ok: true }>('/friends/' + friendId + '/cancel', { method: 'DELETE' }),
  },
  reviews: {
    byUser: (userId: number, limit = 10) =>
      request<ReviewItem[]>('/reviews/user/' + userId + '?limit=' + limit),
    summaryByFilm: (imdbId: string) => request<FilmRatingSummary>('/reviews/film/' + imdbId + '/summary'),
    myByFilm: (imdbId: string) => request<{ rating: number | null }>('/reviews/me/film/' + imdbId),
    rateFilm: (body: { imdbId: string; title: string; poster: string | null; year: string | null; rating: number; comment?: string | null }) =>
      request('/reviews', { method: 'POST', json: body }),
  },
  messages: {
    list: () => request<ChatMessage[]>('/messages'),
    listPrivate: (friendId: number) => request<ChatMessage[]>('/messages/private/' + friendId),
  },
  favorites: {
    list: () => request<FavoriteFilm[]>('/favorites'),
    isFavorite: (imdbId: string) => request<{ favorite: boolean }>('/favorites/' + imdbId),
    add: (body: { imdbId: string; title: string; poster: string | null; year: string | null }) =>
      request<{ ok: true }>('/favorites', { method: 'POST', json: body }),
    remove: (imdbId: string) => request<{ ok: true }>('/favorites/' + imdbId, { method: 'DELETE' }),
  },

  films: {
    byGenres: (genres: string[], params?: { limit?: number; offset?: number }) =>
      request<OmdbSearchResponse>(
        '/films/by-genre?genres=' +
          encodeURIComponent(genres.join(',')) +
          '&limit=' +
          encodeURIComponent(String(params?.limit ?? 10)) +
          '&offset=' +
          encodeURIComponent(String(params?.offset ?? 0))
      ),
  },

  /** OMDb via backend (cache DB, clé API uniquement côté serveur). */
  omdb: {
    search: (query: string, page = 1) =>
      request<OmdbSearchResponse>(
        '/films/omdb/search?s=' +
          encodeURIComponent(query) +
          '&page=' +
          encodeURIComponent(String(page)),
      ),
    movie: (imdbId: string) =>
      request<OmdbMovieDetails>('/films/omdb/movie/' + encodeURIComponent(imdbId)),
    movieByTitleYear: (title: string, year: string) =>
      request<OmdbMovieDetails>(
        '/films/omdb/by-title?title=' +
          encodeURIComponent(title) +
          '&year=' +
          encodeURIComponent(year),
      ),
  },
}

export function getApiBase() {
  return BASE
}
