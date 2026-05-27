import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';
import { IconCards, IconRulerMeasure } from '@tabler/icons-react';

const CSS_CORTES = `
@keyframes cortesOverIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes cortesCardIn {
  from { opacity: 0; transform: translateY(26px) scale(.92) perspective(900px) rotateX(7deg); }
  to   { opacity: 1; transform: translateY(0)   scale(1) perspective(900px) rotateX(0deg);    }
}
@keyframes cortesGlassShine {
  0% { transform: translateX(-120%) skewX(-16deg); opacity: 0; }
  20% { opacity: .55; }
  100% { transform: translateX(260%) skewX(-16deg); opacity: 0; }
}
.cortes-overlay {
  position: fixed;
  top: 64px;
  left: 0; right: 0; bottom: 0;
  background: rgba(6, 14, 28, .60);
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;
  animation: cortesOverIn .20s ease both;
}
.cortes-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(155deg, rgba(255,255,255,.96) 0%, rgba(221,242,252,.92) 55%, rgba(205,232,246,.86) 100%);
  border: 1.5px solid rgba(200,236,253,.78);
  border-radius: 22px;
  padding: 32px 28px 28px;
  max-width: 620px; width: 100%;
  box-shadow:
    0 38px 70px rgba(0,0,0,.28),
    0 6px 16px rgba(0,0,0,.14),
    inset 0 1px 0 rgba(255,255,255,.95),
    inset 0 0 0 1px rgba(255,255,255,.42),
    0 0 0 1.5px rgba(128,194,220,.20);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(128,194,220,.35) transparent;
  animation: cortesCardIn .28s cubic-bezier(.34,1.32,.64,1) both;
}
.cortes-card::before {
  content: '';
  position: absolute;
  top: -1px; left: 8%; right: 8%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.95), transparent);
  pointer-events: none;
}
.cortes-card::after {
  content: '';
  position: absolute;
  top: 0; left: -62%; width: 35%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.24), transparent);
  animation: cortesGlassShine 5.4s ease-in-out infinite 1.1s;
  pointer-events: none;
}
.cortes-medida-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
`;

const COSTO_CORTE = 10;

/**
 * Modal/Panel para ingresar detalles de cortes
 * Campos dinámicos según tipo de producto:
 * - ALUMINIOS: Solo ancho O alto (una dimensión), sin espesor ni notas
 * - VIDRIOS: Ancho y alto, sin espesor ni notas
 */
