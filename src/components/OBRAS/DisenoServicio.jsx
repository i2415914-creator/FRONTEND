import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { IconRuler2, IconBox, IconArrowRight, IconRefresh, IconLoader2 } from '@tabler/icons-react';
import { FONTS } from '../../colors';
import ServicioRender from './ServicioRender';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const DS_STYLE_ID = 'diseno-servicio-css';
const DS_FONT = FONTS?.heading || "'Oswald',sans-serif";
const DS_MONO = FONTS?.mono   || "'IBM Plex Mono',monospace";
const DS_BODY = FONTS?.body   || "'Open Sans',sans-serif";

const CSS = `
@keyframes ds-spin{to{transform:rotate(360deg)}}
.ds-wrap{display:flex;flex-direction:column;gap:18px;font-family:${DS_BODY}}
.ds-header{display:flex;align-items:center;gap:10px;margin-bottom:2px;flex-wrap:wrap}
.ds-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:rgba(90,139,168,.12);border:1px solid rgba(90,139,168,.3);font-family:${DS_MONO};font-size:11px;font-weight:600;color:#2d4a62;letter-spacing:.05em}
.ds-title{font-family:${DS_FONT};font-size:17px;font-weight:700;color:#1a2a3a}
.ds-cols{display:grid;grid-template-columns:1fr 340px;gap:18px;align-items:start}
.ds-left{display:flex;flex-direction:column;gap:14px}
.ds-right{display:flex;flex-direction:column;gap:12px}
.ds-card{background:rgba(255,255,255,.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(128,194,220,.25);border-radius:14px;padding:16px}
.ds-view-toggle{display:flex;border-radius:10px;overflow:hidden;border:1px solid rgba(128,194,220,.35);width:fit-content}
.ds-vbtn{padding:6px 16px;font-family:${DS_FONT};font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;color:#5a7a90;background:transparent}
.ds-vbtn.active{background:#127fc3;color:#fff}
.ds-svg-wrap{background:rgba(240,248,255,.6);border-radius:12px;border:1px solid rgba(128,194,220,.25);overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:280px;padding:16px;position:relative}
.ds-calc-overlay{position:absolute;inset:0;background:rgba(240,248,255,.7);display:flex;align-items:center;justify-content:center;border-radius:12px;backdrop-filter:blur(4px)}
.ds-dims{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.ds-dim-group{display:flex;flex-direction:column;gap:4px}
.ds-dim-label{font-family:${DS_MONO};font-size:9px;font-weight:700;letter-spacing:1.5px;color:#8aa8bc;text-transform:uppercase}
.ds-dim-input{width:86px;padding:7px 10px;border-radius:8px;border:1.5px solid rgba(128,194,220,.45);background:rgba(255,255,255,.8);font-family:${DS_MONO};font-size:14px;font-weight:600;color:#1a2a3a;outline:none;transition:border-color .15s;text-align:center}
.ds-dim-input:focus{border-color:#127fc3}
.ds-dim-unit{font-family:${DS_MONO};font-size:11px;color:#8aa8bc;align-self:center;margin-bottom:9px}
.ds-section-lbl{font-family:${DS_MONO};font-size:9px;font-weight:700;letter-spacing:1.8px;color:#8aa8bc;text-transform:uppercase;margin-bottom:8px}
.ds-mat-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.ds-mat-name{font-family:${DS_FONT};font-size:13px;font-weight:600;color:#2d4a62}
.ds-mat-val{font-family:${DS_MONO};font-size:13px;font-weight:700;color:#127fc3}
.ds-bar-bg{height:6px;border-radius:999px;background:rgba(128,194,220,.2);overflow:hidden;margin-bottom:10px}
.ds-bar-fill{height:100%;border-radius:999px;transition:width .4s ease}
.ds-cortes-list{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}
.ds-corte-item{display:flex;align-items:center;gap:6px;font-family:${DS_MONO};font-size:11px;color:#475569}
.ds-corte-dot{width:6px;height:6px;border-radius:2px;flex-shrink:0}
.ds-stat-row{font-family:${DS_MONO};font-size:11px;color:#8aa8bc;display:flex;justify-content:space-between;margin-top:3px}
.ds-stat-val{font-weight:700;color:#2d4a62}
.ds-cost-row{display:flex;align-items:baseline;gap:6px}
.ds-cost-val{font-family:${DS_FONT};font-size:20px;font-weight:700;color:#1a2a3a}
.ds-cost-sub{font-family:${DS_MONO};font-size:10px;color:#8aa8bc}
.ds-btn-continuar{width:100%;padding:12px;border-radius:11px;background:linear-gradient(135deg,#24a2df,#127fc3);border:none;cursor:pointer;font-family:${DS_FONT};font-size:15px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s;box-shadow:0 4px 16px rgba(18,127,195,.28)}
.ds-btn-continuar:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(18,127,195,.38)}
.ds-btn-continuar:active{transform:translateY(0) scale(.98)}
.ds-btn-continuar:disabled{opacity:.5;cursor:not-allowed;transform:none}
.ds-loading{display:flex;align-items:center;justify-content:center;min-height:120px;color:#8aa8bc;font-family:${DS_MONO};font-size:13px;gap:8px}
.ds-svc-tabs{display:flex;gap:6px;margin-bottom:4px;flex-wrap:wrap}
.ds-svc-tab{padding:4px 10px;border-radius:999px;border:1px solid rgba(128,194,220,.35);background:transparent;font-family:${DS_MONO};font-size:10px;font-weight:600;color:#5a7a90;cursor:pointer;transition:all .14s}
.ds-svc-tab.active{background:#127fc3;border-color:#127fc3;color:#fff}
.ds-error{padding:10px 14px;border-radius:10px;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);color:#991b1b;font-family:${DS_MONO};font-size:12px}
@media(max-width:900px){.ds-cols{grid-template-columns:1fr}.ds-right{order:-1}}
`;

