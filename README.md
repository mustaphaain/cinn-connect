# CinéConnect

Monorepo du projet **CinéConnect** (HETIC Web2) : application cinéphile (catalogue, avis, amis, discussion temps réel).

## Structure du dépôt

| Dossier | Rôle |
|--------|------|
| `frontend/` | SPA React (Vite, TanStack Router/Query, Tailwind, Socket.io client) |
| `backend/` | API Express, Drizzle/PostgreSQL, JWT en cookie HttpOnly, Socket.io, Swagger |
| `shared/` | Code partagé (si utilisé par le monorepo) |
| Racine | `pnpm-workspaces`, scripts `docker:up` / `dev` |

## Démarrage (développement)

1. **Dépendances** (à la racine `cinn-connect`) :

```bash
pnpm install
```

2. **Base PostgreSQL + migrations** (obligatoire pour auth et données) : voir le détail dans [`backend/README.md`](backend/README.md) — en résumé :

```bash
pnpm docker:up
node backend/scripts/init-db.js
pnpm -C backend db:migrate
```

3. **Variables d’environnement** : copier `backend/.env.example` → `backend/.env` et `frontend/.env.example` → `frontend/.env`. Pour la recherche catalogue et les seeds films, renseigner **`OMDB_API_KEY`** côté backend (voir `.env.example`).

4. **Lancer le frontend** (port 5173 par défaut) :

```bash
pnpm dev
```

5. **Lancer le backend** (port 3001) :

```bash
pnpm -C backend dev
```

Ou : `pnpm dev:backend` depuis la racine.

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

## OMDb (catalogue / recherche)

Les appels à l’API **OMDb** sont faits **uniquement par le backend** (la clé ne doit pas être exposée au navigateur). Configuration : `OMDB_API_KEY` dans `backend/.env`. Sans clé, certaines fonctionnalités (recherche, enrichissement) affichent un message côté UI.

## Déploiement (Fly.io — backend)

Le dossier `backend/` contient un **`Dockerfile`** et un **`fly.toml`** (ex. app `cineconnect-api`, région `cdg`). Déploiement typique :

- Installer [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) (`flyctl`).
- Se placer dans `backend/`, configurer les **secrets** Fly avec les mêmes variables que la prod (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `OMDB_API_KEY`, OAuth Google si besoin, etc.).
- Lancer `flyctl deploy` (compte Fly vérifié si demandé).

Les URLs et secrets de prod doivent correspondre au frontend déployé (`FRONTEND_ORIGIN`, CORS, cookies).

## Branches Git (rappel)

Selon l’équipe, le flux peut être **`main`** (développement) et **`production`** (déploiement). Les fichiers sensibles (`.env`) ne sont pas versionnés ; utiliser `.env.example` comme modèle.

## Reste à faire (optionnel)

- Option UX : fermer le menu mobile quand on clique en dehors (pas encore implémenté).

## Journal des évolutions récentes

### Accessibilité / thème clair (récent)
- **Mode clair** : titres et liens de la page **`/films`** (« Sorties récentes », sections par catégorie) utilisent des couleurs lisibles sur fond clair (`text-zinc-900` + variantes `dark:`).
- **Accueil** : pastilles « Par où commencer ? » — texte uni (`text-zinc-800` / `dark:text-zinc-100`), sans dégradé arc-en-ciel, pour cohérence avec le reste de l’UI.
- **Navigation pills** (`PillNav`) : couleur de texte au survol en mode clair ajustée pour éviter blanc sur blanc.
- **Paramètres** (`/reglages`) : bouton **soleil / lune** dans l’en-tête (à côté de « Retour au profil ») pour basculer clair/sombre, en plus du bloc « Apparence → Thème ».

### UI/UX (profil, header, films, discussion)
- Refonte complète de `/profil` (style HUD/RPG, glass panels, progression XP, cartes et sections modernisées).
- Refonte de `/user/:id` dans le même style visuel, en lecture publique (sans actions privées), avec gestion d’état d’amitié.
- Refonte du `Navbar` :
  - avatar cliquable vers `/profil`
  - notifications (badge demandes d’amis)
  - bouton déconnexion retiré du header
  - bouton réglages vers une vraie page dédiée
- Création de `/reglages` (apparence, notifications, raccourcis, zone sensible/déconnexion).
- Refonte visuelle de `/film/:id` et `/discussion` pour aligner la D.A. avec `/profil` (sans bloc de stats).
- Page `/films` enrichie avec une **bannière hero**, barre recherche + filtres par catégorie, sections type plateforme de streaming (« Nouveautés », « Sorties récentes », carrousels par genre).

### Data films / seed
- Ajout d’un seed backend `backend/src/fake_rating/seed_films.ts` pour peupler la table `films` via OMDb avec pagination, anti-doublons, insertion par chunks et tolérance quota.
- Script package ajouté côté backend pour lancer ce seed plus facilement.

## Problèmes rencontrés et corrections

### 1) `Rendered more hooks than during the previous render`
- **Contexte** : sur `/profil` et `/user/:id`.
- **Cause** : hooks/valeurs calculées définis dans des branches conditionnelles.
- **Fix** : remontée des hooks et calculs au niveau top du composant pour garantir un ordre d’exécution stable.

### 2) Dropdown notifications invisible / derrière les autres éléments
- **Contexte** : menu notifications du header non visible ou caché.
- **Cause** : stacking context / z-index.
- **Fix** : rendu du panel via `createPortal` + refs pour positionnement/fermeture.

### 3) Erreurs TypeScript sur routes TanStack (`/reglages`)
- **Contexte** : `to="/reglages"` incompatible au typage de route.
- **Cause** : route tree générée non synchronisée pendant l’ajout.
- **Fix** : contournement temporaire sur le typage du `Link`, en gardant le path runtime correct.

### 4) Erreur `search` manquant sur les liens `/profil`
- **Contexte** : après ajout de `validateSearch` sur la route profil.
- **Cause** : liens vers `/profil` sans objet `search`.
- **Fix** : ajout explicite de `search={{ tab: undefined }}` (ou équivalent) sur les liens concernés.

### 5) Crash films `Cannot read properties of undefined (reading 'length')`
- **Contexte** : clic “Voir tout” sur `/films/$categorie`, bug récurrent nécessitant refresh.
- **Cause** : pagination OMDb instable + hypothèses trop optimistes dans `useInfiniteQuery/getNextPageParam`.
- **Fix final** :
  - durcissement de `searchMovies` (OMDb `Response=False` sur pages avancées traité comme fin de pagination)
  - migration de `/films/$categorie` vers `useQueries` + pagination manuelle (`pagesToLoad`)
  - gardes défensives supplémentaires sur `/films`.

### 6) Lenteurs fortes de chargement images
- **Contexte** : posters très longs à charger.
- **Cause** : forcing global en haute définition.
- **Fix** : stratégie de qualité adaptive (`thumb`, `card`, `gallery`, `detail`) appliquée selon le contexte d’affichage.

## Notes techniques utiles
- Les affiches invalides (`N/A`, liens cassés) sont filtrées côté UI pour éviter des cartes vides.
- Le carrousel des sorties récentes se masque/animé lors du focus sur la recherche pour améliorer la lisibilité.
- La page catégorie films utilise désormais une pagination explicite, plus robuste sur API imprévisible.