const ModalIngresoCortes = ({ 
  producto,
  tipoProducto,    // 'ALUMINIOS' | 'VIDRIOS'
  cortesExistentes = null,  // Array de cortes existentes para editar
  onGuardarCorte,   // callback(corteData) - agrega a cotización
  onCancel 
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [advertenciaAncho, setAdvertenciaAncho] = useState('');
  const [advertenciaAlto, setAdvertenciaAlto] = useState('');
  const [cortesAgregados, setCortesAgregados] = useState([]);

  // Pre-poblar cortes existentes cuando estamos editando
  useEffect(() => {
    if (cortesExistentes && Array.isArray(cortesExistentes)) {
      setCortesAgregados(cortesExistentes);
    }
  }, [cortesExistentes]);

  // Determinar tipo de producto (por defecto VIDRIOS)
  const esAluminio = tipoProducto === 'ALUMINIOS';
  const esVidrio = tipoProducto === 'VIDRIOS';

  const obtenerMensajeLimite = () => (
    esAluminio
      ? 'Medida maxima 3 m. Te recomendamos comprar una barra completa.'
      : 'Medida maxima 3 m. Te recomendamos comprar una plancha completa.'
  );

  const normalizarMedida = (valor) => {
    const limpioInicial = String(valor || '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const partes = limpioInicial.split('.');
    const limpio = partes.length > 1
      ? `${partes.shift()}.${partes.join('')}`
      : limpioInicial;

    if (!limpio) {
      return { valor: '', advertencia: '' };
    }

    const numero = parseFloat(limpio);
    if (!Number.isFinite(numero) || numero <= 0) {
      return { valor: '', advertencia: '' };
    }

    if (numero >= 300) {
      return { valor: '300', advertencia: obtenerMensajeLimite() };
    }

    return { valor: limpio, advertencia: '' };
  };

  const handleMedidaChange = (valor, setter, setterAdvertencia) => {
    const { valor: valorNormalizado, advertencia } = normalizarMedida(valor);
    setter(valorNormalizado);
    setterAdvertencia(advertencia);
  };

  const calcularSubtotalCortes = (cortesLista) => {
    const precioBase = Number(producto?.precio_unitario || 0);
    const total = (cortesLista || []).reduce((sum, corte) => {
      const cantidadPiezas = Number(corte?.cantidad || 1);
      const anchoValor = Number(corte?.ancho ?? corte?.ancho_cm ?? 0);
      const altoValor = Number(corte?.alto ?? corte?.alto_cm ?? 0);

      if (esAluminio) {
        const longitudCm = anchoValor > 0 ? anchoValor : altoValor;
        if (longitudCm <= 0) return sum;
        return sum + (((longitudCm / 100) * precioBase) + COSTO_CORTE) * cantidadPiezas;
      }

      if (anchoValor <= 0 || altoValor <= 0) return sum;
      return sum + ((((anchoValor * altoValor) / 10000) * precioBase) + COSTO_CORTE) * cantidadPiezas;
    }, 0);

    return Number(total.toFixed(2));
  };

  const construirDescripcionCortes = (cortesLista) => {
    return (cortesLista || [])
      .map((corte, index) => {
        const cantidadPiezas = Number(corte?.cantidad || 1);
        const anchoValor = Number(corte?.ancho ?? corte?.ancho_cm ?? 0);
        const altoValor = Number(corte?.alto ?? corte?.alto_cm ?? 0);
        const medida = esAluminio
          ? `${anchoValor > 0 ? anchoValor : altoValor} cm`
          : `${anchoValor} x ${altoValor} cm`;
        return `${index + 1}. ${medida} x${cantidadPiezas}`;
      })
      .join(' | ');
  };

  const handleAgregarOtroCorte = () => {
    const anchoValor = Number(ancho);
    const altoValor = Number(alto);

    // Validación según tipo de producto
    if (esAluminio) {
      // ALUMINIO: Solo ancho
      if (!anchoValor || anchoValor <= 0) {
        alert('Por favor ingresa el ancho');
        return;
      }
    } else if (esVidrio) {
      // VIDRIO: Ancho y Alto
      if (!anchoValor || anchoValor <= 0 || !altoValor || altoValor <= 0) {
        alert('Por favor ingresa ancho y alto');
        return;
      }
    } else {
      // Otros: Ancho y Alto
      if (!anchoValor || anchoValor <= 0 || !altoValor || altoValor <= 0) {
        alert('Por favor ingresa ancho y alto');
        return;
      }
    }

    const nuevoCorte = {
      id: Date.now() + Math.random(),
      cantidad: Number(cantidad),
      ancho: esAluminio ? Number(ancho) : (ancho ? Number(ancho) : null),
      alto: esAluminio ? null : (alto ? Number(alto) : null),
      espesor: null,  // Sin espesor para ninguno
      observaciones: null  // Nunca se usa
    };

    setCortesAgregados([...cortesAgregados, nuevoCorte]);
    // Limpiar formulario
    setCantidad(1);
    setAncho('');
    setAlto('');
    setAdvertenciaAncho('');
    setAdvertenciaAlto('');
  };

  const handleEliminarCorte = (id) => {
    setCortesAgregados(cortesAgregados.filter(c => c.id !== id));
  };

  const handleGuardarTodosLosCortes = () => {
    if (cortesAgregados.length === 0) {
      alert('Agrega al menos un corte antes de guardar');
      return;
    }

    const cantidadTotalPiezas = cortesAgregados.reduce((sum, corte) => sum + Number(corte?.cantidad || 1), 0);
    const subtotalCortes = calcularSubtotalCortes(cortesAgregados);
    const precioUnitarioPromedio = cantidadTotalPiezas > 0
      ? Number((subtotalCortes / cantidadTotalPiezas).toFixed(2))
      : Number(producto?.precio_unitario || 0);

    const corteData = {
      tipo_producto: 'CORTE',
      producto_original: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio_unitario: producto.precio_unitario
      },
      cortes_detalles: cortesAgregados,  // Array de cortes
      total_cortes: cortesAgregados.length,
      cantidad_total_piezas: cantidadTotalPiezas,
      precio_unitario: producto.precio_unitario,
      precio_unitario_promedio: precioUnitarioPromedio,
      subtotal: subtotalCortes,
      descripcion_detallada: construirDescripcionCortes(cortesAgregados)
    };

    onGuardarCorte?.(corteData);
  };

  return (
    <>
      <style>{CSS_CORTES}</style>
      <div
        className="cortes-overlay"
        onClick={e => { if (e.target === e.currentTarget) onCancel?.(); }}
      >
      <div className="cortes-card">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{
            fontFamily: FONTS.heading,
            fontSize: '1.6rem',
            color: COLORS.text,
            margin: 0
          }}>
            <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
              <IconCards stroke={1.25} size={26} color={COLORS.primary} />
              Ingreso de Cortes {esAluminio ? '(ALUMINIO)' : esVidrio ? '(VIDRIO)' : ''}
            </span>
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: COLORS.textLight
            }}
          >
            ✕
          </button>
        </div>

        {/* Info producto */}
        <div style={{
          background: COLORS.lightBlue,
          padding: '16px',
          marginBottom: '24px',
          borderRadius: '10px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: COLORS.text }}>
            Producto: {producto?.nombre}
          </p>
          <p style={{ margin: '0', color: COLORS.textLight, fontSize: '0.95rem' }}>
            Código: {producto?.codigo} | Precio base: S/ {(producto?.precio_unitario || 0).toFixed(2)}
          </p>
          {esAluminio && (
            <p style={{ margin: '8px 0 0 0', color: COLORS.text, fontSize: '0.9rem', fontWeight: 500 }}>
              Ingresa solo el ancho
            </p>
          )}
          {esVidrio && (
            <p style={{ margin: '8px 0 0 0', color: COLORS.text, fontSize: '0.9rem', fontWeight: 500 }}>
              Ingresa ancho y alto
            </p>
          )}
        </div>

        {/* Formulario */}
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          
          {/* Cantidad */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
              Cantidad de piezas de este corte
            </label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: `1px solid ${COLORS.border}`,
                fontFamily: FONTS.body,
                fontSize: '1rem'
              }}
            />
          </div>

          {/* ALUMINIO: Solo Ancho */}
          {esAluminio && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                <span className="cortes-medida-label"><IconRulerMeasure stroke={1} size={16} /> Ancho (cm) *</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ej: 100"
                value={ancho}
                onChange={e => handleMedidaChange(e.target.value, setAncho, setAdvertenciaAncho)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${COLORS.border}`,
                  fontFamily: FONTS.body,
                  fontSize: '1rem'
                }}
              />
              {advertenciaAncho && (
                <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.9rem', fontWeight: 600 }}>
                  {advertenciaAncho}
                </p>
              )}
            </div>
          )}

          {/* VIDRIO: Ancho, Alto (sin espesor) */}
          {esVidrio && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  <span className="cortes-medida-label"><IconRulerMeasure stroke={1} size={16} /> Ancho (cm) *</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 100"
                  value={ancho}
                  onChange={e => handleMedidaChange(e.target.value, setAncho, setAdvertenciaAncho)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
                {advertenciaAncho && (
                  <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.85rem', fontWeight: 600 }}>
                    {advertenciaAncho}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  <span className="cortes-medida-label"><IconRulerMeasure stroke={1} size={16} /> Alto (cm) *</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 50"
                  value={alto}
                  onChange={e => handleMedidaChange(e.target.value, setAlto, setAdvertenciaAlto)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
                {advertenciaAlto && (
                  <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.85rem', fontWeight: 600 }}>
                    {advertenciaAlto}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* OTROS: Ancho, Alto, Espesor */}
          {!esAluminio && !esVidrio && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  <span className="cortes-medida-label"><IconRulerMeasure stroke={1} size={16} /> Ancho (cm) *</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 100"
                  value={ancho}
                  onChange={e => handleMedidaChange(e.target.value, setAncho, setAdvertenciaAncho)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
                {advertenciaAncho && (
                  <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.85rem', fontWeight: 600 }}>
                    {advertenciaAncho}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  <span className="cortes-medida-label"><IconRulerMeasure stroke={1} size={16} /> Alto (cm) *</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 50"
                  value={alto}
                  onChange={e => handleMedidaChange(e.target.value, setAlto, setAdvertenciaAlto)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
                {advertenciaAlto && (
                  <p style={{ margin: '8px 0 0 0', color: COLORS.error, fontSize: '0.85rem', fontWeight: 600 }}>
                    {advertenciaAlto}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  Espesor (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 6"
                  value={espesor}
                  onChange={e => setEspesor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          )}

          {/* Botón agregar otro corte */}
          <button
            onClick={handleAgregarOtroCorte}
            style={{
              padding: '12px',
              background: COLORS.lightBlue,
              color: COLORS.primary,
              border: `2px solid ${COLORS.primary}`,
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: FONTS.heading
            }}
          >
            + Agregar otro corte
          </button>

        </div>

        {/* Lista de cortes agregados */}
        {cortesAgregados.length > 0 && (
          <div style={{
            background: COLORS.light,
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '24px',
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontFamily: FONTS.heading,
              color: COLORS.text,
              fontSize: '1rem'
            }}>
              Cortes agregados ({cortesAgregados.length}):
            </h4>
            {cortesAgregados.map((corte, idx) => (
              <div key={corte.id + '-' + idx} style={{
                background: COLORS.white,
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${COLORS.border}`
              }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: COLORS.text, fontSize: '0.95rem' }}>
                    Corte {idx + 1}: {corte.cantidad}x 
                    {esAluminio 
                      ? `(${corte.ancho}cm ancho)`
                      : esVidrio
                      ? `(${corte.ancho}cm x ${corte.alto}cm)`
                      : `(${corte.ancho}cm x ${corte.alto}cm)`
                    }
                  </p>
                </div>
                <button
                  onClick={() => handleEliminarCorte(corte.id)}
                  style={{
                    padding: '4px 10px',
                    background: COLORS.error,
                    color: COLORS.white,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleGuardarTodosLosCortes}
            disabled={cortesAgregados.length === 0}
            style={{
              flex: 1,
              padding: '12px',
              background: cortesAgregados.length === 0 ? COLORS.textLight : COLORS.primary,
              color: COLORS.white,
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: cortesAgregados.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.heading,
              opacity: cortesAgregados.length === 0 ? 0.5 : 1
            }}
          >
            ✓ Guardar todos los cortes ({cortesAgregados.length})
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              background: COLORS.light,
              color: COLORS.text,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: FONTS.heading
            }}
          >
            Cancelar
          </button>
        </div>

      </div>
      </div>
    </>
  );
};

export default ModalIngresoCortes;
