import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const Route = createFileRoute('/profil')({
  component: ProfilPage,
})

function ProfilPage() {
  const { user, loading, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, username)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</p>
      </section>
    )
  }

  if (user) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold tracking-tight">Profil</h1>
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="font-medium text-zinc-500 dark:text-zinc-400">Pseudo :</span> {user.username}</p>
          <p><span className="font-medium text-zinc-500 dark:text-zinc-400">Email :</span> {user.email}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold tracking-tight">{mode === 'login' ? 'Connexion' : 'Inscription'}</h1>
      <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm flex-col gap-3">
        {mode === 'register' && (
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Pseudo</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required={mode === 'register'} className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Mot de passe</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }} className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
            {mode === 'login' ? 'Créer un compte' : 'Déjà un compte'}
          </button>
        </div>
      </form>
    </section>
  )
}

