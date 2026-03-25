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

## Notes films (étoiles)
- Sur la page `Film` (`/film/:id`), tu peux noter un film avec **5 étoiles** (affichage possible en **demi-étoile**).
- Le backend stocke la note **1 à 10** ; l’UI la convertit automatiquement en **1 à 5**.

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
