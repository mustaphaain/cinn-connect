# Backend CinéConnect

API Node.js (Express, Drizzle, PostgreSQL, JWT, Socket.io, Swagger).

## Prérequis

- Node 20+
- pnpm
- Docker (pour PostgreSQL)

## Démarrage

1. **Base de données** (à la racine du monorepo) :
   ```bash
   pnpm docker:up
   node backend/scripts/init-db.js
   pnpm -C backend db:migrate
   ```

2. **Variables d'environnement** : copier `backend/.env.example` vers `backend/.env` et renseigner `DATABASE_URL`, `JWT_SECRET`, `PORT` (optionnel, défaut 3001).

3. **Lancer le serveur** :
   ```bash
   pnpm -C backend dev
   ```

- API : http://localhost:3001  
- Swagger : http://localhost:3001/api-docs  
- Health : http://localhost:3001/health  

## Endpoints principaux

- `POST /auth/register` — Inscription (email, password, username)
- `POST /auth/login` — Connexion (email, password) → token JWT
- `GET /users/me` — Profil (Authorization: Bearer &lt;token&gt;)
- `GET /messages` — Liste des messages (auth)
- Socket.io : événement `message` (contenu texte), auth via `handshake.auth.token`

## Scripts

- `pnpm dev` — serveur en watch
- `pnpm test:db` — test connexion DB
- `pnpm init:db` — crée la base `cineconnect` si besoin
- `pnpm db:generate` — génère les migrations Drizzle
- `pnpm db:migrate` — applique les migrations
