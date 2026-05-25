import { state, persist } from './storage.js';
import { showToast, setSelect } from './ui.js';
import { renderGrid, renderCategories, updateStats } from './render.js';

export function fillForm(book) {
  document.getElementById('f-title').value = book.title || '';
  document.getElementById('f-author').value = book.author || '';
  document.getElementById('f-publisher').value = book.publisher || '';
  document.getElementById('f-year').value = book.year || '';
  document.getElementById('f-pages').value = book.pages || '';
  document.getElementById('f-isbn').value = book.isbn || '';
  document.getElementById('f-cover').value = book.cover || '';
  document.getElementById('f-desc').value = book.desc || '';
  document.getElementById('f-rating').value = book.rating || '';
  document.getElementById('f-category').value = book.category || '';
  setSelect('f-genre', book.genre || '');
  setSelect('f-lang', book.lang || '');
  document.getElementById('f-edit-index').value = book._idx !== undefined ? book._idx : -1;
  document.getElementById('book-form').classList.add('active');
  document.getElementById('book-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function resetForm() {
  document.getElementById('book-form').classList.remove('active');
  document.getElementById('isbn-input').value = '';
  document.getElementById('f-edit-index').value = -1;
}

export function saveBook() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { showToast('Le titre est obligatoire', 'error'); return; }

  const book = {
    title,
    author: document.getElementById('f-author').value.trim(),
    publisher: document.getElementById('f-publisher').value.trim(),
    year: document.getElementById('f-year').value.trim(),
    pages: document.getElementById('f-pages').value.trim(),
    isbn: document.getElementById('f-isbn').value.trim(),
    genre: document.getElementById('f-genre').value,
    lang: document.getElementById('f-lang').value,
    category: document.getElementById('f-category').value.trim(),
    rating: document.getElementById('f-rating').value,
    desc: document.getElementById('f-desc').value.trim(),
    cover: document.getElementById('f-cover').value.trim(),
    addedAt: new Date().toISOString().slice(0, 10)
  };

  const idx = parseInt(document.getElementById('f-edit-index').value);
  if (idx >= 0) {
    state.library[idx] = book;
    showToast('Livre mis à jour !', 'success');
  } else {
    state.library.unshift(book);
    showToast('Livre ajouté !', 'success');
  }

  persist();
  resetForm();
  renderGrid();
  renderCategories();
  updateStats();
}

export function editBook(idx) {
  document.getElementById('modal').classList.remove('active');
  const b = { ...state.library[idx], _idx: idx };
  fillForm(b);
}

export function deleteBook(e, idx, fromModal = false) {
  if (e) e.stopPropagation();
  if (!confirm(`Supprimer "${state.library[idx].title}" ?`)) return;
  state.library.splice(idx, 1);
  persist();
  renderGrid();
  renderCategories();
  updateStats();
  if (fromModal) document.getElementById('modal').classList.remove('active');
  showToast('Livre supprimé', 'success');
}
