import { Link } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'

const linkBase =
  'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition hover:bg-zinc-100/80 hover:text-zinc-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50'

const linkActive =
  'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white hover:from-indigo-600 hover:to-fuchsia-600 dark:from-indigo-500 dark:to-fuchsia-500'

export function Navbar() {
  const { user, logout, loading } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="group inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-sm font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            C
          </span>
          <span className="text-base font-semibold tracking-tight">
            Ciné<span className="text-zinc-500 dark:text-zinc-300">Connect</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={linkBase}
            activeProps={{ className: linkBase + ' ' + linkActive }}
          >
            Accueil
          </Link>
          <Link
            to="/films"
            className={linkBase}
            activeProps={{ className: linkBase + ' ' + linkActive }}
          >
            Films
          </Link>
          <Link
            to="/discussion"
            className={linkBase}
            activeProps={{ className: linkBase + ' ' + linkActive }}
          >
            Discussion
          </Link>
          <Link
            to="/profil"
            className={linkBase}
            activeProps={{ className: linkBase + ' ' + linkActive }}
          >
            Profil
          </Link>
          {!loading && (
            <span className="ml-2 flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">{user.username}</span>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                  >
                    Déconnexion
                  </button>
                </>
              ) : null}
            </span>
          )}
        </nav>
      </div>
    </header>
  )
}

