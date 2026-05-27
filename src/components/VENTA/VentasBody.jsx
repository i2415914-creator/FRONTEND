import React, { useState, useEffect } from "react";
import ServicioPanel from "./Servicio";
import CotizacionView from "./CotizacionProductos";
import CuadreCaja from "./CuadreCaja";
import { FONTS } from "../../colors";
import {
  IconLogout, IconShoppingCart, IconTool, IconReportMoney,
  IconBell, IconRefresh, IconUser,
} from "@tabler/icons-react";

const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.vidriobras.com').replace(/\/$/, '');

/* ─── TOKENS (idénticos a Obras) ─────────────────────────────────────────── */
const T = {
  bgPage:     'linear-gradient(145deg,#dff0f8 0%,#eaf5fb 40%,#f4f9fd 100%)',
  bgNoise:    'radial-gradient(ellipse 90% 60% at 60% -10%,rgba(128,194,220,.22) 0%,transparent 65%)',
  bgNoise2:   'radial-gradient(ellipse 60% 40% at 10% 90%,rgba(128,194,220,.14) 0%,transparent 60%)',
  glassBg:    'rgba(255,255,255,.62)',
  glassBgMid: 'rgba(255,255,255,.78)',
  glassBlur:  'blur(20px)',
  glassSat:   'saturate(180%)',
  border:     'rgba(128,194,220,.22)',
  borderMid:  'rgba(128,194,220,.38)',
  borderStr:  'rgba(128,194,220,.58)',
  brand:      '#5a8ba8',
  brandMid:   '#80C2DC',
  brandSoft:  'rgba(128,194,220,.12)',
  red:        '#941918',
  redSoft:    'rgba(148,25,24,.08)',
  redBorder:  'rgba(148,25,24,.25)',
  text:       '#1a2a3a',
  textMid:    '#2d4a62',
  textLight:  '#5a7a90',
  textDim:    '#8aa8bc',
  white:      '#ffffff',
  fontHead:   FONTS.heading,
  fontBody:   FONTS.body,
  fontMono:   "'IBM Plex Mono',monospace",
  shadowCard: '0 8px 32px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset',
};

const gcM = {
  background:     T.glassBgMid,
  backdropFilter: `${T.glassBlur} ${T.glassSat}`,
  WebkitBackdropFilter: `${T.glassBlur} ${T.glassSat}`,
  border:         `1px solid ${T.borderMid}`,
  boxShadow:      T.shadowCard,
};

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.78)}}

/* ── Fondo ── */
.vb-root{font-family:${T.fontBody};color:${T.text};min-height:100vh;position:relative;}
.vb-bg{position:fixed;inset:0;background:${T.bgPage};z-index:0}
.vb-bg::before{content:'';position:absolute;inset:0;background:${T.bgNoise}}
.vb-bg::after{content:'';position:absolute;inset:0;background:${T.bgNoise2}}
.vb-deco1{position:fixed;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(128,194,220,.18) 0%,transparent 70%);top:-100px;right:-80px;pointer-events:none;z-index:0}
.vb-deco2{position:fixed;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(128,194,220,.12) 0%,transparent 70%);bottom:-60px;left:60px;pointer-events:none;z-index:0}
.vb-inner{position:relative;z-index:1;padding:48px 28px 24px;}

/* ── Header ── */
.vb-header{display:flex;align-items:center;margin-bottom:26px;animation:fadeUp .35s ease;gap:10px;justify-content:space-between}
.vb-header-main{display:flex;align-items:center;gap:10px;min-width:0}
.vb-header-actions{display:flex;align-items:center;gap:8px;}

/* ── Botón genérico (igual que Obras btn-p) ── */
.vb-btn{transition:all .16s cubic-bezier(.4,0,.2,1);display:inline-flex;align-items:center;gap:5px;}
.vb-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(90,139,168,.22)}
.vb-btn:active{transform:translateY(0) scale(.97)}

/* ── Tabs dentro del card (estilo Entrega) ── */
.vb-tabs{
  display:flex;gap:0;padding:10px 12px;
  background:linear-gradient(90deg,rgba(245,234,234,.70),rgba(248,238,238,.55));
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid rgba(148,25,24,.12);
}
.vb-tab{
  flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
  padding:11px 20px;border-radius:10px;
  font-family:${T.fontHead};font-size:13px;font-weight:700;
  letter-spacing:.8px;text-transform:uppercase;
  border:none;cursor:pointer;
  color:rgba(148,25,24,.50);background:transparent;
  transition:all .20s cubic-bezier(.4,0,.2,1);
}
.vb-tab:hover{color:rgba(148,25,24,.75);background:rgba(255,255,255,.35);}
.vb-tab.active{
  background:linear-gradient(160deg,rgba(255,255,255,.92),rgba(252,240,240,.85));
  color:#941918;
  box-shadow:0 3px 14px rgba(148,25,24,.12),0 1px 0 rgba(255,255,255,.95) inset;
  border:1.5px solid rgba(148,25,24,.18);
}

