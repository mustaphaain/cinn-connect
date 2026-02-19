import { Navbar } from './components/Navbar'

export default function App() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Navbar />
      <div className="bg-grid dark:bg-none">
        <main className="mx-auto max-w-6xl px-4 py-6 space-y-8">
          <HeroSection />
          <HighlightsSection />
          <SectionsGrid />
        </main>
      </div>
    </div>
  )
}

function HeroSection() {
  return (
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
        Cette version est un prototype front pour présenter ton idée de plateforme cinéma
        collaborative : interface principale, navigation et sections clés.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="inline-flex items-center rounded-md bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-black/5 hover:from-indigo-500 hover:to-fuchsia-500 dark:ring-white/10">
          Explorer les films
        </button>
        <button className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
          Voir la discussion
        </button>
      </div>
    </section>
  )
}

function HighlightsSection() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Bibliothèque de films</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Présente une sélection de films avec affiches, année et catégorie.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Profils et avis</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Imagine comment les utilisateurs pourront noter et commenter les films.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm font-semibold">Discussion en direct</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Une zone de chat temps réel pourra être ajoutée plus tard côté backend.
        </p>
      </div>
    </section>
  )
}

function SectionsGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Section Films</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Tu peux décrire ici comment seront organisées les listes de films plus tard (catégories,
          filtres, notes...).
        </p>
      </div>
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Section Profil</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Un espace pour afficher les infos de l’utilisateur, ses films favoris et ses avis.
        </p>
      </div>
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Section Discussion</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Une future zone de chat pour échanger en temps réel autour des films.
        </p>
      </div>
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Évolution future</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Plus tard, tu pourras ajouter un backend (JWT, base de données, chat temps réel) quand tu
          seras prêt.
        </p>
      </div>
    </section>
  )
}
