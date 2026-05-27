import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBell, IconRefresh, IconPackage, IconTool, IconX, IconCheck,
  IconAlertTriangle, IconLogout, IconEye, IconTrash, IconLoader,
  IconStack2, IconFolder, IconFolderOpen, IconSearch, IconFileText,
  IconChevronRight, IconAlertCircle, IconChevronDown, IconUser,
} from '@tabler/icons-react';
import ServicioTrabajo from './Servicio';
import EntregaPedido   from './Entrega';
import AgregarRetazoModal from './AgregarRetazoModal';
import { FONTS }       from '../../colors';
import { buildApiUrl } from '../../config';
import { animate, stagger, spring } from 'animejs';

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const T = {
  bgPage:      'linear-gradient(145deg,#dff0f8 0%,#eaf5fb 40%,#f4f9fd 100%)',
  bgNoise:     'radial-gradient(ellipse 90% 60% at 60% -10%,rgba(128,194,220,.22) 0%,transparent 65%)',
  bgNoise2:    'radial-gradient(ellipse 60% 40% at 10% 90%,rgba(128,194,220,.14) 0%,transparent 60%)',
  glassBg:     'rgba(255,255,255,.62)',
  glassBgMid:  'rgba(255,255,255,.78)',
  glassBlur:   'blur(20px)',
  glassSat:    'saturate(180%)',
  border:      'rgba(128,194,220,.22)',
  borderMid:   'rgba(128,194,220,.38)',
  borderStr:   'rgba(128,194,220,.58)',
  brand:       '#5a8ba8',
  brandMid:    '#80C2DC',
  brandLight:  '#a8d9ed',
  brandSoft:   'rgba(128,194,220,.12)',
  red:         '#941918',
  redMid:      '#c0302f',
  redSoft:     'rgba(148,25,24,.08)',
  redBorder:   'rgba(148,25,24,.25)',
  amber:       '#cc9f04',
  amberSoft:   'rgba(255,214,0,.12)',
  amberBorder: 'rgba(204,159,4,.3)',
  green:       '#059669',
  greenSoft:   'rgba(5,150,105,.10)',
  greenBorder: 'rgba(5,150,105,.28)',
  text:        '#1a2a3a',
  textMid:     '#2d4a62',
  textLight:   '#5a7a90',
  textDim:     '#8aa8bc',
  white:       '#ffffff',
  fontHead:    FONTS.heading,
  fontBody:    FONTS.body,
  fontMono:    "'IBM Plex Mono',monospace",
  shadowCard:  '0 8px 32px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset',
};

const gc  = { background:T.glassBg,  backdropFilter:`${T.glassBlur} ${T.glassSat}`, WebkitBackdropFilter:`${T.glassBlur} ${T.glassSat}`, border:`1px solid ${T.border}`,    boxShadow:T.shadowCard };
const gcM = { background:T.glassBgMid, backdropFilter:`${T.glassBlur} ${T.glassSat}`, WebkitBackdropFilter:`${T.glassBlur} ${T.glassSat}`, border:`1px solid ${T.borderMid}`, boxShadow:T.shadowCard };

const PAGE_SIZE = 4;
const SENTINEL  = '__loading__';

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
@keyframes panelIn{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.78)}}
@keyframes shimmer{0%{background-position:-700px 0}100%{background-position:700px 0}}
@keyframes cardFadeIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes cardShred{
  0%  {opacity:1;transform:scale(1) rotate(0) translateY(0);filter:none}
  20% {opacity:1;transform:scale(1.04) rotate(-2deg) translateY(-6px);filter:brightness(1.1)}
  50% {opacity:.6;transform:scale(.9) rotate(3deg) translateY(4px);filter:brightness(.8) blur(1px)}
  80% {opacity:.2;transform:scale(.6) rotate(-5deg) translateY(20px);filter:blur(3px)}
  100%{opacity:0;transform:scale(.3) rotate(8deg) translateY(40px);filter:blur(6px)}
}
@keyframes particle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--px),var(--py)) scale(0)}}
@keyframes dlgOvIn{from{opacity:0}to{opacity:1}}
@keyframes dlgOvOut{from{opacity:1}to{opacity:0}}
@keyframes dlgIn{0%{opacity:0;transform:scale(.8) translateY(20px)}65%{opacity:1;transform:scale(1.03) translateY(-3px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes dlgOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.88) translateY(12px)}}
@keyframes lockedIn{0%{opacity:0;transform:scale(.84) translateY(18px)}65%{opacity:1;transform:scale(1.02) translateY(-3px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes lockedOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.88) translateY(10px)}}

.obras-root{font-family:${T.fontBody};color:${T.text};padding-top:0;position:relative}
.obras-bg{position:fixed;inset:0;background:${T.bgPage};z-index:0}
.obras-bg::before{content:'';position:absolute;inset:0;background:${T.bgNoise}}
.obras-bg::after {content:'';position:absolute;inset:0;background:${T.bgNoise2}}
.deco1{position:fixed;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(128,194,220,.18) 0%,transparent 70%);top:-100px;right:-80px;pointer-events:none;z-index:0}
.deco2{position:fixed;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(128,194,220,.12) 0%,transparent 70%);bottom:-60px;left:60px;pointer-events:none;z-index:0}
.obras-inner{position:relative;z-index:1}

.folders-scroll{overflow-y:auto;max-height:calc(100vh - 340px);min-height:200px;padding-right:4px;padding-top:12px}
.folders-scroll::-webkit-scrollbar{width:5px}
.folders-scroll::-webkit-scrollbar-track{background:rgba(128,194,220,.06);border-radius:999px}
.folders-scroll::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:999px}
.folders-scroll::-webkit-scrollbar-thumb:hover{background:${T.brand}}
.obras-root ::-webkit-scrollbar{width:5px;height:5px}
.obras-root ::-webkit-scrollbar-track{background:rgba(128,194,220,.06)}
.obras-root ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:999px}
.obras-root ::-webkit-scrollbar-thumb:hover{background:${T.brand}}

.btn-p{transition:all .16s cubic-bezier(.4,0,.2,1)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(90,139,168,.22)}
.btn-p:active{transform:translateY(0) scale(.97)}
.cat-tab{transition:all .18s ease;cursor:pointer}
.cat-tab:hover{background:rgba(128,194,220,.10)}

.fc{transition:transform .22s cubic-bezier(.34,1.3,.64,1),box-shadow .22s ease}
.fc:hover{transform:translateY(-5px) scale(1.012);box-shadow:0 20px 56px rgba(90,139,168,.22),0 2px 0 rgba(255,255,255,.95) inset !important}
.fc.sel{outline:2px solid ${T.brandMid};outline-offset:2px}
.fc.del{animation:cardShred .55s cubic-bezier(.4,0,.6,1) forwards;pointer-events:none}
.fc.new{animation:cardFadeIn .38s cubic-bezier(.34,1.2,.64,1) both}

.grid-s{transition:all .36s cubic-bezier(.4,0,.2,1)}
.dp{animation:panelIn .34s cubic-bezier(.34,1.2,.64,1);border-left:1px solid ${T.borderMid}}
.obras-header{display:flex;align-items:center;margin-bottom:26px;animation:fadeUp .35s ease;gap:10px;justify-content:space-between}
.obras-header-main{display:flex;align-items:center;gap:10px;min-width:0}
.obras-header-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.obras-shell{display:flex;position:relative}
.obras-main{flex:1;min-width:0;display:flex;overflow:hidden}
.obras-grid{flex:1;min-width:0;padding:24px}
.obras-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
.obras-toolbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

.ske{background:linear-gradient(90deg,rgba(128,194,220,.10) 25%,rgba(128,194,220,.22) 50%,rgba(128,194,220,.10) 75%);background-size:700px 100%;animation:shimmer 1.6s infinite linear;border-radius:8px}
.ts{transition:background .22s}
.tk{transition:left .22s cubic-bezier(.34,1.56,.64,1)}

.si{outline:none;background:rgba(255,255,255,.7);border:1.5px solid ${T.border};border-radius:12px;padding:9px 14px 9px 38px;font-size:13px;font-family:${T.fontBody};color:${T.text};width:100%;transition:border-color .18s,box-shadow .18s}
.si:focus{border-color:${T.brandMid};box-shadow:0 0 0 3px rgba(128,194,220,.18);background:rgba(255,255,255,.92)}
.si::placeholder{color:${T.textDim}}

.dlg-ov{position:fixed;inset:0;z-index:800;background:rgba(26,42,58,.30);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center}
.dlg-ov.ei{animation:dlgOvIn .22s ease forwards}
.dlg-ov.lo{animation:dlgOvOut .28s ease forwards}
.dlg-box{width:min(420px,92vw);border-radius:22px;padding:32px 28px 24px;position:relative}
.dlg-box.ei{animation:dlgIn .36s cubic-bezier(.34,1.2,.64,1) forwards}
.dlg-box.lo{animation:dlgOut .28s cubic-bezier(.4,0,.6,1) forwards}
.dlg-danger{transition:all .16s cubic-bezier(.4,0,.2,1)}
.dlg-danger:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(148,25,24,.35)}
.dlg-danger:active{transform:translateY(0) scale(.97)}
.dlg-cancel{transition:all .16s}
.dlg-cancel:hover{background:rgba(128,194,220,.18);transform:translateY(-1px)}
.dlg-cancel:active{transform:translateY(0) scale(.97)}
.particle{position:fixed;border-radius:50%;pointer-events:none;z-index:900;animation:particle .55s ease-out forwards}

