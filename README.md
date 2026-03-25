# CinéConnect

Monorepo du projet **CinéConnect** (HETIC Web2).

## Démarrage

1. Installer les dépendances :

```bash
pnpm install
```

2. Lancer le front :

```bash
pnpm dev
```

3. Lancer le back :
```bash
pnpm -C backend dev 
```

## Authentification (JWT)

Le projet utilise des **JWT**, mais le token est stocké côté backend dans un **cookie `HttpOnly`** (pas de `localStorage`).

- **Backend** : signe/valide le JWT et gère le cookie d’auth.
- **Frontend** : utilise `credentials` pour envoyer les cookies automatiquement.

## Connexion Google

- Le bouton **Continuer avec Google** est sur `/profil`.
- Flux :
  - `/auth/google/start` → redirect Google
  - `/auth/google/callback` → pose un cookie JWT si compte déjà lié
  - sinon redirige vers `/complete-username` pour forcer le choix du pseudo

## Profil social

- Refonte de `/profil` avec personnalisation :
  - choix d’avatar dans une galerie de 12 presets
  - mise à jour du pseudo
- Système d’amis :
  - envoi de demande, acceptation, refus
  - listes : amis, demandes reçues, demandes envoyées
- Profils publics :
  - route `/user/:id`
  - affichage des infos de base + nombre d’amis + derniers avis films

## Problèmes rencontrés (résumé)

- **500 sur `/auth/google/start`** : variables Google manquantes dans `backend/.env` (`GOOGLE_CLIENT_ID/SECRET`) + redémarrage du backend.
- **Erreur DB `google_id n'existe pas`** : migrations non appliquées → `pnpm -C backend db:migrate`.
- **401 sur `/users/me`** : souvent `127.0.0.1` vs `localhost` → utiliser `localhost` partout (cookies).

## Notes films (étoiles) + données de démo (bots)

### Notes utilisateur (interface)
- Sur la page `Film` (`/film/:id`), tu peux noter le film avec **5 étoiles** (avec affichage possible en **demi-étoile**).
- Le backend stocke une note **de 1 à 10**. L’UI convertit automatiquement en **1 à 5 étoiles**.

### Moyenne + nombre de votes (calcul)
- Le backend calcule une **moyenne sur 10** et un **nombre de votes** par film.
- L’UI affiche la moyenne convertie sur **/5**.

### Seeds “bots” pour avoir une vraie moyenne
Les scripts sont dans `backend/src/fake_rating/` :
- `seed_omdb_films.ts` : pré-remplit `films` avec des résultats OMDb (page 1 des catégories).
- `seed.ts` : insère des avis bots dans `reviews` de manière **idempotente** (les avis ne changent pas à chaque relance).
- `seed_all.ts` : enchaîne `seed_omdb_films` puis `seed`.
- `seed_friends_matheo91.ts` : ajoute des amis (bots) à `matheo__91` pour tester le chat privé.

Commandes (à lancer depuis `backend/`) :
- `pnpm exec tsx src/fake_rating/seed_all.ts`
- `pnpm exec tsx src/fake_rating/seed_friends_matheo91.ts`

## Header: navigation “PillNav” + mode clair/sombre
- Le composant `PillNav` est utilisé dans le `header` avec tes routes existantes (`/`, `/films`, `/discussion`, `/profil`).
- La navigation est cohérente avec le **mode clair/sombre** et le logo a été retiré du `PillNav` (reste le branding “CinéConnect” à gauche).

## Reste à faire (optionnel)
- Option UX : fermer le menu mobile quand on clique en dehors (pas encore implémenté).