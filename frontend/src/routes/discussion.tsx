import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { api, getToken, getApiBase } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

type MessageItem = {
  id: number
  content: string
  createdAt: string
  username: string
  senderId: number
}

export const Route = createFileRoute('/discussion')({
  component: DiscussionPage,
})

function DiscussionPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState('')
  const [socketError, setSocketError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: initial } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.messages.list(),
    retry: false,
  })

  useEffect(() => {
    if (initial) setMessages(initial)
  }, [initial])

  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  useEffect(() => {
    const url = getApiBase().replace(/^http/, 'ws')
    const socket = io(url, { auth: { token: getToken() } })
    socketRef.current = socket

    socket.on('message', (msg: MessageItem) => {
      setMessages((prev) => [...prev, msg])
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
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    if (socketRef.current) {
      socketRef.current.emit('message', input.trim())
      setInput('')
      setSocketError(null)
    }
  }

  return (
    <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold tracking-tight">Discussion</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Chat temps réel (Socket.io). Connecte-toi pour envoyer un message.
        </p>
      </div>

      <div
        ref={listRef}
        className="flex max-h-[60vh] min-h-[200px] flex-col gap-2 overflow-y-auto p-4"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <span className="text-xs font-semibold text-indigo-600 dark:text-fuchsia-400">
              {m.username}
            </span>
            <p className="mt-1 text-sm">{m.content}</p>
            <p className="mt-1 text-xs text-zinc-500">{new Date(m.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {socketError && (
        <div className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">{socketError}</div>
      )}

      <div className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={user ? 'Écris un message…' : 'Connecte-toi pour envoyer un message'}
          disabled={!user}
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={send}
          disabled={!user || !input.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </section>
  )
}
