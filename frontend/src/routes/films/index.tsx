import { createFileRoute } from '@tanstack/react-router'
// Update the import path as the original module could not be found
import { FilmsIndexPage } from '@/components/pages/FilmsIndexPage'

export const Route = createFileRoute('/films/')({
  component: FilmsIndexPage,
})
