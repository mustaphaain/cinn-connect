import 'dotenv/config'

async function run() {
  // 1) Pré-remplit `films` avec les résultats OMDb (page 1 des catégories)
  const { seedOmdbFilms } = await import('./seed_omdb_films.js')
  await seedOmdbFilms()
  // 2) Note tous les films de la table `films` via les bots (idempotent)
  const { seedFakeRatings } = await import('./seed.js')
  await seedFakeRatings()
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[fake_rating] Erreur:', err)
    process.exit(1)
  })

