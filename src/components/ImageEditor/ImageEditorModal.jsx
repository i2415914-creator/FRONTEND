import { useState, useCallback, useRef, useEffect } from 'react';
import {
  cropImageToBlob, dataURLToBlob, canvasToBlob, guardarImagenEditada, loadImage,
  trimTransparentBorders
} from '../../services/imageEditorService';

const T = {
  brand: '#5a8ba8', brandMid: '#80C2DC', red: '#941918',
  border: 'rgba(128,194,220,.28)', bg: 'rgba(255,255,255,.97)',
  text: '#1a2a3a', textLight: '#5a7a90',
  shadow: '0 24px 64px rgba(0,0,0,.26)',
};

/* ─── Tarjeta producto (igual a la vista real) ───────────────── */
function TarjetaProducto({ imageSrc, categoria, nombre }) {
  return (
    <div style={{
      width: 220, borderRadius: 16, background: '#fff',
      boxShadow: '0 4px 24px rgba(0,0,0,.12)', overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ padding: '10px 12px 6px' }}>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 999,
          border: '1px solid #ccc', fontSize: 10, fontWeight: 700, color: '#666', letterSpacing: '.06em',
        }}>
          {(categoria || 'GENERAL').toUpperCase()}
        </span>
      </div>
      <div style={{
        aspectRatio: '1/1', overflow: 'hidden', background: '#f1f5f9',
      }}>
        <img src={imageSrc} alt="preview"
             style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#1a2a3a' }}>
          {nombre || 'Nombre producto'}
        </p>
        <p style={{ margin: '2px 0 8px', fontSize: 12, color: '#888' }}>{categoria || 'Categoría'}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#941918' }}>S/---</span>
          <span style={{
            padding: '4px 12px', borderRadius: 999,
            border: '1.5px solid #1a8a4a', color: '#1a8a4a', fontSize: 11, fontWeight: 700,
          }}>Stock</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Herramienta borrador (pincel + lasso) ─────────────────── */
