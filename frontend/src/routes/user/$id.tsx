import { createFileRoute } from '@tanstack/react-router'
import { UserPublicProfilePage } from '../../components/pages/UserPublicProfilePage'

export const Route = createFileRoute('/user/$id')({
  component: UserPublicProfilePage,
})
