import React from 'react';
import { IconChartBar, IconCreditCard, IconReportMoney } from '@tabler/icons-react';

const METODOS = [
  { id: 'al contado', label: 'Efectivo', from: '#facc15', to: '#eab308', text: '#3a2b00', shadow: 'rgba(250,204,21,.45)', type: 'cash' },
  { id: 'por yape', label: 'Yape', from: '#7c3aed', to: '#4c1d95', text: '#ffffff', shadow: 'rgba(124,58,237,.40)', type: 'yape' },
  { id: 'por tarjeta', label: 'Tarjeta', from: '#80C2DC', to: '#5a8ba8', text: '#ffffff', shadow: 'rgba(128,194,220,.46)', type: 'card' },
];

const CSS_MP = `
@keyframes mpOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes mpCardIn {
  from { opacity: 0; transform: scale(.88) translateY(22px); }
  to   { opacity: 1; transform: scale(1)   translateY(0);    }
}
@keyframes mpItemIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.mp-overlay {
  position: fixed; inset: 0;
  background: rgba(6, 12, 24, .68);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
  animation: mpOverlayIn .18s ease both;
}
.mp-card {
  background: linear-gradient(158deg, rgba(255,255,255,.97) 0%, rgba(235,248,255,.95) 100%);
  border-radius: 26px;
  padding: 38px 28px 28px;
  min-width: 330px; max-width: 94vw;
  box-shadow:
    0 40px 70px rgba(0,0,0,.32),
    0 8px 20px rgba(0,0,0,.15),
    0 1px 0 rgba(255,255,255,.95) inset,
    0 0 0 1.5px rgba(255,255,255,.60);
  animation: mpCardIn .28s cubic-bezier(.34,1.38,.64,1) both;
}
.mp-metodo-btn {
  position: relative; overflow: hidden;
  width: 100%; padding: 15px 20px;
  border-radius: 15px; border: 1.5px solid rgba(255,255,255,.18);
  cursor: pointer;
  font-weight: 800; font-size: 1rem;
  display: flex; align-items: center; gap: 14px;
  letter-spacing: .25px;
  transition: transform .10s ease, filter .12s ease, box-shadow .12s ease;
  box-shadow:
    inset 0 3px 7px rgba(0,0,0,.38),
    inset 0 -1px 2px rgba(255,255,255,.18),
    0 3px 8px rgba(0,0,0,.18);
}
.mp-metodo-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.16) 0%, transparent 55%);
  pointer-events: none;
}
.mp-metodo-btn:hover {
  filter: brightness(1.12);
  transform: translateY(-2px);
  box-shadow:
    inset 0 2px 5px rgba(0,0,0,.28),
    inset 0 -1px 2px rgba(255,255,255,.18),
    0 10px 22px var(--mp-s, rgba(0,0,0,.25));
}
.mp-metodo-btn:active {
  transform: translateY(3px);
  filter: brightness(.9);
  box-shadow:
    inset 0 5px 12px rgba(0,0,0,.48),
    inset 0 1px 2px rgba(255,255,255,.10),
    0 1px 3px rgba(0,0,0,.15);
}
.mp-metodo-btn .mp-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.24));
}
.mp-yape-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 6px;
  background: rgba(255,255,255,.12);
  padding: 2px;
}
.mp-cancel-btn {
  width: 100%; padding: 12px;
  border-radius: 13px;
  border: 1.5px solid rgba(100,140,170,.25);
  background: rgba(128,194,220,.08);
  color: #5a7a90; font-weight: 600; font-size: .95rem;
  cursor: pointer;
  transition: background .14s, color .14s, border-color .14s;
}
.mp-cancel-btn:hover {
  background: rgba(128,194,220,.18);
  color: #1a2a3a;
  border-color: rgba(128,194,220,.45);
}
`;

export default function ModalMetodoPago({ open, onClose, onSelect }) {
  if (!open) return null;

  return (
    <>
      <style>{CSS_MP}</style>
      <div
        className="mp-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="mp-card">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChartBar stroke={1} size={36} color="#5a8ba8" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1a2a3a', letterSpacing: '-.25px' }}>
              Selecciona método de pago
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '.87rem', color: '#8aa8bc', fontWeight: 500 }}>
              Elige cómo deseas realizar tu compra
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '18px' }}>
            {METODOS.map((m, i) => (
              <button
                key={m.id}
                className="mp-metodo-btn"
                style={{
                  background: `linear-gradient(160deg, ${m.from}, ${m.to})`,
                  color: m.text,
                  '--mp-s': m.shadow,
                  animationName: 'mpItemIn',
                  animationDuration: '.22s',
                  animationTimingFunction: 'ease',
                  animationFillMode: 'both',
                  animationDelay: `${i * 70}ms`,
                }}
                onClick={() => onSelect(m.id)}
              >
                <span className="mp-icon">
                  {m.type === 'yape' ? (
                    <img src="/logo yape.png" alt="Yape" className="mp-yape-img" />
                  ) : m.type === 'card' ? (
                    <IconCreditCard stroke={1} size={22} color={m.text} />
                  ) : (
                    <IconReportMoney stroke={1} size={22} color={m.text} />
                  )}
                </span>
                <span>Pagar con {m.label}</span>
              </button>
            ))}
          </div>

          <button className="mp-cancel-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}
