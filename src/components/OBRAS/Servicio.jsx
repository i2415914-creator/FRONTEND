import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconBell, IconLogout, IconTool, IconReceipt, IconLayoutGrid, IconStack2, IconChalkboardTeacher, IconCircleCheck, IconRuler2 } from '@tabler/icons-react';
import { FONTS } from '../../colors';
import BrandToast from '../UI/BrandToast';
import Remetro from './Remetro';
import RetazoServicio from './RetazoServicio';
import ProductosServicio from './ProductosServicio';
import Instalacion from './Instalacion';
import DisenoServicio from './DisenoServicio';
import ModalFacturacion from '../VENTA/ModalFacturacion';

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
  brandLight: '#a8d9ed',
  brandSoft:  'rgba(128,194,220,.12)',
  red:        '#941918',
  redMid:     '#b2413f',
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
  shadow:     '0 8px 32px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset',
};

const gc = {
  background: T.glassBg,
  backdropFilter: `${T.glassBlur} ${T.glassSat}`,
  WebkitBackdropFilter: `${T.glassBlur} ${T.glassSat}`,
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow,
};

const gcM = {
  background: T.glassBgMid,
  backdropFilter: `${T.glassBlur} ${T.glassSat}`,
  WebkitBackdropFilter: `${T.glassBlur} ${T.glassSat}`,
  border: `1px solid ${T.borderMid}`,
  boxShadow: T.shadow,
};

const SERVICIO_TAB_KEY = 'obras_servicio_active_tab';
const SERVICIO_TRACKING_KEY = 'obras_servicio_tracking';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box}
@keyframes svUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes svSheen{0%{transform:translateX(-120%) skewX(-16deg);opacity:0}15%{opacity:.5}100%{transform:translateX(260%) skewX(-16deg);opacity:0}}

.sv-root{min-height:100vh;font-family:${T.fontBody};color:${T.text};padding-top:0;position:relative}
.sv-bg{position:fixed;inset:0;background:${T.bgPage};z-index:0}
.sv-bg::before{content:'';position:absolute;inset:0;background:${T.bgNoise}}
.sv-bg::after {content:'';position:absolute;inset:0;background:${T.bgNoise2}}
.sv-inner{position:relative;z-index:1;padding:48px 28px 40px}

.sv-btn{transition:all .16s cubic-bezier(.4,0,.2,1);cursor:pointer}
.sv-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(90,139,168,.22)}
.sv-btn:active{transform:translateY(0) scale(.97)}

.sv-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:26px;animation:svUp .35s ease}
.sv-header-main{display:flex;align-items:center;gap:10px;min-width:0}
.sv-header-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.sv-title{font-family:${T.fontHead};font-weight:700;font-size:22px;color:${T.text};letter-spacing:.3px;line-height:1}
.sv-subtitle{font-size:11px;color:${T.textDim};font-family:${T.fontMono};margin-top:2px}

.sv-tabs{display:flex;gap:6px;background:rgba(148,25,24,.06);border:1px solid rgba(148,25,24,.18);border-radius:14px;padding:6px;margin-bottom:14px}
.sv-tab{
  flex:1;border-radius:10px;padding:10px 14px;cursor:pointer;
  font-family:${T.fontHead};font-size:14px;font-weight:500;
  border:1px solid transparent;background:transparent;
  color:${T.textLight};transition:all .2s ease;
}
.sv-tab:hover{background:rgba(148,25,24,.07)}
.sv-tab.active{
  font-weight:700;color:#941918;
  background:rgba(148,25,24,.09);
  border-color:rgba(148,25,24,.35);
  box-shadow:0 4px 14px rgba(148,25,24,.14),inset 0 1px 0 rgba(255,255,255,.75);
}

.sv-meta{display:flex;align-items:center;gap:24px;margin-bottom:18px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.35);border:1px solid ${T.border}}
.sv-divider{width:1px;height:30px;background:${T.border}}
.sv-content{padding:18px 16px;background:rgba(255,255,255,.45);border:1px solid ${T.border};border-radius:16px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:svUp .28s ease}

