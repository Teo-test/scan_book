import { state } from './storage.js';

// Vue active ('grid' | 'list') et tri courant pour la vue liste
const view = {
  mode: localStorage.getItem('viewMode') || 'grid',
  sortKey: 'title',
  sortDir: 1, // 1 asc, -1 desc
};

function escapeAttr(s) {
  return String(s || '').replace(/"/g, '&quot;').replace(/'/g, "\\'");
}

function getFilteredBooks() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const gFilter = document.getElementById('filter-genre').value;
  const yFilter = document.getElementById('filter-year').value;

  let books = state.library.filter((b, i) => { b._idx = i; return true; });
  if (state.activeCategory !== 'all') books = books.filter(b => b.category === state.activeCategory);
  if (q) books = books.filter(b => (b.title + b.author + b.isbn).toLowerCase().includes(q));
  if (gFilter) books = books.filter(b => b.genre === gFilter);
  if (yFilter) books = books.filter(b => b.year === yFilter);
  return books;
}

export function renderGrid() {
  const books = getFilteredBooks();
  const grid = document.getElementById('book-grid');
  grid.classList.toggle('list-view', view.mode === 'list');

  if (!books.length) {
    grid.innerHTML = `<div class="empty-state"><div class="big">📚</div><p>Aucun livre ici.<br>Scannez un code-barres ou saisissez un ISBN<br>pour commencer votre bibliothèque.</p></div>`;
    return;
  }

  if (view.mode === 'list') {
    renderListView(books, grid);
  } else {
    renderCardView(books, grid);
  }
}

function renderCardView(books, grid) {
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

function renderListView(books, grid) {
  // Tri
  const k = view.sortKey;
  const dir = view.sortDir;
  const sorted = [...books].sort((a, b) => {
    let va = a[k] || '';
    let vb = b[k] || '';
    if (k === 'year' || k === 'rating' || k === 'pages') {
      va = parseFloat(va) || 0;
      vb = parseFloat(vb) || 0;
    } else {
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
    }
    if (va < vb) return -dir;
    if (va > vb) return dir;
    return 0;
  });

  const arrow = (col) => view.sortKey === col
    ? `<span class="sort-arrow">${view.sortDir === 1 ? '↑' : '↓'}</span>` : '';

  grid.innerHTML = `
    <table class="book-table">
      <thead>
        <tr>
          <th class="col-cover"></th>
          <th onclick="sortBy('title')">Titre${arrow('title')}</th>
          <th onclick="sortBy('author')">Auteur${arrow('author')}</th>
          <th onclick="sortBy('year')">Année${arrow('year')}</th>
          <th onclick="sortBy('genre')">Genre${arrow('genre')}</th>
          <th onclick="sortBy('category')">Catégorie${arrow('category')}</th>
          <th onclick="sortBy('rating')">Note${arrow('rating')}</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(b => `
          <tr onclick="showDetail(${b._idx})">
            <td class="col-cover">
              ${b.cover
                ? `<img class="mini-cover" src="${b.cover}" alt="" onerror="this.outerHTML='<div class=&quot;mini-cover-ph&quot;>📖</div>'">`
                : `<div class="mini-cover-ph">📖</div>`}
            </td>
            <td class="col-title">${b.title}</td>
            <td>${b.author || '—'}</td>
            <td>${b.year || '—'}</td>
            <td>${b.genre || '—'}</td>
            <td>${b.category || '—'}</td>
            <td class="col-rating">${b.rating ? '★ ' + b.rating : '—'}</td>
            <td class="col-actions">
              <button class="row-delete" onclick="deleteBook(event,${b._idx})" title="Supprimer">✕</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function setView(mode) {
  view.mode = mode;
  localStorage.setItem('viewMode', mode);
  document.getElementById('view-grid-btn').classList.toggle('active', mode === 'grid');
  document.getElementById('view-list-btn').classList.toggle('active', mode === 'list');
  renderGrid();
}

export function sortBy(key) {
  if (view.sortKey === key) {
    view.sortDir *= -1;
  } else {
    view.sortKey = key;
    view.sortDir = 1;
  }
  renderGrid();
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
      <div class="cat-item ${state.activeCategory === c ? 'active' : ''}" onclick="setCategory('${escapeAttr(c)}')">
        <span>${c}</span><span class="cat-count">${n}</span>
      </div>
    `).join('')}
  `;

  // Met à jour le <select> du formulaire avec les catégories existantes
  // (+ les catégories ajoutées en mémoire via newCategory)
  const known = new Set([
    ...Object.keys(cats).filter(c => c !== 'Sans catégorie'),
    ...state.customCategories,
  ]);
  const catSel = document.getElementById('f-category');
  const currentVal = catSel.value;
  catSel.innerHTML = `<option value="">— Aucune —</option>`
    + [...known].sort().map(c => `<option value="${escapeAttr(c)}">${c}</option>`).join('');
  catSel.value = currentVal;

  // Filtre genre
  const genres = [...new Set(state.library.map(b => b.genre).filter(Boolean))].sort();
  const gf = document.getElementById('filter-genre');
  const gv = gf.value;
  gf.innerHTML = `<option value="">Tous les genres</option>` + genres.map(g => `<option ${g === gv ? 'selected' : ''}>${g}</option>`).join('');

  // Filtre année
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

// Crée une nouvelle catégorie depuis le formulaire (bouton +)
// Sur mobile, prompt() est parfois bloqué — fallback inline avec un input.
export function newCategory() {
  // Mini-modal inline (compatible iOS et Android)
  const existing = document.getElementById('cat-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'cat-modal';
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <div class="modal-title">Nouvelle catégorie</div>
      </div>
      <div class="form-group">
        <label>Nom</label>
        <input type="text" id="cat-modal-input" placeholder="Ma pile à lire, Lu, Prêté…" autofocus>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end">
        <button class="btn btn-secondary" id="cat-modal-cancel" style="width:auto;padding:8px 16px">Annuler</button>
        <button class="btn btn-primary" id="cat-modal-ok" style="width:auto;padding:8px 16px">Créer</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById('cat-modal-input');
  const close = () => modal.remove();
  const submit = () => {
    const trimmed = input.value.trim();
    if (!trimmed) { close(); return; }
    if (!state.customCategories.includes(trimmed)) {
      state.customCategories.push(trimmed);
      localStorage.setItem('customCategories', JSON.stringify(state.customCategories));
    }
    renderCategories();
    document.getElementById('f-category').value = trimmed;
    close();
  };

  document.getElementById('cat-modal-cancel').onclick = close;
  document.getElementById('cat-modal-ok').onclick = submit;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  setTimeout(() => input.focus(), 50);
}

export function updateStats() {
  document.getElementById('stat-total').textContent = state.library.length;
  document.getElementById('stat-authors').textContent = new Set(state.library.map(b => b.author).filter(Boolean)).size;
  document.getElementById('stat-genres').textContent = new Set(state.library.map(b => b.genre).filter(Boolean)).size;
}

// Init : applique la vue mémorisée aux boutons
export function initView() {
  document.getElementById('view-grid-btn').classList.toggle('active', view.mode === 'grid');
  document.getElementById('view-list-btn').classList.toggle('active', view.mode === 'list');
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
