/**
 * Servicio para guardar imágenes editadas en el backend principal.
 * No depende del backend de reconocimiento de imágenes.
 */

/**
 * Convierte un canvas HTML a Blob PNG.
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('No se pudo convertir canvas a Blob')); },
      'image/png', 1.0
    );
  });
}

/**
 * Convierte un DataURL directamente a Blob (sin fetch, más confiable).
 */
export function dataURLToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Carga una imagen como HTMLImageElement.
 * Solo activa CORS para URLs http/https (Supabase), no para DataURLs.
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src.slice(0, 60)}...`));
    img.src = src;
  });
}

/**
 * Recorta automáticamente los bordes transparentes de un canvas.
 * Devuelve un nuevo canvas ajustado al contenido visible.
 */
export function trimTransparentBorders(sourceCanvas) {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = sourceCanvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  let top = height, bottom = 0, left = width, right = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) { // pixel visible
        if (y < top)    top    = y;
        if (y > bottom) bottom = y;
        if (x < left)   left   = x;
        if (x > right)  right  = x;
      }
    }
  }

  // Si no hay píxeles visibles, devolver el canvas original
  if (top >= bottom || left >= right) return sourceCanvas;

  const padding = 4; // pequeño margen
  const x0 = Math.max(0, left   - padding);
  const y0 = Math.max(0, top    - padding);
  const w  = Math.min(width,  right  + padding + 1) - x0;
  const h  = Math.min(height, bottom + padding + 1) - y0;

  const trimmed = document.createElement('canvas');
  trimmed.width  = w;
  trimmed.height = h;
  trimmed.getContext('2d').drawImage(sourceCanvas, x0, y0, w, h, 0, 0, w, h);
  return trimmed;
}


/**
 * Acepta DataURL o URL http.
 */
export async function cropImageToBlob(imageSrc, pixelCrop) {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return canvasToBlob(canvas);
}

/**
 * Envía imagen editada al backend principal para guardarla en Supabase.
 * La imagen anterior se elimina cuando el producto se guarda (PUT /api/productos/<id>),
 * no aquí, para evitar borrados prematuros si el usuario no confirma el guardado.
 * @param {Blob} blob - imagen a guardar
 * @param {string} categoria - categoría del producto
 * @param {string} nombreBase - base del nombre de archivo
 */
export async function guardarImagenEditada(blob, categoria = 'otro', nombreBase = 'img') {
  const fd = new FormData();
  fd.append('file', blob, `${nombreBase}_edit.png`);
  fd.append('categoria', categoria);
  fd.append('nombre_base', nombreBase);

  const resp = await fetch('/api/productos/guardar-imagen-editada', {
    method: 'POST',
    body: fd,
  });

  const data = await resp.json();
  if (!resp.ok || !data.success) throw new Error(data.error || 'Error guardando imagen editada');
  return data;
}
