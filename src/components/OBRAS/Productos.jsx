import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FONTS } from '../../colors';

import {
  IconRuler, IconLoader, IconCheck, IconPackage,
  IconAlertTriangle, IconPlus, IconBox, IconMapPin,
  IconStack2, IconTool, IconX, IconLayoutDashboard, IconFileText,
  IconPlayerPlay, IconPlayerPause, IconPlayerStop,
} from '@tabler/icons-react';

/* ─── TOKENS (idénticos a Retazo) ────────────────────────────────────────── */
const T = {
  glassBg:    'rgba(255,255,255,.65)',
  glassBgMid: 'rgba(255,255,255,.85)',
  glassBlur:  'blur(20px)',
  glassSat:   'saturate(180%)',
  border:     'rgba(128,194,220,.22)',
  borderMid:  'rgba(128,194,220,.38)',
  borderStr:  'rgba(128,194,220,.60)',
  brand:      '#5a8ba8',
  brandMid:   '#80C2DC',
  brandLight: '#a8d9ed',
  brandSoft:  'rgba(128,194,220,.12)',
  brandSoft2: 'rgba(128,194,220,.20)',
  red:        '#941918',
  redMid:     '#b01f1e',
  redSoft:    'rgba(148,25,24,.10)',
  warning:    '#c47c0a',
  warningSoft:'rgba(196,124,10,.10)',
  warningBorder:'rgba(196,124,10,.30)',
  success:    '#1a7a4a',
  successSoft:'rgba(26,122,74,.10)',
  successBorder:'rgba(26,122,74,.30)',
  error:      '#941918',
  errorSoft:  'rgba(148,25,24,.08)',
  errorBorder:'rgba(148,25,24,.25)',
  text:       '#1a2a3a',
  textMid:    '#2d4a62',
  textLight:  '#5a7a90',
  textDim:    '#8aa8bc',
  white:      '#ffffff',
  fontHead:   FONTS.heading,
  fontBody:   FONTS.body,
  fontMono:   "'IBM Plex Mono',monospace",
  shadow:     '0 6px 24px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset',
};

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@keyframes pdFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pdSpin{to{transform:rotate(360deg)}}
@keyframes pdShine{0%{left:-80%}100%{left:130%}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-18px) scale(.94)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}to{opacity:0;transform:translateX(-50%) translateY(-12px) scale(.96)}}
@keyframes toastShine{0%{left:-80%}100%{left:130%}}
@keyframes toastBar{from{width:100%}to{width:0%}}