.lk-ov{position:fixed;inset:0;z-index:800;background:rgba(26,42,58,.25);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;animation:dlgOvIn .2s ease}
.lk-box{width:min(380px,90vw);border-radius:20px;padding:28px 24px 22px;position:relative;animation:lockedIn .34s cubic-bezier(.34,1.2,.64,1)}
.lk-box.lo{animation:lockedOut .25s cubic-bezier(.4,0,.6,1) forwards}
.lm-btn{transition:all .18s ease}
.lm-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(90,139,168,.18)}
.lm-btn:active{transform:translateY(0) scale(.97)}

@media (max-width: 1024px){
  .obras-inner{padding:28px 14px 18px !important}
  .obras-main{flex-direction:column}
  .obras-grid{padding:16px !important}
  .dp{width:100% !important;min-width:0 !important;border-left:none !important;border-top:1px solid ${T.borderMid};border-radius:0 0 16px 16px !important;max-height:none !important}
  .folders-scroll{max-height:none}
}

@media (max-width: 640px){
  .obras-header{margin-bottom:16px;align-items:flex-start;flex-wrap:wrap}
  .obras-header-actions{width:100%;justify-content:flex-start}
  .obras-toolbar-actions{width:100%}
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

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function fmtFecha(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).formatToParts(d);
    const get = t => (parts.find(p => p.type === t) || {}).value || '00';
    return `${get('day')}/${get('month')}/${get('year')}`;
  } catch { return ''; }
}

function statusInfo(label) {
  const s = (label || '').toUpperCase();
  if (s.includes('EN_PROC') || s.includes('EN PROC') || s.includes('PROCESO'))
    return { dot:T.brand, bg:T.brandSoft,  border:T.borderMid,   text:'En proceso', color:T.brandMid };
  if (s.includes('FINAL') || s.includes('ATENDID') || s.includes('LISTO') || s.includes('ENTREGAD'))
    return { dot:T.green, bg:T.greenSoft,  border:T.greenBorder, text:'Finalizado',  color:'#34d399'  };
  return   { dot:T.amber, bg:T.amberSoft,  border:T.amberBorder, text:'Pendiente',   color:'#f59e0b'  };
}

function decodeToken(token) {
  try {
    const part   = (token || '').split('.')[1] || '';
    const base   = part.replace(/-/g,'+').replace(/_/g,'/');
    const padded = base + '='.repeat((4 - base.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch { return {}; }
}

function spawnParticles(rect, color) {
  if (!rect || typeof document === 'undefined') return;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const palette = [color || '#f59e0b', T.brandMid, T.red, '#fff', T.textDim];
  for (let i = 0; i < 10; i++) {
    const el    = document.createElement('div');
    el.className = 'particle';
    const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.4;
    const dist  = 50 + Math.random() * 80;
    const size  = 5  + Math.random() * 7;
    el.style.cssText = `left:${cx-size/2}px;top:${cy-size/2}px;width:${size}px;height:${size}px;` +
      `background:${palette[Math.floor(Math.random()*palette.length)]};` +
      `--px:${Math.cos(angle)*dist}px;--py:${Math.sin(angle)*dist}px;` +
      `animation-delay:${Math.random()*80}ms`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
}

/* ─── ATOMS ──────────────────────────────────────────────────────────────── */
function Badge({ label }) {
  const i = statusInfo(label);
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',
      borderRadius:999,background:i.bg,border:`1px solid ${i.border}`,color:i.dot,fontSize:11,fontWeight:700 }}>
      <span style={{ width:5,height:5,borderRadius:'50%',background:i.dot,flexShrink:0,
        animation:i.text==='Pendiente'?'pulse 2s infinite':'none' }}/>
      {i.text}
    </span>
  );
}

function Btn({ children, color, solid=true, small, loading, icon, ...rest }) {
  const c = color || T.brand;
  return (
    <button className="btn-p" style={{
      display:'inline-flex',alignItems:'center',gap:5,
      padding:small?'6px 14px':'9px 18px',borderRadius:10,cursor:'pointer',
      border:solid?`1.5px solid ${c}`:`1.5px solid ${c}55`,
      background:solid?c:'rgba(255,255,255,.7)',color:solid?T.white:c,
      fontSize:small?12:13,fontWeight:700,fontFamily:T.fontBody,
      opacity:loading?.65:1,backdropFilter:'blur(8px)',
      boxShadow:solid?`0 4px 14px ${c}33`:'none',
    }} {...rest}>
      {loading ? <IconLoader size={small?12:14} style={{animation:'spin .7s linear infinite'}}/> : icon}
      {children}
    </button>
  );
}

function IBtn({ icon, color=T.textLight, title, onClick }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className="btn-p"
      style={{ width:32,height:32,borderRadius:9,border:`1.5px solid ${color}44`,
        background:`${color}0f`,color,display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
      {icon}
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none' }}>
      <div className="ts" onClick={() => onChange(!checked)} style={{
        width:38,height:22,borderRadius:999,position:'relative',flexShrink:0,
        background:checked?T.brandMid:'rgba(128,194,220,.18)',
        border:`1.5px solid ${checked?T.brand:T.borderMid}`,
        boxShadow:checked?`0 0 10px ${T.brandMid}44`:'none',
      }}>
        <div className="tk" style={{ position:'absolute',top:2,left:checked?17:2,
          width:14,height:14,borderRadius:'50%',background:checked?T.white:T.textDim,
          boxShadow:'0 1px 4px rgba(0,0,0,.2)' }}/>
      </div>
      <span style={{ fontSize:12.5,color:T.textLight,fontWeight:500 }}>{label}</span>
    </label>
  );
}

function SearchBar({ value, onChange, fullWidth=false }) {
  return (
    <div style={{ position:'relative',width:'100%',maxWidth:fullWidth?'100%':280 }}>
      <IconSearch size={15} color={T.textDim}
        style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
      <input className="si" type="text" placeholder="Buscar por cliente…"
        value={value} onChange={e => onChange(e.target.value)}/>
      {value && (
        <button onClick={() => onChange('')}
          style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
            background:'none',border:'none',cursor:'pointer',color:T.textDim,display:'flex',padding:2 }}>
          <IconX size={13}/>
        </button>
      )}
    </div>
  );
}

function CantidadChip({ estado }) {
  if (estado === undefined || estado === SENTINEL)
    return <div className="ske" style={{ width:80,height:22,borderRadius:8 }}/>;
  if (!estado)
    return <span style={{ color:T.textDim,fontSize:12 }}>—</span>;
  return (
    <div style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',
      borderRadius:8,background:T.brandSoft,border:`1px solid ${T.borderMid}`,color:T.brand }}>
      <IconStack2 size={12}/>
      <span style={{ fontWeight:800,fontFamily:T.fontMono,fontSize:13 }}>{estado}</span>
      <span style={{ fontSize:10,color:T.textLight,fontWeight:500 }}>{Number(estado)===1?'prod.':'prods.'}</span>
    </div>
  );
}

/* ─── TOAST ──────────────────────────────────────────────────────────────── */
function Toast({ toast, isMobile=false }) {
  const boxRef  = useRef(null);
  const barRef  = useRef(null);
  useEffect(() => {
    if (!toast || !boxRef.current) return;
    animate(boxRef.current, { opacity:[0,1],translateY:[-14,0],scale:[.95,1], ease:spring({stiffness:240,damping:16}) });
    if (barRef.current) {
      barRef.current.style.width = '100%';
      animate(barRef.current, { width:['100%','0%'], duration:3400, ease:'linear' });
    }
  }, [toast]);
  if (!toast) return null;
  const err = toast.tipo === 'error';
  return (
    <div ref={boxRef} style={{ position:'fixed',top:isMobile?12:20,right:isMobile?12:20,left:isMobile?12:'auto',zIndex:9999,
      display:'grid',gap:10,minWidth:isMobile?0:290,maxWidth:isMobile?'none':380,padding:'14px 16px 11px',borderRadius:16,
      background:err?'linear-gradient(120deg,#fef2f2,#fff5f5)':'linear-gradient(120deg,#eaf7ff,#f0fbff)',
      backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
      border:`1.5px solid ${err?T.redBorder:T.borderStr}`,
      boxShadow:`0 16px 40px ${err?'rgba(148,25,24,.15)':'rgba(90,139,168,.20)'}`,
      color:err?T.red:T.brand,fontWeight:600,fontSize:13.5 }}>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <span style={{ width:28,height:28,borderRadius:9,
          background:err?T.redSoft:T.brandSoft,border:`1px solid ${err?T.redBorder:T.borderMid}`,
          display:'inline-flex',alignItems:'center',justifyContent:'center' }}>
          {err ? <IconAlertTriangle size={16}/> : <IconCheck size={16}/>}
        </span>
        <span style={{ lineHeight:1.35 }}>{toast.mensaje}</span>
      </div>
      <div style={{ height:3,borderRadius:999,background:err?T.redSoft:T.brandSoft,overflow:'hidden' }}>
        <div ref={barRef} style={{ height:'100%',borderRadius:999,background:err?T.red:T.brandMid }}/>
      </div>
    </div>
  );
}

