import { createFileRoute } from '@tanstack/react-router'
import { DiscussionPage } from '../components/pages/DiscussionPage'

export const Route = createFileRoute('/discussion')({
  component: DiscussionPage,
})