/* ── Toast ── */
.pd-toast-wrap{position:fixed;top:28px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:10px;}
.pd-toast{position:relative;overflow:hidden;min-width:300px;max-width:480px;padding:13px 46px 13px 16px;border-radius:14px;pointer-events:all;display:flex;align-items:center;gap:11px;backdrop-filter:blur(24px) saturate(200%);-webkit-backdrop-filter:blur(24px) saturate(200%);box-shadow:0 8px 32px rgba(0,0,0,.14),0 2px 0 rgba(255,255,255,.55) inset;animation:toastIn .32s cubic-bezier(.34,1.56,.64,1) both;}
.pd-toast.exit{animation:toastOut .26s ease both}
.pd-toast.success{background:rgba(128,194,220,.22);border:1.5px solid rgba(128,194,220,.55);}
.pd-toast.success .pd-toast-icon{background:linear-gradient(135deg,rgba(128,194,220,.38),rgba(90,139,168,.28));border:1px solid rgba(128,194,220,.55);color:#2d6a8a;}
.pd-toast.success .pd-toast-bar{background:linear-gradient(90deg,#80C2DC,#5a8ba8);}
.pd-toast.success .pd-toast-text{color:#1a3a52;}
.pd-toast.success .pd-toast-close{color:#5a8ba8;}
.pd-toast.success .pd-toast-close:hover{background:rgba(128,194,220,.22);}
.pd-toast.error{background:rgba(148,25,24,.14);border:1.5px solid rgba(148,25,24,.40);}
.pd-toast.error .pd-toast-icon{background:linear-gradient(135deg,rgba(148,25,24,.22),rgba(176,31,30,.16));border:1px solid rgba(148,25,24,.40);color:#941918;}
.pd-toast.error .pd-toast-bar{background:linear-gradient(90deg,#941918,#b01f1e);}
.pd-toast.error .pd-toast-text{color:#5a1010;}
.pd-toast.error .pd-toast-close{color:#941918;}
.pd-toast.error .pd-toast-close:hover{background:rgba(148,25,24,.14);}
.pd-toast-icon{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.pd-toast-text{flex:1;font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:600;line-height:1.45;}
.pd-toast-close{position:absolute;top:9px;right:10px;width:22px;height:22px;border-radius:6px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.pd-toast-shine{position:absolute;top:0;bottom:0;width:50px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.40),transparent);pointer-events:none;animation:toastShine 2.8s ease infinite;}
.pd-toast-bar-wrap{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,.06);}
.pd-toast-bar{height:100%;border-radius:0 0 14px 14px;animation:toastBar 3.5s linear both;}

.pd-card{
  border-radius:16px;position:relative;overflow:hidden;
  background:rgba(255,255,255,.65);
  backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border:1.5px solid rgba(128,194,220,.38);
  box-shadow:0 6px 24px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset;
  animation:pdFade .28s ease both;
  transition:box-shadow .2s,border-color .2s;
}
.pd-card:hover{
  box-shadow:0 12px 36px rgba(90,139,168,.20),0 2px 0 rgba(255,255,255,.95) inset;
  border-color:rgba(128,194,220,.60);
}

.pd-sec-head{
  padding:12px 18px 11px;
  background:rgba(255,255,255,.40);
  border-bottom:1px solid rgba(128,194,220,.22);
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
}

.pd-input{
  width:100%;padding:9px 13px;
  background:rgba(255,255,255,.72);
  backdrop-filter:blur(12px);
  border:1.5px solid rgba(128,194,220,.38);
  border-radius:10px;
  font-family:'IBM Plex Mono',monospace;font-size:13px;color:#1a2a3a;
  outline:none;transition:border-color .18s,box-shadow .18s;
  box-shadow:inset 0 2px 6px rgba(90,139,168,.07);
  box-sizing:border-box;
}
.pd-input:focus{
  border-color:rgba(128,194,220,.65);
  box-shadow:0 0 0 3px rgba(128,194,220,.14),inset 0 2px 6px rgba(90,139,168,.07);
}
.pd-input::placeholder{color:#8aa8bc}

.pd-select{
  width:100%;padding:8px 30px 8px 11px;
  background:rgba(255,255,255,.72) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235a7a90'/%3E%3C/svg%3E") no-repeat right 10px center;
  backdrop-filter:blur(12px);
  border:1.5px solid rgba(128,194,220,.38);
  border-radius:9px;
  font-family:'IBM Plex Mono',monospace;font-size:12px;color:#1a2a3a;
  appearance:none;cursor:pointer;outline:none;
  box-shadow:inset 0 2px 4px rgba(90,139,168,.07);
  transition:border-color .18s;box-sizing:border-box;
}
.pd-select:focus{border-color:rgba(128,194,220,.65)}

.pd-bar-track{
  height:10px;border-radius:999px;overflow:hidden;
  background:rgba(128,194,220,.15);
  border:1px solid rgba(128,194,220,.25);
}
.pd-bar-fill{
  height:100%;border-radius:999px;
  background:linear-gradient(90deg,#80C2DC,#5a8ba8);
  transition:width .4s cubic-bezier(.4,0,.2,1);
  box-shadow:0 0 10px rgba(128,194,220,.45);
}

.pd-chip{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 10px;border-radius:999px;
  font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;
  background:rgba(128,194,220,.12);border:1px solid rgba(128,194,220,.38);
  color:#5a7a90;
}

.pd-plancha-btn{
  padding:5px 12px;border-radius:9px;cursor:pointer;
  background:rgba(255,255,255,.60);
  border:1.5px solid rgba(128,194,220,.32);
  font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#5a7a90;
  transition:all .18s;white-space:nowrap;
}
.pd-plancha-btn:hover{background:rgba(255,255,255,.82);border-color:rgba(128,194,220,.55)}
.pd-plancha-btn.active{
  background:linear-gradient(135deg,rgba(128,194,220,.22),rgba(90,139,168,.16));
  border-color:rgba(128,194,220,.60);color:#2d4a62;
  box-shadow:0 4px 12px rgba(128,194,220,.20),inset 0 1px 0 rgba(255,255,255,.8);
}

/* Botón guardar idéntico a Retazo */
.pd-save{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 52px;border-radius:13px;cursor:pointer;
  background:linear-gradient(180deg,rgba(148,25,24,.15) 0%,rgba(148,25,24,.24) 100%);
  color:#941918;font-family:var(--fh);font-size:14px;font-weight:700;
  letter-spacing:.5px;
  border:1.5px solid rgba(148,25,24,.32);
  box-shadow:inset 0 3px 8px rgba(148,25,24,.18),inset 0 1px 3px rgba(148,25,24,.10),0 1px 0 rgba(255,255,255,.85);
  transition:all .18s cubic-bezier(.4,0,.2,1);
}
.pd-save:hover:not(:disabled){
  background:linear-gradient(180deg,rgba(148,25,24,.19) 0%,rgba(148,25,24,.29) 100%);
  box-shadow:inset 0 4px 10px rgba(148,25,24,.24),inset 0 1px 4px rgba(148,25,24,.14),0 1px 0 rgba(255,255,255,.85);
}
.pd-save:active:not(:disabled){
  box-shadow:inset 0 5px 14px rgba(148,25,24,.30),inset 0 2px 6px rgba(148,25,24,.18),0 1px 0 rgba(255,255,255,.70);
  transform:translateY(1px);
}
.pd-save:disabled{opacity:.5;cursor:not-allowed}

.pd-btn-add{
  width:100%;padding:10px;border-radius:11px;cursor:pointer;
  background:linear-gradient(180deg,rgba(128,194,220,.10),rgba(128,194,220,.18));
  border:1.5px dashed rgba(128,194,220,.45);
  color:#5a7a90;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;
  display:flex;align-items:center;justify-content:center;gap:6px;
  transition:all .18s;
}
.pd-btn-add:hover{
  background:linear-gradient(180deg,rgba(128,194,220,.18),rgba(128,194,220,.26));
  border-color:rgba(128,194,220,.65);color:#2d4a62;
}

.pd-shine{
  position:absolute;top:0;bottom:0;width:60px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);
  pointer-events:none;z-index:1;
  animation:pdShine 3s ease infinite;
}

.pd-label{
  display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;
  letter-spacing:.8px;color:#8aa8bc;margin-bottom:6px;text-transform:uppercase;
}

.pd-idx{
  width:28px;height:28px;border-radius:8px;flex-shrink:0;
  background:rgba(128,194,220,.12);border:1.5px solid rgba(128,194,220,.38);
  display:flex;align-items:center;justify-content:center;
  font-family:'IBM Plex Mono',monospace;font-weight:800;font-size:11px;color:#5a7a90;
}

.pd-corte-tag{
  display:inline-flex;align-items:center;gap:3px;
  padding:3px 9px;border-radius:999px;
  font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;
  background:linear-gradient(135deg,rgba(128,194,220,.22),rgba(90,139,168,.15));
  border:1px solid rgba(128,194,220,.40);color:#2d4a62;
}

.pd-step{
  display:flex;flex-direction:column;align-items:center;gap:4px;
  position:relative;flex:1;
}
.pd-step-circle{
  width:34px;height:34px;border-radius:50%;
  background:rgba(255,255,255,.72);backdrop-filter:blur(10px);
  border:1.5px solid rgba(128,194,220,.38);
  display:flex;align-items:center;justify-content:center;font-size:15px;
  box-shadow:0 3px 10px rgba(90,139,168,.12),inset 0 1px 0 rgba(255,255,255,.9);
  transition:all .2s;position:relative;z-index:1;
}
.pd-step-line{
  position:absolute;top:17px;left:50%;width:100%;height:1.5px;
  background:linear-gradient(90deg,rgba(128,194,220,.40),rgba(128,194,220,.15));z-index:0;
}
.pd-step-label{font-size:8px;font-family:'IBM Plex Mono',monospace;font-weight:700;color:#8aa8bc;letter-spacing:.5px}

.pd-stock-card{
  padding:8px 12px;border-radius:10px;
  background:rgba(255,255,255,.60);
  border-left:3px solid;
  backdrop-filter:blur(8px);
}

.pd-dual-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.pd-delivery-head{padding:14px 18px 16px;display:grid;grid-template-columns:1fr 2fr 1fr;gap:14px;align-items:start}
.pd-layout-grid{display:grid;grid-template-columns:1.1fr 2fr;gap:14px;margin-bottom:16px}

.pd-no-print{display:block}
.pd-print-root{display:none}
.pd-print-shell{
  background:#ffffff;color:#173244;padding:18px 18px 22px;
}
.pd-print-header{
  display:flex;justify-content:space-between;gap:18px;align-items:flex-start;
  padding:18px 20px 20px;border-radius:24px;
  border:1px solid rgba(128,194,220,.42);
  background:linear-gradient(135deg,rgba(128,194,220,.20) 0%,rgba(255,255,255,.96) 56%,rgba(148,25,24,.06) 100%);
  box-shadow:0 10px 24px rgba(90,139,168,.10);
  margin-bottom:16px;
}
.pd-print-brand{font-family:var(--fh);font-size:26px;font-weight:800;letter-spacing:.08em;color:#173244}
.pd-print-kicker{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#5a7a90;margin-bottom:6px}
.pd-print-title{font-family:var(--fh);font-size:22px;font-weight:800;color:#941918;line-height:1.05}
.pd-print-subtitle{margin-top:8px;font-size:12px;line-height:1.55;color:#486378;max-width:420px}
.pd-print-meta{min-width:220px;display:grid;gap:8px}
.pd-print-meta-card{
  border-radius:18px;border:1px solid rgba(128,194,220,.30);
  background:rgba(255,255,255,.84);padding:11px 14px;
}
.pd-print-meta-label{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8aa8bc;margin-bottom:4px}
.pd-print-meta-value{font-size:12px;font-weight:700;color:#173244;line-height:1.45}
.pd-print-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px}
.pd-print-summary-card{
  border-radius:18px;padding:14px 16px;border:1px solid rgba(128,194,220,.28);
  background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(128,194,220,.10));
}
.pd-print-summary-card.is-accent{
  background:linear-gradient(180deg,rgba(148,25,24,.08),rgba(255,255,255,.98));
  border-color:rgba(148,25,24,.18);
}
.pd-print-summary-label{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8aa8bc;margin-bottom:8px}
.pd-print-summary-value{font-family:var(--fh);font-size:24px;font-weight:800;line-height:1;color:#173244}
.pd-print-summary-note{margin-top:6px;font-size:11px;color:#5a7a90}
.pd-print-section{margin-top:16px;border:1px solid rgba(128,194,220,.24);border-radius:22px;overflow:hidden}
.pd-print-section-head{
  padding:13px 18px;border-bottom:1px solid rgba(128,194,220,.20);
  background:linear-gradient(90deg,rgba(128,194,220,.16),rgba(255,255,255,.94));
}
.pd-print-section-kicker{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8aa8bc;margin-bottom:4px}
.pd-print-section-title{font-family:var(--fh);font-size:17px;font-weight:800;color:#173244}
.pd-print-section-body{padding:16px 18px 18px}
.pd-print-grid{display:grid;grid-template-columns:1.3fr .9fr;gap:12px}
.pd-print-diagram{
  border-radius:18px;border:1px solid rgba(128,194,220,.24);
  background:linear-gradient(180deg,rgba(232,246,252,.52),rgba(255,255,255,.98));
  padding:14px;
}
.pd-print-diagram img{display:block;max-width:100%;max-height:280px;margin:12px auto 0;object-fit:contain}
.pd-print-diagram-title{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#5a7a90}
.pd-print-note{
  border-radius:16px;padding:14px 16px;background:rgba(128,194,220,.10);
  border:1px dashed rgba(128,194,220,.34);font-size:12px;color:#5a7a90;line-height:1.6;
}
.pd-print-note.is-alert{background:rgba(148,25,24,.06);border-color:rgba(148,25,24,.22);color:#7a2d2d}
.pd-print-table-wrap{overflow:hidden;border-radius:18px;border:1px solid rgba(128,194,220,.22)}
.pd-print-table{width:100%;border-collapse:collapse;background:#fff}
.pd-print-table thead th{
  padding:11px 12px;background:#173244;color:#fff;text-align:left;
  font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
}
.pd-print-table tbody td{padding:11px 12px;border-bottom:1px solid rgba(128,194,220,.14);font-size:12px;color:#173244;vertical-align:top}
.pd-print-table tbody tr:nth-child(even) td{background:rgba(128,194,220,.06)}
.pd-print-table tbody tr:last-child td{border-bottom:none}
.pd-print-strong{font-weight:800;color:#173244}
.pd-print-muted{color:#5a7a90}
.pd-print-pill-list{display:flex;flex-wrap:wrap;gap:6px}
.pd-print-pill{
  display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;
  background:rgba(128,194,220,.12);border:1px solid rgba(128,194,220,.24);
  font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:#2d4a62;
}
.pd-print-totals{display:grid;gap:8px}
.pd-print-total-row{
  display:flex;justify-content:space-between;gap:12px;align-items:center;
  padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.9);
  border:1px solid rgba(128,194,220,.18);
}
.pd-print-total-row strong{font-size:12px;color:#173244}
.pd-print-total-row span{font-family:var(--fh);font-size:18px;font-weight:800;color:#941918}
.pd-print-footer{
  margin-top:18px;padding-top:12px;border-top:1px solid rgba(128,194,220,.24);
  display:flex;justify-content:space-between;gap:14px;font-size:11px;color:#6b8799;
}

@page{size:A4 portrait;margin:12mm}
@media print{
  html,body{background:#ffffff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pd-no-print{display:none !important}
  .pd-print-root{display:block !important}
  .pd-print-shell{padding:0}
  .pd-print-section{break-inside:avoid-page;page-break-inside:avoid}
  .pd-print-table-wrap{break-inside:auto}
}

@media (max-width: 900px){
  .pd-dual-grid{grid-template-columns:1fr}
  .pd-delivery-head{grid-template-columns:1fr;padding:12px}
  .pd-layout-grid{grid-template-columns:1fr}
  .pd-print-summary{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pd-print-grid{grid-template-columns:1fr}
  .pd-print-header{flex-direction:column}
  .pd-print-meta{min-width:0;width:100%}
}
`;

let _css = false;
function injectCSS() {
  if (_css || typeof document === 'undefined') return;
  _css = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─── Toast item ──────────────────────────────────────────────────────────── */
function ToastItem({ id, mensaje, tipo, onClose }) {
  const [exiting, setExiting] = useState(false);
  const handleClose = () => { setExiting(true); setTimeout(() => onClose(id), 260); };
  return (
    <div className={`pd-toast ${tipo}${exiting ? ' exit' : ''}`}>
      <div className="pd-toast-shine"/>
      <div className="pd-toast-icon">
        {tipo === 'success' ? <IconCheck size={15}/> : <IconAlertTriangle size={15}/>}
      </div>
      <span className="pd-toast-text">{mensaje}</span>
      <button className="pd-toast-close" onClick={handleClose}><IconX size={12}/></button>
      <div className="pd-toast-bar-wrap"><div className="pd-toast-bar"/></div>
    </div>
  );
}

/* ─── SeguimientoTrack ────────────────────────────────────────────────────── */
function SeguimientoTrack() {
  const steps = [
    { icon: '🚚', label: 'DESPACHO' },
    { icon: '💼', label: 'LISTO'    },
    { icon: '🚛', label: 'EN RUTA'  },
    { icon: '🏠', label: 'ENTREGADO'},
    { icon: '📋', label: 'FIRMADO'  },
  ];
  return (
    <div style={{ display:'flex', alignItems:'flex-start', padding:'8px 4px 2px', position:'relative' }}>
      {steps.map((s, i) => (
        <div key={i} className="pd-step">
          {i < steps.length - 1 && <div className="pd-step-line"/>}
          <div className="pd-step-circle">{s.icon}</div>
          <span className="pd-step-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── BarraAluminioSVG ───────────────────────────────────────────────────── */
function BarraAluminioSVG({ cortes, largoBarraCm, svgRef }) {
  const PALETTE = [
    ['#80C2DC','#5a8ba8'],['#a8d9ed','#80C2DC'],
    ['#5a8ba8','#3a6a88'],['#c5e8f4','#a0cce0'],['#3a6a88','#1a4a68'],
  ];
  let xPos = 0;
  return (
    <svg ref={svgRef} width="100%" height="56"
      viewBox={`0 0 ${largoBarraCm} 56`} preserveAspectRatio="none"
      style={{ borderRadius:10, overflow:'hidden', display:'block' }}>
      <defs>
        {PALETTE.map(([c1,c2],i) => (
          <linearGradient key={i} id={`pg-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c1} stopOpacity=".92"/>
            <stop offset="100%" stopColor={c2} stopOpacity=".78"/>
          </linearGradient>
        ))}
        <linearGradient id="pgBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,246,252,.80)"/>
          <stop offset="100%" stopColor="rgba(210,236,248,.60)"/>
        </linearGradient>
      </defs>
      <rect x="0" y="18" width={largoBarraCm} height="20" rx="4"
        fill="url(#pgBg)" stroke="rgba(128,194,220,.40)" strokeWidth="1"/>
      {cortes.map((corte, idx) => {
        const w = (corte.largo_cm / largoBarraCm) * largoBarraCm;
        const x = xPos; xPos += w;
        return (
          <g key={corte._pieceId || `corte-${idx}`}>
            <rect x={x+1} y={19} width={w-2} height={18} rx="3"
              fill={`url(#pg-${idx % PALETTE.length})`}
              stroke="rgba(255,255,255,.55)" strokeWidth=".8"/>
            <rect x={x+2} y={19} width={w-4} height={5} rx="2"
              fill="rgba(255,255,255,.35)"/>
            {w > 22 && (
              <text x={x+w/2} y={31} fontSize="9" fill="white"
                textAnchor="middle" fontWeight="700"
                style={{ fontFamily:"'IBM Plex Mono',monospace" }}>
                {corte.largo_cm}
              </text>
            )}
          </g>
        );
      })}
      <text x="2" y="52" fontSize="8" fill="rgba(90,139,168,.70)"
        style={{ fontFamily:"'IBM Plex Mono',monospace" }}>0</text>
      <text x={largoBarraCm-2} y="52" fontSize="8" fill="rgba(90,139,168,.70)"
        textAnchor="end" style={{ fontFamily:"'IBM Plex Mono',monospace" }}>
        {largoBarraCm}
      </text>
    </svg>
  );
}

const COLORES_CORTE = ['#90aec8','#8db8a2','#c8b48a','#a89fc8','#8ab5c4','#c8a4a4','#a4adc8','#8ab8ac'];
const COLORES_FILL  = ['rgba(219,234,254,0.32)','rgba(220,252,231,0.32)','rgba(254,243,199,0.32)','rgba(237,233,254,0.32)','rgba(207,250,254,0.32)','rgba(255,228,230,0.32)','rgba(224,231,255,0.32)','rgba(209,250,229,0.32)'];

/* ─── BarraInteractiva — drag/remove/place 1D + diseño profesional ──────── */
const BarraInteractiva = ({
  barraId, cortes = [], largoBarraCm = 300,
  cortePendienteAl = null, svgRef = null,
  onMoveCorte, onRemove, onPlace,
}) => {
  const VIEW_W = 560;
  const BAR_Y  = 10;
  const BAR_H  = 28;
  const VIEW_H = BAR_Y + BAR_H + 14;
  const sc     = VIEW_W / largoBarraCm;

  const svgEl = useRef(null);
  const drag  = useRef({ active: false, idx: -1, ox: 0 });
  const [dragX,    setDragX]   = useState(null);
  const [hoverIdx, setHoverIdx] = useState(-1);

  const buildLocal = (cs) => {
    let x = 0;
    return cs.map(c => { const r = { ...c, _x: (c._x != null ? c._x : x) }; x += c.largo_cm; return r; });
  };
  const [localCortes, setLocal] = useState(() => buildLocal(cortes));
  useEffect(() => { setLocal(buildLocal(cortes)); }, [cortes]); // eslint-disable-line react-hooks/exhaustive-deps

  const toSVGX = (e) => {
    const el = svgEl.current; if (!el) return null;
    const r = el.getBoundingClientRect();
    return (e.clientX - r.left) / r.width * VIEW_W;
  };

  const snapX = (v, w) => Math.max(0, Math.min(largoBarraCm - w, Math.round(v * 2) / 2));

  const startDrag = (e, idx) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const sx2 = toSVGX(e); if (sx2 === null) return;
    drag.current = { active: true, idx, ox: sx2 - localCortes[idx]._x * sc };
    setDragX({ idx, x: localCortes[idx]._x });
  };

  const onMove = (e) => {
    if (!drag.current.active) return;
    const sx2 = toSVGX(e); if (sx2 === null) return;
    const { idx, ox } = drag.current;
    const nx = snapX((sx2 - ox) / sc, localCortes[idx].largo_cm);
    setDragX({ idx, x: nx });
  };

  const onUp = (e) => {
    if (!drag.current.active) return;
    const { idx } = drag.current;
    if (dragX) {
      const updated = localCortes.map((c, i) => i === idx ? { ...c, _x: dragX.x } : c);
      setLocal(updated);
      onMoveCorte?.(idx, dragX.x);
    }
    drag.current.active = false;
    setDragX(null);
  };

  const onLeave = () => {
    setHoverIdx(-1);
    if (!drag.current.active) return;
    const { idx } = drag.current;
    onRemove?.(localCortes[idx], idx);
    drag.current.active = false;
    setDragX(null);
  };

  const clickSVG = (e) => {
    if (drag.current.active || !cortePendienteAl) return;
    const sx2 = toSVGX(e); if (sx2 === null) return;
    onPlace?.({ ...cortePendienteAl, _x: snapX(sx2 / sc, cortePendienteAl.largo_cm) });
  };

  const totalUsado = localCortes.reduce((s, c) => s + c.largo_cm, 0);
  const retazoCm   = largoBarraCm - totalUsado;
  const uid        = `bi-${barraId}`;

  const cuts = localCortes.map((c, i) => ({
    ...c, _i: i,
    _x: dragX?.idx === i ? dragX.x : c._x,
  }));

  return (
    <svg ref={el => { svgEl.current = el; if (svgRef) svgRef.current = el; }}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%"
      style={{ display:'block', cursor: drag.current.active ? 'grabbing' : cortePendienteAl ? 'crosshair' : 'default', userSelect:'none', borderRadius:6 }}
      onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onLeave} onClick={clickSVG}>
      <defs>
        <linearGradient id={`bi-bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,246,252,.80)"/>
          <stop offset="100%" stopColor="rgba(210,236,248,.60)"/>
        </linearGradient>
      </defs>

      {/* Fondo barra */}
      <rect x={0} y={BAR_Y} width={VIEW_W} height={BAR_H}
        fill={`url(#bi-bg-${uid})`} stroke="rgba(128,194,220,.50)" strokeWidth={1} rx={5}/>

      {/* Marcas de regla */}
      {[0,50,100,150,200,250,300].filter(v => v <= largoBarraCm).map(v => (
        <g key={v}>
          <line x1={v*sc} y1={BAR_Y+BAR_H} x2={v*sc} y2={BAR_Y+BAR_H+5} stroke="#A0AEC0" strokeWidth={0.7}/>
          <text x={v*sc+1} y={VIEW_H-1} fontSize={6.5} fill="#A0AEC0" fontFamily="monospace">{v}</text>
        </g>
      ))}

      {/* Ghost corte pendiente */}
      {cortePendienteAl && (
        <rect x={1} y={BAR_Y+1} width={Math.max(0, cortePendienteAl.largo_cm*sc-2)} height={BAR_H-2}
          fill="rgba(229,62,62,.12)" stroke="#DC2626" strokeWidth={1.5} strokeDasharray="6,3" rx={0}
          style={{ pointerEvents:'none' }}/>
      )}

      {/* Retazo sobrante */}
      {retazoCm >= 1 && (() => {
        const rx = totalUsado * sc;
        const rw = retazoCm * sc;
        return (
          <g>
            <rect x={rx} y={BAR_Y+1} width={Math.max(0,rw-1)} height={BAR_H-2}
              fill="rgba(22,163,74,.14)" stroke="rgba(22,163,74,.70)"
              strokeWidth={1.5} strokeDasharray="8,4" rx={0}/>
            {rw > 45 && <>
              <text x={rx+rw/2} y={BAR_Y+BAR_H/2-3} textAnchor="middle" fontSize={7.5}
                fill="rgba(22,163,74,.85)" fontFamily="'IBM Plex Mono',monospace" fontWeight={700}>RETAZO</text>
              <text x={rx+rw/2} y={BAR_Y+BAR_H/2+7} textAnchor="middle" fontSize={7}
                fill="rgba(22,163,74,.7)" fontFamily="'IBM Plex Mono',monospace">{retazoCm} cm</text>
            </>}
          </g>
        );
      })()}

      {/* Cortes */}
      {cuts.map((c) => {
        const i    = c._i;
        const isDrag = dragX?.idx === i;
        const isHov  = hoverIdx === i;
        const col  = COLORES_CORTE[i % COLORES_CORTE.length];
        const fill = COLORES_FILL[i % COLORES_FILL.length];
        const x    = c._x * sc;
        const w    = c.largo_cm * sc;
        const midX = x + w / 2;
        return (
          <g key={`al${i}`} style={{ cursor: isDrag ? 'grabbing' : 'grab' }}
            onMouseDown={ev => startDrag(ev, i)}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(-1)}>
            <rect x={x+1} y={BAR_Y+1} width={Math.max(0,w-2)} height={BAR_H-2}
              fill={fill} stroke={col} strokeWidth={isDrag ? 2 : isHov ? 1.5 : 1} rx={0}
              opacity={isDrag ? 0.88 : 1}/>
            {/* Badge número */}
            {w > 18 && <>
              <rect x={x+2} y={BAR_Y+2} width={15} height={12} fill={col} rx={0}/>
              <text x={x+9.5} y={BAR_Y+11} textAnchor="middle" fontSize={7}
                fill="white" fontFamily="'IBM Plex Mono',monospace" fontWeight={700}>{i+1}</text>
            </>}
            {/* Largo */}
            {w > 26 && <text x={midX} y={BAR_Y+BAR_H/2+3} textAnchor="middle"
              fontSize={Math.max(7, Math.min(11, w/6))} fill={col}
              fontFamily="'IBM Plex Mono',monospace" fontWeight={600}>{c.largo_cm}</text>}
            {/* × quitar */}
            {isHov && !isDrag && w > 16 && (
              <g style={{ cursor:'pointer' }} onClick={ev => { ev.stopPropagation(); onRemove?.(localCortes[i], i); }}>
                <rect x={x+w-15} y={BAR_Y+2} width={12} height={11} fill="#DC2626" rx={0}/>
                <text x={x+w-9} y={BAR_Y+11} textAnchor="middle" fontSize={9}
                  fill="white" fontFamily="monospace" fontWeight={700}>×</text>
              </g>
            )}
          </g>
        );
      })}

      <text x={VIEW_W-2} y={BAR_Y-4} textAnchor="end" fontSize={7} fill="#A0AEC0" fontFamily="monospace">
        {largoBarraCm} cm
      </text>
    </svg>
  );
};

/* ─── PlanchaVidrioSVG ───────────────────────────────────────────────────── */
function PlanchaVidrioSVG({ cortes, planchaAncho, planchaAlto, svgRef, notificacionId }) {
  const FILLS = [
    'rgba(128,194,220,.55)','rgba(90,139,168,.50)','rgba(168,217,237,.60)',
    'rgba(58,106,136,.45)','rgba(197,232,244,.65)',
  ];

  const clamp = useCallback((value, min, max) => Math.max(min, Math.min(value, max)), []);

  const overlap = useCallback((a, b) => {
    return !(a.x + a.ancho_cm <= b.x || b.x + b.ancho_cm <= a.x || a.y + a.alto_cm <= b.y || b.y + b.alto_cm <= a.y);
  }, []);

  /* ─ snap guides ─ */
  const calcularGuias = useCallback((pieza, otras) => {
    const SNAP_DIST = 8;
    const guias = { vertical: [], horizontal: [] };
    
    /* Bordes de plancha */
    if (Math.abs(pieza.x) < SNAP_DIST) guias.vertical.push({ x: 0, label: 'izq' });
    if (Math.abs(pieza.x + pieza.ancho_cm - planchaAncho) < SNAP_DIST) 
      guias.vertical.push({ x: planchaAncho - pieza.ancho_cm, label: 'der' });
    if (Math.abs(pieza.y) < SNAP_DIST) guias.horizontal.push({ y: 0, label: 'sup' });
    if (Math.abs(pieza.y + pieza.alto_cm - planchaAlto) < SNAP_DIST) 
      guias.horizontal.push({ y: planchaAlto - pieza.alto_cm, label: 'inf' });
    
    /* Otras piezas */
    for (const otra of otras) {
      if (Math.abs(pieza.x - (otra.x + otra.ancho_cm)) < SNAP_DIST) 
        guias.vertical.push({ x: otra.x + otra.ancho_cm, label: 'adj-der' });
      if (Math.abs(pieza.x + pieza.ancho_cm - otra.x) < SNAP_DIST) 
        guias.vertical.push({ x: otra.x - pieza.ancho_cm, label: 'adj-izq' });
      if (Math.abs(pieza.y - (otra.y + otra.alto_cm)) < SNAP_DIST) 
        guias.horizontal.push({ y: otra.y + otra.alto_cm, label: 'adj-inf' });
      if (Math.abs(pieza.y + pieza.alto_cm - otra.y) < SNAP_DIST) 
        guias.horizontal.push({ y: otra.y - pieza.alto_cm, label: 'adj-sup' });
    }
    
    return guias;
  }, [planchaAncho, planchaAlto]);

  const encontrarHueco = useCallback((pieza, ocupadas) => {
    const step = 4;
    let mejor = null;

    for (let y = 0; y <= planchaAlto - pieza.alto_cm; y += step) {
      for (let x = 0; x <= planchaAncho - pieza.ancho_cm; x += step) {
        const candidato = { ...pieza, x, y };
        if (ocupadas.some((item) => overlap(candidato, item))) continue;
        const dist = Math.abs(pieza.x - x) + Math.abs(pieza.y - y);
        if (!mejor || dist < mejor.dist) mejor = { x, y, dist };
      }
    }

    return mejor ? { x: mejor.x, y: mejor.y } : { x: pieza.x, y: pieza.y };
  }, [overlap, planchaAlto, planchaAncho]);

  const resolverColisiones = useCallback((base, draggedId) => {
    const piezas = base.map((p) => ({ ...p }));
    const dragged = piezas.find((p) => p._pieceId === draggedId);
    if (!dragged) return piezas;

    for (let i = 0; i < piezas.length; i += 1) {
      const current = piezas[i];
      if (current._pieceId === draggedId) continue;
      if (!overlap(dragged, current)) continue;
      const ocupadas = piezas.filter((p) => p._pieceId !== current._pieceId);
      const hueco = encontrarHueco(current, ocupadas);
      current.x = hueco.x;
      current.y = hueco.y;
    }

    return piezas;
  }, [encontrarHueco, overlap]);

  const calcularDistribucionInicial = useCallback(() => {
    const piezas = [...cortes]
      .filter((c) => c.ancho_cm > 0 && c.alto_cm > 0)
      .sort((a, b) => (b.alto_cm * b.ancho_cm) - (a.alto_cm * a.ancho_cm));

    let x = 0;
    let y = 0;
    let altoFila = 0;
    const colocadas = [];

    for (const pieza of piezas) {
      if (pieza.ancho_cm > planchaAncho || pieza.alto_cm > planchaAlto) continue;
      if (x + pieza.ancho_cm > planchaAncho) {
        y += altoFila;
        x = 0;
        altoFila = 0;
      }
      if (y + pieza.alto_cm > planchaAlto) continue;
      colocadas.push({
        ...pieza,
        x,
        y,
        _pieceId: pieza._pieceId || `${pieza.id_corte || 'pieza'}-${colocadas.length}`,
      });
      x += pieza.ancho_cm;
      altoFila = Math.max(altoFila, pieza.alto_cm);
    }

    return colocadas;
  }, [cortes, planchaAlto, planchaAncho]);

  const [placed, setPlaced] = useState([]);
  const [draggingId, setDraggingId] = useState('');
  const [guiasActivas, setGuiasActivas] = useState({ vertical: [], horizontal: [] });
  const dragRef = useRef({ active: false, id: '', offsetX: 0, offsetY: 0 });

  /* ─ guardar/cargar posiciones ─ */
  const guardarPosiciones = useCallback((piezas) => {
    const storageKey = `vidrio_posiciones_${notificacionId || 'default'}`;
    const posiciones = piezas.map(p => ({
      _pieceId: p._pieceId,
      x: p.x,
      y: p.y,
    }));
    localStorage.setItem(storageKey, JSON.stringify(posiciones));
  }, [notificacionId]);

  const cargarPosicionesGuardadas = useCallback((piezasBase) => {
    const storageKey = `vidrio_posiciones_${notificacionId || 'default'}`;
    const guardadas = localStorage.getItem(storageKey);
    if (!guardadas) return piezasBase;
    try {
      const posiciones = JSON.parse(guardadas);
      const mapa = new Map(posiciones.map(p => [p._pieceId, p]));
      return piezasBase.map(p => {
        const saved = mapa.get(p._pieceId);
        return saved ? { ...p, x: saved.x, y: saved.y } : p;
      });
    } catch { return piezasBase; }
  }, [notificacionId]);

  useEffect(() => {
    const inicial = calcularDistribucionInicial();
    setPlaced(cargarPosicionesGuardadas(inicial));
  }, [calcularDistribucionInicial, cargarPosicionesGuardadas]);

  const DIM_ML = 50, DIM_MT = 30, DIM_MR = 10, DIM_MB = 35;

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragRef.current.active || !svgRef?.current) return;

      const svgRect = svgRef.current.getBoundingClientRect();
      const totalViewW = planchaAncho + DIM_ML + DIM_MR;
      const totalViewH = planchaAlto + DIM_MT + DIM_MB;
      const scaleX = totalViewW / svgRect.width;
      const scaleY = totalViewH / svgRect.height;
      const pointerX = (event.clientX - svgRect.left) * scaleX - DIM_ML;
      const pointerY = (event.clientY - svgRect.top) * scaleY - DIM_MT;

      setPlaced((current) => {
        const dragged = current.find((piece) => piece._pieceId === dragRef.current.id);
        if (!dragged) return current;

        const next = current.map((piece) => {
          if (piece._pieceId !== dragRef.current.id) return piece;
          const nextX = clamp(pointerX - dragRef.current.offsetX, 0, Math.max(0, planchaAncho - piece.ancho_cm));
          const nextY = clamp(pointerY - dragRef.current.offsetY, 0, Math.max(0, planchaAlto - piece.alto_cm));
          return { ...piece, x: nextX, y: nextY };
        });

        /* Mostrar guías */
        const dragged2 = next.find(p => p._pieceId === dragRef.current.id);
        const otras = next.filter(p => p._pieceId !== dragRef.current.id);
        if (dragged2) setGuiasActivas(calcularGuias(dragged2, otras));

        return next;
      });
    };

    const handleUp = () => {
      if (!dragRef.current.active || !dragRef.current.id) return;
      const draggedId = dragRef.current.id;
      dragRef.current.active = false;
      dragRef.current.id = '';
      setDraggingId('');
      setGuiasActivas({ vertical: [], horizontal: [] });
      setPlaced((current) => {
        const resuelto = resolverColisiones(current, draggedId);
        guardarPosiciones(resuelto);
        return resuelto;
      });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [clamp, planchaAlto, planchaAncho, resolverColisiones, svgRef, calcularGuias, guardarPosiciones]);

  const iniciarDrag = useCallback((event, piece) => {
    const svgRect = svgRef?.current?.getBoundingClientRect();
    if (!svgRect) return;

    const totalViewW = planchaAncho + DIM_ML + DIM_MR;
    const totalViewH = planchaAlto + DIM_MT + DIM_MB;
    const scaleX = totalViewW / svgRect.width;
    const scaleY = totalViewH / svgRect.height;
    const pointerX = (event.clientX - svgRect.left) * scaleX - DIM_ML;
    const pointerY = (event.clientY - svgRect.top) * scaleY - DIM_MT;

    dragRef.current = {
      active: true,
      id: piece._pieceId,
      offsetX: pointerX - piece.x,
      offsetY: pointerY - piece.y,
    };
    setDraggingId(piece._pieceId);

    // Llevar al frente la pieza arrastrada para que "flote" visualmente.
    setPlaced((current) => {
      const index = current.findIndex((p) => p._pieceId === piece._pieceId);
      if (index < 0) return current;
      const next = [...current];
      const [target] = next.splice(index, 1);
      next.push(target);
      return next;
    });
  }, [planchaAlto, planchaAncho, svgRef]);

  const piezasRender = useMemo(() => {
    if (!draggingId) return placed;
    const next = [...placed];
    const index = next.findIndex((piece) => piece._pieceId === draggingId);
    if (index < 0) return next;
    const [dragged] = next.splice(index, 1);
    next.push(dragged);
    return next;
  }, [placed, draggingId]);

  const autoOrganizar = useCallback(() => {
    const inicial = calcularDistribucionInicial();
    setPlaced(inicial);
    guardarPosiciones(inicial);
  }, [calcularDistribucionInicial, guardarPosiciones]);

  return (
    <div>
      <button onClick={autoOrganizar} 
        style={{ marginBottom: 8, padding: '6px 12px', borderRadius: 8, 
          background: 'rgba(128,194,220,.15)', border: '1px solid rgba(128,194,220,.38)', 
          color: '#5a7a90', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          fontFamily: "'IBM Plex Mono',monospace", transition: 'all .18s',
          display: 'inline-flex', alignItems: 'center', gap: 6 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(128,194,220,.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(128,194,220,.15)'; }}>
        <IconLayoutDashboard size={14} stroke={1} /> Auto-organizar
      </button>
      <svg ref={svgRef} width="100%"
        viewBox={`${-DIM_ML} ${-DIM_MT} ${planchaAncho+DIM_ML+DIM_MR} ${planchaAlto+DIM_MT+DIM_MB}`}
        style={{ display:'block', borderRadius:10 }}>
        <defs>
          <linearGradient id="pBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(232,246,252,.80)"/>
            <stop offset="100%" stopColor="rgba(210,236,248,.55)"/>
          </linearGradient>
          <pattern id="pGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0L0 0 0 20" fill="none" stroke="rgba(128,194,220,.18)" strokeWidth=".5"/>
          </pattern>
          <marker id="dimArrL" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
            <path d="M0,3 L6,0 L6,6 z" fill="#64748b"/>
          </marker>
          <marker id="dimArrR" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#64748b"/>
          </marker>
        </defs>

      {/* ── Top dimension annotation ── */}
      <line x1={0} y1={-DIM_MT} x2={0} y2={-DIM_MT/2} stroke="#94a3b8" strokeWidth={0.8}/>
      <line x1={planchaAncho} y1={-DIM_MT} x2={planchaAncho} y2={-DIM_MT/2} stroke="#94a3b8" strokeWidth={0.8}/>
      <line x1={0} y1={-DIM_MT*0.62} x2={planchaAncho} y2={-DIM_MT*0.62}
        stroke="#64748b" strokeWidth={0.9} markerStart="url(#dimArrL)" markerEnd="url(#dimArrR)"/>
      <text x={planchaAncho/2} y={-DIM_MT*0.12} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.max(8, Math.min(14, planchaAncho/18))} fill="#475569" fontWeight={700}
        fontFamily="'IBM Plex Mono',monospace"
        style={{ paintOrder:'stroke', stroke:'white', strokeWidth:2 }}>
        {planchaAncho} cm
      </text>

      {/* ── Left dimension annotation ── */}
      <line x1={-DIM_ML} y1={0} x2={-DIM_ML/2} y2={0} stroke="#94a3b8" strokeWidth={0.8}/>
      <line x1={-DIM_ML} y1={planchaAlto} x2={-DIM_ML/2} y2={planchaAlto} stroke="#94a3b8" strokeWidth={0.8}/>
      <line x1={-DIM_ML*0.62} y1={0} x2={-DIM_ML*0.62} y2={planchaAlto}
        stroke="#64748b" strokeWidth={0.9} markerStart="url(#dimArrL)" markerEnd="url(#dimArrR)"/>
      <text x={-DIM_ML*0.12} y={planchaAlto/2} textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.max(8, Math.min(14, planchaAlto/18))} fill="#475569" fontWeight={700}
        fontFamily="'IBM Plex Mono',monospace"
        transform={`rotate(-90, ${-DIM_ML*0.12}, ${planchaAlto/2})`}
        style={{ paintOrder:'stroke', stroke:'white', strokeWidth:2 }}>
        {planchaAlto} cm
      </text>

      {/* ── Sheet ── */}
      <rect x="0" y="0" width={planchaAncho} height={planchaAlto} rx="8"
        fill="url(#pBg)" stroke="rgba(128,194,220,.45)" strokeWidth="1.5"/>
      <rect x="0" y="0" width={planchaAncho} height={planchaAlto} rx="8" fill="url(#pGrid)"/>
      <rect x="2" y="2" width={planchaAncho-4} height={planchaAlto*.12} rx="6"
        fill="rgba(255,255,255,.28)"/>

      {/* Snap guides */}
      {guiasActivas.vertical.map((g, i) => (
        <line key={`vg-${i}`} x1={g.x} y1="0" x2={g.x} y2={planchaAlto}
          stroke="rgba(90,139,168,.45)" strokeWidth="1" strokeDasharray="4,2"/>
      ))}
      {guiasActivas.horizontal.map((g, i) => (
        <line key={`hg-${i}`} x1="0" y1={g.y} x2={planchaAncho} y2={g.y}
          stroke="rgba(90,139,168,.45)" strokeWidth="1" strokeDasharray="4,2"/>
      ))}
      {placed.length === 0 ? (
        <text x={planchaAncho/2} y={planchaAlto/2} textAnchor="middle"
          fontSize="14" fill="rgba(128,194,220,.55)"
          style={{ fontFamily:"'IBM Plex Mono',monospace" }}>Sin cortes</text>
      ) : piezasRender.map((corte, idx) => (
        <g
          key={`${corte._pieceId || corte.id_corte || idx}`}
          className="pd-cut-draggable"
          style={{ cursor: corte._pieceId === draggingId ? 'grabbing' : 'grab' }}>
          <rect x={corte.x+2} y={corte.y+2} width={corte.ancho_cm} height={corte.alto_cm}
            rx="3" fill="rgba(26,42,58,.10)"/>
          <rect x={corte.x} y={corte.y} width={corte.ancho_cm} height={corte.alto_cm}
            rx="3" fill={FILLS[idx % FILLS.length]}
            stroke="rgba(255,255,255,.65)" strokeWidth="1"
            onPointerDown={(event) => iniciarDrag(event, corte)}/>
          <rect x={corte.x+1} y={corte.y+1} width={corte.ancho_cm-2}
            height={Math.min(corte.alto_cm*.3, 10)} rx="2"
            fill="rgba(255,255,255,.35)"/>
          {corte.ancho_cm > 20 && corte.alto_cm > 12 && (
            <text
              x={corte.x + corte.ancho_cm/2}
              y={corte.y + corte.alto_cm/2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={Math.max(7, Math.min(11, corte.ancho_cm/7, corte.alto_cm/3))}
              fill="rgba(26,42,58,.90)" fontWeight="700"
              fontFamily="'IBM Plex Mono',monospace"
              style={{ paintOrder:'stroke', stroke:'rgba(255,255,255,.75)', strokeWidth:2 }}>
              {corte.ancho_cm}×{corte.alto_cm}
            </text>
          )}
          {/* Dimension lines inside piece */}
          {corte.ancho_cm > 35 && (
            <>
              <line x1={corte.x+4} y1={corte.y+corte.alto_cm-5}
                x2={corte.x+corte.ancho_cm-4} y2={corte.y+corte.alto_cm-5}
                stroke="rgba(26,42,58,.30)" strokeWidth="0.6"
                markerStart="url(#dimArrL)" markerEnd="url(#dimArrR)"/>
            </>
          )}
          {corte.alto_cm > 35 && (
            <>
              <line x1={corte.x+5} y1={corte.y+4}
                x2={corte.x+5} y2={corte.y+corte.alto_cm-4}
                stroke="rgba(26,42,58,.30)" strokeWidth="0.6"
                markerStart="url(#dimArrL)" markerEnd="url(#dimArrR)"/>
            </>
          )}
        </g>
      ))}
      <rect x="0" y="0" width={planchaAncho} height={planchaAlto} rx="8"
        fill="none" stroke="rgba(128,194,220,.55)" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

/* ─── BARRA CARD ──────────────────────────────────────────────────────────── */
function BarraCard({ barra, idx, cortesAluminio, largoBarraCm, svgRef,
  almacenFila, almacenColumna, cargandoCortes, cortePendienteAl,
  onRemoveCorteAl, onPlaceCorteAl }) {
  const [stockLocal, setStockLocal] = useState(barra.info?.stock || false);
  const retazoCmBarra = Math.max(0, largoBarraCm - cortesAluminio.reduce((s, c) => s + (c.largo_cm || 0), 0));
  const retazoPct = largoBarraCm > 0 ? Math.round(retazoCmBarra / largoBarraCm * 100) : 0;

  return (
    <div className="pd-card" style={{ animationDelay:`${idx*55}ms`, marginBottom:8, padding:0 }}>
      {/* Brillo superior */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)',
        pointerEvents:'none' }}/>

      {/* Header compacto */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px',
        borderBottom:'1px solid rgba(128,194,220,.18)' }}>
        <div className="pd-idx" style={{ width:18, height:18, fontSize:9 }}>{idx+1}</div>
        <span style={{ fontFamily:T.fontHead, fontWeight:700, fontSize:12, color:T.text, flex:1 }}>
          {barra.nombre}
        </span>
        {almacenFila && (
          <span style={{ fontSize:9, fontFamily:T.fontMono, color:T.textMid, fontWeight:700,
            background:'rgba(128,194,220,.15)', borderRadius:5, padding:'2px 6px' }}>
            F:{almacenFila}
          </span>
        )}
        {almacenColumna && (
          <span style={{ fontSize:9, fontFamily:T.fontMono, color:T.textMid, fontWeight:700,
            background:'rgba(128,194,220,.15)', borderRadius:5, padding:'2px 6px' }}>
            C:{almacenColumna}
          </span>
        )}
        <label style={{ display:'flex', alignItems:'center', gap:4, cursor:'pointer', userSelect:'none' }}
          onClick={() => setStockLocal(v => !v)}>
          <div style={{ width:14, height:14, borderRadius:3, flexShrink:0,
            background: stockLocal ? 'linear-gradient(135deg,#80C2DC,#5a8ba8)' : 'rgba(255,255,255,.72)',
            border:`1.5px solid ${stockLocal ? 'rgba(128,194,220,.65)' : 'rgba(128,194,220,.38)'}`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            {stockLocal && <IconCheck size={8} color="white"/>}
          </div>
          <span style={{ fontSize:9, fontFamily:T.fontMono, fontWeight:700, color:T.textDim }}>STOCK</span>
        </label>
        <span className="pd-chip" style={{ fontSize:8 }}><IconRuler size={8}/> {largoBarraCm}</span>
        {retazoCmBarra > 0 && (
          <span style={{ fontSize:8, fontFamily:T.fontMono, fontWeight:700,
            color:'#16A34A', background:'rgba(22,163,74,.1)', borderRadius:4,
            padding:'2px 6px', border:'1px solid rgba(22,163,74,.3)' }}>
            Retazo {parseFloat(retazoCmBarra.toFixed(2))} cm ({retazoPct}%)
          </span>
        )}
      </div>

      {/* SVG barra */}
      <div style={{ padding:'6px 8px 4px' }}>
        {cortesAluminio.length > 0 ? (
          <BarraInteractiva
            barraId={barra.id}
            cortes={cortesAluminio}
            largoBarraCm={largoBarraCm}
            svgRef={svgRef}
            cortePendienteAl={cortePendienteAl}
            onRemove={(corte, ci) => onRemoveCorteAl?.(idx, ci, corte)}
            onPlace={(cp) => onPlaceCorteAl?.(idx, cp)}
          />
        ) : (
          <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
            <IconAlertTriangle size={12} color={T.brandMid}/>
            <span style={{ fontSize:11, color:T.textLight, fontFamily:T.fontMono }}>
              {cargandoCortes ? 'Cargando cortes…' : 'Sin cortes de aluminio'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PLANCHA OPT SVG (posiciones pre-calculadas por backend) ────────────── */
const PlanchaOptSVG = ({ plancha, planchaAncho = 300, planchaAlto = 300, svgRef = null }) => {
  const VIEW_W = 420;
  const VIEW_H = Math.round(VIEW_W * planchaAlto / planchaAncho);
  const sx = VIEW_W / planchaAncho;
  const sy = VIEW_H / planchaAlto;
  const PALETTE = ['#4e9ab5','#7dbcd4','#5a8ba8','#80C2DC','#3d7a94','#6aadca','#a3cfe0','#2d6a8a'];
  const retazo = (plancha.retazos || [])[0];
  return (
    <svg ref={svgRef} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%"
      style={{ display: 'block', borderRadius: 8 }}>
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H}
        fill="rgba(232,246,252,.55)" stroke="rgba(128,194,220,.4)" strokeWidth={1.5} rx={6}/>
      {/* Retazo único — bloque verde consolidado */}
      {retazo && (() => {
        const rw = Math.max(0, retazo.ancho * sx - 1);
        const rh = Math.max(0, retazo.alto * sy - 1);
        const rx2 = retazo.x * sx;
        const ry2 = retazo.y * sy;
        const cx2 = rx2 + rw / 2;
        const cy2 = ry2 + rh / 2;
        const fs = Math.max(8, Math.min(12, Math.min(rw, rh) / 5));
        return (
          <g>
            <rect x={rx2} y={ry2} width={rw} height={rh}
              fill="rgba(26,122,74,.13)" stroke="rgba(26,122,74,.55)"
              strokeWidth={1.5} strokeDasharray="6,3" rx={3}/>
            {rw > 40 && rh > 20 && (
              <text x={cx2} y={cy2} textAnchor="middle" dominantBaseline="middle"
                fontSize={fs} fill="rgba(26,122,74,.85)"
                fontFamily="'IBM Plex Mono',monospace" fontWeight={700}>
                {retazo.ancho}×{retazo.alto}
              </text>
            )}
          </g>
        );
      })()}
      {(plancha.cortes || []).map((c, i) => {
        const esRetazo = c.origen === 'retazo';
        const col = esRetazo ? '#E53E3E' : PALETTE[i % PALETTE.length];
        const fillAlpha = esRetazo ? '22' : '30';
        const w = Math.max(0, c.ancho * sx - 2);
        const h = Math.max(0, c.alto * sy - 2);
        const cx2 = c.x * sx + c.ancho * sx / 2;
        const cy2 = c.y * sy + c.alto * sy / 2;
        const fs = Math.max(7, Math.min(11, Math.min(w, h) / 4));
        return (
          <g key={`cut-${i}`}>
            <rect x={c.x * sx + 1} y={c.y * sy + 1} width={w} height={h}
              fill={`${col}${fillAlpha}`} stroke={col} strokeWidth={esRetazo ? 1.2 : 0.7} rx={3}/>
            {esRetazo && w > 8 && h > 8 && (
              <rect x={c.x * sx + 1} y={c.y * sy + 1} width={w} height={h}
                fill="none" stroke={col} strokeWidth={1} strokeDasharray="4,3" rx={3}/>
            )}
            {w > 24 && h > 14 && (
              <text x={cx2} y={cy2} textAnchor="middle" dominantBaseline="middle"
                fontSize={fs} fill={col}
                fontFamily="'IBM Plex Mono',monospace" fontWeight={700}>
                {c.ancho}×{c.alto}{c.rotado ? ' ↻' : ''}{esRetazo ? ' ★' : ''}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ─── PlanchaInteractiva — drag/rotate/remove + diseño profesional ─────── */

const PlanchaInteractiva = ({
  plancha, planchaAncho = 300, planchaAlto = 300,
  planchaIdx = 0,
  svgRef = null, cortePendiente = null,
  onMoveCorte, onRotate, onRemove, onPlace,
  annotMode = 0, highlightLabel = null,
}) => {
  const VIEW_W = 300;
  const VIEW_H = Math.max(160, Math.round(VIEW_W * planchaAlto / planchaAncho));
  const sx = VIEW_W / planchaAncho;
  const sy = VIEW_H / planchaAlto;

  const svgEl = useRef(null);
  const drag  = useRef({ active: false, idx: -1, ox: 0, oy: 0 });
  const [dragPos,   setDragPos]   = useState(null);
  const [hoverIdx,  setHoverIdx]  = useState(-1);
  const [localCortes, setLocal]   = useState(plancha.cortes || []);

  useEffect(() => { setLocal(plancha.cortes || []); }, [plancha.cortes]);

  const toSVG = (e) => {
    const el = svgEl.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * VIEW_W,
             y: (e.clientY - r.top)  / r.height * VIEW_H };
  };

  const snap = (v, max) => Math.max(0, Math.min(max, Math.round(v * 2) / 2));

  const snapToNeighbor = (idx, nx, ny) => {
    const c = localCortes[idx];
    const SNAP = 3 / Math.min(sx, sy); // ~3 SVG px → data coords
    let rx = nx, ry = ny;
    localCortes.forEach((o, j) => {
      if (j === idx) return;
      const oR = o.x + o.ancho, oB = o.y + o.alto;
      const cR = nx + c.ancho,  cB = ny + c.alto;
      if (Math.abs(nx - oR)  < SNAP) rx = oR;
      if (Math.abs(cR - o.x) < SNAP) rx = o.x - c.ancho;
      if (Math.abs(nx - o.x) < SNAP) rx = o.x;
      if (Math.abs(cR - oR)  < SNAP) rx = oR - c.ancho;
      if (Math.abs(ny - oB)  < SNAP) ry = oB;
      if (Math.abs(cB - o.y) < SNAP) ry = o.y - c.alto;
      if (Math.abs(ny - o.y) < SNAP) ry = o.y;
      if (Math.abs(cB - oB)  < SNAP) ry = oB - c.alto;
    });
    return { x: Math.max(0, Math.min(rx, planchaAncho - c.ancho)), y: Math.max(0, Math.min(ry, planchaAlto - c.alto)) };
  };

  const startDrag = (e, idx) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const pt = toSVG(e); if (!pt) return;
    const c = localCortes[idx];
    drag.current = { active: true, idx, ox: pt.x - c.x * sx, oy: pt.y - c.y * sy };
    setDragPos({ idx, x: c.x, y: c.y });
  };

  const onMove = (e) => {
    if (!drag.current.active) return;
    const pt = toSVG(e); if (!pt) return;
    const { idx, ox, oy } = drag.current;
    const c = localCortes[idx];
    const nx = snap((pt.x - ox) / sx, planchaAncho - c.ancho);
    const ny = snap((pt.y - oy) / sy, planchaAlto  - c.alto);
    setDragPos({ idx, x: nx, y: ny });
  };

  const onUp = (e) => {
    if (!drag.current.active) return;
    const { idx } = drag.current;
    if (dragPos) {
      const snapped = snapToNeighbor(idx, dragPos.x, dragPos.y);
      onMoveCorte?.(idx, snapped.x, snapped.y);
    }
    drag.current.active = false;
    setDragPos(null);
  };

  const onLeave = () => {
    setHoverIdx(-1);
    if (!drag.current.active) return;
    const { idx } = drag.current;
    onRemove?.(localCortes[idx], idx);
    drag.current.active = false;
    setDragPos(null);
  };

  const clickSVG = (e) => {
    if (drag.current.active || !cortePendiente) return;
    const pt = toSVG(e); if (!pt) return;
    onPlace?.({
      ...cortePendiente,
      x: snap((pt.x / sx), planchaAncho - cortePendiente.ancho),
      y: snap((pt.y / sy), planchaAlto  - cortePendiente.alto),
    });
  };

  const retazo = (plancha.retazos || [])[0];
  const gridPx  = 10 * sx;
  const gridPy  = 10 * sy;
  const uid = `pi-${plancha.id}`;

  const cortes = localCortes.map((c, i) => ({
    ...c, _i: i,
    x: dragPos?.idx === i ? dragPos.x : c.x,
    y: dragPos?.idx === i ? dragPos.y : c.y,
  }));

  const MX = 70, MY = 60;

  return (
    <svg ref={el => { svgEl.current = el; if (svgRef) svgRef.current = el; }}
      viewBox={`${-MX} ${-MY} ${VIEW_W + MX*2} ${VIEW_H + MY*2}`} width="100%"
      style={{ display: 'block', cursor: drag.current.active ? 'grabbing' : cortePendiente ? 'crosshair' : 'default', userSelect: 'none' }}
      onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onLeave} onClick={clickSVG}>
      <defs>
        <pattern id={`g-${uid}`} width={gridPx} height={gridPy} patternUnits="userSpaceOnUse">
          <path d={`M ${gridPx} 0 L 0 0 0 ${gridPy}`} fill="none" stroke="rgba(0,100,100,.13)" strokeWidth="0.7"/>
        </pattern>
        <marker id={`a-${uid}`} markerWidth={5} markerHeight={5} refX={2.5} refY={2.5} orient="auto-start-reverse">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="#555"/>
        </marker>
      </defs>

      {/* Sheet background */}
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="#D9EFED"/>
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={`url(#g-${uid})`}/>

      {/* Ghost corte pendiente */}
      {cortePendiente && (
        <rect x={1} y={1} width={cortePendiente.ancho*sx-2} height={cortePendiente.alto*sy-2}
          fill="rgba(229,62,62,.08)" stroke="#E53E3E" strokeWidth={1.5} strokeDasharray="6,3"
          style={{ pointerEvents: 'none' }}/>
      )}

      {/* Guillotine cut lines — removed per user request */}

      {/* Retazo */}
      {retazo && (()=>{
        const rw=retazo.ancho*sx, rh=retazo.alto*sy, rx=retazo.x*sx, ry=retazo.y*sy;
        return <g>
          <rect x={rx} y={ry} width={rw} height={rh} fill="rgba(22,163,74,.14)" stroke="rgba(22,163,74,.7)" strokeWidth={1} strokeDasharray="5,3"/>
          {rw>50&&rh>20&&<>
            <text x={rx+rw/2} y={ry+rh/2-5} textAnchor="middle" fontSize={9} fill="rgba(22,163,74,.9)" fontFamily="'IBM Plex Mono',monospace" fontWeight={700}>RETAZO</text>
            <text x={rx+rw/2} y={ry+rh/2+7} textAnchor="middle" fontSize={8} fill="rgba(22,163,74,.8)" fontFamily="'IBM Plex Mono',monospace">{retazo.ancho}×{retazo.alto}</text>
          </>}
        </g>;
      })()}

      {/* Pieces — drag areas + labels + rotate button (all in same <g> so hover stays intact) */}
      {cortes.map((c) => {
        const i = c._i;
        const isDrag = dragPos?.idx === i;
        const isHov  = hoverIdx === i;
        const w = c.ancho*sx, h = c.alto*sy;
        const cx2 = c.x*sx+w/2, cy2 = c.y*sy+h/2;
        const fs = Math.max(6, Math.min(9, Math.min(w,h)/6));
        const lbl = `${String.fromCharCode(65+planchaIdx)}${i+1}`;
        const showRot = isHov && !isDrag && w>14 && h>13;
        return (
          <g key={`c${i}`} style={{cursor: isDrag?'grabbing':'grab'}}
            onMouseDown={ev=>startDrag(ev,i)}
            onMouseEnter={()=>setHoverIdx(i)}
            onMouseLeave={()=>setHoverIdx(-1)}>
            <rect x={c.x*sx} y={c.y*sy} width={Math.max(0,w)} height={Math.max(0,h)}
              fill={isDrag?COLORES_FILL[i%COLORES_FILL.length].replace('38','88'):isHov?COLORES_FILL[i%COLORES_FILL.length].replace('38','55'):COLORES_FILL[i%COLORES_FILL.length]}
              stroke={COLORES_CORTE[i%COLORES_CORTE.length]} strokeWidth={0.7}
              strokeDasharray="none"/>
            {w>6&&h>6&&<>
              <text x={cx2} y={h>10?cy2-fs*0.55:cy2} textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(4.5,Math.min(9,Math.min(w,h)/4))} fill="#1a2a3a" fontFamily="'IBM Plex Mono',monospace" fontWeight={700}
                style={{pointerEvents:'none', paintOrder:'stroke', stroke:'rgba(217,239,237,.7)', strokeWidth:3}}>
                {lbl}
              </text>
              {h>10&&<text x={cx2} y={cy2+fs*0.7} textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.max(4,Math.min(7,Math.min(w,h)/5))} fill="#1a2a3a" fontFamily="'IBM Plex Mono',monospace"
                style={{pointerEvents:'none', paintOrder:'stroke', stroke:'rgba(217,239,237,.7)', strokeWidth:3}}>
                {c.ancho}×{c.alto}
              </text>}
            </>}
            {lbl === highlightLabel && <rect x={c.x*sx} y={c.y*sy} width={Math.max(0,w)} height={Math.max(0,h)}
              fill="rgba(251,191,36,0.18)" stroke="#f59e0b" strokeWidth={2} rx={3} style={{pointerEvents:'none'}}/>}
            {/* Rotate button — inside same <g> so hover state is shared */}
            {showRot && <g style={{cursor:'pointer'}}
              onMouseDown={ev=>ev.stopPropagation()}
              onClick={ev=>{ev.stopPropagation();onRotate?.(i);}}>
              <rect x={c.x*sx} y={c.y*sy} width={14} height={13} fill="#334155" opacity={.95} rx={2}/>
              <text x={c.x*sx+7} y={c.y*sy+10} textAnchor="middle" fontSize={10} fill="white" fontFamily="monospace">↻</text>
            </g>}
          </g>
        );
      })}

      {/* Sheet border */}
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="none" stroke="#2d3748" strokeWidth={1} style={{pointerEvents:'none'}}/>

      {/* ── DIMENSION ANNOTATIONS — border-touching chains ── */}
      {(()=>{
        const fmt = v => parseFloat((+v).toFixed(2));
        // Pieces closest to each border (handles floating-point gaps like 235.9+60=295.9)
        const closest = (arr, distFn) => {
          if (!arr.length) return [];
          const min = Math.min(...arr.map(distFn));
          return arr.filter(c => distFn(c) <= min + 0.5);
        };
        const topPcs   = closest(localCortes, c => c.y);
        const botPcs   = closest(localCortes, c => Math.abs(c.y + c.alto  - planchaAlto));
        const leftPcs  = closest(localCortes, c => c.x);
        const rightPcs = closest(localCortes, c => Math.abs(c.x + c.ancho - planchaAncho));

        // Chain positions derived from border-touching pieces only
        const xPosT = [...new Set([0,...topPcs.flatMap(c=>[c.x,c.x+c.ancho]),  planchaAncho])].sort((a,b)=>a-b);
        const xPosB = [...new Set([0,...botPcs.flatMap(c=>[c.x,c.x+c.ancho]),  planchaAncho])].sort((a,b)=>a-b);
        const yPosL = [...new Set([0,...leftPcs.flatMap(c=>[c.y,c.y+c.alto]),  planchaAlto])].sort((a,b)=>a-b);
        const yPosR = [...new Set([0,...rightPcs.flatMap(c=>[c.y,c.y+c.alto]), planchaAlto])].sort((a,b)=>a-b);

        // All cut positions for extension lines
        const xAll = [...new Set([0,...localCortes.flatMap(c=>[c.x,c.x+c.ancho]),planchaAncho])].sort((a,b)=>a-b);
        const yAll = [...new Set([0,...localCortes.flatMap(c=>[c.y,c.y+c.alto]), planchaAlto])].sort((a,b)=>a-b);

        const m = `url(#a-${uid})`;
        const DIM1=11, DIM=26, TOT=48;
        const COL='#5b8db8', BOLD='#1e3a5f';

        // ── Inner chain: ALL cuts, border-touching segments highlighted ──
        const chainHInner = (ax,bx,y,lbl,idx=0) => {
          const span=bx-ax;
          if (span<2) return null;
          const mx=(ax+bx)/2;
          const fs=span<20?3.8:5.2;
          const above=y<=0;
          const ly=above?y-2:y+2;
          const isBorder = ax < 1 || bx > VIEW_W - 1;
          const lc = isBorder ? '#1e3a5f' : COL;
          const fw = isBorder ? 700 : 400;
          return <g key={`chi${ax}${y}${idx}`} style={{pointerEvents:'none'}}>
            <line x1={ax} y1={y+2} x2={ax} y2={y-2} stroke={lc} strokeWidth={isBorder?0.6:0.4}/>
            <line x1={bx} y1={y+2} x2={bx} y2={y-2} stroke={lc} strokeWidth={isBorder?0.6:0.4}/>
            <line x1={ax} y1={y} x2={bx} y2={y} stroke={lc} strokeWidth={isBorder?0.55:0.35}/>
            <text x={mx} y={above?ly-1:ly+1} textAnchor="middle" dominantBaseline={above?'auto':'hanging'} fontSize={fs} fontWeight={fw} fill={lc} fontFamily="monospace">{lbl}</text>
          </g>;
        };
        const chainVInner = (ay,by,x,lbl,side) => {
          const span=by-ay;
          if (span<2) return null;
          const my=(ay+by)/2, fs=5.5;
          const ta=side==='left'?'end':'start', tx=x+(side==='left'?-2:2);
          return <g key={`cvi${ay}${x}`} style={{pointerEvents:'none'}}>
            <line x1={x-2} y1={ay} x2={x+2} y2={ay} stroke={COL} strokeWidth={0.55}/>
            <line x1={x-2} y1={by} x2={x+2} y2={by} stroke={COL} strokeWidth={0.55}/>
            <line x1={x} y1={ay} x2={x} y2={by} stroke={COL} strokeWidth={0.45}/>
            <text x={tx} y={my} textAnchor={ta} dominantBaseline="middle" fontSize={fs} fill={COL} fontFamily="monospace">{lbl}</text>
          </g>;
        };

        // ── Outer chain: border-touching pieces with arrows ──
        const chainH = (ax,bx,y,lbl) => {
          const span=bx-ax, mx=(ax+bx)/2;
          if (span<4) return null;
          const g=Math.min(span*0.4, Math.max(13,String(lbl).length*4.2));
          if (span<g*1.5) return <g key={`ch${ax}${y}`} style={{pointerEvents:'none'}}>
            <line x1={ax} y1={y} x2={ax-7} y2={y} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
            <line x1={bx} y1={y} x2={bx+7} y2={y} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
            <text x={mx} y={y<0?y-5:y+8} textAnchor="middle" fontSize={6.5} fill={COL} fontFamily="monospace">{lbl}</text>
          </g>;
          return <g key={`ch${ax}${y}`} style={{pointerEvents:'none'}}>
            <line x1={ax} y1={y} x2={mx-g/2} y2={y} stroke={COL} strokeWidth={0.8} markerStart={m}/>
            <line x1={mx+g/2} y1={y} x2={bx} y2={y} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
            <text x={mx} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={7.5} fill={COL} fontFamily="monospace">{lbl}</text>
          </g>;
        };
        const chainV = (ay,by,x,lbl,side) => {
          const span=by-ay, my=(ay+by)/2;
          if (span<4) return null;
          const g=Math.min(span*0.4, Math.max(12,String(lbl).length*4.2));
          const ta=side==='left'?'end':'start', tx=x+(side==='left'?-3:3);
          if (span<g*1.5) return <g key={`cv${ay}${x}`} style={{pointerEvents:'none'}}>
            <line x1={x} y1={ay} x2={x} y2={ay-7} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
            <line x1={x} y1={by} x2={x} y2={by+7} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
            <text x={tx+(side==='left'?-4:4)} y={my} textAnchor={ta} dominantBaseline="middle" fontSize={6.5} fill={COL} fontFamily="monospace">{lbl}</text>
          </g>;
          return <g key={`cv${ay}${x}`} style={{pointerEvents:'none'}}>
            <line x1={x} y1={ay} x2={x} y2={my-g/2} stroke={COL} strokeWidth={0.8} markerStart={m}/>
            <line x1={x} y1={my+g/2} x2={x} y2={by} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
            <text x={tx} y={my} textAnchor={ta} dominantBaseline="middle" fontSize={7.5} fill={COL} fontFamily="monospace">{lbl}</text>
          </g>;
        };
        const totalH=(ax,bx,y,lbl)=>{const mx=(ax+bx)/2,g=Math.min((bx-ax)*0.3,22);return<g style={{pointerEvents:'none'}}><line x1={ax} y1={y} x2={mx-g/2} y2={y} stroke={BOLD} strokeWidth={0.5} markerStart={m}/><line x1={mx+g/2} y1={y} x2={bx} y2={y} stroke={BOLD} strokeWidth={0.5} markerEnd={m}/><text x={mx} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={BOLD} fontFamily="monospace">{lbl}</text></g>;};
        const totalV=(ay,by,x,lbl,side)=>{const my=(ay+by)/2,g=Math.min((by-ay)*0.3,22),ta=side==='left'?'end':'start',tx=x+(side==='left'?-4:4);return<g style={{pointerEvents:'none'}}><line x1={x} y1={ay} x2={x} y2={my-g/2} stroke={BOLD} strokeWidth={0.5} markerStart={m}/><line x1={x} y1={my+g/2} x2={x} y2={by} stroke={BOLD} strokeWidth={0.5} markerEnd={m}/><text x={tx} y={my} textAnchor={ta} dominantBaseline="middle" fontSize={9} fontWeight={700} fill={BOLD} fontFamily="monospace">{lbl}</text></g>;};

        const xSegsAll=xAll.slice(0,-1).map((x1,i)=>({x1,x2:xAll[i+1]}));
        const ySegsAll=yAll.slice(0,-1).map((y1,i)=>({y1,y2:yAll[i+1]}));
        const xSegsT=xPosT.slice(0,-1).map((x1,i)=>({x1,x2:xPosT[i+1],span:xPosT[i+1]-x1}));
        const xSegsB=xPosB.slice(0,-1).map((x1,i)=>({x1,x2:xPosB[i+1],span:xPosB[i+1]-x1}));
        const ySegsL=yPosL.slice(0,-1).map((y1,i)=>({y1,y2:yPosL[i+1],span:yPosL[i+1]-y1}));
        const ySegsR=yPosR.slice(0,-1).map((y1,i)=>({y1,y2:yPosR[i+1],span:yPosR[i+1]-y1}));

        const EXT=['#1a2a3a','#2563a8'];
        // Separate extension-line sets per side so top positions don't bleed to bottom and vice versa
        const borderX = [0, planchaAncho], borderY = [0, planchaAlto];
        const extXTop  = annotMode===1 ? borderX : annotMode===2 ? xPosT : xAll;
        const extXBot  = annotMode===1 ? borderX : annotMode===2 ? xPosB : xAll;
        const extYLeft = annotMode===1 ? borderY : annotMode===2 ? yPosL : yAll;
        const extYRight= annotMode===1 ? borderY : annotMode===2 ? yPosR : yAll;
        return <>
          {/* Extension lines — per-side filtered to active annotation layer */}
          {extXTop.map((x,i)=>{const ec=EXT[i%2];return<line key={`ext${x}`}  x1={x*sx} y1={-3}        x2={x*sx} y2={-(DIM+6)}        stroke={ec} strokeWidth={0.5} strokeDasharray="3,2" style={{pointerEvents:'none'}}/>;})}
          {extXBot.map((x,i)=>{const ec=EXT[i%2];return<line key={`exb${x}`}  x1={x*sx} y1={VIEW_H+3}  x2={x*sx} y2={VIEW_H+DIM+6}  stroke={ec} strokeWidth={0.5} strokeDasharray="3,2" style={{pointerEvents:'none'}}/>;})}
          {extYLeft.map((y,i)=>{const ec=EXT[i%2];return<line key={`eyl${y}`} x1={-3}        y1={y*sy} x2={-(DIM+6)}        y2={y*sy} stroke={ec} strokeWidth={0.5} strokeDasharray="3,2" style={{pointerEvents:'none'}}/>;})}
          {extYRight.map((y,i)=>{const ec=EXT[i%2];return<line key={`eyr${y}`} x1={VIEW_W+3}  y1={y*sy} x2={VIEW_W+DIM+6}  y2={y*sy} stroke={ec} strokeWidth={0.5} strokeDasharray="3,2" style={{pointerEvents:'none'}}/>;})}
          {/* INNER: all cuts */}
          {(annotMode===0||annotMode===3)&&xSegsAll.map(({x1,x2},i)=>chainHInner(x1*sx,x2*sx,-DIM1,fmt(x2-x1),i))}
          {(annotMode===0||annotMode===3)&&xSegsAll.map(({x1,x2},i)=>chainHInner(x1*sx,x2*sx,VIEW_H+DIM1,fmt(x2-x1),i))}
          {(annotMode===0||annotMode===3)&&ySegsAll.map(({y1,y2})=>chainVInner(y1*sy,y2*sy,-DIM1,fmt(y2-y1),'left'))}
          {(annotMode===0||annotMode===3)&&ySegsAll.map(({y1,y2})=>chainVInner(y1*sy,y2*sy,VIEW_W+DIM1,fmt(y2-y1),'right'))}
          {/* OUTER: border-touching chains */}
          {(annotMode===0||annotMode===2)&&xSegsT.map(({x1,x2,span})=>chainH(x1*sx,x2*sx,-DIM,fmt(span)))}
          {(annotMode===0||annotMode===2)&&xSegsB.map(({x1,x2,span})=>chainH(x1*sx,x2*sx,VIEW_H+DIM,fmt(span)))}
          {(annotMode===0||annotMode===2)&&ySegsL.map(({y1,y2,span})=>chainV(y1*sy,y2*sy,-DIM,fmt(span),'left'))}
          {(annotMode===0||annotMode===2)&&ySegsR.map(({y1,y2,span})=>chainV(y1*sy,y2*sy,VIEW_W+DIM,fmt(span),'right'))}
          {/* TOTALS */}
          {(annotMode===0||annotMode===1)&&totalH(0,VIEW_W,-TOT,fmt(planchaAncho))}
          {(annotMode===0||annotMode===1)&&totalH(0,VIEW_W,VIEW_H+TOT,fmt(planchaAncho))}
          {(annotMode===0||annotMode===1)&&totalV(0,VIEW_H,-TOT,fmt(planchaAlto),'left')}
          {(annotMode===0||annotMode===1)&&totalV(0,VIEW_H,VIEW_W+TOT,fmt(planchaAlto),'right')}
        </>;
      })()}

    </svg>
  );
};

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
const Productos = ({ notificacion, onToast, showHeader = true, onFinalizarEntrega, actionsRef, vistaDiseno = 'VIDRIO', onEficienciaChange, annotMode = 0, highlightLabel = null, onCortePendienteChange, onCortesChange }) => {
  injectCSS();

  const showToast = useCallback((mensaje, tipo = 'success') => {
    onToast?.(mensaje, tipo);
  }, [onToast]);

  const [barras, setBarras] = useState([{
    id: 1, nombre: 'Barra 1', medidas: [], info: { fila: 'A', columna: '3', stock: true },
  }]);
  const [cortes,              setCortes]              = useState([]);
  const [corteInputs,         setCorteInputs]         = useState({});
  const [cortesPorProducto,   setCortesPorProducto]   = useState([]);
  const [cargandoCortes,      setCargandoCortes]      = useState(false);
  const [selectedVidrio,      setSelectedVidrio]      = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [finalizando,         setFinalizando]         = useState(false);
  const [carritoId,           setCarritoId]           = useState('');
  const [stockProductoSeleccionado, setStockProductoSeleccionado] = useState(null);
  const [usaSnapshotCortes, setUsaSnapshotCortes] = useState(false);
  const [reporteImpresion, setReporteImpresion] = useState(null);
  const [distAluminioOpt, setDistAluminioOpt] = useState(null);
  const [planVidrioPorNombre, setPlanVidrioPorNombre] = useState({});
  const [cargandoOptAluminio, setCargandoOptAluminio] = useState(false);
  const [cargandoOptVidrio,   setCargandoOptVidrio]   = useState(false);
  const [cortesNoColocados,   setCortesNoColocados]   = useState({});
  const [cortePendiente,      setCortePendiente]      = useState(null);
  const abortOptVidrio = useRef(null);
  const [cortesAlNoColocados, setCortesAlNoColocados] = useState([]);
  const [cortePendienteAl,    setCortePendienteAl]    = useState(null);

  const svgAluminioRef = useRef(null);
  const svgVidrioRef   = useRef(null);

  /* ─ fetchCortes ─ */
  const fetchCortes = useCallback(async ({ silent = false } = {}) => {
    if (!notificacion?.id) return;
    if (!silent) setCargandoCortes(true);
    try {
      const snapshotKey = `entrega_cortes_snapshot_${String(notificacion?.id || '').trim()}`;
      const snapshotRaw = localStorage.getItem(snapshotKey);
      if (snapshotRaw) {
        try {
          const snapshot = JSON.parse(snapshotRaw);
          const productosSnapshot = Array.isArray(snapshot?.productos) ? snapshot.productos : [];
          if (productosSnapshot.length > 0) {
            setCortesPorProducto(productosSnapshot);
            setCarritoId(String(snapshot?.carrito_id || '').trim());
            setUsaSnapshotCortes(true);
            return;
          }
        } catch {}
      }

      const response = await fetch(`/api/cortes/notificacion/${notificacion.id}`);
      const data = await response.json();
      if (data.success) {
        setCortesPorProducto(Array.isArray(data.productos) ? data.productos : []);
        setCarritoId(String(data.carrito_id || '').trim());
        setUsaSnapshotCortes(false);
      } else {
        if (!silent) showToast(data.error || 'Error al cargar cortes', 'error');
      }
    } catch {
      if (!silent) showToast('Error al conectar con el servidor', 'error');
    } finally {
      if (!silent) setCargandoCortes(false);
    }
  }, [notificacion?.id, showToast]);

  useEffect(() => {
    const productosGuardados = localStorage.getItem('productosSeleccionadosEntrega');
    if (productosGuardados) {
      try { setProductosSeleccionados(JSON.parse(productosGuardados)); }
      catch (e) { console.error('Error al recuperar productos:', e); }
    }
    fetchCortes();
  }, [fetchCortes]);

  /* ─ sync realtime cortes ─ */
  const syncProductosConCorte = useCallback((payload) => {
    const eventType = payload?.eventType;
    const oldRow = payload?.old || {};
    const newRow = payload?.new || {};
    const targetId = String(newRow?.id_corte || oldRow?.id_corte || '');
    if (!targetId) return;

    setCortesPorProducto((current) =>
      current.reduce((productosAcc, producto) => {
        const cortesActualizados = (producto.cortes || []).reduce((cortesAcc, corte) => {
          if (String(corte?.id_corte) !== targetId) { cortesAcc.push(corte); return cortesAcc; }
          if (eventType === 'DELETE') return cortesAcc;
          const cantidad = Number(newRow?.cantidad || 0);
          if (cantidad <= 0) return cortesAcc;
          cortesAcc.push({ ...corte, cantidad, fecha_registro: newRow?.fecha_registro || corte.fecha_registro });
          return cortesAcc;
        }, []);
        if (!cortesActualizados.length) return productosAcc;
        productosAcc.push({
          ...producto, cortes: cortesActualizados,
          total_cortes: cortesActualizados.reduce((sum, c) => sum + Number(c?.cantidad || 0), 0),
        });
        return productosAcc;
      }, [])
    );
  }, []);

  useEffect(() => {
    if (!notificacion?.id || usaSnapshotCortes) return;
    const interval = setInterval(() => fetchCortes({ silent: true }), 12000);
    return () => clearInterval(interval);
  }, [notificacion?.id, usaSnapshotCortes, fetchCortes]);

  /* ─ cantidad que eligió el cliente ─ */
  const normalizarTexto = useCallback((valor) => {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }, []);

  const obtenerCantidadCliente = useCallback((nombreProducto) => {
    const nombreNormalizado = normalizarTexto(nombreProducto);
    if (!nombreNormalizado) return 0;

    const desdeSeleccion = (productosSeleccionados || []).reduce((sum, p) => {
      return normalizarTexto(p?.nombre) === nombreNormalizado
        ? sum + Number(p?.cantidad_seleccionada || 0)
        : sum;
    }, 0);
    if (desdeSeleccion > 0) return desdeSeleccion;

    const productoCortes = (cortesPorProducto || []).find((p) => {
      const nombre = p?.producto_nombre || p?.nombre || '';
      return normalizarTexto(nombre) === nombreNormalizado;
    });
    if (!productoCortes) return 0;

    const desdeCortes = (productoCortes.cortes || []).reduce((sum, c) => sum + Number(c?.cantidad || 0), 0);
    if (desdeCortes > 0) return desdeCortes;

    return (productoCortes.cortes || []).length;
  }, [productosSeleccionados, cortesPorProducto, normalizarTexto]);

  /* ─ stock del vidrio seleccionado ─ */
  useEffect(() => {
    if (!selectedVidrio) { setStockProductoSeleccionado(null); return; }
    let cancelled = false;

    const cargar = async () => {
      try {
        const response = await fetch(`/api/productos/por-nombre/${encodeURIComponent(selectedVidrio)}`);
        if (cancelled) return;
        if (!response.ok) { setStockProductoSeleccionado(null); return; }
        const data = await response.json();
        if (!cancelled) setStockProductoSeleccionado(data.success && data.producto ? data.producto : null);
      } catch {
        if (!cancelled) setStockProductoSeleccionado(null);
      }
    };

    cargar();
    const interval = setInterval(cargar, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedVidrio]);

  /* ─ derived ─ */
  const separarPorCategoria = (productos) => {
    const vidrios = [], aluminios = [];
    (productos || []).forEach((producto) => {
      const categoria = (producto.categoria || '').toUpperCase();
      if (categoria.includes('ALUMIN')) aluminios.push(producto);
      else vidrios.push(producto);
    });
    return { vidrios, aluminios };
  };

  const { vidrios, aluminios } = separarPorCategoria(cortesPorProducto);
  const formatCurrency = useCallback((valor) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }, []);

  const formatDate = useCallback((valor) => {
    const fecha = valor ? new Date(valor) : new Date();
    if (Number.isNaN(fecha.getTime())) return new Date().toLocaleDateString('es-PE');
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const escapeHtml = useCallback((value) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }, []);

  const abrirReporteImpresion = useCallback(async (reporte) => {
    const popup = window.open('', 'reporte-entrega', 'width=1200,height=900');
    if (!popup) {
      showToast('No se pudo abrir la ventana de impresión. Habilita pop-ups.', 'error');
      return false;
    }

    const filasProductos = (reporte.productos || []).map((producto) => `
      <tr>
        <td>${escapeHtml(producto.nombre)}</td>
        <td>${escapeHtml(producto.descripcion)}</td>
        <td>${escapeHtml(producto.categoria)} · ${escapeHtml(producto.codigo)}</td>
        <td>${escapeHtml(String(producto.cantidad))}</td>
      </tr>
    `).join('');

    const filasCorteAluminio = (reporte.aluminios || []).flatMap((prod) =>
      (prod.cortes || []).map((c, ci) => `
        <tr>
          <td>${escapeHtml(prod.nombre)}</td>
          <td>${ci + 1}</td>
          <td>${escapeHtml(String(c.largo))} cm</td>
          <td>${escapeHtml(String(c.cantidad))}</td>
        </tr>
      `)
    ).join('');

    const contenido = `
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte de entrega</title>
        <style>
          *{box-sizing:border-box}
          body{font-family:Arial,sans-serif;margin:22px;color:#173244}
          h1{margin:0 0 14px;font-size:22px}
          h2{margin:22px 0 8px;font-size:16px}
          table{width:100%;border-collapse:collapse;margin:8px 0 14px}
          th,td{border:1px solid #c9dbe6;padding:8px;text-align:left;font-size:12px;vertical-align:top}
          th{background:#eef7fb}
          .diagram{margin-top:8px;border:1px solid #c9dbe6;border-radius:10px;padding:10px}
          .diagram img{display:block;max-width:100%;height:auto;margin:0 auto}
          .empty{color:#6b8799;font-size:12px;padding:10px;border:1px dashed #b6ccd9;border-radius:8px}
          @media print{body{margin:12mm}}
        </style>
      </head>
      <body>
        <h1>Reporte de entrega</h1>

        <h2>Productos seleccionados</h2>
        ${(reporte.productos || []).length > 0
          ? `<table><thead><tr><th>Producto</th><th>Descripción</th><th>Categoría / Código</th><th>Cantidad</th></tr></thead><tbody>${filasProductos}</tbody></table>`
          : '<div class="empty">No hay productos seleccionados.</div>'}

        <h2>Cortes de aluminio</h2>
        ${filasCorteAluminio.length > 0
          ? `<table><thead><tr><th>Producto</th><th>Corte N°</th><th>Largo</th><th>Cant.</th></tr></thead><tbody>${filasCorteAluminio}</tbody></table>`
          : '<div class="empty">Sin cortes de aluminio registrados.</div>'}

        <h2>Gráfico de aluminio</h2>
        <div class="diagram">
          ${reporte.imgAluminio
            ? `<img src="${reporte.imgAluminio}" alt="Gráfico de aluminio" />`
            : '<div class="empty">No se pudo generar el gráfico de aluminio.</div>'}
        </div>

        <h2>Gráfico de vidrio</h2>
        <div class="diagram">
          ${reporte.imgVidrio
            ? `<img src="${reporte.imgVidrio}" alt="Gráfico de vidrio" />`
            : '<div class="empty">No se pudo generar el gráfico de vidrio.</div>'}
        </div>
      </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(contenido);
    popup.document.close();

    return new Promise((resolve) => {
      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        try { popup.close(); } catch {}
        resolve(true);
      };

      popup.onafterprint = finish;

      const pollClose = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollClose);
          finish();
        }
      }, 250);

      const triggerPrint = () => {
        try {
          popup.focus();
          popup.print();
        } catch {
          clearInterval(pollClose);
          finish();
        }
      };

      if (popup.document.readyState === 'complete') {
        setTimeout(triggerPrint, 120);
      } else {
        popup.onload = () => setTimeout(triggerPrint, 120);
      }
    });
  }, [escapeHtml, showToast]);

  const expandirPorCantidad = useCallback((cortesLista, projector) => {
    return (cortesLista || []).flatMap((corte, corteIndex) => {
      const cantidad = Math.max(1, Number(corte?.cantidad || 1));
      return Array.from({ length: cantidad }, (_, idx) => projector(corte, corteIndex, idx));
    });
  }, []);

  // Dimensiones reales de plancha/barra desde categoria_detalle (null = aún cargando)
  const [dimsVidrio,   setDimsVidrio]   = useState(null);
  const [dimsAluminio, setDimsAluminio] = useState(null);

  useEffect(() => {
    fetch('/api/categorias/detalles')
      .then(r => r.json())
      .then(d => {
        let foundVid = false, foundAl = false;
        if (d?.data) d.data.forEach(det => {
          const n = (det.categoria_nombre || '').toUpperCase();
          if (n.includes('VIDRIO')) { setDimsVidrio(det); foundVid = true; }
          if (n.includes('ALUMIN')) { setDimsAluminio(det); foundAl = true; }
        });
        if (!foundVid) setDimsVidrio({ plancha_ancho_cm: 300, plancha_alto_cm: 300 });
        if (!foundAl)  setDimsAluminio({ barra_largo_cm: 300 });
      })
      .catch(() => {
        setDimsVidrio({ plancha_ancho_cm: 300, plancha_alto_cm: 300 });
        setDimsAluminio({ barra_largo_cm: 300 });
      });
  }, []);

  const largoBarraCm = Number(dimsAluminio?.barra_largo_cm || 300);

  /* ─ optimización FFD aluminio desde backend ─ */
  const optimizarAluminio = useCallback(() => {
    if (!dimsAluminio) return; // esperar hasta que carguen las dims
    if (!cortesPorProducto.length) { setDistAluminioOpt(null); return; }
    const { aluminios: als } = separarPorCategoria(cortesPorProducto);
    const productos = als.flatMap((prod) =>
      (prod.cortes || []).flatMap((corte, ci) => {
        const largo = Number(corte.ancho_cm || corte.alto_cm || 0);
        if (largo <= 0) return [];
        const qty = Math.max(1, Number(corte.cantidad || 1));
        return Array.from({ length: qty }, (_, idx) => ({
          id: `${corte.id_corte || prod.producto_nombre || 'al'}-${ci}-${idx}`,
          largo,
          cantidad: 1,
          _fila: prod.producto_almacen_fila || '',
          _columna: prod.producto_almacen_columna || '',
        }));
      })
    );
    if (!productos.length) { setDistAluminioOpt(null); return; }
    const lookup = Object.fromEntries(productos.map(p => [p.id, p]));
    setCargandoOptAluminio(true);
    fetch('/api/optimizacion-cortes/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo_material: 'aluminio',
        barra_largo: largoBarraCm,
        productos: productos.map(({ id, largo, cantidad }) => ({ id, largo, cantidad })),
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.barras) {
          showToast(data.message || data.error || 'Error al optimizar aluminio', 'error');
          return;
        }
        setDistAluminioOpt(data.barras.map(b => {
          const firstSrc = b.cortes[0] ? lookup[b.cortes[0].corte_id] : null;
          return {
            cortes: b.cortes.map(c => {
              const src = lookup[c.corte_id] || {};
              return { largo_cm: c.largo, _pieceId: c.corte_id,
                producto_almacen_fila: src._fila || '', producto_almacen_columna: src._columna || '' };
            }),
            usado: b.usado,
            retazo: b.retazo,
            eficiencia: b.eficiencia,
            fila: firstSrc?._fila || '',
            columna: firstSrc?._columna || '',
          };
        }));
      })
      .catch(() => {})
      .finally(() => setCargandoOptAluminio(false));
  }, [cortesPorProducto, dimsAluminio]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { optimizarAluminio(); }, [optimizarAluminio]);

  useEffect(() => {
    const required = Math.max(1, distAluminioOpt?.length ?? 1);
    setBarras((prev) => {
      if (prev.length === required) return prev;
      if (prev.length > required) return prev.slice(0, required);
      const next = [...prev];
      for (let i = prev.length; i < required; i += 1) {
        next.push({ id: i + 1, nombre: `Barra ${i + 1}`, medidas: [],
          info: { fila: 'A', columna: '1', stock: i === 0 } });
      }
      return next;
    });
  }, [distAluminioOpt]); // eslint-disable-line react-hooks/exhaustive-deps

  const vidrioPlanchaAncho = Number(dimsVidrio?.plancha_ancho_cm || 300);
  const vidrioPlanchaAlto  = Number(dimsVidrio?.plancha_alto_cm  || 300);

  const obtenerCortesVidrio = () =>
    (vidrios || []).flatMap((producto) =>
      expandirPorCantidad(producto.cortes || [], (corte, corteIndex, idx) => {
        const ancho = Number(corte.ancho_cm || 0);
        const alto  = Number(corte.alto_cm  || 0);
        return {
          ...corte,
          producto_nombre: producto.producto_nombre,
          ancho_cm: Number.isFinite(ancho) ? ancho : 0,
          alto_cm: Number.isFinite(alto) ? alto : 0,
          producto_almacen_fila: producto.producto_almacen_fila,
          producto_almacen_columna: producto.producto_almacen_columna,
          _pieceId: `${corte.id_corte || producto.producto_nombre || 'vi'}-${corteIndex}-${idx}`,
        };
      })
    );

  const cortesVidrio = obtenerCortesVidrio();

  const obtenerVidriosUnicos = () => {
    const vidriosMap = new Map();
    cortesVidrio.forEach((corte) => {
      if (!vidriosMap.has(corte.producto_nombre))
        vidriosMap.set(corte.producto_nombre, {
          nombre: corte.producto_nombre,
          fila:   corte.producto_almacen_fila,
          columna:corte.producto_almacen_columna,
          cortes: [],
        });
      vidriosMap.get(corte.producto_nombre).cortes.push(corte);
    });
    return Array.from(vidriosMap.values());
  };

  const vidriosUnicos = obtenerVidriosUnicos();

  useEffect(() => {
    if (vidriosUnicos.length > 0 && !selectedVidrio)
      setSelectedVidrio(vidriosUnicos[0].nombre);
  }, [vidriosUnicos]);

  /* ─ optimización guillotina vidrio desde backend ─ */
  const optimizarVidrio = useCallback(() => {
    if (!dimsVidrio) return; // esperar hasta que carguen las dims
    if (!selectedVidrio || !cortesPorProducto.length) return;
    const { vidrios: vids } = separarPorCategoria(cortesPorProducto);
    const prodVidrio = vids.find(p => p.producto_nombre === selectedVidrio);
    if (!prodVidrio?.cortes?.length) return;
    const productos = (prodVidrio.cortes || []).flatMap((corte, ci) => {
      const ancho = Number(corte.ancho_cm || 0);
      const alto = Number(corte.alto_cm || 0);
      if (ancho <= 0 || alto <= 0) return [];
      const qty = Math.max(1, Number(corte.cantidad || 1));
      return Array.from({ length: qty }, (_, idx) => ({
        id: `${corte.id_corte || prodVidrio.producto_nombre || 'vi'}-${ci}-${idx}`,
        ancho, alto, cantidad: 1,
      }));
    });
    if (!productos.length) return;
    // Cancelar fetch anterior si está en curso
    if (abortOptVidrio.current) abortOptVidrio.current.abort();
    abortOptVidrio.current = new AbortController();
    const signal = abortOptVidrio.current.signal;
    setCargandoOptVidrio(true);
    fetch('/api/optimizacion-cortes/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo_material: 'vidrio', plancha_ancho: Number(dimsVidrio.plancha_ancho_cm || 300), plancha_alto: Number(dimsVidrio.plancha_alto_cm || 300), productos }),
      signal,
    })
      .then(r => r.json())
      .then(data => {
        if (signal.aborted) return;
        if (!data.success || !data.planchas) {
          showToast(data.message || data.error || 'Error al optimizar vidrio', 'error');
          return;
        }
        // Leer retazos asignados desde localStorage y marcar esos cortes en rojo
        let retazoIds = new Set();
        try {
          const raw = localStorage.getItem(`retazo_seleccion_${notificacion?.id}`);
          if (raw) {
            const sel = JSON.parse(raw);
            sel.forEach(item => {
              if (item.merma_id && item.material?.toLowerCase() === 'vidrio') {
                retazoIds.add(String(item.corte_id));
              }
            });
          }
        } catch {}
        const planchasMarcadas = data.planchas.map(plancha => ({
          ...plancha,
          cortes: (plancha.cortes || []).map(c => {
            const baseId = String(c.corte_id || '').split('-')[0];
            const esDeRetazo = retazoIds.has(String(c.corte_id)) || retazoIds.has(baseId);
            return esDeRetazo ? { ...c, origen: 'retazo' } : c;
          }),
        }));
        setPlanVidrioPorNombre(prev => ({ ...prev, [selectedVidrio]: planchasMarcadas }));
        setCortesNoColocados(prev => ({ ...prev, [selectedVidrio]: [] }));
        setCortePendiente(null);
        const efGlobal = data.eficiencia_global ?? planchasMarcadas[0]?.eficiencia ?? 0;
        onEficienciaChange?.(Math.round(Number(efGlobal)));
        onCortesChange?.(planchasMarcadas.flatMap((p, pi) =>
          (p.cortes || []).map((c, ci) => ({
            id: `${String.fromCharCode(65+pi)}${ci+1}`,
            dim: `${c.ancho}×${c.alto}`,
          }))
        ));
        showToast(`Optimización: ${planchasMarcadas.length} plancha${planchasMarcadas.length !== 1 ? 's' : ''} · ${efGlobal}% eficiencia`, 'success');
      })
      .catch(err => { if (err.name !== 'AbortError') showToast('Sin conexión al optimizador: ' + err.message, 'error'); })
      .finally(() => { if (!signal.aborted) setCargandoOptVidrio(false); });
  }, [selectedVidrio, cortesPorProducto, dimsVidrio]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { optimizarVidrio(); }, [optimizarVidrio]);

  const descargarPdfVidrio = useCallback(() => {
    if (!selectedVidrio || !cortesPorProducto.length) return;
    const { vidrios: vids } = separarPorCategoria(cortesPorProducto);
    const prodVidrio = vids.find(p => p.producto_nombre === selectedVidrio);
    if (!prodVidrio?.cortes?.length) return;
    const productos = (prodVidrio.cortes || []).flatMap((corte, ci) => {
      const ancho = Number(corte.ancho_cm || 0);
      const alto = Number(corte.alto_cm || 0);
      if (ancho <= 0 || alto <= 0) return [];
      const qty = Math.max(1, Number(corte.cantidad || 1));
      return Array.from({ length: qty }, (_, idx) => ({
        id: `${corte.id_corte || prodVidrio.producto_nombre || 'vi'}-${ci}-${idx}`,
        ancho, alto, cantidad: 1,
      }));
    });
    if (!productos.length) return;
    fetch('/api/optimizacion-cortes/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo_material: 'vidrio', plancha_ancho: Number(dimsVidrio.plancha_ancho_cm || 300), plancha_alto: Number(dimsVidrio.plancha_alto_cm || 300),
        productos,
        cliente: notificacion?.cliente_nombre || '',
        referencia: notificacion?.id || '',
      }),
    })
      .then(r => {
        if (!r.ok) throw new Error('Error generando PDF');
        return r.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cortes_${selectedVidrio.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => showToast('Error descargando PDF: ' + err.message, 'error'));
  }, [selectedVidrio, cortesPorProducto, notificacion]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Expone funciones al padre via actionsRef */
  useEffect(() => {
    if (!actionsRef) return;
    actionsRef.current = { optimizarVidrio, optimizarAluminio, descargarPdfVidrio };
  }, [actionsRef, optimizarVidrio, optimizarAluminio, descargarPdfVidrio]);

  /* ─ handlers interactividad plancha ─ */
  const handleMoveCorte = useCallback((vidName, planchaIdx, corteIdx, nx, ny) => {
    setPlanVidrioPorNombre(prev => {
      const ps = (prev[vidName] || []).map((p, pi) => pi !== planchaIdx ? p : {
        ...p, cortes: p.cortes.map((c, ci) => ci !== corteIdx ? c : { ...c, x: nx, y: ny }),
      });
      return { ...prev, [vidName]: ps };
    });
  }, []);

  const handleRotateCorte = useCallback((vidName, planchaIdx, ci) => {
    setPlanVidrioPorNombre(prev => {
      const ps = (prev[vidName] || []).map((p, pi) => pi !== planchaIdx ? p : {
        ...p, cortes: p.cortes.map((c, i) => i !== ci ? c : { ...c, ancho: c.alto, alto: c.ancho, rotado: !c.rotado }),
      });
      return { ...prev, [vidName]: ps };
    });
  }, []);

  const handleRemoveCorte = useCallback((vidName, planchaIdx, corte, corteIdx) => {
    setPlanVidrioPorNombre(prev => {
      const ps = (prev[vidName] || []).map((p, pi) => pi !== planchaIdx ? p : {
        ...p, cortes: p.cortes.filter((_, ci) => ci !== corteIdx),
      });
      return { ...prev, [vidName]: ps };
    });
    setCortesNoColocados(prev => ({ ...prev, [vidName]: [...(prev[vidName] || []), corte] }));
    setCortePendiente(corte);
    onCortePendienteChange?.(`${corte.ancho}×${corte.alto}`);
  }, []);

  const handlePlaceCorte = useCallback((vidName, planchaIdx, corteConPos) => {
    setPlanVidrioPorNombre(prev => {
      const ps = (prev[vidName] || []).map((p, pi) => pi !== planchaIdx ? p : {
        ...p, cortes: [...p.cortes, corteConPos],
      });
      return { ...prev, [vidName]: ps };
    });
    setCortesNoColocados(prev => {
      const lista = (prev[vidName] || []).filter(c => c !== cortePendiente);
      return { ...prev, [vidName]: lista };
    });
    setCortePendiente(null);
    onCortePendienteChange?.(null);
  }, [cortePendiente]);

  /* ─ handlers interactividad barra aluminio ─ */
  const handleRemoveCorteAl = useCallback((barraIdx, corteIdx, corte) => {
    setDistAluminioOpt(prev => prev.map((b, bi) => bi !== barraIdx ? b : {
      ...b, cortes: b.cortes.filter((_, ci) => ci !== corteIdx),
    }));
    const clean = { ...corte, _x: undefined, _i: undefined };
    setCortesAlNoColocados(prev => [...prev, clean]);
    setCortePendienteAl(clean);
  }, []);

  const handlePlaceCorteAl = useCallback((barraIdx, corteConX) => {
    setDistAluminioOpt(prev => prev.map((b, bi) => bi !== barraIdx ? b : {
      ...b, cortes: [...b.cortes, { ...corteConX, _x: undefined }],
    }));
    setCortesAlNoColocados(prev => prev.filter(c => c !== cortePendienteAl));
    setCortePendienteAl(null);
  }, [cortePendienteAl]);

  useEffect(() => {
    const handleAfterPrint = () => setReporteImpresion(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const cortesVidrioSeleccionado = selectedVidrio
    ? vidriosUnicos.find(v => v.nombre === selectedVidrio)?.cortes || []
    : [];
  const cantidadClienteActual = obtenerCantidadCliente(selectedVidrio || '');
  const almacenFilaVidrio    = selectedVidrio ? vidriosUnicos.find(v => v.nombre === selectedVidrio)?.fila    || '' : '';
  const almacenColumnaVidrio = selectedVidrio ? vidriosUnicos.find(v => v.nombre === selectedVidrio)?.columna || '' : '';

  /* ─ handlers ─ */
  const handleAgregarBarra = () => {
    const newId = Math.max(...barras.map(b => b.id), 0) + 1;
    setBarras([...barras, { id: newId, nombre: `Barra ${newId}`, medidas: [], info: { fila: 'A', columna: '1', stock: false } }]);
  };
  const handleCorteInputChange = (barraId, value) => setCorteInputs({ ...corteInputs, [barraId]: value });
  const handleAgregarCorte = (barraId) => {
    const value = corteInputs[barraId];
    if (value && !isNaN(value) && value > 0) {
      setCortes([...cortes, { barraId, largo: value }]);
      setCorteInputs({ ...corteInputs, [barraId]: '' });
    }
  };

  /* ─ Reporte / impresión ─ */
  const generarReportePDF = async () => {
    try {
      const svgToImage = (svgElement) => {
        if (!svgElement) return null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        return new Promise((resolve) => {
          img.onload = () => {
            canvas.width = svgElement.clientWidth || svgElement.viewBox?.baseVal?.width || 1200;
            canvas.height = svgElement.clientHeight || svgElement.viewBox?.baseVal?.height || 800;
            ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.src = url;
        });
      };

      const imgAluminio = await svgToImage(svgAluminioRef.current);
      const imgVidrio   = await svgToImage(svgVidrioRef.current);

      const productosAluminio = aluminios.map(p => ({
        nombre: p.producto_nombre,
        cortes: (p.cortes || []).map(c => ({
          largo: Number(c.ancho_cm || c.alto_cm || 0),
          cantidad: Number(c.cantidad || 1),
        })),
      }));
      const productosVidrio = vidriosUnicos.map(v => ({
        nombre: v.nombre,
        ubicacion: `Fila ${v.fila || '—'} / Col ${v.columna || '—'}`,
        cortes: v.cortes.map(c => ({
          ancho: Number(c.ancho_cm || 0),
          alto: Number(c.alto_cm || 0),
          cantidad: Number(c.cantidad || 1),
        })),
      }));

      const productosReporte = (productosSeleccionados || []).map((producto) => {
        const cantidad = Math.max(Number(producto?.cantidad_seleccionada || 0), 1);
        const precioUnitario = Number(producto?.precio_unitario || 0);
        const precioTotal = Number(producto?.precio_total || (precioUnitario * cantidad));
        return {
          nombre: producto?.nombre || 'Producto',
          descripcion: producto?.descripcion || 'Sin descripción',
          codigo: producto?.codigo || '—',
          categoria: producto?.categoria || '—',
          cantidad,
          precioUnitario,
          precioTotal,
          ubicacion: producto?.fila || producto?.columna
            ? `Fila ${producto?.fila || '—'} / Col ${producto?.columna || '—'}`
            : 'Sin ubicación',
        };
      });

      const totalUnidades = productosReporte.reduce((sum, producto) => sum + producto.cantidad, 0);
      const totalImporte = productosReporte.reduce((sum, producto) => sum + producto.precioTotal, 0);
      const totalCortesAluminio = productosAluminio.reduce((sum, producto) => sum + producto.cortes.length, 0);
      const totalCortesVidrio = productosVidrio.reduce((sum, producto) => sum + producto.cortes.length, 0);

      const reporte = {
        fechaGeneracion: new Date().toISOString(),
        cliente: notificacion?.nombre || 'Cliente sin nombre',
        seguimiento: notificacion?.descripcion || 'Entrega lista para finalizar',
        fechaEntrega: notificacion?.fecha || new Date().toISOString(),
        productos: productosReporte,
        aluminios: productosAluminio,
        vidrios: productosVidrio,
        imgAluminio,
        imgVidrio,
        resumen: {
          totalProductos: productosReporte.length,
          totalUnidades,
          totalImporte,
          totalCortesAluminio,
          totalCortesVidrio,
        },
      };

      const impreso = await abrirReporteImpresion(reporte);
      if (!impreso) return null;

      return {
        aluminios: productosAluminio,
        vidrios: productosVidrio,
        productos: productosReporte,
        imgAluminio,
        imgVidrio,
      };
    } catch (error) {
      console.error('Error generando PDF:', error);
      showToast('Error al generar el reporte de entrega', 'error');
      return null;
    }
  };

  /* ─ finalizar ─ */
  const finalizarEntregaCompleta = async () => {
    if (finalizando) return;
    setFinalizando(true);
    let debeVolverPanel = false;
    try {
      const datosCortes = await generarReportePDF();
      if (!datosCortes) { setFinalizando(false); return; }
      debeVolverPanel = true;

      console.log('Enviando datos de finalización:', {
        notificacion_id: notificacion?.id,
        productos: datosCortes.productos?.length || 0,
        cortes: (datosCortes.aluminios?.length || 0) + (datosCortes.vidrios?.length || 0),
      });

      const response = await fetch('/api/entrega/finalizar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificacion_id: notificacion?.id, cortes_data: datosCortes }),
      });
      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success) {
        showToast('Entrega completada correctamente', 'success');
        console.log('Entrega finalizada:', data.message);
        localStorage.removeItem('productosSeleccionadosEntrega');
      } else {
        showToast(data.message || 'Error al finalizar entrega', 'error');
        console.error('Error en respuesta:', data);
      }
    } catch (error) {
      console.error('Error finalizando entrega:', error);
      showToast('Error al finalizar la entrega: ' + error.message, 'error');
    } finally {
      setFinalizando(false);
      if (debeVolverPanel && onFinalizarEntrega) {
        setTimeout(() => onFinalizarEntrega(), 120);
      }
    }
  };

  /* ─── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: T.fontBody }}>

      <div className="pd-no-print">

      {/* ── Header cliente / seguimiento / fecha ── */}
      {showHeader && (
        <div className="pd-card" style={{ marginBottom: 16 }}>
          <div className="pd-sec-head">
            <IconPackage size={15} color={T.brandMid}/>
            <span style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: 12,
              color: T.text, letterSpacing: .4 }}>DATOS DE ENTREGA</span>
          </div>
          <div className="pd-delivery-head">
            <div>
              <label className="pd-label">Cliente</label>
              <input className="pd-input" type="text"
                defaultValue={notificacion?.nombre || ''} placeholder="Nombre del cliente"/>
            </div>
            <div>
              <label className="pd-label">Seguimiento</label>
              <div style={{ borderRadius: 12, padding: '6px 10px',
                background: 'rgba(232,246,252,.55)', border: '1px solid rgba(128,194,220,.28)' }}>
                <SeguimientoTrack/>
              </div>
            </div>
            <div>
              <label className="pd-label">Fecha</label>
              <input className="pd-input" type="text"
                defaultValue={
                  notificacion?.fecha
                    ? new Date(notificacion.fecha).toLocaleDateString('es-PE')
                    : new Date().toLocaleDateString('es-PE')
                }
                placeholder="dd/mm/aaaa"/>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {cargandoCortes && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, padding: '44px 0' }}>
          <div style={{ width: 50, height: 50, borderRadius: 14,
            background: T.brandSoft, border: `1px solid ${T.borderMid}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconLoader size={22} color={T.brandMid}
              style={{ animation: 'pdSpin .8s linear infinite' }}/>
          </div>
          <span style={{ fontSize: 12, color: T.textLight, fontFamily: T.fontMono }}>
            Cargando cortes…
          </span>
        </div>
      )}

      {/* ── Layout principal ── */}
      {!cargandoCortes && (
        <>
          {/* ══ ALUMINIOS ══ */}
          {vistaDiseno === 'ALUMINIO' && (<div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.brandMid }}/>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.textMid,
                fontFamily: T.fontMono, letterSpacing: .6, flex: 1 }}>ALUMINIOS</span>
              {distAluminioOpt && (
                <span style={{ fontSize: 9, fontFamily: T.fontMono, fontWeight: 700,
                  color: T.success, background: T.successSoft,
                  border: `1px solid ${T.successBorder}`, borderRadius: 6, padding: '2px 6px' }}>
                  FFD ✓
                </span>
              )}
            </div>

            {cargandoOptAluminio && !distAluminioOpt && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: 24, color: T.textLight, fontFamily: T.fontMono, fontSize: 11 }}>
                <IconLoader size={14} style={{ animation: 'pdSpin .7s linear infinite' }}/> Calculando distribución…
              </div>
            )}

            {/* Panel cortes aluminio sin colocar */}
            {cortesAlNoColocados.length > 0 && (
              <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10,
                background: 'rgba(229,62,62,.05)', border: '1.5px dashed rgba(229,62,62,.35)' }}>
                <div style={{ fontSize: 9, fontFamily: T.fontMono, fontWeight: 700,
                  color: '#E53E3E', marginBottom: 6, letterSpacing: .4 }}>
                  CORTES SIN COLOCAR — click para seleccionar, luego click en barra
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {cortesAlNoColocados.map((c, i) => (
                    <button key={i}
                      onClick={() => setCortePendienteAl(cortePendienteAl === c ? null : c)}
                      style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                        fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                        border: `1.5px solid ${cortePendienteAl === c ? '#E53E3E' : 'rgba(229,62,62,.45)'}`,
                        background: cortePendienteAl === c ? 'rgba(229,62,62,.15)' : 'rgba(229,62,62,.04)',
                        color: '#E53E3E', transition: 'all .15s',
                        outline: cortePendienteAl === c ? '2px solid rgba(229,62,62,.3)' : 'none' }}>
                      {c.largo_cm} cm
                    </button>
                  ))}
                </div>
              </div>
            )}

            {barras.map((barra, idx) => (
              <BarraCard
                key={barra.id}
                barra={barra}
                idx={idx}
                cortesAluminio={distAluminioOpt?.[idx]?.cortes || []}
                largoBarraCm={largoBarraCm}
                svgRef={idx === 0 ? svgAluminioRef : null}
                almacenFila={distAluminioOpt?.[idx]?.fila || ''}
                almacenColumna={distAluminioOpt?.[idx]?.columna || ''}
                cargandoCortes={cargandoCortes}
                cortePendienteAl={cortePendienteAl}
                onRemoveCorteAl={handleRemoveCorteAl}
                onPlaceCorteAl={handlePlaceCorteAl}
              />
            ))}
          </div>)}

          {/* ══ VIDRIO ══ */}
          {vistaDiseno === 'VIDRIO' && (<div>
            {showHeader && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.brand }}/>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.textMid,
                fontFamily: T.fontMono, letterSpacing: .6 }}>VIDRIO</span>
            </div>
            )}

            {!showHeader && vidriosUnicos.length > 1 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 }}>
                {vidriosUnicos.map((v, i) => (
                  <button key={v.nombre}
                    className={`pd-plancha-btn${selectedVidrio === v.nombre ? ' active' : ''}`}
                    onClick={() => setSelectedVidrio(v.nombre)}>
                    {i+1}. {v.nombre.length > 14 ? v.nombre.slice(0, 14) + '…' : v.nombre}
                  </button>
                ))}
              </div>
            )}
            <div className={showHeader ? "pd-card" : ""}>
              {/* Header vidrio */}
              {showHeader && (
              <div className="pd-sec-head">
                <IconBox size={15} color={T.brandMid}/>
                <span style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: 13,
                  color: T.text, flex: 1 }}>
                  {selectedVidrio || 'Plancha'}
                </span>
                {planVidrioPorNombre[selectedVidrio] && (
                  <span style={{ fontSize: 9, fontFamily: T.fontMono, fontWeight: 700,
                    color: T.success, background: T.successSoft,
                    border: `1px solid ${T.successBorder}`, borderRadius: 6, padding: '2px 6px' }}>
                    {planVidrioPorNombre[selectedVidrio].length} plancha{planVidrioPorNombre[selectedVidrio].length !== 1 ? 's' : ''} ✓
                  </span>
                )}
                {vidriosUnicos.length > 1 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {vidriosUnicos.map((v, i) => (
                      <button key={v.nombre}
                        className={`pd-plancha-btn${selectedVidrio === v.nombre ? ' active' : ''}`}
                        onClick={() => setSelectedVidrio(v.nombre)}>
                        {i+1}. {v.nombre.length > 14 ? v.nombre.slice(0, 14) + '…' : v.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              )}

              <div style={{ padding: showHeader ? '14px 18px 18px' : 0 }}>

                {/* Info producto + stock */}
                {showHeader && cortesVidrioSeleccionado.length > 0 && (
                  <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 12,
                    background: T.brandSoft, border: `1px solid ${T.borderMid}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <IconMapPin size={12} color={T.brandMid}/>
                      <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textMid,
                        fontWeight: 600, flex: 1 }}>
                        {selectedVidrio || 'Producto'}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textDim }}>
                        Fila {almacenFilaVidrio||'—'} / Col {almacenColumnaVidrio||'—'}
                      </span>
                    </div>

                  </div>
                )}

                {/* Panel: cortes sin colocar */}
                {(cortesNoColocados[selectedVidrio] || []).length > 0 && (
                  <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(229,62,62,.05)', border: '1.5px dashed rgba(229,62,62,.35)' }}>
                    <div style={{ fontSize: 10, fontFamily: T.fontMono, color: '#C53030', fontWeight: 700,
                      marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚠ CORTES SIN COLOCAR</span>
                      <span style={{ fontWeight: 400, color: '#E53E3E' }}>— selecciona uno y haz click en la plancha para colocarlo</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(cortesNoColocados[selectedVidrio] || []).map((c, i) => (
                        <button key={i}
                          onClick={() => setCortePendiente(cortePendiente === c ? null : c)}
                          style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                            fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                            border: `1.5px solid ${cortePendiente === c ? '#E53E3E' : 'rgba(229,62,62,.45)'}`,
                            background: cortePendiente === c ? 'rgba(229,62,62,.15)' : 'rgba(229,62,62,.04)',
                            color: '#E53E3E', transition: 'all .15s',
                            outline: cortePendiente === c ? '2px solid rgba(229,62,62,.3)' : 'none' }}>
                          {c.ancho}×{c.alto} cm{c.rotado ? ' ↻' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Planchas interactivas */}
                {planVidrioPorNombre[selectedVidrio]
                  ? planVidrioPorNombre[selectedVidrio].map((plancha, pi) => {
                      const retazo = (plancha.retazos || [])[0];
                      const totalPlanchas = planVidrioPorNombre[selectedVidrio].length;
                      return (
                        <div key={pi} style={{ marginBottom: pi < totalPlanchas - 1 ? 10 : 0 }}>
                          {/* Header plancha */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0,
                            padding: '6px 10px',
                            background: '#1E293B',
                            border: '1px solid #1E293B' }}>
                            <span style={{ fontSize: 11, fontFamily: T.fontMono, fontWeight: 800,
                              color: 'white', letterSpacing: '.04em' }}>
                              {totalPlanchas > 1 ? `PLANCHA ${pi+1} / ${totalPlanchas}` : 'PLANCHA'}
                            </span>
                            <span style={{ fontSize: 10, fontFamily: T.fontMono,
                              color: plancha.eficiencia >= 85 ? '#68D391' : plancha.eficiencia >= 70 ? '#F6AD55' : '#FC8181',
                              fontWeight: 700, display:'flex', alignItems:'center', gap:3 }}>
                              {(() => {
                                const ep=plancha.eficiencia, r=9, cx=11, cy=11, circ=2*Math.PI*r;
                                const clr=ep>=85?'#68D391':ep>=70?'#F6AD55':'#FC8181';
                                const dash=(ep/100)*circ;
                                return <svg width={22} height={22} viewBox="0 0 22 22" style={{flexShrink:0}}>
                                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth={2.5}/>
                                  <circle cx={cx} cy={cy} r={r} fill="none" stroke={clr} strokeWidth={2.5}
                                    strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
                                    transform={`rotate(-90 ${cx} ${cy})`}/>
                                </svg>;
                              })()}
                              {plancha.eficiencia.toFixed(0)}% uso
                            </span>
                            <span style={{ fontSize: 10, fontFamily: T.fontMono,
                              color: '#94a3b8', fontWeight: 600, display:'flex', alignItems:'center', gap:3 }}>
                              {(() => {
                                const ep=Math.max(0,100-plancha.eficiencia), r=9, cx=11, cy=11, circ=2*Math.PI*r;
                                const dash=(ep/100)*circ;
                                return <svg width={22} height={22} viewBox="0 0 22 22" style={{flexShrink:0}}>
                                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth={2.5}/>
                                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#64748b" strokeWidth={2.5}
                                    strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
                                    transform={`rotate(-90 ${cx} ${cy})`}/>
                                </svg>;
                              })()}
                              {Math.max(0,100-plancha.eficiencia).toFixed(0)}% retazo
                            </span>
                            <span style={{ fontSize: 9, fontFamily: T.fontMono, color: 'rgba(255,255,255,.45)' }}>
                              {vidrioPlanchaAncho}×{vidrioPlanchaAlto} cm
                            </span>
                            {retazo && (
                              <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: T.fontMono,
                                fontWeight: 700, color: '#68D391',
                                background: 'rgba(56,161,105,.18)', borderRadius: 4, padding: '1px 7px',
                                border: '1px solid rgba(56,161,105,.4)' }}>
                                Retazo {retazo.ancho}×{retazo.alto} cm ({Math.round(retazo.ancho*retazo.alto/(vidrioPlanchaAncho*vidrioPlanchaAlto)*100)}%)
                              </span>
                            )}
                            {cortePendiente && (
                              <span style={{ marginLeft: retazo ? 4 : 'auto', fontSize: 9,
                                fontFamily: T.fontMono, color: '#F6AD55', fontWeight:700 }}>
                                ↖ {cortePendiente.ancho}×{cortePendiente.alto}
                              </span>
                            )}
                          </div>
                          {/* SVG interactivo + panel de medidas */}
                          <div style={{ display: 'flex', border: '1px solid #CBD5E0', borderTop: 'none' }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                            <PlanchaInteractiva
                              plancha={plancha}
                              planchaAncho={vidrioPlanchaAncho}
                              planchaAlto={vidrioPlanchaAlto}
                              planchaIdx={pi}
                              svgRef={pi === 0 ? svgVidrioRef : null}
                              cortePendiente={cortePendiente}
                              onMoveCorte={(ci, nx, ny) => handleMoveCorte(selectedVidrio, pi, ci, nx, ny)}
                              onRotate={ci => handleRotateCorte(selectedVidrio, pi, ci)}
                              onRemove={(c, ci) => handleRemoveCorte(selectedVidrio, pi, c, ci)}
                              onPlace={cp => handlePlaceCorte(selectedVidrio, pi, cp)}
                              annotMode={annotMode}
                              highlightLabel={highlightLabel}
                            />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, padding: 40, borderRadius: 10, border: '1.5px dashed rgba(128,194,220,.3)',
                        color: T.textLight, fontFamily: T.fontMono, fontSize: 11 }}>
                        <IconLoader size={14} style={{ animation: 'pdSpin .7s linear infinite' }}/>
                        Calculando layout…
                      </div>
                    )
                }

                {/* Ubicación compacta */}
                {showHeader && (almacenFilaVidrio || almacenColumnaVidrio) && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 10, fontFamily: T.fontMono, color: T.textDim }}>
                    <IconMapPin size={10} color={T.brandMid}/>
                    Ubicación: Fila {almacenFilaVidrio||'—'} / Col {almacenColumnaVidrio||'—'}
                  </div>
                )}
              </div>
            </div>
          </div>)}
        </>
      )}

      {/* ── Botón guardar ── */}
      {showHeader && !cargandoCortes && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
          <button className="pd-save" onClick={finalizarEntregaCompleta} disabled={finalizando}>
            {finalizando
              ? <><IconLoader size={15} style={{ animation: 'pdSpin .7s linear infinite' }}/> Finalizando…</>
              : <><IconCheck size={15}/> Guardar</>}
          </button>
        </div>
      )}

      </div>

      {reporteImpresion && (
        <div className="pd-print-root">
          <div className="pd-print-shell" style={{ ['--fh']: T.fontHead }}>
            <div className="pd-print-header">
              <div>
                <div className="pd-print-kicker">VIDRIOBRAS</div>
                <div className="pd-print-brand">ENTREGA FINAL</div>
                <div className="pd-print-title">Reporte de productos y cortes</div>
                <div className="pd-print-subtitle">
                  Resumen final de los materiales seleccionados y la distribución de cortes preparada para la entrega del cliente.
                </div>
              </div>

              <div className="pd-print-meta">
                <div className="pd-print-meta-card">
                  <div className="pd-print-meta-label">Cliente</div>
                  <div className="pd-print-meta-value">{reporteImpresion.cliente}</div>
                </div>
                <div className="pd-print-meta-card">
                  <div className="pd-print-meta-label">Fecha de entrega</div>
                  <div className="pd-print-meta-value">{formatDate(reporteImpresion.fechaEntrega)}</div>
                </div>
                <div className="pd-print-meta-card">
                  <div className="pd-print-meta-label">Generado</div>
                  <div className="pd-print-meta-value">{formatDate(reporteImpresion.fechaGeneracion)}</div>
                </div>
              </div>
            </div>

            <div className="pd-print-summary">
              <div className="pd-print-summary-card">
                <div className="pd-print-summary-label">Productos</div>
                <div className="pd-print-summary-value">{reporteImpresion.resumen.totalProductos}</div>
                <div className="pd-print-summary-note">Items distintos seleccionados</div>
              </div>
              <div className="pd-print-summary-card">
                <div className="pd-print-summary-label">Unidades</div>
                <div className="pd-print-summary-value">{reporteImpresion.resumen.totalUnidades}</div>
                <div className="pd-print-summary-note">Cantidad total a entregar</div>
              </div>
              <div className="pd-print-summary-card">
                <div className="pd-print-summary-label">Cortes</div>
                <div className="pd-print-summary-value">
                  {reporteImpresion.resumen.totalCortesAluminio + reporteImpresion.resumen.totalCortesVidrio}
                </div>
                <div className="pd-print-summary-note">
                  {reporteImpresion.resumen.totalCortesAluminio} aluminio / {reporteImpresion.resumen.totalCortesVidrio} vidrio
                </div>
              </div>
              <div className="pd-print-summary-card is-accent">
                <div className="pd-print-summary-label">Importe</div>
                <div className="pd-print-summary-value">{formatCurrency(reporteImpresion.resumen.totalImporte)}</div>
                <div className="pd-print-summary-note">Valorización de productos seleccionados</div>
              </div>
            </div>

            <section className="pd-print-section">
              <div className="pd-print-section-head">
                <div className="pd-print-section-kicker">Resumen comercial</div>
                <div className="pd-print-section-title">Productos seleccionados</div>
              </div>
              <div className="pd-print-section-body">
                {reporteImpresion.productos.length > 0 ? (
                  <div className="pd-print-grid">
                    <div className="pd-print-table-wrap">
                      <table className="pd-print-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>P. Unit.</th>
                            <th>Subtotal</th>
                            <th>Ubicación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteImpresion.productos.map((producto, index) => (
                            <tr key={`${producto.nombre}-${index}`}>
                              <td>
                                <div className="pd-print-strong">{producto.nombre}</div>
                                <div className="pd-print-muted">{producto.descripcion}</div>
                                <div className="pd-print-muted">{producto.categoria} · {producto.codigo}</div>
                              </td>
                              <td>{producto.cantidad}</td>
                              <td>{formatCurrency(producto.precioUnitario)}</td>
                              <td className="pd-print-strong">{formatCurrency(producto.precioTotal)}</td>
                              <td>{producto.ubicacion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pd-print-totals">
                      <div className="pd-print-note">
                        <div className="pd-print-section-kicker" style={{ marginBottom: 8 }}>Seguimiento</div>
                        {reporteImpresion.seguimiento}
                      </div>
                      <div className="pd-print-total-row">
                        <strong>Total de unidades</strong>
                        <span>{reporteImpresion.resumen.totalUnidades}</span>
                      </div>
                      <div className="pd-print-total-row">
                        <strong>Total valorizado</strong>
                        <span>{formatCurrency(reporteImpresion.resumen.totalImporte)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pd-print-note is-alert">No hay productos seleccionados registrados para este cierre.</div>
                )}
              </div>
            </section>

            <section className="pd-print-section">
              <div className="pd-print-section-head">
                <div className="pd-print-section-kicker">Producción</div>
                <div className="pd-print-section-title">Cortes de aluminio</div>
              </div>
              <div className="pd-print-section-body">
                {reporteImpresion.aluminios.length > 0 ? (
                  <div className="pd-print-grid">
                    <div className="pd-print-table-wrap">
                      <table className="pd-print-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cortes</th>
                            <th>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteImpresion.aluminios.map((producto, index) => (
                            <tr key={`${producto.nombre}-${index}`}>
                              <td className="pd-print-strong">{producto.nombre}</td>
                              <td>{producto.cortes.length}</td>
                              <td>
                                <div className="pd-print-pill-list">
                                  {producto.cortes.map((corte, corteIndex) => (
                                    <span key={`${producto.nombre}-${corteIndex}`} className="pd-print-pill">
                                      {corteIndex + 1}. {Number(corte.largo || 0)} cm
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pd-print-diagram">
                      <div className="pd-print-diagram-title">Distribución en barra de 300 cm</div>
                      {reporteImpresion.imgAluminio
                        ? <img src={reporteImpresion.imgAluminio} alt="Distribución de aluminio" />
                        : <div className="pd-print-note is-alert">No se pudo generar la vista del diagrama de aluminio.</div>}
                    </div>
                  </div>
                ) : (
                  <div className="pd-print-note is-alert">No hay cortes de aluminio registrados para esta entrega.</div>
                )}
              </div>
            </section>

            <section className="pd-print-section">
              <div className="pd-print-section-head">
                <div className="pd-print-section-kicker">Producción</div>
                <div className="pd-print-section-title">Cortes de vidrio</div>
              </div>
              <div className="pd-print-section-body">
                {reporteImpresion.vidrios.length > 0 ? (
                  <div className="pd-print-grid">
                    <div className="pd-print-table-wrap">
                      <table className="pd-print-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Ubicación</th>
                            <th>Cortes</th>
                            <th>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporteImpresion.vidrios.map((producto, index) => (
                            <tr key={`${producto.nombre}-${index}`}>
                              <td className="pd-print-strong">{producto.nombre}</td>
                              <td>{producto.ubicacion}</td>
                              <td>{producto.cortes.length}</td>
                              <td>
                                <div className="pd-print-pill-list">
                                  {producto.cortes.map((corte, corteIndex) => (
                                    <span key={`${producto.nombre}-${corteIndex}`} className="pd-print-pill">
                                      {corteIndex + 1}. {Number(corte.ancho || 0)} × {Number(corte.alto || 0)} cm
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pd-print-diagram">
                      <div className="pd-print-diagram-title">Distribución en plancha 300 × 300 cm</div>
                      {reporteImpresion.imgVidrio
                        ? <img src={reporteImpresion.imgVidrio} alt="Distribución de vidrio" />
                        : <div className="pd-print-note is-alert">No se pudo generar la vista del diagrama de vidrio.</div>}
                    </div>
                  </div>
                ) : (
                  <div className="pd-print-note is-alert">No hay cortes de vidrio registrados para esta entrega.</div>
                )}
              </div>
            </section>

            <div className="pd-print-footer">
              <span>VIDRIOBRAS · Reporte de entrega generado automáticamente</span>
              <span>Cliente: {reporteImpresion.cliente}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;