import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/discussion')({
  component: DiscussionPage,
})

function DiscussionPage() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold tracking-tight">Discussion</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Placeholder : le chat temps réel sera branché plus tard via Socket.io.
      </p>
    </section>
  )
}

