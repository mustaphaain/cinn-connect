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

## Journal des évolutions récentes

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
- Page `/films` enrichie avec un carrousel OGL des sorties récentes, filtrage catégorie multi-sélection, et sections style plateforme de streaming.

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