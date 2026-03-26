# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

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

## Films / Catalogue (mise à jour)

- Refonte de `/films` :
  - sections type streaming
  - tri orienté “sorties récentes”
  - filtres catégories multi-sélection
  - carrousel OGL en haut de page pour les nouveautés
- Animation du carrousel :
  - glisse vers le haut et disparition fluide quand l’input recherche prend le focus
  - retour fluide au blur
- Route `/films/$categorie` stabilisée avec pagination manuelle.

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

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