/* ─── FLYING PAPER ───────────────────────────────────────────────────────── */
function FlyingPaper({ rect, color }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !rect) return;
    animate(ref.current, {
      translateY:[0,-60,-30], translateX:[0,30,160],
      rotate:[0,-10,4], scale:[1,1.1,.65], opacity:[1,1,0],
      duration:540, ease:'easeInOutQuart',
    });
  }, [rect]);
  if (!rect) return null;
  return (
    <div ref={ref} style={{
      position:'fixed',top:rect.top+rect.height*.2,left:rect.left+rect.width*.25,
      width:38,height:48,zIndex:999,pointerEvents:'none',borderRadius:8,
      background:'linear-gradient(160deg,#ffffff 60%,#eaf6ff)',
      border:`1.5px solid ${color||T.brandMid}44`,
      boxShadow:'0 8px 24px rgba(90,139,168,.25),inset 0 1px 0 rgba(255,255,255,.9)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,overflow:'hidden',
    }}>
      <div style={{ position:'absolute',top:0,right:0,width:10,height:10,
        background:`linear-gradient(225deg,${T.brandLight} 50%,transparent 50%)`,borderBottomLeftRadius:4 }}/>
      <div style={{ width:'65%',height:2,borderRadius:2,background:T.brandLight,opacity:.7 }}/>
      <div style={{ width:'50%',height:2,borderRadius:2,background:T.brandLight,opacity:.5 }}/>
      <div style={{ width:'60%',height:2,borderRadius:2,background:T.brandLight,opacity:.4 }}/>
      <IconFileText size={13} color={T.brand} style={{ marginTop:2 }}/>
    </div>
  );
}

