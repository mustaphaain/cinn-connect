import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const categories = [
  { slug: 'action' as const, label: 'Action', accent: 'from-amber-500 to-rose-500' },
  { slug: 'drama' as const, label: 'Drame', accent: 'from-indigo-500 to-violet-500' },
  { slug: 'science-fiction' as const, label: 'S-F', accent: 'from-cyan-500 to-blue-600' },
  { slug: 'comedy' as const, label: 'Comédie', accent: 'from-lime-500 to-emerald-600' },
]

const features = [
  {
    title: 'Explorer & filtrer',
    text: 'Parcours OMDb par mot-clé ou catégories, affiches et fiches détaillées.',
    to: '/films' as const,
    cta: 'Voir les films',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375v-1.5m3.75 0v-1.5c0-.621.504-1.125 1.125-1.125m0 3.75h-9" />
      </svg>
    ),
  },
  {
    title: 'Discussion live',
    text: 'Échange en temps réel avec Socket.io une fois connecté.',
    to: '/discussion' as const,
    cta: 'Ouvrir le chat',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    title: 'Profil & avis',
    text: 'Compte, amis et notes — données ton propre rythme au fil du semestre.',
    to: '/profil' as const,
    cta: 'Mon profil',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

function HomePage() {
  return (
    <div className="space-y-6 pb-4 sm:space-y-8 sm:pb-6">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-500/20 blur-2xl" />

        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Bienvenue sur CinéConnect
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Découvre des films,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-fuchsia-400">
              note
            </span>{' '}
            et discute avec tes amis.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Bibliothèque collaborative : explore les affiches et fiches via OMDb, connecte-toi pour
            noter, ajouter des amis et discuter en temps réel.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              to="/films"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-black/5 transition hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10"
            >
              Explorer les films
            </Link>
            <Link
              to="/discussion"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Voir la discussion
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-indigo-900/50"
          >
            <div className="mb-3 inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              {f.icon}
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.text}</p>
            <Link
              to={f.to}
              className="mt-4 inline-flex text-sm font-medium text-indigo-600 group-hover:underline dark:text-indigo-400"
            >
              {f.cta} →
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-indigo-50/40 p-4 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/30 sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Par où commencer ?</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Saute dans une catégorie ou ouvre la liste complète pour chercher par titre.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/films/$categorie"
              params={{ categorie: c.slug }}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100"
            >
              <span className={`bg-gradient-to-r ${c.accent} bg-clip-text text-transparent`}>{c.label}</span>
            </Link>
          ))}
          <Link
            to="/films"
            className="inline-flex items-center rounded-full border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
          >
            Toute la bibliothèque
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-900 px-4 py-8 text-center text-zinc-50 shadow-sm dark:border-zinc-700/80 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.35),transparent)]" />
        <div className="relative mx-auto max-w-lg space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Prêt·e à lancer une séance ?</h2>
          <p className="text-sm text-zinc-300">
            La grille des films t’attend — recherche un titre ou parcours les catégories.
          </p>
          <Link
            to="/films"
            className="inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100"
          >
            Accueil des films
          </Link>
        </div>
      </section>
    </div>
  )
}
