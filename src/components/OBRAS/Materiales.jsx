import { useState, useEffect, useMemo } from 'react';
import { FONTS } from '../../colors';
import { construirReporteEntrega } from '../../utils/entregaReporte';
import {
  IconLoader, IconCheck, IconPackage,
  IconAlertTriangle, IconPlus, IconMinus, IconX,
} from '@tabler/icons-react';

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const T = {
  border:     'rgba(128,194,220,.22)',
  borderMid:  'rgba(128,194,220,.38)',
  borderStr:  'rgba(128,194,220,.60)',
  brand:      '#5a8ba8',
  brandMid:   '#80C2DC',
  brandSoft:  'rgba(128,194,220,.12)',
  brandSoft2: 'rgba(128,194,220,.20)',
  red:        '#941918',
  redMid:     '#b01f1e',
  text:       '#1a2a3a',
  textMid:    '#2d4a62',
  textLight:  '#5a7a90',
  textDim:    '#8aa8bc',
  white:      '#ffffff',
  fontHead:   FONTS.heading,
  fontBody:   FONTS.body,
  fontMono:   "'IBM Plex Mono',monospace",
};

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@keyframes mlFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes mlSpin{to{transform:rotate(360deg)}}
@keyframes mlShine{0%{left:-80%}100%{left:130%}}
@keyframes mlRow{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-18px) scale(.94)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}to{opacity:0;transform:translateX(-50%) translateY(-12px) scale(.96)}}
@keyframes toastShine{0%{left:-80%}100%{left:130%}}
@keyframes toastBar{from{width:100%}to{width:0%}}

