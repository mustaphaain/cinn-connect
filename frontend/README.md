# Frontend CinéConnect

Application **React 19** + **TypeScript** + **Vite 7**, avec **Tailwind CSS 4**, **TanStack Router** & **TanStack Query**, **Socket.io** pour le chat, **GSAP** pour quelques animations (ex. `PillNav`).

## Scripts

```bash
pnpm dev      # serveur de dev (HMR)
pnpm build    # build production → dist/
pnpm preview  # prévisualiser le build
pnpm lint     # ESLint
```

## Configuration

- **`frontend/.env`** (voir `.env.example`) :
  - `VITE_API_URL=http://localhost:3001` — URL du backend (cookies + CORS doivent matcher ; préférer `localhost` plutôt que `127.0.0.1`).

Les appels **OMDb** passent par le backend : pas de clé OMDb dans le frontend.

## Auth (JWT) via cookie HttpOnly

Le backend authentifie avec un **JWT stocké dans un cookie `HttpOnly`**.

- Le frontend **ne stocke pas** de token (pas de `localStorage`).
- Les appels API doivent envoyer les cookies (`credentials`).

## Connexion Google

- Sur `/profil`, bouton **Continuer avec Google** (redirige vers `GET /auth/google/start`).
- Si c’est la **première connexion Google**, l’app redirige vers `/complete-username` pour choisir un pseudo, puis appelle `POST /auth/google/complete`.

## Profil et social

- `/profil` :
  - personnalisation du compte (pseudo + avatar preset)
  - gestion des amis (recherche par pseudo, demandes reçues/envoyées, acceptation/refus, annulation)
- `/user/:id` :
  - profil public d’un utilisateur (avatar, pseudo, nombre d’amis, derniers avis)

## Discussion
- Affichage des avatars dans les messages.
- Canal public + canaux privés entre amis dans `/discussion`.
- Refonte visuelle de `/discussion` au style glass/HUD (même D.A. que `/profil`).

## Notes films (étoiles)
- Sur la page `Film` (`/film/:id`), tu peux noter un film avec **5 étoiles** (affichage possible en **demi-étoile**).
- Le backend stocke la note **1 à 10** ; l’UI la convertit automatiquement en **1 à 5**.
- Refonte visuelle de `/film/:id` dans la même D.A. que `/profil` (sans section stats).

## Films / catalogue

- **`/films`** : bannière hero, recherche, filtres par catégorie (comportement type onglets), sections « Nouveautés », « Sorties récentes », carrousels horizontaux par genre.
- La zone hero se **réduit / disparaît** quand le champ recherche est focalisé, pour gagner de la place.
- **`/films/$categorie`** : liste par catégorie avec pagination robuste face aux réponses OMDb (`useQueries` + chargement de pages manuel).

### Mode clair (lisibilité)

- Titres de section et liens « Voir tout » utilisent **`text-zinc-900`** (ou équivalent) en mode clair et **`dark:text-zinc-50`** / **`dark:text-indigo-300`** en sombre, pour éviter du texte blanc sur fond clair.

## Navigation & thème

- **Desktop** : `Navbar` avec `PillNav`, notifications (demandes d’amis), lien réglages, **bascule thème** (clair / sombre).
- **Mobile** (`md:hidden` sur la navbar) : barre fixe **`BottomNav`** (Accueil, Films, Discu, Profil). Le thème est accessible depuis **`/reglages`** (bouton soleil/lune en haut de page + bloc « Apparence → Thème »).
- Thème géré par **`ThemeProvider`** / **`useTheme`** (`src/contexts/`) ; classe **`dark`** sur la racine HTML selon le choix utilisateur ou `prefers-color-scheme`.

## Page d’accueil

- Section **« Par où commencer ? »** : liens vers les catégories ; libellés en **texte uni** (même style que les autres boutons de la section).

## Autres routes utiles

- `/reglages` — Paramètres (apparence, notifications, raccourcis profil/sécurité/amis, déconnexion).
- `/complete-username` — Première connexion Google (choix du pseudo).

## Problèmes rencontrés et fixes (frontend)

### `Rendered more hooks than during the previous render`
- **Cause** : hooks exécutés dans des branches conditionnelles.
- **Fix** : réorganisation des composants pour garder un ordre de hooks constant.

### Notifications cachées derrière d’autres éléments
- **Cause** : problème de z-index/stacking context.
- **Fix** : rendu du panneau notifications dans un portal (`createPortal`).

### Liens `/profil` cassés après `validateSearch`
- **Cause** : le `search` devient requis par le typage de route.
- **Fix** : ajout explicite de `search` sur les `Link` vers `/profil`.

### Crash pagination films (`undefined.length`)
- **Cause** : réponses OMDb irrégulières + logique de pagination fragile.
- **Fix** :
  - garde défensive dans la pagination
  - normalisation des réponses OMDb “fin de pages”
  - remplacement `useInfiniteQuery` par `useQueries` sur la vue catégorie.

### Chargement images trop lent
- **Cause** : posters forcés en très haute qualité partout.
- **Fix** : qualité d’image adaptative selon contexte (`thumb` / `card` / `gallery` / `detail`) dans `src/lib/poster.ts`.

### Configuration

- `frontend/.env` :
  - `VITE_API_URL=http://localhost:3001`

### Endpoints utiles

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /users/me`

## Dépannage (cookies / auth)

### `GET /users/me` → `401 (Unauthorized)`

- **Pas connecté** : normal.
- **Connecté mais 401** : vérifie que tu utilises **`localhost` partout** (pas `127.0.0.1`), sinon le cookie peut ne pas être envoyé.

Recommandé :
- `frontend/.env` : `VITE_API_URL=http://localhost:3001`
- URL du front : `http://localhost:5173`

## Documentation complémentaire

- Vue d’ensemble monorepo et journal des évolutions : [`../README.md`](../README.md)
- API, base de données, OMDb, déploiement : [`../backend/README.md`](../backend/README.md)
