import { showToast } from './ui.js';
import { fillForm } from './form.js';

export function mapGenre(s) {
  s = s.toLowerCase();
  if (s.includes('fiction') || s.includes('roman')) return 'Roman';
  if (s.includes('science fiction') || s.includes('sci-fi')) return 'Science-Fiction';
  if (s.includes('fantasy')) return 'Fantasy';
  if (s.includes('mystery') || s.includes('thriller') || s.includes('crime')) return 'Policier / Thriller';
  if (s.includes('biography') || s.includes('biographie')) return 'Biographie';
  if (s.includes('history') || s.includes('histoire')) return 'Histoire';
  if (s.includes('science')) return 'Sciences';
  if (s.includes('philosophy')) return 'Philosophie';
  if (s.includes('comic') || s.includes('manga')) return 'Manga';
  if (s.includes('cook') || s.includes('cuisine')) return 'Cuisine';
  if (s.includes('juvenile') || s.includes('children')) return 'Jeunesse';
  if (s.includes('essay') || s.includes('essai')) return 'Essai';
  return '';
}

export function mapLang(code) {
  const m = { fr: 'Français', en: 'Anglais', es: 'Espagnol', de: 'Allemand', it: 'Italien' };
  return m[code] || (code ? 'Autre' : '');
}

async function fetchOpenLibrary(isbn) {
  const r = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
  const d = await r.json();
  const key = `ISBN:${isbn}`;
  if (!d[key]) return null;
  const b = d[key];
  return {
    title: b.title || '',
    author: (b.authors || []).map(a => a.name).join(', '),
    publisher: (b.publishers || []).map(p => p.name).join(', '),
    year: b.publish_date ? b.publish_date.slice(-4) : '',
    pages: b.number_of_pages || '',
    isbn,
    cover: b.cover ? (b.cover.medium || b.cover.large || '') : '',
    desc: b.notes || '',
    genre: (b.subjects || []).slice(0, 1).map(s => mapGenre(s.name)).join('') || '',
    lang: '',
    category: '',
    rating: ''
  };
}

async function fetchGoogleBooks(isbn) {
  const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
  const d = await r.json();
  if (!d.items || d.items.length === 0) return null;
  const v = d.items[0].volumeInfo;
  return {
    title: v.title || '',
    author: (v.authors || []).join(', '),
    publisher: v.publisher || '',
    year: v.publishedDate ? v.publishedDate.slice(0, 4) : '',
    pages: v.pageCount || '',
    isbn,
    cover: v.imageLinks ? (v.imageLinks.thumbnail || '') : '',
    desc: v.description || '',
    genre: (v.categories || []).slice(0, 1).map(mapGenre).join('') || '',
    lang: mapLang(v.language || ''),
    category: '',
    rating: ''
  };
}

export async function lookupIsbn(isbn) {
  isbn = isbn || document.getElementById('isbn-input').value.replace(/[-\s]/g, '');
  if (!isbn) { showToast('Veuillez saisir un ISBN', 'error'); return; }

  document.getElementById('loading-api').classList.add('active');
  let book = null;

  try { book = await fetchOpenLibrary(isbn); } catch (e) {}
  if (!book) {
    try { book = await fetchGoogleBooks(isbn); } catch (e) {}
  }

  document.getElementById('loading-api').classList.remove('active');

  if (book) {
    fillForm(book);
    showToast('Livre trouvé !', 'success');
  } else {
    fillForm({ isbn });
    showToast('ISBN non trouvé — saisie manuelle', 'error');
  }
}
