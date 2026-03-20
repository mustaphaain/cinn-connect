import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Navbar } from '../components/Navbar'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        CinéConnect · plateforme cinéphile · HETIC Web2
      </footer>
    </div>
  )
}

function NotFoundPage() {
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

