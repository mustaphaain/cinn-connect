# Fake rating (bots)

Ce dossier sert à remplir la table `reviews` avec des notes fictives afin d'avoir une moyenne “réaliste” sur la page film.

## Objectif (important)
- Les notes **ne doivent pas changer** à chaque relance.
- On obtient ça en rendant le seed **idempotent** : le script n'insère que les avis qui n'existent pas encore.
- Les notes sont calculées de façon **déterministe** à partir de `imdbId` + index du bot.

## Lancer le seed
Depuis le dossier `backend` :

`pnpm tsx src/fake_rating/seed.ts`

## Seed films OMDb étendu

Un second script existe pour remplir la table `films` avec un catalogue plus large :

- `src/fake_rating/seed_films.ts`
- commande : `pnpm run seed:films`

### Ce que fait `seed_films.ts`
- interroge OMDb avec plusieurs termes de recherche
- pagine les résultats (plusieurs pages par terme)
- dédoublonne les films par `imdbID`
- insère en base sans écraser les entrées existantes (`onConflictDoNothing`)

### Problèmes rencontrés et résolution

- **Catalogue incomplet** avec l’ancien seed (`seed_omdb_films.ts`) :
  - cause : script trop limité (peu de requêtes, faible pagination)
  - correction : nouveau script `seed_films.ts` multi-queries/multi-pages.

## Effet
- 1 bot = 1 avis par film (si l'avis n'existe pas déjà).
- Si de nouveaux films sont ajoutés ensuite, le script peut être relancé : il complètera uniquement les avis manquants.

