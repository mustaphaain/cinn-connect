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
    <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Discussion
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Chat temps réel (Socket.io). Connecte-toi pour envoyer un message.
        </p>
        {user && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActivePrivateFriendId(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activePrivateFriendId == null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200'
              }`}
            >
              Canal public
            </button>
            {friends.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActivePrivateFriendId(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activePrivateFriendId === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200'
                }`}
              >
                {f.username}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={listRef}
        className="flex max-h-[60vh] min-h-[200px] flex-col gap-2 overflow-y-auto p-4"
      >
        {currentMessages.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <div className="flex items-center gap-2">
              <img
                src={avatarIdToSrc(m.avatarUrl)}
                alt={m.username}
                className="h-6 w-6 rounded-full border border-zinc-200 dark:border-zinc-700"
              />
              <span className="text-xs font-semibold text-indigo-600 dark:text-fuchsia-400">
                <a href={'/user/' + m.senderId} className="hover:underline">
                  {m.username}
                </a>
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{m.content}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{new Date(m.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {socketError && (
        <div className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">{socketError}</div>
      )}

      <div className="flex flex-col gap-2 border-t border-zinc-200 p-4 sm:flex-row dark:border-zinc-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={
            user
              ? activePrivateFriendId == null
                ? 'Écris un message public…'
                : 'Écris un message privé…'
              : 'Connecte-toi pour envoyer un message'
          }
          disabled={!user}
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={send}
          disabled={!user || !input.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
        >
          Envoyer
        </button>
      </div>
    </section>
  )
}