function injectCSS() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(DS_STYLE_ID);
  if (!el) { el = document.createElement('style'); el.id = DS_STYLE_ID; document.head.appendChild(el); }
  if (el.textContent !== CSS) el.textContent = CSS;
}

// ─── SVG Blueprint 2D — renderiza posiciones devueltas por el backend ─────────
const CANVAS_W = 360;
const CANVAS_H = 320;
const PAD      = 56;
const ALUM_COLOR   = '#7a9ab5';
const VIDRIO_FILL  = 'rgba(180,220,255,0.22)';
const VIDRIO_STROKE = '#4a9eff';

function BlueprintSVG({ ancho, alto, diseno }) {
  const drawW  = CANVAS_W - 2 * PAD;
  const drawH  = CANVAS_H - 2 * PAD;
  const scale  = Math.min(drawW / ancho, drawH / alto);
  const rW     = ancho * scale;
  const rH     = alto  * scale;
  const rX     = PAD + (drawW - rW) / 2;
  const rY     = PAD + (drawH - rH) / 2;
  // perfil en SVG units
  const pf     = (diseno?.perfil_cm ?? 5) * scale;

  const GRID_ID  = 'ds-grid';
  const ARROW_ID = 'ds-arrow';
  const arrowOff = 22;
  const dimAnchoY = rY - arrowOff;
  const dimAltoX  = rX + rW + arrowOff;

  // Convertir coordenadas cm → SVG (origen en rX,rY)
  const toSvgX = (cmX) => rX + cmX * scale;
  const toSvgY = (cmY) => rY + cmY * scale;
  const toSvgW = (cmW) => cmW * scale;
  const toSvgH = (cmH) => cmH * scale;

  const paneles_vidrio  = diseno?.paneles_vidrio  || [];
  const paneles_solidos = diseno?.paneles_solidos || [];
  const divisores       = diseno?.divisores       || [];

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      <defs>
        <pattern id={GRID_ID} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(128,194,220,.15)" strokeWidth="0.5"/>
        </pattern>
        <marker id={ARROW_ID} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="#5a8ba8" />
        </marker>
        <marker id={`${ARROW_ID}-r`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L0,6 L6,3 Z" fill="#5a8ba8" />
        </marker>
      </defs>

      {/* Fondo cuadriculado */}
      <rect x={rX} y={rY} width={rW} height={rH} fill={`url(#${GRID_ID})`} />

      {/* Marco exterior (aluminio) */}
      <rect x={rX} y={rY} width={rW} height={rH} fill={ALUM_COLOR} opacity={0.18} rx={2} />
      <rect x={rX} y={rY} width={rW} height={rH} fill="none" stroke={ALUM_COLOR} strokeWidth={pf} rx={2} />

      {/* Divisores devueltos por el backend */}
      {divisores.map((d, i) => (
        d.tipo === 'h' ? (
          <rect
            key={`div-h-${i}`}
            x={toSvgX(d.x1)}  y={toSvgY(d.y1)}
            width={toSvgW(d.x2 - d.x1)} height={toSvgH(d.y2 - d.y1)}
            fill={ALUM_COLOR} opacity={0.8}
          />
        ) : (
          <rect
            key={`div-v-${i}`}
            x={toSvgX(d.x1)}  y={toSvgY(d.y1)}
            width={toSvgW(d.x2 - d.x1)} height={toSvgH(d.y2 - d.y1)}
            fill={ALUM_COLOR} opacity={0.8}
          />
        )
      ))}

      {/* Paneles sólidos (ej. franja ciega de puerta) */}
      {paneles_solidos.map((p, i) => (
        <rect
          key={`solid-${i}`}
          x={toSvgX(p.x)}   y={toSvgY(p.y)}
          width={toSvgW(p.ancho)} height={toSvgH(p.alto)}
          fill={ALUM_COLOR} opacity={0.45} rx={1}
        />
      ))}

      {/* Paneles de vidrio */}
      {paneles_vidrio.map((p, i) => {
        const sx = toSvgX(p.x);
        const sy = toSvgY(p.y);
        const sw = toSvgW(p.ancho);
        const sh = toSvgH(p.alto);
        return (
          <g key={`vidrio-${i}`}>
            <rect x={sx} y={sy} width={sw} height={sh} fill={VIDRIO_FILL} stroke={VIDRIO_STROKE} strokeWidth={0.8} rx={1} />
            <line x1={sx+2} y1={sy+2} x2={sx+sw-2} y2={sy+sh-2} stroke={VIDRIO_STROKE} strokeWidth={0.8} strokeDasharray="5,4" opacity={0.6} />
            <line x1={sx+sw-2} y1={sy+2} x2={sx+2} y2={sy+sh-2} stroke={VIDRIO_STROKE} strokeWidth={0.8} strokeDasharray="5,4" opacity={0.6} />
          </g>
        );
      })}

      {/* Flecha ANCHO */}
      <line
        x1={rX} y1={dimAnchoY} x2={rX+rW} y2={dimAnchoY}
        stroke="#5a8ba8" strokeWidth={1}
        markerStart={`url(#${ARROW_ID}-r)`} markerEnd={`url(#${ARROW_ID})`}
      />
      <line x1={rX} y1={rY-6} x2={rX} y2={dimAnchoY+2} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <line x1={rX+rW} y1={rY-6} x2={rX+rW} y2={dimAnchoY+2} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <text x={(2*rX+rW)/2} y={dimAnchoY-6} textAnchor="middle" fill="#1a2a3a" fontSize={11} fontFamily={DS_MONO} fontWeight="700">
        ANCHO {ancho} cm
      </text>

      {/* Flecha ALTO */}
      <line
        x1={dimAltoX} y1={rY} x2={dimAltoX} y2={rY+rH}
        stroke="#5a8ba8" strokeWidth={1}
        markerStart={`url(#${ARROW_ID}-r)`} markerEnd={`url(#${ARROW_ID})`}
      />
      <line x1={rX+rW+6} y1={rY} x2={dimAltoX-2} y2={rY} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <line x1={rX+rW+6} y1={rY+rH} x2={dimAltoX-2} y2={rY+rH} stroke="#5a8ba8" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
      <text
        x={dimAltoX+7} y={(2*rY+rH)/2}
        textAnchor="middle" fill="#1a2a3a" fontSize={11} fontFamily={DS_MONO} fontWeight="700"
        transform={`rotate(90, ${dimAltoX+7}, ${(2*rY+rH)/2})`}
      >
        ALTO {alto} cm
      </text>
    </svg>
  );
}