/* ── Contenido ── */
.vb-content{padding:28px;animation:fadeUp .3s ease both;}

/* ── Chip usuario ── */
.vb-user-chip{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 13px;border-radius:999px;
  background:${T.brandSoft};border:1px solid ${T.borderMid};
  font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;
  color:${T.brand};white-space:nowrap;
}

@media (max-width:640px){
  .vb-inner{padding:24px 12px 16px !important}
  .vb-header{flex-wrap:wrap;gap:8px}
  .vb-header-actions{flex-wrap:wrap}
  .vb-tabs{flex-wrap:wrap}
  .vb-content{padding:18px !important}
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

/* ─── TABS CONFIG ─────────────────────────────────────────────────────────── */
const TABS = [
  { key: 'productos', label: 'Venta',   Icon: IconShoppingCart },
  { key: 'servicio',  label: 'Servicio', Icon: IconTool         },
  { key: 'cuadre',    label: 'Caja',     Icon: IconReportMoney  },
];

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
const VentasBody = () => {
  injectCSS();

  const [tab,            setTab]            = useState('productos');
  const [nombrePersonal, setNombrePersonal] = useState('');
  const [servicios,      setServicios]      = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/servicios`)
      .then(r => r.json())
      .then(d => { if (d.ok) setServicios(d.data); })
      .catch(() => setServicios([]));
  }, []);

  useEffect(() => {
    const fetchNombre = async () => {
      try {
        const token = localStorage.getItem('personalToken');
        if (!token) return;
        const res  = await fetch('/api/personal/nombre', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setNombrePersonal(data.success && data.nombre ? data.nombre : 'Personal');
      } catch { setNombrePersonal('Personal'); }
    };
    fetchNombre();
  }, []);

  return (
    <div style={{
      fontFamily: T.fontBody, color: T.text, minHeight: '100vh',
      background: 'linear-gradient(145deg,#dff0f8 0%,#eaf5fb 40%,#f4f9fd 100%)',
    }}>

      {/* ── HEADER: separado del navbar con padding top ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '36px 28px 16px', gap: 10,
      }}>

        {/* Ícono + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg,#80C2DC 0%,#5a8ba8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 22px rgba(128,194,220,.44),inset 0 1px 0 rgba(255,255,255,.4)',
            border: '1px solid rgba(255,255,255,.4)',
          }}>
            <IconReportMoney stroke={1} size={22} color="#fff"/>
          </div>
          <div>
            <h1 style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: 22,
              color: T.text, letterSpacing: .3, lineHeight: 1, margin: 0 }}>
              Panel de Ventas
            </h1>
            <p style={{ fontSize: 11, color: T.textDim, fontFamily: T.fontMono,
              fontWeight: 400, marginTop: 3, marginBottom: 0 }}>
              Cotizaciones, servicios &amp; caja
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconUser size={22} color={T.textLight}/>
          <button onClick={() => {
              localStorage.removeItem('personalToken');
              window.location.reload();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 11, cursor: 'pointer',
              background: T.redSoft, border: `1.5px solid ${T.redBorder}`,
              color: T.red, fontSize: 13, fontWeight: 700, fontFamily: T.fontBody,
              transition: 'all .16s' }}>
            <IconLogout stroke={1} size={14}/> Salir
          </button>
        </div>
      </div>

      {/* ── Padding lateral para tabs y contenido ── */}
      <div style={{ padding: '0 28px 28px' }}>

        {/* ── Tabs ── */}
        <div className="vb-tabs" style={{ borderRadius: 14, marginBottom: 20 }}>
          {TABS.map(({ key, label, Icon }) => (
            <button key={key}
              className={`vb-tab${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}>
              <Icon size={13}/> {label}
            </button>
          ))}
        </div>

        {/* ── Contenido ── */}
        <div key={tab}>
          {tab === 'productos' && <CotizacionView />}
          {tab === 'servicio'  && <ServicioPanel servicios={servicios} />}
          {tab === 'cuadre'    && <CuadreCaja />}
        </div>

      </div>
    </div>
  );
};

export default VentasBody;