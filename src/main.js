import { lookupIsbn } from './api.js';
import { scanPhotoFile, toggleCamera, stopCamera } from './scanner.js';
import { saveBook, resetForm, editBook, deleteBook } from './form.js';
import {
  renderGrid, renderCategories, updateStats, setCategory,
  showDetail, closeModal, setView, sortBy, newCategory, initView,
} from './render.js';
import { exportCSV, exportJSON, exportSQL } from './export.js';

// Les handlers inline `onclick="..."` ont besoin d'accès global.
Object.assign(window, {
  lookupIsbn,
  scanPhotoFile,
  toggleCamera,
  stopCamera,
  saveBook,
  resetForm,
  editBook,
  deleteBook,
  renderGrid,
  setCategory,
  showDetail,
  closeModal,
  setView,
  sortBy,
  newCategory,
  exportCSV,
  exportJSON,
  exportSQL,
});

// Enter sur l'input ISBN déclenche le lookup.
document.getElementById('isbn-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupIsbn();
});

initView();
renderCategories();
renderGrid();
updateStats();
