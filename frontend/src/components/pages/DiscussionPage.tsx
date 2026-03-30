import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { Trash2 } from 'lucide-react'
import { api, getApiBase, type ChatMessage } from '../../lib/api'
import { useAuth } from '../../contexts/useAuth'
import { avatarIdToSrc } from '../../lib/avatars'
import { GlassPanel } from '../molecules/GlassPanel'
import { ConfirmDialog } from '../molecules/ConfirmDialog'

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function DiscussionPage() {
  const { user } = useAuth()
  const [livePublicMessages, setLivePublicMessages] = useState<ChatMessage[]>([])
  const [livePrivateByFriend, setLivePrivateByFriend] = useState<Record<number, ChatMessage[]>>({})
  const [input, setInput] = useState('')
  const [socketError, setSocketError] = useState<string | null>(null)
  const [activePrivateFriendId, setActivePrivateFriendId] = useState<number | null>(null)
  const [deletedById, setDeletedById] = useState<Record<number, true>>({})
  const [confirmDelete, setConfirmDelete] = useState<ChatMessage | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: initialPublic } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.messages.list(),
    retry: false,
  })

  const { data: friendsData } = useQuery({
    queryKey: ['friends-for-chat'],
    queryFn: () => api.friends.list(),
    enabled: Boolean(user),
    retry: false,
  })

  const { data: initialPrivate } = useQuery({
    queryKey: ['messages-private', activePrivateFriendId],
    queryFn: () => api.messages.listPrivate(activePrivateFriendId as number),
    enabled: activePrivateFriendId != null,
    retry: false,
  })

  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  useEffect(() => {
    const httpBase = getApiBase()
    const u = new URL(httpBase)
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = io(u.toString(), { withCredentials: true })
    socketRef.current = socket

    socket.on('message', (msg: ChatMessage) => {
      setLivePublicMessages((prev) => [...prev, msg])
    })
    socket.on('private:message', (msg: ChatMessage) => {
      const otherId = msg.senderId === user?.id ? msg.recipientId : msg.senderId
      if (typeof otherId !== 'number' || !Number.isFinite(otherId)) return
      setLivePrivateByFriend((prev) => ({
        ...prev,
        [otherId]: [...(prev[otherId] ?? []), msg],
      }))
    })
    socket.on('message:deleted', (data: { id?: number }) => {
      const id = Number(data?.id)
      if (!Number.isFinite(id) || id <= 0) return
      setDeletedById((prev) => ({ ...prev, [id]: true }))
    })
    socket.on('private:message:deleted', (data: { id?: number }) => {
      const id = Number(data?.id)
      if (!Number.isFinite(id) || id <= 0) return
      setDeletedById((prev) => ({ ...prev, [id]: true }))
    })
    socket.on('error', (data: { message?: string }) => {
      setSocketError(data.message || 'Erreur')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id])

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }, [initialPublic, initialPrivate, livePublicMessages, livePrivateByFriend, activePrivateFriendId])

  const send = () => {
    if (!input.trim()) return
    if (!socketRef.current) return
    if (activePrivateFriendId != null) {
      socketRef.current.emit('private:message', { toUserId: activePrivateFriendId, content: input.trim() })
    } else {
      socketRef.current.emit('message', input.trim())
    }
    setInput('')
    setSocketError(null)
  }

  const publicMessages = [...(initialPublic ?? []), ...livePublicMessages]
  const privateBase = activePrivateFriendId != null ? (initialPrivate ?? []) : []
  const privateLive = activePrivateFriendId != null ? (livePrivateByFriend[activePrivateFriendId] ?? []) : []
  const privateMessages = [...privateBase, ...privateLive]
  const rawCurrentMessages = activePrivateFriendId == null ? publicMessages : privateMessages
  const currentMessages = rawCurrentMessages.filter((m) => !deletedById[m.id])
  const friends = friendsData?.friends ?? []

  const confirmDeleteMessage = (m: ChatMessage) => {
    if (!user || m.senderId !== user.id) return
    setConfirmDelete(m)
  }

  const doDelete = async (m: ChatMessage) => {
    setDeletedById((prev) => ({ ...prev, [m.id]: true }))
    try {
      if (socketRef.current) {
        if (activePrivateFriendId != null) {
          socketRef.current.emit('private:message:delete', { id: m.id })
        } else {
          socketRef.current.emit('message:delete', { id: m.id })
        }
      } else {
        await api.messages.delete(m.id)
      }
    } catch (err) {
      setDeletedById((prev) => {
        const next = { ...prev }
        delete next[m.id]
        return next
      })
      setSocketError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 md:block md:space-y-4">
      <GlassPanel className="relative overflow-hidden p-5 md:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/10 blur-2xl" />
        <div className="relative">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Discussion</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Chat temps réel dans le style Ciné-Connect. Connecte-toi pour envoyer.</p>
          {user ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActivePrivateFriendId(null)}
                className={cx(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  activePrivateFriendId == null
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-200'
                    : 'border-zinc-200 bg-white/80 text-zinc-700 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:bg-zinc-950/70'
                )}
              >
                Canal public
              </button>
              {friends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActivePrivateFriendId(f.id)}
                  className={cx(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    activePrivateFriendId === f.id
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-200'
                      : 'border-zinc-200 bg-white/80 text-zinc-700 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:bg-zinc-950/70'
                  )}
                >
                  {f.username}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </GlassPanel>

      <GlassPanel className="flex min-h-0 flex-1 flex-col overflow-hidden md:block">
        <div
          ref={listRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 md:p-5 md:max-h-[58vh] md:min-h-[260px] md:flex-none"
        >
          {currentMessages.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-zinc-200/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/35"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={avatarIdToSrc(m.avatarUrl)}
                    alt={m.username}
                    className="h-7 w-7 shrink-0 rounded-full border border-zinc-200 dark:border-zinc-700"
                  />
                  <a
                    href={'/user/' + m.senderId}
                    className="truncate text-xs font-semibold text-indigo-600 hover:underline dark:text-fuchsia-400"
                  >
                    {m.username}
                  </a>
                </div>
                {user?.id === m.senderId ? (
                  <button
                    type="button"
                    onClick={() => confirmDeleteMessage(m)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white/70 text-zinc-600 transition hover:bg-white hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:bg-zinc-950/70 dark:hover:text-zinc-50"
                    title="Supprimer le message"
                    aria-label="Supprimer le message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <p className="mt-1.5 text-sm text-zinc-800 dark:text-zinc-200">{m.content}</p>
            </article>
          ))}
        </div>

        {socketError ? <div className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">{socketError}</div> : null}

        <div className="border-t border-zinc-200/80 p-4 pb-[env(safe-area-inset-bottom)] dark:border-zinc-800/80 md:pb-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={user ? (activePrivateFriendId == null ? 'Écris un message public...' : 'Écris un message privé...') : 'Connecte-toi pour envoyer un message'}
              disabled={!user}
              className="w-full flex-1 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-indigo-600/20 focus:ring-4 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:ring-fuchsia-500/15 md:w-auto"
            />
            <button
              type="button"
              onClick={send}
              disabled={!user || !input.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 dark:ring-white/10 md:w-auto"
            >
              Envoyer
            </button>
          </div>
        </div>
      </GlassPanel>

      <ConfirmDialog
        open={confirmDelete != null}
        title="Supprimer le message ?"
        description="Cette action supprimera ton message pour tout le monde."
        confirmText="Supprimer"
        cancelText="Annuler"
        destructive
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const m = confirmDelete
          setConfirmDelete(null)
          if (m) await doDelete(m)
        }}
      />
    </section>
  )
}

