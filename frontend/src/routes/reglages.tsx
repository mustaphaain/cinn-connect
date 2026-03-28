import { createFileRoute } from '@tanstack/react-router'
import { ReglagesPage } from '../components/pages/ReglagesPage'

export const Route = createFileRoute('/reglages')({
  component: ReglagesPage,
})
