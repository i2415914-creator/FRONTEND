import { useState, useEffect, useMemo, useCallback } from 'react';
import { FONTS } from '../../colors';
import { IconRuler, IconStack2, IconCheck, IconLoader, IconPackage, IconAlertTriangle, IconX } from '@tabler/icons-react';


/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const T = {
  glassBg:   'rgba(255,255,255,.65)',
  glassBgMid:'rgba(255,255,255,.85)',
  glassBlur: 'blur(20px)',
  glassSat:  'saturate(180%)',
  border:    'rgba(128,194,220,.22)',
  borderMid: 'rgba(128,194,220,.38)',
  borderStr: 'rgba(128,194,220,.60)',
  brand:     '#5a8ba8',
  brandMid:  '#80C2DC',
  brandLight:'#a8d9ed',
  brandSoft: 'rgba(128,194,220,.12)',
  brandSoft2:'rgba(128,194,220,.20)',
  red:       '#941918',
  redMid:    '#b01f1e',
  text:      '#1a2a3a',
  textMid:   '#2d4a62',
  textLight: '#5a7a90',
  textDim:   '#8aa8bc',
  white:     '#ffffff',
  fontHead:  FONTS.heading,
  fontBody:  FONTS.body,
  fontMono:  "'IBM Plex Mono',monospace",
  shadow:    '0 6px 24px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset',
};

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@keyframes rtFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes rtSpin{to{transform:rotate(360deg)}}
@keyframes rtShine{0%{left:-80%}100%{left:130%}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-18px) scale(.94)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}to{opacity:0;transform:translateX(-50%) translateY(-12px) scale(.96)}}
@keyframes toastShine{0%{left:-80%}100%{left:130%}}
@keyframes toastBar{from{width:100%}to{width:0%}}

