# Backend CinéConnect

API Node.js (Express, Drizzle, PostgreSQL, JWT, Socket.io, Swagger).

## Prérequis

- Node 20+
- pnpm
- **Docker Desktop** (ou Docker) installé et lancé

## Première fois (obligatoire pour créer un compte)

Sans ces étapes, **l’inscription et la connexion ne marcheront pas** (la base n’existe pas).

À la **racine du monorepo** (dossier `cinn-connect`) :

1. **Démarrer PostgreSQL** :
   ```bash
   pnpm docker:up
   ```
   (ou `docker compose up -d`)

2. **Créer la base `cineconnect`** (une seule fois) :
   ```bash
   node backend/scripts/init-db.js
   ```

3. **Créer les tables** (users, films, messages, etc.) :
   ```bash
   pnpm -C backend db:migrate
   ```

4. **Vérifier** que le backend a bien un fichier `backend/.env` (avec au minimum `DATABASE_URL`, voir `.env.example`). Si vous avez cloné le repo avec les `.env` déjà présents, rien à faire.

5. **Lancer le backend** :
   ```bash
   pnpm -C backend dev
   ```

Tu dois voir : `Serveur sur http://localhost:3001`. Ensuite le front peut appeler l’API (inscription, connexion, etc.).

- API : http://localhost:3001  
- Swagger : http://localhost:3001/api-docs  
- Health : http://localhost:3001/health  

## Endpoints principaux

- `POST /auth/register` — Inscription (email, password, username)
- `POST /auth/login` — Connexion (email, password) → pose un cookie `HttpOnly` contenant un JWT
- `POST /auth/logout` — Déconnexion → supprime le cookie d’auth
- `GET /users/me` — Profil (auth par cookie `HttpOnly`, pas de `Authorization: Bearer ...`)
- `GET /messages` — Liste des messages (auth)
- `GET /messages/private/:friendId` — Historique du canal privé avec un ami
- Socket.io : événement `message` (contenu texte), auth via cookie (JWT en cookie `HttpOnly`)
- Socket.io : événement `private:message` (canal privé entre amis)
- `GET /auth/google/start` — Début OAuth Google (redirect)
- `GET /auth/google/callback` — Retour OAuth Google (callback)
- `POST /auth/google/complete` — Finalisation première connexion Google (choix `username`)
- `PATCH /users/me` — Mettre à jour son profil (pseudo + avatar preset)
- `PATCH /users/me/password` — Changer son mot de passe (avec mot de passe actuel)
- `GET /users/:id` — Profil public d’un utilisateur (infos de base + nombre d’amis)
- `GET /friends` — Listes sociales (amis, demandes reçues, demandes envoyées)
- `POST /friends` — Envoyer une demande d’ami
- `PATCH /friends/:friendId/accept` — Accepter une demande reçue
- `DELETE /friends/:friendId/refuse` — Refuser une demande reçue
- `DELETE /friends/:friendId/cancel` — Annuler une demande envoyée
- `GET /reviews/user/:userId?limit=10` — Derniers avis publics d’un utilisateur
- `GET /reviews/film/:imdbId/summary` — Moyenne + nombre de votes pour un film (pour afficher la note)
- `GET /reviews/me/film/:imdbId` — Note actuelle de l’utilisateur pour un film
- `GET /users/search?username=...` — Recherche utilisateur (auth requise)

## Auth (JWT) — Cookie HttpOnly (pas de localStorage)

Le projet utilise toujours des **JWT** (`jsonwebtoken`), mais le token n’est **pas stocké dans le frontend** :

- Le backend **signe** un JWT à la connexion/inscription.
- Le backend le renvoie dans un **cookie `HttpOnly`** (non accessible en JavaScript).
- Le frontend envoie ensuite ce cookie automatiquement (HTTP + Socket.io) avec `credentials`.

### Variables d’environnement

