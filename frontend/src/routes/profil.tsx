import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api, getApiBase, type PublicUser } from '../lib/api'
import { AVATAR_PRESETS, avatarIdToSrc } from '../lib/avatars'

export const Route = createFileRoute('/profil')({
  component: ProfilPage,
})

type ProfileTab = 'home' | 'customize' | 'security' | 'friends'

function ProfilPage() {
  const { user, loading, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [tab, setTab] = useState<ProfileTab>('home')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[0].id)
  const [friends, setFriends] = useState<
    { id: number; username: string; email: string; avatarUrl?: string | null }[]
  >([])
  const [pendingReceived, setPendingReceived] = useState<{ id: number; username: string; userId: number }[]>(
    []
  )
  const [pendingSent, setPendingSent] = useState<{ id: number; username: string; userId: number }[]>([])
  const [friendSearchInput, setFriendSearchInput] = useState('')
  const [friendSearchResults, setFriendSearchResults] = useState<
    { id: number; username: string; avatarUrl?: string | null }[]
  >([])
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState<string | null>(null)
  const [publicData, setPublicData] = useState<PublicUser | null>(null)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securityOk, setSecurityOk] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const randomAvatar = () => AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, username, selectedAvatar)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const refreshSocial = async () => {
    if (!user) return
    setSocialLoading(true)
    try {
      const data = await api.friends.list()
      setFriends(data.friends)
      setPendingReceived(data.pendingReceived)
      setPendingSent(data.pendingSent)
      setSocialError(null)
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSocialLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    setSelectedAvatar(user.avatarUrl ?? AVATAR_PRESETS[0].id)
    setUsername(user.username)
    refreshSocial()
    api.users
      .getPublic(user.id)
      .then(setPublicData)
      .catch(() => setPublicData(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (user) return
    if (mode === 'register') {
      setSelectedAvatar(randomAvatar())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.id])

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement…</p>
      </section>
    )
  }

  if (user) {
    const saveProfile = async () => {
      setSubmitting(true)
      setError(null)
      try {
        const updated = await api.users.updateMe({ username: username.trim(), avatarUrl: selectedAvatar })
        setUsername(updated.user.username)
        setPublicData((prev) =>
          prev
            ? { ...prev, username: updated.user.username, avatarUrl: updated.user.avatarUrl ?? null }
            : prev
        )
        setTab('home')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      } finally {
        setSubmitting(false)
      }
    }

    const sendRequest = async (friendId: number) => {
      if (!friendId) {
        setSocialError('Utilisateur invalide')
        return
      }
      try {
        await api.friends.request(friendId)
        setFriendSearchInput('')
        setFriendSearchResults([])
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const acceptRequest = async (friendId: number) => {
      try {
        await api.friends.accept(friendId)
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const refuseRequest = async (friendId: number) => {
      try {
        await api.friends.refuse(friendId)
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const cancelRequest = async (friendId: number) => {
      try {
        await api.friends.cancel(friendId)
        await refreshSocial()
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const searchUsers = async () => {
      if (friendSearchInput.trim().length < 2) {
        setFriendSearchResults([])
        return
      }
      try {
        const rows = await api.users.search(friendSearchInput.trim())
        setFriendSearchResults(rows)
      } catch (err) {
        setSocialError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    const friendIds = new Set(friends.map((f) => f.id))
    const pendingSentIds = new Set(pendingSent.map((p) => p.userId))
    const pendingReceivedIds = new Set(pendingReceived.map((p) => p.userId))

    const changePassword = async () => {
      setSecurityError(null)
      setSecurityOk(null)
      if (!currentPassword || !newPassword || !newPasswordConfirm) {
        setSecurityError('Tous les champs sont requis')
        return
      }
      if (newPassword !== newPasswordConfirm) {
        setSecurityError('La confirmation ne correspond pas')
        return
      }
      try {
        await api.users.changePassword({ currentPassword, newPassword })
        setSecurityOk('Mot de passe mis à jour')
        setCurrentPassword('')
        setNewPassword('')
        setNewPasswordConfirm('')
      } catch (err) {
        setSecurityError(err instanceof Error ? err.message : 'Erreur')
      }
    }

    return (
      <section className="space-y-6">
        {tab === 'home' && (
          <>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Mon profil</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Aperçu public de ton profil, avec actions rapides.
              </p>
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <img
                  src={avatarIdToSrc(publicData?.avatarUrl ?? user.avatarUrl)}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">Pseudo :</span>{' '}
                    {publicData?.username ?? user.username}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">Email :</span> {user.email}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">Amis :</span>{' '}
                    {publicData?.friendsCount ?? friends.length}
                  </p>
                  <a className="text-indigo-600 hover:underline dark:text-indigo-400" href={'/user/' + user.id}>
                    Voir la version publique
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setTab('customize')}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700/60"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Personnaliser</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Pseudo, avatar et identité visuelle.</p>
              </button>
              <button
                type="button"
                onClick={() => setTab('security')}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700/60"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Réglages sécurité</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Changer le mot de passe du compte.</p>
              </button>
              <button
                type="button"
                onClick={() => setTab('friends')}
                className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700/60"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gérer les amis</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Rechercher, accepter, refuser.</p>
              </button>
            </div>
          </>
        )}

        {tab === 'customize' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Personnalisation</h2>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Retour
              </button>
            </div>
            <div className="mt-3">
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Pseudo</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full max-w-sm rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <p className="mt-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">Choisis ton avatar</p>
            <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {AVATAR_PRESETS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`rounded-full p-1 ${
                    selectedAvatar === av.id
                      ? 'ring-2 ring-indigo-500'
                      : 'ring-1 ring-zinc-200 dark:ring-zinc-700'
                  }`}
                >
                  <img src={av.src} alt={av.label} className="h-12 w-12 rounded-full" />
                </button>
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={saveProfile}
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Retour au profil
              </button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sécurité</h2>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Retour
              </button>
            </div>
            <div className="grid max-w-sm gap-3">
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            {securityError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{securityError}</p>}
            {securityOk && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{securityOk}</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={changePassword}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Changer le mot de passe
              </button>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Retour au profil
              </button>
            </div>
          </div>
        )}

        {tab === 'friends' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Amis</h2>
              <button
                type="button"
                onClick={() => setTab('home')}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Retour
              </button>
            </div>
            <div className="mt-3 flex max-w-sm flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={friendSearchInput}
                onChange={(e) => setFriendSearchInput(e.target.value)}
                placeholder="Rechercher un pseudo"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={searchUsers}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Rechercher
              </button>
            </div>
          {friendSearchResults.length > 0 && (
            <div className="mt-3 max-w-md space-y-2">
              {friendSearchResults.map((candidate) => (
                <div key={candidate.id} className="flex flex-col gap-2 rounded-md border border-zinc-200 p-2 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <img
                      src={avatarIdToSrc(candidate.avatarUrl)}
                      alt={candidate.username}
                      className="h-7 w-7 rounded-full"
                    />
                    <a href={'/user/' + candidate.id} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                      {candidate.username}
                    </a>
                  </div>
                  {friendIds.has(candidate.id) ? (
                    <span className="rounded bg-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                      Déjà ami
                    </span>
                  ) : pendingSentIds.has(candidate.id) ? (
                    <span className="rounded bg-amber-200 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                      En attente
                    </span>
                  ) : pendingReceivedIds.has(candidate.id) ? (
                    <span className="rounded bg-sky-200 px-2 py-1 text-xs text-sky-800 dark:bg-sky-900/50 dark:text-sky-200">
                      T&apos;a ajouté
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendRequest(candidate.id)}
                      className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                    >
                      Ajouter
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {socialError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{socialError}</p>}

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Demandes reçues</p>
              <div className="mt-2 space-y-2">
                {pendingReceived.map((p) => (
                  <div key={p.userId} className="rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
                    <a href={'/user/' + p.userId} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                      {p.username}
                    </a>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => acceptRequest(p.userId)}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => refuseRequest(p.userId)}
                        className="rounded bg-zinc-600 px-2 py-1 text-xs text-white hover:bg-zinc-700"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
                {!pendingReceived.length && <p className="text-xs text-zinc-500">Aucune demande</p>}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Demandes envoyées</p>
              <div className="mt-2 space-y-2">
                {pendingSent.map((p) => (
                  <div key={p.userId} className="rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
                    <a href={'/user/' + p.userId} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                      {p.username}
                    </a>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => cancelRequest(p.userId)}
                        className="rounded bg-zinc-600 px-2 py-1 text-xs text-white hover:bg-zinc-700"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
                {!pendingSent.length && <p className="text-xs text-zinc-500">Aucune demande en attente</p>}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Mes amis</p>
              <div className="mt-2 space-y-2">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
                    <img src={avatarIdToSrc(f.avatarUrl)} alt={f.username} className="h-7 w-7 rounded-full" />
                    <a href={'/user/' + f.id} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                      {f.username}
                    </a>
                  </div>
                ))}
                {!friends.length && !socialLoading && <p className="text-xs text-zinc-500">Aucun ami pour le moment</p>}
              </div>
            </div>
          </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {mode === 'login' ? 'Connexion' : 'Inscription'}
      </h1>
      <div className="mt-4">
        <a
          href={`${getApiBase()}/auth/google/start`}
          className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Continuer avec Google
        </a>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm flex-col gap-3">
        {mode === 'register' && (
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
            >
              Pseudo
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={mode === 'register'}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
            <p className="mt-3 text-xs font-medium text-zinc-600 dark:text-zinc-300">Avatar (modifiable)</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {AVATAR_PRESETS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`rounded-full p-1 ${
                    selectedAvatar === av.id
                      ? 'ring-2 ring-indigo-500'
                      : 'ring-1 ring-zinc-200 dark:ring-zinc-700'
                  }`}
                >
                  <img src={av.src} alt={av.label} className="h-10 w-10 rounded-full" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            Mot de passe
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }} className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto">
            {mode === 'login' ? 'Créer un compte' : 'Déjà un compte'}
          </button>
        </div>
      </form>
    </section>
  )
}

