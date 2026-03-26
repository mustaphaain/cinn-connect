import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { api, getApiBase, type ChatMessage } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { avatarIdToSrc } from '../lib/avatars'

export const Route = createFileRoute('/discussion')({
  component: DiscussionPage,
})

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function GlassPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-900/55',
        className
      )}
    >
      {children}
    </div>
  )
}

function DiscussionPage() {
  const { user } = useAuth()
  const [publicMessages, setPublicMessages] = useState<ChatMessage[]>([])
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [socketError, setSocketError] = useState<string | null>(null)
  const [activePrivateFriendId, setActivePrivateFriendId] = useState<number | null>(null)
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

  useEffect(() => {
    if (initialPublic) setPublicMessages(initialPublic)
  }, [initialPublic])

  useEffect(() => {
    if (initialPrivate) setPrivateMessages(initialPrivate)
  }, [initialPrivate])

  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  useEffect(() => {
    const url = getApiBase().replace(/^http/, 'ws')
    const socket = io(url, { withCredentials: true })
    socketRef.current = socket

    socket.on('message', (msg: ChatMessage) => {
      setPublicMessages((prev) => [...prev, msg])
    })
    socket.on('private:message', (msg: ChatMessage) => {
      if (!user) return
      if (msg.senderId === user.id || msg.recipientId === user.id) {
        setPrivateMessages((prev) => [...prev, msg])
      }
    })
    socket.on('error', (data: { message?: string }) => {
      setSocketError(data.message || 'Erreur')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight)
  }, [publicMessages, privateMessages, activePrivateFriendId])

  const send = () => {
    if (!input.trim()) return
    if (socketRef.current) {
      if (activePrivateFriendId != null) {
        socketRef.current.emit('private:message', { toUserId: activePrivateFriendId, content: input.trim() })
      } else {
        socketRef.current.emit('message', input.trim())
      }
      setInput('')
      setSocketError(null)
    }
  }

  const currentMessages = activePrivateFriendId == null ? publicMessages : privateMessages
  const friends = friendsData?.friends ?? []

  return (
    <section className="space-y-4">
      <GlassPanel className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/10 blur-2xl" />
        <div className="relative">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Discussion</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Chat temps réel dans le style Ciné-Connect. Connecte-toi pour envoyer.
          </p>
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

      <GlassPanel className="overflow-hidden">
        <div ref={listRef} className="flex max-h-[58vh] min-h-[260px] flex-col gap-3 overflow-y-auto p-4 sm:p-5">
          {currentMessages.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-zinc-200/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/35"
            >
              <div className="flex items-center gap-2">
                <img
                  src={avatarIdToSrc(m.avatarUrl)}
                  alt={m.username}
                  className="h-7 w-7 rounded-full border border-zinc-200 dark:border-zinc-700"
                />
                <a href={'/user/' + m.senderId} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-fuchsia-400">
                  {m.username}
                </a>
              </div>
              <p className="mt-1.5 text-sm text-zinc-800 dark:text-zinc-200">{m.content}</p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
          {currentMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Aucun message pour le moment.</p>
          ) : null}
        </div>

        {socketError ? (
          <div className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">{socketError}</div>
        ) : null}

        <div className="border-t border-zinc-200/80 p-4 dark:border-zinc-800/80">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={
                user
                  ? activePrivateFriendId == null
                    ? 'Écris un message public...'
                    : 'Écris un message privé...'
                  : 'Connecte-toi pour envoyer un message'
              }
              disabled={!user}
              className="flex-1 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-indigo-600/20 focus:ring-4 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:ring-fuchsia-500/15"
            />
            <button
              type="button"
              onClick={send}
              disabled={!user || !input.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 dark:ring-white/10 sm:w-auto"
            >
              Envoyer
            </button>
          </div>
        </div>
      </GlassPanel>
    </section>
  )
}
