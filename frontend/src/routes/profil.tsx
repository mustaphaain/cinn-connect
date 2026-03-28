import { createFileRoute } from '@tanstack/react-router'
import { ProfilPage } from '../components/pages/ProfilPage'

export const Route = createFileRoute('/profil')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: ProfilPage,
})
