# Fake rating (bots)

Ce dossier sert à remplir la table `reviews` avec des notes fictives afin d'avoir une moyenne “réaliste” sur la page film.

## Objectif (important)
- Les notes **ne doivent pas changer** à chaque relance.
- On obtient ça en rendant le seed **idempotent** : le script n'insère que les avis qui n'existent pas encore.
- Les notes sont calculées de façon **déterministe** à partir de `imdbId` + index du bot.

## Lancer le seed
Depuis le dossier `backend` :

`pnpm tsx src/fake_rating/seed.ts`

## Effet
- 1 bot = 1 avis par film (si l'avis n'existe pas déjà).
- Si de nouveaux films sont ajoutés ensuite, le script peut être relancé : il complètera uniquement les avis manquants.

