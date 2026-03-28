import 'dotenv/config'

async function run() {
  // 1) Pré-remplit `films` + genres (compatible quota, idempotent)
  const { seedFilms } = await import('./seed_films.js')
  await seedFilms()
  // 2) Note tous les films de la table `films` via les bots (idempotent)
  const { seedFakeRatings } = await import('./seed.js')
  await seedFakeRatings()
  // 3) (Optionnel) seed amis de démo
  if (process.env.SEED_FRIENDS === '1') {
    const { seedFriendsMatheo91 } = await import('./seed_friends_matheo91.js')
    await seedFriendsMatheo91()
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[fake_rating] Erreur:', err)
    process.exit(1)
  })

