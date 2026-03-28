import { createFileRoute } from '@tanstack/react-router'
import { FilmsByCategoryPage } from '../../components/pages/FilmsByCategoryPage'

export const Route = createFileRoute('/films/$categorie')({
  component: FilmsByCategoryPage,
})