- `FRONTEND_ORIGIN` (optionnel) : origin autorisée pour CORS en dev (défaut `http://localhost:5173`).
- `AUTH_COOKIE_NAME` (optionnel) : nom du cookie d’auth (défaut `cineconnect_auth`).
- `JWT_SECRET` : secret de signature du JWT (important en prod).

#### Google OAuth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (ex: `http://localhost:3001/auth/google/callback`)
- `FRONTEND_AUTH_REDIRECT` (ex: `http://localhost:5173/profil`)
- `FRONTEND_GOOGLE_COMPLETE_REDIRECT` (ex: `http://localhost:5173/complete-username`)

### Checklist Google Cloud (configuration minimale)

Dans **Google Cloud Console** > **API et services** :

1. **Écran d’autorisation OAuth** configuré (nom app + email support + email développeur).
2. **Identifiants** > **Créer un ID client OAuth** > type **Application Web**.
3. Dans le client OAuth, ajouter :
   - **Origines JavaScript autorisées** : `http://localhost:5173`
   - **URI de redirection autorisés** : `http://localhost:3001/auth/google/callback`
4. Copier l’ID client et le secret dans `backend/.env` :
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
5. Redémarrer le backend : `pnpm -C backend dev`

## Scripts

- `pnpm dev` — serveur en watch
- `pnpm test:db` — test connexion DB
- `pnpm init:db` — crée la base `cineconnect` si besoin
- `pnpm db:generate` — génère les migrations Drizzle
- `pnpm db:migrate` — applique les migrations
- Seeds démo (avis bots) :
  - `pnpm exec tsx src/fake_rating/seed_all.ts` : OMDb → `films`, puis bots → `reviews`
  - `pnpm exec tsx src/fake_rating/seed_friends_matheo91.ts` : ajoute des amis pour tester le chat privé

## Dépannage : "Failed to fetch" ou "Impossible de joindre le serveur"

Ça veut dire que le **frontend ne peut pas contacter le backend**. À vérifier :

1. **Le backend est bien lancé** dans un terminal : `pnpm -C backend dev`. Tu dois voir `Serveur sur http://localhost:3001`.
2. **L’URL dans le frontend** : le fichier `frontend/.env` doit contenir `VITE_API_URL=http://localhost:3001` (sans faute, bon port). Après modification de `.env`, redémarrer le frontend (`pnpm dev`).
3. **Même machine** : front et back doivent tourner sur le même PC. Si le front est ouvert sur un autre appareil, `localhost` ne pointera pas vers ton PC ; dans ce cas mets l’IP de ta machine (ex. `VITE_API_URL=http://192.168.1.10:3001`) et ouvre le port 3001 au besoin.

## Dépannage : problèmes rencontrés (Google / cookies / DB)

### `GET /auth/google/start` → `500 (Internal Server Error)`

**Cause** : Google OAuth non configuré (variables d’environnement manquantes).

**Solution** :
- Remplir dans `backend/.env` :
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - (et vérifier `GOOGLE_REDIRECT_URI`)
- **Redémarrer le backend** (les `.env` ne sont pas rechargés à chaud).

### `GET /auth/google/callback ...` → `{"error":"la colonne « google_id » n'existe pas"}`

**Cause** : la base existante n’a pas encore la colonne `google_id` (migrations pas appliquées).

**Solution** :
- Lancer :
  - `pnpm -C backend db:migrate`

### `GET /users/me` → `401 (Unauthorized)` alors que tu penses être connecté

**Cause fréquente** : cookies non envoyés à cause d’un mismatch `127.0.0.1` vs `localhost`.

**Solution** (recommandé) :
- Utiliser `localhost` partout :
  - `frontend/.env` : `VITE_API_URL=http://localhost:3001`
  - `backend/.env` : `FRONTEND_ORIGIN=http://localhost:5173`
- Redémarrer frontend + backend.

### Console : `Unchecked runtime.lastError ...` / `contentscript.bundle.js ...`

**Cause** : extension du navigateur (pas l’application).

**Solution** : ignorer, ou tester en navigation privée / désactiver l’extension.
