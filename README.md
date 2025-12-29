# Clodotech - Gestionnaire de Bibliotheque

Application web de gestion de bibliotheque personnelle avec scan ISBN, suivi de lecture et notifications.

## Fonctionnalites

- Scan ISBN pour ajouter des livres automatiquement (via Google Books API)
- Statuts de lecture : A lire, En cours, Lu
- Systeme de notation (etoiles)
- Wishlist / Favoris
- Marque-page (page actuelle)
- Notifications de nouvelles sorties d'auteurs suivis
- Recherche par titre, auteur ou categorie
- Dashboard admin pour gerer les utilisateurs

## Technologies

- **Frontend:** Next.js 16, React 19, TailwindCSS 4
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de donnees:** SQLite
- **Auth:** NextAuth.js v5 (JWT)

## Installation

```bash
# Cloner le repo
git clone https://github.com/Lajavel-gg/clodotech.git
cd clodotech

# Installer les dependances
npm install

# Initialiser la base de donnees
npx prisma db push

# Lancer le serveur de dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Compte Demo

Pour tester l'application, utilisez le compte admin pre-configure :

| Champ | Valeur |
|-------|--------|
| **Email** | `demo@clodotech.com` |
| **Mot de passe** | `Demo1234` |

Ce compte a les droits administrateur et peut gerer tous les utilisateurs.

## Structure du Projet

```
app/
├── admin/          # Dashboard admin
├── api/            # API Routes
├── components/     # Composants React
├── login/          # Page connexion
├── register/       # Page inscription
lib/
├── auth.ts         # Config NextAuth
├── prisma.ts       # Client Prisma
├── validation.ts   # Schemas Zod
prisma/
├── schema.prisma   # Schema BDD
├── dev.db          # Base SQLite
```

## Securite

- Validation des entrees avec Zod
- Rate limiting sur les routes auth
- Hash bcrypt (cost 14) pour les mots de passe
- Protection des routes admin via middleware

## License

MIT

---

Fait avec Claude Code
