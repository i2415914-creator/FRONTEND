import React from 'react';
import { FONTS } from '../../colors';
import { IconTable, IconCards } from '@tabler/icons-react';

const FH = FONTS.heading;

const CSS_TIPO = `
@keyframes tipoOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes tipoCardIn {
  from { opacity: 0; transform: scale(.84) perspective(800px) rotateX(10deg) translateY(20px); }
  to   { opacity: 1; transform: scale(1)   perspective(800px) rotateX(0deg)  translateY(0);   }
}
@keyframes tipoShine {
  0%   { transform: translateX(-120%) skewX(-14deg); opacity: 0; }
  15%  { opacity: .55; }
  100% { transform: translateX(280%)  skewX(-14deg); opacity: 0; }
}
@keyframes tipoBtnIn {
  from { opacity: 0; transform: scale(.88) translateY(10px); }
  to   { opacity: 1; transform: scale(1)   translateY(0);    }
}
.tipo-overlay {
  position: fixed; inset: 0;
  background: rgba(4, 10, 22, .70);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200;
  animation: tipoOverlayIn .20s ease both;
}
.tipo-glass-card {
  position: relative; overflow: hidden;
  background: linear-gradient(148deg,
    rgba(255,255,255,.20) 0%,
    rgba(200,232,248,.16) 45%,
    rgba(170,215,240,.10) 100%
  );
  border: 1.5px solid rgba(255,255,255,.42);
  border-radius: 28px;
  padding: 46px 36px 34px;
  max-width: 500px; width: 92%;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.10) inset,
    0 48px 90px rgba(0,8,28,.55),
    0 12px 28px rgba(0,0,0,.30),
    inset 0 1px 0 rgba(255,255,255,.60);
  backdrop-filter: blur(30px) saturate(190%);
  -webkit-backdrop-filter: blur(30px) saturate(190%);
  animation: tipoCardIn .34s cubic-bezier(.34,1.28,.64,1) both;
}
.tipo-glass-card::before {
  content: '';
  position: absolute;
  top: -1px; left: 12%; right: 12%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.85) 40%, rgba(200,232,255,.75) 60%, transparent);
  border-radius: 2px;
  pointer-events: none;
}
.tipo-glass-card::after {
  content: '';
  position: absolute;
  top: 0; left: -65%; width: 42%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
  animation: tipoShine 5s ease-in-out infinite 1.2s;
  pointer-events: none;
}

/* Base de los botones de accion */
.tipo-accion-btn {
  position: relative; overflow: hidden;
  padding: 20px 12px;
  border-radius: 16px;
  font-weight: 800; font-size: 1.05rem;
  letter-spacing: .5px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35),
    inset 0 -1px 3px rgba(255,255,255,.12),
    0 3px 8px rgba(0,0,0,.18);
  transition: transform .12s ease, box-shadow .12s ease;
  animation: tipoBtnIn .28s ease both;
}
.tipo-accion-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.10) 0%, transparent 52%);
  pointer-events: none;
}

/* Rojo transparente (VARILLA / PLANCHA) */
.tipo-accion-red {
  background: rgba(185, 28, 28, .15);
  border: 1.5px solid rgba(220, 60, 60, .55);
  color: #ff9090;
}
.tipo-accion-red:hover {
  background: rgba(185, 28, 28, .28);
  border-color: rgba(220, 60, 60, .78);
  color: #ffb8b8;
  transform: translateY(-3px);
  box-shadow: inset 0 2px 5px rgba(0,0,0,.25), 0 10px 20px rgba(185,28,28,.28);
}
.tipo-accion-red:active {
  transform: translateY(4px);
  box-shadow: inset 0 5px 12px rgba(0,0,0,.45), 0 1px 3px rgba(0,0,0,.12);
}

/* Celeste transparente (CORTES) */
.tipo-accion-cel {
  background: rgba(128, 194, 220, .15);
  border: 1.5px solid rgba(128, 194, 220, .55);
  color: #a8e0f8;
}
.tipo-accion-cel:hover {
  background: rgba(128, 194, 220, .28);
  border-color: rgba(128, 194, 220, .78);
  color: #ccf0ff;
  transform: translateY(-3px);
  box-shadow: inset 0 2px 5px rgba(0,0,0,.25), 0 10px 20px rgba(128,194,220,.28);
}
.tipo-accion-cel:active {
  transform: translateY(4px);
  box-shadow: inset 0 5px 12px rgba(0,0,0,.45), 0 1px 3px rgba(0,0,0,.12);
}

/* Boton cancelar */
.tipo-cancel-btn {
  width: 100%; padding: 14px;
  border-radius: 14px;
  border: 1.5px solid rgba(255,255,255,.28);
  background: rgba(255,255,255,.10);
  color: rgba(255,255,255,.72);
  font-weight: 600; font-size: .95rem;
  cursor: pointer;
  transition: background .14s, color .14s, border-color .14s;
  box-shadow: inset 0 1px 3px rgba(0,0,0,.22);
}
.tipo-cancel-btn:hover {
  background: rgba(255,255,255,.20);
  color: #fff;
  border-color: rgba(255,255,255,.50);
}
`;

const ModalTipoProductoVidrio = ({
  producto,
  tipoProducto,
  onPlancha,
  onVara,
  onCortes,
  onCancel
}) => {
  const esAluminio = tipoProducto === 'ALUMINIOS';
  const esVidrio   = tipoProducto === 'VIDRIOS';

  return (
    <>
      <style>{CSS_TIPO}</style>
      <div
        className="tipo-overlay"
        onClick={e => { if (e.target === e.currentTarget) onCancel?.(); }}
      >
        <div className="tipo-glass-card">
          <h2 style={{
            fontFamily: FH,
            fontSize: '1.7rem',
            color: '#fff',
            marginBottom: '8px',
            textAlign: 'center',
            textShadow: '0 2px 10px rgba(0,0,0,.45)',
            fontWeight: 800,
          }}>
            {esAluminio ? 'Aluminio' : esVidrio ? 'Vidrio' : '?'} — ¿Cómo lo agregas?
          </h2>

          <p style={{
            color: 'rgba(255,255,255,.68)',
            textAlign: 'center',
            marginBottom: '34px',
            fontSize: '1rem',
            fontFamily: FH,
            textShadow: '0 1px 4px rgba(0,0,0,.30)',
          }}>
            {producto?.nombre || 'Producto seleccionado'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            marginBottom: '16px',
          }}>
            {esVidrio && (
              <button
                className="tipo-accion-btn tipo-accion-red"
                style={{ animationDelay: '60ms' }}
                onClick={() => onPlancha?.(producto)}
              >
                <IconTable stroke={1.25} size={20} /> PLANCHA
              </button>
            )}

            {esAluminio && (
              <button
                className="tipo-accion-btn tipo-accion-red"
                style={{ animationDelay: '60ms' }}
                onClick={() => onVara?.(producto)}
              >
                <IconTable stroke={1.25} size={20} /> VARILLA
              </button>
            )}

            <button
              className="tipo-accion-btn tipo-accion-cel"
              style={{ animationDelay: '130ms' }}
              onClick={() => onCortes?.(producto)}
            >
              <IconCards stroke={1.25} size={20} /> CORTES
            </button>
          </div>

          <button className="tipo-cancel-btn" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalTipoProductoVidrio;
