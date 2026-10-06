# Backend Afro-food

API Express + **PostgreSQL** + **Prisma** pour la commande de plats africains.

## Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm

## Installation

```bash
cp .env.example .env
# Éditer DATABASE_URL et JWT_SECRET

npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

API : http://localhost:5000

## Variables `.env`

```env
DATABASE_URL="postgresql://afro:afro@localhost:5432/afro_food?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_cle_secrete_tres_longue_et_complexe
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
BCRYPT_SALT_ROUNDS=12
ADMIN_SEED_EMAIL=admin@afrofood.com
ADMIN_SEED_PASSWORD=Admin123!
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur en mode watch |
| `npm run db:push` | Applique le schéma Prisma |
| `npm run seed` | Admin + plats + promo + settings |
| `npm run seed:admin` | Admin seul |

## Admin par défaut (après seed)

- Email : `admin@afrofood.com`
- Mot de passe : `Admin123!`

## Endpoints principaux

- `/api/auth` — authentification
- `/api/plats` — catalogue
- `/api/commandes` — commandes
- `/api/avis` — avis
- `/api/messages` — messagerie admin
- `/api/contact` — formulaire contact
- `/api/newsletter` — inscription newsletter
- `/api/settings` — paramètres admin
- `/api/settings/livraison` — frais livraison (public)
- `/health` — santé + PostgreSQL

## Déploiement Vercel

Root Directory : `backend`  
Env : `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`  
`postinstall` lance `prisma generate`.
