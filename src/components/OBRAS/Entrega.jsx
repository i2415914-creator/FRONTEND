import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft, IconBell, IconLogout,
  IconLayoutDashboard, IconScissors, IconBox, IconSettings,
  IconPower, IconPlayerPause, IconPlayerStop, IconRefresh, IconRuler,
  IconAlertTriangle, IconPlus, IconUpload, IconActivity, IconCpu, IconVideo,
} from '@tabler/icons-react';
import { FONTS } from '../../colors';
import BrandToast from '../UI/BrandToast';
import Retazo from './Retazo';
import Materiales from './Materiales';
import Productos from './Productos';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
@keyframes mesUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes mesPulse{0%,100%{opacity:1}50%{opacity:.45}}

.mes-root{display:flex;min-height:100vh;background:#f1f5f9;font-family:'Inter',sans-serif;color:#1e293b;overflow:hidden}

/* SIDEBAR */
.mes-sidebar{width:250px;min-width:250px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column}
.mes-logo{padding:18px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:10px}
.mes-logo-icon{width:36px;height:36px;background:#0d9488;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mes-logo-text{font-size:17px;font-weight:800;color:#0d9488;letter-spacing:1.5px}
.mes-logo-sub{font-size:10px;color:#94a3b8;letter-spacing:.5px}
.mes-nav{flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:2px}
.mes-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:#64748b;border:1px solid transparent;background:transparent;width:100%;text-align:left;transition:all .15s;font-family:'Inter',sans-serif}
.mes-nav-item:hover{background:#f1f5f9;color:#334155}
.mes-nav-item.active{background:rgba(13,148,136,.1);color:#0d9488;border-color:rgba(13,148,136,.25)}
.mes-nav-item.logout{color:#ef4444}
.mes-nav-item.logout:hover{background:rgba(239,68,68,.08)}
.mes-nav-spacer{flex:1}
.mes-sidebar-bottom{padding:10px 8px;border-top:1px solid #e2e8f0;display:flex;flex-direction:column;gap:7px}
.mes-status-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:9px 11px}
.mes-status-label{font-size:9px;color:#94a3b8;font-weight:700;letter-spacing:1px;margin-bottom:3px}
.mes-status-value{font-size:14px;font-weight:700;color:#1e293b}
.mes-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;margin-right:6px;animation:mesPulse 2s infinite}

/* MAIN */
.mes-main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
.mes-topbar{height:52px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 18px;flex-shrink:0}
.mes-topbar-title{font-size:14px;font-weight:700;color:#1e293b;letter-spacing:.3px}
.mes-topbar-right{display:flex;align-items:center;gap:10px}
.mes-operator{font-size:12px;color:#64748b}
.mes-notif-pill{background:rgba(13,148,136,.1);border:1px solid rgba(13,148,136,.25);color:#0d9488;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;display:flex;align-items:center;gap:5px}
.mes-back-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;background:transparent;border:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif}
.mes-back-btn:hover{background:#f1f5f9;color:#334155}

/* BODY */
.mes-body{flex:1;display:flex;overflow:hidden}

/* CENTER */
.mes-center{flex:1;min-width:0;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:12px;animation:mesUp .3s ease}
.mes-project-bar{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:11px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.mes-project-name{font-size:13px;font-weight:700;color:#1e293b}
.mes-project-meta{font-size:11px;color:#94a3b8;margin-top:2px}
.mes-badge{background:rgba(13,148,136,.1);border:1px solid rgba(13,148,136,.25);color:#0d9488;font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:.5px;flex-shrink:0}

.mes-split{display:grid;grid-template-columns:1fr 1fr;gap:12px;flex:1;min-height:0}
.mes-panel{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;min-height:0}
.mes-panel-head{padding:10px 14px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.mes-panel-title{font-size:10px;font-weight:700;color:#64748b;letter-spacing:1px}
.mes-panel-hint{font-size:10px;color:#94a3b8}
.mes-panel-body{flex:1;overflow-y:auto;padding:12px}

/* TABS */
.mes-tabs{display:flex;gap:4px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:4px;margin-bottom:12px}
.mes-tab{flex:1;padding:6px 8px;border-radius:6px;font-size:11px;font-weight:600;color:#64748b;background:transparent;border:1px solid transparent;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif}
.mes-tab:hover{color:#334155;background:#e2e8f0}
.mes-tab.active{color:#0d9488;background:rgba(13,148,136,.1);border-color:rgba(13,148,136,.25)}

/* GAUGE */
.mes-gauge-wrap{display:flex;flex-direction:column;align-items:center;padding:6px 0 10px}
.mes-gauge-label{font-size:11px;color:#64748b;margin-top:5px}

/* TABLE */
.mes-table{width:100%;border-collapse:collapse;font-size:12px}
.mes-table th{padding:6px 8px;text-align:left;color:#64748b;font-size:10px;font-weight:700;letter-spacing:.8px;border-bottom:1px solid #e2e8f0}
.mes-table td{padding:7px 8px;border-bottom:1px solid #f1f5f9;color:#475569}
.mes-table tr:last-child td{border-bottom:none}
.mes-table tr:hover td{background:rgba(13,148,136,.05);color:#1e293b}
.mes-table-actions{display:flex;gap:8px;margin-top:12px}
.mes-tbl-btn{flex:1;padding:8px 10px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;justify-content:center;font-family:'Inter',sans-serif;transition:all .15s}
.mes-tbl-btn:hover{transform:translateY(-1px);filter:brightness(1.05)}
.mes-tbl-btn.primary{background:rgba(13,148,136,.1);border:1px solid rgba(13,148,136,.25);color:#0d9488}
.mes-tbl-btn.secondary{background:transparent;border:1px solid #e2e8f0;color:#64748b}

/* RIGHT */
.mes-right{width:155px;min-width:155px;background:#fff;border-left:1px solid #e2e8f0;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px}
.mes-widget{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
.mes-widget-head{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.8px;display:flex;align-items:center;justify-content:space-between}
.mes-widget-body{padding:12px}

/* FEED */
.mes-feed{width:100%;aspect-ratio:16/9;background:#000;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.mes-feed-overlay{position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.65);color:#22c55e;font-size:10px;font-weight:600;padding:3px 8px;border-radius:4px;display:flex;align-items:center;gap:4px}

/* PROGRESS */
.mes-progress-track{height:7px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin:5px 0}
.mes-progress-fill{height:100%;background:linear-gradient(90deg,#0d9488,#14b8a6);border-radius:999px}

/* CTRL BUTTONS */
.mes-ctrl-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.mes-ctrl-btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:9px 8px;border-radius:8px;font-size:11px;font-weight:700;border:none;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;letter-spacing:.3px}
.mes-ctrl-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.mes-ctrl-btn:active{transform:scale(.97)}
.mes-ctrl-btn.start{background:#14532d;color:#22c55e;border:1px solid rgba(34,197,94,.25)}
.mes-ctrl-btn.pause{background:#78350f;color:#f59e0b;border:1px solid rgba(245,158,11,.25)}
.mes-ctrl-btn.stop {background:#7f1d1d;color:#f87171;border:1px solid rgba(248,113,113,.25)}
.mes-ctrl-btn.reset{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0}
/* vertical icon+label buttons — single column */
.mes-ctrl-btn-v{display:flex;flex-direction:row;align-items:center;gap:6px;padding:8px 10px;width:100%;border-radius:8px;font-size:10px;font-weight:800;border:none;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;letter-spacing:.3px;line-height:1}
.mes-ctrl-btn-v:hover{filter:brightness(1.08);transform:translateY(-1px)}
.mes-ctrl-btn-v:active{transform:scale(.97)}
.mes-ctrl-btn-v.start{background:#14532d;color:#22c55e;border:1px solid rgba(34,197,94,.25)}
.mes-ctrl-btn-v.pause{background:#78350f;color:#f59e0b;border:1px solid rgba(245,158,11,.25)}
.mes-ctrl-btn-v.stop{background:#7f1d1d;color:#f87171;border:1px solid rgba(248,113,113,.25)}
.mes-ctrl-btn-v.reset{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0}

/* STATS CARD — single column vertical */
.mes-stats-grid{display:flex;flex-direction:column;gap:5px;padding:8px}
.mes-stat-item{display:flex;flex-direction:row;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:9px}
.mes-stat-num{font-size:15px;font-weight:800;line-height:1;font-family:'IBM Plex Mono',monospace}
.mes-stat-lbl{font-size:10px;color:#64748b;font-weight:600;letter-spacing:.03em}

/* ALERT */
.mes-alert-ok{display:flex;align-items:center;gap:8px;color:#16a34a;font-size:12px;font-weight:600;padding:8px 10px;background:rgba(22,163,74,.07);border:1px solid rgba(22,163,74,.2);border-radius:8px}

@media(max-width:1100px){.mes-split{grid-template-columns:1fr}}
@media(max-width:960px){
  .mes-sidebar{width:52px;min-width:52px}
  .mes-logo-text,.mes-logo-sub,.mes-nav-item span,.mes-sidebar-bottom{display:none}
  .mes-nav-item{justify-content:center;padding:10px}
  .mes-right{display:none}
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

const ENTREGA_TAB_KEY = 'obras_entrega_active_tab';

/* ── NestingSVG ── */
const NestingSVG = () => (
  <svg width="100%" viewBox="-45 -50 1290 1000" style={{ display: 'block' }}>
    {/* Sheet */}
    <rect x={0} y={0} width={1200} height={900} fill="#0a1628" stroke="#334155" strokeWidth={2}/>

    {/* Cuts */}
    {[
      { id:'A1', x:0,   y:0,   w:300, h:500, c:'#0d9488' },
      { id:'A2', x:300, y:0,   w:500, h:500, c:'#0ea5e9' },
      { id:'B3', x:800, y:0,   w:400, h:300, c:'#8b5cf6' },
      { id:'B2', x:0,   y:500, w:500, h:400, c:'#0ea5e9' },
      { id:'B4', x:500, y:500, w:300, h:400, c:'#f59e0b' },
      { id:'B1', x:800, y:300, w:400, h:600, c:'#ec4899' },
    ].map(c => (
      <g key={c.id}>
        <rect x={c.x+2} y={c.y+2} width={c.w-4} height={c.h-4}
          fill={c.c+'1a'} stroke={c.c} strokeWidth={1.5}/>
        <text x={c.x+c.w/2} y={c.y+c.h/2-10} textAnchor="middle" dominantBaseline="middle"
          fill={c.c} fontSize={20} fontWeight={700} fontFamily="Inter,sans-serif">{c.id}</text>
        <text x={c.x+c.w/2} y={c.y+c.h/2+14} textAnchor="middle"
          fill={c.c+'99'} fontSize={12} fontFamily="Inter,sans-serif">{c.w}×{c.h}</text>
      </g>
    ))}

    {/* Retazo area */}
    <rect x={800} y={0} width={400} height={300} fill="none"/>

    {/* Top dimension arrows */}
    {[[0,300,'300'],[300,800,'500'],[800,1200,'400']].map(([x1,x2,lbl],i) => (
      <g key={i}>
        <line x1={x1} y1={-22} x2={x2} y2={-22} stroke="#475569" strokeWidth={1}/>
        <line x1={x1} y1={-28} x2={x1} y2={-16} stroke="#475569" strokeWidth={1}/>
        <line x1={x2} y1={-28} x2={x2} y2={-16} stroke="#475569" strokeWidth={1}/>
        <text x={(x1+x2)/2} y={-30} textAnchor="middle" fill="#64748b" fontSize={11} fontFamily="Inter,sans-serif">{lbl}</text>
      </g>
    ))}
    <line x1={0} y1={-42} x2={1200} y2={-42} stroke="#334155" strokeWidth={1} strokeDasharray="5,3"/>
    <text x={600} y={-48} textAnchor="middle" fill="#475569" fontSize={13} fontWeight={700} fontFamily="Inter,sans-serif">1200</text>

    {/* Right dimension arrows */}
    {[[0,500,'500'],[500,900,'400']].map(([y1,y2,lbl],i) => (
      <g key={i}>
        <line x1={1218} y1={y1} x2={1218} y2={y2} stroke="#475569" strokeWidth={1}/>
        <line x1={1212} y1={y1} x2={1224} y2={y1} stroke="#475569" strokeWidth={1}/>
        <line x1={1212} y1={y2} x2={1224} y2={y2} stroke="#475569" strokeWidth={1}/>
        <text x={1232} y={(y1+y2)/2} dominantBaseline="middle" fill="#64748b" fontSize={11} fontFamily="Inter,sans-serif">{lbl}</text>
      </g>
    ))}
    <line x1={1238} y1={0} x2={1238} y2={900} stroke="#334155" strokeWidth={1} strokeDasharray="5,3"/>
    <text x={1242} y={450} dominantBaseline="middle" fill="#475569" fontSize={13} fontWeight={700} fontFamily="Inter,sans-serif">900</text>
  </svg>
);

/* ── MiniGauge ── */
const MiniGauge = ({ pct = 0, color = '#0d9488', label = '' }) => {
  const r = 14, cx = 18, cy = 18, circ = 2 * Math.PI * r;
  const v = Math.min(Math.max(pct, 0), 100);
  const dash = (v / 100) * circ;
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" style={{flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={3}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}/>
      <text x={cx} y={cy+0.5} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={6.5} fontWeight={800} fontFamily="'IBM Plex Mono',monospace">{v}%</text>
    </svg>
  );
};

/* ── CircularGauge ── */
const CircularGauge = ({ pct = 33 }) => {
  const r = 44, cx = 56, cy = 56, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={112} height={112} viewBox="0 0 112 112">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={9}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0d9488" strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}/>
      <text x={cx} y={cy-7} textAnchor="middle" fill="#f1f5f9" fontSize={16} fontWeight={800} fontFamily="Inter,sans-serif">{pct}%</text>
      <text x={cx} y={cx+10} textAnchor="middle" fill="#475569" fontSize={10} fontFamily="Inter,sans-serif">15/45</text>
    </svg>
  );
};

const DEMO_CUTS = [
  { id:'A1', mat:'Claro 6mm',  proc:'Cortado',  est:'En Espera' },
  { id:'A2', mat:'Claro 6mm',  proc:'Pulido',   est:'En Espera' },
  { id:'B1', mat:'Bronce 4mm', proc:'Biselado', est:'En Espera' },
  { id:'B2', mat:'Claro 6mm',  proc:'Pulido',   est:'En Espera' },
  { id:'B3', mat:'Claro 8mm',  proc:'Cortado',  est:'En Espera' },
];
const EST_COLOR = { 'Completado':'#22c55e', 'En Proceso':'#f59e0b', 'En Espera':'#475569' };

const NAV = [
  { id:'dash',  label:'Tablero Principal',       Icon:IconLayoutDashboard },
  { id:'opt',   label:'Mis Optimizaciones',       Icon:IconScissors, active:true },
  { id:'inv',   label:'Inventario de Materiales', Icon:IconBox },
  { id:'mach',  label:'Control de Máquina',       Icon:IconCpu },
  { id:'conf',  label:'Configuración',            Icon:IconSettings },
];

const EntregaPedido = ({ notificacion, onBack }) => {
  injectCSS();
  const navigate = useNavigate();

  const productosActionsRef = useRef(null);
  const [vistaDiseno, setVistaDiseno] = useState('VIDRIO');
  const [eficienciaPlancha, setEficienciaPlancha] = useState(0);
  const [annotMode, setAnnotMode] = useState(0);
  const ANNOT_LABELS = ['TODO','300','235.9','130'];
  const cycleAnnot = () => setAnnotMode(m => (m+1)%4);
  const [selectedLbl, setSelectedLbl] = useState(null);
  const [pendingDim, setPendingDim] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Fetch cortes reales ── */
  const [cortesData, setCortesData] = useState(DEMO_CUTS);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const id = notificacion?.id || notificacion?.id_notificacion;
    if (!id) return;
    let cancelled = false;
    setCargando(true);
    fetch(`/api/cortes/notificacion/${id}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.success && Array.isArray(data.productos)) {
          const filas = data.productos.flatMap((p, pi) => {
            let cnt = 0;
            return (p.cortes || []).flatMap((c) =>
              Array.from({ length: Math.max(1, Number(c.cantidad || 1)) }, () => ({
                id: `${String.fromCharCode(65 + pi)}${++cnt}`,
                mat: p.producto_nombre || c.tipo_vidrio || 'Material',
                proc: c.tratamiento || 'Cortado',
                est: 'En Espera',
                dim: (c.ancho_cm || c.ancho) && (c.alto_cm || c.alto)
                  ? `${c.ancho_cm || c.ancho}×${c.alto_cm || c.alto}` : '—',
              }))
            );
          });
          if (filas.length > 0) setCortesData(filas);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [notificacion?.id, notificacion?.id_notificacion]);

  const completados = cortesData.filter(c => c.est === 'Completado').length;
  const totalCortes = cortesData.length;
  const pct = eficienciaPlancha;

  const notifId = useMemo(
    () => String(notificacion?.id || notificacion?.id_notificacion || notificacion?.carrito_id || '').trim(),
    [notificacion]
  );

  const [fechaEntrega, setFechaEntrega] = useState('');
  const fechaFallback = useMemo(() => (
    notificacion?.fecha || notificacion?.created_at || notificacion?.fecha_registro || notificacion?.updated_at || new Date().toISOString()
  ), [notificacion]);

  const formatFecha = useCallback((iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d)) return '';
      const parts = new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima', day:'2-digit', month:'2-digit', year:'numeric',
      }).formatToParts(d);
      const get = t => (parts.find(p => p.type === t) || {}).value || '00';
      return `${get('day')}/${get('month')}/${get('year')}`;
    } catch { return ''; }
  }, []);

  useEffect(() => {
    if (!notifId) return;
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`/api/cortes/notificacion/${notifId}`);
        const json = await res.json();
        if (cancelled) return;
        const fechas = [];
        for (const p of (json?.productos || []))
          for (const c of (p?.cortes || []))
            if (c?.fecha_registro) fechas.push(c.fecha_registro);
        if (fechas.length) {
          fechas.sort((a,b) => new Date(a) - new Date(b));
          setFechaEntrega(formatFecha(fechas[0]));
        } else {
          setFechaEntrega(formatFecha(fechaFallback));
        }
      } catch { if (!cancelled) setFechaEntrega(formatFecha(fechaFallback)); }
    })();
    return () => { cancelled = true; };
  }, [notifId, formatFecha, fechaFallback]);

  const [activeTab, setActiveTab] = useState('RETAZOS');

  useEffect(() => {
    if (!notifId) { setActiveTab('RETAZOS'); return; }
    try {
      const raw = sessionStorage.getItem(ENTREGA_TAB_KEY);
      if (!raw) { setActiveTab('RETAZOS'); return; }
      const parsed = JSON.parse(raw);
      if (parsed?.tab && String(parsed?.notifId || '') === String(notifId)) {
        setActiveTab(parsed.tab); return;
      }
    } catch {}
    setActiveTab('RETAZOS');
  }, [notifId]);

  useEffect(() => {
    if (!notifId) return;
    try { sessionStorage.setItem(ENTREGA_TAB_KEY, JSON.stringify({ notifId, tab: activeTab })); } catch {}
  }, [notifId, activeTab]);

  const operatorName = useMemo(() => {
    try { return localStorage.getItem('staff') || 'Operador'; } catch { return 'Operador'; }
  }, []);

  const handleLogout = useCallback(() => {
    try { sessionStorage.removeItem('obras_vista_entrega'); sessionStorage.removeItem(ENTREGA_TAB_KEY); } catch {}
    ['personalToken','auth_token','cliente_id','cliente_correo','staff','area'].forEach(k => localStorage.removeItem(k));
    const STAFF_PATHS = new Set(['/almacen','/administracion','/obras','/operaciones','/personal']);
    try {
      const raw = localStorage.getItem('breadcrumb_history');
      const hist = raw ? JSON.parse(raw) : [];
      localStorage.setItem('breadcrumb_history', JSON.stringify(hist.filter(b => !STAFF_PATHS.has(b.path))));
    } catch {}
    navigate('/personal', { replace: true });
  }, [navigate]);

  return (
    <div className="mes-root">
      <BrandToast toast={toast} onClose={() => setToast(null)}/>

      {/* ── MAIN ── */}
      <div className="mes-main">

        {/* TOP BAR */}
        <div className="mes-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="mes-back-btn" onClick={onBack}>
              <IconArrowLeft size={13}/> Atrás
            </button>
            <div>
              <div className="mes-topbar-title">{notificacion?.tipo_trabajo || 'Corte de Vidrio Optimizado'}</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>
                Cliente: {notificacion?.nombre || '—'} · Fecha: {fechaEntrega || formatFecha(fechaFallback)}
              </div>
            </div>
          </div>
          <div className="mes-topbar-right">
            <span className="mes-operator">Operador: {operatorName}</span>
            <div className="mes-notif-pill">
              <IconActivity size={11}/> EN PROCESO
            </div>
            <button style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center' }}>
              <IconBell size={17} stroke={1.5}/>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="mes-body">

          {/* CENTER */}
          <div className="mes-center">

            {/* 2-col split */}
            <div className="mes-split">

              {/* Panel A: Optimización real */}
              <div className="mes-panel">
                <div className="mes-panel-head">
                  <span className="mes-panel-title">DISEÑO VISUAL — OPTIMIZACIÓN</span>
                  <span className="mes-panel-hint">Vidrios · Aluminios</span>
                </div>
                <div className="mes-panel-body" style={{ padding: 0, overflow:'hidden', background:'#fff' }}>
                  <Productos notificacion={notificacion} onToast={showToast}
                    showHeader={false} tipoNotificacion="ENTREGA"
                    onFinalizarEntrega={onBack} actionsRef={productosActionsRef}
                    vistaDiseno={vistaDiseno} onEficienciaChange={setEficienciaPlancha}
                    annotMode={annotMode} highlightLabel={selectedLbl}
                    onCortePendienteChange={setPendingDim}
                    onCortesChange={setCortesData}/>
                </div>
              </div>

              {/* Panel B: Tabs + content */}
              <div className="mes-panel">
                <div className="mes-panel-head">
                  <span className="mes-panel-title">SECCIÓN DE TRABAJO</span>
                  <span className="mes-panel-hint">Cortes completados 15/45</span>
                </div>
                <div className="mes-panel-body">
                  <div className="mes-tabs">
                    {['RETAZOS','PRODUCTOS','CORTES'].map(t => (
                      <button key={t} className={`mes-tab${activeTab===t?' active':''}`}
                        onClick={() => setActiveTab(t)}>{t}</button>
                    ))}
                  </div>

                  {activeTab === 'RETAZOS' && (
                    <Retazo showHeader={false} onToast={showToast}
                      notificacion={notificacion}
                      onGuardarSuccess={() => setActiveTab('PRODUCTOS')}
                      tipoNotificacion="ENTREGA"/>
                  )}
                  {activeTab === 'PRODUCTOS' && (
                    <Materiales onToast={showToast} notificacion={notificacion}
                      onGuardarSuccess={() => setActiveTab('CORTES')}
                      tipoNotificacion="ENTREGA"/>
                  )}
                  {activeTab === 'CORTES' && (
                    <>
                      <table className="mes-table">
                        <thead>
                          <tr>
                            <th>ID</th><th>MEDIDAS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cortesData.map(c => {
                            const isPending = pendingDim && c.dim === pendingDim;
                            return (
                            <tr key={c.id}
                              onClick={() => setSelectedLbl(sel => sel===c.id ? null : c.id)}
                              style={{ cursor:'pointer', background: isPending ? 'rgba(246,173,85,0.18)' : selectedLbl===c.id ? 'rgba(251,191,36,0.12)' : undefined }}>
                              <td style={{ fontWeight:700, color: isPending ? '#f59e0b' : selectedLbl===c.id ? '#f59e0b' : '#475569' }}>{c.id}</td>
                              <td style={{ fontFamily:'monospace', color: isPending ? '#f59e0b' : '#0d9488', fontWeight:600 }}>{c.dim || '—'}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="mes-table-actions">
                        <button className="mes-tbl-btn primary"><IconPlus size={12}/> Añadir Pieza Manualmente</button>
                        <button className="mes-tbl-btn secondary"><IconUpload size={12}/> Importar CSV</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="mes-right">

            {/* Estadísticas de Plancha */}
            <div className="mes-widget">
              <div className="mes-widget-head"><span>ESTADÍSTICAS DE PLANCHA</span></div>
              <div className="mes-stats-grid">
                <div className="mes-stat-item">
                  <MiniGauge pct={pct} color={pct>=85?'#16a34a':pct>=70?'#d97706':'#dc2626'}/>
                  <div className="mes-stat-lbl">Uso Plancha</div>
                </div>
                <div className="mes-stat-item">
                  <MiniGauge pct={Math.max(0,100-pct)} color="#64748b"/>
                  <div className="mes-stat-lbl">Retazos</div>
                </div>
                <div className="mes-stat-item">
                  <div style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,background:'#134e4a',flexShrink:0}}>
                    <span style={{fontSize:13,fontWeight:800,color:'#0d9488'}}>{totalCortes}</span>
                  </div>
                  <div className="mes-stat-lbl">Cortes</div>
                </div>
              </div>
            </div>

            {/* Machine controls */}
            <div className="mes-widget">
              <div className="mes-widget-head">CONTROLES DE MÁQUINA</div>
              <div className="mes-widget-body">
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  <button className="mes-ctrl-btn-v start"
                    onClick={() => { setVistaDiseno('VIDRIO'); productosActionsRef.current?.optimizarVidrio(); }}>
                    <IconPower size={14}/><span>OPTIMIZAR</span>
                  </button>
                  <button className="mes-ctrl-btn-v pause"
                    onClick={() => { setVistaDiseno('ALUMINIO'); productosActionsRef.current?.optimizarAluminio(); }}>
                    <IconPlayerPause size={14}/><span>ALUMINIO</span>
                  </button>
                  <button className="mes-ctrl-btn-v stop"
                    onClick={() => productosActionsRef.current?.descargarPdfVidrio()}>
                    <IconPlayerStop size={14}/><span>PDF</span>
                  </button>
                  <button className="mes-ctrl-btn-v reset" onClick={cycleAnnot}>
                    <IconRuler size={14}/><span>MEDIDA: {ANNOT_LABELS[annotMode]}</span>
                  </button>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
};

export default EntregaPedido;