/* ── Toast ── */
.ml-toast-wrap{position:fixed;top:28px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:10px;}
.ml-toast{position:relative;overflow:hidden;min-width:300px;max-width:480px;padding:13px 46px 13px 16px;border-radius:14px;pointer-events:all;display:flex;align-items:center;gap:11px;backdrop-filter:blur(24px) saturate(200%);-webkit-backdrop-filter:blur(24px) saturate(200%);box-shadow:0 8px 32px rgba(0,0,0,.14),0 2px 0 rgba(255,255,255,.55) inset;animation:toastIn .32s cubic-bezier(.34,1.56,.64,1) both;}
.ml-toast.exit{animation:toastOut .26s ease both}
.ml-toast.success{background:rgba(128,194,220,.22);border:1.5px solid rgba(128,194,220,.55);}
.ml-toast.success .ml-toast-icon{background:linear-gradient(135deg,rgba(128,194,220,.38),rgba(90,139,168,.28));border:1px solid rgba(128,194,220,.55);color:#2d6a8a;}
.ml-toast.success .ml-toast-bar{background:linear-gradient(90deg,#80C2DC,#5a8ba8);}
.ml-toast.success .ml-toast-text{color:#1a3a52;}
.ml-toast.success .ml-toast-close{color:#5a8ba8;}
.ml-toast.success .ml-toast-close:hover{background:rgba(128,194,220,.22);}
.ml-toast.error{background:rgba(148,25,24,.14);border:1.5px solid rgba(148,25,24,.40);}
.ml-toast.error .ml-toast-icon{background:linear-gradient(135deg,rgba(148,25,24,.22),rgba(176,31,30,.16));border:1px solid rgba(148,25,24,.40);color:#941918;}
.ml-toast.error .ml-toast-bar{background:linear-gradient(90deg,#941918,#b01f1e);}
.ml-toast.error .ml-toast-text{color:#5a1010;}
.ml-toast.error .ml-toast-close{color:#941918;}
.ml-toast.error .ml-toast-close:hover{background:rgba(148,25,24,.14);}
.ml-toast-icon{width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.ml-toast-text{flex:1;font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:600;line-height:1.45;}
.ml-toast-close{position:absolute;top:9px;right:10px;width:22px;height:22px;border-radius:6px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.ml-toast-shine{position:absolute;top:0;bottom:0;width:50px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.40),transparent);pointer-events:none;animation:toastShine 2.8s ease infinite;}
.ml-toast-bar-wrap{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,.06);}
.ml-toast-bar{height:100%;border-radius:0 0 14px 14px;animation:toastBar 3.5s linear both;}

/* ── Tarjeta glass ── */
.ml-card{border-radius:16px;position:relative;overflow:hidden;background:rgba(255,255,255,.65);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border:1.5px solid rgba(128,194,220,.38);box-shadow:0 6px 24px rgba(90,139,168,.14),0 1px 0 rgba(255,255,255,.9) inset;animation:mlFade .28s ease both;transition:box-shadow .2s,border-color .2s;}
.ml-card:hover{box-shadow:0 12px 36px rgba(90,139,168,.20),0 2px 0 rgba(255,255,255,.95) inset;border-color:rgba(128,194,220,.60);}
.ml-sec-head{padding:13px 18px 12px;background:rgba(255,255,255,.40);border-bottom:1px solid rgba(128,194,220,.22);display:flex;align-items:center;gap:10px;}

/* ── Tabla glass ── */
.ml-table{width:100%;border-collapse:collapse;font-size:12px;}
.ml-thead th{padding:9px 12px;text-align:left;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#5a7a90;background:rgba(232,246,252,.65);border-bottom:1.5px solid rgba(128,194,220,.28);position:sticky;top:0;z-index:2;backdrop-filter:blur(8px);}
.ml-thead th:first-child{border-radius:10px 0 0 0}
.ml-thead th:last-child{border-radius:0 10px 0 0}
.ml-row{border-bottom:1px solid rgba(128,194,220,.14);transition:background .15s;animation:mlRow .2s ease both;}
.ml-row:hover{background:rgba(232,246,252,.50)}
.ml-row.selected{background:linear-gradient(90deg,rgba(128,194,220,.10),rgba(232,246,252,.18));border-bottom-color:rgba(128,194,220,.22);}
.ml-row td{padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#2d4a62;vertical-align:middle;}

/* ── Checkbox glass ── */
.ml-check-wrap{width:20px;height:20px;border-radius:6px;background:rgba(255,255,255,.80);border:1.5px solid rgba(128,194,220,.45);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 6px rgba(90,139,168,.10),inset 0 1px 0 rgba(255,255,255,.9);transition:all .18s cubic-bezier(.34,1.56,.64,1);flex-shrink:0;}
.ml-check-wrap.checked{background:linear-gradient(135deg,#80C2DC,#5a8ba8);border-color:#5a8ba8;box-shadow:0 4px 12px rgba(128,194,220,.38),inset 0 1px 0 rgba(255,255,255,.25);transform:scale(1.08);}

/* ── Badge / chip ── */
.ml-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:999px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;background:rgba(128,194,220,.12);border:1px solid rgba(128,194,220,.32);color:#5a7a90;}
.ml-chip-count{background:linear-gradient(135deg,rgba(128,194,220,.25),rgba(90,139,168,.18));border:1px solid rgba(128,194,220,.45);color:#2d4a62;}

/* ── Scroll ── */
.ml-scroll{max-height:430px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(128,194,220,.35) transparent;}
.ml-scroll::-webkit-scrollbar{width:5px}
.ml-scroll::-webkit-scrollbar-track{background:transparent}
.ml-scroll::-webkit-scrollbar-thumb{background:rgba(128,194,220,.35);border-radius:999px}
.ml-table-wrap{overflow:auto}

@media (max-width: 900px){
  .ml-table{min-width:980px}
}

@media (max-width: 640px){
  .ml-sec-head{flex-wrap:wrap}
  .ml-save{width:100%;max-width:340px}
}

.ml-shine{position:absolute;top:0;bottom:0;width:60px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);pointer-events:none;z-index:1;animation:mlShine 3s ease infinite;}

/* ── Botón guardar ── */
.ml-save{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 52px;border-radius:13px;cursor:pointer;background:linear-gradient(180deg,rgba(148,25,24,.15) 0%,rgba(148,25,24,.24) 100%);color:#941918;font-size:14px;font-weight:700;letter-spacing:.5px;border:1.5px solid rgba(148,25,24,.32);box-shadow:inset 0 3px 8px rgba(148,25,24,.18),inset 0 1px 3px rgba(148,25,24,.10),0 1px 0 rgba(255,255,255,.85);transition:all .18s cubic-bezier(.4,0,.2,1);}
.ml-save:hover:not(:disabled){background:linear-gradient(180deg,rgba(148,25,24,.19) 0%,rgba(148,25,24,.29) 100%);box-shadow:inset 0 4px 10px rgba(148,25,24,.24),inset 0 1px 4px rgba(148,25,24,.14),0 1px 0 rgba(255,255,255,.85);}
.ml-save:active:not(:disabled){box-shadow:inset 0 5px 14px rgba(148,25,24,.30),inset 0 2px 6px rgba(148,25,24,.18),0 1px 0 rgba(255,255,255,.70);transform:translateY(1px);}
.ml-save:disabled{opacity:.5;cursor:not-allowed}

.ml-empty{padding:36px 0;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#8aa8bc;}
`;

let _css = false;
function injectCSS() {
  if (_css || typeof document === 'undefined') return;
  _css = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─── COLUMNAS ────────────────────────────────────────────────────────────── */
const COLS = [
  { key:'sel',            label:'',             center:true,  w:40  },
  { key:'nombre',         label:'Producto',     center:false, w:null},
  { key:'descripcion',    label:'Descripción',  center:false, w:null},
  { key:'codigo',         label:'Código',       center:false, w:100 },
  { key:'grosor',         label:'Grosor',       center:true,  w:70  },
  { key:'categoria',      label:'Categoría',    center:false, w:110 },
  { key:'ubicacion',      label:'Ubicación',    center:true,  w:80  },
  { key:'stock_cantidad', label:'Stock',        center:true,  w:60  },
  { key:'precio_unitario',label:'Precio Unit.', center:true,  w:110 },
  { key:'cant_cliente',   label:'Cant. cliente',center:true,  w:110 },
  { key:'subtotal',       label:'Subtotal',     center:true,  w:120 },
];

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
const Materiales = ({ notificacion, onToast, onGuardarSuccess }) => {
  injectCSS();

  const formatearSoles = (monto) =>
    Number(monto||0).toLocaleString('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2,maximumFractionDigits:2});

  const [busquedaProducto,      setBusquedaProducto]      = useState('');
  const [productosDisponibles,  setProductosDisponibles]  = useState([]);
  const [productosSeleccionados,setProductosSeleccionados]= useState([]);
  const [carritoId,             setCarritoId]             = useState('');
  const [soloCortes,            setSoloCortes]            = useState(false);
  const [cargando,  setCargando]  = useState(false);
  const [guardando, setGuardando] = useState(false);

  const showToast = (mensaje, tipo = 'success') => {
    onToast?.(mensaje, tipo);
  };

  /* ─ fetch ─ */
  useEffect(() => {
    const fetchProductos = async () => {
      if (!notificacion?.id) return;
      setCargando(true);
      try {
        const response = await fetch(`/api/entrega/productos/notificacion/${notificacion.id}`);
        const data = await response.json();
        if (data.success) {
          setProductosDisponibles(Array.isArray(data.data) ? data.data : []);
          setCarritoId(String(data.carrito_id||'').trim());
          setSoloCortes(!!data.solo_cortes);
          if (!Array.isArray(data.data)||data.data.length===0)
            showToast(data.message||'El cliente no agregó productos','success');
        } else {
          showToast(data.message||data.error||'Error al cargar productos','error');
        }
      } catch { showToast('Error al conectar con el servidor','error'); }
      finally { setCargando(false); }
    };
    fetchProductos();
  }, [notificacion?.id]);

  /* ─ filtro ─ */
  const productosFiltrados = useMemo(() =>
    (productosDisponibles||[]).filter(p => {
      const nombre=(p.nombre||'').toLowerCase(), codigo=(p.codigo||'').toLowerCase();
      const term=busquedaProducto.toLowerCase();
      return nombre.includes(term)||codigo.includes(term);
    }), [productosDisponibles,busquedaProducto]);

  /* ─ handlers ─ */
  const handleSeleccionarProducto = (producto) => {
    if (productosSeleccionados.some(p=>p.producto_id===producto.producto_id)) {
      setProductosSeleccionados(productosSeleccionados.filter(p=>p.producto_id!==producto.producto_id));
    } else {
      const cantidadInicial=(producto.cantidad_cliente||0)>0?producto.cantidad_cliente:1;
      setProductosSeleccionados([...productosSeleccionados,{...producto,cantidad_seleccionada:cantidadInicial}]);
    }
  };

  const handleEliminarProducto = (id) =>
    setProductosSeleccionados(productosSeleccionados.filter(p=>p.producto_id!==id));

  const handleIncrementarCantidad = (id) =>
    setProductosSeleccionados(productosSeleccionados.map(p => {
      if (p.producto_id!==id) return p;
      return { ...p, cantidad_seleccionada:Math.min((p.cantidad_seleccionada||1)+1,p.cantidad_cliente||1) };
    }));

  const handleDecrementarCantidad = (id) =>
    setProductosSeleccionados(productosSeleccionados
      .map(p => p.producto_id!==id ? p : { ...p,cantidad_seleccionada:Math.max(1,(p.cantidad_seleccionada||1)-1) })
      .filter(p=>p.cantidad_seleccionada>0));

  const obtenerSeleccionado = (productoId) =>
    productosSeleccionados.find(p=>p.producto_id===productoId);

  /* ─ guardar ─ */
  const handleGuardar = async () => {
    const totalReq = (productosDisponibles||[]).length;
    const totalSel = (productosSeleccionados||[]).length;

    // Si solo hay cortes, omitir validacion de seleccion y avanzar directo
    if (!soloCortes && totalReq>0&&totalSel<totalReq) {
      showToast(`Debes seleccionar todos los productos para continuar a cortes (${totalSel}/${totalReq})`,'error');
      return;
    }

    setGuardando(true);
    try {
      const items = productosSeleccionados.filter(p=>p.producto_id)
        .map(p=>({ producto_id:p.producto_id, cantidad:parseFloat(p.cantidad_seleccionada)||1 }));

      if (items.length===0) { showToast('Los productos seleccionados no tienen ID válido','error'); setGuardando(false); return; }

      let carrito_id = String(carritoId||'').trim();
      if (!carrito_id&&notificacion?.id) {
        try {
          const res=await fetch(`/api/entrega/productos/notificacion/${notificacion.id}`);
          const d=await res.json();
          carrito_id=String(d?.carrito_id||'').trim();
          if (carrito_id) setCarritoId(carrito_id);
        } catch {}
      }
      if (!carrito_id) { showToast('No se encontró el carrito asociado','error'); setGuardando(false); return; }

      console.log('Confirmando productos:',{ carrito_id,items });

      const resConfirmar=await fetch('/api/entrega/productos/confirmar',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ carrito_id,items }),
      });
      const dataConfirmar=await resConfirmar.json();

      if (!dataConfirmar.success) {
        showToast(dataConfirmar.message||'Error al confirmar productos','error');
        console.error('Error del servidor:',dataConfirmar);
        setGuardando(false); return;
      }
      console.log('Productos confirmados:',dataConfirmar);

      const productosConUbicacion = productosSeleccionados.map(p => {
        const cantidadSeleccionada=Number(p.cantidad_seleccionada||1);
        const precioUnitario=Number(p.precio_unitario??p.precio??0);
        return { ...p,
          fila:p.almacen_fila||p.fila||'-',
          columna:p.almacen_columna||p.columna||'-',
          precio_unitario:precioUnitario,
          precio_total:Number((precioUnitario*cantidadSeleccionada).toFixed(2)),
        };
      });
      localStorage.setItem('productosSeleccionadosEntrega',JSON.stringify(productosConUbicacion));

      setProductosDisponibles(prev =>
        prev.map(prod => {
          const sel=productosSeleccionados.find(p=>p.producto_id===prod.producto_id);
          if (!sel) return prod;
          return { ...prod,cantidad_cliente:(prod.cantidad_cliente||0)-(sel.cantidad_seleccionada||0) };
        }).filter(prod=>(prod.cantidad_cliente||0)>0)
      );

      setProductosSeleccionados([]);
      showToast('Productos confirmados y guardados','success');
      onGuardarSuccess?.();
    } catch { showToast('Error al guardar','error'); }
    finally { setGuardando(false); }
  };

  const totalSeleccionados = productosSeleccionados.length;
  const totalSeleccionadosMonto = useMemo(() =>
    (productosSeleccionados||[]).reduce((sum,p) => {
      return sum + Number(p.precio_unitario??p.precio??0) * Number(p.cantidad_seleccionada||0);
    }, 0), [productosSeleccionados]);

  /* ─── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily:T.fontBody }}>

      <div className="ml-card" style={{ marginBottom:16 }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)',pointerEvents:'none'}}/>
        <div className="ml-shine"/>

        {/* Header */}
        <div className="ml-sec-head">
          <IconPackage size={15} color={T.brandMid}/>
          <span style={{ fontFamily:T.fontHead,fontWeight:700,fontSize:13,color:T.text,flex:1 }}>
            Productos disponibles
          </span>
          {soloCortes && (
            <span style={{
              background:'rgba(148,25,24,.12)',color:'#941918',border:'1px solid rgba(148,25,24,.3)',
              borderRadius:8,padding:'3px 10px',fontSize:11,fontWeight:700,fontFamily:T.fontMono,
              letterSpacing:'.03em'
            }}>
              Solo cortes
            </span>
          )}
          {totalSeleccionados > 0 && (
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <span className="ml-chip ml-chip-count">
                <IconCheck size={9}/> {totalSeleccionados} seleccionado{totalSeleccionados!==1?'s':''}
              </span>
              <span className="ml-chip ml-chip-count" title="Total valorizado en soles">
                Total: {formatearSoles(totalSeleccionadosMonto)}
              </span>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div style={{ padding:'14px 18px 18px' }}>
          <div style={{ borderRadius:12,overflow:'hidden',
            border:'1px solid rgba(128,194,220,.28)',
            background:'rgba(255,255,255,.45)',backdropFilter:'blur(10px)' }}>
            <div className="ml-scroll ml-table-wrap">
              <table className="ml-table">
                <thead className="ml-thead">
                  <tr>
                    {COLS.map(col => (
                      <th key={col.key} style={{ textAlign:col.center?'center':'left',width:col.w||undefined }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan={COLS.length}>
                      <div className="ml-empty">
                        <IconLoader size={20} color={T.brandMid} style={{ animation:'mlSpin .8s linear infinite',marginBottom:8 }}/>
                        <div>Cargando productos…</div>
                      </div>
                    </td></tr>
                  ) : productosFiltrados.length===0 ? (
                    <tr><td colSpan={COLS.length}>
                      <div className="ml-empty">
                        <IconAlertTriangle size={18} color={T.textDim} style={{ marginBottom:8 }}/>
                        <div>No se encontraron productos</div>
                      </div>
                    </td></tr>
                  ) : (
                    productosFiltrados.map((prod, rowIdx) => {
                      const seleccionado = obtenerSeleccionado(prod.producto_id);
                      const isSelected   = Boolean(seleccionado);
                      return (
                        <tr key={prod.producto_id}
                          className={`ml-row${isSelected?' selected':''}`}
                          style={{ animationDelay:`${rowIdx*18}ms` }}>

                          <td style={{ textAlign:'center' }}>
                            <div className={`ml-check-wrap${isSelected?' checked':''}`}
                              onClick={() => handleSeleccionarProducto(prod)}
                              style={{ margin:'0 auto' }}>
                              {isSelected && <IconCheck size={11} color="white"/>}
                            </div>
                          </td>

                          <td>
                            <span style={{ fontWeight:isSelected?700:500, color:isSelected?T.text:T.textMid }}>
                              {prod.nombre}
                            </span>
                          </td>

                          <td style={{ color:T.textLight }}>{prod.descripcion||'—'}</td>

                          <td>
                            {prod.codigo
                              ? <span className="ml-chip">{prod.codigo}</span>
                              : <span style={{ color:T.textDim }}>—</span>}
                          </td>

                          <td style={{ textAlign:'center',color:T.textMid }}>{prod.grosor||'—'}</td>

                          <td style={{ color:T.textLight }}>{prod.categoria||'—'}</td>

                          <td style={{ textAlign:'center' }}>
                            {prod.almacen_fila||prod.almacen_columna
                              ? <span className="ml-chip">{prod.almacen_fila||'—'}-{prod.almacen_columna||'—'}</span>
                              : <span style={{ color:T.textDim }}>—</span>}
                          </td>

                          <td style={{ textAlign:'center' }}>
                            <span style={{ fontFamily:T.fontMono,fontWeight:700,
                              color:(prod.stock_cantidad||0)>0?T.textMid:T.red,fontSize:12 }}>
                              {prod.stock_cantidad||0}
                            </span>
                          </td>

                          <td style={{ textAlign:'center' }}>
                            <span style={{ fontFamily:T.fontMono,fontWeight:700,color:T.textMid,fontSize:12 }}>
                              {formatearSoles(Number(prod.precio_unitario??prod.precio??0))}
                            </span>
                          </td>

                          <td style={{ textAlign:'center' }}>
                            {isSelected ? (
                              <span style={{ fontFamily:T.fontMono,fontWeight:700,fontSize:12,color:T.text }}>
                                {seleccionado.cantidad_seleccionada}
                              </span>
                            ) : (
                              <span style={{ fontFamily:T.fontMono,color:T.textMid,fontWeight:600,fontSize:12 }}>
                                {prod.cantidad_cliente||0}
                              </span>
                            )}
                          </td>

                          <td style={{ textAlign:'center' }}>
                            <span style={{ fontFamily:T.fontMono,fontWeight:700,color:T.text,fontSize:12 }}>
                              {formatearSoles(
                                Number(prod.precio_unitario??prod.precio??0) *
                                Number(isSelected?(seleccionado?.cantidad_seleccionada||0):(prod.cantidad_cliente||0))
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Banner solo cortes */}
      {soloCortes && (
        <div style={{
          display:'flex',alignItems:'center',gap:10,
          background:'rgba(148,25,24,.07)',border:'1px solid rgba(148,25,24,.25)',
          borderRadius:10,padding:'10px 16px',marginBottom:16,
        }}>
          <IconAlertTriangle size={16} color="#941918"/>
          <span style={{ fontFamily:T.fontBody,fontSize:12,fontWeight:600,color:'#941918' }}>
            Esta entrega contiene solo cortes. No hay productos independientes que seleccionar. Puedes continuar directamente.
          </span>
        </div>
      )}

      {/* ── Botón guardar ── */}
      <div style={{ display:'flex',justifyContent:'center',marginTop:22 }}>
        <button className="ml-save" onClick={handleGuardar} disabled={guardando}
          style={{ fontFamily:T.fontMono }}>
          {guardando
            ? <><IconLoader size={15} style={{ animation:'mlSpin .7s linear infinite' }}/> Guardando…</>
            : <><IconCheck size={15}/> Guardar</>}
        </button>
      </div>
    </div>
  );
};

export default Materiales;