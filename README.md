# ⛓️ Blockchain Sécurisée – Visualizer

Un **visualiseur de blockchain pédagogique** développé en **JavaScript vanilla** avec **SHA-256** et **Proof of Work**, permettant de comprendre le fonctionnement interne d’une blockchain, le minage, la validation et l’impact d’une attaque.

👉 Projet réalisé dans un cadre **académique / éducatif**.

---

## 🎯 Objectifs du projet

- Comprendre le fonctionnement d’une **blockchain**
- Implémenter :
  - Le **hachage SHA-256**
  - Le **Proof of Work (PoW)**
  - Le **chaînage des blocs**
- Visualiser :
  - Le minage
  - La validation de la chaîne
  - L’impact d’une **modification malveillante** (attaque)

---

## ⚙️ Technologies utilisées

- **HTML5**
- **Tailwind CSS** (via CDN)
- **JavaScript Vanilla**
- **Web Crypto API** (SHA-256)

➡️ Aucune dépendance externe, aucun framework.

---

## 🧱 Fonctionnalités principales

- ⛏️ **Minage de blocs** avec Proof of Work
- 🔐 **Hash SHA-256** pour chaque bloc
- 🔗 **Chaînage sécurisé** entre les blocs
- ✅ **Validation de l’intégrité** de la blockchain
- ⚠️ **Simulation d’attaque** (modification d’un bloc)
- 🚫 Blocage du minage si la chaîne est compromise
- 📊 Visualisation claire de l’état des blocs (valide / compromis)

---

## 🖥️ Aperçu du fonctionnement

1. Entrer des données dans le champ prévu
2. Choisir une difficulté (avant le premier bloc)
3. Miner un bloc
4. Ajouter plusieurs blocs
5. Valider la chaîne
6. Simuler une attaque en modifiant un bloc
7. Observer la rupture de la chaîne 🔴

---

## 🚀 Lancer le projet

Aucune installation requise.

```bash
git clone https://github.com/TON_USERNAME/blockchain-visualizer.git
cd blockchain-visualizer