function EraserTool({ imageSrc, onImageChange }) {
  const canvasRef  = useRef(null);
  const overlayRef = useRef(null);          // canvas de preview del lasso
  const wrapRef    = useRef(null);
  const historyRef = useRef([]);
  const lastPos    = useRef(null);
  const initialized = useRef(false);

  const [mode, setMode]         = useState('brush'); // 'brush' | 'lasso'
  const [brushSize, setBrushSize] = useState(28);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo]   = useState(false);
  const [lassoPoints, setLassoPoints] = useState([]);

  // ── Cargar imagen en canvas ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    loadImage(imageSrc).then(img => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      if (overlayRef.current) {
        overlayRef.current.width  = img.naturalWidth;
        overlayRef.current.height = img.naturalHeight;
      }
      ctx.drawImage(img, 0, 0);
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      setCanUndo(false);
      initialized.current = true;
    }).catch(() => {});
  }, [imageSrc]);

  // ── Coordenadas ajustadas a escala canvas ────────────────────
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  };

  // ── Guardar estado para undo ─────────────────────────────────
  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 15) historyRef.current.shift();
    setCanUndo(true);
  };

  // ── Trazar línea borradora (pincel) ──────────────────────────
  const eraseLine = (from, to) => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineWidth = brushSize;
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
    ctx.stroke();
    ctx.restore();
  };

  // ── Dibujar preview del polígono lasso ───────────────────────
  const drawLassoOverlay = useCallback((points, mousePos = null) => {
    const ov  = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, ov.width, ov.height);
    if (points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    if (mousePos) ctx.lineTo(mousePos.x, mousePos.y);

    ctx.strokeStyle = '#941918';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Puntos del polígono
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle   = i === 0 ? '#941918' : '#5a8ba8';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
  }, []);

  // ── Aplicar borrado de polígono lasso ────────────────────────
  const applyLassoErase = useCallback((points) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 3) return;
    pushHistory();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Limpiar overlay
    if (overlayRef.current) {
      const ov = overlayRef.current.getContext('2d', { willReadFrequently: true });
      ov.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
    onImageChange(trimTransparentBorders(canvas).toDataURL('image/png'));
  }, [onImageChange]);

  // ── Eventos pincel ───────────────────────────────────────────
  const startBrush = (e) => {
    e.preventDefault();
    if (!initialized.current) return;
    pushHistory();
    setIsDrawing(true);
    const pos = getPos(e);
    lastPos.current = pos;
    eraseLine(pos, pos);
  };
  const moveBrush = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    eraseLine(lastPos.current || pos, pos);
    lastPos.current = pos;
  };
  const stopBrush = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    onImageChange(canvasRef.current.toDataURL('image/png'));
  };

  // ── Eventos lasso ────────────────────────────────────────────
  const handleLassoClick = (e) => {
    e.preventDefault();
    if (!initialized.current) return;
    const pos = getPos(e);

    setLassoPoints(prev => {
      // Cerrar polígono si se hace clic cerca del primer punto
      if (prev.length >= 3) {
        const dx = pos.x - prev[0].x, dy = pos.y - prev[0].y;
        if (Math.sqrt(dx * dx + dy * dy) < 18) {
          applyLassoErase(prev);
          drawLassoOverlay([]);
          return [];
        }
      }
      const newPts = [...prev, pos];
      drawLassoOverlay(newPts);
      return newPts;
    });
  };
  const handleLassoMove = (e) => {
    if (lassoPoints.length === 0) return;
    const pos = getPos(e);
    drawLassoOverlay(lassoPoints, pos);
  };
  const handleLassoDblClick = (e) => {
    e.preventDefault();
    if (lassoPoints.length >= 3) {
      applyLassoErase(lassoPoints);
      drawLassoOverlay([]);
      setLassoPoints([]);
    }
  };

  // ── Reducir ruido / limpiar manchas ─────────────────────────
  const applyNoiseFilter = (blurRadius) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushHistory();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;

    // Guardar alpha original para preservar bordes nítidos
    const originalData = ctx.getImageData(0, 0, width, height);
    const alphaMap = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) alphaMap[i] = originalData.data[i * 4 + 3];

    // Aplicar blur en canvas temporal (hardware-accelerated)
    const tmp = document.createElement('canvas');
    tmp.width = width; tmp.height = height;
    const tmpCtx = tmp.getContext('2d');
    tmpCtx.filter = `blur(${blurRadius}px)`;
    tmpCtx.drawImage(canvas, 0, 0);
    tmpCtx.filter = 'none';

    // Redibujar con blur
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tmp, 0, 0);

    // Restaurar alpha original (evita que el blur "sangre" en zonas transparentes)
    const blurredData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < width * height; i++) blurredData.data[i * 4 + 3] = alphaMap[i];
    ctx.putImageData(blurredData, 0, 0);

    onImageChange(trimTransparentBorders(canvas).toDataURL('image/png'));
  };

  // ── Undo ─────────────────────────────────────────────────────
  const undo = () => {
    if (historyRef.current.length < 2) return;
    historyRef.current.pop();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0);
    setCanUndo(historyRef.current.length > 1);
    onImageChange(trimTransparentBorders(canvas).toDataURL('image/png'));
  };

  const reset = () => {
    setLassoPoints([]);
    drawLassoOverlay([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    loadImage(imageSrc).then(img => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      setCanUndo(false);
      onImageChange(null);
    }).catch(() => {});
  };

  // ── Cursor pincel ────────────────────────────────────────────
  const cursorSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}">` +
    `<circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2-1}" fill="rgba(255,255,255,.18)" stroke="white" stroke-width="1.5"/>` +
    `<circle cx="${brushSize/2}" cy="${brushSize/2}" r="${brushSize/2-1}" fill="none" stroke="#941918" stroke-width="1" stroke-dasharray="3 2"/>` +
    `</svg>`
  );

  const isBrush = mode === 'brush';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Selector de modo ── */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 9, overflow: 'hidden', border: `1.5px solid ${T.border}`, width: 'fit-content' }}>
        {[
          { id: 'brush', icon: '🖌️', label: 'Pincel libre' },
          { id: 'lasso', icon: '🔷', label: 'Selección lasso' },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setLassoPoints([]); drawLassoOverlay([]); }}
            style={{
              padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: mode === m.id ? T.brand : 'transparent',
              color: mode === m.id ? '#fff' : T.textLight,
              transition: 'all .15s',
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* ── Controles ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {isBrush && (
          <>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textLight }}>PINCEL:</span>
            <input type="range" min={5} max={90} step={1} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              style={{ width: 100, accentColor: T.brand }} />
            <span style={{
              fontSize: 11, color: T.textLight, display: 'flex', alignItems: 'center', gap: 5, minWidth: 40,
            }}>
              <span style={{
                display: 'inline-block', borderRadius: '50%', border: '1.5px dashed #941918',
                width: Math.max(brushSize * 0.22, 6), height: Math.max(brushSize * 0.22, 6),
              }}/>
              {brushSize}px
            </span>
          </>
        )}
        {!isBrush && (
          <span style={{ fontSize: 11, color: T.textLight }}>
            💡 Haz clic para añadir puntos · Clic en el <strong style={{ color: T.red }}>primer punto</strong> o doble clic para cerrar y borrar
            {lassoPoints.length > 0 && <span style={{ color: T.brand, marginLeft: 6 }}>({lassoPoints.length} puntos)</span>}
          </span>
        )}

        <button onClick={undo} disabled={!canUndo}
          style={{
            padding: '5px 14px', borderRadius: 8, border: `1.5px solid ${T.border}`,
            background: canUndo ? 'rgba(90,139,168,.10)' : 'transparent',
            color: canUndo ? T.brand : '#bbb', fontWeight: 700, fontSize: 12,
            cursor: canUndo ? 'pointer' : 'not-allowed',
          }}>↩ Deshacer</button>

        <button onClick={reset}
          style={{
            padding: '5px 14px', borderRadius: 8,
            border: '1.5px solid rgba(148,25,24,.30)',
            background: 'transparent', color: T.red,
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>↺ Resetear</button>

        {/* Filtros de limpieza */}
        <div style={{ width: 1, height: 20, background: T.border, margin: '0 2px' }} />
        <button onClick={() => applyNoiseFilter(1)}
          style={{
            padding: '5px 14px', borderRadius: 8,
            border: '1.5px solid rgba(80,160,80,.35)',
            background: 'rgba(80,160,80,.07)', color: '#2a7a2a',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>✨ Reducir ruido</button>
        <button onClick={() => applyNoiseFilter(2.5)}
          style={{
            padding: '5px 14px', borderRadius: 8,
            border: '1.5px solid rgba(80,160,80,.35)',
            background: 'rgba(80,160,80,.07)', color: '#2a7a2a',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>🧹 Limpiar manchas</button>
      </div>

      {/* ── Canvas ── */}
      <div ref={wrapRef} style={{
        borderRadius: 10, overflow: 'auto',
        border: `1.5px solid ${T.border}`, maxHeight: 420,
        background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 18px 18px',
      }}>
        {/* Wrapper interior: se ajusta exactamente al tamaño del canvas para que el overlay coincida */}
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          {/* Canvas imagen */}
          <canvas
            ref={canvasRef}
            style={{
              display: 'block', maxWidth: '100%', touchAction: 'none',
              cursor: isBrush
                ? `url("data:image/svg+xml,${cursorSvg}") ${brushSize/2} ${brushSize/2}, crosshair`
                : 'crosshair',
            }}
            onMouseDown={isBrush ? startBrush : handleLassoClick}
            onMouseMove={isBrush ? moveBrush  : handleLassoMove}
            onMouseUp={isBrush ? stopBrush : undefined}
            onMouseLeave={isBrush ? stopBrush : undefined}
            onDblClick={!isBrush ? handleLassoDblClick : undefined}
            onTouchStart={isBrush ? startBrush : undefined}
            onTouchMove={isBrush ? moveBrush  : undefined}
            onTouchEnd={isBrush ? stopBrush  : undefined}
          />
          {/* Overlay lasso: ocupa exactamente el mismo espacio que el canvas */}
          <canvas
            ref={overlayRef}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Cropper custom con handles por lado ───────────────────── */
function CustomCropper({ imageSrc, onCropComplete }) {
  const outerRef  = useRef(null);
  const imgRef    = useRef(null);
  const drag      = useRef(null);

  // caja en % del área de imagen renderizada (0-100)
  const [box, setBox]   = useState({ l: 5, t: 5, r: 95, b: 95 });
  const [nat, setNat]   = useState({ w: 0, h: 0 }); // tamaño natural
  const [outerW, setOuterW] = useState(0);

  const MAX_H = 400;
  const cl    = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
  const MIN   = 3; // mínimo 3% por lado

  // Observar ancho del contenedor externo
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    setOuterW(el.offsetWidth);
    const ro = new ResizeObserver(() => setOuterW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Calcular dimensiones de display (sin letterbox)
  const dispW = (nat.w && outerW)
    ? Math.round(Math.min(outerW, nat.w, (MAX_H / nat.h) * nat.w))
    : 0;
  const dispH = dispW && nat.w ? Math.round(dispW * nat.h / nat.w) : 0;

  // Notificar crop en píxeles originales
  useEffect(() => {
    if (!nat.w || !dispW) return;
    const sx = nat.w / dispW, sy = nat.h / dispH;
    onCropComplete({
      x:      Math.round((box.l / 100) * dispW * sx),
      y:      Math.round((box.t / 100) * dispH * sy),
      width:  Math.round(((box.r - box.l) / 100) * dispW * sx),
      height: Math.round(((box.b - box.t) / 100) * dispH * sy),
    });
  }, [box, nat, dispW, dispH]);

  // Convertir coords del mouse a % sobre la imagen
  const getPct = (clientX, clientY) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const r = img.getBoundingClientRect();
    return {
      x: cl((clientX - r.left) / r.width  * 100, 0, 100),
      y: cl((clientY - r.top)  / r.height * 100, 0, 100),
    };
  };

  const startDrag = (e, handle) => {
    e.preventDefault(); e.stopPropagation();
    const src = e.touches ? e.touches[0] : e;
    const { x, y } = getPct(src.clientX, src.clientY);
    drag.current = { handle, sx: x, sy: y, sb: { ...box } };
  };

  // Global move / up
  useEffect(() => {
    const mv = (e) => {
      if (!drag.current) return;
      const src = e.touches ? e.touches[0] : e;
      const { x, y } = getPct(src.clientX, src.clientY);
      const dx = x - drag.current.sx, dy = y - drag.current.sy;
      const { l, t, r, b } = drag.current.sb;
      setBox(() => {
        let nl = l, nt = t, nr = r, nb = b;
        switch (drag.current.handle) {
          case 'l':  nl = cl(l + dx, 0, r - MIN); break;
          case 'r':  nr = cl(r + dx, l + MIN, 100); break;
          case 't':  nt = cl(t + dy, 0, b - MIN); break;
          case 'b':  nb = cl(b + dy, t + MIN, 100); break;
          case 'tl': nl = cl(l+dx,0,r-MIN); nt = cl(t+dy,0,b-MIN); break;
          case 'tr': nr = cl(r+dx,l+MIN,100); nt = cl(t+dy,0,b-MIN); break;
          case 'bl': nl = cl(l+dx,0,r-MIN); nb = cl(b+dy,t+MIN,100); break;
          case 'br': nr = cl(r+dx,l+MIN,100); nb = cl(b+dy,t+MIN,100); break;
          case 'mv': {
            const w = r - l, h = b - t;
            nl = cl(l+dx,0,100-w); nr = nl+w;
            nt = cl(t+dy,0,100-h); nb = nt+h;
            break;
          }
        }
        return { l: nl, t: nt, r: nr, b: nb };
      });
    };
    const up = () => { drag.current = null; };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup',   up);
    window.addEventListener('touchmove', mv, { passive: false });
    window.addEventListener('touchend',  up);
    return () => {
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup',   up);
      window.removeEventListener('touchmove', mv);
      window.removeEventListener('touchend',  up);
    };
  }, []);

  // Dimensiones visibles del recorte en px originales
  const pxW = nat.w && dispW ? Math.round(((box.r - box.l) / 100) * nat.w) : 0;
  const pxH = nat.h && dispH ? Math.round(((box.b - box.t) / 100) * nat.h) : 0;

  // Estilos de handles
  const HS = 11;
  const corner = (h, cur, top, left) => (
    <div key={h} onMouseDown={e => startDrag(e, h)} onTouchStart={e => startDrag(e, h)}
      style={{
        position: 'absolute', width: HS, height: HS,
        background: '#fff', border: '2px solid #80C2DC', borderRadius: 2,
        cursor: cur, zIndex: 5, top, left, transform: 'translate(-50%,-50%)',
      }} />
  );
  const edgeBar = (h, cur, s) => (
    <div key={h} onMouseDown={e => startDrag(e, h)} onTouchStart={e => startDrag(e, h)}
      style={{
        position: 'absolute', background: '#80C2DC',
        border: '1.5px solid #fff', borderRadius: 3,
        cursor: cur, zIndex: 5, ...s,
      }} />
  );

  return (
    <div ref={outerRef} style={{
      background: '#1a1a1a', borderRadius: 12, userSelect: 'none',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: 120, overflow: 'hidden',
    }}>
      {/* Imagen oculta para precargar tamaño natural si dispW aún es 0 */}
      {!nat.w && (
        <img src={imageSrc} alt="" onLoad={e => setNat({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }} />
      )}

      {dispW > 0 && (
        <div style={{ position: 'relative', width: dispW, height: dispH, flexShrink: 0 }}>
          {/* Imagen */}
          <img ref={imgRef} src={imageSrc} alt=""
            onLoad={e => setNat({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }}
          />

          {/* Overlay oscuro: 4 tiras fuera del recorte */}
          <div style={{ position:'absolute', left:`${box.l}%`, top:0, width:`${box.r-box.l}%`, height:`${box.t}%`, background:'rgba(0,0,0,.6)', pointerEvents:'none', zIndex:1 }}/>
          <div style={{ position:'absolute', left:`${box.l}%`, top:`${box.b}%`, width:`${box.r-box.l}%`, height:`${100-box.b}%`, background:'rgba(0,0,0,.6)', pointerEvents:'none', zIndex:1 }}/>
          <div style={{ position:'absolute', left:0, top:0, width:`${box.l}%`, height:'100%', background:'rgba(0,0,0,.6)', pointerEvents:'none', zIndex:1 }}/>
          <div style={{ position:'absolute', left:`${box.r}%`, top:0, width:`${100-box.r}%`, height:'100%', background:'rgba(0,0,0,.6)', pointerEvents:'none', zIndex:1 }}/>

          {/* Caja de recorte */}
          <div onMouseDown={e => startDrag(e, 'mv')} onTouchStart={e => startDrag(e, 'mv')}
            style={{
              position: 'absolute',
              left: `${box.l}%`, top: `${box.t}%`,
              width: `${box.r - box.l}%`, height: `${box.b - box.t}%`,
              border: '1.5px solid #80C2DC', boxSizing: 'border-box',
              cursor: 'move', zIndex: 2,
            }}>

            {/* Grid tercios */}
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gridTemplateRows:'1fr 1fr 1fr' }}>
              {Array.from({length:9}).map((_,i) => <div key={i} style={{ border:'0.5px solid rgba(255,255,255,.18)' }} />)}
            </div>

            {/* Dimensiones en el centro */}
            <div style={{
              position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
              pointerEvents:'none', background:'rgba(0,0,0,.6)',
              color:'#80C2DC', fontSize:11, fontWeight:700,
              padding:'2px 8px', borderRadius:5, whiteSpace:'nowrap', zIndex:3,
            }}>
              {pxW} × {pxH} px
            </div>

            {/* Handles esquinas */}
            {corner('tl','nw-resize','0%','0%')}
            {corner('tr','ne-resize','0%','100%')}
            {corner('bl','sw-resize','100%','0%')}
            {corner('br','se-resize','100%','100%')}

            {/* Handles lados — barras anchas, fáciles de agarrar */}
            {edgeBar('t','n-resize', { top:0,     left:'15%', width:'70%', height:9, transform:'translateY(-50%)' })}
            {edgeBar('b','s-resize', { top:'100%',left:'15%', width:'70%', height:9, transform:'translateY(-50%)' })}
            {edgeBar('l','w-resize', { left:0,    top:'15%', width:9, height:'70%', transform:'translateX(-50%)' })}
            {edgeBar('r','e-resize', { left:'100%',top:'15%', width:9, height:'70%', transform:'translateX(-50%)' })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Preview en tarjeta ─────────────────────────────────────── */
function PreviewEnTarjeta({ activeSrc, croppedAreaPixels, categoria, nombreBase }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generando, setGenerando]   = useState(false);

  const generar = useCallback(async () => {
    if (!activeSrc) return;
    setGenerando(true);
    try {
      let blob;
      if (croppedAreaPixels && croppedAreaPixels.width > 10) {
        blob = await cropImageToBlob(activeSrc, croppedAreaPixels);
      } else if (activeSrc.startsWith('data:')) {
        blob = dataURLToBlob(activeSrc);
      } else {
        const r = await fetch(activeSrc);
        blob = await r.blob();
      }
      const url = URL.createObjectURL(blob);
      setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch { /* silencioso */ }
    setGenerando(false);
  }, [activeSrc, croppedAreaPixels]);

  useEffect(() => { generar(); }, [generar]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '10px 0 20px' }}>
      <button onClick={generar} disabled={generando}
        style={{
          padding: '7px 22px', borderRadius: 9, background: T.brand, color: '#fff',
          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
          opacity: generando ? .7 : 1,
        }}>
        {generando ? '⏳ Actualizando...' : '🔄 Actualizar vista previa'}
      </button>
      <p style={{ margin: 0, fontSize: 11, color: T.textLight }}>Así se verá en el catálogo:</p>
      <TarjetaProducto
        imageSrc={previewUrl || activeSrc}
        categoria={categoria}
        nombre={nombreBase}
      />
    </div>
  );
}

/* ─── Modal Principal ─────────────────────────────────────────── */
export default function ImageEditorModal({ imageSrc, categoria, nombreBase, onSave, onCancel }) {
  const [activeTab, setActiveTab]             = useState('recortar');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving]               = useState(false);
  const [errorMsg, setErrorMsg]               = useState('');
  const [erasedSrc, setErasedSrc]             = useState(null);

  const activeSrc = erasedSrc || imageSrc;

  const cat = (categoria || '').toLowerCase();
  const catNorm = cat.includes('vidrio') ? 'vidrios'
                : cat.includes('aluminio') ? 'aluminios'
                : cat.includes('accesorio') ? 'accesorios' : 'otro';

  const onCropComplete = useCallback((pixels) => setCroppedAreaPixels(pixels), []);

  // ── Construir Blob desde imagen activa (DataURL o URL) ───────
  const buildBlob = async (withCrop) => {
    if (withCrop && croppedAreaPixels && croppedAreaPixels.width > 10) {
      return cropImageToBlob(activeSrc, croppedAreaPixels);
    }
    if (activeSrc.startsWith('data:')) return dataURLToBlob(activeSrc);
    const r = await fetch(activeSrc);
    return r.blob();
  };

  const handleGuardar = async () => {
    if (!croppedAreaPixels || croppedAreaPixels.width < 10 || croppedAreaPixels.height < 10)
      return setErrorMsg('El área recortada es muy pequeña.');
    setIsSaving(true); setErrorMsg('');
    try {
      const blob   = await buildBlob(true);
      const result = await guardarImagenEditada(blob, catNorm, nombreBase || 'img');
      onSave(result.url, { path: result.path, crop: croppedAreaPixels });
    } catch (e) { setErrorMsg(e.message || 'Error guardando imagen'); }
    finally     { setIsSaving(false); }
  };

  const handleUsarSinRecortar = async () => {
    setIsSaving(true); setErrorMsg('');
    try {
      const blob   = await buildBlob(false);
      const result = await guardarImagenEditada(blob, catNorm, nombreBase || 'img');
      onSave(result.url, { path: result.path });
    } catch (e) { setErrorMsg(e.message || 'Error guardando imagen'); }
    finally     { setIsSaving(false); }
  };

  const TABS = [
    { id: 'recortar', label: '✂️ Recortar' },
    { id: 'borrar',   label: '🖌️ Borrar zonas' },
    { id: 'preview',  label: '🪟 Vista en tarjeta' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: T.bg, borderRadius: 18, boxShadow: T.shadow,
        width: '100%', maxWidth: 800,
        display: 'flex', flexDirection: 'column', maxHeight: '93vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '15px 22px 13px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: T.text }}>🖼️ Editor de imagen</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textLight }}>
              {categoria || 'Producto'} · recortar · borrar zonas · vista previa
              {erasedSrc && (
                <span style={{
                  marginLeft: 8, padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(90,139,168,.15)', color: T.brand, fontWeight: 700, fontSize: 10,
                }}>🖌️ Borrador activo</span>
              )}
            </p>
          </div>
          <button onClick={onCancel}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22, color: T.textLight }}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? '#fff' : 'rgba(128,194,220,.07)',
                borderBottom: activeTab === tab.id ? `3px solid ${T.red}` : '3px solid transparent',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13, color: activeTab === tab.id ? T.text : T.textLight,
                transition: 'all .15s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflow: 'auto' }}>

          {/* Tab Recortar */}
          {activeTab === 'recortar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
              <p style={{ margin: 0, fontSize: 11, color: T.textLight }}>
                Arrastra los <strong>lados</strong> o <strong>esquinas</strong> para ajustar el recorte · Arrastra el interior para moverlo
              </p>
              <CustomCropper imageSrc={activeSrc} onCropComplete={onCropComplete} />
              {croppedAreaPixels && (
                <p style={{ margin: 0, fontSize: 10, color: T.textLight }}>
                  Recorte: {croppedAreaPixels.width} × {croppedAreaPixels.height} px
                  &nbsp;·&nbsp; posición ({croppedAreaPixels.x}, {croppedAreaPixels.y})
                </p>
              )}
            </div>
          )}

          {/* Tab Borrar */}
          {activeTab === 'borrar' && (
            <div style={{ padding: 20 }}>
              <EraserTool imageSrc={imageSrc} onImageChange={setErasedSrc} />
            </div>
          )}

          {/* Tab Preview */}
          {activeTab === 'preview' && (
            <PreviewEnTarjeta
              activeSrc={activeSrc}
              croppedAreaPixels={croppedAreaPixels}
              categoria={categoria}
              nombreBase={nombreBase}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '13px 22px', borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
        }}>
          {errorMsg
            ? <p style={{ margin: 0, color: T.red, fontSize: 12, fontWeight: 600 }}>⚠ {errorMsg}</p>
            : <span style={{ fontSize: 11, color: T.textLight }}>
                {erasedSrc ? '🖌️ Borrador aplicado — los cambios se incluirán al guardar' : 'Selecciona un área o usa "Usar sin recortar"'}
              </span>
          }
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} disabled={isSaving}
              style={{
                padding: '9px 20px', borderRadius: 10, border: `1.5px solid ${T.border}`,
                background: 'transparent', color: T.textLight, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>Cancelar</button>

            <button onClick={handleUsarSinRecortar} disabled={isSaving}
              style={{
                padding: '9px 20px', borderRadius: 10, border: `1.5px solid ${T.border}`,
                background: 'rgba(90,139,168,.10)', color: T.brand,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
              {isSaving ? '⏳...' : 'Usar sin recortar'}
            </button>

            <button onClick={handleGuardar} disabled={isSaving || !croppedAreaPixels}
              style={{
                padding: '9px 26px', borderRadius: 10, border: 'none',
                background: isSaving ? '#aaa' : T.red, color: '#fff',
                fontWeight: 700, fontSize: 13,
                cursor: isSaving || !croppedAreaPixels ? 'not-allowed' : 'pointer',
                opacity: !croppedAreaPixels ? .55 : 1,
              }}>
              {isSaving ? '⏳ Guardando...' : '💾 Guardar recorte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
