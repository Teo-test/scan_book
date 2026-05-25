const STORAGE_KEY = 'myLibrary';

export const state = {
  library: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  activeCategory: 'all',
};

export function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.library));
}