/* ─── CONFIRM DIALOG ─────────────────────────────────────────────────────── */
function ConfirmDialog({ open, leaving, detail, entityLabel = 'pedido', onConfirm, onCancel, loading }) {
  const iconRef = useRef(null);
  useEffect(() => {
    if (open && !leaving && iconRef.current)
      animate(iconRef.current, { rotate:[0,-10,10,-7,7,-3,0], translateX:[0,-4,4,-3,3,-1,0], duration:600, ease:'easeInOutQuart', delay:120 });
  }, [open, leaving]);
  if (!open) return null;
  return (
    <div className={`dlg-ov ${leaving?'lo':'ei'}`} onClick={e => { if (e.target===e.currentTarget && !leaving) onCancel(); }}>
      <div className={`dlg-box ${leaving?'lo':'ei'}`} style={{
        background:'rgba(255,255,255,.92)',backdropFilter:'blur(28px) saturate(200%)',
        WebkitBackdropFilter:'blur(28px) saturate(200%)',border:'1.5px solid rgba(148,25,24,.18)',
        boxShadow:'0 32px 80px rgba(26,42,58,.22),0 2px 0 rgba(255,255,255,.9) inset',
      }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent)',
          borderRadius:'22px 22px 0 0',pointerEvents:'none' }}/>
        <div style={{ display:'flex',justifyContent:'center',marginBottom:20 }}>
          <div ref={iconRef} style={{ width:64,height:64,borderRadius:20,position:'relative',
            background:'linear-gradient(135deg,rgba(148,25,24,.10),rgba(148,25,24,.06))',
            border:'1.5px solid rgba(148,25,24,.20)',display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 8px 24px rgba(148,25,24,.12),inset 0 1px 0 rgba(255,255,255,.8)' }}>
            <div style={{ position:'absolute',inset:-6,borderRadius:24,
              border:'1.5px dashed rgba(148,25,24,.14)',animation:'pulse 2s infinite' }}/>
            <IconAlertCircle size={30} color={T.red}/>
          </div>
        </div>
        <div style={{ textAlign:'center',marginBottom:24 }}>
          <h3 style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:20,color:T.text,marginBottom:8 }}>
            {`¿Eliminar este ${entityLabel}?`}
          </h3>
          <p style={{ fontSize:14,color:T.textLight,lineHeight:1.6 }}>
            Esta acción es permanente y no se puede deshacer.
          </p>
          {detail && (
            <div style={{ marginTop:10,padding:'8px 16px',borderRadius:10,
              background:T.redSoft,border:`1px solid ${T.redBorder}`,
              display:'inline-flex',alignItems:'center',gap:8 }}>
              <IconFolder size={16} stroke={1} color={T.amber}/>
              <span style={{ fontSize:12,color:T.red,fontFamily:T.fontMono,fontWeight:600 }}>{detail}</span>
            </div>
          )}
        </div>
        <div style={{ height:1,background:`linear-gradient(90deg,transparent,rgba(128,194,220,.25),transparent)`,marginBottom:20 }}/>
        <div style={{ display:'flex',gap:10 }}>
          <button className="dlg-cancel" onClick={onCancel} disabled={loading}
            style={{ flex:1,padding:'12px 0',borderRadius:12,border:`1.5px solid ${T.border}`,
              background:'rgba(255,255,255,.6)',color:T.textLight,fontSize:14,fontWeight:700,
              fontFamily:T.fontBody,cursor:'pointer',backdropFilter:'blur(8px)' }}>
            Cancelar
          </button>
          <button className="dlg-danger" onClick={onConfirm} disabled={loading}
            style={{ flex:1,padding:'12px 0',borderRadius:12,border:`1.5px solid ${T.redMid}`,
              background:`linear-gradient(135deg,${T.red} 0%,${T.redMid} 100%)`,color:T.white,
              fontSize:14,fontWeight:700,fontFamily:T.fontBody,cursor:loading?'default':'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:7,
              boxShadow:'0 4px 16px rgba(148,25,24,.28),inset 0 1px 0 rgba(255,255,255,.2)',opacity:loading?.7:1 }}>
            {loading ? <><IconLoader size={15} style={{animation:'spin .7s linear infinite'}}/> Eliminando…</> : <><IconTrash size={15}/> Sí, eliminar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── LOCKED DIALOG ──────────────────────────────────────────────────────── */
function LockedDialog({ open, leaving, workerName, onClose }) {
  const iconRef = useRef(null);
  useEffect(() => {
    if (open && !leaving && iconRef.current)
      animate(iconRef.current, { rotate:[0,-8,8,-5,5,0], duration:540, ease:'easeInOutQuart', delay:100 });
  }, [open, leaving]);
  if (!open) return null;
  return (
    <div className="lk-ov" onClick={e => { if (e.target===e.currentTarget && !leaving) onClose(); }}>
      <div className={`lk-box${leaving?' lo':''}`} style={{
        background:'rgba(255,255,255,.93)',backdropFilter:'blur(28px) saturate(200%)',
        WebkitBackdropFilter:'blur(28px) saturate(200%)',border:'1.5px solid rgba(128,194,220,.35)',
        boxShadow:'0 28px 72px rgba(26,42,58,.18),0 2px 0 rgba(255,255,255,.9) inset',
      }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent)',
          borderRadius:'20px 20px 0 0',pointerEvents:'none' }}/>
        <button onClick={onClose} className="btn-p" style={{
          position:'absolute',top:14,right:14,width:30,height:30,borderRadius:9,
          border:`1.5px solid ${T.border}`,background:'rgba(255,255,255,.7)',
          color:T.textLight,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
          <IconX size={14}/>
        </button>
        <div style={{ display:'flex',justifyContent:'center',marginBottom:18 }}>
          <div ref={iconRef} style={{ width:58,height:58,borderRadius:18,position:'relative',
            background:'linear-gradient(135deg,rgba(90,139,168,.12),rgba(128,194,220,.08))',
            border:`1.5px solid ${T.borderMid}`,display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:`0 8px 22px rgba(90,139,168,.14),inset 0 1px 0 rgba(255,255,255,.8)` }}>
            <div style={{ position:'absolute',inset:-6,borderRadius:24,
              border:`1.5px dashed ${T.borderMid}`,animation:'pulse 2.5s infinite' }}/>
            <IconFolder size={28} stroke={1} color={T.brand}/>
          </div>
        </div>
        <div style={{ textAlign:'center',marginBottom:22 }}>
          <h3 style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:18,color:T.text,marginBottom:8 }}>
            Expediente en uso
          </h3>
          <p style={{ fontSize:13.5,color:T.textLight,lineHeight:1.65 }}>
            Este expediente ya está siendo atendido por:
          </p>
          <div style={{ marginTop:12,display:'inline-flex',alignItems:'center',gap:9,
            padding:'9px 18px',borderRadius:12,background:T.brandSoft,border:`1.5px solid ${T.borderMid}` }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:`${T.brand}22`,
              border:`1.5px solid ${T.borderMid}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <IconUser size={14} color={T.brand}/>
            </div>
            <span style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:14,color:T.brand }}>
              {workerName || 'Otro trabajador'}
            </span>
          </div>
          <p style={{ marginTop:12,fontSize:12,color:T.textDim,fontFamily:T.fontMono }}>
            Espera a que termine para poder acceder.
          </p>
        </div>
        <div style={{ height:1,background:`linear-gradient(90deg,transparent,${T.borderMid},transparent)`,marginBottom:18 }}/>
        <button className="btn-p" onClick={onClose} style={{
          width:'100%',padding:'11px 0',borderRadius:12,border:`1.5px solid ${T.borderMid}`,
          background:'rgba(255,255,255,.65)',color:T.brand,fontSize:14,fontWeight:700,
          fontFamily:T.fontBody,cursor:'pointer',backdropFilter:'blur(8px)' }}>
          Entendido
        </button>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────── */
function Sidebar({ visible, categoria, setCategoria, counts, isMobile=false }) {
  if (!visible) return null;
  const CATS = [
    { key:'ENTREGA',  icon:<IconPackage size={17}/>, label:'Entregas'  },
    { key:'SERVICIO', icon:<IconTool    size={17}/>, label:'Servicios' },
  ];
  return (
    <div style={{ width:isMobile?'100%':210,flexShrink:0,borderRight:isMobile?'none':`1px solid ${T.border}`,
      borderBottom:isMobile?`1px solid ${T.border}`:'none',
      animation:'slideRight .22s ease',paddingBottom:16,background:'rgba(255,255,255,.35)' }}>
      <div style={{ padding:'18px 20px 12px',fontSize:10,fontWeight:700,
        letterSpacing:2.5,color:T.textDim,fontFamily:T.fontMono }}>TIPO DE TRABAJO</div>
      {CATS.map(c => {
        const active = categoria === c.key;
        return (
          <div key={c.key} className="cat-tab" onClick={() => setCategoria(c.key)} style={{
            display:'flex',alignItems:'center',gap:10,padding:'11px 20px',
            borderLeft:`3px solid ${active?T.brandMid:'transparent'}`,
            background:active?T.brandSoft:'transparent',
            color:active?T.brand:T.textLight,fontWeight:active?700:400,fontSize:13.5,
          }}>
            <span style={{ color:active?T.brandMid:T.textDim }}>{c.icon}</span>
            <span style={{ flex:1 }}>{c.label}</span>
            {counts?.[c.key] > 0 && (
              <span style={{ background:active?T.brandMid:'rgba(128,194,220,.15)',
                color:active?T.white:T.brand,fontSize:11,fontWeight:700,
                borderRadius:999,padding:'1px 8px',fontFamily:T.fontMono }}>
                {counts[c.key]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── FOLDER CARD ────────────────────────────────────────────────────────── */
function FolderCard({
  n, isEntrega, cantEstado, isNew,
  authHeaders, setVistaServicio, setVistaEntrega,
  onVerDetalle, selectedId, compact, onRequestDelete,
  currentWorker, showLockedDialog, showToast,
}) {
  const isSelected = selectedId === n.id;
  const si         = statusInfo(n.estado_label || 'Pendiente');
  const folderRef  = useRef(null);
  const cardRef    = useRef(null);
  const [realizando, setRealizando] = useState(false);

  // Animar ícono cuando se selecciona
  useEffect(() => {
    if (isSelected && folderRef.current)
      animate(folderRef.current, { rotate:[0,-8,4,0], scale:[1,1.2,1.05,1], duration:420, ease:'easeInOutQuart' });
  }, [isSelected]);

  const handleRealize = async () => {
    if (realizando) return;

    // Chequeo rápido desde datos locales (evita llamada si ya sabemos que está tomada)
    const upper   = String(n.estado_label || '').toUpperCase();
    const inProc  = upper.includes('EN_PROC') || upper.includes('EN PROC') || upper.includes('PROCESO');
    const lockId  = String(n.en_proceso_por_id || '');
    const myId    = String(currentWorker?.id || '');
    if (inProc && lockId && myId && lockId !== myId) {
      showLockedDialog(n.en_proceso_por_nombre || '');
      return;
    }

    const notifId = n.id || n.id_notificacion;

    // Sin notifId no podemos verificar el lock — no abrir
    if (!notifId) {
      showToast?.('No se pudo identificar la notificacion.', 'error');
      return;
    }

    // Confirmar con el servidor ANTES de abrir la vista
    setRealizando(true);
    try {
      const r = await fetch(`/api/admin/notificaciones/${notifId}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ estado: 'EN_PROCESO' }),
      });

      let j = {};
      try { j = await r.json(); } catch {}

      // Cualquier respuesta no-2xx: NO abrir la vista
      if (!r.ok) {
        if (r.status === 409 && j?.locked_by) {
          showLockedDialog(j.locked_by?.name || j.locked_by?.nombre || 'Otro trabajador');
        } else {
          showToast?.('No se pudo abrir. Intenta de nuevo.', 'error');
        }
        return;
      }

      // Solo llegamos aqui si el servidor confirmo con 2xx
      const nextView = {
        ...n,
        estado_label: 'EN PROCESO',
        en_proceso_por_id: myId || n.en_proceso_por_id,
        en_proceso_por_nombre: currentWorker?.name || n.en_proceso_por_nombre,
      };
      if (isEntrega) setVistaEntrega(nextView);
      else setVistaServicio(nextView);

    } catch {
      // Error de red — NO abrir la vista
      showToast?.('Error de conexion. Intenta de nuevo.', 'error');
    } finally {
      setRealizando(false);
    }
  };

  const handleDelete = () => {
    onRequestDelete(n, cardRef.current?.getBoundingClientRect());
  };

  return (
    <div
      ref={cardRef}
      className={`fc${isSelected?' sel':''}${isNew?' new':''}`}
      data-notif-row="1"
      data-notif-id={String(n.id)}
      style={{ position:'relative',borderRadius:18,outlineOffset:2 }}
    >
      {/* Pestaña carpeta */}
      <div style={{ position:'absolute',top:-12,left:20,width:76,height:14,
        background:isSelected?T.brandMid:si.color,borderRadius:'7px 7px 0 0',opacity:.82,
        boxShadow:`0 -2px 8px ${isSelected?T.brandMid:si.color}44`,transition:'background .25s' }}/>

      <div style={{ ...gc,borderRadius:18,padding:compact?'14px 16px 12px':'18px 18px 14px',
        position:'relative',overflow:'hidden',
        border:isSelected?`1.5px solid ${T.brandMid}`:`1px solid ${T.border}`,
        background:isSelected?'rgba(128,194,220,.10)':T.glassBg,
        transition:'border .25s,background .25s' }}>
        {/* Brillos glass */}
        <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent)',pointerEvents:'none' }}/>
        <div style={{ position:'absolute',top:0,bottom:0,left:0,width:1,
          background:'linear-gradient(180deg,rgba(255,255,255,.8),transparent)',pointerEvents:'none' }}/>

        {/* Cabecera */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:compact?10:12 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div ref={folderRef} style={{ flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
              width:compact?34:40,height:compact?34:40,borderRadius:compact?10:12,
              background:`linear-gradient(135deg,${si.color}1a,${si.color}0a)`,
              border:`1.5px solid ${si.color}33`,boxShadow:`0 3px 10px ${si.color}18` }}>
              <IconFolder size={compact?20:24} stroke={1} color={isSelected?T.brandMid:si.color}/>
            </div>
            <div>
              <div style={{ fontWeight:700,fontSize:compact?12.5:14,color:T.text,
                fontFamily:T.fontHead,letterSpacing:.2,lineHeight:1.3 }}>{n.nombre || '—'}</div>
              <div style={{ fontSize:10,color:T.textDim,fontFamily:T.fontMono,marginTop:2 }}>
                #{String(n.id).slice(-6).toUpperCase()}
              </div>
              {n.fecha && (
                <div style={{ fontSize:10,color:T.textDim,fontFamily:T.fontMono,marginTop:1 }}>
                  {fmtFecha(n.fecha)}
                </div>
              )}
            </div>
          </div>
          <Badge label={n.estado_label || 'Pendiente'}/>
        </div>

        {/* Chips (solo modo normal) */}
        {!compact && (
          <div style={{ display:'flex',gap:7,flexWrap:'wrap',marginBottom:12,minHeight:28 }}>
            {isEntrega && n.carrito_id && (
              <div style={{ display:'flex',alignItems:'center',gap:5,padding:'3px 10px',
                borderRadius:8,background:'rgba(128,194,220,.08)',border:`1px solid ${T.border}` }}>
                <IconPackage size={11} color={T.brandMid}/>
                <CantidadChip estado={cantEstado}/>
              </div>
            )}
            {isEntrega && n.carrito_estado && (
              <div style={{ padding:'3px 10px',borderRadius:8,
                background:'rgba(128,194,220,.06)',border:`1px solid ${T.border}` }}>
                <Badge label={n.carrito_estado}/>
              </div>
            )}
          </div>
        )}

        {/* Divisor */}
        <div style={{ height:1,background:`linear-gradient(90deg,${T.border},transparent)`,marginBottom:compact?10:12 }}/>

        {/* Acciones */}
        <div style={{ display:'flex',gap:6,alignItems:'center' }}>
          <Btn small color={T.brand} icon={realizando ? <IconLoader size={12} style={{animation:'spin 0.8s linear infinite'}}/> : <IconFolderOpen size={12}/>}
            onClick={handleRealize} disabled={realizando}>
            {realizando ? 'Verificando…' : (compact ? 'Abrir' : 'Realizar')}
          </Btn>
          <div style={{ flex:1 }}/>
          {isEntrega && (
            <IBtn title="Ver detalle" color={isSelected?T.brandMid:T.brand}
              icon={<IconEye size={14}/>} onClick={() => onVerDetalle(n)}/>
          )}
          <IBtn title={isEntrega ? 'Eliminar pedido' : 'Eliminar servicio'} color={T.red} icon={<IconTrash size={14}/>}
            onClick={handleDelete}/>
        </div>
      </div>
    </div>
  );
}

