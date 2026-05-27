import React, { useState, useEffect, useCallback, useRef } from "react";
import { IconUser, IconBuilding, IconTrash, IconEdit, IconPlus, IconCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";
import { COLORS, FONTS } from "../../colors";
import { getPresupuestos, updatePresupuesto, removePresupuesto, clearPresupuestos } from "../../utils/ramPresupuestos";
import PresupuestoServicio from "../PresupuestoServicio";

// --- CSS -----------------------------------------------------------------------
const SERVICIO_CSS = `
@keyframes svFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes svPickerIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.sv-root{font-family:${FONTS.body};padding:20px;display:grid;gap:18px;animation:svFadeUp .32s ease both}
.sv-card{background:rgba(255,255,255,.66);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);border:1.5px solid rgba(128,194,220,.36);border-radius:18px;box-shadow:0 10px 28px rgba(90,139,168,.14),inset 0 1px 0 rgba(255,255,255,.9);padding:18px}
.sv-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
.sv-title{font-family:${FONTS.heading};font-size:1.15rem;font-weight:700;color:${COLORS.text};letter-spacing:.2px}
.sv-btn{border:none;border-radius:11px;cursor:pointer;font-weight:700;font-family:${FONTS.heading};transition:all .18s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.sv-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(90,139,168,.2)}
.sv-btn:active{transform:translateY(0) scale(.98)}
.sv-btn-add{background:rgba(23,173,110,.12);color:#0b8a58;border:1px solid rgba(23,173,110,.3);padding:9px 16px}
.sv-btn-clear{background:rgba(128,194,220,.18);color:${COLORS.secondaryDark};border:1px solid rgba(128,194,220,.4);padding:10px 16px}
.sv-btn-save{background:rgba(148,25,24,.85);color:${COLORS.white};padding:10px 22px}
.sv-grid{display:grid;grid-template-columns:minmax(300px,520px) minmax(340px,560px);gap:14px;align-items:start;margin-bottom:10px}
.sv-field label{font-size:.8rem;color:${COLORS.textLight};margin-bottom:5px;display:block}
.sv-input{width:100%;padding:10px 12px;border:1.5px solid ${COLORS.border};border-radius:11px;font-family:${FONTS.body};font-size:.98rem;color:${COLORS.text};background:rgba(255,255,255,.88);outline:none;transition:all .18s ease}
.sv-input:focus{border-color:${COLORS.secondary};box-shadow:0 0 0 3px rgba(128,194,220,.18)}
.sv-doc-row{display:flex;gap:4px;flex-wrap:nowrap;align-items:center}
.sv-doc-row .sv-radio-row{flex:1 1 180px}
.sv-doc-row .sv-input{width:190px;max-width:100%}
.sv-radio-row{display:flex;gap:9px;flex-wrap:wrap}
.sv-radio-chip{display:flex;align-items:center;gap:7px;border-radius:999px;padding:7px 14px;border:1.5px solid ${COLORS.border};background:rgba(255,255,255,.82);font-weight:700;font-family:${FONTS.heading};font-size:.95rem;color:${COLORS.textLight};cursor:pointer;transition:all .2s ease}
.sv-radio-chip.active{border-color:${COLORS.primary};background:rgba(148,25,24,.08);color:${COLORS.primary};box-shadow:0 4px 12px rgba(148,25,24,.12)}
.sv-status{font-size:.9rem;font-weight:600;margin:8px 0 10px;display:flex;align-items:center;gap:6px}
.sv-status.ok{color:#0b8a58}
.sv-status.bad{color:${COLORS.error}}
.sv-notice{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:11px;border:1px solid transparent;font-size:.92rem;font-weight:700;margin-bottom:10px;animation:svFadeUp .2s ease both}
.sv-notice.warn{background:rgba(242,189,36,.14);color:#8f5c00;border-color:rgba(242,189,36,.38)}
.sv-notice.ok{background:rgba(23,173,110,.12);color:#0b8a58;border-color:rgba(23,173,110,.3)}
.sv-notice.err{background:rgba(148,25,24,.12);color:${COLORS.primary};border-color:rgba(148,25,24,.34)}
.sv-name-row{display:flex;align-items:center;gap:10px;max-width:520px}
.sv-name-row .sv-input{flex:1}
.sv-icon-dot{width:34px;height:34px;border-radius:10px;background:rgba(128,194,220,.14);border:1px solid rgba(128,194,220,.35);display:flex;align-items:center;justify-content:center;color:${COLORS.secondaryDark};flex-shrink:0}
.sv-table-wrap{overflow:auto;border-radius:14px;border:1px solid rgba(128,194,220,.28);background:rgba(255,255,255,.72)}
.sv-table{width:100%;border-collapse:collapse;min-width:620px}
.sv-table th{background:rgba(232,246,252,.9);border-bottom:1px solid rgba(128,194,220,.3);padding:11px 12px;font-family:${FONTS.heading};font-size:.9rem;color:${COLORS.text};text-align:left;white-space:nowrap}
.sv-table td{padding:9px 12px;border-bottom:1px solid rgba(128,194,220,.18);font-size:.92rem;color:${COLORS.text};vertical-align:middle}
.sv-table tr:last-child td{border-bottom:none}
.sv-table tr:hover td{background:rgba(128,194,220,.06)}
.sv-svc-cell{display:flex;align-items:center;gap:9px}
.sv-svc-thumb{width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid rgba(128,194,220,.3);flex-shrink:0}
.sv-svc-thumb-ph{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,rgba(128,194,220,.2),rgba(90,139,168,.12));display:flex;align-items:center;justify-content:center;font-size:.7rem;color:${COLORS.textLight};flex-shrink:0;border:1px solid rgba(128,194,220,.2)}
.sv-chip-btn{border:none;border-radius:9px;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;padding:0;cursor:pointer;transition:all .15s ease}
.sv-chip-edit{background:rgba(255,214,0,.18);color:#8f5c00;border:1px solid rgba(204,159,4,.35)}
.sv-chip-del{background:rgba(148,25,24,.1);color:${COLORS.primary};border:1px solid rgba(148,25,24,.28)}
.sv-chip-btn:hover{transform:scale(1.1)}
.sv-empty{padding:36px 12px;text-align:center;color:${COLORS.textLight};font-size:.95rem}
.sv-total-row td{background:rgba(232,246,252,.7);font-family:${FONTS.heading};font-weight:700}
.sv-foot{margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.sv-foot-actions{display:flex;gap:10px;flex-wrap:wrap}
/* Picker de servicio */
.sv-picker-wrap{position:relative;display:inline-block}
.sv-picker{position:absolute;right:0;top:calc(100% + 8px);width:320px;max-height:360px;overflow-y:auto;background:rgba(255,255,255,.97);border:1.5px solid rgba(128,194,220,.4);border-radius:16px;box-shadow:0 20px 48px rgba(8,21,38,.18),0 6px 16px rgba(90,139,168,.14);z-index:200;animation:svPickerIn .2s ease both;padding:8px}
.sv-picker-search{width:100%;padding:9px 12px;border:1.5px solid rgba(128,194,220,.35);border-radius:11px;font-family:${FONTS.body};font-size:.92rem;color:${COLORS.text};background:rgba(255,255,255,.9);outline:none;margin-bottom:8px;box-sizing:border-box}
.sv-picker-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;cursor:pointer;transition:background .15s ease}
.sv-picker-item:hover{background:rgba(128,194,220,.14)}
.sv-picker-img{width:38px;height:38px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid rgba(128,194,220,.28)}
.sv-picker-img-ph{width:38px;height:38px;border-radius:8px;background:linear-gradient(135deg,rgba(128,194,220,.2),rgba(90,139,168,.1));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.68rem;color:${COLORS.textLight};border:1px solid rgba(128,194,220,.18)}
.sv-picker-name{font-weight:600;font-size:.9rem;color:${COLORS.text}}
@media(max-width:900px){
  .sv-root{padding:12px;gap:14px}
  .sv-card{padding:14px}
  .sv-grid{grid-template-columns:1fr}
  .sv-doc-row .sv-input{width:100%}
  .sv-name-row{max-width:100%}
  .sv-table{min-width:520px}
  .sv-picker{width:calc(100vw - 32px);right:auto;left:0}
  .sv-btn-save,.sv-btn-clear{width:100%}
  .sv-foot{flex-direction:column}
  .sv-foot-actions{width:100%;flex-direction:column}
}
`;

let _cssInjected = false;
const TEMP_ACCESS_STORAGE_PREFIX = 'venta_servicio_temp_access:';

function injectCSS() {
  if (_cssInjected || typeof document === 'undefined') return;
  _cssInjected = true;
  const el = document.createElement('style');
  el.textContent = SERVICIO_CSS;
  document.head.appendChild(el);
}

// --- Componente ----------------------------------------------------------------
export default function Servicio() {
  injectCSS();

  // Catalogo de servicios
  const [catalogo, setCatalogo]     = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const pickerRef = useRef(null);

  // Modal PresupuestoServicio
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [editandoPresupuesto, setEditandoPresupuesto]   = useState(null);

  // Storage RAM - tabla
  const [filas, setFilas] = useState([]);

  // Datos del cliente
  const [tiposDoc, setTiposDoc]         = useState([]);
  const [tipoSel, setTipoSel]           = useState(null);
  const [digitos, setDigitos]           = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [busquedaEstado, setBusquedaEstado] = useState('');
  const [busquedaOk, setBusquedaOk]     = useState(false);
  const [cargandoDoc, setCargandoDoc]   = useState(false);

  // UI
  const [guardando, setGuardando]       = useState(false);
  const [notice, setNotice]             = useState(null);

  const showNotice = useCallback((message, type = 'warn') => {
    setNotice({ message, type });
  }, []);

  const guardarAccesoTemporal = useCallback((documento, credenciales) => {
    const doc = String(documento || '').replace(/\D/g, '');
    if (!doc || !credenciales?.jwt_temporal) return;
    try {
      localStorage.setItem(`${TEMP_ACCESS_STORAGE_PREFIX}${doc}`, JSON.stringify({
        ...credenciales,
        documento: doc,
        createdAt: Date.now(),
      }));
    } catch {
      // No bloquear el flujo principal si falla el storage.
    }
  }, []);

  const limpiarAccesoTemporal = useCallback((documento) => {
    const doc = String(documento || '').replace(/\D/g, '');
    if (!doc) return;
    try {
      localStorage.removeItem(`${TEMP_ACCESS_STORAGE_PREFIX}${doc}`);
    } catch {
      // Ignorar errores de storage.
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // Cargar catalogo y tipos doc
  useEffect(() => {
    fetch('/api/servicios')
      .then(r => r.json())
      .then(d => setCatalogo(d.data || d || []))
      .catch(() => setCatalogo([]));

    fetch('/api/tipo_documento')
      .then(r => r.json())
      .then(d => setTiposDoc(d.tipos || []))
      .catch(() => setTiposDoc([]));
  }, []);

  // Sincronizar tabla con storage RAM
  useEffect(() => {
    setFilas(getPresupuestos());

    const onNuevo = () => setFilas(getPresupuestos());
    window.addEventListener('presupuestoGuardado', onNuevo);
    return () => window.removeEventListener('presupuestoGuardado', onNuevo);
  }, []);

  // Cerrar picker al hacer clic afuera
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
        setPickerQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  // -- Busqueda de documento --------------------------------------------------
  const tipoDesc = tiposDoc.find(t => t.id_tipo === tipoSel)?.descripcion || '';

  const validarNumero = (tipo, num) => {
    if (!tipo || !num) return { ok: false, msg: 'Seleccione tipo e ingrese numero.' };
    if (tipo === 'DNI' && !/^\d{7,8}$/.test(num)) return { ok: false, msg: 'El DNI debe tener 7 u 8 digitos.' };
    if (tipo === 'RUC' && !/^\d{11}$/.test(num))  return { ok: false, msg: 'El RUC debe tener 11 digitos.' };
    return { ok: true, msg: '' };
  };

  const buscarDocumento = useCallback(async (tipo, numero) => {
    setCargandoDoc(true);
    setBusquedaEstado('Consultando...');
    setBusquedaOk(false);
    setNombreCliente('');

    const [apisRes, bdRes] = await Promise.allSettled([
      fetch('/api/consulta_documento_html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, numero }),
      }).then(r => r.json()).catch(() => null),
      fetch('/api/cliente/buscar_documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento: numero }),
      }).then(r => r.json()).catch(() => null),
    ]);

    const apisData = apisRes.status === 'fulfilled' ? apisRes.value : null;
    const bdData   = bdRes.status  === 'fulfilled' ? bdRes.value  : null;

    let nombreFinal = '';
    let estado = '';
    let esOk = false;

    if (apisData?.success && apisData.html) {
      nombreFinal = apisData.html;
      esOk = true;
    }
    if (bdData?.encontrado && bdData.cliente) {
      if (!nombreFinal) nombreFinal = bdData.cliente.nombre || '';
      estado = `Cliente encontrado en sistema${esOk ? '' : ' (sin verificar APIs Peru)'}`;
      esOk = true;
    } else if (esOk) {
      estado = 'Verificado - No registrado en sistema';
    } else {
      estado = 'No se encontro informacion para ese documento.';
    }

    setNombreCliente(nombreFinal);
    setBusquedaEstado(estado);
    setBusquedaOk(esOk);
    setCargandoDoc(false);
  }, []);

  useEffect(() => {
    if (!tipoSel || !digitos) { setBusquedaEstado(''); return; }
    const v = validarNumero(tipoDesc, digitos);
    if (!v.ok) { setBusquedaEstado(v.msg); setBusquedaOk(false); setNombreCliente(''); return; }
    const t = setTimeout(() => buscarDocumento(tipoDesc, digitos), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoSel, digitos]);

  // -- Acciones de tabla ------------------------------------------------------
  const handleEditar = (p) => {
    const svc = catalogo.find(s => s.id_servicio === p.servicio_id) || {
      id_servicio: p.servicio_id,
      nombre: p.descripcion,
      imagen_public_url: p.imagen_public_url || '',
    };
    setServicioSeleccionado(svc);
    setEditandoPresupuesto(p);
  };

  const handleEliminar = (p) => {
    removePresupuesto(p.__ram_id);
    setFilas(getPresupuestos());
  };

  const handleSaveEdited = (updated) => {
    updatePresupuesto(updated.__ram_id, updated);
    setFilas(getPresupuestos());
    setServicioSeleccionado(null);
    setEditandoPresupuesto(null);
  };

  const handleCerrarModal = () => {
    setServicioSeleccionado(null);
    setEditandoPresupuesto(null);
  };

  const handleLimpiar = () => {
    if (window.confirm('Eliminar todos los servicios de la lista?')) {
      clearPresupuestos();
      setFilas([]);
      setDigitos('');
      setNombreCliente('');
      setBusquedaEstado('');
      setBusquedaOk(false);
      setTipoSel(null);
      limpiarAccesoTemporal(digitos);
    }
  };

  // -- Picker de servicio -----------------------------------------------------
  const catalogoFiltrado = catalogo.filter(s =>
    !pickerQuery || s.nombre?.toLowerCase().includes(pickerQuery.toLowerCase())
  );

  const seleccionarServicioParaModal = (svc) => {
    setServicioSeleccionado(svc);
    setEditandoPresupuesto(null);
    setPickerOpen(false);
    setPickerQuery('');
  };

  // -- Guardar al backend -----------------------------------------------------
  const handleGuardar = async () => {
    if (!digitos.trim()) {
      showNotice('Por favor, ingrese el numero de documento del cliente.', 'warn');
      return;
    }
    if (filas.length === 0) {
      showNotice('Agregue al menos un servicio antes de guardar.', 'warn');
      return;
    }

    setGuardando(true);
    limpiarAccesoTemporal(digitos);

    const payload = {
      documento:   digitos,
      nombre_apis: nombreCliente || digitos,
      presupuestos: filas.map(f => ({
        servicio_id:  f.servicio_id,
        descripcion:  f.descripcion || '',
        ancho:        f.ancho  ? parseFloat(f.ancho)  : null,
        alto:         f.alto   ? parseFloat(f.alto)   : null,
        total:        parseFloat(f.total) || 0,
      })),
    };

    try {
      const res  = await fetch('/api/presupuesto_guardar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        if (data.cliente_creado && data.credenciales) {
          guardarAccesoTemporal(digitos, data.credenciales);
          showNotice('Servicios guardados correctamente. El acceso temporal se mostrara despues del comprobante.', 'ok');
        } else {
          showNotice(data.message || 'Servicios guardados correctamente.', 'ok');
        }
        clearPresupuestos();
        setFilas([]);
      } else {
        showNotice(data.message || 'Error al guardar.', 'err');
      }
    } catch {
      showNotice('Error de conexion con el servidor.', 'err');
    } finally {
      setGuardando(false);
    }
  };

  const totalGeneral = filas.reduce((acc, f) => acc + (parseFloat(f.total) || 0), 0);

  // -- Render -----------------------------------------------------------------
  return (
    <div className="sv-root">

      {/* -- Datos del cliente ----------------------------------------------- */}
      <div className="sv-card">
        {notice && <div className={`sv-notice ${notice.type}`}>{notice.message}</div>}

        <div className="sv-head">
          <div className="sv-title">Servicio - Datos del cliente</div>
        </div>

        <div className="sv-grid">
          <div className="sv-field">
            <label>Nombre / Razon social</label>
            <div className="sv-name-row">
              <div className="sv-icon-dot">
                {tipoDesc === 'RUC' ? <IconBuilding size={18} /> : <IconUser size={18} />}
              </div>
              <input
                type="text"
                value={nombreCliente}
                onChange={e => setNombreCliente(e.target.value)}
                placeholder="Se completa automaticamente o escribe manualmente"
                className="sv-input"
                style={{ borderColor: busquedaOk ? '#17ad6e' : undefined }}
              />
            </div>
          </div>

          <div className="sv-field">
            <label>Tipo y numero de documento</label>
            <div className="sv-doc-row">
              <div className="sv-radio-row">
                {tiposDoc.map(t => (
                  <label
                    key={t.id_tipo || t.descripcion}
                    className={`sv-radio-chip${tipoSel === t.id_tipo ? ' active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="tipo_documento"
                      value={t.id_tipo}
                      checked={tipoSel === t.id_tipo}
                      onChange={() => { setTipoSel(t.id_tipo); setDigitos(''); setBusquedaEstado(''); setBusquedaOk(false); }}
                      style={{ accentColor: COLORS.primary, width: 15, height: 15 }}
                    />
                    {t.descripcion}
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="Numero"
                value={digitos}
                onChange={e => setDigitos(e.target.value.replace(/\D/g, ''))}
                maxLength={tipoDesc === 'RUC' ? 11 : 8}
                disabled={!tipoSel}
                className="sv-input"
                style={{ opacity: tipoSel ? 1 : 0.5 }}
              />
            </div>
          </div>
        </div>

        {busquedaEstado && (
          <div className={`sv-status ${busquedaOk ? 'ok' : 'bad'}`}>
            {busquedaOk ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
            {cargandoDoc ? 'Consultando...' : busquedaEstado}
          </div>
        )}
      </div>

      {/* -- Tabla de servicios (RAM) ----------------------------------------- */}
      <div className="sv-card">
        <div className="sv-head">
          <div className="sv-title">Servicios a presupuestar</div>

          {/* Picker */}
          <div className="sv-picker-wrap" ref={pickerRef}>
            <button
              className="sv-btn sv-btn-add"
              onClick={() => { setPickerOpen(o => !o); setPickerQuery(''); }}
            >
              <IconPlus size={16} /> Agregar servicio
            </button>

            {pickerOpen && (
              <div className="sv-picker">
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar servicio..."
                  value={pickerQuery}
                  onChange={e => setPickerQuery(e.target.value)}
                  className="sv-picker-search"
                />
                {catalogoFiltrado.length === 0 && (
                  <div style={{ padding: '12px 10px', color: COLORS.textLight, fontSize: '.88rem' }}>
                    Sin resultados
                  </div>
                )}
                {catalogoFiltrado.map(svc => (
                  <div
                    key={svc.id_servicio}
                    className="sv-picker-item"
                    onClick={() => seleccionarServicioParaModal(svc)}
                  >
                    {svc.imagen_public_url
                      ? <img src={svc.imagen_public_url} alt="" className="sv-picker-img" />
                      : <div className="sv-picker-img-ph">img</div>
                    }
                    <span className="sv-picker-name">{svc.nombre}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}></th>
                <th>Servicio</th>
                <th style={{ width: 90 }}>Ancho (cm)</th>
                <th style={{ width: 90 }}>Alto (cm)</th>
                <th style={{ width: 100 }}>Total (S/)</th>
                <th style={{ width: 72 }}>Opciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan="6" className="sv-empty">
                    Presiona "+ Agregar servicio" para comenzar.
                  </td>
                </tr>
              )}
              {filas.map(p => (
                <tr key={p.__ram_id}>
                  <td>
                    {p.imagen_public_url
                      ? <img src={p.imagen_public_url} alt="" className="sv-svc-thumb" />
                      : <div className="sv-svc-thumb-ph">img</div>
                    }
                  </td>
                  <td>
                    <div className="sv-svc-cell">
                      <strong>{p.descripcion || '-'}</strong>
                    </div>
                  </td>
                  <td>{p.ancho || '-'}</td>
                  <td>{p.alto  || '-'}</td>
                  <td>S/ {parseFloat(p.total || 0).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="sv-chip-btn sv-chip-edit" onClick={() => handleEditar(p)} title="Editar">
                        <IconEdit size={15} stroke={1.5} />
                      </button>
                      <button className="sv-chip-btn sv-chip-del" onClick={() => handleEliminar(p)} title="Eliminar">
                        <IconTrash size={15} stroke={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filas.length > 0 && (
                <tr className="sv-total-row">
                  <td colSpan="4" style={{ textAlign: 'right', paddingRight: 14 }}>TOTAL</td>
                  <td>S/ {totalGeneral.toFixed(2)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sv-foot">
          <div style={{ fontSize: '.86rem', color: COLORS.textLight }}>
            {filas.length} servicio{filas.length !== 1 ? 's' : ''} en lista
          </div>
          <div className="sv-foot-actions">
            {filas.length > 0 && (
              <button className="sv-btn sv-btn-clear" onClick={handleLimpiar}>Limpiar</button>
            )}
            <button
              className="sv-btn sv-btn-save"
              onClick={handleGuardar}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar servicios'}
            </button>
          </div>
        </div>
      </div>

      {/* -- Modal PresupuestoServicio ---------------------------------------- */}
      {servicioSeleccionado && (
        <PresupuestoServicio
          selectedServicio={servicioSeleccionado}
          initialPresupuesto={editandoPresupuesto}
          onSave={editandoPresupuesto ? handleSaveEdited : null}
          handleCloseSelected={handleCerrarModal}
        />
      )}
    </div>
  );
}
