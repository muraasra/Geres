
# 🎯 **Gestion des Réservations de Salles**  

Ce projet est une application de gestion de réservation de salles développée en **TypeScript**, utilisant **Vite** pour le frontend et **json-server** pour simuler un backend REST API.  

## 🚀 **Fonctionnalités principales**  
✅ **Affichage des salles disponibles**  
✅ **Réservation de salles avec validation de créneaux**  
✅ **Stockage des réservations dans `json-server` et `localStorage`**  
✅ **Paiement simulé avec Stripe**  
✅ **Interface interactive générée par Vite**  

---

## 🏗️ **Installation du projet**  

### 📌 **1. Cloner le dépôt**  
```sh
git clone https://github.com/muraasra/Geres.git
cd geres
```

### 📌 **2. Installer les dépendances**  
```sh
npm install
```

---

## 🔥 **Lancer l'application**  
La commande `npm run dev` démarre **Vite** et **les serveurs JSON** automatiquement.  

### 📌 **Démarrer l'application**  
```sh
npm run dev
```

### 📌 **Configuration du `package.json`**  
Assure-toi que `package.json` contient la configuration suivante :  

```json
"scripts": {
  "dev": "concurrently \"vite\" \"json-server --watch reservations.json --port 5001\" \"json-server --watch rooms.json --port 5002\""
}
```

✅ Vite tourne sur `http://localhost:5173`  
✅ `json-server` pour **reservations** tourne sur `http://localhost:5001`  
✅ `json-server` pour **rooms** tourne sur `http://localhost:5002`  

---

## 📂 **Structure du projet**  

```bash
├── public/
├── src/
│   ├── data/
│   │   ├── rooms.ts
│   │   ├── reservations.ts
│   ├── models/
│   │   ├── reservation.ts
│   ├── services/
│   │   ├── dataService.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   ├── controllers/
│   │   ├── calendarController.ts
│   │   ├── modalController.ts
│   │   ├── reservationsController.ts
│   ├── styles/
│   ├── index.ts
│   ├── main.ts
├── reservations.json
├── rooms.json
├── package.json
├── tsconfig.json
├── README.md
```

✅ **`data/`** → Stocke les données des salles  
✅ **`models/`** → Définit les types (ex : `Reservation`)  
✅ **`services/`** → Gestion des réservations avec `json-server`  
✅ **`controllers/`** → Contrôle l’affichage et les interactions  

---

## 🎯 **Comment réserver une salle ?**  
1️⃣ **Choisir une salle dans l'interface**  
2️⃣ **Sélectionner une date et un créneau horaire**  
3️⃣ **Entrer son nom et confirmer la réservation**  
4️⃣ **Paiement simulé avec Stripe**  
5️⃣ **La réservation est validée et sauvegardée**  

---

## 🔎 **Tests API avec `json-server`**  

### ✅ **Récupérer toutes les salles**  
```sh
curl http://localhost:5000/rooms
```

### ✅ **Récupérer toutes les réservations**  
```sh
curl http://localhost:5001/reservations
```

### ✅ **Ajouter une réservation**  
```sh
curl -X POST http://localhost:5001/reservations -H "Content-Type: application/json" -d '{"roomId": 1, "userName": "Alice", "date": "2025-05-01", "startTime": "10:00", "endTime": "12:00"}'
```

---

## 📌 **Améliorations possibles**  
✨ Ajouter une vraie gestion des paiements avec Stripe  
✨ Mettre en place une authentification des utilisateurs  
✨ Améliorer le système de validation des créneaux  

---

## 📜 **Licence**  
Ce projet est sous licence MIT. Tu es libre de l'utiliser, modifier et améliorer.  

