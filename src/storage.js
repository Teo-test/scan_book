const STORAGE_KEY = 'myLibrary';
const CATS_KEY = 'customCategories';

export const state = {
  library: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  customCategories: JSON.parse(localStorage.getItem(CATS_KEY) || '[]'),
  activeCategory: 'all',
};

export function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.library));
}
