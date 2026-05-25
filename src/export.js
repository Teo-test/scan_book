import { state } from './storage.js';
import { showToast } from './ui.js';

function download(filename, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + content], { type }));
  a.download = filename;
  a.click();
}

export function exportCSV() {
  const cols = ['Titre', 'Auteur', 'Éditeur', 'Année', 'Genre', 'Langue', 'Pages', 'ISBN', 'Catégorie', 'Note', 'Ajouté le', 'Résumé'];
  const rows = state.library.map(b => [
    b.title, b.author, b.publisher, b.year, b.genre, b.lang, b.pages, b.isbn, b.category, b.rating, b.addedAt, b.desc
  ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(';'));
  download('bibliotheque.csv', [cols.join(';'), ...rows].join('\n'), 'text/csv;charset=utf-8;');
  showToast('Export CSV téléchargé !', 'success');
}

export function exportJSON() {
  download('bibliotheque.json', JSON.stringify(state.library, null, 2), 'application/json');
  showToast('Export JSON téléchargé !', 'success');
}

export function exportSQL() {
  const cols = 'titre, auteur, editeur, annee, genre, langue, pages, isbn, categorie, note, ajoute_le, resume';
  const rows = state.library.map(b =>
    `  (${[b.title, b.author, b.publisher, b.year, b.genre, b.lang, b.pages, b.isbn, b.category, b.rating, b.addedAt, b.desc].map(v => `'${(v || '').replace(/'/g, "''")}'`).join(', ')})`
  ).join(',\n');
  const sql = `-- Export Bibliothèque ${new Date().toLocaleDateString('fr')}\nCREATE TABLE IF NOT EXISTS livres (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  titre TEXT, auteur TEXT, editeur TEXT, annee TEXT, genre TEXT, langue TEXT,\n  pages TEXT, isbn TEXT, categorie TEXT, note TEXT, ajoute_le TEXT, resume TEXT\n);\n\nINSERT INTO livres (${cols}) VALUES\n${rows};`;
  download('bibliotheque.sql', sql, 'text/plain');
  showToast('Export SQL téléchargé !', 'success');
}
