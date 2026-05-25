import { BrowserMultiFormatReader } from 'https://esm.sh/@zxing/browser@0.1.5';
import { DecodeHintType, BarcodeFormat } from 'https://esm.sh/@zxing/library@0.21.3';
import { showToast } from './ui.js';
import { lookupIsbn } from './api.js';

// Restreindre aux formats ISBN/livre : EAN-13 (toutes les ISBN-13), EAN-8,
// UPC-A/UPC-E. Moins de formats = scan beaucoup plus rapide.
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]);
hints.set(DecodeHintType.TRY_HARDER, true);

const reader = new BrowserMultiFormatReader(hints);
let cameraControls = null;

// Charge un File en HTMLImageElement.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Dessine une région (sx,sy,sw,sh) sur un canvas, redimensionnée à targetW,
// avec rotation `angleDeg` autour du centre. Renvoie le canvas.
function renderRegion(img, sx, sy, sw, sh, targetW, angleDeg = 0) {
  const scale = targetW / sw;
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!angleDeg) {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    return canvas;
  }

  // Pour une rotation, on agrandit le canvas pour ne rien couper.
  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rw = Math.ceil(w * cos + h * sin);
  const rh = Math.ceil(w * sin + h * cos);
  canvas.width = rw;
  canvas.height = rh;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, rw, rh);
  ctx.translate(rw / 2, rh / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  return canvas;
}

async function tryDecodeCanvas(canvas) {
  try {
    const result = await reader.decodeFromCanvas(canvas);
    return result.getText().trim();
  } catch {
    return null;
  }
}

// Essaie une région à plusieurs rotations (le code-barres peut être incliné).
async function tryDecodeRegionWithRotations(img, sx, sy, sw, sh, targetW) {
  const angles = [0, -8, 8, -15, 15, -22, 22, -30, 30];
  for (const a of angles) {
    const canvas = renderRegion(img, sx, sy, sw, sh, targetW, a);
    const text = await tryDecodeCanvas(canvas);
    if (text) return text;
  }
  return null;
}

// Essaie plusieurs régions et échelles. Renvoie le texte ou null.
async function decodeWithStrategies(img) {
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // Format : [sx, sy, sw, sh, targetWidth]
  // Les régions petites/zoomées passent en premier : sur une photo de dos
  // de livre, le code-barres occupe souvent <5% de la surface, donc le
  // scan en pleine image est lent et inefficace.
  const regions = [
    // 1. Quadrants en premier (gros gain : code-barres = 4× plus de pixels relatifs)
    [W / 2, H / 2, W / 2, H / 2, 1400], // bas-droit (le plus fréquent)
    [0, H / 2, W / 2, H / 2, 1400],     // bas-gauche
    [W / 2, 0, W / 2, H / 2, 1400],     // haut-droit
    [0, 0, W / 2, H / 2, 1400],         // haut-gauche

    // 2. Moitiés
    [0, H / 2, W, H / 2, 1600],         // bas
    [W / 2, 0, W / 2, H, 1600],         // droite

    // 3. Centre zoomé
    [W * 0.25, H * 0.25, W * 0.5, H * 0.5, 1200],

    // 4. Image entière en dernier (filet de sécurité)
    [0, 0, W, H, 1600],
    [0, 0, W, H, 2400],
  ];

  for (const [sx, sy, sw, sh, tw] of regions) {
    const text = await tryDecodeRegionWithRotations(img, sx, sy, sw, sh, tw);
    if (text) return text;
  }
  return null;
}

// Scan via photo (fonctionne partout, même en file://)
export async function scanPhotoFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  input.value = '';

  showToast('Analyse de l\'image…');
  try {
    const img = await loadImage(file);
    const isbn = await decodeWithStrategies(img);
    if (!isbn) {
      showToast("Code-barres non détecté — essayez une photo plus rapprochée du code-barres", 'error');
      return;
    }
    document.getElementById('isbn-input').value = isbn;
    showToast('Code-barres détecté : ' + isbn, 'success');
    lookupIsbn(isbn);
  } catch (e) {
    showToast("Erreur lors de l'analyse de l'image", 'error');
  }
}

// Caméra live (HTTPS / localhost uniquement)
export async function toggleCamera() {
  const readerEl = document.getElementById('reader');
  readerEl.classList.add('active');
  document.getElementById('btn-scan').style.display = 'none';
  document.getElementById('btn-stop').style.display = 'block';

  readerEl.innerHTML = '<video style="width:100%;display:block" muted playsinline></video>';
  const videoEl = readerEl.querySelector('video');

  try {
    cameraControls = await reader.decodeFromVideoDevice(
      undefined,
      videoEl,
      (result) => {
        if (result) {
          const isbn = result.getText().trim();
          stopCamera();
          document.getElementById('isbn-input').value = isbn;
          lookupIsbn(isbn);
        }
      }
    );
  } catch (err) {
    showToast('Caméra inaccessible : ' + (err.message || err), 'error');
    stopCamera();
  }
}

export function stopCamera() {
  if (cameraControls) {
    cameraControls.stop();
    cameraControls = null;
  }
  const readerEl = document.getElementById('reader');
  readerEl.classList.remove('active');
  readerEl.innerHTML = '';
  document.getElementById('btn-scan').style.display = 'block';
  document.getElementById('btn-stop').style.display = 'none';
}
