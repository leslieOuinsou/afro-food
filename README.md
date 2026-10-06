# Afro-Food

Application de commande de plats africains (Afro-food).

## Structure

```
afro-food/
├── frontend/     # Next.js
├── backend/      # Express + PostgreSQL + Prisma
└── README.md
```

## Prérequis

- Node.js 18+
- PostgreSQL 14+ (local, Docker ou cloud : Neon, Supabase, Railway…)

## Démarrage

### 1. Base de données PostgreSQL

Exemple Docker :

```bash
docker run -d --name afro-food-pg \
  -e POSTGRES_USER=afro \
  -e POSTGRES_PASSWORD=afro \
  -e POSTGRES_DB=afro_food \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Éditer DATABASE_URL et JWT_SECRET
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

API : [http://localhost:5000](http://localhost:5000)

`DATABASE_URL` exemple :

```env
DATABASE_URL="postgresql://afro:afro@localhost:5432/afro_food?schema=public"
JWT_SECRET="une-chaine-secrete-longue"
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App : [http://localhost:3000](http://localhost:3000)

Compte admin créé par le seed (par défaut) :

- email : `admin@afrofood.com`
- mot de passe : `Admin123!` (ou `ADMIN_SEED_PASSWORD`)

## Scripts backend utiles

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur Express (watch) |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Applique le schéma à PostgreSQL |
| `npm run seed` | Admin + plats + promo + settings |
| `npm run seed:admin` | Admin seul |
| `npm run seed:plats` | Plats démo |

## Variables d’environnement

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL (obligatoire) |
| `JWT_SECRET` | Secret JWT |
| `FRONTEND_URL` | Origine CORS (ex. Vercel frontend) |
| `SMTP_*` / `EMAIL_FROM` | Envoi e-mails (optionnel) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL du backend (ex. `http://localhost:5000`) |

## Déploiement Vercel

Deux projets (même dépôt, racines différentes) :

1. **Frontend** — Root `frontend` — env `NEXT_PUBLIC_API_URL`
2. **Backend** — Root `backend` — env `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

Sur Vercel, ajoute un **Build Command** backend du type :

```bash
npx prisma generate && node server.js
```

(ou configure `postinstall`: `prisma generate` dans `package.json` si besoin).

## Stack

- **Frontend** : Next.js, React
- **Backend** : Express (ESM)
- **BDD** : PostgreSQL via **Prisma**