/* ── Toast ── */
.rt-toast-wrap{position:fixed;top:28px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:10px;}
.rt-toast{position:relative;overflow:hidden;min-width:300px;max-width:480px;padding:13px 46px 13px 16px;border-radius:14px;pointer-events:all;display:flex;align-items:center;gap:11px;backdrop-filter:blur(24px) saturate(200%);-webkit-backdrop-filter:blur(24px) saturate(200%);box-shadow:0 8px 32px rgba(0,0,0,.14),0 2px 0 rgba(255,255,255,.55) inset;animation:toastIn .32s cubic-bezier(.34,1.56,.64,1) both;}
.rt-toast.exit{animation:toastOut .26s ease both}
.rt-toast.success{background:rgba(128,194,220,.22);border:1.5px solid rgba(128,194,220,.55);}
.rt-toast.success .rt-toast-icon{background:linear-gradient(135deg,rgba(128,194,220,.38),rgba(90,139,168,.28));border:1px solid rgba(128,194,220,.55);color:#2d6a8a;}
.rt-toast.success .rt-toast-bar{background:linear-gradient(90deg,#80C2DC,#5a8ba8);}
.rt-toast.success .rt-toast-text{color:#1a3a52;}
.rt-toast.success .rt-toast-close{color:#5a8ba8;}
.rt-toast.success .rt-toast-close:hover{background:rgba(128,194,220,.22);}
.rt-toast.error{background:rgba(148,25,24,.14);border:1.5px solid rgba(148,25,24,.40);}
.rt-toast.error .rt-toast-icon{background:linear-gradient(135deg,rgba(148,25,24,.22),rgba(176,31,30,.16));border:1px solid rgba(148,25,24,.40);color:#941918;}
.rt-toast.error .rt-toast-bar{background:linear-gradient(90deg,#941918,#b01f1e);}
.rt-toast.error .rt-toast-text{color:#5a1010;}
.rt-toast.error .rt-toast-close{color:#941918;}
.rt-toast.error .rt-toast-close:hover{background:rgba(148,25,24,.14);}
.rt-toast-icon{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.rt-toast-text{flex:1;font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:600;line-height:1.45;}
.rt-toast-close{position:absolute;top:9px;right:10px;width:22px;height:22px;border-radius:6px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.rt-toast-shine{position:absolute;top:0;bottom:0;width:50px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.40),transparent);pointer-events:none;animation:toastShine 2.8s ease infinite;}
.rt-toast-bar-wrap{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,.06);}
.rt-toast-bar{height:100%;border-radius:0 0 14px 14px;animation:toastBar 3.5s linear both;}

/* ── Tarjeta corte ── */
.rt-corte{border-radius:16px;position:relative;overflow:hidden;background:rgba(255,255,255,.65);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1.5px solid rgba(128,194,220,.38);box-shadow:0 6px 24px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset;animation:rtFade .28s ease both;transition:box-shadow .2s,border-color .2s;}
.rt-corte:hover{box-shadow:0 12px 36px rgba(90,139,168,.20),0 2px 0 rgba(255,255,255,.95) inset;border-color:rgba(128,194,220,.60);}

/* ── Merma card ── */
.rt-merma{position:relative;overflow:hidden;border-radius:14px;cursor:pointer;background:linear-gradient(155deg,rgba(255,255,255,.96) 0%,rgba(232,246,252,.90) 40%,rgba(215,239,250,.85) 100%);backdrop-filter:blur(22px) saturate(200%);-webkit-backdrop-filter:blur(22px) saturate(200%);border:1.5px solid rgba(128,194,220,.40);box-shadow:0 10px 32px rgba(90,139,168,.18),0 2px 0 rgba(255,255,255,.98) inset,0 -1px 0 rgba(128,194,220,.14) inset,inset 1px 0 0 rgba(255,255,255,.85);transition:all .22s cubic-bezier(.4,0,.2,1);}
.rt-merma::before{content:'';position:absolute;top:0;left:0;right:0;height:40%;background:linear-gradient(180deg,rgba(255,255,255,.55) 0%,transparent 100%);pointer-events:none;z-index:0;border-radius:14px 14px 0 0;}
.rt-merma::after{content:'';position:absolute;top:0;left:0;bottom:0;width:1px;background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.3),transparent);pointer-events:none;}
.rt-merma:hover{transform:translateY(-3px) scale(1.008);box-shadow:0 18px 44px rgba(90,139,168,.24),0 3px 0 rgba(255,255,255,.99) inset,0 -1px 0 rgba(128,194,220,.18) inset,inset 1px 0 0 rgba(255,255,255,.90);border-color:rgba(128,194,220,.65);}
.rt-merma.sel{background:linear-gradient(155deg,rgba(255,255,255,.95) 0%,rgba(255,240,240,.88) 40%,rgba(252,225,225,.82) 100%);border-color:rgba(148,25,24,.35);box-shadow:0 12px 38px rgba(148,25,24,.14),0 0 0 3px rgba(148,25,24,.10),0 2px 0 rgba(255,255,255,.92) inset;transform:translateY(-1px);}
.rt-merma-shine{position:absolute;top:0;bottom:0;width:60px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);pointer-events:none;z-index:1;animation:rtShine 2.2s ease infinite;}

.rt-sel-wrap{width:22px;height:22px;border-radius:50%;flex-shrink:0;background:rgba(255,255,255,.80);border:2px solid rgba(128,194,220,.55);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(90,139,168,.12),inset 0 1px 0 rgba(255,255,255,.9);transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative;z-index:2;}
.rt-merma.sel .rt-sel-wrap{background:linear-gradient(135deg,#941918,#b01f1e);border-color:#941918;box-shadow:0 4px 14px rgba(148,25,24,.35),inset 0 1px 0 rgba(255,255,255,.25);transform:scale(1.1);}
.rt-sel-inner{width:9px;height:9px;border-radius:50%;background:white;transform:scale(0);transition:transform .2s cubic-bezier(.34,1.56,.64,1);}
.rt-merma.sel .rt-sel-inner{transform:scale(1)}

.rt-save{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 52px;border-radius:13px;cursor:pointer;background:linear-gradient(180deg,rgba(148,25,24,.15) 0%,rgba(148,25,24,.24) 100%);color:#941918;font-family:var(--fh);font-size:14px;font-weight:700;letter-spacing:.5px;border:1.5px solid rgba(148,25,24,.32);box-shadow:inset 0 3px 8px rgba(148,25,24,.18),inset 0 1px 3px rgba(148,25,24,.10),0 1px 0 rgba(255,255,255,.85);transition:all .18s cubic-bezier(.4,0,.2,1);}
.rt-save:hover:not(:disabled){background:linear-gradient(180deg,rgba(148,25,24,.19) 0%,rgba(148,25,24,.29) 100%);box-shadow:inset 0 4px 10px rgba(148,25,24,.24),inset 0 1px 4px rgba(148,25,24,.14),0 1px 0 rgba(255,255,255,.85);}
.rt-save:active:not(:disabled){box-shadow:inset 0 5px 14px rgba(148,25,24,.30),inset 0 2px 6px rgba(148,25,24,.18),0 1px 0 rgba(255,255,255,.70);transform:translateY(1px);}
.rt-save:disabled{opacity:.5;cursor:not-allowed}
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
    <div className={`rt-toast ${tipo}${exiting ? ' exit' : ''}`}>
      <div className="rt-toast-shine"/>
      <div className="rt-toast-icon">
        {tipo === 'success' ? <IconCheck size={15}/> : <IconAlertTriangle size={15}/>}
      </div>
      <span className="rt-toast-text">{mensaje}</span>
      <button className="rt-toast-close" onClick={handleClose}><IconX size={12}/></button>
      <div className="rt-toast-bar-wrap"><div className="rt-toast-bar"/></div>
    </div>
  );
}

/* ─── LÓGICA ─────────────────────────────────────────────────────────────── */
const EPS = 0.001;
const MAX_DIM_GAP = 30;
const isClose = (a, b) => Math.abs(Number(a||0) - Number(b||0)) <= EPS;

const normalizeText = (v='') =>
  String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase().replace(/[^A-Z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();

const STOP = new Set(['VIDRIO','VIDRIOS','ALUMINIO','ALUMINIOS','CORTE','CORTES',
  'PERSONALIZADO','PERSONALIZADOS','DE','DEL','LA','EL','Y']);

const tokenize = (v='') =>
  normalizeText(v).split(' ').map(p=>p.trim()).filter(p=>p&&!STOP.has(p));

const scoreSim = (l='', r='') => {
  const aN=normalizeText(l), bN=normalizeText(r);
  if(!aN||!bN) return 0;
  if(aN===bN) return 1;
  if(aN.includes(bN)||bN.includes(aN)) return 0.92;
  const aT=tokenize(l), bT=tokenize(r);
  if(!aT.length||!bT.length) return 0;
  const bS=new Set(bT); let ov=0;
  for(const t of aT){if(bS.has(t)){ov+=1;continue;}if(bT.some(c=>c.includes(t)||t.includes(c)))ov+=0.7;}
  return ov/Math.max(aT.length,bT.length);
};

const dimDist = (m,a,b,mat) => {
  const dw=Math.abs(Number(m?.ancho_cm||0)-Number(a||0));
  return mat==='ALUMINIO'?dw:dw+Math.abs(Number(m?.alto_cm||0)-Number(b||0));
};

const isCandidate = (m,a,b,mat) => {
  const mA=Number(m?.ancho_cm||0),mH=Number(m?.alto_cm||0),cA=Number(a||0),cH=Number(b||0);
  if(!(mA>=cA&&mA<=cA+MAX_DIM_GAP)) return false;
  return mat==='ALUMINIO'?true:mH>=cH&&mH<=cH+MAX_DIM_GAP;
};

const exactMatch = (m,a,b,mat) =>
  mat==='ALUMINIO'?isClose(m?.ancho_cm,a):isClose(m?.ancho_cm,a)&&isClose(m?.alto_cm,b);

const detectMat = (txt='') => String(txt||'').toUpperCase().includes('ALUMIN')?'ALUMINIO':'VIDRIO';

/* ─── MermaIcon ──────────────────────────────────────────────────────────── */
function MermaIcon({ checked }) {
  const panes = [
    { dx:9, dy:0, sel:false },
    { dx:6, dy:3, sel:true  },
    { dx:3, dy:6, sel:true  },
    { dx:0, dy:9, sel:false },
  ];
  const uid = checked ? 'c' : 'u';
  return (
    <div style={{ width:46,height:46,flexShrink:0,position:'relative',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ filter:'drop-shadow(0 4px 10px rgba(90,139,168,.22)) drop-shadow(0 1px 0 rgba(255,255,255,.8))' }}>
        <defs>
          <linearGradient id={`gn-${uid}`} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,.96)"/>
            <stop offset="50%" stopColor="rgba(225,242,250,.88)"/>
            <stop offset="100%" stopColor="rgba(195,228,244,.78)"/>
          </linearGradient>
          <linearGradient id={`gs-${uid}`} x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            {checked ? <>
              <stop offset="0%" stopColor="rgba(255,220,220,.95)"/>
              <stop offset="50%" stopColor="rgba(240,180,180,.85)"/>
              <stop offset="100%" stopColor="rgba(220,140,140,.75)"/>
            </> : <>
              <stop offset="0%" stopColor="rgba(200,236,252,.95)"/>
              <stop offset="50%" stopColor="rgba(160,214,240,.88)"/>
              <stop offset="100%" stopColor="rgba(128,194,220,.78)"/>
            </>}
          </linearGradient>
          <linearGradient id={`gr-${uid}`} x1="0" y1="0" x2="0" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,.65)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,.0)"/>
          </linearGradient>
        </defs>
        {panes.map((p,i) => {
          const x=4+p.dx, y=4+p.dy, w=28, h=28;
          const fill = p.sel?`url(#gs-${uid})`:`url(#gn-${uid})`;
          const stroke = p.sel?(checked?'rgba(148,25,24,.55)':'rgba(128,194,220,.70)'):'rgba(128,194,220,.38)';
          return (
            <g key={i}>
              <rect x={x+1} y={y+1} width={w} height={h} rx="4" fill="rgba(26,42,58,.07)"/>
              <rect x={x} y={y} width={w} height={h} rx="4" fill={fill} stroke={stroke} strokeWidth={p.sel?1.5:1.2}/>
              <rect x={x+1} y={y+1} width={w-2} height={10} rx="3" fill={`url(#gr-${uid})`}/>
              <line x1={x} y1={y+4} x2={x} y2={y+h-4} stroke="rgba(255,255,255,.80)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1={x+4} y1={y+h} x2={x+w-4} y2={y+h} stroke="rgba(90,139,168,.22)" strokeWidth=".8" strokeLinecap="round"/>
              {p.sel && checked && <path d={`M${x+10} ${y+14} L${x+13} ${y+17} L${x+18} ${y+11}`} stroke="#941918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".80"/>}
              {p.sel && !checked && <circle cx={x+14} cy={y+14} r="3" fill="rgba(128,194,220,.55)" stroke="rgba(128,194,220,.80)" strokeWidth=".8"/>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── MermaCard ──────────────────────────────────────────────────────────── */
function MermaCard({ merma, groupKey, checked, onSelect, isExact }) {
  const id    = String(merma.id_merma);
  const stock = Number(merma.cantidad||0);
  return (
    <div className={`rt-merma${checked?' sel':''}`}
      onClick={() => onSelect(groupKey, id)}
      style={{ padding:'13px 16px 13px 15px',display:'flex',alignItems:'center',gap:12 }}>
      <div className="rt-merma-shine"/>
      <MermaIcon checked={checked}/>
      <div className="rt-sel-wrap"><div className="rt-sel-inner"/></div>
      <input type="radio" name={`merma-${groupKey}`} checked={checked} onChange={()=>onSelect(groupKey,id)} style={{display:'none'}}/>
      <div style={{ flex:1,minWidth:0,position:'relative',zIndex:2 }}>
        <div style={{ display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:5 }}>
          <span style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:13.5,color:T.text }}>
            {merma.nombre || 'Sin nombre'}
          </span>
          {isExact && (
            <span style={{ fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:999,
              background:T.brandSoft,border:`1px solid ${T.borderMid}`,color:T.brand }}>
              Exacto
            </span>
          )}
        </div>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap',alignItems:'center' }}>
          <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,color:T.textLight }}>
            <IconRuler size={11} color={T.textDim}/>{merma.ancho_cm} × {merma.alto_cm} cm
          </span>
          <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,
            fontFamily:T.fontMono,padding:'2px 9px',borderRadius:999,
            background:T.brandSoft,border:`1px solid ${T.borderMid}`,color:T.brand }}>
            <IconStack2 size={11}/> {stock}
          </span>
          {merma.descripción && <span style={{ fontSize:11,color:T.textDim }}>{merma.descripción}</span>}
        </div>
      </div>
      {checked && (
        <div style={{ width:26,height:26,borderRadius:8,flexShrink:0,position:'relative',zIndex:2,
          background:`linear-gradient(135deg,${T.red},${T.redMid})`,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 4px 12px rgba(128,194,220,.45)' }}>
          <IconCheck size={14} color={T.white}/>
        </div>
      )}
    </div>
  );
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
function fmtFecha(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  } catch { return null; }
}

/* ─── CorteCard ──────────────────────────────────────────────────────────── */
function CorteCard({ row, idx, seleccion, onSelect, delay }) {
  const hasExact    = row.exactas?.length  > 0;
  const hasPossible = row.posibles?.length > 0;
  const hasAny      = hasExact || hasPossible;
  const noMedida    = !row.candidatas_medida;
  const fecha       = fmtFecha(row.fecha_registro);

  return (
    <div className="rt-corte" style={{ animationDelay:`${delay*55}ms` }}>
      <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)',pointerEvents:'none'}}/>
      <div style={{ padding:'13px 18px 11px',background:'rgba(255,255,255,.40)',
        borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',
        justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:30,height:30,borderRadius:9,flexShrink:0,background:T.brandSoft,
            border:`1.5px solid ${T.borderMid}`,display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:T.fontMono,fontWeight:800,fontSize:12,color:T.brand }}>
            {idx+1}
          </div>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:14,color:T.text }}>
                {row.producto_nombre}
              </span>
              {fecha && <span style={{ fontSize:10,fontWeight:600,fontFamily:T.fontMono,color:T.textDim,whiteSpace:'nowrap' }}>{fecha}</span>}
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:3,flexWrap:'wrap' }}>
              <span style={{ fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:999,
                background:T.brandSoft,border:`1px solid ${T.borderMid}`,color:T.brand,fontFamily:T.fontMono }}>
                {row.material}
              </span>
              <span style={{ display:'flex',alignItems:'center',gap:3,fontSize:11,color:T.textLight }}>
                <IconRuler size={10} color={T.textDim}/>{row.ancho_cm} × {row.alto_cm} cm
              </span>
              <span style={{ display:'flex',alignItems:'center',gap:3,fontSize:11,color:T.textLight }}>
                <IconPackage size={10} color={T.textDim}/>Cant: {row.cantidad}
              </span>
            </div>
          </div>
        </div>
        <span style={{ fontSize:11,fontWeight:600,padding:'4px 12px',borderRadius:999,
          background:T.brandSoft,border:`1px solid ${T.borderMid}`,color:T.brand,
          fontFamily:T.fontMono,whiteSpace:'nowrap' }}>
          {noMedida ? 'Sin medidas' : !hasAny ? 'Sin coincidencia' : hasExact ? 'Exacto' : 'Aproximado'}
        </span>
      </div>
      <div style={{ padding:'14px 18px 16px' }}>
        {(noMedida || !hasAny) ? (
          <div style={{ display:'flex',alignItems:'flex-start',gap:9,padding:'11px 14px',
            borderRadius:10,background:T.brandSoft,border:`1px solid ${T.borderMid}` }}>
            <IconAlertTriangle size={15} color={T.brandMid} style={{ flexShrink:0,marginTop:1 }}/>
            <span style={{ fontSize:12.5,color:T.textMid,lineHeight:1.55 }}>
              {noMedida
                ? `No hay mermas con medidas compatibles. Se aceptan piezas iguales o hasta ${MAX_DIM_GAP} cm mayores por lado.`
                : 'Hay mermas con medidas compatibles, pero no coinciden suficiente por nombre.'}
            </span>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {hasExact && (
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}>
                  <div style={{ width:3,height:14,borderRadius:2,background:T.red }}/>
                  <span style={{ fontSize:10,fontWeight:700,color:T.red,fontFamily:T.fontMono,letterSpacing:.6 }}>MEDIDA EXACTA</span>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {row.exactas.map(m => (
                    <MermaCard key={m.id_merma} merma={m} groupKey={row.key} isExact
                      checked={String(seleccion[row.key]||'')===String(m.id_merma)} onSelect={onSelect}/>
                  ))}
                </div>
              </div>
            )}
            {hasPossible && (
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}>
                  <div style={{ width:3,height:14,borderRadius:2,background:T.borderStr }}/>
                  <span style={{ fontSize:10,fontWeight:700,color:T.textMid,fontFamily:T.fontMono,letterSpacing:.6 }}>
                    DENTRO DEL RANGO (hasta {MAX_DIM_GAP} cm mayor)
                  </span>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {row.posibles.map(m => (
                    <MermaCard key={m.id_merma} merma={m} groupKey={row.key}
                      checked={String(seleccion[row.key]||'')===String(m.id_merma)} onSelect={onSelect}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
const Retazo = ({ notificacion, onToast, onGuardarSuccess, tipoNotificacion='ENTREGA', showHeader=true }) => {
  injectCSS();

  const [toasts,    setToasts]    = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [rows,      setRows]      = useState([]);
  const [seleccion, setSeleccion] = useState({});
  const [carritoId, setCarritoId] = useState('');

  const showToast = useCallback((mensaje, tipo = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    onToast?.(mensaje, tipo);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, [onToast]);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const notifId = useMemo(
    () => String(notificacion?.id || notificacion?.id_notificacion || '').trim(),
    [notificacion]
  );

  const handleGuardar = async () => {
    if (!notifId)     { showToast('No se encontró notificación asociada','error'); return; }
    if (!rows.length) {
      showToast('No hay cortes registrados. Continuando al siguiente paso','success');
      onGuardarSuccess?.();
      return;
    }
    const faltan = rows.filter(r=>(r.opciones?.length||0)>0 && !seleccion[r.key]);
    if (faltan.length) { showToast('Selecciona una merma para cada corte con opciones disponibles','error'); return; }
    setGuardando(true);
    try {
      const payload = rows.map(r => {
        const picked = (r.opciones||[]).find(m=>String(m.id_merma)===String(seleccion[r.key]));
        return { corte_id:r.id_corte,material:r.material,ancho_cm:r.ancho_cm,alto_cm:r.alto_cm,merma_id:picked?.id_merma||null };
      });
      try { localStorage.setItem(`retazo_seleccion_${notifId}`,JSON.stringify(payload)); } catch {}

      const mermasADescontar = rows.filter(r=>seleccion[r.key]).map(r=>({id:seleccion[r.key],cantidad:r.cantidad||1}));
      if (mermasADescontar.length) {
        await Promise.all(mermasADescontar.map(({id,cantidad})=>
          fetch(`/api/merma/${id}/descontar`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cantidad})}).catch(()=>null)
        ));
      }

      const cortesCubiertos = rows.filter(r=>seleccion[r.key]&&r.id_corte).map(r=>({id:r.id_corte,cantidad:r.cantidad||1}));
      if (cortesCubiertos.length) {
        await Promise.all(cortesCubiertos.map(({id,cantidad})=>
          fetch(`/api/cortes/${id}/descontar`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cantidad})}).catch(()=>null)
        ));
      }

      showToast('Retazos seleccionados correctamente','success');
      onGuardarSuccess?.();
    } catch { showToast('No se pudo registrar el retazo','error'); }
    finally { setGuardando(false); }
  };

  const onSelect = (key, id) => setSeleccion(prev=>({...prev,[key]:id}));

  const syncRowOptions = useCallback((currentRows, mermaPayload) => {
    const eventType = mermaPayload?.eventType;
    const oldRow = mermaPayload?.old || {};
    const newRow = mermaPayload?.new || {};
    const targetId = String(newRow?.id_merma || oldRow?.id_merma || '');
    if (!targetId) return currentRows;
    return currentRows.map((row) => {
      const baseMerma = { ...oldRow, ...newRow };
      const sinTargetExactas = (row.exactas || []).filter(item=>String(item?.id_merma)!==targetId);
      const sinTargetPosibles = (row.posibles || []).filter(item=>String(item?.id_merma)!==targetId);
      if (eventType==='DELETE'||Number(baseMerma?.cantidad||0)<=0) {
        return { ...row,exactas:sinTargetExactas,posibles:sinTargetPosibles,
          opciones:[...sinTargetExactas,...sinTargetPosibles],
          candidatas_medida:[...sinTargetExactas,...sinTargetPosibles].length };
      }
      const mismaCategoria = String(baseMerma?.id_categoria||'')===String(row?.categoria_id||'');
      const compatiblePorMedida = isCandidate(baseMerma,row.ancho_cm,row.alto_cm,row.material);
      if (!mismaCategoria||!compatiblePorMedida) {
        return { ...row,exactas:sinTargetExactas,posibles:sinTargetPosibles,
          opciones:[...sinTargetExactas,...sinTargetPosibles],
          candidatas_medida:[...sinTargetExactas,...sinTargetPosibles].length };
      }
      const mermaDecorada = { ...baseMerma,cantidad:Number(baseMerma?.cantidad||0),
        similarity:scoreSim(row.producto_nombre,baseMerma?.nombre||baseMerma?.descripción||''),
        distance:dimDist(baseMerma,row.ancho_cm,row.alto_cm,row.material) };
      let exactas=sinTargetExactas, posibles=sinTargetPosibles;
      if (exactMatch(mermaDecorada,row.ancho_cm,row.alto_cm,row.material)) {
        exactas=[...sinTargetExactas,mermaDecorada].sort((a,b)=>b.similarity-a.similarity||a.distance-b.distance);
      } else {
        posibles=[...sinTargetPosibles,mermaDecorada].sort((a,b)=>a.distance-b.distance||b.similarity-a.similarity);
      }
      return { ...row,exactas,posibles,opciones:[...exactas,...posibles],candidatas_medida:[...exactas,...posibles].length };
    });
  }, []);

  const syncRowsWithCorte = useCallback((currentRows, cortePayload) => {
    const eventType = cortePayload?.eventType;
    const oldRow = cortePayload?.old || {};
    const newRow = cortePayload?.new || {};
    const targetId = String(newRow?.id_corte || oldRow?.id_corte || '');
    if (!targetId) return currentRows;
    return currentRows.reduce((acc,row) => {
      if (String(row?.id_corte)!==targetId) { acc.push(row); return acc; }
      if (eventType==='DELETE') return acc;
      const cantidad = Number(newRow?.cantidad||0);
      if (cantidad<=0) return acc;
      acc.push({ ...row,cantidad,fecha_registro:newRow?.fecha_registro||row.fecha_registro });
      return acc;
    }, []);
  }, []);

  const loadRows = useCallback(async ({ silent=false }={}) => {
    if (!notifId) { setRows([]); setSeleccion({}); return; }
    if (!silent) setCargando(true);
    try {
      const [cortesRes,catsRes] = await Promise.all([
        fetch(`/api/cortes/notificacion/${notifId}`),
        fetch('/api/merma/categorias'),
      ]);
      const cortesJson = await cortesRes.json();
      const catsJson   = await catsRes.json();
      if (!cortesRes.ok||!cortesJson?.success)
        throw new Error(cortesJson?.error||cortesJson?.message||'No se pudieron obtener cortes');

      setCarritoId(String(cortesJson?.carrito_id||'').trim());

      // Snapshot base para el tab CORTES: mantener medidas/cantidades de apertura.
      try {
        const snapshotKey = `entrega_cortes_snapshot_${String(notifId || '').trim()}`;
        const existente = localStorage.getItem(snapshotKey);
        if (!existente) {
          localStorage.setItem(snapshotKey, JSON.stringify({
            notificacion_id: String(notifId || '').trim(),
            carrito_id: String(cortesJson?.carrito_id || '').trim(),
            productos: Array.isArray(cortesJson?.productos) ? cortesJson.productos : [],
            created_at: new Date().toISOString(),
            source: 'retazo-open',
          }));
        }
      } catch {}

      const cats       = Array.isArray(catsJson?.categorias)?catsJson.categorias:[];
      const catVidrio  = cats.find(c=>String(c?.descripcion||'').toUpperCase().includes('VIDRIO'))?.id_categoria||null;
      const catAluminio= cats.find(c=>String(c?.descripcion||'').toUpperCase().includes('ALUMIN'))?.id_categoria||null;

      const cache = {};
      await Promise.all([catVidrio,catAluminio].filter(Boolean).map(async cid=>{
        try { const r=await fetch(`/api/merma/categoria/${cid}`); const j=await r.json(); cache[cid]=Array.isArray(j?.data)?j.data:[]; }
        catch { cache[cid]=[]; }
      }));

      const flat = [];
      for (const p of (Array.isArray(cortesJson?.productos)?cortesJson.productos:[])) {
        const material = detectMat(p?.categoria||p?.producto_nombre||'');
        for (const c of (p?.cortes||[])) {
          const ancho=Number(c?.ancho_cm||0), alto=Number(c?.alto_cm||0);
          if (!ancho||(material!=='ALUMINIO'&&!alto)) continue;
          const cid    = material==='ALUMINIO'?catAluminio:catVidrio;
          const mCat   = cid?(cache[cid]||[]):[];
          const nombre = p?.producto_nombre||'';
          const cands  = mCat.filter(m=>isCandidate(m,ancho,alto,material));
          const enrich = cands.map(m=>({ ...m,
            similarity:scoreSim(nombre,m?.nombre||m?.descripción||''),
            distance:dimDist(m,ancho,alto,material) }));
          const exactas = enrich.filter(m=>exactMatch(m,ancho,alto,material))
            .sort((a,b)=>b.similarity-a.similarity||a.distance-b.distance);
          const exactIds = new Set(exactas.map(m=>String(m.id_merma)));
          const posibles = enrich.filter(m=>!exactIds.has(String(m.id_merma)))
            .sort((a,b)=>a.distance-b.distance||b.similarity-a.similarity);
          flat.push({
            key:`${c?.id_corte||p?.producto_id}-${ancho}-${alto}`,
            id_corte:c?.id_corte,
            producto_nombre:p?.producto_nombre||'Producto',
            material,categoria_id:cid,
            ancho_cm:ancho,alto_cm:alto,
            cantidad:Number(c?.cantidad||1),
            fecha_registro:c?.fecha_registro||null,
            candidatas_medida:cands.length,
            exactas,posibles,opciones:[...exactas,...posibles],
          });
        }
      }
      setRows(flat);
      try {
        const raw=localStorage.getItem(`retazo_seleccion_${notifId}`);
        if (raw) {
          const prev=JSON.parse(raw); const ns={};
          for (const r of flat) {
            const hit=Array.isArray(prev)?prev.find(x=>String(x?.corte_id)===String(r.id_corte)):null;
            if (hit?.merma_id) ns[r.key]=String(hit.merma_id);
          }
          setSeleccion(ns);
        } else setSeleccion({});
      } catch { setSeleccion({}); }
    } catch(e) {
      setRows([]); setSeleccion({});
      if (!silent) showToast(String(e?.message||'No se pudieron cargar retazos'),'error');
    } finally { if (!silent) setCargando(false); }
  }, [notifId]);

  useEffect(() => { loadRows(); }, [loadRows]);

  useEffect(() => {
    if (!notifId) return;
    const interval = setInterval(() => loadRows({ silent: true }), 10000);
    return () => clearInterval(interval);
  }, [notifId, loadRows]);

  return (
    <div style={{ fontFamily:T.fontBody }}>

      {/* ── Toasts ── */}
      <div className="rt-toast-wrap">
        {toasts.map(t => <ToastItem key={t.id} {...t} onClose={removeToast}/>)}
      </div>

      {showHeader && (
        <div style={{ marginBottom:16 }}>
          <h3 style={{ margin:0,fontFamily:T.fontHead,fontWeight:700,color:T.text,fontSize:18 }}>Retazo</h3>
          <p style={{ margin:'4px 0 0',color:T.textLight,fontSize:13 }}>
            Tipo: {tipoNotificacion} | Notificación: {notifId||'N/D'}
          </p>
        </div>
      )}

      {cargando && (
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'44px 0' }}>
          <div style={{ width:50,height:50,borderRadius:14,background:T.brandSoft,
            border:`1px solid ${T.borderMid}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <IconLoader size={22} color={T.brandMid} style={{ animation:'rtSpin .8s linear infinite' }}/>
          </div>
          <span style={{ fontSize:13,color:T.textLight,fontFamily:T.fontMono }}>Buscando mermas disponibles…</span>
        </div>
      )}

      {!cargando && !rows.length && (
        <div style={{ textAlign:'center',padding:'40px 0',color:T.textDim,
          border:`1.5px dashed ${T.border}`,borderRadius:14,background:T.brandSoft }}>
          <div style={{ fontWeight:600,color:T.textLight,fontSize:14 }}>Sin cortes registrados</div>
          <div style={{ fontSize:12,marginTop:4 }}>No se encontraron cortes para esta notificación.</div>
        </div>
      )}

      {!cargando && rows.length > 0 && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14 }}>
          {rows.map((r,idx) => (
            <CorteCard key={r.key} row={r} idx={idx}
              seleccion={seleccion} onSelect={onSelect} delay={idx}/>
          ))}
        </div>
      )}

      {!cargando && (
        <div style={{ marginTop:22,display:'flex',justifyContent:'center' }}>
          <button className="rt-save" onClick={handleGuardar} disabled={guardando}>
            {guardando
              ? <><IconLoader size={15} style={{ animation:'rtSpin .7s linear infinite' }}/> Guardando…</>
              : <><IconCheck size={15}/> Guardar</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default Retazo;