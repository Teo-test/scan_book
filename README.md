# Ma Bibliothèque

Application web autonome pour scanner et gérer une bibliothèque de livres personnelle. Tout fonctionne côté client : les données sont stockées dans le `localStorage` du navigateur, sans serveur ni compte.

## Fonctionnalités

- **Scan d'un code-barres ISBN** par photo (fonctionne partout, même en `file://`) ou par caméra live (nécessite HTTPS ou localhost).
- **Saisie ISBN manuelle** avec auto-complétion via [Open Library](https://openlibrary.org/) puis fallback [Google Books](https://developers.google.com/books).
- **Fiche livre éditable** : titre, auteur(s), éditeur, année, genre, langue, pages, ISBN, catégorie personnelle, note, résumé, couverture.
- **Catégories personnelles** (Pile à lire, Lu, Prêté…) avec compteurs.
- **Recherche et filtres** par titre/auteur/ISBN, genre, année.
- **Exports** au format CSV, JSON et SQL.

## Lancer l'application

Aucune dépendance, aucune étape de build. Deux options :

1. **Ouvrir directement** `index.html` dans le navigateur. Le scan par photo et la saisie manuelle fonctionneront. La caméra live nécessite HTTPS ou localhost.
2. **Servir localement** depuis le dossier du projet pour avoir accès à la caméra live :

```bash
python -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure

```
scan_book/
├── index.html          point d'entrée
├── assets/
│   └── styles.css      thème dark/gold complet
├── src/
│   ├── main.js         init + wiring des handlers onclick
│   ├── storage.js      état + persistance localStorage
│   ├── api.js          lookup ISBN (Open Library, Google Books)
│   ├── scanner.js      scan photo + caméra live (html5-qrcode)
│   ├── form.js         formulaire d'ajout / édition / suppression
│   ├── render.js       grille, catégories, stats, modal détail
│   ├── export.js       exports CSV / JSON / SQL
│   └── ui.js           toast + helpers DOM
└── README.md
```

## Dépendances externes

- [html5-qrcode](https://github.com/mebjas/html5-qrcode) v2.3.8 (chargée via unpkg)
- Polices Google : *Playfair Display* et *DM Mono*

## Données

Tout est stocké dans `localStorage` sous la clé `myLibrary`. Pour migrer ou faire une sauvegarde, utiliser l'export JSON.