// ─── Barra de progreso ───────────────────────────────────────────────────────
function BarPct({ pct, color = '#127fc3' }) {
  return (
    <div className="ds-bar-bg">
      <div className="ds-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg,${color},${color}cc)` }} />
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function DisenoServicio({ notificacion, onToast, onGuardarSuccess }) {
  injectCSS();

  const notifId = useMemo(
    () => String(notificacion?.id || notificacion?.id_notificacion || '').trim(),
    [notificacion]
  );

  const [servicios,    setServicios]    = useState([]);
  const [servicioIdx,  setServicioIdx]  = useState(0);
  const [ancho,        setAncho]        = useState(100);
  const [alto,         setAlto]         = useState(100);
  const [cargando,     setCargando]     = useState(true);  // carga inicial de presupuestos
  const [calcCargando, setCalcCargando] = useState(false); // llamada al backend de diseño
  const [disenoResult, setDisenoResult] = useState(null);  // respuesta del backend
  const [calcError,    setCalcError]    = useState(null);
  const [vista3D,      setVista3D]      = useState(false);

  const debounceRef = useRef(null);

  // ── Fetch presupuestos del pedido ────────────────────────────────────────
  useEffect(() => {
    if (!notifId) { setCargando(false); return; }
    setCargando(true);
    fetch(`/api/presupuestos/notificacion/${notifId}/servicios`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const lista = Array.isArray(data) ? data : (data?.servicios || []);
        setServicios(lista);
        if (lista.length > 0) {
          setAncho(Number(lista[0].ancho) || 100);
          setAlto (Number(lista[0].alto)  || 100);
        }
      })
      .catch(() => onToast?.('No se pudo cargar la información del servicio', 'error'))
      .finally(() => setCargando(false));
  }, [notifId]);

  // Actualizar dimensiones al cambiar de servicio
  useEffect(() => {
    const s = servicios[servicioIdx];
    if (s) {
      setAncho(Number(s.ancho) || ancho);
      setAlto (Number(s.alto)  || alto);
    }
  }, [servicioIdx, servicios]);

  // ── Llamada al backend de diseño (debounced 500ms) ───────────────────────
  const llamarBackendDiseno = useCallback((nombreServicio, anchoVal, altoVal) => {
    if (anchoVal <= 0 || altoVal <= 0) return;
    setCalcCargando(true);
    setCalcError(null);
    fetch('/api/diseno-servicio/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_servicio: nombreServicio,
        ancho: anchoVal,
        alto:  altoVal,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setDisenoResult(data);
        } else {
          setCalcError(data.error || data.message || 'Error calculando diseño');
        }
      })
      .catch(() => setCalcError('No se pudo conectar con el servidor de diseño'))
      .finally(() => setCalcCargando(false));
  }, []);

  const servicio     = servicios[servicioIdx] || null;
  const nombreDisplay = servicio?.nombre_servicio
    || notificacion?.descripcion
    || notificacion?.nombre_servicio
    || 'Servicio';
  const precioDisplay = servicio?.total ? `S/. ${Number(servicio.total).toFixed(2)}` : null;

  // Cada vez que cambian nombre/ancho/alto, debounce → llama al backend
  useEffect(() => {
    if (cargando) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      llamarBackendDiseno(nombreDisplay, ancho, alto);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [nombreDisplay, ancho, alto, cargando, llamarBackendDiseno]);

  // Extraer datos del resultado
  const aluminio = disenoResult?.aluminio || null;
  const vidrio   = disenoResult?.vidrio   || null;
  const diseno   = disenoResult?.diseno   || null;
  const tipoDetectado = disenoResult?.tipo || '';

  const handleContinuar = useCallback(() => {
    onGuardarSuccess?.({
      tipo:           tipoDetectado,
      ancho,
      alto,
      nombreServicio: nombreDisplay,
      aluminio,
      vidrio,
      diseno,
    });
  }, [tipoDetectado, ancho, alto, nombreDisplay, aluminio, vidrio, diseno, onGuardarSuccess]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="ds-loading">
        <IconLoader2 size={16} style={{ animation: 'ds-spin 1s linear infinite' }} />
        Cargando servicio…
      </div>
    );
  }

  return (
    <div className="ds-wrap">
      {/* Header */}
      <div className="ds-header">
        <span className="ds-chip"><IconRuler2 size={12} /> DISEÑO</span>
        <span className="ds-title">{nombreDisplay}</span>
        {tipoDetectado && (
          <span style={{ fontFamily: DS_MONO, fontSize: 10, color: '#8aa8bc', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {tipoDetectado}
          </span>
        )}
        {precioDisplay && (
          <span style={{ marginLeft: 'auto', fontFamily: DS_MONO, fontSize: 13, fontWeight: 700, color: '#127fc3' }}>
            {precioDisplay}
          </span>
        )}
      </div>

      {/* Selector de servicios si hay más de uno */}
      {servicios.length > 1 && (
        <div className="ds-svc-tabs">
          {servicios.map((s, i) => (
            <button
              key={i}
              className={`ds-svc-tab${servicioIdx === i ? ' active' : ''}`}
              onClick={() => setServicioIdx(i)}
            >
              {s.nombre_servicio || `Servicio ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="ds-cols">
        {/* ── Columna izquierda: blueprint ──────────────────────────── */}
        <div className="ds-left">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="ds-view-toggle">
              <button className={`ds-vbtn${!vista3D ? ' active' : ''}`} onClick={() => setVista3D(false)}>2D</button>
              <button className={`ds-vbtn${vista3D ? ' active' : ''}`} onClick={() => setVista3D(true)}>
                <IconBox size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />3D
              </button>
            </div>
            <span style={{ fontFamily: DS_MONO, fontSize: 11, color: '#8aa8bc' }}>
              {ancho}×{alto} cm
            </span>
          </div>

          <div className="ds-svg-wrap">
            {vista3D ? (
              <ServicioRender
                servicio={{ nombre: tipoDetectado || nombreDisplay }}
                ancho={ancho}
                alto={alto}
                configuracion={{ hojas: 2 }}
              />
            ) : (
              <BlueprintSVG ancho={ancho} alto={alto} diseno={diseno} />
            )}
            {calcCargando && !diseno && (
              <div className="ds-calc-overlay">
                <IconLoader2 size={22} color="#127fc3" style={{ animation: 'ds-spin 1s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Inputs de dimensiones */}
          <div className="ds-card" style={{ padding: '12px 16px' }}>
            <div className="ds-dims">
              <div className="ds-dim-group">
                <span className="ds-dim-label">Ancho</span>
                <input
                  className="ds-dim-input"
                  type="number" min={10} max={1000} value={ancho}
                  onChange={e => setAncho(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <span className="ds-dim-unit">×</span>
              <div className="ds-dim-group">
                <span className="ds-dim-label">Alto</span>
                <input
                  className="ds-dim-input"
                  type="number" min={10} max={1000} value={alto}
                  onChange={e => setAlto(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <span className="ds-dim-unit">cm</span>
              {calcCargando && (
                <IconLoader2 size={14} color="#8aa8bc" style={{ animation: 'ds-spin 1s linear infinite', alignSelf: 'center', marginBottom: 8 }} />
              )}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: resultados del backend ─────────────── */}
        <div className="ds-right">
          {calcError && <div className="ds-error">{calcError}</div>}

          {/* Aluminio */}
          <div className="ds-card">
            <div className="ds-section-lbl">Aluminio</div>
            {aluminio ? (
              <>
                <div className="ds-mat-row">
                  <span className="ds-mat-name">Barras necesarias</span>
                  <span className="ds-mat-val">{aluminio.barras_necesarias} × 300 cm</span>
                </div>
                <BarPct pct={aluminio.pct_ultima} />
                <div className="ds-cortes-list">
                  {(aluminio.cortes || []).map((c, i) => (
                    <div key={i} className="ds-corte-item">
                      <span className="ds-corte-dot" style={{ background: '#127fc3' }} />
                      {c.cantidad}× {c.desc} — {c.largo} cm
                    </div>
                  ))}
                </div>
                <div className="ds-stat-row">
                  <span>Total lineal</span>
                  <span className="ds-stat-val">{aluminio.total_lineal} cm</span>
                </div>
                <div className="ds-stat-row">
                  <span>Última barra uso</span>
                  <span className="ds-stat-val">{aluminio.usado_ultima} / 300 cm ({aluminio.pct_ultima}%)</span>
                </div>
                {(aluminio.barras || []).length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div className="ds-section-lbl" style={{ marginBottom: 5 }}>Distribución en barras</div>
                    {aluminio.barras.map((b) => (
                      <div key={b.id} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: DS_MONO, fontSize: 10, color: '#5a7a90', marginBottom: 2 }}>
                          <span>Barra {b.id}</span>
                          <span>{b.usado}/{300} cm · retazo {b.retazo} cm</span>
                        </div>
                        <BarPct pct={Math.round((b.usado / 300) * 100)} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontFamily: DS_MONO, fontSize: 12, color: '#8aa8bc' }}>Calculando…</div>
            )}
          </div>

          {/* Vidrio */}
          <div className="ds-card">
            <div className="ds-section-lbl">Vidrio</div>
            {vidrio ? (
              <>
                <div className="ds-mat-row">
                  <span className="ds-mat-name">Planchas necesarias</span>
                  <span className="ds-mat-val">{vidrio.planchas_necesarias} × 300×300</span>
                </div>
                <BarPct pct={vidrio.pct_plancha} color="#22c55e" />
                <div className="ds-cortes-list">
                  {(vidrio.paneles || []).map((p, i) => (
                    <div key={i} className="ds-corte-item">
                      <span className="ds-corte-dot" style={{ background: '#22c55e' }} />
                      Panel {p.id} — {p.ancho} × {p.alto} cm
                    </div>
                  ))}
                </div>
                <div className="ds-stat-row">
                  <span>Área de vidrio</span>
                  <span className="ds-stat-val">{Number(vidrio.area_total).toLocaleString()} cm²</span>
                </div>
                <div className="ds-stat-row">
                  <span>Uso de plancha</span>
                  <span className="ds-stat-val">{vidrio.pct_plancha}%</span>
                </div>
              </>
            ) : (
              <div style={{ fontFamily: DS_MONO, fontSize: 12, color: '#8aa8bc' }}>Calculando…</div>
            )}
          </div>

          {/* Precio del servicio */}
          {precioDisplay && (
            <div className="ds-card">
              <div className="ds-section-lbl">Precio del servicio</div>
              <div className="ds-cost-row">
                <span className="ds-cost-val">{precioDisplay}</span>
                <span className="ds-cost-sub">incluye materiales e instalación</span>
              </div>
            </div>
          )}

          {/* Continuar */}
          <button
            className="ds-btn-continuar"
            onClick={handleContinuar}
            disabled={!disenoResult || calcCargando}
          >
            Continuar <IconArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
