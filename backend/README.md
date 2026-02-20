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

## Dépannage : "Failed to fetch" ou "Impossible de joindre le serveur"

Ça veut dire que le **frontend ne peut pas contacter le backend**. À vérifier :

1. **Le backend est bien lancé** dans un terminal : `pnpm -C backend dev`. Tu dois voir `Serveur sur http://localhost:3001`.
2. **L’URL dans le frontend** : le fichier `frontend/.env` doit contenir `VITE_API_URL=http://localhost:3001` (sans faute, bon port). Après modification de `.env`, redémarrer le frontend (`pnpm dev`).
3. **Même machine** : front et back doivent tourner sur le même PC. Si le front est ouvert sur un autre appareil, `localhost` ne pointera pas vers ton PC ; dans ce cas mets l’IP de ta machine (ex. `VITE_API_URL=http://192.168.1.10:3001`) et ouvre le port 3001 au besoin.
