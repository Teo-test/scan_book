export function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

export function setSelect(id, val) {
  const sel = document.getElementById(id);
  for (const o of sel.options) {
    if (o.value === val) { sel.value = val; return; }
  }
  sel.value = '';
}
