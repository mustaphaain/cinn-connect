import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-500/20 blur-2xl" />

        <h1 className="text-3xl font-semibold tracking-tight">
          Découvre des films,{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            note
          </span>{' '}
          et discute avec tes amis.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Prototype front de CinéConnect avec routing typé TanStack et recherche de films via
          l’API OMDb.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/films"
            className="inline-flex items-center rounded-md bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-black/5 hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
          >
            Explorer les films
          </Link>
          <Link
            to="/discussion"
            className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Voir la discussion
          </Link>
        </div>
      </section>
    </div>
  )
}

