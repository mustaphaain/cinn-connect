import { createFileRoute } from '@tanstack/react-router'
import { CompleteUsernamePage } from '../components/pages/CompleteUsernamePage'

export const Route = createFileRoute('/complete-username')({
  component: CompleteUsernamePage,
})

