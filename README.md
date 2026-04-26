# VTC Manager - ETS2

Simulateur de gestion de VTC (Virtual Trucking Company) pour Euro Truck Simulator 2 avec des entreprises IA concurrentes.

## Fonctionnalités

- 🏢 **Gestion d'entreprise** - Nom, logo, mode de conduite
- 👥 **Chauffeurs IA** - Embaucher, former, assigner des camions
- 🚛 **Garage** - Acheter/vendre des camions, équipements, décorations
- 📝 **Facturation** - Enregistrer vos livraisons (km réel / course)
- 📸 **Galerie** - Photos de votre entreprise
- 🏆 **Classement** - Compétition avec les entreprises IA
- 🤖 **Simulation temps réel** - Les IA progressent même quand vous êtes absent
- 🔧 **Panel Admin** - Mode debug pour tester

## Installation

### Prérequis
- Node.js 18+
- npm

### Installation des dépendances

```bash
# Backend
cd vtc-manager
npm install

# Frontend
cd client
npm install
```

### Lancement en développement

```bash
# Depuis le dossier vtc-manager
npm run dev
```

Cela lance:
- Backend sur http://localhost:3001
- Frontend sur http://localhost:5173

### Accès Admin

Cliquez 5 fois sur le logo "VTC Manager" dans la sidebar pour accéder au panel admin.

## Économie

### Revenus par livraison
- **Mode Réel** (≤100 km/h): 1.20€/km
- **Mode Course** (≤180 km/h): 0.80€/km

### Bonus cargo
- Standard: +0%
- Fragile: +15%
- Lourd: +20%
- Dangereux (ADR): +40%
- Exceptionnel: +50%

### Coûts
- Carburant: ~0.30€/km
- Usure: ~0.05€/km
- Salaire chauffeur: 1500€/mois

## Déploiement

Le projet est prêt pour être déployé sur:
- **Railway** (recommandé)
- **Render**
- **Fly.io**

```bash
npm run build
npm start
```

## Structure

```
vtc-manager/
├── server/
│   ├── index.js          # Point d'entrée serveur
│   ├── database.js       # SQLite + initialisation
│   ├── aiSimulator.js    # Simulation des IA
│   ├── routes/           # API endpoints
│   └── uploads/          # Logos et photos
├── client/
│   ├── src/
│   │   ├── pages/        # Composants pages
│   │   ├── components/   # Composants réutilisables
│   │   └── api.js        # Appels API
│   └── ...
└── package.json
```

## Licence

Projet personnel - Usage libre
