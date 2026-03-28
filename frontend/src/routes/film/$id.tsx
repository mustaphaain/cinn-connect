import { createFileRoute } from '@tanstack/react-router'
import { FilmDetailsPage } from '../../components/pages/FilmDetailsPage'

export const Route = createFileRoute('/film/$id')({
  component: FilmDetailsPage,
})

