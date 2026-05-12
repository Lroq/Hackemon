# Hackemon

> Interface web inspirée d'un OS rétro pixel-art, avec système d'authentification complet et intégration d'un moteur de jeu externe.

---

## 📖 Table des matières

- [Présentation](#présentation)
- [Architecture du projet](#architecture-du-projet)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Déploiement Docker](#déploiement-docker)
- [API Endpoints](#api-endpoints)
- [Sécurité](#sécurité)
- [CI/CD](#cicd)
- [Liens](#liens)

---

## Présentation

Hackemon est une application web qui simule un système d'exploitation rétro dans le navigateur. L'interface, en pixel-art, propose un bureau avec des icônes cliquables ouvrant des fenêtres déplaçables (drag & drop). Elle intègre :

- Un système complet d'authentification (inscription, connexion, JWT, refresh token)
- Un terminal interactif
- Un accès à un moteur de jeu externe ([Hackengine](https://github.com/Lroq/Hackengine))
- Des liens vers les réseaux sociaux du projet (blog, Discord, Instagram, LinkedIn)
- Un système d'internationalisation (i18n) côté client
- Une corbeille, un gestionnaire de paramètres et un panneau de profil utilisateur

---

## Architecture du projet

```
Hackemon/
├── server/                          # Backend Node.js/Express
│   ├── server.js                    # Point d'entrée du serveur
│   ├── routes.js                    # Définition des routes
│   ├── log.js                       # Utilitaire de logging
│   ├── readfile.js                  # Lecture du fichier .env
│   ├── config/
│   │   ├── database.js              # Connexion MongoDB (Mongoose)
│   │   └── jwt.js                   # Configuration JWT
│   ├── controllers/
│   │   └── AuthController.js        # Logique d'authentification
│   ├── middleware/
│   │   ├── auth.js                  # Vérification JWT (requireAuth / optionalAuth)
│   │   ├── jwtAuth.js               # Middleware JWT bas niveau
│   │   └── validation.js            # Validation & sanitisation des entrées
│   ├── models/
│   │   └── User.js                  # Schéma Mongoose utilisateur
│   ├── js/
│   │   ├── login.js                 # Logique login
│   │   ├── register.js              # Logique inscription
│   │   └── tokenManager.js          # Gestion des access/refresh tokens
│   ├── utils/
│   │   └── userTokenManager.js      # Utilitaires tokens utilisateur
│   └── storage/
│       └── InMemoryStorage.js       # Stockage mémoire (fallback sans DB)
│
├── public/                          # Frontend statique
│   ├── templates/
│   │   ├── index.html               # Page principale (bureau OS)
│   │   ├── coming-soon.html         # Page "bientôt disponible"
│   │   ├── css/
│   │   │   ├── menu.css             # Styles du bureau et des fenêtres
│   │   │   ├── coming-soon.css      # Styles page coming soon
│   │   │   └── code.css             # Styles code/terminal
│   │   ├── font/
│   │   │   └── VT323.ttf            # Police pixel-art rétro
│   │   └── js/
│   │       ├── app.js               # Chargement modulaire de l'application
│   │       ├── main.js              # Bootstrap principal (legacy)
│   │       ├── i18n.js              # Internationalisation (FR/EN/...)
│   │       ├── osHomeScreen.js      # Gestion de l'écran d'accueil OS
│   │       ├── userProfile.js       # Affichage du profil utilisateur
│   │       ├── utils/
│   │       │   ├── ApiService.js    # Client HTTP (fetch wrappé, gestion JWT)
│   │       │   ├── EventUtils.js    # Helpers drag & drop, double-clic
│   │       │   └── HTMLBuilder.js   # Construction d'éléments DOM
│   │       ├── components/
│   │       │   ├── Window.js        # Fenêtre draggable (classe de base)
│   │       │   ├── Menu.js          # Menu principal
│   │       │   ├── Login.js         # Fenêtre de connexion
│   │       │   ├── Register.js      # Fenêtre d'inscription
│   │       │   ├── Terminal.js      # Terminal interactif
│   │       │   ├── Corbeille.js     # Corbeille
│   │       │   ├── LoadingBar.js    # Barre de chargement
│   │       │   └── Settings.js      # Fenêtre paramètres
│   │       └── modules/
│   │           └── AppManager.js    # Gestionnaire central de l'application
│   ├── assets/                      # Images, icônes, sons
│   │   ├── logo.png
│   │   ├── sounds/rickroll.mp3
│   │   └── ...
│   └── vault/
│       └── secrets/README.md        # Placeholder pour secrets (non commité)
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # Pipeline GitHub Actions (CI + déploiement SSH)
│
├── dockerfile.site                  # Image Docker pour le serveur Node.js
├── dockerfile.jeu                   # Image Docker pour Hackengine (jeu externe)
├── docker-compose.yml               # Orchestration des 3 services
├── package.json
└── .gitignore
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework HTTP | Express 5 |
| Base de données | MongoDB 6 via Mongoose 8 |
| Authentification | JWT (jsonwebtoken) + bcrypt |
| Sessions | express-session + connect-mongo |
| Frontend | HTML/CSS/JS vanilla (modules ES) |
| Police | VT323 (pixel-art rétro) |
| Alertes UI | SweetAlert2 (CDN) |
| Icônes | Font Awesome 6 (CDN) |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions + SSH distant |

---

## Prérequis

- **Node.js** ≥ 18
- **MongoDB** (local ou distant)
- **Docker & Docker Compose** (pour le déploiement conteneurisé)
- Un fichier `.env` à la racine du projet (voir [Configuration](#configuration))

---

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/<votre-org>/Hackemon.git
cd Hackemon

# Installer les dépendances
npm install
```

---

## Configuration

Créer un fichier `.env` à la racine du projet :

```env
# Port d'écoute du serveur (défaut : 3000)
PORT=3000

# URI MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/hackemon

# Clé secrète JWT
JWT_SECRET=votre_secret_jwt_ici

# Durée de validité du token JWT (défaut : 1h)
JWT_EXPIRES_IN=1h

# Environnement (development | production)
NODE_ENV=development
```

> ⚠️ Ne jamais commiter le fichier `.env`. Il est déjà listé dans `.gitignore`.

---

## Démarrage

### En développement (sans Docker)

```bash
npm run dev
# ou
node server/server.js
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Mode dégradé (sans MongoDB)

Si MongoDB n'est pas disponible au démarrage, le serveur continue de fonctionner avec un stockage en mémoire (les données sont perdues à chaque redémarrage). L'inscription et la connexion restent fonctionnelles mais les utilisateurs ne sont pas persistés.

---

## Déploiement Docker

Le projet embarque trois services Docker :

| Service | Conteneur | Port exposé | Description |
|---|---|---|---|
| `site` | `hackemon-app` | 3000 | Serveur Node.js/Express |
| `jeu` | `hackemon-jeu` | 3001 (→ 8080) | Moteur de jeu Hackengine |
| `mongo` | `hackemon-mongo` | 27017 | Base de données MongoDB |

### Lancer tous les services

```bash
docker compose up -d
```

### Arrêter les services

```bash
docker compose down
```

### Rebuild après modification du code

```bash
docker compose build site
docker compose up -d
```

Les données MongoDB sont persistées dans le volume nommé `mongo-data`.

---

## API Endpoints

### Authentification

| Méthode | Route | Auth requise | Description |
|---|---|---|---|
| `POST` | `/register` | Non | Inscription (username, email, password) |
| `POST` | `/login` | Non | Connexion, retourne access + refresh token |
| `POST` | `/logout` | Non | Déconnexion (suppression côté client) |
| `POST` | `/refresh-token` | Non | Renouvellement du JWT via refresh token |
| `GET` | `/profile` | ✅ JWT | Profil de l'utilisateur connecté |
| `GET` | `/session` | Optionnelle | Statut de la session courante |

### Utilitaires

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/` | Page principale (bureau OS) |
| `GET` | `/coming-soon` | Page "bientôt disponible" |
| `GET` | `/health` | Statut du serveur (uptime, timestamp) |

### Format des réponses

Toutes les réponses sont en JSON.

**Connexion réussie :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "<access_token>",
  "tokens": { "accessToken": "...", "refreshToken": "..." },
  "user": { "userId": "...", "username": "...", "email": "..." }
}
```

**Erreur :**
```json
{
  "error": "Description de l'erreur",
  "code": "ERROR_CODE"
}
```

### Validation des données d'inscription

- **username** : 3 à 20 caractères, lettres/chiffres/tirets/underscores uniquement
- **email** : format email standard
- **password** : minimum 12 caractères, doit contenir majuscules, minuscules, chiffres et caractères spéciaux

---

## Sécurité

- **Hachage des mots de passe** : bcrypt avec 12 rounds de sel
- **JWT** : access token court (1h) + refresh token pour renouvellement
- **Headers HTTP** : `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`
- **Validation serveur** : sanitisation et validation stricte de toutes les entrées via middleware dédié
- **Mode production** : les détails d'erreur internes ne sont pas exposés au client
- **Proxy** : `trust proxy` activé pour les déploiements derrière un reverse proxy

---

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci-cd.yml`) s'exécute sur les branches `main` et `dev` :

1. **CI** — installation des dépendances (`npm ci`) sur ubuntu-latest avec Node 20
2. **build-remote** — connexion SSH au serveur de production, `git pull` et `docker compose build`
3. **deploy** — `docker compose down && docker compose up -d` sur le serveur distant

Les secrets nécessaires à configurer dans GitHub :

| Secret | Description |
|---|---|
| `SERVER_HOST` | IP ou hostname du serveur de déploiement |
| `SERVER_USER` | Utilisateur SSH |
| `SERVER_SSH_KEY` | Clé privée SSH |

---

## Liens

- Blog : [blog.hackemon.fr](https://blog.hackemon.fr)
- Instagram : [@hackemon.fr](https://www.instagram.com/hackemon.fr)
- LinkedIn : [Hackemon](https://www.linkedin.com/company/105809210/)
- Contact : communication.hackemon@gmail.com
- Moteur de jeu (Hackengine) : [github.com/Lroq/Hackengine](https://github.com/Lroq/Hackengine)