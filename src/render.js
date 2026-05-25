import { state } from './storage.js';

export function renderGrid() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const gFilter = document.getElementById('filter-genre').value;
  const yFilter = document.getElementById('filter-year').value;

  let books = state.library.filter((b, i) => { b._idx = i; return true; });

  if (state.activeCategory !== 'all') books = books.filter(b => b.category === state.activeCategory);
  if (q) books = books.filter(b => (b.title + b.author + b.isbn).toLowerCase().includes(q));
  if (gFilter) books = books.filter(b => b.genre === gFilter);
  if (yFilter) books = books.filter(b => b.year === yFilter);

  const grid = document.getElementById('book-grid');
  if (!books.length) {
    grid.innerHTML = `<div class="empty-state"><div class="big">📚</div><p>Aucun livre ici.<br>Scannez un code-barres ou saisissez un ISBN<br>pour commencer votre bibliothèque.</p></div>`;
    return;
  }

  grid.innerHTML = books.map(b => `
    <div class="book-card" onclick="showDetail(${b._idx})">
      <button class="book-delete" onclick="deleteBook(event,${b._idx})">✕</button>
      ${b.cover
        ? `<img class="book-cover" src="${b.cover}" alt="${b.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <div class="book-cover-placeholder" ${b.cover ? 'style="display:none"' : ''}>
        📖<span>${b.genre || 'Livre'}</span>
      </div>
      <div class="book-info">
        <div class="book-title">${b.title}</div>
        <div class="book-author">${b.author || '—'}</div>
        ${b.genre ? `<span class="book-badge">${b.genre}</span>` : ''}
        ${b.rating ? ` <span class="book-badge" style="border-color:var(--gold-dim)">${'★'.repeat(Math.floor(b.rating))} ${b.rating}</span>` : ''}
      </div>
    </div>
  `).join('');
}

export function renderCategories() {
  const cats = {};
  state.library.forEach(b => {
    const c = b.category || 'Sans catégorie';
    cats[c] = (cats[c] || 0) + 1;
  });

  const list = document.getElementById('cat-list');
  list.innerHTML = `
    <div class="cat-item ${state.activeCategory === 'all' ? 'active' : ''}" onclick="setCategory('all')">
      <span>Tous les livres</span><span class="cat-count">${state.library.length}</span>
    </div>
    ${Object.entries(cats).map(([c, n]) => `
      <div class="cat-item ${state.activeCategory === c ? 'active' : ''}" onclick="setCategory('${c.replace(/'/g, "\\'")}')">
        <span>${c}</span><span class="cat-count">${n}</span>
      </div>
    `).join('')}
  `;

  // Update datalist
  const dl = document.getElementById('cat-datalist');
  dl.innerHTML = Object.keys(cats).filter(c => c !== 'Sans catégorie').map(c => `<option value="${c}">`).join('');

  // Update genre filter
  const genres = [...new Set(state.library.map(b => b.genre).filter(Boolean))].sort();
  const gf = document.getElementById('filter-genre');
  const gv = gf.value;
  gf.innerHTML = `<option value="">Tous les genres</option>` + genres.map(g => `<option ${g === gv ? 'selected' : ''}>${g}</option>`).join('');

  // Update year filter
  const years = [...new Set(state.library.map(b => b.year).filter(Boolean))].sort((a, b) => b - a);
  const yf = document.getElementById('filter-year');
  const yv = yf.value;
  yf.innerHTML = `<option value="">Toutes les années</option>` + years.map(y => `<option ${y === yv ? 'selected' : ''}>${y}</option>`).join('');
}

export function setCategory(c) {
  state.activeCategory = c;
  renderCategories();
  renderGrid();
}

export function updateStats() {
  document.getElementById('stat-total').textContent = state.library.length;
  document.getElementById('stat-authors').textContent = new Set(state.library.map(b => b.author).filter(Boolean)).size;
  document.getElementById('stat-genres').textContent = new Set(state.library.map(b => b.genre).filter(Boolean)).size;
}

// ─── MODAL DETAIL ─────────────────────────────────────────────────────────────
function field(label, val) {
  if (!val) return '';
  return `<div class="modal-field"><strong>${label}</strong>${val}</div>`;
}

export function showDetail(idx) {
  const b = state.library[idx];
  document.getElementById('modal-title').textContent = b.title;
  document.getElementById('modal-body').innerHTML = `
    ${b.cover ? `<img class="modal-cover" src="${b.cover}" alt="">` : ''}
    ${field('Auteur', b.author)}
    ${field('Éditeur', b.publisher)}
    ${field('Année', b.year)}
    ${field('Pages', b.pages)}
    ${field('ISBN', b.isbn)}
    ${field('Genre', b.genre)}
    ${field('Langue', b.lang)}
    ${field('Catégorie', b.category)}
    ${field('Note', b.rating ? b.rating + ' / 5' : '')}
    ${field('Ajouté le', b.addedAt)}
    ${b.desc ? `<div class="modal-desc">${b.desc}</div>` : ''}
    <div style="margin-top:18px; display:flex; gap:8px">
      <button class="btn btn-secondary" style="width:auto;padding:8px 16px" onclick="editBook(${idx})">✎ Modifier</button>
      <button class="btn btn-danger" style="width:auto;padding:8px 16px" onclick="deleteBook(null,${idx},true)">✕ Supprimer</button>
    </div>
  `;
  document.getElementById('modal').classList.add('active');
}

export function closeModal(e) {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').classList.remove('active');
  }
}
