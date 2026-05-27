import React, { useState, useEffect, useMemo, useRef } from "react";
import ModalMetodoPago from "./ModalMetodoPago";
import { realizarCompra } from "../../services/compraService";
import { animate, spring, stagger } from "animejs";
import QRCodeLib from "qrcode";
import {
  IconPlus, IconTrash, IconEdit, IconSearch,
  IconCheck, IconPackage, IconX, IconShoppingCartPlus, IconTag, IconExclamationMark, IconAlarm,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { FONTS } from "../../colors";
import { buildApiUrl } from "../../config";
import ModalTipoProductoVidrio from "./ModalTipoProductoVidrio";
import ModalIngresoCortes from "./ModalIngresoCortes";
import ModalFacturacion from "./ModalFacturacion";
import {
  agregarProductoCotizacion,
  actualizarProductoCotizacion,
  obtenerProductosCotizacion,
  eliminarProductoCotizacion,
  limpiarCotizacion,
} from "../../utils/ramCotizacion";

const RED    = '#941918';
const CELESTE  = '#80C2DC';
const CELESTE2 = '#5a8ba8';
const AMARILLO = '#ffd600';
const CELSFT   = 'rgba(128,194,220,.12)';
const CELBRD   = 'rgba(128,194,220,.38)';
const TXT   = '#1a2a3a';
const TXTM  = '#2d4a62';
const TXTL  = '#5a7a90';
const TXTD  = '#8aa8bc';
const FH    = FONTS.heading;
const FB    = FONTS.body;
const FM    = "'IBM Plex Mono',monospace";

const CSS = `
@keyframes cqFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes cqRow{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
@keyframes cqCard{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes cqAura{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(10px,-8px) scale(1.06)}}
@keyframes cqPulse{0%,100%{box-shadow:0 6px 18px rgba(128,194,220,.38)}50%{box-shadow:0 12px 30px rgba(128,194,220,.55)}}
@keyframes cqShimmer{0%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
@keyframes cqPopIn{from{opacity:0;transform:scale(.82) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes cqPopGlow{0%,100%{box-shadow:0 8px 24px rgba(128,194,220,.38),0 1px 0 rgba(255,255,255,.9) inset}50%{box-shadow:0 14px 36px rgba(128,194,220,.55),0 1px 0 rgba(255,255,255,.9) inset}}

.cq-wrap{
  display:flex;
  gap:16px;
  align-items:flex-start;
  position:relative;
  border-radius:22px;
  padding:8px;
  background:linear-gradient(135deg,rgba(255,255,255,.55),rgba(128,194,220,.10));
  border:1px solid rgba(128,194,220,.18);
}

.cq-wrap::before,
.cq-wrap::after{
  content:'';
  position:absolute;
  border-radius:999px;
  filter:blur(26px);
  pointer-events:none;
  z-index:0;
  opacity:.28;
  animation:cqAura 8s ease-in-out infinite;
}

.cq-wrap::before{
  width:180px;
  height:180px;
  top:-50px;
  left:-30px;
  background:radial-gradient(circle, rgba(128,194,220,.9) 0%, rgba(128,194,220,0) 72%);
}

.cq-wrap::after{
  width:170px;
  height:170px;
  bottom:-40px;
  right:10px;
  animation-delay:2.2s;
  background:radial-gradient(circle, rgba(148,25,24,.55) 0%, rgba(148,25,24,0) 72%);
}

.cq-main,.cq-side{position:relative;z-index:1;}
.cq-main{flex:1.2;min-width:0;display:flex;flex-direction:column;gap:14px;}
.cq-side{flex:1.25;min-width:0;max-width:560px;display:flex;flex-direction:column;gap:12px;}

.cq-card{
  border-radius:16px;position:relative;overflow:hidden;
  background:linear-gradient(160deg,rgba(255,255,255,.78),rgba(243,251,255,.62));
  backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border:1.5px solid rgba(128,194,220,.30);
  box-shadow:0 10px 28px rgba(90,139,168,.15),0 1px 0 rgba(255,255,255,.9) inset;
  animation:cqFade .28s ease both;
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.cq-card:hover{
  transform:translateY(-2px);
  border-color:rgba(128,194,220,.50);
  box-shadow:0 14px 30px rgba(90,139,168,.22),0 1px 0 rgba(255,255,255,.9) inset;
}

.cq-card-head{
  padding:12px 16px 11px;
  background:linear-gradient(90deg,rgba(128,194,220,.15),rgba(255,255,255,.45) 40%,rgba(255,214,0,.10));
  border-bottom:1px solid rgba(128,194,220,.20);
  display:flex;align-items:center;gap:9px;flex-wrap:wrap;
}

.cq-table{width:100%;border-collapse:collapse;}
.cq-th{
  padding:7px 10px;
  font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:700;
  letter-spacing:.8px;text-transform:uppercase;color:#5a7a90;
  background:rgba(232,246,252,.70);
  border-bottom:1.5px solid rgba(128,194,220,.28);
  white-space:nowrap;
}
.cq-th:first-child{border-radius:8px 0 0 0}
.cq-th:last-child{border-radius:0 8px 0 0}
.cq-tr{border-bottom:1px solid rgba(128,194,220,.10);transition:background .12s;animation:cqRow .18s ease both;}
.cq-tr:hover{background:rgba(232,246,252,.45);}
.cq-td{padding:7px 10px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#2d4a62;vertical-align:middle;}
.cq-scroll-t{max-height:220px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(128,194,220,.35) transparent;}
.cq-scroll-t::-webkit-scrollbar{width:4px}
.cq-scroll-t::-webkit-scrollbar-thumb{background:rgba(128,194,220,.35);border-radius:999px}

.cq-input{
  width:100%;padding:8px 12px;
  background:rgba(255,255,255,.75);
  border:1.5px solid rgba(128,194,220,.35);border-radius:10px;
  font-family:'IBM Plex Mono',monospace;font-size:13px;color:#1a2a3a;
  outline:none;transition:border-color .18s,box-shadow .18s;
  box-shadow:inset 0 2px 5px rgba(90,139,168,.06);box-sizing:border-box;
}
.cq-input:focus{border-color:rgba(128,194,220,.65);box-shadow:0 0 0 3px rgba(128,194,220,.13);}
.cq-input::placeholder{color:#8aa8bc}
.cq-input:disabled{opacity:.5;cursor:not-allowed}
.cq-input-search{padding-left:34px;}

.cq-pill{
  display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;cursor:pointer;
  font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;
  border:1.5px solid rgba(128,194,220,.30);background:rgba(255,255,255,.65);color:#5a7a90;transition:all .15s;
}
.cq-pill.active{background:rgba(148,25,24,.08);border-color:rgba(148,25,24,.30);color:#941918;}
.cq-pill.active{box-shadow:0 6px 14px rgba(148,25,24,.14);}

.cq-doc-wrap{
  padding:10px 11px;
  border-radius:11px;
  border:1.5px solid rgba(128,194,220,.28);
  background:linear-gradient(135deg,rgba(232,246,252,.65),rgba(255,255,255,.72));
}

.cq-name-wrap{
  padding:10px 11px;
  border-radius:11px;
  border:1.5px solid rgba(128,194,220,.22);
  background:linear-gradient(135deg,rgba(255,255,255,.78),rgba(232,246,252,.48));
}

.cq-registro-pill{
  display:inline-flex;
  align-items:center;
  gap:6px;
  margin-top:8px;
  padding:4px 10px;
  border-radius:999px;
  font-family:'IBM Plex Mono',monospace;
  font-size:10px;
  font-weight:700;
  letter-spacing:.2px;
}

.cq-registro-pill.registrado{
  background:rgba(16,185,129,.14);
  color:#0f8a61;
  border:1px solid rgba(16,185,129,.32);
}

.cq-registro-pill.no-registrado{
  background:rgba(148,25,24,.10);
  color:#941918;
  border:1px solid rgba(148,25,24,.28);
}

.cq-registro-pill.consultando{
  background:rgba(128,194,220,.15);
  color:#2d4a62;
  border:1px solid rgba(128,194,220,.38);
}

.cq-qty{
  display:inline-flex;
  align-items:center;
  gap:4px;
  border:1.5px solid rgba(128,194,220,.30);
  border-radius:999px;
  background:rgba(255,255,255,.72);
  padding:2px;
}

.cq-qty-btn{
  width:20px;
  height:20px;
  border:none;
  border-radius:999px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(128,194,220,.16);
  color:#2d4a62;
  font-family:'IBM Plex Mono',monospace;
  font-size:12px;
  font-weight:700;
}

.cq-qty-btn:hover{background:rgba(128,194,220,.30);}

.cq-qty-btn:disabled{opacity:.38;cursor:not-allowed;}

.cq-qty-val{
  min-width:20px;
  text-align:center;
  font-family:'IBM Plex Mono',monospace;
  font-size:11px;
  font-weight:700;
  color:#1a2a3a;
}

.cq-cat{
  padding:4px 12px;border-radius:999px;cursor:pointer;
  font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;
  border:1.5px solid rgba(128,194,220,.25);background:rgba(255,255,255,.60);color:#5a7a90;transition:all .15s;white-space:nowrap;
}
.cq-cat:hover{background:rgba(232,246,252,.55);}
.cq-cat.active{background:rgba(148,25,24,.08);border-color:rgba(148,25,24,.30);color:#941918;}
.cq-cat.active{box-shadow:0 5px 12px rgba(148,25,24,.12);}

.cq-prod-card{
  position:relative;border-radius:14px;overflow:hidden;
  background:rgba(255,255,255,.72);
  border:1.5px solid rgba(128,194,220,.25);
  box-shadow:0 4px 16px rgba(90,139,168,.10);
  transition:all .20s cubic-bezier(.4,0,.2,1);animation:cqCard .22s ease both;
}
.cq-prod-card:hover{transform:translateY(-3px) scale(1.012);box-shadow:0 12px 32px rgba(90,139,168,.20);border-color:rgba(128,194,220,.55);}

.cq-prod-card::after{
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(110deg,transparent 0%,rgba(255,255,255,.36) 45%,transparent 85%);
  transform:translateX(-130%);
  pointer-events:none;
}

.cq-prod-card:hover::after{animation:cqShimmer .8s ease;}

.cq-prod-img-wrap{width:100%;height:130px;background:linear-gradient(135deg,rgba(232,246,252,.80),rgba(210,236,248,.60));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.cq-prod-img-wrap img{width:100%;height:100%;object-fit:cover;}
.cq-prod-overlay{position:absolute;bottom:0;left:0;right:0;padding:8px 10px 6px;background:linear-gradient(0deg,rgba(26,42,58,.72) 0%,transparent 100%);}

.cq-prod-body{padding:8px 10px 10px;}

.cq-plus-btn{
  width:100%;padding:7px 0;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:5px;
  font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;
  background:linear-gradient(135deg,rgba(148,25,24,.12),rgba(148,25,24,.20));
  border:1.5px solid rgba(148,25,24,.28);color:#941918;cursor:pointer;transition:all .15s;
}
.cq-plus-btn:hover{background:linear-gradient(135deg,rgba(148,25,24,.18),rgba(148,25,24,.28));border-color:rgba(148,25,24,.45);transform:translateY(-1px);}

.cq-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;background:rgba(128,194,220,.12);border:1px solid rgba(128,194,220,.30);color:#5a7a90;}

.cq-btn-red{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 18px;border-radius:11px;cursor:pointer;background:linear-gradient(180deg,rgba(148,25,24,.13),rgba(148,25,24,.22));color:#941918;border:1.5px solid rgba(148,25,24,.28);font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;box-shadow:inset 0 2px 5px rgba(148,25,24,.10),0 1px 0 rgba(255,255,255,.8);transition:all .16s;}
.cq-btn-red:hover{background:linear-gradient(180deg,rgba(148,25,24,.19),rgba(148,25,24,.30));}

.cq-btn-compra{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 22px;border-radius:11px;cursor:pointer;background:linear-gradient(135deg,#80C2DC,#5a8ba8);color:white;border:none;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;box-shadow:0 6px 18px rgba(128,194,220,.38);transition:all .16s;}
.cq-btn-compra:hover{box-shadow:0 10px 26px rgba(128,194,220,.50);transform:translateY(-1px);}
.cq-total-row .cq-btn-compra{animation:cqPulse 2.5s ease-in-out infinite;}

.cq-popover{position:fixed;z-index:1500;background:linear-gradient(160deg,rgba(255,255,255,.98),rgba(236,248,255,.96));backdrop-filter:blur(24px) saturate(200%);-webkit-backdrop-filter:blur(24px) saturate(200%);border:1.5px solid rgba(128,194,220,.50);border-radius:20px;box-shadow:0 24px 48px rgba(26,42,58,.28),0 4px 12px rgba(128,194,220,.18),0 1px 0 rgba(255,255,255,.95) inset;padding:18px 16px 16px;width:230px;animation:cqPopIn .22s cubic-bezier(.34,1.4,.64,1) both;}
.cq-popover-title{font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#1a2a3a;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
.cq-pop-confirm{width:100%;padding:11px 0;border-radius:12px;border:none;cursor:pointer;background:linear-gradient(135deg,#80C2DC,#5a8ba8);color:#fff;font-weight:800;font-size:12px;font-family:'IBM Plex Mono',monospace;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 6px 16px rgba(128,194,220,.42),inset 0 1px 0 rgba(255,255,255,.28);transition:all .14s;letter-spacing:.3px;margin-bottom:8px;}
.cq-pop-confirm:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(128,194,220,.55),inset 0 1px 0 rgba(255,255,255,.28);}
.cq-pop-confirm:active{transform:translateY(2px);box-shadow:0 3px 8px rgba(128,194,220,.30),inset 0 2px 5px rgba(0,0,0,.12);}
.cq-pop-confirm:disabled{opacity:.42;cursor:not-allowed;transform:none;}
.cq-pop-cancel{width:100%;padding:9px 0;border-radius:10px;border:1.5px solid rgba(128,194,220,.28);background:rgba(128,194,220,.08);color:#5a7a90;font-weight:700;font-size:11px;font-family:'IBM Plex Mono',monospace;cursor:pointer;transition:all .14s;}
.cq-pop-cancel:hover{background:rgba(128,194,220,.18);color:#1a2a3a;border-color:rgba(128,194,220,.45);}

.cq-qr-loading{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(6,14,28,.72);backdrop-filter:blur(10px) saturate(150%);-webkit-backdrop-filter:blur(10px) saturate(150%);padding:16px;}
.cq-qr-loading-card{width:min(440px,100%);padding:28px 24px;border-radius:22px;background:linear-gradient(155deg,rgba(255,255,255,.98),rgba(224,246,255,.90));border:1.5px solid rgba(128,194,220,.45);box-shadow:0 26px 60px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.95);text-align:center;}
.cq-qr-dots{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:14px 0 10px;}
.cq-qr-dot{width:18px;height:18px;border-radius:999px;background:linear-gradient(180deg,#80C2DC,#5a8ba8);box-shadow:0 4px 12px rgba(128,194,220,.34);}
.cq-qr-bars{display:flex;justify-content:center;gap:8px;margin-top:10px;}
.cq-qr-bar{height:6px;width:34px;border-radius:999px;background:linear-gradient(90deg,rgba(148,25,24,.45),rgba(128,194,220,.65));transform-origin:left center;}

.cq-total-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:11px;margin-top:8px;background:linear-gradient(135deg,rgba(128,194,220,.15),rgba(90,139,168,.10));border:1.5px solid rgba(128,194,220,.35);}
.cq-total-row{position:relative;overflow:hidden;}
.cq-total-row::before{content:'';position:absolute;left:-20%;top:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,214,0,.22),transparent);transform:skewX(-18deg);animation:cqShimmer 3.2s linear infinite;pointer-events:none;opacity:.55;}

.cq-label{display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.8px;color:#8aa8bc;margin-bottom:5px;text-transform:uppercase;}

.cq-prod-scroll{max-height:580px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(128,194,220,.35) transparent;padding-right:2px;}
.cq-prod-scroll::-webkit-scrollbar{width:4px}
.cq-prod-scroll::-webkit-scrollbar-thumb{background:rgba(128,194,220,.35);border-radius:999px}

@media(max-width:900px){.cq-wrap{flex-direction:column;}.cq-side{max-width:100%;}.cq-main,.cq-side{flex:1;}}

@media (prefers-reduced-motion: reduce){
  .cq-wrap::before,.cq-wrap::after,
  .cq-total-row::before,
  .cq-total-row .cq-btn-compra,
  .cq-prod-card::after{animation:none !important;}
}

.cq-print-sheet{display:none;}

@media print{
  body *{visibility:hidden !important;}
  .cq-print-sheet,.cq-print-sheet *{visibility:visible !important;}
  .cq-print-sheet{
    display:block !important;
    position:fixed;
    inset:0;
    background:#ffffff;
    padding:22px;
    z-index:999999;
    font-family:Arial,sans-serif;
  }
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

const CotizacionView = () => {
  injectCSS();

  const [modalPagoOpen,              setModalPagoOpen]              = useState(false);
  const [searchTerm,                 setSearchTerm]                 = useState('');
  const [products,                   setProducts]                   = useState([]);
  const [cotizacionProductos,        setCotizacionProductos]        = useState([]);
  const [filteredProducts,           setFilteredProducts]           = useState([]);
  const [categorias,                 setCategorias]                 = useState([]);
  const [categoriaSeleccionada,      setCategoriaSeleccionada]      = useState('');
  const [popoverProducto,            setPopoverProducto]            = useState(null);
  const [popoverCantidad,            setPopoverCantidad]            = useState(1);
  const [modalTipoProductoVisible,   setModalTipoProductoVisible]   = useState(false);
  const [productoSeleccionadoTipo,   setProductoSeleccionadoTipo]   = useState(null);
  const [modalCortesVisible,         setModalCortesVisible]         = useState(false);
  const [productoSeleccionadoCortes, setProductoSeleccionadoCortes] = useState(null);
  const [productoEnEdicion,          setProductoEnEdicion]          = useState(null);
  const [tipoDocumentos,             setTipoDocumentos]             = useState([]);
  const [tipoDocumentoSeleccionado,  setTipoDocumentoSeleccionado]  = useState(null);
  const [digitos,                    setDigitos]                    = useState('');
  const [nombreCliente,              setNombreCliente]              = useState('');
  const [correoCliente,              setCorreoCliente]              = useState('');
  const [errorNombre,                setErrorNombre]                = useState('');
  const [estadoRegistro,             setEstadoRegistro]             = useState('idle');
  const [modalCredenciales,          setModalCredenciales]          = useState(null);
  const [credencialParaImprimir,     setCredencialParaImprimir]     = useState(null);
  const [modalFacturacionOpen,       setModalFacturacionOpen]       = useState(false);
  const [facturacionProductos,       setFacturacionProductos]       = useState([]);
  const [compraPendienteCtx,         setCompraPendienteCtx]         = useState(null);
  const [generandoQr,                setGenerandoQr]                = useState(false);
  const [visibleCount,               setVisibleCount]               = useState(16);
  const [popoverPos,                setPopoverPos]                 = useState({top: 0, left: 0});
  const popoverRef = useRef();
  const productsScrollRef = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    fetch('/api/productos').then(r=>r.json()).then(data=>{
      const productosSeguro = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setProducts(productosSeguro);
      const cats=Array.from(new Set(productosSeguro.map(p=>p.categoria).filter(Boolean)));
      setCategorias(cats);
      setFilteredProducts(productosSeguro);
    }).catch(()=>{ setProducts([]); setCategorias([]); setFilteredProducts([]); });
    setCotizacionProductos(obtenerProductosCotizacion());
  }, []);

  useEffect(()=>{
    if (!categoriaSeleccionada){setFilteredProducts(products);return;}
    setFilteredProducts(products.filter(p=>{
      if (categoriaSeleccionada==='ACCESORIOS') return p.categoria==='VIDRIOS';
      if (categoriaSeleccionada==='VIDRIOS')    return p.categoria==='ACCESORIOS';
      return (p.categoria||'').toString().trim().toLowerCase()===categoriaSeleccionada.toString().trim().toLowerCase();
    }));
  },[categoriaSeleccionada,products]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource(buildApiUrl('/api/realtime/productos'));
      es.addEventListener('productos_changed', (evt) => {
        try {
          const payload = JSON.parse(evt.data || '{}');
          const changes = Array.isArray(payload?.changes) ? payload.changes : [];
          if (!changes.length) return;
          setProducts(prev => {
            const map = new Map((prev || []).map(item => [String(item.id_producto), item]));
            for (const change of changes) {
              const op = change?.op;
              const record = change?.record;
              const pid = String(change?.id || record?.id_producto || '');
              if (!pid) continue;
              if (op === 'delete') {
                map.delete(pid);
                continue;
              }
              const current = map.get(pid);
              if (current && record && Object.prototype.hasOwnProperty.call(record, 'cantidad')) {
                map.set(pid, { ...current, cantidad: record.cantidad });
              }
            }
            return Array.from(map.values());
          });
        } catch (_) {
          // Ignorar payload invalido.
        }
      });
    } catch (_) {
      return undefined;
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  const filteredProductsFiltered=filteredProducts.filter(p=>{
    const term=searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (p.nombre&&p.nombre.toLowerCase().includes(term))||(p.codigo&&p.codigo.toLowerCase().includes(term));
  });

  useEffect(()=>{
    setVisibleCount(16);
    const container = productsScrollRef.current;
    if (container) container.scrollTop = 0;
  }, [searchTerm, categoriaSeleccionada, products]);

  const productosVisibles = useMemo(() => filteredProductsFiltered.slice(0, visibleCount), [filteredProductsFiltered, visibleCount]);

  const onScrollProductos = () => {
    const container = productsScrollRef.current;
    if (!container) return;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 80;
    if (nearBottom && visibleCount < filteredProductsFiltered.length) {
      setVisibleCount(prev => Math.min(prev + 12, filteredProductsFiltered.length));
    }
  };

  const aplicarDescuentoStockLocal = (productosCompra = [], cortesCompra = []) => {
    const deltas = new Map();

    for (const prod of (productosCompra || [])) {
      const pid = String(prod?.id_producto || '');
      const qty = Number(prod?.cantidad || 0);
      if (!pid || qty <= 0) continue;
      deltas.set(pid, Number(deltas.get(pid) || 0) + qty);
    }

    for (const corte of (cortesCompra || [])) {
      const pid = String(corte?.producto_id || '');
      const qty = Number(corte?.cantidad || 0);
      if (!pid || qty <= 0) continue;
      deltas.set(pid, Number(deltas.get(pid) || 0) + qty);
    }

    if (!deltas.size) return;

    const changes = Array.from(deltas.entries()).map(([id, qty]) => {
      const actual = products.find((p) => String(p.id_producto) === String(id));
      const currentQty = Number(actual?.cantidad || 0);
      return {
        op: 'update',
        id,
        record: {
          id_producto: id,
          cantidad: Math.max(0, currentQty - qty),
        },
      };
    });

    setProducts((prev) => {
      const map = new Map((prev || []).map((item) => [String(item.id_producto), item]));
      for (const change of changes) {
        const current = map.get(String(change.id));
        if (!current) continue;
        map.set(String(change.id), { ...current, cantidad: change.record.cantidad });
      }
      return Array.from(map.values());
    });

    try {
      window.dispatchEvent(new CustomEvent('productos-updated-local', { detail: { changes } }));
    } catch (_) {
      // Ignorar si el navegador no soporta CustomEvent.
    }
  };

  useEffect(()=>{
    fetch('/api/tipo_documento').then(r=>r.json()).then(data=>setTipoDocumentos(data.tipos||[])).catch(()=>setTipoDocumentos([]));
  },[]);

  const validarNumero=(tipo,numero)=>{
    if (!tipo||!numero) return{ok:false,msg:'Seleccione tipo e ingrese número.'};
    if (tipo==='DNI'&&!/^\d{8}$/.test(numero)) return{ok:false,msg:'El DNI debe tener 8 dígitos.'};
    if (tipo==='RUC'&&!/^\d{11}$/.test(numero))  return{ok:false,msg:'El RUC debe tener 11 dígitos.'};
    return{ok:true,msg:''};
  };

  const normalizarNombreVisible = (valor) => {
    let texto = String(valor || '').trim();
    texto = texto.replace(/^\d{8,11}\s*[-:|]\s*/i, '');
    return texto.trim();
  };

  const generarCorreoTemporalDesdeNombre = (nombre) => {
    const base = String(nombre || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .trim()
      .replace(/\s+/g, '');

    const localPart = base || 'cliente';
    return `${localPart}@vidriobras.com`;
  };

  const actualizarNombreCliente = (valor) => {
    const nombreLimpio = String(valor || '').replace(/[0-9]/g, '');
    setNombreCliente(nombreLimpio);
  };

  const verificarRegistroCliente = async (numero) => {
    setEstadoRegistro('checking');
    try {
      const res = await fetch(`/api/compra/verificar-cliente?documento=${encodeURIComponent(numero)}`);
      const data = await res.json();
      if (data?.success && data?.registrado) {
        setEstadoRegistro('registered');
      } else if (data?.success) {
        setEstadoRegistro('unregistered');
      } else {
        setEstadoRegistro('idle');
      }
    } catch {
      setEstadoRegistro('idle');
    }
  };

  const consultarDocumentoBackend=async(tipo,numero)=>{
    setErrorNombre('Consultando...'); setNombreCliente('');
    try{
      const res=await fetch('/api/consulta_documento_html',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tipo,numero})});
      const data=await res.json();
      if (data.success&&data.html){setNombreCliente(normalizarNombreVisible(data.html));setErrorNombre('Consulta exitosa.');}
      else{setNombreCliente('');setErrorNombre(tipo==='DNI'&&numero.length===7?'DNI no encontrado. Puedes continuar e ingresar el nombre manualmente.':data.message||'No se encontró información para ese documento.');}
    }catch{setNombreCliente('');setErrorNombre('Error de conexión con el servidor.');}
  };

  useEffect(()=>{
    if (!tipoDocumentoSeleccionado||!digitos) {
      setEstadoRegistro('idle');
      setCorreoCliente('');
      return;
    }
    const tipo=tipoDocumentos.find(tc=>tc.id_tipo===tipoDocumentoSeleccionado)?.descripcion;
    const valid=validarNumero(tipo,digitos);
    if (!valid.ok){setErrorNombre(valid.msg);setNombreCliente('');setEstadoRegistro('idle');setCorreoCliente('');return;}
    consultarDocumentoBackend(tipo,digitos);
    verificarRegistroCliente(digitos);
  },[tipoDocumentoSeleccionado,digitos]);

  useEffect(() => {
    const nombreNormalizado = normalizarNombreVisible(nombreCliente);
    if (!nombreNormalizado) {
      setCorreoCliente('');
      return;
    }
    setCorreoCliente(generarCorreoTemporalDesdeNombre(nombreNormalizado));
  }, [nombreCliente]);

  useEffect(() => {
    if (popoverProducto && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      let newTop = (window.innerHeight / 2) - 80;
      let newLeft = (window.innerWidth / 2) - 110;
      if (newTop < 20) newTop = 20;
      if (newLeft < 20) newLeft = 20;
      if (newTop + 160 > window.innerHeight) newTop = window.innerHeight - 180;
      if (newLeft + 220 > window.innerWidth) newLeft = window.innerWidth - 240;
      setPopoverPos({ top: Math.max(20, newTop), left: Math.max(20, newLeft) });
    }
  }, [popoverProducto]);

  useEffect(() => {
    const onAfterPrint = () => setCredencialParaImprimir(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  useEffect(() => {
    if (!generandoQr) return;
    const dots = document.querySelectorAll('.cq-qr-dot');
    const bars = document.querySelectorAll('.cq-qr-bar');
    if (dots.length) {
      animate(dots, {
        translateY: [0, -16, 0],
        scale: [1, 1.12, 1],
        ease: spring({ stiffness: 180, damping: 10 }),
        delay: stagger(90),
        duration: 1300,
        loop: true,
      });
    }
    if (bars.length) {
      animate(bars, {
        scaleX: [0.22, 1, 0.22],
        opacity: [0.35, 0.95, 0.35],
        delay: stagger(120),
        ease: 'inOut(2)',
        duration: 1100,
        loop: true,
      });
    }
  }, [generandoQr]);

  const imprimirCredenciales = (creds) => {
    setCredencialParaImprimir(creds);
    setTimeout(() => window.print(), 140);
  };

  const totalCotizacion=useMemo(()=>cotizacionProductos.reduce((s,p)=>{
    if(p.tipo_producto==='CORTE'&&Number(p.subtotal)>0) return s+Number(p.subtotal);
    return s+Number(p.precio_unitario||0)*Number(p.cantidad||1);
  },0),[cotizacionProductos]);

  const descargarPdfDesdeBase64 = (base64Pdf, fileName) => {
    if (!base64Pdf) return;
    const binaryString = atob(base64Pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const registrarComprobanteConJwtTemporal = async (jwtTemporal, comprobanteData) => {
    if (!jwtTemporal || !comprobanteData?.payload) return;

    const tipoReal = String(comprobanteData?.tipo || 'boleta').toLowerCase();
    const tipoComprobante = tipoReal.includes('factura') ? 'factura' : 'boleta';
    const monto = Number(comprobanteData?.payload?.mtoImpVenta || comprobanteData?.payload?.subTotal || 0);

    const response = await fetch('/api/registro-pago/guardar-comprobante', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtTemporal}`,
      },
      body: JSON.stringify({
        payload: comprobanteData.payload,
        tipo_comprobante: tipoComprobante,
        monto,
        serie: comprobanteData.serie,
        correlativo: comprobanteData.correlativo,
      }),
    });

    const data = await response.json();
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo registrar comprobante para cuenta temporal');
    }

    const pdfBase64 = data?.data?.pdf;
    if (pdfBase64) {
      const fileName = `${comprobanteData.serie}-${comprobanteData.correlativo}.pdf`;
      descargarPdfDesdeBase64(pdfBase64, fileName);
    }
  };

  const registrarComprobanteConSesionActiva = async (comprobanteData, clienteJwt) => {
    if (!comprobanteData?.payload) return;

    const token = clienteJwt || localStorage.getItem('auth_token');
    if (!token) return;

    const tipoReal = String(comprobanteData?.tipo || 'boleta').toLowerCase();
    const tipoComprobante = tipoReal.includes('factura') ? 'factura' : 'boleta';
    const monto = Number(comprobanteData?.payload?.mtoImpVenta || comprobanteData?.payload?.subTotal || 0);

    const response = await fetch('/api/registro-pago/guardar-comprobante', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        payload: comprobanteData.payload,
        tipo_comprobante: tipoComprobante,
        monto,
        serie: comprobanteData.serie,
        correlativo: comprobanteData.correlativo,
      }),
    });

    const data = await response.json();
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo registrar el comprobante');
    }

    const pdfBase64 = data?.data?.pdf;
    if (pdfBase64) {
      const fileName = `${comprobanteData.serie}-${comprobanteData.correlativo}.pdf`;
      descargarPdfDesdeBase64(pdfBase64, fileName);
    }
  };

  const procesarCompraFinal = async ({ metodo, productos, cortes, nombreApiPeru }, comprobanteData = null) => {
    try {
      const result = await realizarCompra({
        documento: digitos,
        productos,
        cortes,
        metodoPago: metodo,
        nombre_api_peru: nombreApiPeru,
      });

      if (result.success) {
        aplicarDescuentoStockLocal(productos, cortes);
        const clienteJwt = result.jwt_temporal || result.cliente_jwt || null;
        if (result.cuenta_temporal && comprobanteData?.payload) {
          setGenerandoQr(true);
          const qrUrl = `${window.location.origin}/acceso?t=${result.jwt_temporal}`;
          const qrPromise = QRCodeLib.toDataURL(qrUrl, {
            width: 220,
            margin: 2,
            color: { dark: '#941918', light: '#ffffff' },
          });

          try {
            const [qrDataUrl] = await Promise.all([
              qrPromise,
              registrarComprobanteConJwtTemporal(result.jwt_temporal, comprobanteData),
            ]);
            setModalCredenciales({
              correo: result.correo_temporal,
              contrasena: result.contrasena_temporal,
              jwt: result.jwt_temporal,
              clienteId: result.cliente_id,
              qrUrl,
              qrDataUrl,
            });
          } catch (e) {
            alert(`Comprobante generado, pero no se pudo vincular al cliente temporal: ${e.message || e}`);
          }
        } else if (comprobanteData?.payload) {
          try {
            await registrarComprobanteConSesionActiva(comprobanteData, clienteJwt);
          } catch (e) {
            alert(`Comprobante generado, pero no se pudo descargar el PDF: ${e.message || e}`);
          }
        }

        limpiarCotizacion();
        setCotizacionProductos([]);
        setNombreCliente('');
        setDigitos('');
        setCorreoCliente('');
        setTipoDocumentoSeleccionado(null);
        setEstadoRegistro('idle');
        setErrorNombre('');
        try { localStorage.setItem('productos-updated-at', String(Date.now())); } catch (_) {}

        return;
      }

      alert(result.message || 'Error al guardar la compra');
    } finally {
      setGenerandoQr(false);
    }
  };

  const getStockMax = (producto) => {
    const cantidad = Number(producto?.cantidad);
    if (Number.isFinite(cantidad)) {
      return cantidad >= 0 ? cantidad : 0;
    }
    return 9999;
  };

  const agregarItemCotizacion = (producto, tipoProducto = 'PRODUCTO', cantidad = 1) => {
    if (!producto) return;
    const stockMax = getStockMax(producto);
    if (stockMax <= 0) return;

    const cantidadSolicitada = Number(cantidad);
    if (!Number.isFinite(cantidadSolicitada) || cantidadSolicitada < 1) return;

    let codigo = producto.codigo;
    let nombre = producto.nombre;

    if (tipoProducto === 'PLANCHA') {
      codigo = `PLANCHA-${codigo}`;
      nombre = `${nombre} (PLANCHA)`;
    } else if (tipoProducto === 'VARA') {
      codigo = `VARA-${codigo}`;
      nombre = `${nombre} (VARA)`;
    }

    const itemsActuales = obtenerProductosCotizacion();
    const itemExistente = itemsActuales.find(item =>
      item.codigo === codigo
      && item.tipo_producto === tipoProducto
      && item.id_producto === producto.id_producto
    );

    const cantidadFinal = itemExistente
      ? Math.min(Number(itemExistente.cantidad || 0) + cantidadSolicitada, stockMax)
      : Math.min(cantidadSolicitada, stockMax);

    if (itemExistente) {
      actualizarProductoCotizacion(itemExistente.__cotiz_id, { cantidad: cantidadFinal });
      setCotizacionProductos(obtenerProductosCotizacion());
      return;
    }

    agregarProductoCotizacion({
      codigo,
      nombre,
      cantidad: cantidadFinal,
      precio_unitario: producto.precio_unitario,
      id_producto: producto.id_producto,
      tipo_producto: tipoProducto,
      categoria: producto.categoria,
      producto_original: producto.codigo,
    });

    setCotizacionProductos(obtenerProductosCotizacion());
  };

  const actualizarCantidad = (item, delta) => {
    const actual = Number(item?.cantidad || 1);
    const nueva = actual + delta;
    if (nueva < 1) return;
    const codigoBase = item?.producto_original || item?.codigo?.replace('PLANCHA-', '').replace('VARA-', '');
    const productoBase = products.find(prod => prod.codigo === codigoBase);
    const stockMax = getStockMax(productoBase || item);
    if (nueva > stockMax) return;
    actualizarProductoCotizacion(item.__cotiz_id, { cantidad: nueva });
    setCotizacionProductos(obtenerProductosCotizacion());
  };

  return (
    <div className="cq-wrap">

      {/* ══ IZQUIERDA: cotización ══ */}
      <div className="cq-main">

        {/* Datos cliente */}
        <div className="cq-card">
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)',pointerEvents:'none'}}/>
          <div className="cq-card-head">
            <IconPackage size={14} color={CELESTE}/>
            <span style={{fontFamily:FH,fontWeight:700,fontSize:13,color:TXT,flex:1}}>Cotización</span>
          </div>
          <div style={{padding:'14px 16px 16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'start'}}>
            <div>
              <label className="cq-label">Nombre / Razón social</label>
              <div className="cq-name-wrap">
                <input className="cq-input" style={{maxWidth:'520px'}} type="text" value={nombreCliente} onChange={e=>actualizarNombreCliente(e.target.value)} placeholder="Nombre / Razón social"/>
                {errorNombre&&!nombreCliente&&<div style={{fontSize:10,color:RED,fontWeight:600,marginTop:6}}>{errorNombre}</div>}
              </div>
            </div>
            <div>
              <label className="cq-label">Tipo y número de documento</label>
              <div className="cq-doc-wrap">
                <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',flex:'1 1 180px'}}>
                    {Array.isArray(tipoDocumentos)&&tipoDocumentos.length>0
                      ?tipoDocumentos.map(tipo=>(
                        <button key={tipo.id_tipo||tipo.descripcion} className={`cq-pill${tipoDocumentoSeleccionado===tipo.id_tipo?' active':''}`} onClick={()=>setTipoDocumentoSeleccionado(tipo.id_tipo)}>{tipo.descripcion}</button>
                      )):<span style={{fontSize:10,color:TXTD}}>Cargando\u2026</span>}
                  </div>
                  <input className="cq-input" type="text"
                    style={{width:190,maxWidth:'100%',marginLeft:'auto'}}
                    placeholder={tipoDocumentoSeleccionado?(tipoDocumentos.find(tc=>tc.id_tipo===tipoDocumentoSeleccionado)?.descripcion==='RUC'?'RUC (11 d\u00edgitos)':'DNI (8 d\u00edgitos)'):'Seleccione tipo primero'}
                    value={digitos} onChange={e=>setDigitos(e.target.value.replace(/\D/g,''))}
                    maxLength={tipoDocumentoSeleccionado?(tipoDocumentos.find(tc=>tc.id_tipo===tipoDocumentoSeleccionado)?.descripcion==='RUC'?11:8):11}
                    disabled={!tipoDocumentoSeleccionado}/>
                </div>
                {estadoRegistro==='checking' && (
                  <div className="cq-registro-pill consultando">Consultando cliente...</div>
                )}
                {estadoRegistro==='registered' && (
                  <div className="cq-registro-pill registrado">Cliente registrado</div>
                )}
                {estadoRegistro==='unregistered' && (
                  <div className="cq-registro-pill no-registrado">Cliente no registrado</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="cq-card">
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)',pointerEvents:'none'}}/>
          <div className="cq-card-head">
            <span style={{fontFamily:FH,fontWeight:700,fontSize:13,color:TXT,flex:1}}>Productos en cotizaci\u00f3n</span>
            {cotizacionProductos.length>0&&<span className="cq-chip">{cotizacionProductos.length} \u00edtem{cotizacionProductos.length!==1?'s':''}</span>}
          </div>
          <div style={{padding:'10px 12px 14px'}}>
            <div style={{borderRadius:10,overflow:'hidden',border:'1px solid rgba(128,194,220,.20)',background:'rgba(255,255,255,.50)'}}>
              <div className="cq-scroll-t">
                <table className="cq-table">
                  <thead>
                    <tr>
                      {['C\u00f3digo','Nombre','Cant.','P. Unit.','Total','Acciones'].map((h,i)=>(
                        <th key={h+i} className="cq-th" style={{textAlign:i>=2?'center':'left'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cotizacionProductos.length===0?(
                      <tr><td colSpan={6} style={{textAlign:'center',padding:'28px 0',color:TXTD,fontSize:11,fontFamily:FM}}>Sin productos en la cotizaci\u00f3n</td></tr>
                    ):cotizacionProductos.map((p,idx)=>{
                      const total=Number(p.precio_unitario||0)*Number(p.cantidad||1);
                      return(
                        <tr key={p.id_producto||p.codigo||idx} className="cq-tr" style={{animationDelay:`${idx*12}ms`}}>
                          <td className="cq-td"><span className="cq-chip">{p.codigo}</span></td>
                          <td className="cq-td" style={{fontWeight:600,color:TXT,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.nombre}</td>
                          <td className="cq-td" style={{textAlign:'center'}}>
                            {p.tipo_producto === 'CORTE' ? (
                              p.cantidad
                            ) : (
                              <div className="cq-qty">
                                <button className="cq-qty-btn" onClick={() => actualizarCantidad(p, -1)} disabled={Number(p.cantidad || 1) <= 1}>-</button>
                                <span className="cq-qty-val">{p.cantidad}</span>
                                <button className="cq-qty-btn" onClick={() => actualizarCantidad(p, 1)}>+</button>
                              </div>
                            )}
                          </td>
                          <td className="cq-td" style={{textAlign:'center',fontWeight:600,color:TXTM}}>S/{typeof p.precio_unitario==='number'?p.precio_unitario.toFixed(2):'0.00'}</td>
                          <td className="cq-td" style={{textAlign:'center',fontWeight:800,color:CELESTE2}}>S/{total.toFixed(2)}</td>
                          <td className="cq-td" style={{textAlign:'center'}}>
                            <div style={{display:'flex',gap:5,justifyContent:'center'}}>
                              {p.tipo_producto==='CORTE'&&p.cortes_detalles&&(
                                <button style={{width:22,height:22,borderRadius:6,border:'none',cursor:'pointer',background:'rgba(128,194,220,.16)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .14s'}}
                                  onMouseEnter={e=>e.currentTarget.style.background='rgba(128,194,220,.30)'}
                                  onMouseLeave={e=>e.currentTarget.style.background='rgba(128,194,220,.16)'}
                                  onClick={()=>{setProductoEnEdicion(p);setProductoSeleccionadoCortes({codigo:p.codigo.replace('CORTE-',''),nombre:p.nombre.replace(/ (\d+ CORTES)$/,''),categoria:p.categoria,precio_unitario:p.precio_unitario});setModalCortesVisible(true);}}>
                                  <IconEdit size={11} color={CELESTE2}/>
                                </button>
                              )}
                              <button style={{width:22,height:22,borderRadius:6,border:'none',cursor:'pointer',background:'rgba(148,25,24,.10)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .14s'}}
                                onMouseEnter={e=>e.currentTarget.style.background='rgba(148,25,24,.22)'}
                                onMouseLeave={e=>e.currentTarget.style.background='rgba(148,25,24,.10)'}
                                onClick={()=>{eliminarProductoCotizacion(p.__cotiz_id);setCotizacionProductos(obtenerProductosCotizacion());}}>
                                <IconTrash size={11} color={RED}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total + acciones */}
            <div className="cq-total-row">
              <div>
                <div style={{fontSize:9,fontFamily:FM,fontWeight:700,color:TXTD,letterSpacing:.8,textTransform:'uppercase',marginBottom:2}}>Total cotizaci\u00f3n</div>
                <div style={{fontFamily:FM,fontWeight:800,fontSize:20,color:CELESTE2}}>S/ {totalCotizacion.toFixed(2)}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="cq-btn-red" style={{padding:'8px 14px',fontSize:11}}
                  onClick={()=>{if(confirm('\u00bfLimpiar toda la cotizaci\u00f3n?')){limpiarCotizacion();setCotizacionProductos([]);}}}>
                  <IconTrash size={12}/> Limpiar
                </button>
                <button className="cq-btn-compra"
                  disabled={(estadoRegistro !== 'registered' && estadoRegistro !== 'unregistered') || cotizacionProductos.length === 0}
                  style={((estadoRegistro !== 'registered' && estadoRegistro !== 'unregistered') || cotizacionProductos.length === 0) ? {opacity:.45,cursor:'not-allowed',animation:'none'} : {}}
                  onClick={()=>setModalPagoOpen(true)}>
                  <IconShoppingCartPlus size={14}/> Realizar compra
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* ══ DERECHA: catálogo ══ */}
      <div className="cq-side">
        <div className="cq-card" style={{flex:1}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)',pointerEvents:'none'}}/>
          <div className="cq-card-head">
            <IconTag size={13} color={RED}/>
            <span style={{fontFamily:FH,fontWeight:700,fontSize:13,color:TXT,flex:1}}>Catálogo</span>
            <span style={{fontSize:10,fontFamily:FM,color:TXTD}}>{filteredProductsFiltered.length} producto{filteredProductsFiltered.length!==1?'s':''}</span>
          </div>
          <div style={{padding:'12px 14px 0'}}>
            <div style={{position:'relative',marginBottom:10}}>
              <IconSearch size={13} color={TXTD} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
              <input className="cq-input cq-input-search" type="text" placeholder="Buscar producto…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
              <button className={`cq-cat${!categoriaSeleccionada?' active':''}`} onClick={()=>setCategoriaSeleccionada('')}>Todos</button>
              {categorias.map(cat=>(
                <button key={cat} className={`cq-cat${categoriaSeleccionada===cat?' active':''}`} onClick={()=>setCategoriaSeleccionada(cat)}>{cat}</button>
              ))}
            </div>
          </div>
          <div style={{padding:'0 14px 14px'}}>
            <div className="cq-prod-scroll" ref={productsScrollRef} onScroll={onScrollProductos}>
              {filteredProductsFiltered.length===0?(
                <div style={{textAlign:'center',padding:'28px 0',color:TXTD,fontSize:11,fontFamily:FM}}>Sin productos</div>
              ):(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {productosVisibles.map(p=>{
                    const sinStock = Number(p.cantidad??-1) === 0;
                    return (
                    <div key={p.id_producto} className="cq-prod-card" style={{position:'relative'}}>
                      {/* Imagen con nombre encima */}
                      <div className="cq-prod-img-wrap">
                        {p.IMG_P?<img src={p.IMG_P} alt={p.nombre}/>:(
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                            <IconPackage size={36} color={CELESTE} style={{opacity:.45}}/>
                          </div>
                        )}
                        <div className="cq-prod-overlay">
                          <div style={{fontFamily:FH,fontWeight:700,fontSize:11.5,color:'rgba(255,255,255,.96)',lineHeight:1.25,textShadow:'0 1px 3px rgba(0,0,0,.5)',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                            {p.nombre}
                          </div>
                        </div>
                      </div>
                      {/* Cuerpo */}
                      <div className="cq-prod-body">
                        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:4}}>
                          {p.codigo&&<span className="cq-chip" style={{fontSize:9}}>{p.codigo}</span>}
                          {p.categoria&&<span className="cq-chip" style={{fontSize:9}}>{p.categoria}</span>}
                        </div>
                        {p.descripcion&&(
                          <div style={{fontFamily:FB,fontSize:10.5,color:TXTL,marginBottom:5,lineHeight:1.35,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                            {p.descripcion}
                          </div>
                        )}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
                          <div style={{fontFamily:FM,fontWeight:800,fontSize:13,color:RED}}>S/ {Number(p.precio_unitario||0).toFixed(2)}</div>
                          <div style={{fontSize:9,fontFamily:FM,color:TXTD}}>Stock: <strong style={{color:Number(p.cantidad||0)>0?CELESTE2:RED}}>{p.cantidad??'N/A'}</strong></div>
                        </div>
                        <button className="cq-plus-btn"
                          disabled={sinStock}
                          style={sinStock?{opacity:.45,cursor:'not-allowed',background:'rgba(180,180,180,.10)',borderColor:'rgba(180,180,180,.28)',color:'#9ca3af'}:{}}
                          onClick={()=>{
                            if(sinStock)return;
                            if (p.categoria==='VIDRIOS'||p.categoria==='ALUMINIOS'){setProductoSeleccionadoTipo(p);setModalTipoProductoVisible(true);}
                            else{setPopoverProducto(p);setPopoverCantidad(1);}
                          }}>
                          <IconPlus size={11}/> {sinStock?'Sin stock':'Agregar'}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
              {filteredProductsFiltered.length > productosVisibles.length && (
                <div style={{textAlign:'center',padding:'12px 0 4px',fontSize:10,fontFamily:FM,color:TXTD}}>
                  Desliza para cargar más productos...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

            {/* ── Popover flotante ── */}
      {popoverProducto && (
        <div 
          ref={popoverRef}
          className="cq-popover"
          style={{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
          }}>
          <div className="cq-popover-title">
            <IconPackage size={13} color={CELESTE2}/> CANTIDAD
          </div>
          <input 
            className="cq-input" 
            type="text" 
            inputMode="numeric"
            value={popoverCantidad}
            onChange={e=>{
              const val = e.target.value.replace(/[^0-9]/g, '');
              if (val === '') {
                setPopoverCantidad('');
              } else {
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0) {
                  setPopoverCantidad(num);
                }
              }
            }}
            placeholder="Ej: 1"
            style={{textAlign:'center',marginBottom:8,width:'100%',fontSize:18,fontWeight:800,padding:'10px',letterSpacing:'.5px'}}
            autoFocus/>
          {popoverCantidad && Number(popoverCantidad) > 0 && (
            <div style={{fontSize:10,fontWeight:700,marginBottom:10,fontFamily:FM,color:'#1a7a4a',display:'flex',alignItems:'center',gap:4}}>
              <IconCheck size={11} color="#1a7a4a"/> Cantidad válida
            </div>
          )}
          <button className="cq-pop-confirm"
            disabled={!popoverCantidad||(Number(popoverCantidad)??0)<1}
            onClick={()=>{
              const cantFinal=Number(popoverCantidad);
              if (cantFinal < 1) return;
              const tipoProducto=popoverProducto.tipo_producto||'PRODUCTO';
              agregarItemCotizacion(popoverProducto, tipoProducto, cantFinal);
              setPopoverProducto(null);setPopoverCantidad(1);
            }}>
            <IconCheck size={12}/> Agregar
          </button>
          <button className="cq-pop-cancel" onClick={()=>{setPopoverProducto(null);setPopoverCantidad(1);}}>
            Cancelar
          </button>
        </div>
      )}

      {/* ── Modales ── */}
      <ModalMetodoPago open={modalPagoOpen} onClose={()=>setModalPagoOpen(false)}
        onSelect={async(metodo)=>{
          setModalPagoOpen(false);
          if (!tipoDocumentoSeleccionado||!digitos){alert('Seleccione tipo y número de documento');return;}
          const productos=cotizacionProductos
            .filter(p=>p.tipo_producto!=='CORTE')
            .map(p=>({id_producto:p.id_producto,nombre:p.nombre,cantidad:p.cantidad}));
          const cortes=cotizacionProductos.filter(p=>p.tipo_producto==='CORTE').flatMap(c=>(Array.isArray(c.cortes_detalles)?c.cortes_detalles:[]).map(d=>({ancho_cm:Number(d?.ancho??d?.ancho_cm??0),alto_cm:Number(d?.alto??d?.alto_cm??0),cantidad:Number(d?.cantidad??1),producto_id:c.id_producto,nombre:c.nombre,categoria:c.categoria||''})));
          const nombreApiPeru=(nombreCliente||'').trim();

          setCompraPendienteCtx({ metodo, productos, cortes, nombreApiPeru });

          const productosParaFacturacion = cotizacionProductos.map((p) => ({
            codigo: p.codigo || p.id_producto,
            descripcion: p.nombre || p.descripcion || 'Producto VIDRIOBRAS',
            cantidad: Number(p.cantidad || 1),
            precio_unitario: Number(p.precio_unitario || 0),
            subtotal: Number((Number(p.cantidad || 1) * Number(p.precio_unitario || 0)).toFixed(2)),
            cortes_detalles: Array.isArray(p.cortes_detalles) ? p.cortes_detalles : [],
            categoria: p.categoria,
          }));
          setFacturacionProductos(productosParaFacturacion);
          setModalFacturacionOpen(true);
        }}/>

      {modalFacturacionOpen && (
        <ModalFacturacion
          productos={facturacionProductos}
          clienteActual={{
            nombre: (nombreCliente || '').trim(),
            documento: (digitos || '').trim(),
            correo: (correoCliente || '').trim(),
          }}
          deferRegistroPago={true}
          onClose={() => {
            setModalFacturacionOpen(false);
            setCompraPendienteCtx(null);
          }}
          onComprobanteGenerado={async (comprobanteData) => {
            const ctx = compraPendienteCtx;
            setModalFacturacionOpen(false);
            if (!ctx) {
              alert('No se encontró la compra pendiente para finalizar.');
              return;
            }
            await procesarCompraFinal(ctx, comprobanteData);
            setCompraPendienteCtx(null);
          }}
        />
      )}

      {modalTipoProductoVisible&&productoSeleccionadoTipo&&(
        <ModalTipoProductoVidrio producto={productoSeleccionadoTipo} tipoProducto={productoSeleccionadoTipo.categoria}
          onCancel={()=>{setModalTipoProductoVisible(false);setProductoSeleccionadoTipo(null);}}
          onPlancha={()=>{setProductoSeleccionadoTipo(p=>({...p,tipo_producto:'PLANCHA'}));setModalTipoProductoVisible(false);setPopoverProducto({...productoSeleccionadoTipo,tipo_producto:'PLANCHA'});setPopoverCantidad(1);}}
          onVara={()=>{setProductoSeleccionadoTipo(p=>({...p,tipo_producto:'VARA'}));setModalTipoProductoVisible(false);setPopoverProducto({...productoSeleccionadoTipo,tipo_producto:'VARA'});setPopoverCantidad(1);}}
          onCortes={()=>{setModalTipoProductoVisible(false);setProductoSeleccionadoCortes(productoSeleccionadoTipo);setProductoEnEdicion(null);setModalCortesVisible(true);}}/>
      )}

      {modalCortesVisible&&productoSeleccionadoCortes&&(
        <ModalIngresoCortes producto={productoSeleccionadoCortes} tipoProducto={productoSeleccionadoCortes.categoria}
          cortesExistentes={productoEnEdicion?.cortes_detalles||null}
          onGuardarCorte={(corteData)=>{
            if(productoEnEdicion)eliminarProductoCotizacion(productoEnEdicion.__cotiz_id);
            agregarProductoCotizacion({codigo:`CORTE-${corteData.producto_original.codigo}`,nombre:`${corteData.producto_original.nombre} (${corteData.cantidad_total_piezas||corteData.total_cortes} CORTES)`,cantidad:corteData.cantidad_total_piezas||corteData.total_cortes,precio_unitario:corteData.precio_unitario_promedio||corteData.precio_unitario,subtotal:corteData.subtotal,descripcion:corteData.descripcion_detallada,id_producto:productoSeleccionadoCortes.id_producto,tipo_producto:'CORTE',categoria:productoSeleccionadoCortes.categoria,cortes_detalles:corteData.cortes_detalles,total_cortes:corteData.total_cortes,cantidad_total_piezas:corteData.cantidad_total_piezas});
            setCotizacionProductos(obtenerProductosCotizacion());
            setModalCortesVisible(false);setProductoSeleccionadoCortes(null);setProductoEnEdicion(null);
          }}
          onCancel={()=>{setModalCortesVisible(false);setProductoSeleccionadoCortes(null);setProductoEnEdicion(null);}}/>
      )}

      {generandoQr && (
        <div className="cq-qr-loading">
          <div className="cq-qr-loading-card">
            <div style={{fontFamily:FH,fontWeight:800,fontSize:20,color:TXT,marginBottom:4}}>Generando credenciales y QR</div>
            <div style={{fontFamily:FM,fontSize:12,color:TXTL}}>Un momento, estamos preparando el acceso del cliente...</div>
            <div className="cq-qr-dots">
              <span className="cq-qr-dot" />
              <span className="cq-qr-dot" />
              <span className="cq-qr-dot" />
            </div>
            <div className="cq-qr-bars">
              <span className="cq-qr-bar" />
              <span className="cq-qr-bar" />
              <span className="cq-qr-bar" />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal credenciales + QR ── */}
      {modalCredenciales && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'linear-gradient(145deg,#eaf8ff,#cceeff)',borderRadius:20,padding:'36px 32px',maxWidth:440,width:'100%',boxShadow:'0 0 60px rgba(90,139,168,.35)',border:'1px solid rgba(128,194,220,.45)',textAlign:'center',fontFamily:'Arial,sans-serif'}}>
            {/* Header */}
            <div style={{color:RED,fontWeight:900,fontSize:22,letterSpacing:2,marginBottom:4}}>VIDRIOBRAS</div>
            <div style={{color:CELESTE2,fontWeight:700,fontSize:15,marginBottom:24}}>Cuenta temporal creada</div>

            {/* Credenciales */}
            <div style={{background:'rgba(128,194,220,.08)',border:'1px solid rgba(128,194,220,.22)',borderRadius:12,padding:'16px 20px',marginBottom:20,textAlign:'left'}}>
              <div style={{marginBottom:12}}>
                <div style={{color:TXTD,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Correo electrónico</div>
                <div style={{color:TXT,fontWeight:700,fontSize:14,wordBreak:'break-all'}}>{modalCredenciales.correo}</div>
              </div>
              <div>
                <div style={{color:TXTD,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Contraseña (tu DNI/RUC)</div>
                <div style={{color:AMARILLO,fontWeight:900,fontSize:18,letterSpacing:3}}>{modalCredenciales.contrasena}</div>
              </div>
            </div>

            {/* QR */}
            <div style={{marginBottom:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{color:TXTD,fontSize:11,marginBottom:10}}>Escanea para ingresar directamente a tu panel</div>
              <img src={modalCredenciales.qrDataUrl} alt="QR acceso" width={180} height={180}
                style={{borderRadius:12,border:`3px solid ${RED}`,background:'#fff',padding:4}}/>
            </div>

            {/* Aviso */}
            <div style={{color:'#5a7a90',fontSize:11,marginBottom:24,lineHeight:1.6,textAlign:'left',background:'rgba(255,255,255,.55)',border:'1px solid rgba(128,194,220,.35)',borderRadius:8,padding:'10px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontWeight:700,color:'#2d4a62'}}>
                <IconExclamationMark stroke={1.25} size={14} color={RED}/> Estos datos son personales.
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'#2d4a62'}}>
                <IconAlarm stroke={1.25} size={14} color={CELESTE2}/> Si no completas el registro, la cuenta se elimina automáticamente a la 1:00 AM.
              </div>
            </div>

            {/* Botones */}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>imprimirCredenciales(modalCredenciales)}
                style={{flex:1,padding:'11px 0',borderRadius:10,background:RED,border:'none',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer',letterSpacing:.5}}>
                🖨 Imprimir PDF
              </button>
              <button onClick={()=>setModalCredenciales(null)}
                style={{flex:1,padding:'11px 0',borderRadius:10,background:'rgba(128,194,220,.12)',border:'1px solid rgba(128,194,220,.30)',color:CELESTE,fontWeight:700,fontSize:13,cursor:'pointer'}}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {credencialParaImprimir && (
        <div className="cq-print-sheet">
          <div style={{maxWidth:520,margin:'0 auto'}}>
            <div style={{color:RED,fontSize:26,fontWeight:900,letterSpacing:2,marginBottom:4}}>VIDRIOBRAS</div>
            <div style={{color:CELESTE2,fontSize:13,marginBottom:24,fontWeight:600}}>Acceso a tu cuenta temporal</div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Correo electrónico</div>
              <div style={{fontSize:16,fontWeight:700,background:'#f1f8fc',padding:'10px 14px',borderRadius:8,border:'1px solid #cde5f1',wordBreak:'break-all'}}>{credencialParaImprimir.correo}</div>
            </div>

            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Contraseña (tu DNI o RUC)</div>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:4,color:RED,background:'#fff3d6',padding:'10px 14px',borderRadius:8,border:'1px solid #ffd98a'}}>{credencialParaImprimir.contrasena}</div>
            </div>

            <div style={{textAlign:'center',margin:'24px 0 16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{fontSize:11,color:'#6b7280',marginBottom:10}}>Escanea para ingresar directamente</div>
              <img src={credencialParaImprimir.qrDataUrl} width={200} height={200} alt="QR acceso" style={{border:`3px solid ${RED}`,borderRadius:10,padding:4,background:'#fff'}}/>
              <div style={{fontSize:10,color:'#9ca3af',marginTop:8,wordBreak:'break-all',textAlign:'center',maxWidth:420}}>{credencialParaImprimir.qrUrl}</div>
            </div>

            <div style={{fontSize:11,color:'#374151',lineHeight:1.7,background:'#eef9ff',border:'1px solid #bfe5f6',borderRadius:8,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontWeight:700}}>
                <IconExclamationMark stroke={1.25} size={14} color={RED}/> Estos datos son personales.
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <IconAlarm stroke={1.25} size={14} color={CELESTE2}/> Si no completas tu registro, la cuenta se elimina automáticamente a la 1:00 AM.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CotizacionView;