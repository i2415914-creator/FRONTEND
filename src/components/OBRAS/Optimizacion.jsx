import React, { useState, useCallback, useEffect } from 'react';
import {
  IconLayoutDashboard, IconScissors, IconPackage, IconTool,
  IconSettings, IconLogout, IconBell, IconUser, IconX,
  IconCheck, IconAlertTriangle, IconRefresh, IconZoomIn,
  IconRotate, IconPlayerPlay, IconPlayerPause, IconPlayerStop,
  IconReload, IconPlus, IconUpload, IconLoader,
} from '@tabler/icons-react';
import Retazo from './Retazo';
import Materiales from './Materiales';
import Productos from './Productos';

/* ─── CSS ──────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

@keyframes optSpin { to { transform: rotate(360deg); } }
@keyframes optPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes optFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes optToastIn { from{opacity:0;transform:translateX(-50%) translateY(-14px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

*{box-sizing:border-box;margin:0;padding:0;}

.opt-root {
  display:flex; height:calc(100vh - 56px); width:100%; overflow:hidden;
  font-family:'Inter',system-ui,sans-serif;
  background:#f0f4f8; color:#1e293b;
}
@media(min-width:640px){ .opt-root { height:calc(100vh - 80px); } }
@media(min-width:1024px){ .opt-root { height:calc(100vh - 88px); } }

/* ── LEFT SIDEBAR ── */
.opt-sidebar {
  width:250px; min-width:250px; height:calc(100vh - 56px);
  background:#fff; border-right:1px solid #e2e8f0;
  display:flex; flex-direction:column;
  overflow:hidden; flex-shrink:0;
}
@media(min-width:640px){ .opt-sidebar { height:calc(100vh - 80px); } }
@media(min-width:1024px){ .opt-sidebar { height:calc(100vh - 88px); } }
.opt-logo {
  padding:20px 20px 16px;
  border-bottom:1px solid #f1f5f9;
  flex-shrink:0;
}
.opt-logo-text {
  font-size:22px; font-weight:800; letter-spacing:.04em;
  color:#0d9488;
}
.opt-nav {
  flex:1; padding:10px 0; overflow-y:auto;
}
.opt-nav-item {
  display:flex; align-items:center; gap:10px;
  padding:10px 16px; cursor:pointer;
  font-size:13px; font-weight:500; color:#64748b;
  border-radius:0; transition:all .15s;
  position:relative; border:none; background:transparent;
  width:100%; text-align:left;
}
.opt-nav-item:hover { background:#f8fafc; color:#1e293b; }
.opt-nav-item.active {
  background:#0d9488; color:#fff;
  font-weight:600;
}
.opt-nav-item.active svg { color:#fff; }
.opt-nav-icon { width:18px; height:18px; flex-shrink:0; }

.opt-sidebar-bottom {
  padding:12px; border-top:1px solid #f1f5f9; flex-shrink:0;
  display:flex; flex-direction:column; gap:8px;
}
.opt-stat-card {
  background:#f8fafc; border:1px solid #e2e8f0;
  border-radius:10px; padding:10px 12px;
  display:flex; align-items:center; gap:10px;
}
.opt-stat-icon-wrap {
  width:34px; height:34px; border-radius:8px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.opt-stat-label { font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.opt-stat-val { font-size:15px; font-weight:800; color:#1e293b; line-height:1.1; }
.opt-online { font-size:15px; font-weight:800; color:#16a34a; }

/* ── CENTER + RIGHT WRAPPER ── */
.opt-main {
  flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden;
}

/* ── TOP BAR ── */
.opt-topbar {
  height:52px; background:#fff; border-bottom:1px solid #e2e8f0;
  display:flex; align-items:center; justify-content:space-between;
  padding:0 20px; flex-shrink:0;
}
.opt-topbar-title { font-size:19px; font-weight:700; color:#1e293b; }
.opt-topbar-right { display:flex; align-items:center; gap:12px; }
.opt-operator { display:flex; align-items:center; gap:7px; font-size:13px; color:#64748b; }
.opt-operator strong { color:#1e293b; }
.opt-avatar { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#0d9488,#0f766e); display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:700; }
.opt-notif-pill {
  display:flex; align-items:center; gap:6px;
  background:#f0fdf4; border:1px solid #bbf7d0;
  border-radius:20px; padding:4px 10px 4px 8px;
  font-size:11px; color:#15803d; font-weight:500;
}
.opt-notif-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; animation:optPulse 2s infinite; }
.opt-notif-close { background:none; border:none; cursor:pointer; color:#86efac; display:flex; align-items:center; margin-left:2px; }

/* ── CONTENT AREA ── */
.opt-content-area {
  flex:1; min-height:0; display:flex; overflow:hidden;
}

/* ── CENTER PANEL ── */
.opt-center {
  flex:1; min-width:0; display:flex; flex-direction:column;
  padding:14px; gap:12px; overflow:hidden;
}
.opt-project-title {
  font-size:18px; font-weight:700; color:#1e293b; flex-shrink:0;
}

/* Center split: two sub-columns */
.opt-center-split {
  flex:1; min-height:0; display:grid;
  grid-template-columns:1fr 1fr; gap:12px;
}

/* ── CARD ── */
.opt-card {
  background:#fff; border:1px solid #e2e8f0;
  border-radius:12px; display:flex; flex-direction:column;
  overflow:hidden; animation:optFade .25s ease;
  box-shadow:0 1px 3px rgba(0,0,0,.06);
}
.opt-card-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px 9px; border-bottom:1px solid #f1f5f9; flex-shrink:0;
}
.opt-card-title { font-size:12px; font-weight:700; color:#374151; letter-spacing:.02em; }
.opt-card-actions { display:flex; gap:5px; }
.opt-icon-btn {
  width:26px; height:26px; border-radius:6px; border:1px solid #e2e8f0;
  background:#fff; cursor:pointer; display:flex; align-items:center;
  justify-content:center; color:#94a3b8; transition:all .15s;
}
.opt-icon-btn:hover { background:#f8fafc; color:#475569; }

/* SVG panel */
.opt-svg-wrap { flex:1; min-height:0; position:relative; overflow:hidden; }
.opt-svg-inner { position:absolute; inset:0; }
.opt-tools-bar {
  display:flex; gap:1px; padding:8px 10px;
  background:#f8fafc; border-top:1px solid #f1f5f9; flex-shrink:0;
}
.opt-tool-btn {
  flex:1; display:flex; align-items:center; justify-content:center; gap:4px;
  padding:6px 4px; border-radius:7px; border:1px solid #e2e8f0;
  background:#fff; cursor:pointer; font-size:10px; font-weight:600;
  color:#475569; transition:all .15s; white-space:nowrap;
}
.opt-tool-btn:hover { background:#f1f5f9; border-color:#cbd5e1; }

/* Cuts panel */
.opt-cuts-panel { flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden; }
.opt-gauge-row {
  display:flex; align-items:center; gap:12px;
  padding:10px 14px 8px; flex-shrink:0;
}
.opt-gauge-label { font-size:12px; font-weight:700; color:#374151; flex:1; }
.opt-gauge-wrap { position:relative; width:72px; height:72px; flex-shrink:0; }
.opt-gauge-pct { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:#1e293b; }
.opt-progress-bar-wrap { height:5px; background:#e2e8f0; border-radius:999px; margin:0 14px 8px; flex-shrink:0; overflow:hidden; }
.opt-progress-bar-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#0d9488,#14b8a6); transition:width .5s ease; }

.opt-table-wrap { flex:1; overflow-y:auto; min-height:0; }
.opt-table { width:100%; border-collapse:collapse; font-size:11.5px; }
.opt-table thead th {
  padding:7px 10px; text-align:left; font-size:10px; font-weight:700;
  color:#94a3b8; text-transform:uppercase; letter-spacing:.06em;
  background:#f8fafc; border-bottom:1px solid #e2e8f0;
  position:sticky; top:0; white-space:nowrap;
}
.opt-table tbody td { padding:7px 10px; border-bottom:1px solid #f1f5f9; color:#374151; }
.opt-table tbody tr:hover td { background:#f8fafc; }
.opt-table-sort { display:inline-flex; align-items:center; gap:3px; cursor:pointer; }
.opt-table-sort svg { opacity:.4; }
.opt-badge {
  display:inline-flex; align-items:center; padding:2px 8px;
  border-radius:999px; font-size:10px; font-weight:700; white-space:nowrap;
}
.opt-badge.espera { background:#fef9c3; color:#854d0e; border:1px solid #fde047; }
.opt-badge.proceso { background:#dbeafe; color:#1d4ed8; border:1px solid #93c5fd; }
.opt-badge.listo { background:#dcfce7; color:#15803d; border:1px solid #86efac; }

.opt-table-actions {
  display:flex; gap:8px; padding:8px 10px; border-top:1px solid #f1f5f9; flex-shrink:0;
}
.opt-action-btn {
  flex:1; display:flex; align-items:center; justify-content:center; gap:5px;
  padding:8px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:700;
  transition:all .15s; border:none;
}
.opt-action-btn.primary { background:#0d9488; color:#fff; }
.opt-action-btn.primary:hover { background:#0f766e; }
.opt-action-btn.secondary { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
.opt-action-btn.secondary:hover { background:#e2e8f0; }

/* ── RIGHT SIDEBAR ── */
.opt-right {
  width:350px; min-width:350px; height:100%;
  background:#f0f4f8; border-left:1px solid #e2e8f0;
  display:flex; flex-direction:column; gap:10px;
  padding:12px; overflow-y:auto; flex-shrink:0;
}

.opt-feed-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; flex-shrink:0; }
.opt-feed-thumb {
  position:relative; height:110px;
  background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);
}
.opt-feed-grid {
  position:absolute; inset:0;
  background-image:
    repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(255,255,255,.03) 14px,rgba(255,255,255,.03) 15px),
    repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(255,255,255,.03) 14px,rgba(255,255,255,.03) 15px);
}
.opt-feed-overlay {
  position:absolute; inset:0;
  background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,.45) 100%);
}
.opt-feed-label {
  position:absolute; bottom:7px; left:9px;
  font-size:10px; font-weight:700; color:rgba(255,255,255,.75);
  background:rgba(0,0,0,.4); padding:2px 8px; border-radius:999px; letter-spacing:.06em;
}
.opt-feed-rec { position:absolute; top:8px; right:8px; display:flex; align-items:center; gap:4px; }
.opt-feed-dot { width:6px; height:6px; border-radius:50%; background:#ef4444; animation:optPulse 1.5s infinite; }
.opt-feed-rec-text { font-size:9px; color:rgba(255,255,255,.6); font-weight:700; }
/* CNC machine silhouette lines */
.opt-feed-silhouette { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }

.opt-process-body { padding:10px 14px 12px; }
.opt-process-title { font-size:12px; font-weight:700; color:#374151; margin-bottom:8px; }
.opt-process-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
.opt-process-key { font-size:11px; color:#64748b; }
.opt-process-val { font-size:11px; font-weight:700; color:#1e293b; }
.opt-mini-track { height:6px; background:#e2e8f0; border-radius:999px; margin-top:6px; overflow:hidden; }
.opt-mini-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#0d9488,#14b8a6); transition:width .5s; }

.opt-ctrl-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; flex-shrink:0; }
.opt-ctrl-head { padding:10px 14px 9px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:700; color:#374151; }
.opt-ctrl-btns { padding:10px 12px 12px; display:flex; flex-direction:column; gap:7px; }
.opt-ctrl-btn {
  width:100%; padding:11px; border-radius:9px; cursor:pointer;
  font-size:12px; font-weight:800; letter-spacing:.08em;
  border:none; transition:all .18s; display:flex; align-items:center;
  justify-content:center; gap:7px;
}
.opt-ctrl-btn.green  { background:#16a34a; color:#fff; box-shadow:0 2px 8px rgba(22,163,74,.25); }
.opt-ctrl-btn.green:hover  { background:#15803d; }
.opt-ctrl-btn.yellow { background:#eab308; color:#fff; box-shadow:0 2px 8px rgba(234,179,8,.20); }
.opt-ctrl-btn.yellow:hover { background:#ca8a04; }
.opt-ctrl-btn.red    { background:#dc2626; color:#fff; box-shadow:0 2px 8px rgba(220,38,38,.22); }
.opt-ctrl-btn.red:hover    { background:#b91c1c; }
.opt-ctrl-btn.outline { background:#fff; color:#374151; border:1.5px solid #cbd5e1; }
.opt-ctrl-btn.outline:hover { background:#f8fafc; }
.opt-ctrl-btn:disabled { opacity:.45; cursor:not-allowed; }

.opt-alert-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; flex:1; }
.opt-alert-head { padding:10px 14px 9px; border-bottom:1px solid #f1f5f9; font-size:12px; font-weight:700; color:#374151; }
.opt-alert-body { padding:10px 14px; }
.opt-alert-none { font-size:12px; color:#94a3b8; font-style:italic; }

/* Toast */
.opt-toast-wrap { position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; align-items:center; gap:7px; pointer-events:none; }
.opt-toast {
  display:flex; align-items:center; gap:9px;
  padding:10px 38px 10px 14px; border-radius:10px;
  min-width:260px; max-width:420px; pointer-events:all;
  position:relative; backdrop-filter:blur(16px);
  box-shadow:0 6px 20px rgba(0,0,0,.12);
  animation:optToastIn .28s ease both;
  font-size:12px; font-weight:600;
}
.opt-toast.success { background:rgba(220,252,231,.95); border:1.5px solid #86efac; color:#15803d; }
.opt-toast.error   { background:rgba(254,226,226,.95); border:1.5px solid #fca5a5; color:#b91c1c; }
.opt-toast-close { position:absolute; top:8px; right:8px; width:20px; height:20px; border-radius:5px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:inherit; opacity:.55; }
.opt-toast-close:hover { opacity:1; }

/* Scrollbar */
.opt-right::-webkit-scrollbar, .opt-nav::-webkit-scrollbar, .opt-table-wrap::-webkit-scrollbar { width:4px; }
.opt-right::-webkit-scrollbar-track, .opt-nav::-webkit-scrollbar-track, .opt-table-wrap::-webkit-scrollbar-track { background:transparent; }
.opt-right::-webkit-scrollbar-thumb, .opt-nav::-webkit-scrollbar-thumb, .opt-table-wrap::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:999px; }

@media (max-width:1100px) {
  .opt-sidebar { display:none; }
  .opt-center-split { grid-template-columns:1fr; }
  .opt-right { width:300px; min-width:300px; }

/* ── Stats card (replaces Vidrio en Proceso) ── */
.opt-stats-card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; flex-shrink:0; }
.opt-stats-grid { padding:12px 10px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
.opt-stat-item { display:flex; flex-direction:column; align-items:center; padding:10px 4px 8px; background:#f8fafc; border-radius:9px; }
.opt-stat-pct { font-size:19px; font-weight:800; line-height:1; font-family:'IBM Plex Mono',monospace; }
.opt-stat-name { font-size:9.5px; color:#64748b; margin-top:5px; font-weight:600; text-align:center; letter-spacing:.03em; }

/* ── Machine control buttons — 2×2 vertical icon grid ── */
.opt-ctrl-btns-v { padding:10px 12px 12px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.opt-ctrl-btn-v {
  padding:11px 6px 9px; border-radius:9px; cursor:pointer;
  border:none; transition:all .18s; display:flex; flex-direction:column;
  align-items:center; gap:5px;
}
.opt-ctrl-btn-v span { font-size:10px; font-weight:800; letter-spacing:.05em; line-height:1; }
.opt-ctrl-btn-v.green  { background:#16a34a; color:#fff; box-shadow:0 2px 8px rgba(22,163,74,.25); }
.opt-ctrl-btn-v.green:hover  { background:#15803d; }
.opt-ctrl-btn-v.yellow { background:#eab308; color:#fff; box-shadow:0 2px 8px rgba(234,179,8,.20); }
.opt-ctrl-btn-v.yellow:hover { background:#ca8a04; }
.opt-ctrl-btn-v.red    { background:#dc2626; color:#fff; box-shadow:0 2px 8px rgba(220,38,38,.22); }
.opt-ctrl-btn-v.red:hover    { background:#b91c1c; }
.opt-ctrl-btn-v.outline { background:#fff; color:#374151; border:1.5px solid #cbd5e1; }
.opt-ctrl-btn-v.outline:hover { background:#f8fafc; }
.opt-ctrl-btn-v:disabled { opacity:.45; cursor:not-allowed; }
}
`;

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected || typeof document === 'undefined') return;
  _cssInjected = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─── Circular Gauge ─────────────────────────────────────────────────────── */
function CircularGauge({ pct = 33, size = 72, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#e2e8f0" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#0d9488" strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:'stroke-dasharray .6s ease' }}/>
    </svg>
  );
}

/* ─── Nesting SVG ────────────────────────────────────────────────────────── */
function NestingSVG({ pieces: propPieces, sheetW = 2000, sheetH = 1600 }) {
  const pieces = propPieces || [
    { id:'A1', x:0,    y:0,    w:1200, h:800,  fi:0 },
    { id:'A2', x:0,    y:800,  w:1200, h:800,  fi:1 },
    { id:'B3', x:1200, y:0,    w:500,  h:300,  fi:2 },
    { id:'B2', x:1200, y:300,  w:500,  h:300,  fi:3 },
    { id:'B4', x:1200, y:800,  w:500,  h:300,  fi:4 },
    { id:'B1', x:1200, y:1100, w:500,  h:300,  fi:5 },
  ];

  const MX=52, MY=44;
  const SVG_W=560, SVG_H=460;
  const SW=SVG_W-2*MX, SH=SVG_H-2*MY;
  const SX=MX, SY=MY;
  const sx=SW/sheetW, sy=SH/sheetH;
  const toX=mm=>SX+mm*sx, toY=mm=>SY+mm*sy;

  const FILLS=['rgba(13,148,136,.22)','rgba(13,148,136,.16)','rgba(99,102,241,.20)','rgba(99,102,241,.14)','rgba(245,158,11,.20)','rgba(245,158,11,.14)'];
  const STROKES=['#0d9488','#0d9488','#6366f1','#6366f1','#f59e0b','#f59e0b'];

  // Derive positions from pieces
  const xPos=[...new Set([0,...pieces.flatMap(p=>[p.x,p.x+p.w]),sheetW])].sort((a,b)=>a-b);
  const yPos=[...new Set([0,...pieces.flatMap(p=>[p.y,p.y+p.h]),sheetH])].sort((a,b)=>a-b);
  const xSegs=xPos.slice(0,-1).map((x1,i)=>({x1,x2:xPos[i+1],span:xPos[i+1]-x1})).filter(s=>s.span*sx>=28);
  const ySegs=yPos.slice(0,-1).map((y1,i)=>({y1,y2:yPos[i+1],span:yPos[i+1]-y1})).filter(s=>s.span*sy>=28);

  const DIM=18, TOT=32;
  const fmt=v=>Math.round(v);
  const m='url(#nestArr)';
  const COL='#5b8db8', BOLD='#1e3a5f';

  const chainH=(ax,bx,y,lbl)=>{
    const span=bx-ax,mx=(ax+bx)/2,g=Math.min(span*0.4,Math.max(14,String(lbl).length*4.2));
    if(span<g*1.5) return <g key={`ch${ax}`} style={{pointerEvents:'none'}}>
      <line x1={ax} y1={y} x2={ax-7} y2={y} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
      <line x1={bx} y1={y} x2={bx+7} y2={y} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
      <text x={mx} y={y-5} textAnchor="middle" fontSize={6.5} fill={COL} fontFamily="monospace">{lbl}</text>
    </g>;
    return <g key={`ch${ax}`} style={{pointerEvents:'none'}}>
      <line x1={ax} y1={y} x2={mx-g/2} y2={y} stroke={COL} strokeWidth={0.8} markerStart={m}/>
      <line x1={mx+g/2} y1={y} x2={bx} y2={y} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
      <text x={mx} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={7.5} fill={COL} fontFamily="monospace">{lbl}</text>
    </g>;
  };
  const chainV=(ay,by,x,lbl,side)=>{
    const span=by-ay,my=(ay+by)/2,g=Math.min(span*0.4,Math.max(12,String(lbl).length*4.2));
    const ta=side==='left'?'end':'start',tx=x+(side==='left'?-3:3);
    if(span<g*1.5) return <g key={`cv${ay}`} style={{pointerEvents:'none'}}>
      <line x1={x} y1={ay} x2={x} y2={ay-7} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
      <line x1={x} y1={by} x2={x} y2={by+7} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
      <text x={tx+(side==='left'?-4:4)} y={my} textAnchor={ta} dominantBaseline="middle" fontSize={6.5} fill={COL} fontFamily="monospace">{lbl}</text>
    </g>;
    return <g key={`cv${ay}`} style={{pointerEvents:'none'}}>
      <line x1={x} y1={ay} x2={x} y2={my-g/2} stroke={COL} strokeWidth={0.8} markerStart={m}/>
      <line x1={x} y1={my+g/2} x2={x} y2={by} stroke={COL} strokeWidth={0.8} markerEnd={m}/>
      <text x={tx} y={my} textAnchor={ta} dominantBaseline="middle" fontSize={7.5} fill={COL} fontFamily="monospace">{lbl}</text>
    </g>;
  };
  const totH=(ax,bx,y,lbl)=>{
    const mx=(ax+bx)/2,g=Math.min((bx-ax)*0.3,22);
    return <g style={{pointerEvents:'none'}}>
      <line x1={ax} y1={y} x2={mx-g/2} y2={y} stroke={BOLD} strokeWidth={1.5} markerStart={m}/>
      <line x1={mx+g/2} y1={y} x2={bx} y2={y} stroke={BOLD} strokeWidth={1.5} markerEnd={m}/>
      <text x={mx} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={BOLD} fontFamily="monospace">{lbl}</text>
    </g>;
  };
  const totV=(ay,by,x,lbl,side)=>{
    const my=(ay+by)/2,g=Math.min((by-ay)*0.3,22),ta=side==='left'?'end':'start',tx=x+(side==='left'?-4:4);
    return <g style={{pointerEvents:'none'}}>
      <line x1={x} y1={ay} x2={x} y2={my-g/2} stroke={BOLD} strokeWidth={1.5} markerStart={m}/>
      <line x1={x} y1={my+g/2} x2={x} y2={by} stroke={BOLD} strokeWidth={1.5} markerEnd={m}/>
      <text x={tx} y={my} textAnchor={ta} dominantBaseline="middle" fontSize={9} fontWeight={700} fill={BOLD} fontFamily="monospace">{lbl}</text>
    </g>;
  };

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="100%"
      style={{ display:'block', position:'absolute', inset:0 }}>
      <defs>
        <pattern id="nestGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0L0 0 0 20" fill="none" stroke="rgba(13,148,136,.12)" strokeWidth=".6"/>
        </pattern>
        <marker id="nestArr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto-start-reverse">
          <path d="M0,0 L5,2.5 L0,5 z" fill={COL}/>
        </marker>
      </defs>

      {/* Sheet */}
      <rect x={SX} y={SY} width={SW} height={SH} fill="rgba(236,253,245,.60)" rx={3}/>
      <rect x={SX} y={SY} width={SW} height={SH} fill="url(#nestGrid)" rx={3}/>

      {/* Pieces */}
      {pieces.map((p,i)=>{
        const px=toX(p.x),py=toY(p.y),pw=p.w*sx,ph=p.h*sy,cx=px+pw/2,cy=py+ph/2;
        const fs=Math.max(7,Math.min(11,Math.min(pw,ph)/6));
        return <g key={p.id}>
          <rect x={px+1.5} y={py+1.5} width={pw} height={ph} fill="rgba(0,0,0,.05)" rx={3}/>
          <rect x={px} y={py} width={pw} height={ph} fill={FILLS[i%FILLS.length]} stroke={STROKES[i%STROKES.length]} strokeWidth={1.2} rx={3}/>
          <rect x={px+1} y={py+1} width={pw-2} height={Math.min(ph*.25,10)} fill="rgba(255,255,255,.35)" rx={2}/>
          {pw>20&&ph>14&&<text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fill={STROKES[i%STROKES.length]} fontFamily="monospace" fontWeight={700} style={{paintOrder:'stroke',stroke:'rgba(255,255,255,.7)',strokeWidth:2}}>{p.id}</text>}
        </g>;
      })}

      {/* Sheet border */}
      <rect x={SX} y={SY} width={SW} height={SH} fill="none" stroke="#2d3748" strokeWidth={1.5} rx={3}/>

      {/* TOP: extension lines + chained arrows + total */}
      {xPos.map(x=><line key={`ex${x}`} x1={toX(x)} y1={SY-3} x2={toX(x)} y2={SY-DIM-4} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="3,2" style={{pointerEvents:'none'}}/>)}
      {xSegs.map(({x1,x2,span})=>chainH(toX(x1),toX(x2),SY-DIM,fmt(span)))}
      {totH(SX,SX+SW,SY-TOT,fmt(sheetW))}
      {/* BOTTOM: total only */}
      {totH(SX,SX+SW,SY+SH+TOT,fmt(sheetW))}

      {/* LEFT: extension lines + chained arrows + total */}
      {yPos.map(y=><line key={`ey${y}`} x1={SX-3} y1={toY(y)} x2={SX-DIM-4} y2={toY(y)} stroke="#94a3b8" strokeWidth={0.5} strokeDasharray="3,2" style={{pointerEvents:'none'}}/>)}
      {ySegs.map(({y1,y2,span})=>chainV(toY(y1),toY(y2),SX-DIM,fmt(span),'left'))}
      {totV(SY,SY+SH,SX-TOT,fmt(sheetH),'left')}
      {/* RIGHT: total only */}
      {totV(SY,SY+SH,SX+SW+TOT,fmt(sheetH),'right')}
    </svg>
  );
}

/* ─── DEMO CUTS DATA ─────────────────────────────────────────────────────── */
const DEMO_CUTS = [
  { id:'A1', dims:'1200x800', tipo:'Claro 6mm', trat:'Biselado', estado:'espera'  },
  { id:'A2', dims:'1200x800', tipo:'Claro 6mm', trat:'Biselado', estado:'espera'  },
  { id:'A3', dims:'1200x800', tipo:'Claro 6mm', trat:'Biselado', estado:'espera'  },
  { id:'A4', dims:'1200x800', tipo:'Claro 6mm', trat:'Biselado', estado:'espera'  },
  { id:'B5', dims:'500x300',  tipo:'Claro 6mm', trat:'Biselado', estado:'espera'  },
  { id:'B6', dims:'500x300',  tipo:'Claro 6mm', trat:'Biselado', estado:'espera'  },
  { id:'B7', dims:'500x300',  tipo:'Claro 6mm', trat:'Biselado', estado:'espera'  },
];
const ESTADO_LABELS = { espera:'En Espera', proceso:'En Proceso', listo:'Listo' };

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const OptimizacionCortes = ({ notificacion, onBack, soloCortes = false, onFinalizarEntrega }) => {
  injectCSS();

  const [toasts, setToasts]             = useState([]);
  const [activeTab, setActiveTab]       = useState('RETASOS');
  const [cortesPorProducto, setCortes]  = useState([]);
  const [cargando, setCargando]         = useState(false);
  const [showNotif, setShowNotif]       = useState(true);
  const [cortesData, setCortesData]     = useState(DEMO_CUTS);
  const [planchasOptimizadas, setPlanchas] = useState([]);
  const [cargandoOpt, setCargandoOpt]   = useState(false);
  const [dimensionesPlancha, setDimensionesPlancha] = useState({ ancho: 330, alto: 214 });

  const showToast = useCallback((msg, tipo = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, tipo }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  /* Fetch cortes */
  useEffect(() => {
    if (!notificacion?.id) return;
    setCargando(true);
    fetch(`/api/cortes/notificacion/${notificacion.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.productos)) {
          setCortes(data.productos);
          const filas = data.productos.flatMap((p, pi) => {
            let cnt = 0;
            return (p.cortes || []).flatMap((c) =>
              Array.from({ length: Math.max(1, Number(c.cantidad || 1)) }, () => ({
                id: `${String.fromCharCode(65 + pi)}${++cnt}`,
                dims: `${c.ancho_cm || 0}x${c.alto_cm || 0}`,
                tipo: p.producto_nombre || 'Vidrio',
                trat: c.tratamiento || 'Biselado',
                estado: 'espera',
              }))
            );
          });
          if (filas.length > 0) setCortesData(filas);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [notificacion?.id]);

  /* Fetch optimización de vidrio desde backend */
  useEffect(() => {
    if (!cortesPorProducto.length) return;

    // Preparar productos para optimización
    const productos = cortesPorProducto.flatMap((prod, pi) => {
      return (prod.cortes || []).flatMap((corte, ci) => {
        const ancho = Number(corte.ancho_cm || 0);
        const alto = Number(corte.alto_cm || 0);
        const cantidad = Math.max(1, Number(corte.cantidad || 1));

        if (ancho <= 0 || alto <= 0) return [];

        return Array.from({ length: cantidad }, (_, idx) => ({
          id: `${String.fromCharCode(65 + pi)}${ci + 1}`,
          ancho,
          alto,
          cantidad: 1,
        }));
      });
    });

    if (!productos.length) return;

    setCargandoOpt(true);
    fetch('/api/optimizacion-cortes/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo_material: 'vidrio',
        plancha_ancho: dimensionesPlancha.ancho,
        plancha_alto: dimensionesPlancha.alto,
        productos,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.planchas) {
          setPlanchas(data.planchas);
          setDimensionesPlancha({
            ancho: data.plancha_ancho_usado || dimensionesPlancha.ancho,
            alto: data.plancha_alto_usado || dimensionesPlancha.alto,
          });
          showToast(`Optimización: ${data.planchas.length} plancha(s) · ${data.eficiencia_global}% eficiencia`, 'success');
        } else {
          showToast(data.error || 'Error al optimizar', 'error');
        }
      })
      .catch(err => showToast('Error conectando con optimizador: ' + err.message, 'error'))
      .finally(() => setCargandoOpt(false));
  }, [cortesPorProducto, showToast]);

  /* Derived */
  const totalCortes     = cortesData.length;
  const completados     = cortesData.filter(c => c.estado === 'listo').length;
  const pct             = totalCortes > 0 ? Math.round((completados / totalCortes) * 100) : 33;
  const steps           = ['RETASOS', 'PRODUCTOS', 'CORTES'];
  const stepIdx         = steps.indexOf(activeTab);

  /* Glass usage stats derived from cortesPorProducto */
  const statsVidrio = (() => {
    let usedArea = 0, planchaArea = 0;
    (cortesPorProducto || []).forEach(p => {
      const pw = Number(p.plancha_ancho || p.ancho || 0);
      const ph = Number(p.plancha_alto  || p.alto  || 0);
      if (pw > 0 && ph > 0) planchaArea += pw * ph;
      (p.cortes || []).forEach(c => {
        const qty = Math.max(1, Number(c.cantidad || 1));
        usedArea += Number(c.ancho_cm || 0) * Number(c.alto_cm || 0) * qty;
      });
    });
    const usoPct = planchaArea > 0 ? Math.min(100, Math.round(usedArea / planchaArea * 100)) : 0;
    return { usoPct, retazoPct: 100 - usoPct };
  })();

  /* Operator */
  const staff = (() => { try { return JSON.parse(localStorage.getItem('staff') || '{}'); } catch { return {}; } })();
  const opName = staff?.nombre || staff?.name || 'Alex M.';
  const opInitials = opName.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || 'OP';

  const handleLogout = () => {
    ['personalToken', 'staff', 'area'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/';
  };

  /* Controls */
  const handleIniciar  = () => {
    if (stepIdx < steps.length - 1) { setActiveTab(steps[stepIdx + 1]); showToast(`Avanzando a ${steps[stepIdx + 1]}`); }
    else showToast('Proceso en curso — completa los cortes');
  };
  const handlePausar   = () => { if (stepIdx > 0) { setActiveTab(steps[stepIdx - 1]); showToast(`Regresando a ${steps[stepIdx - 1]}`); } };
  const handleDetener  = () => { showToast('Proceso detenido', 'error'); setTimeout(() => onBack?.(), 600); };
  const handleReiniciar = () => { setActiveTab('RETASOS'); showToast('Proceso reiniciado'); };

  /* soloCortes mode */
  if (soloCortes) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif" }}>
        <Productos notificacion={notificacion} onToast={showToast} showHeader={false}
          onFinalizarEntrega={onFinalizarEntrega || onBack}/>
      </div>
    );
  }

  const navItems = [
    { icon: <IconLayoutDashboard size={17}/>, label: 'Tablero Principal' },
    { icon: <IconScissors size={17}/>,        label: 'Mis Optimizaciones', active: true },
    { icon: <IconPackage size={17}/>,         label: 'Inventario de Materiales' },
    { icon: <IconTool size={17}/>,            label: 'Control de Máquina' },
    { icon: <IconSettings size={17}/>,        label: 'Configuración' },
  ];

  return (
    <div className="opt-root">
      {/* Toasts */}
      <div className="opt-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`opt-toast ${t.tipo}`}>
            {t.tipo === 'success' ? <IconCheck size={13}/> : <IconAlertTriangle size={13}/>}
            <span style={{ flex:1 }}>{t.msg}</span>
            <button className="opt-toast-close" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>
              <IconX size={11}/>
            </button>
          </div>
        ))}
      </div>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside className="opt-sidebar">
        <div className="opt-logo">
          <span className="opt-logo-text">OPTICUT</span>
        </div>

        <nav className="opt-nav">
          {navItems.map(item => (
            <button key={item.label} className={`opt-nav-item${item.active ? ' active' : ''}`}>
              <span className="opt-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button className="opt-nav-item" style={{ marginTop:8, borderTop:'1px solid #f1f5f9', paddingTop:14 }}
            onClick={handleLogout}>
            <span className="opt-nav-icon"><IconLogout size={17}/></span>
            Cerrar Sesión
          </button>
        </nav>

        {/* Status widgets */}
        <div className="opt-sidebar-bottom">
          {/* Estado Máquina */}
          <div className="opt-stat-card">
            <div className="opt-stat-icon-wrap" style={{ background:'#dcfce7' }}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="5" fill="#16a34a"/>
                <circle cx="8" cy="8" r="3" fill="#4ade80"/>
              </svg>
            </div>
            <div>
              <div className="opt-stat-label">Estado de Máquina</div>
              <div className="opt-online">ONLINE</div>
            </div>
          </div>

          {/* Cortes Completados */}
          <div className="opt-stat-card">
            <div className="opt-stat-icon-wrap" style={{ background:'#dbeafe' }}>
              <IconScissors size={16} color="#1d4ed8"/>
            </div>
            <div>
              <div className="opt-stat-label">Cortes Completados</div>
              <div className="opt-stat-val">
                {completados}/{totalCortes}
                {cargando && <IconLoader size={10} style={{ marginLeft:4, animation:'optSpin .7s linear infinite' }}/>}
              </div>
            </div>
          </div>

          {/* Restos Generados */}
          <div className="opt-stat-card">
            <div className="opt-stat-icon-wrap" style={{ background:'#fef3c7' }}>
              <IconPackage size={16} color="#d97706"/>
            </div>
            <div>
              <div className="opt-stat-label">Restos Generados</div>
              <div className="opt-stat-val">5.2 m²</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══ CENTER + RIGHT ══ */}
      <div className="opt-main">

        {/* Top bar */}
        <header className="opt-topbar">
          <span className="opt-topbar-title">MES Dashboard</span>
          <div className="opt-topbar-right">
            {showNotif && (
              <div className="opt-notif-pill">
                <div className="opt-notif-dot"/>
                <span>Uinors, rblocking notificaciones</span>
                <button className="opt-notif-close" onClick={() => setShowNotif(false)}>
                  <IconX size={10}/>
                </button>
              </div>
            )}
            <div className="opt-operator">
              <span>Operario Actual: <strong>{opName}</strong></span>
              <div className="opt-avatar">{opInitials}</div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="opt-content-area">

          {/* Center panel */}
          <div className="opt-center">
            <div className="opt-project-title">
              Corte de Vidrio Optimizado — Proyecto ID:&nbsp;
              <span style={{ color:'#0d9488' }}>{notificacion?.id || '00451'}</span>
            </div>

            {/* Step tabs */}
            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
              {steps.map((s, i) => (
                <button key={s} onClick={() => setActiveTab(s)}
                  style={{
                    padding:'5px 14px', borderRadius:7, border:'none', cursor:'pointer',
                    fontSize:11, fontWeight:700, letterSpacing:'.04em',
                    background: activeTab === s ? '#0d9488' : i < stepIdx ? '#dcfce7' : '#f1f5f9',
                    color: activeTab === s ? '#fff' : i < stepIdx ? '#15803d' : '#94a3b8',
                    transition:'all .15s',
                  }}>
                  {i < stepIdx ? '✓ ' : ''}{s}
                </button>
              ))}
              <div style={{ flex:1 }}/>
              <button onClick={onBack} style={{
                padding:'5px 12px', borderRadius:7, border:'1px solid #e2e8f0',
                background:'#fff', cursor:'pointer', fontSize:11, fontWeight:600, color:'#64748b',
              }}>
                ← Atrás
              </button>
            </div>

            {/* Split panels */}
            <div className="opt-center-split">

              {/* ── Diseño Visual ── */}
              <div className="opt-card">
                <div className="opt-card-head">
                  <span className="opt-card-title">Diseño Visual</span>
                  <div className="opt-card-actions">
                    <button className="opt-icon-btn"><IconRefresh size={12}/></button>
                    <button className="opt-icon-btn">···</button>
                  </div>
                </div>
                <div className="opt-svg-wrap">
                  <div className="opt-svg-inner">
                    {cargandoOpt ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: 13 }}>
                        <IconLoader size={16} style={{ animation: 'optSpin .7s linear infinite', marginRight: 8 }}/>
                        Calculando optimización...
                      </div>
                    ) : planchasOptimizadas.length > 0 ? (
                      <NestingSVG
                        pieces={planchasOptimizadas[0].cortes.map((c, i) => ({
                          id: c.corte_id || `P${i+1}`,
                          x: Number(c.x || 0) * 10,
                          y: Number(c.y || 0) * 10,
                          w: Number(c.ancho || 0) * 10,
                          h: Number(c.alto || 0) * 10,
                          fi: i % 6,
                        }))}
                        sheetW={dimensionesPlancha.ancho * 10}
                        sheetH={dimensionesPlancha.alto * 10}
                      />
                    ) : (
                      <NestingSVG/>
                    )}
                  </div>
                </div>
                <div className="opt-tools-bar">
                  <button className="opt-tool-btn"><IconTool size={10}/> Herramientas de Diseño</button>
                  <button className="opt-tool-btn"><IconZoomIn size={10}/> Zoom In/Out</button>
                  <button className="opt-tool-btn"><IconRotate size={10}/> Girar Pieza</button>
                </div>
              </div>

              {/* ── Cortes Completados ── */}
              <div className="opt-card">
                <div className="opt-card-head">
                  <span className="opt-card-title">Cortes Completados ({completados}/{totalCortes})</span>
                </div>

                <div className="opt-cuts-panel">
                  {/* Gauge + progress */}
                  <div className="opt-gauge-row">
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:5 }}>Progreso de corte</div>
                      <div className="opt-progress-bar-wrap" style={{ margin:0, marginBottom:0, height:7 }}>
                        <div className="opt-progress-bar-fill" style={{ width:`${pct}%` }}/>
                      </div>
                    </div>
                    <div className="opt-gauge-wrap">
                      <CircularGauge pct={pct}/>
                      <div className="opt-gauge-pct">{pct}%</div>
                    </div>
                  </div>

                  {/* Workflow content (shown when tabs change) */}
                  {activeTab !== 'CORTES' ? (
                    <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
                      {activeTab === 'RETASOS' && (
                        <Retazo notificacion={notificacion} onToast={showToast}
                          showHeader={false} tipoNotificacion="OPTIMIZACION"
                          onGuardarSuccess={() => setActiveTab('PRODUCTOS')}/>
                      )}
                      {activeTab === 'PRODUCTOS' && (
                        <Materiales notificacion={notificacion} onToast={showToast}
                          onGuardarSuccess={() => setActiveTab('CORTES')} tipoNotificacion="OPTIMIZACION"/>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Table */}
                      <div className="opt-table-wrap">
                        <table className="opt-table">
                          <thead>
                            <tr>
                              <th><span className="opt-table-sort">ID Pieza <svg width="7" height="10" viewBox="0 0 7 10"><path d="M3.5 0L6.5 4H.5z" fill="currentColor"/><path d="M3.5 10L.5 6h6z" fill="currentColor"/></svg></span></th>
                              <th>Dimensiones (mm)</th>
                              <th><span className="opt-table-sort">Vidrio Tipo <svg width="7" height="10" viewBox="0 0 7 10"><path d="M3.5 0L6.5 4H.5z" fill="currentColor"/><path d="M3.5 10L.5 6h6z" fill="currentColor"/></svg></span></th>
                              <th>Tratamiento</th>
                              <th><span className="opt-table-sort">Estado <svg width="7" height="10" viewBox="0 0 7 10"><path d="M3.5 0L6.5 4H.5z" fill="currentColor"/><path d="M3.5 10L.5 6h6z" fill="currentColor"/></svg></span></th>
                            </tr>
                          </thead>
                          <tbody>
                            {cortesData.map(c => (
                              <tr key={c.id}>
                                <td style={{ fontWeight:700, color:'#1e293b' }}>{c.id}</td>
                                <td style={{ fontFamily:'monospace' }}>{c.dims}</td>
                                <td>{c.tipo}</td>
                                <td>{c.trat}</td>
                                <td>
                                  <span className={`opt-badge ${c.estado}`}>
                                    {ESTADO_LABELS[c.estado] || c.estado}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Action buttons */}
                      <div className="opt-table-actions">
                        <button className="opt-action-btn primary">
                          <IconPlus size={13}/> Añadir Pieza Manualmente
                        </button>
                        <button className="opt-action-btn secondary">
                          <IconUpload size={13}/> Importar CSV
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* If CORTES tab, also show Productos below */}
            {activeTab === 'CORTES' && (
              <div style={{ flex:'0 0 auto', maxHeight:0, overflow:'hidden' }}>
                <Productos notificacion={notificacion} onToast={showToast} showHeader={false}
                  onFinalizarEntrega={onFinalizarEntrega || onBack} tipoNotificacion="OPTIMIZACION"/>
              </div>
            )}
          </div>

          {/* ══ RIGHT SIDEBAR ══ */}
          <aside className="opt-right">

            {/* Estadísticas de Plancha */}
            <div className="opt-stats-card">
              <div className="opt-ctrl-head">Estadísticas de Plancha</div>
              <div className="opt-stats-grid">
                <div className="opt-stat-item">
                  <div className="opt-stat-pct" style={{ color: statsVidrio.usoPct>=85?'#16a34a':statsVidrio.usoPct>=70?'#d97706':'#dc2626' }}>
                    {statsVidrio.usoPct}%
                  </div>
                  <div className="opt-stat-name">Uso Plancha</div>
                </div>
                <div className="opt-stat-item">
                  <div className="opt-stat-pct" style={{ color:'#64748b' }}>
                    {statsVidrio.retazoPct}%
                  </div>
                  <div className="opt-stat-name">Retazos</div>
                </div>
                <div className="opt-stat-item">
                  <div className="opt-stat-pct" style={{ color:'#0d9488' }}>
                    {totalCortes}
                  </div>
                  <div className="opt-stat-name">Cortes</div>
                </div>
              </div>
            </div>

            {/* Controles de Máquina */}
            <div className="opt-ctrl-card">
              <div className="opt-ctrl-head">Controles de Máquina</div>
              <div className="opt-ctrl-btns-v">
                <button className="opt-ctrl-btn-v green" onClick={handleIniciar}>
                  <IconPlayerPlay size={18}/>
                  <span>{stepIdx < steps.length - 1 ? 'INICIAR' : 'FINALIZAR'}</span>
                </button>
                <button className="opt-ctrl-btn-v yellow" onClick={handlePausar} disabled={stepIdx === 0}>
                  <IconPlayerPause size={18}/><span>PAUSAR</span>
                </button>
                <button className="opt-ctrl-btn-v red" onClick={handleDetener}>
                  <IconPlayerStop size={18}/><span>DETENER</span>
                </button>
                <button className="opt-ctrl-btn-v outline" onClick={handleReiniciar}>
                  <IconReload size={16}/><span>REINICIAR</span>
                </button>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
};

export default OptimizacionCortes;
