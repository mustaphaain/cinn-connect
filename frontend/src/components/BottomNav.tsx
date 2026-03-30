import { Link, useRouterState } from '@tanstack/react-router'
import { Film, Home, MessageSquareText, User } from 'lucide-react'

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isHome = pathname === '/'
  const isFilms = pathname === '/films' || pathname === '/films/' || pathname.startsWith('/films/') || pathname.startsWith('/film/')
  const isDiscussion = pathname === '/discussion'
  const isProfil = pathname === '/profil' || pathname.startsWith('/user/')

  const items = [
    { key: 'home', label: 'Accueil', to: '/', active: isHome, icon: <Home className="h-5 w-5" /> },
    { key: 'films', label: 'Films', to: '/films', active: isFilms, icon: <Film className="h-5 w-5" /> },
    {
      key: 'discussion',
      label: 'Discu',
      to: '/discussion',
      active: isDiscussion,
      icon: <MessageSquareText className="h-5 w-5" />,
    },
    { key: 'profil', label: 'Profil', to: '/profil', active: isProfil, icon: <User className="h-5 w-5" /> },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <nav className="mx-auto w-full max-w-md px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.key}
              to={item.to as any}
              aria-current={item.active ? 'page' : undefined}
              className={cx(
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 transition',
                'min-h-[44px] select-none',
                item.active
                  ? 'bg-gradient-to-r from-indigo-600/15 to-fuchsia-600/15 text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
              )}
            >
              <span
                className={cx(
                  'transition',
                  item.active ? 'text-indigo-600 dark:text-fuchsia-300' : 'text-zinc-500 dark:text-zinc-400'
                )}
              >
                {item.icon}
              </span>
              <span className={cx('text-[11px] font-semibold leading-none', item.active ? 'opacity-100' : 'opacity-80')}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

