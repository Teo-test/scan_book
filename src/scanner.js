import { showToast } from './ui.js';
import { lookupIsbn } from './api.js';

// ZXing est chargé à la demande pour ne pas bloquer le boot de l'app
// si le CDN est lent ou indisponible (ex: téléphone hors-ligne).
let zxingPromise = null;
function loadZxing() {
  if (!zxingPromise) {
    zxingPromise = Promise.all([
      import('https://esm.sh/@zxing/browser@0.1.5'),
      import('https://esm.sh/@zxing/library@0.21.3'),
    ]).then(([browser, library]) => {
      const hints = new Map();
      hints.set(library.DecodeHintType.POSSIBLE_FORMATS, [
        library.BarcodeFormat.EAN_13,
        library.BarcodeFormat.EAN_8,
        library.BarcodeFormat.UPC_A,
        library.BarcodeFormat.UPC_E,
      ]);
      hints.set(library.DecodeHintType.TRY_HARDER, true);
      return new browser.BrowserMultiFormatReader(hints);
    });
  }
  return zxingPromise;
}

let cameraControls = null;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

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

async function tryDecodeCanvas(reader, canvas) {
  try {
    const result = await reader.decodeFromCanvas(canvas);
    return result.getText().trim();
  } catch {
    return null;
  }
}

async function tryDecodeRegionWithRotations(reader, img, sx, sy, sw, sh, targetW) {
  const angles = [0, -8, 8, -15, 15, -22, 22, -30, 30];
  for (const a of angles) {
    const canvas = renderRegion(img, sx, sy, sw, sh, targetW, a);
    const text = await tryDecodeCanvas(reader, canvas);
    if (text) return text;
  }
  return null;
}

async function decodeWithStrategies(reader, img) {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const regions = [
    [W / 2, H / 2, W / 2, H / 2, 1400],
    [0, H / 2, W / 2, H / 2, 1400],
    [W / 2, 0, W / 2, H / 2, 1400],
    [0, 0, W / 2, H / 2, 1400],
    [0, H / 2, W, H / 2, 1600],
    [W / 2, 0, W / 2, H, 1600],
    [W * 0.25, H * 0.25, W * 0.5, H * 0.5, 1200],
    [0, 0, W, H, 1600],
    [0, 0, W, H, 2400],
  ];
  for (const [sx, sy, sw, sh, tw] of regions) {
    const text = await tryDecodeRegionWithRotations(reader, img, sx, sy, sw, sh, tw);
    if (text) return text;
  }
  return null;
}

export async function scanPhotoFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  input.value = '';

  showToast('Analyse de l\'image…');
  try {
    const reader = await loadZxing();
    const img = await loadImage(file);
    const isbn = await decodeWithStrategies(reader, img);
    if (!isbn) {
      showToast("Code-barres non détecté — essayez une photo plus rapprochée du code-barres", 'error');
      return;
    }
    document.getElementById('isbn-input').value = isbn;
    showToast('Code-barres détecté : ' + isbn, 'success');
    lookupIsbn(isbn);
  } catch (e) {
    showToast("Erreur lors de l'analyse de l'image : " + (e.message || e), 'error');
  }
}

export async function toggleCamera() {
  const readerEl = document.getElementById('reader');
  readerEl.classList.add('active');
  document.getElementById('btn-scan').style.display = 'none';
  document.getElementById('btn-stop').style.display = 'block';

  readerEl.innerHTML = '<video style="width:100%;display:block" muted playsinline></video>';
  const videoEl = readerEl.querySelector('video');

  try {
    const reader = await loadZxing();
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
