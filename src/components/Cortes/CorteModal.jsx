import React, { useState, useEffect, useRef } from 'react';
import { animate, spring } from 'animejs';

/**
 * CorteModal — vidrio 3D con animación
 * Props: producto, onSelectPlancha, onSelectCorte, onClose
 */
const CorteModal = ({ producto, onSelectPlancha, onSelectCorte, onClose }) => {
  const stock = Number(producto?.cantidad ?? 0);
  const esAluminio = /alumin/i.test(producto?.categoria || '');
  const [cantidad, setCantidad] = useState(1);
  const cardRef = useRef(null);
  const overlayRef = useRef(null);

  /* ── Animación de entrada ── */
  useEffect(() => {
    if (overlayRef.current) {
      animate(overlayRef.current, {
        opacity: [0, 1],
        duration: 320,
        ease: 'linear',
      });
    }
    if (cardRef.current) {
      animate(cardRef.current, {
        opacity:    [0, 1],
        translateY: [24, 0],
        scale:      [0.88, 1],
        ease: spring({ stiffness: 280, damping: 18 }),
      });
    }
  }, []);

  /* ── Animación de salida + acción ── */
  const closeWithAnim = (cb) => {
    const done = () => { if (cb) cb(); };
    if (cardRef.current) {
      animate(cardRef.current, {
        opacity:    [1, 0],
        translateY: [0, 16],
        scale:      [1, 0.92],
        duration: 220,
        ease: 'out(2)',
        onComplete: done,
      });
    } else { done(); }
  };

  /* ── Efecto vidrio: seguir mouse para brillo 3D ── */
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * 10;
    cardRef.current.style.transform = `perspective(900px) rotateX(${-y}deg) rotateY(${x}deg) scale(1.01)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    animate(cardRef.current, {
      rotateX: 0, rotateY: 0, scale: 1,
      ease: spring({ stiffness: 200, damping: 20 }),
      duration: 400,
    });
  };

  if (!producto) return null;

  return (
    <>
      <style>{`
        @keyframes cm-shimmer {
          0%   { transform: translateX(-100%) skewX(-18deg); opacity: 0; }
          25%  { opacity: 0.14; }
          75%  { opacity: 0.10; }
          100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }
        .cm-overlay {
          position: fixed; inset: 0; z-index: 1200;
          background: rgba(8, 18, 36, 0.52);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .cm-card {
          position: relative;
          width: min(440px, 100%);
          border-radius: 22px;
          overflow: hidden;
          /* Fondo vidrio */
          background: linear-gradient(
            145deg,
            rgba(255,255,255,0.22) 0%,
            rgba(255,255,255,0.12) 50%,
            rgba(200,230,255,0.16) 100%
          );
          border: 1px solid rgba(255,255,255,0.42);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.18) inset,
            0 4px 6px rgba(255,255,255,0.22) inset,
            0 32px 64px rgba(10,24,54,0.38),
            0 8px 24px rgba(148,25,24,0.22);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          transform-style: preserve-3d;
          will-change: transform;
        }
        .cm-sheen {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.18) 48%,
            rgba(255,255,255,0.08) 52%,
            transparent 70%
          );
          animation: cm-shimmer 3.8s ease-in-out infinite;
          pointer-events: none; z-index: 1;
        }
        .cm-accent-bar {
          height: 4px;
          background: linear-gradient(90deg, #941918, #80C2DC, #ffd600);
        }
        .cm-body { padding: 28px 28px 24px; position: relative; z-index: 2; }
        .cm-product-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          padding: 5px 12px; border-radius: 999px;
          font-size: 11px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: rgba(255,255,255,0.82);
          margin-bottom: 18px;
        }
        .cm-title {
          font-family: 'Oswald', 'Open Sans', sans-serif;
          font-size: 22px; font-weight: 700; color: #fff;
          margin: 0 0 4px; letter-spacing: .02em; text-transform: uppercase;
        }
        .cm-subtitle {
          font-size: 14px; color: rgba(255,255,255,0.6);
          margin: 0 0 22px; font-family: 'Open Sans', sans-serif;
        }
        .cm-subtitle strong { color: rgba(255,255,255,0.92); font-weight: 600; }
        .cm-qty-label {
          font-size: 11px; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: rgba(255,255,255,0.55);
          margin-bottom: 8px; font-family: 'Open Sans', sans-serif;
        }
        .cm-qty-wrap {
          display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
        }
        .cm-qty-step {
          width: 34px; height: 34px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.14);
          color: #fff; font-size: 18px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .18s;
          backdrop-filter: blur(4px);
        }
        .cm-qty-step:hover { background: rgba(255,255,255,0.26); }
        .cm-qty-input {
          width: 64px; padding: 8px 10px;
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: 10px;
          background: rgba(255,255,255,0.12);
          color: #fff; font-size: 16px; font-weight: 700;
          text-align: center; outline: none;
          backdrop-filter: blur(4px);
          transition: border-color .18s;
        }
        .cm-qty-input:focus { border-color: rgba(128,194,220,0.7); }
        .cm-qty-input::placeholder { color: rgba(255,255,255,0.35); }
        .cm-divider {
          height: 1px;
          background: rgba(255,255,255,0.14);
          margin: 0 0 20px;
        }
        .cm-btn {
          width: 100%; padding: 14px;
          border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700; letter-spacing: .06em;
          text-transform: uppercase; cursor: pointer;
          font-family: 'Open Sans', sans-serif;
          transition: transform .2s, box-shadow .2s, filter .2s;
          margin-bottom: 10px;
          position: relative; overflow: hidden;
        }
        .cm-btn:last-child { margin-bottom: 0; }
        .cm-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .cm-btn:active { transform: translateY(0); }
        .cm-btn-plancha {
          background: linear-gradient(135deg, #941918 0%, #c94543 100%);
          color: #fff;
          box-shadow: 0 8px 24px rgba(148,25,24,0.45);
        }
        .cm-btn-plancha:hover { box-shadow: 0 12px 32px rgba(148,25,24,0.6); }
        .cm-btn-corte {
          background: linear-gradient(135deg, #1a6fa8 0%, #80C2DC 100%);
          color: #fff;
          box-shadow: 0 8px 24px rgba(128,194,220,0.38);
        }
        .cm-btn-corte:hover { box-shadow: 0 12px 32px rgba(128,194,220,0.55); }
        .cm-btn-cancel {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.22) !important;
          color: rgba(255,255,255,0.65);
          box-shadow: none;
          font-size: 13px;
        }
        .cm-btn-cancel:hover { background: rgba(255,255,255,0.18); color: #fff; }
        .cm-btn-icon { margin-right: 8px; font-size: 16px; }
      `}</style>

      {/* Overlay borroso */}
      <div ref={overlayRef} className="cm-overlay" style={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) closeWithAnim(onClose); }}>

        {/* Card vidrio 3D */}
        <div
          ref={cardRef}
          className="cm-card"
          style={{ opacity: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Brillo deslizante */}
          <div className="cm-sheen" />

          {/* Barra de color */}
          <div className="cm-accent-bar" />

          <div className="cm-body">
            {/* Badge producto */}
            <div className="cm-product-badge">
              <span>{producto?.categoria || 'Vidrio / Aluminio'}</span>
            </div>

            <h2 className="cm-title">Tipo de compra</h2>
            <p className="cm-subtitle">
              Producto: <strong>{producto?.nombre}</strong>
            </p>

            {/* Cantidad */}
            <div className="cm-qty-label">Cantidad</div>
            <div className="cm-qty-wrap">
              <button className="cm-qty-step"
                onClick={() => setCantidad(q => Math.max(1, q - 1))}>−</button>
              <input
                className="cm-qty-input"
                type="number" min={1} max={stock > 0 ? stock : undefined} step={1} value={cantidad}
                onChange={e => {
                  const v = Math.max(1, Math.floor(Number(e.target.value) || 1));
                  setCantidad(stock > 0 ? Math.min(v, stock) : v);
                }}
                onKeyDown={e => { if (e.key === '.' || e.key === ',') e.preventDefault(); }}
              />
              <button className="cm-qty-step"
                style={{ opacity: stock > 0 && cantidad >= stock ? 0.38 : 1 }}
                disabled={stock > 0 && cantidad >= stock}
                onClick={() => setCantidad(q => stock > 0 ? Math.min(q + 1, stock) : q + 1)}>+</button>
            </div>

            <div className="cm-divider" />

            {/* Botones */}
            <button className="cm-btn cm-btn-plancha"
              onClick={() => closeWithAnim(() => onSelectPlancha(cantidad))}>
              <span className="cm-btn-icon">▦</span>
              {esAluminio ? 'Comprar barra completa' : 'Comprar plancha completa'}
            </button>

            <button className="cm-btn cm-btn-corte"
              onClick={() => closeWithAnim(onSelectCorte)}>
              <span className="cm-btn-icon">✂</span>
              Introducir cortes
            </button>

            <button className="cm-btn cm-btn-cancel"
              onClick={() => closeWithAnim(onClose)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CorteModal;