.sv-track{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:10px;padding-top:2px}
.sv-track-line{position:absolute;left:12.5%;right:12.5%;top:20px;height:4px;border-radius:999px;background:rgba(128,194,220,.25);overflow:hidden}
.sv-track-line-fill{height:100%;width:0%;background:linear-gradient(90deg,#24a2df,#127fc3);transition:width .35s ease}
.sv-track-item{position:relative;z-index:1;padding:0 4px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;transition:all .22s ease;min-height:76px;border:none!important;background:transparent!important;box-shadow:none!important;outline:none!important}
.sv-track-icon{width:32px;height:32px;border-radius:999px;border:1.5px solid rgba(128,194,220,.55);background:#f4fbff;display:flex;align-items:center;justify-content:center;transition:all .22s ease}
.sv-track-item svg{color:${T.textDim};transition:color .22s ease,transform .22s ease}
.sv-track-item.active .sv-track-icon{border-color:rgba(18,127,195,.85);background:#e9f7ff;box-shadow:0 0 0 3px rgba(36,162,223,.14)}
.sv-track-item.active svg{color:${T.red};transform:translateY(-1px) scale(1.05)}
.sv-track-title{font-family:${T.fontHead};font-size:10px;letter-spacing:.03em;font-weight:700;color:${T.textLight};text-align:center}
.sv-track-item.active .sv-track-title{color:${T.red}}
.sv-track-sub{font-family:${T.fontMono};font-size:9px;color:${T.textDim};text-align:center;line-height:1.2}

@media (max-width: 920px){
  .sv-inner{padding:28px 14px 24px}
  .sv-header{margin-bottom:18px;align-items:flex-start;flex-wrap:wrap}
  .sv-header-actions{width:100%;justify-content:flex-start}
}

@media (max-width: 640px){
  .sv-title{font-size:18px}
  .sv-subtitle{font-size:10px}
  .sv-btn-grow{flex:1;justify-content:center}
  .sv-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  .sv-tab{font-size:12px;padding:8px 10px}
  .sv-meta{display:grid;grid-template-columns:1fr;gap:10px;padding:10px 12px}
  .sv-track{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .sv-track-line{display:none}
  .sv-divider{display:none}
  .sv-content{padding:12px 10px}
}
`;

const SERVICIO_STYLE_ID = 'servicio-trabajo-style';
function injectCSS() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(SERVICIO_STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = SERVICIO_STYLE_ID;
    document.head.appendChild(el);
  }
  if (el.textContent !== CSS) {
    el.textContent = CSS;
  }
}

const ServicioTrabajo = ({ notificacion, onBack }) => {
  injectCSS();
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const notifId = useMemo(
    () => String(notificacion?.id || notificacion?.id_notificacion || '').trim(),
    [notificacion]
  );

  const [activeTab, setActiveTab] = useState('REMETRO');
  const [carritoData, setCarritoData] = useState({
    carrito_id: notificacion?.carrito_id || notificacion?.id_carrito || null,
    cliente_id: notificacion?.cliente_id || notificacion?.id_cliente || null,
    notif_id: notificacion?.id || notificacion?.id_notificacion || null,
  });
  const [mostrarFacturacion, setMostrarFacturacion] = useState(false);
  const [productosFacturacion, setProductosFacturacion] = useState([]);
  const [tabPendientePostPago, setTabPendientePostPago] = useState('');
  const [tracking, setTracking] = useState({ aceptoPedido: false, maxStep: 0 });
  const [disenoData, setDisenoData] = useState(null);
  const permitirInstalacion = tracking.maxStep >= 5 || activeTab === 'INSTALACION';

  useEffect(() => {
    if (!notifId) { setActiveTab('REMETRO'); return; }
    try {
      const raw = sessionStorage.getItem(SERVICIO_TAB_KEY);
      if (!raw) { setActiveTab('REMETRO'); return; }
      const parsed = JSON.parse(raw);
      if (parsed?.tab && String(parsed?.notifId || '') === String(notifId)) {
        setActiveTab(parsed.tab);
        return;
      }
    } catch {}
    setActiveTab('REMETRO');
  }, [notifId]);

  useEffect(() => {
    if (!notifId) return;
    try {
      sessionStorage.setItem(SERVICIO_TAB_KEY, JSON.stringify({ notifId, tab: activeTab }));
    } catch {}
  }, [notifId, activeTab]);

  useEffect(() => {
    if (!notifId) {
      setTracking({ aceptoPedido: false, maxStep: 0 });
      return;
    }
    try {
      const raw = localStorage.getItem(`${SERVICIO_TRACKING_KEY}_${notifId}`);
      if (!raw) {
        setTracking({ aceptoPedido: false, maxStep: 0 });
        return;
      }
      const parsed = JSON.parse(raw);
      setTracking({
        aceptoPedido: Boolean(parsed?.aceptoPedido),
        maxStep: Number(parsed?.maxStep || 0)
      });
    } catch {
      setTracking({ aceptoPedido: false, maxStep: 0 });
    }
  }, [notifId]);

  const guardarTracking = useCallback((next) => {
    setTracking(next);
    if (!notifId) return;
    try {
      localStorage.setItem(`${SERVICIO_TRACKING_KEY}_${notifId}`, JSON.stringify(next));
    } catch {}
  }, [notifId]);

  const stepPorTab = useMemo(() => ({ REMETRO: 1, DISENO: 2, RETAZO: 3, PRODUCTOS: 4, INSTALACION: 5 }), []);

  useEffect(() => {
    if (!tracking.aceptoPedido) return;
    const stepActual = stepPorTab[activeTab] || 1;
    if (stepActual > tracking.maxStep) {
      guardarTracking({ ...tracking, maxStep: stepActual });
    }
  }, [activeTab, stepPorTab, tracking, guardarTracking]);

  useEffect(() => {
    if (!permitirInstalacion && activeTab === 'INSTALACION') {
      setActiveTab('PRODUCTOS');
    }
  }, [activeTab, permitirInstalacion]);

  useEffect(() => {
    // Al entrar al servicio, solo REMETRO debe estar habilitado hasta confirmar el primer paso.
    if (!tracking.aceptoPedido && activeTab !== 'REMETRO') {
      setActiveTab('REMETRO');
    }
  }, [tracking.aceptoPedido, activeTab]);

  const TABS = [
    { key: 'REMETRO',    label: 'REMETREO' },
    { key: 'DISENO',     label: 'DISEÑO' },
    { key: 'RETAZO',     label: 'RETAZO' },
    { key: 'PRODUCTOS',  label: 'PRODUCTOS' },
    { key: 'INSTALACION',label: 'INSTALACION' },
  ];

  const abrirComprobanteServicio = useCallback((productos, opciones = {}) => {
    const lista = Array.isArray(productos) ? productos.filter(Boolean) : [];
    if (!lista.length) {
      showToast('Primero registra un pago en REMETRO para generar comprobante', 'error');
      return;
    }
    setProductosFacturacion(lista);
    setTabPendientePostPago(opciones.tabPostPago || '');
    setMostrarFacturacion(true);
  }, [showToast]);

  const cerrarModalFacturacion = useCallback(() => {
    setMostrarFacturacion(false);
    if (tabPendientePostPago) {
      setActiveTab(tabPendientePostPago);
      setTabPendientePostPago('');
    }
  }, [tabPendientePostPago]);

  const actualizarEstadoSeguimiento = useCallback(async (estado) => {
    try {
      const clienteId = (
        notificacion?.id_cliente
        || notificacion?.cliente_id
        || carritoData?.cliente_id
        || localStorage.getItem('cliente_id')
        || null
      );
      const clienteNombre = (
        notificacion?.nombre
        || localStorage.getItem('cliente_nombre')
        || null
      );
      const clienteCorreo = (
        notificacion?.correo
        || localStorage.getItem('cliente_correo')
        || null
      );

      const response = await fetch('/api/barra_progreso/servicio/estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          cliente_nombre: clienteNombre,
          cliente_correo: clienteCorreo,
          estado
        })
      });
      const data = await response.json();
      if (!data.success) {
        console.error('Error al actualizar estado:', data.message);
      }
    } catch (error) {
      console.error('Error al actualizar estado del seguimiento:', error);
    }
  }, [notificacion, carritoData]);

  useEffect(() => {
    if (activeTab === 'PRODUCTOS') {
      actualizarEstadoSeguimiento('realizando');
    }
  }, [activeTab, actualizarEstadoSeguimiento]);

  const trackingSteps = useMemo(() => ([
    { key: 1, label: 'Acepto el pedido', sub: 'Pago confirmado',   icon: IconReceipt },
    { key: 2, label: 'Diseño',           sub: 'Etapa diseño',      icon: IconRuler2 },
    { key: 3, label: 'Buscando medidas', sub: 'Etapa retazo',      icon: IconLayoutGrid },
    { key: 4, label: 'Buscando productos', sub: 'Etapa productos', icon: IconStack2 },
    { key: 5, label: 'Instalado',        sub: 'Etapa instalación', icon: IconChalkboardTeacher },
  ]), []);

  const trackingPct = useMemo(() => {
    if (!tracking.aceptoPedido) return 0;
    const total = trackingSteps.length;
    if (total <= 1) return 100;
    const clamped = Math.max(1, Math.min(Number(tracking.maxStep || 1), total));
    return ((clamped - 1) / (total - 1)) * 100;
  }, [tracking, trackingSteps]);

  return (
    <div className="sv-root">
      <div className="sv-bg" />
      <div className="sv-inner">
        <BrandToast toast={toast} onClose={() => setToast(null)} />

        <header className="sv-header">
          <div className="sv-header-main">
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                flexShrink: 0,
                background: `linear-gradient(135deg,${T.brandMid} 0%,${T.brand} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 22px ${T.brandMid}44,inset 0 1px 0 rgba(255,255,255,.4)`,
                border: '1px solid rgba(255,255,255,.4)',
              }}
            >
              <IconTool size={20} color="#fff" stroke={1.5} />
            </div>
            <div>
              <h1 className="sv-title">Servicio</h1>
              <p className="sv-subtitle">Gestiona remetro, retazo, productos e instalación del servicio seleccionado.</p>
            </div>
          </div>

          <div className="sv-header-actions">
            <button
              className="sv-btn"
              style={{
                position: 'relative',
                width: 40,
                height: 40,
                borderRadius: 12,
                ...gc,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconBell size={17} stroke={1.5} color={T.textLight} />
            </button>

            <button
              className="sv-btn"
              onClick={onBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 14px',
                borderRadius: 11,
                ...gc,
                color: T.brand,
                fontWeight: 700,
                fontSize: 13,
                fontFamily: T.fontBody,
                border: `1.5px solid ${T.borderMid}`,
              }}
            >
              <IconArrowLeft size={14} /> Atras
            </button>

            <button
              className="sv-btn sv-btn-grow"
              onClick={() => {
                ['personalToken', 'auth_token', 'cliente_id', 'cliente_correo', 'staff', 'area'].forEach(k => localStorage.removeItem(k));
                const STAFF_PATHS = new Set(['/almacen', '/administracion', '/obras', '/operaciones', '/personal']);
                try {
                  const raw = localStorage.getItem('breadcrumb_history');
                  const hist = raw ? JSON.parse(raw) : [];
                  localStorage.setItem('breadcrumb_history', JSON.stringify(hist.filter(b => !STAFF_PATHS.has(b.path))));
                } catch {}
                navigate('/personal', { replace: true });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 14px',
                borderRadius: 11,
                background: T.redSoft,
                border: `1.5px solid ${T.redBorder}`,
                color: T.red,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: T.fontBody,
                backdropFilter: 'blur(8px)',
              }}
            >
              <IconLogout size={14} /> Salir
            </button>

          </div>
        </header>

        <div style={{ borderRadius: 22, overflow: 'hidden', ...gcM, animation: 'svUp .45s ease', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ padding: '20px 24px 26px' }}>
            <div className="sv-tabs">
              {TABS.map((tab) => {
                const bloqueado = tab.key !== activeTab;
                return (
                  <button
                    key={tab.key}
                    className={`sv-tab${activeTab === tab.key ? ' active' : ''}${bloqueado ? ' disabled' : ''}`}
                    onClick={() => { if (!bloqueado) setActiveTab(tab.key); }}
                    disabled={bloqueado}
                    title={bloqueado ? 'Debes completar la etapa actual para continuar.' : undefined}
                    style={bloqueado ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'auto' } : undefined}
                  >
                    {tab.label}
                    {bloqueado && (
                      <IconCircleCheck size={13} stroke={1.5} style={{ marginLeft: 5, verticalAlign: 'middle' }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="sv-meta">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, color: T.textDim, fontFamily: T.fontMono }}>
                  CLIENTE
                </span>
                <span style={{ fontFamily: T.fontHead, fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: 0.2 }}>
                  {notificacion?.nombre || '-'}
                </span>
              </div>
            </div>

            <div className="sv-track">
              <div className="sv-track-line">
                <div className="sv-track-line-fill" style={{ width: `${trackingPct}%` }} />
              </div>
              {trackingSteps.map((step) => {
                const IconComp = step.icon;
                const active = tracking.aceptoPedido && step.key <= tracking.maxStep;
                return (
                  <div key={step.key} className={`sv-track-item${active ? ' active' : ''}`}>
                    <div className="sv-track-icon">
                      <IconComp stroke={1} size={18} />
                    </div>
                    <span className="sv-track-title">{step.label}</span>
                    <span className="sv-track-sub">{step.sub}</span>
                  </div>
                );
              })}
            </div>

            <div className="sv-content">
              {activeTab === 'REMETRO' && (
                <Remetro
                  notificacion={notificacion}
                  onToast={showToast}
                  onPagoConfirmado={({ carritoId, productos }) => {
                    guardarTracking({ aceptoPedido: true, maxStep: Math.max(tracking.maxStep, 1) });
                    if (carritoId) {
                      setCarritoData((prev) => ({ ...prev, carrito_id: carritoId }));
                    }
                    abrirComprobanteServicio(productos, { tabPostPago: 'DISENO' });
                  }}
                  onGuardarSuccess={(carritoId) => {
                    if (carritoId) {
                      setCarritoData((prev) => ({ ...prev, carrito_id: carritoId }));
                    }
                    setActiveTab('DISENO');
                  }}
                  tipoNotificacion="SERVICIO"
                />
              )}

              {activeTab === 'DISENO' && (
                <DisenoServicio
                  notificacion={notificacion}
                  onToast={showToast}
                  onGuardarSuccess={(data) => {
                    setDisenoData(data);
                    guardarTracking({ aceptoPedido: true, maxStep: Math.max(tracking.maxStep, 2) });
                    setActiveTab('RETAZO');
                  }}
                />
              )}

              {activeTab === 'RETAZO' && (
                <RetazoServicio
                  notificacion={notificacion}
                  onToast={showToast}
                  onGuardarSuccess={() => {
                    actualizarEstadoSeguimiento('realizando');
                    setActiveTab('PRODUCTOS');
                  }}
                />
              )}

              {activeTab === 'PRODUCTOS' && (
                <ProductosServicio
                  notificacion={notificacion}
                  onToast={showToast}
                  onGuardarSuccess={() => {
                    guardarTracking({ aceptoPedido: true, maxStep: Math.max(tracking.maxStep, 4) });
                    actualizarEstadoSeguimiento('instalacion');
                    setActiveTab('INSTALACION');
                  }}
                />
              )}

              {activeTab === 'INSTALACION' && (
                <Instalacion
                  notificacion={notificacion}
                  onToast={showToast}
                  tipoNotificacion="SERVICIO"
                  carritoData={carritoData}
                  onFinalizarServicio={async () => {
                    await actualizarEstadoSeguimiento('instalado');
                    showToast('Servicio culminado correctamente', 'success');
                    onBack && onBack();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {mostrarFacturacion && (
        <ModalFacturacion
          productos={productosFacturacion}
          clienteActual={{
            nombre: notificacion?.nombre || '',
            documento: notificacion?.documento || '',
            correo: notificacion?.correo || '',
            cliente_id: notificacion?.cliente_id || notificacion?.id_cliente || carritoData?.cliente_id || ''
          }}
          autoCloseOnComprobante={true}
          onComprobanteGenerado={() => showToast('Comprobante generado correctamente', 'success')}
          onClose={cerrarModalFacturacion}
        />
      )}
    </div>
  );
};

export default ServicioTrabajo;
