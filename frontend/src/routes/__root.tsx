import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { NotFoundPage, RootLayout } from '../components/templates/RootLayout'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
