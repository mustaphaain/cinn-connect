import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profil')({
  component: ProfilPage,
})

function ProfilPage() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold tracking-tight">Profil</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Cette page sera reliée plus tard au backend (JWT, amis, reviews).
      </p>
    </section>
  )
}