/* ─── SKELETON ───────────────────────────────────────────────────────────── */
function SkeletonFolder({ compact }) {
  return (
    <div style={{ position:'relative',borderRadius:18 }}>
      <div style={{ position:'absolute',top:-12,left:20,width:76,height:14,
        borderRadius:'7px 7px 0 0',background:'rgba(128,194,220,.18)' }}/>
      <div style={{ ...gc,borderRadius:18,padding:compact?'14px 16px 12px':'18px 18px 14px' }}>
        <div style={{ display:'flex',gap:10,marginBottom:12 }}>
          <div className="ske" style={{ width:compact?34:40,height:compact?34:40,borderRadius:compact?10:12,flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div className="ske" style={{ height:13,width:'60%',marginBottom:6 }}/>
            <div className="ske" style={{ height:10,width:'35%' }}/>
          </div>
        </div>
        {!compact && (
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <div className="ske" style={{ height:24,width:80,borderRadius:8 }}/>
            <div className="ske" style={{ height:24,width:70,borderRadius:8 }}/>
          </div>
        )}
        <div style={{ height:1,background:T.border,marginBottom:compact?10:12 }}/>
        <div className="ske" style={{ height:30,width:90,borderRadius:10 }}/>
      </div>
    </div>
  );
}

/* ─── DETAIL PANEL ───────────────────────────────────────────────────────── */
function DetailPanel({ detalle, loading, error, notifInfo, onClose, isMobile=false }) {
  const si = notifInfo ? statusInfo(notifInfo.estado_label || 'Pendiente') : null;
  return (
    <div className="dp" style={{ width:isMobile?'100%':'42%',minWidth:isMobile?0:340,flexShrink:0,display:'flex',flexDirection:'column',
      background:'rgba(255,255,255,.60)',backdropFilter:'blur(24px) saturate(180%)',
      WebkitBackdropFilter:'blur(24px) saturate(180%)',overflowY:'auto',
      borderRadius:isMobile?'0 0 16px 16px':'0 22px 22px 0' }}>
      {/* Cabecera */}
      <div style={{ padding:'20px 22px 16px',borderBottom:`1px solid ${T.borderMid}`,
        background:'rgba(255,255,255,.55)',flexShrink:0,position:'relative' }}>
        <button onClick={onClose} className="btn-p" style={{
          position:'absolute',top:14,right:14,width:30,height:30,borderRadius:9,
          border:`1.5px solid ${T.border}`,background:'rgba(255,255,255,.7)',
          color:T.textLight,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
          <IconX size={14}/>
        </button>
        <div style={{ display:'flex',alignItems:'flex-end',gap:14,marginBottom:12 }}>
          {/* Icono archivo */}
          <div style={{ position:'relative',flexShrink:0 }}>
            <div style={{ position:'absolute',top:5,left:4,width:40,height:50,borderRadius:9,
              background:si?si.color:T.brandMid,opacity:.12,transform:'rotate(6deg)' }}/>
            <div style={{ position:'absolute',top:3,left:2,width:40,height:50,borderRadius:9,
              background:si?si.color:T.brandMid,opacity:.09,transform:'rotate(3deg)' }}/>
            <div style={{ width:42,height:52,borderRadius:10,position:'relative',
              background:'linear-gradient(160deg,#ffffff 55%,#eaf6ff)',
              border:`1.5px solid ${T.borderStr}`,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:3,
              boxShadow:'0 8px 24px rgba(90,139,168,.18),inset 0 1px 0 rgba(255,255,255,.9)' }}>
              <div style={{ position:'absolute',top:0,right:0,width:11,height:11,
                background:`linear-gradient(225deg,${T.brandLight} 50%,transparent 50%)`,borderBottomLeftRadius:4 }}/>
              <div style={{ width:'65%',height:2,borderRadius:2,background:T.brandLight,opacity:.7 }}/>
              <div style={{ width:'50%',height:2,borderRadius:2,background:T.brandLight,opacity:.5 }}/>
              <div style={{ width:'60%',height:2,borderRadius:2,background:T.brandLight,opacity:.4 }}/>
              <IconFileText size={14} color={T.brand} style={{ marginTop:2 }}/>
            </div>
            {si && <div style={{ position:'absolute',bottom:-5,left:'50%',transform:'translateX(-50%)',
              width:24,height:3,borderRadius:999,background:si.color,opacity:.65 }}/>}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:9,fontWeight:700,letterSpacing:2,color:T.textDim,fontFamily:T.fontMono,marginBottom:4 }}>EXPEDIENTE</div>
            <h3 style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:16,color:T.text,lineHeight:1.2,marginBottom:6 }}>
              {notifInfo?.nombre || '—'}
            </h3>
            <div style={{ display:'flex',gap:7,flexWrap:'wrap' }}>
              {notifInfo && <Badge label={notifInfo.estado_label || 'Pendiente'}/>}
              {notifInfo?.fecha && (
                <span style={{ fontSize:11,color:T.textDim,fontFamily:T.fontMono }}>
                  {fmtFecha(notifInfo.fecha)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'3px 11px',borderRadius:8,
          background:T.brandSoft,border:`1px solid ${T.borderMid}`,fontSize:11,color:T.brand,
          fontFamily:T.fontMono,fontWeight:600 }}>
          <IconChevronRight size={11}/>
          {String(notifInfo?.id || '').slice(-8).toUpperCase() || '—'}
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ flex:1,padding:'18px 22px 26px',overflowY:'auto' }}>
        {loading && (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12,paddingTop:48,color:T.textLight }}>
            <div style={{ width:46,height:46,borderRadius:13,background:T.brandSoft,
              border:`1px solid ${T.borderMid}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <IconLoader size={20} style={{ animation:'spin .8s linear infinite',color:T.brandMid }}/>
            </div>
            <span style={{ fontSize:13,fontWeight:500 }}>Cargando expediente…</span>
          </div>
        )}
        {error && !loading && (
          <div style={{ padding:'14px 16px',borderRadius:14,background:T.redSoft,
            border:`1px solid ${T.redBorder}`,display:'flex',alignItems:'flex-start',gap:10 }}>
            <IconAlertTriangle size={17} color={T.red} style={{ flexShrink:0,marginTop:1 }}/>
            <div>
              <div style={{ fontWeight:700,fontSize:13,color:T.red }}>No se pudo cargar</div>
              <div style={{ fontSize:12,marginTop:2,color:T.red,opacity:.75 }}>{error}</div>
            </div>
          </div>
        )}
        {detalle?.success && !loading && (
          <>
            {/* Datos del cliente */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:2,color:T.textDim,fontFamily:T.fontMono,marginBottom:9 }}>
                DATOS DEL CLIENTE
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:7 }}>
                {[
                  ['Cliente',   detalle.cliente?.nombre || detalle.cliente?.razon_social || notifInfo?.nombre || '—'],
                  ['Teléfono',  detalle.cliente?.numero || '—'],
                  ['Documento', `${detalle.cliente?.tipo_documento||''} ${detalle.cliente?.documento||''}`.trim() || '—'],
                  ['Correo',    detalle.cliente?.correo || '—'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ padding:'9px 12px',borderRadius:10,...gc }}>
                    <div style={{ fontSize:9,letterSpacing:1.5,color:T.textDim,fontFamily:T.fontMono,fontWeight:600,marginBottom:2 }}>
                      {lbl.toUpperCase()}
                    </div>
                    <div style={{ fontWeight:600,color:T.text,fontSize:12,wordBreak:'break-all' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Productos */}
            <div>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9 }}>
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:2,color:T.textDim,fontFamily:T.fontMono }}>PRODUCTOS</div>
                {detalle.items?.length > 0 && (
                  <span style={{ background:T.brandSoft,border:`1px solid ${T.borderMid}`,color:T.brand,
                    fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,fontFamily:T.fontMono }}>
                    {detalle.items.length} ítem{detalle.items.length!==1?'s':''}
                  </span>
                )}
              </div>
              {!detalle.items?.length ? (
                <div style={{ padding:'24px 0',textAlign:'center',border:`1.5px dashed ${T.border}`,
                  borderRadius:14,color:T.textDim,fontSize:13 }}>Sin productos registrados</div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  {detalle.items.map((it, idx) => (
                    <div key={it.item_key || `${it.id_producto || 'item'}-${idx}`} style={{ ...gc,borderRadius:11,padding:'11px 14px',
                      display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:24,height:24,borderRadius:7,flexShrink:0,background:T.brandSoft,
                        border:`1px solid ${T.borderMid}`,display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:10,fontWeight:800,color:T.brand,fontFamily:T.fontMono }}>{idx+1}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:13,color:T.text,marginBottom:2 }}>{it.nombre}</div>
                        {it.tipo_item === 'corte' && it.medida_texto ? (
                          <div style={{ fontSize:11,color:T.textMid,fontWeight:700,marginBottom:4 }}>
                            {it.medida_texto}
                          </div>
                        ) : null}
                        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                          {it.tipo_item === 'corte' && <span style={{ fontSize:10,color:'#b45309',fontFamily:T.fontMono }}>CORTE</span>}
                          {it.tipo_item === 'corte' && it.es_aluminio ? <span style={{ fontSize:10,color:'#92400e',fontFamily:T.fontMono }}>ALUMINIO</span> : null}
                          {it.codigo  && <span style={{ fontSize:10,color:T.brand,fontFamily:T.fontMono }}>{it.codigo}</span>}
                          {it.fila    && <span style={{ fontSize:10,color:T.textLight }}>Fila:{it.fila}</span>}
                          {it.columna && <span style={{ fontSize:10,color:T.textLight }}>Col:{it.columna}</span>}
                          {it.grosor  && <span style={{ fontSize:10,color:T.textLight }}>Grosor:{it.grosor}</span>}
                          {it.medidas_count ? <span style={{ fontSize:10,color:T.textLight }}>Medidas:{it.medidas_count}</span> : null}
                          {it.tipo_item === 'corte' && !it.es_aluminio && it.ancho_cm && it.alto_cm ? <span style={{ fontSize:10,color:T.textLight }}>{it.ancho_cm} x {it.alto_cm} cm</span> : null}
                        </div>
                      </div>
                      <div style={{ textAlign:'right',flexShrink:0 }}>
                        <div style={{ fontWeight:800,fontSize:13,color:T.brand,fontFamily:T.fontMono }}>
                          S/{Number(it.subtotal||0).toFixed(2)}
                        </div>
                        <div style={{ fontSize:10,color:T.textDim,fontFamily:T.fontMono }}>×{it.cantidad}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'12px 16px',borderRadius:11,marginTop:3,
                    background:`linear-gradient(135deg,${T.brandSoft},rgba(128,194,220,.18))`,
                    border:`1.5px solid ${T.borderMid}` }}>
                    <span style={{ fontWeight:700,fontSize:12,color:T.textMid,fontFamily:T.fontHead,letterSpacing:.5 }}>TOTAL</span>
                    <span style={{ fontWeight:800,fontSize:18,color:T.brand,fontFamily:T.fontMono }}>
                      S/ {Number(detalle.total_precio||0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
const ENTREGA_STATE_KEY = 'obras_vista_entrega';
const SERVICIO_STATE_KEY = 'obras_vista_servicio';

const Obras = () => {
  injectCSS();
  const navigate = useNavigate();

  // Guard de sesión
  useEffect(() => {
    if (!localStorage.getItem('personalToken')) {
      navigate('/personal', { replace: true });
    }
  }, [navigate]);

  const [toast,            setToast]            = useState(null);
  const [ocultarAtend,     setOcultarAtend]      = useState(true);
  const [notifs,           setNotifs]            = useState([]);
  const [loadingNotifs,    setLoadingNotifs]      = useState(false);
  const [showSidebar,      setShowSidebar]        = useState(false);
  const [categoria,        setCategoria]          = useState('ENTREGA');
  const [busqueda,         setBusqueda]           = useState('');
  const [detalle,          setDetalle]            = useState(null);
  const [loadingDetalle,   setLoadingDetalle]     = useState(false);
  const [errorDetalle,     setErrorDetalle]       = useState('');
  const [selectedNotif,    setSelectedNotif]      = useState(null);
  const [flyPaper,         setFlyPaper]           = useState(null);
  const [confirmOpen,      setConfirmOpen]        = useState(false);
  const [confirmLeaving,   setConfirmLeaving]     = useState(false);
  const [confirmTarget,    setConfirmTarget]      = useState(null);
  const [confirmLoading,   setConfirmLoading]     = useState(false);
  const [lockedDialog,     setLockedDialog]       = useState({ open:false, leaving:false, workerName:'' });
  const [visibleCount,     setVisibleCount]       = useState(PAGE_SIZE);
  const [vistaServicio,    setVistaServicio]      = useState(null);
  const [vistaEntrega,     setVistaEntrega]       = useState(null);
  const [cantMap,          setCantMap]            = useState({});
  const [newNotifIds,      setNewNotifIds]        = useState([]);
  const [showRetazoModal,  setShowRetazoModal]    = useState(false);

  // Refs que no causan re-render
  const lastIdsRef   = useRef(new Set());
  const animatedRef  = useRef(false);
  const cantMapRef   = useRef({});
  const notifsRef    = useRef([]);
  const gridRef      = useRef(null);
  const sentinelRef  = useRef(null);
  const scrollRef    = useRef(null);
  const hasMoreRef   = useRef(false);

  const [viewportWidth, setViewportWidth] = useState(() =>
    (typeof window === 'undefined' ? 1280 : window.innerWidth)
  );
  const isMobile = viewportWidth <= 1024;
  const isCompactMobile = viewportWidth <= 640;



  // Mantener refs sincronizados
  useEffect(() => { cantMapRef.current      = cantMap;       }, [cantMap]);
  useEffect(() => { notifsRef.current       = notifs;        }, [notifs]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);


  /* Toast */
  const showToast = useCallback((msg, tipo='success') => {
    setToast({ mensaje:msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* Locked */
  const openLocked = useCallback((name) => {
    setLockedDialog({ open:true, leaving:false, workerName:name || '' });
  }, []);
  const closeLocked = useCallback(() => {
    setLockedDialog(p => ({ ...p, leaving:true }));
    setTimeout(() => setLockedDialog({ open:false, leaving:false, workerName:'' }), 260);
  }, []);

  /* Worker del JWT */
  const currentWorker = useMemo(() => {
    const p = decodeToken(localStorage.getItem('personalToken') || '');
    return { id: String(p?.sub || p?.id || ''), name: String(p?.name || p?.nombre || '').trim() };
  }, []);

  /* Auth headers */
  const authHeaders = useCallback(() => {
    try { const t = localStorage.getItem('personalToken'); if (t) return { Authorization:`Bearer ${t}` }; } catch {}
    return {};
  }, []);

  useEffect(() => {
    if (vistaEntrega) return;
    try {
      const raw = sessionStorage.getItem(ENTREGA_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.notificacion) setVistaEntrega(parsed.notificacion);
    } catch {}
  }, [vistaEntrega]);

  useEffect(() => {
    if (vistaServicio) return;
    try {
      const raw = sessionStorage.getItem(SERVICIO_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.notificacion) setVistaServicio(parsed.notificacion);
    } catch {}
  }, [vistaServicio]);

  useEffect(() => {
    try {
      if (vistaEntrega) sessionStorage.setItem(ENTREGA_STATE_KEY, JSON.stringify({ notificacion: vistaEntrega }));
      else sessionStorage.removeItem(ENTREGA_STATE_KEY);
    } catch {}
  }, [vistaEntrega]);

  useEffect(() => {
    try {
      if (vistaServicio) sessionStorage.setItem(SERVICIO_STATE_KEY, JSON.stringify({ notificacion: vistaServicio }));
      else sessionStorage.removeItem(SERVICIO_STATE_KEY);
    } catch {}
  }, [vistaServicio]);

  /* Fetch cantidades (una sola vez por carrito) */
  const fetchCantidades = useCallback(async (lista) => {
    const items = lista.filter(n => n.carrito_id && cantMapRef.current[n.carrito_id] === undefined);
    if (!items.length) return;
    // Marcar en el ref inmediatamente (síncrono) para evitar re-fetches en el mismo ciclo
    items.forEach(n => { cantMapRef.current[n.carrito_id] = SENTINEL; });
    // Marcar como cargando en el estado
    setCantMap(prev => {
      const p = {};
      items.forEach(n => { p[n.carrito_id] = SENTINEL; });
      return { ...prev, ...p };
    });
    // Máximo 4 requests simultáneos para no saturar Supabase
    const fetchOne = async (n) => {
      try {
        const r = await fetch(`/api/admin/pedidos/${n.carrito_id}/detalle`, { headers:authHeaders() });
        if (!r.ok) return { id:n.carrito_id, total:null };
        const j = await r.json();
        return { id:n.carrito_id, total:j.success ? (j.total_items ?? null) : null };
      } catch { return { id:n.carrito_id, total:null }; }
    };
    const CHUNK = 4;
    const allResults = [];
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK);
      const chunkResults = await Promise.allSettled(chunk.map(fetchOne));
      allResults.push(...chunkResults);
    }
    setCantMap(prev => {
      const p = {};
      allResults.forEach(r => { if (r.status==='fulfilled') p[r.value.id] = r.value.total; });
      return { ...prev, ...p };
    });
  }, [authHeaders]);

  /* Fetch notificaciones */
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  const fetchNotifs = useCallback(async ({ silent=false } = {}) => {
    if (!silent) setLoadingNotifs(true);
    try {
      const token = localStorage.getItem('personalToken');
      if (!token) { setNotifs([]); return; }
      const p = new URLSearchParams({ tipo:categoria });
      if (ocultarAtend) p.set('ocultar_atendidas','1');
      const r = await fetch(`/api/admin/notificaciones?${p}`, { headers:authHeaders() });
      if (!r.ok) return; // mantener notifs existentes en error transitorio
      const j = await r.json();
      if (j.success && Array.isArray(j.notificaciones)) {
        const lista = j.notificaciones
          .map(n => ({ ...n, id:n.id||n.id_notificacion }))
          .sort((a,b) => new Date(b.fecha||0) - new Date(a.fecha||0));
        // Detectar nuevas
        if (silent && lastIdsRef.current.size > 0) {
          const nuevas = lista.filter(n => !lastIdsRef.current.has(String(n.id)));
          if (nuevas.length) {
            setNewNotifIds(nuevas.map(n => String(n.id)));
            showToastRef.current(nuevas.length===1 ? 'Nueva notificación recibida' : `${nuevas.length} nuevas notificaciones`);
            setTimeout(() => setNewNotifIds([]), 2400);
          }
        }
        lastIdsRef.current = new Set(lista.map(n => String(n.id)));
        setNotifs(lista);
        // Preservar cantidades ya conocidas
        setCantMap(prev => {
          const next = {};
          lista.forEach(n => { if (n.carrito_id && prev[n.carrito_id] !== undefined) next[n.carrito_id] = prev[n.carrito_id]; });
          return next;
        });
      }
      // si !j.success mantener notifs existentes
    } catch { /* mantener notifs existentes en error de red */ }
    finally { if (!silent) setLoadingNotifs(false); }
  }, [authHeaders, ocultarAtend, categoria]);



  /* Ver detalle */
  const handleVerDetalle = useCallback(async (n) => {
    if (!n.carrito_id) { showToast('Sin pedido asociado', 'error'); return; }
    if (selectedNotif?.id === n.id) {
      setSelectedNotif(null); setDetalle(null); setErrorDetalle(''); setFlyPaper(null);
      return;
    }
    const cardEl = gridRef.current?.querySelector(`[data-notif-id="${n.id}"]`);
    const rect   = cardEl?.getBoundingClientRect();
    const si     = statusInfo(n.estado_label || 'Pendiente');
    if (rect) { setFlyPaper({ rect, color:si.color }); setTimeout(() => setFlyPaper(null), 580); }
    setSelectedNotif(n); setLoadingDetalle(true); setDetalle(null); setErrorDetalle('');
    try {
      const r = await fetch(`/api/admin/pedidos/${n.carrito_id}/detalle`, { headers:authHeaders() });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setDetalle(j);
    } catch (e) { setErrorDetalle(String(e).replace('Error: ','')); }
    finally { setLoadingDetalle(false); }
  }, [authHeaders, showToast, selectedNotif]);

  const closeDetail = useCallback(() => {
    setSelectedNotif(null); setDetalle(null); setErrorDetalle('');
  }, []);

  /* Confirm delete */
  const handleRequestDelete = useCallback((n, rect) => {
    setConfirmTarget({ n, rect }); setConfirmLeaving(false); setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback((cb) => {
    setConfirmLeaving(true);
    setTimeout(() => { setConfirmOpen(false); setConfirmLeaving(false); setConfirmTarget(null); cb?.(); }, 280);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    const { n, rect } = confirmTarget;

    setConfirmLoading(true);
    try {
      const isServicio = String(n.tipo || '').toUpperCase() === 'SERVICIO';
      const endpoint = isServicio
        ? `/api/admin/notificaciones/${n.id}`
        : `/api/admin/pedidos/${n.carrito_id}`;
      const r = await fetch(endpoint, { method:'DELETE', headers:authHeaders() });
      const j = await r.json();
      if (r.status === 409) {
        setConfirmLoading(false);
        closeConfirm();
        openLocked(j.locked_by?.name || j.locked_by?.nombre || '');
        return;
      }
      if (!r.ok || !j.success) throw new Error(j.error || j.message);
      setConfirmLoading(false);
      closeConfirm(() => {
        spawnParticles(rect, statusInfo(n.estado_label || '').color);
        const el = gridRef.current?.querySelector(`[data-notif-id="${n.id}"]`);
        if (el) el.classList.add('del');
        setTimeout(async () => {
          showToast(isServicio ? 'Servicio eliminado correctamente' : 'Pedido eliminado correctamente');
          if (selectedNotif?.id === n.id) closeDetail();
          const carritoId = n.carrito_id || j.carrito_id;
          if (carritoId) {
            setCantMap(p => { const q={...p}; delete q[carritoId]; return q; });
          }
          try { await fetchNotifs(); } catch {}
        }, 520);
      });
    } catch (e) {
      setConfirmLoading(false);
      closeConfirm();
      showToast(String(e), 'error');
    }
  }, [confirmTarget, authHeaders, showToast, selectedNotif, closeDetail, fetchNotifs, closeConfirm, currentWorker, openLocked]);

  /* Load more */
  const handleLoadMore = useCallback(() => {
    const prev = visibleCount;
    setVisibleCount(v => v + PAGE_SIZE);
    setTimeout(() => {
      const all = gridRef.current?.querySelectorAll('[data-notif-row="1"]');
      if (!all) return;
      Array.from(all).slice(prev).forEach(el => {
        el.classList.add('new');
        setTimeout(() => el.classList.remove('new'), 500);
      });
    }, 30);
  }, [visibleCount]);

  /* Effects */
  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Fetch cantidades cuando cambian las notifs (separado para no recrear fetchNotifs)
  useEffect(() => {
    if (notifs.length > 0) fetchCantidades(notifs);
  }, [notifs, fetchCantidades]);

  // SSE removed — polling only

  // Polling silencioso — ref estable, nunca reinicia el intervalo
  const _pollRef = useRef(null);
  _pollRef.current = fetchNotifs;
  useEffect(() => {
    if (vistaEntrega || vistaServicio) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      _pollRef.current?.({ silent:true });
    }, 10000);
    return () => clearInterval(id);
  }, [vistaEntrega, vistaServicio]);

  useEffect(() => {
    if (loadingNotifs) return;
    const cards = gridRef.current?.querySelectorAll('[data-notif-row="1"]');
    if (!cards?.length || animatedRef.current) return;
    animatedRef.current = true;
    animate(cards, { opacity:[0,1], translateY:[18,0], scale:[.97,1],
      ease:spring({stiffness:220,damping:16}), delay:stagger(55) });
  }, [notifs, loadingNotifs, categoria]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); animatedRef.current = false; },
    [busqueda, categoria, ocultarAtend]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return undefined;

    const es = new EventSource(buildApiUrl('/api/realtime/mermas'));

    const onMermasChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        if (payload?.initial) return;

        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        const inserts = changes.filter((c) => c?.op === 'insert');
        if (!inserts.length) return;

        if (inserts.length === 1) {
          const nombre = String(inserts[0]?.record?.nombre || 'Retazo');
          showToast(`Nueva merma registrada: ${nombre}`);
          return;
        }

        showToast(`${inserts.length} nuevas mermas registradas`);
      } catch {
        // Ignorar payloads malformed y mantener stream vivo.
      }
    };

    es.addEventListener('mermas_changed', onMermasChanged);

    return () => {
      es.removeEventListener('mermas_changed', onMermasChanged);
      es.close();
    };
  }, [showToast]);

  // Realtime SSE: refrescar al instante cuando cambia cualquier notificación
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return;
    const es = new EventSource(buildApiUrl('/api/realtime/notificaciones'));
    let _debounceTimer = null;
    const onChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        if (payload?.initial) return;
        if (document.visibilityState === 'hidden') return;
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(() => _pollRef.current?.({ silent: true }), 800);
      } catch { /* ignorar payload malformed */ }
    };
    es.addEventListener('notificaciones_changed', onChanged);
    return () => {
      clearTimeout(_debounceTimer);
      es.removeEventListener('notificaciones_changed', onChanged);
      es.close();
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMoreRef.current) handleLoadMore(); },
      { root: container, rootMargin: '80px', threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [handleLoadMore, loadingNotifs]);

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return;
      if (confirmOpen) closeConfirm();
      else if (lockedDialog.open) closeLocked();
      else if (selectedNotif) closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen, lockedDialog.open, selectedNotif, closeConfirm, closeLocked, closeDetail]);

  /* Vistas */
  if (vistaServicio) return <ServicioTrabajo notificacion={vistaServicio} onBack={() => {
    try {
      sessionStorage.removeItem(SERVICIO_STATE_KEY);
      sessionStorage.removeItem('obras_servicio_active_tab');
    } catch {}
    setVistaServicio(null);
    fetchNotifs({ silent:true });
  }}/>;
  if (vistaEntrega)  return <EntregaPedido   notificacion={vistaEntrega}  onBack={() => {
    try {
      sessionStorage.removeItem(ENTREGA_STATE_KEY);
      sessionStorage.removeItem('obras_entrega_active_tab');
    } catch {}
    setVistaEntrega(null);
    fetchNotifs({ silent:true });
  }}/>;

  const counts = {
    ENTREGA:  notifs.filter(n => (n.tipo||categoria).toUpperCase()==='ENTREGA').length,
    SERVICIO: notifs.filter(n => (n.tipo||'').toUpperCase()==='SERVICIO').length,
  };
  const filtered   = busqueda.trim() ? notifs.filter(n => (n.nombre||'').toLowerCase().includes(busqueda.trim().toLowerCase())) : notifs;
  const paginated  = filtered.slice(0, visibleCount);
  const hasMore    = visibleCount < filtered.length;
  hasMoreRef.current = hasMore;
  const panelOpen  = !!selectedNotif;
  const gridCols   = isCompactMobile
    ? '1fr'
    : (panelOpen ? 'repeat(auto-fill,minmax(200px,1fr))' : 'repeat(auto-fill,minmax(270px,1fr))');

  return (
    <div className="obras-root">
      <div className="obras-bg"/><div className="deco1"/><div className="deco2"/>

      {flyPaper && <FlyingPaper rect={flyPaper.rect} color={flyPaper.color}/>}

      <LockedDialog open={lockedDialog.open} leaving={lockedDialog.leaving}
        workerName={lockedDialog.workerName} onClose={closeLocked}/>

      <AgregarRetazoModal
        open={showRetazoModal}
        onClose={() => setShowRetazoModal(false)}
        onSaved={() => showToast('Retazo guardado correctamente en tiempo real')}
      />

      <ConfirmDialog open={confirmOpen} leaving={confirmLeaving}
        entityLabel={String(confirmTarget?.n?.tipo || '').toUpperCase() === 'SERVICIO' ? 'servicio' : 'pedido'}
        detail={confirmTarget?.n?.nombre || undefined}
        onConfirm={handleConfirmDelete} onCancel={() => closeConfirm()} loading={confirmLoading}/>

      <div className="obras-inner" style={{ padding:'48px 28px 24px' }}>
        <Toast toast={toast} isMobile={isCompactMobile}/>

        {/* HEADER */}
        <header className="obras-header">
          <div className="obras-header-main">
            <div style={{ width:46,height:46,borderRadius:14,flexShrink:0,
            background:`linear-gradient(135deg,${T.brandMid} 0%,${T.brand} 100%)`,
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:`0 8px 22px ${T.brandMid}44,inset 0 1px 0 rgba(255,255,255,.4)`,
            border:'1px solid rgba(255,255,255,.4)' }}>
              <IconTool size={20} color="#fff"/>
            </div>
            <div>
              <h1 style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:isCompactMobile?19:22,color:T.text,letterSpacing:.3,lineHeight:1 }}>
                Panel de Obras
              </h1>
              <p style={{ fontSize:isCompactMobile?10:11,color:T.textDim,fontFamily:T.fontMono,marginTop:2 }}>
                Gestión de entregas &amp; servicios
              </p>
            </div>
          </div>
          <div className="obras-header-actions">
            {/* Campana */}
            <button className="btn-p" onClick={() => setShowSidebar(v => !v)} style={{
              position:'relative',width:40,height:40,borderRadius:12,...gc,
              background:showSidebar?T.brandSoft:T.glassBg,
              border:`1px solid ${showSidebar?T.borderStr:T.border}`,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
              <IconBell size={17} color={showSidebar?T.brand:T.textLight}/>
              {notifs.length > 0 && (
                <span style={{ position:'absolute',top:8,right:8,width:7,height:7,borderRadius:'50%',
                  background:T.brandMid,border:'2px solid white',animation:'pulse 2s infinite' }}/>
              )}
            </button>
            <Btn
              small
              color={T.brandMid}
              solid={false}
              icon={<IconStack2 size={13} />}
              onClick={() => setShowRetazoModal(true)}>
              Agregar retazo
            </Btn>
            {/* Salir */}
            <button className="btn-p" onClick={() => {
              try {
                sessionStorage.removeItem(ENTREGA_STATE_KEY);
                sessionStorage.removeItem('obras_entrega_active_tab');
                sessionStorage.removeItem(SERVICIO_STATE_KEY);
                sessionStorage.removeItem('obras_servicio_active_tab');
              } catch {}
              ['personalToken', 'auth_token', 'cliente_id', 'cliente_correo', 'staff', 'area'].forEach(k => localStorage.removeItem(k));
              const STAFF_PATHS = new Set(['/almacen', '/administracion', '/obras', '/operaciones', '/personal']);
              try {
                const raw = localStorage.getItem('breadcrumb_history');
                const hist = raw ? JSON.parse(raw) : [];
                localStorage.setItem('breadcrumb_history', JSON.stringify(hist.filter(b => !STAFF_PATHS.has(b.path))));
              } catch {}
              navigate('/personal', { replace: true });
            }} style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:11,
              cursor:'pointer',background:T.redSoft,border:`1.5px solid ${T.redBorder}`,
              color:T.red,fontSize:13,fontWeight:700,fontFamily:T.fontBody,backdropFilter:'blur(8px)' }}>
              <IconLogout size={14}/> Salir
            </button>
          </div>
        </header>

        {/* MAIN CARD */}
        <div style={{ borderRadius:22,overflow:'hidden',...gcM,animation:'fadeUp .45s ease',position:'relative' }}>
          <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent)',pointerEvents:'none' }}/>
          <div className="obras-shell">
            <Sidebar visible={showSidebar} categoria={categoria}
              setCategoria={v => {
                if (v === categoria) return;
                setCategoria(v);
                setNotifs([]);
                setLoadingNotifs(true);
                animatedRef.current = false;
                setBusqueda('');
                closeDetail();
              }}
              counts={counts} isMobile={isMobile}/>

            <div className="obras-main">
              {/* GRID */}
              <div className="grid-s obras-grid">
                {/* Toolbar */}
                <div className="obras-toolbar">
                  <div>
                    <h2 style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:17,color:T.text,letterSpacing:.2 }}>
                      {categoria==='ENTREGA' ? 'Entregas pendientes' : 'Servicios pendientes'}
                    </h2>
                    <p style={{ fontSize:11.5,color:T.textDim,fontFamily:T.fontMono,marginTop:2 }}>
                      {loadingNotifs ? 'Actualizando…' : busqueda.trim()
                        ? `${filtered.length} resultado${filtered.length!==1?'s':''} de ${notifs.length}`
                        : `${notifs.length} expediente${notifs.length!==1?'s':''}`}
                    </p>
                  </div>
                  <div className="obras-toolbar-actions">
                    <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                      <SearchBar value={busqueda} onChange={v => setBusqueda(v)} fullWidth={isCompactMobile}/>
                      <Btn small color={T.brand}
                        icon={<IconRefresh size={13} style={loadingNotifs?{animation:'spin .7s linear infinite'}:undefined}/>}
                        onClick={() => { animatedRef.current=false; fetchNotifs(); }}>
                        Actualizar
                      </Btn>
                    </div>
                  </div>
                </div>

                {/* Grid content */}
                {loadingNotifs && !notifs.length ? (
                  <div className="folders-scroll">
                    <div style={{ display:'grid',gridTemplateColumns:gridCols,gap:panelOpen?16:24,paddingTop:12,paddingBottom:8 }}>
                      {Array.from({length:PAGE_SIZE}).map((_,i) => <SkeletonFolder key={i} compact={panelOpen}/>)}
                    </div>
                  </div>
                ) : !filtered.length ? (
                  <div style={{ textAlign:'center',padding:'60px 0',color:T.textDim,borderRadius:16,
                    border:`1.5px dashed ${T.border}`,background:'rgba(128,194,220,.04)' }}>
                    <div style={{ fontSize:46,marginBottom:12 }}>{busqueda?'🔍':'📭'}</div>
                    <div style={{ fontWeight:700,color:T.textLight,fontSize:15,marginBottom:5 }}>
                      {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin expedientes'}
                    </div>
                    <div style={{ fontSize:13 }}>{busqueda ? 'Prueba con otro nombre' : 'No hay registros para mostrar'}</div>
                  </div>
                ) : (
                  <div className="folders-scroll" ref={scrollRef}>
                    <div ref={gridRef} style={{ display:'grid',gridTemplateColumns:gridCols,gap:panelOpen?16:24,paddingTop:12,paddingBottom:16 }}>
                      {paginated.map(n => (
                        <FolderCard
                          key={n.id}
                          n={n}
                          isEntrega={categoria==='ENTREGA'}
                          cantEstado={n.carrito_id ? cantMap[n.carrito_id] : null}
                          isNew={newNotifIds.includes(String(n.id))}
                          authHeaders={authHeaders}
                          setVistaServicio={setVistaServicio}
                          setVistaEntrega={setVistaEntrega}
                          onVerDetalle={handleVerDetalle}
                          selectedId={selectedNotif?.id}
                          compact={panelOpen}
                          onRequestDelete={handleRequestDelete}
                          currentWorker={currentWorker}
                          showLockedDialog={openLocked}
                          showToast={showToast}
                        />
                      ))}
                    </div>
                    <div ref={sentinelRef} style={{ height:1 }}/>
                  </div>
                )}
              </div>

              {/* Panel detalle */}
              {panelOpen && (
                <DetailPanel
                  detalle={detalle} loading={loadingDetalle} error={errorDetalle}
                  notifInfo={selectedNotif} onClose={closeDetail} isMobile={isMobile}/>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Obras;