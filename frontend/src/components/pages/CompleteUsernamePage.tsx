import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../../lib/api'

export function CompleteUsernamePage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.auth.googleComplete({ username })
      await navigate({ to: '/profil' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Choisis ton pseudo
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Première connexion avec Google : tu dois définir un pseudo avant de continuer.
      </p>

      <form onSubmit={submit} className="mt-4 flex max-w-sm flex-col gap-3">
        <div>
          <label htmlFor="username" className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Pseudo
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            placeholder="ex: Mathe"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !username.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Continuer
        </button>
      </form>
    </section>
  )
}

