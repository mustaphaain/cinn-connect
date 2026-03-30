import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from '../Navbar'
import { BottomNav } from '../BottomNav'
import DarkVeil from '../DarkVeil'
import { useTheme } from '../../contexts/useTheme'

export function RootLayout() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showDarkVeil = pathname === '/'

  return (
    <div
      className={`relative isolate flex min-h-dvh flex-col overflow-x-hidden md:overflow-x-visible text-zinc-900 dark:text-zinc-50 ${
        showDarkVeil ? 'bg-transparent' : 'bg-zinc-50 dark:bg-zinc-950'
      }`}
    >
      {showDarkVeil ? (
        <div className="pointer-events-none fixed inset-0 z-0">
          <DarkVeil
            hueShift={isDark ? 0 : 200}
            noiseIntensity={isDark ? 0.07 : 0.04}
            scanlineIntensity={isDark ? 0.3 : 0.2}
            speed={0.4}
            scanlineFrequency={0}
            warpAmount={isDark ? 0.15 : 0.08}
            resolutionScale={1.25}
          />
          <div className={isDark ? 'absolute inset-0 bg-black/35' : 'absolute inset-0 bg-white/55'} />
        </div>
      ) : null}

      <div className="relative z-20 hidden md:block">
        <Navbar />
      </div>
      <main className="relative z-20 min-h-0 mx-auto w-full max-w-md flex flex-1 flex-col px-4 pt-4 pb-28 md:max-w-6xl md:pt-8 md:pb-8">
        <Outlet />
      </main>
      <footer className="relative z-20 hidden border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400 md:block">
        CinéConnect · plateforme cinéphile · HETIC Web2
      </footer>
      <BottomNav />
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <p className="text-6xl font-semibold tabular-nums text-zinc-300 dark:text-zinc-700">404</p>
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Page introuvable</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Cette adresse ne correspond à aucune route. Vérifie l’URL ou reviens à l’accueil.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-black/5 hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
      >
        Retour à l’accueil
      </Link>
    </div>
  )
}
