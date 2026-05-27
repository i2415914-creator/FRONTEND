import { useState, useEffect } from 'react';
import { IconLoader, IconAlertTriangle } from '@tabler/icons-react';
import { COLORS, BRAND_THEME } from '../../colors';

const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(148, 25, 24, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(148, 25, 24, 0);
    }
  }

  .tabla-mermas {
    animation: fadeIn 0.5s ease-in;
  }

  .tabla-seleccionadas {
    animation: slideUp 0.6s ease-out;
  }

  .buscador-panel {
    animation: slideUp 0.7s ease-out;
  }

  .buscador-input:focus {
    animation: pulse 2s infinite;
  }

  @keyframes modalBackdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes modalCardIn {
    from { opacity: 0; transform: scale(0.88) translateY(18px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }

  .confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 20, 0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: modalBackdropIn 0.22s ease;
  }

  .confirm-card {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 20px 60px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.5) inset;
    border-radius: 20px;
    padding: 36px 32px 28px;
    width: 360px;
    max-width: 92vw;
    animation: modalCardIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
    text-align: center;
  }

  @keyframes spinLoader {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .processing-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(30, 30, 40, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: modalBackdropIn 0.2s ease;
  }

  .processing-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .processing-spinner {
    width: 48px;
    height: 48px;
    animation: spinLoader 1s linear infinite;
  }

  .processing-text {
    font-size: 15px;
    color: #ffffff;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
`;

export default function RetazoServicio({ notificacion, onToast, onGuardarSuccess }) {
  const [mermas, setMermas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecciones, setSelecciones] = useState({}); // { id_merma: true/false }
  const [usos, setUsos] = useState({}); // { id_merma: cantidad }
  const [tipoMaterial, setTipoMaterial] = useState(''); // 'aluminio' o 'vidrio'
  const [dimensiones, setDimensiones] = useState({ ancho: '', alto: '' });
  const [nombre, setNombre] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );

  const isTablet = viewportWidth <= 1100;
  const isMobile = viewportWidth <= 760;
  const isTinyMobile = viewportWidth <= 480;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/merma');
        const data = res.ok ? await res.json() : { data: [] };
        setMermas(data.data || []);
      } catch (e) {
        onToast?.('Error al cargar mermas', 'error');
        setMermas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [onToast]);

  const handleSelectAll = (checked) => {
    const nuevas = {};
    mermasFiltradas.forEach(m => {
      nuevas[m.id_merma] = checked;
    });
    setSelecciones(nuevas);
  };

  const handleSelectOne = (id_merma, checked) => {
    setSelecciones(prev => ({ ...prev, [id_merma]: checked }));
  };

  const handleUsoChange = (id_merma, valor) => {
    // Solo permitir números positivos
    const soloNumeros = valor.replace(/[^0-9]/g, '');
    const numVal = soloNumeros ? parseInt(soloNumeros) : 0;
    
    // Obtener la cantidad máxima disponible para esta merma
    const merma = mermasFiltradas.find(m => m.id_merma === id_merma);
    const cantidadMax = merma ? merma.cantidad : 0;
    
    // Solo guardar si es menor o igual a la cantidad disponible
    if (numVal <= cantidadMax) {
      setUsos(prev => ({ ...prev, [id_merma]: soloNumeros }));
    }
  };

  const handleGuardar = async () => {
    // Validar que hay selecciones
    const haySelecciones = Object.values(selecciones).some(v => v === true);
    
    if (!haySelecciones) {
      setShowConfirmModal(true);
      return;
    }

    // Validar que todas las mermas seleccionadas tengan cantidad > 0
    const mermasSeleccionadas = mermasFiltradas.filter(m => selecciones[m.id_merma]);
    const algunaSeleccionadaSinCantidad = mermasSeleccionadas.some(m => {
      const cant = parseInt(usos[m.id_merma] || 0);
      return cant === 0;
    });

    if (algunaSeleccionadaSinCantidad) {
      onToast?.('Debes asignar una cantidad a todas las mermas seleccionadas', 'error');
      return;
    }

    setIsProcessing(true);
    const mermasAGuardar = mermasFiltradas
      .filter(m => selecciones[m.id_merma])
      .map(m => ({
        id_merma: m.id_merma,
        cantidad_usada: parseInt(usos[m.id_merma] || 0)
      }))
      .filter(item => item.cantidad_usada > 0);

    if (mermasAGuardar.length === 0) {
      onToast?.('Por favor ingresa cantidades para las mermas seleccionadas', 'error');
      return;
    }

    try {
      const res = await fetch('/api/merma/usar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mermas: mermasAGuardar })
      });

      const data = await res.json();

      if (data.success) {
        onToast?.('Mermas descontadas exitosamente', 'success');
        setTimeout(() => {
          setIsProcessing(false);
          onGuardarSuccess?.();
        }, 500);
      } else {
        onToast?.(data.message || 'Error al descontar mermas', 'error');
        setIsProcessing(false);
      }
    } catch (e) {
      onToast?.('Error al guardar mermas: ' + e.message, 'error');
      setIsProcessing(false);
    }
  };

  const handleBuscar = () => {
    // Filtrar mermas según criterios
    const resultados = mermasFiltradas.filter(m => {
      const nombreBusqueda = nombre.toLowerCase().trim();
      const nombreMerma = m.nombre.toLowerCase().trim();

      // Búsqueda por nombre: coincidencia parcial, case-insensitive
      if (!nombreMerma.includes(nombreBusqueda)) {
        return false;
      }

      // Si se seleccionó tipo de material, filtrar también por eso
      if (tipoMaterial) {
        let coincidencia = false;
        if (tipoMaterial === 'aluminio') {
          coincidencia = m.categoria?.descripcion?.toLowerCase().includes('aluminio');
        } else if (tipoMaterial === 'vidrio') {
          coincidencia = m.categoria?.descripcion?.toLowerCase().includes('vidrio');
        }
        
        if (!coincidencia) return false;
      }

      // Si se ingresó ancho, filtrar por eso
      if (dimensiones.ancho) {
        const anchoIngresado = parseInt(dimensiones.ancho);
        if (m.ancho_cm !== anchoIngresado) {
          return false;
        }
      }

      // Si se ingresó alto, filtrar por eso
      if (dimensiones.alto) {
        const altoIngresado = parseInt(dimensiones.alto);
        if (m.alto_cm !== altoIngresado) {
          return false;
        }
      }

      return true;
    });

    setResultadosBusqueda(resultados);

    if (resultados.length === 0) {
      onToast?.('No se encontraron mermas con ese nombre', 'info');
    } else {
      onToast?.(`Se encontraron ${resultados.length} merma(s)`, 'success');
    }
  };

  const getTodoSeleccionado = () => {
    if (mermasFiltradas.length === 0) return false;
    return mermasFiltradas.every(m => selecciones[m.id_merma]);
  };

  const getAlgunoSeleccionado = () => {
    return Object.values(selecciones).some(v => v === true);
  };

  const isFormValid = () => {
    const haySelecciones = Object.values(selecciones).some(v => v === true);
    if (!haySelecciones) return true; // Sin selecciones es válido (show modal)
    
    // Si hay selecciones, todas deben tener cantidad > 0
    const mermasSeleccionadas = mermasFiltradas.filter(m => selecciones[m.id_merma]);
    return mermasSeleccionadas.every(m => parseInt(usos[m.id_merma] || 0) > 0);
  };

  const mermasFiltradas = (resultadosBusqueda.length > 0 ? resultadosBusqueda : mermas).filter(m => {
    if (!m.categoria || !m.categoria.descripcion) return false;
    const desc = m.categoria.descripcion.toLowerCase();
    return desc.includes('vidrio') || desc.includes('aluminio');
  });

  return (
    <div style={{ padding: isMobile ? '12px' : '20px' }}>
      <style>{styles}</style>

      {/* ── MODAL CONFIRMACIÓN ── */}
      {showConfirmModal && (
        <div className="confirm-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            {/* Icono */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(148,25,24,0.12)',
              border: '1.5px solid rgba(148,25,24,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
            >
              <IconAlertTriangle size={28} stroke={1} color={COLORS.primary} />
            </div>

            {/* Título */}
            <p style={{
              fontWeight: 700, fontSize: 17, color: '#1a1a2e',
              marginBottom: 8, lineHeight: 1.3
            }}>
              Sin mermas seleccionadas
            </p>

            {/* Mensaje */}
            <p style={{
              fontSize: 13.5, color: '#ffffff',
              marginBottom: 24, lineHeight: 1.55
            }}>
              No seleccionaste ninguna merma.<br/>
              ¿Deseas continuar de todas formas hacia la siguiente etapa?
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: '1.5px solid rgba(148,25,24,0.3)',
                  background: 'rgba(148,25,24,0.07)',
                  color: COLORS.primary, fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', transition: 'all .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,25,24,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(148,25,24,0.07)'}
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowConfirmModal(false); setIsProcessing(true); onGuardarSuccess?.(); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, ${COLORS.primary}, #b83332)`,
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(148,25,24,0.35)',
                  transition: 'all .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── OVERLAY DE PROCESAMIENTO ─── */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <IconLoader size={48} className="processing-spinner" stroke={2} color={COLORS.primary} />
            <p className="processing-text">Procesando...</p>
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: '16px', fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: COLORS.primary, animation: 'fadeIn 0.4s ease-in' }}>
        Mermas Disponibles
      </h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <IconLoader size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : mermasFiltradas.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999', border: '1px solid #eee', borderRadius: '8px' }}>
          {mermas.length === 0 ? 'No hay mermas disponibles' : 'No hay mermas de categoría Vidrios o Aluminios'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: isTablet ? 'column' : 'row', gap: '20px', alignItems: 'flex-start' }}>
          {/* TABLA DE MERMAS - LADO IZQUIERDO */}
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {resultadosBusqueda.length > 0 && (
              <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', borderLeft: '4px solid #2196F3', fontSize: '12px', color: '#1565c0' }}>
                Mostrando {resultadosBusqueda.length} resultado(s) de búsqueda
              </div>
            )}
            
            {/* TABLA PRINCIPAL DE MERMAS */}
            <div className="tabla-mermas" style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', border: `2px solid ${COLORS.secondary}`, borderRadius: '8px', maxHeight: mermasFiltradas.filter(m => !selecciones[m.id_merma]).length >= 5 ? '300px' : 'auto', boxShadow: `0 2px 8px rgba(148, 25, 24, 0.1)`, backgroundColor: `${COLORS.glass}80` }}>
              <div style={{ minWidth: isTablet ? '900px' : '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ backgroundColor: COLORS.primary, color: COLORS.white, borderBottom: `3px solid ${COLORS.primary}`, position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}></th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Nombre</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Ancho (cm)</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Alto (cm)</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Cantidad</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Lugar</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Descripción</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Categoría</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Uso (cantidad)</th>
                  </tr>
                </thead>
                <tbody>
                  {mermasFiltradas
                    .filter(m => !selecciones[m.id_merma])
                    .map((m, idx) => (
                    <tr key={m.id_merma} style={{ borderBottom: `1px solid rgba(128, 194, 220, 0.3)`, backgroundColor: idx % 2 === 0 ? `rgba(199, 236, 255, 0.3)` : `rgba(255, 255, 255, 0.6)`, transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgba(128, 194, 220, 0.2)`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? `rgba(199, 236, 255, 0.3)` : `rgba(255, 255, 255, 0.6)`}>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selecciones[m.id_merma] || false}
                          onChange={(e) => handleSelectOne(m.id_merma, e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: COLORS.primary }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>{m.nombre}</td>
                      <td style={{ padding: '10px' }}>{m.ancho_cm}</td>
                      <td style={{ padding: '10px' }}>{m.alto_cm}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: m.cantidad > 0 ? COLORS.text : COLORS.error }}>{m.cantidad}</td>
                      <td style={{ padding: '10px' }}>{m.lugar}</td>
                      <td style={{ padding: '10px' }}>{m.descripción || '-'}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textLight }}>
                        {m.categoria?.descripcion || 'Sin categoría'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={usos[m.id_merma] || ''}
                          onChange={(e) => handleUsoChange(m.id_merma, e.target.value)}
                          placeholder="0"
                          style={{
                            width: '70px',
                            padding: '6px',
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '12px',
                            transition: 'all 0.3s ease',
                            backgroundColor: `rgba(255, 255, 255, 0.8)`
                          }}
                          disabled={!selecciones[m.id_merma]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            {isTablet && (
              <div style={{ marginTop: '-10px', fontSize: '11px', color: COLORS.textLight, fontStyle: 'italic' }}>
                Desliza la tabla hacia izquierda o derecha para ver todas las columnas.
              </div>
            )}

            {/* TABLA DE MERMAS SELECCIONADAS */}
            <div className="tabla-seleccionadas">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: COLORS.primary }}>
                Mermas Seleccionadas ({Object.values(selecciones).filter(v => v).length})
              </h3>
              <div style={{ overflowX: 'auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', border: `2px solid ${COLORS.secondary}`, borderRadius: '8px', maxHeight: mermasFiltradas.filter(m => selecciones[m.id_merma]).length >= 5 ? '250px' : 'auto', boxShadow: `0 2px 8px rgba(255, 214, 0, 0.08)`, backgroundColor: `rgba(255, 214, 0, 0.04)` }}>
                {Object.values(selecciones).filter(v => v).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textLight, backgroundColor: `rgba(199, 236, 255, 0.3)` }}>
                    No hay mermas seleccionadas
                  </div>
                ) : (
                  <div style={{ minWidth: isTablet ? '760px' : '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: `linear-gradient(135deg, rgba(255, 214, 0, 0.7) 0%, rgba(255, 180, 0, 0.7) 100%)`, color: '#000', borderBottom: `3px solid ${COLORS.accent}`, position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Nombre</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Ancho (cm)</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Alto (cm)</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Categoría</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Uso</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Quitar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mermasFiltradas
                        .filter(m => selecciones[m.id_merma])
                        .map((m, idx) => (
                          <tr key={m.id_merma} style={{ borderBottom: `1px solid rgba(255, 214, 0, 0.1)`, backgroundColor: idx % 2 === 0 ? `rgba(255, 214, 0, 0.05)` : `rgba(255, 255, 255, 0.4)`, transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgba(255, 214, 0, 0.08)`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? `rgba(255, 214, 0, 0.05)` : `rgba(255, 255, 255, 0.4)`}>
                            <td style={{ padding: '10px' }}>{m.nombre}</td>
                            <td style={{ padding: '10px' }}>{m.ancho_cm}</td>
                            <td style={{ padding: '10px' }}>{m.alto_cm}</td>
                            <td style={{ padding: '10px', fontSize: '12px', color: COLORS.textLight }}>
                              {m.categoria?.descripcion || 'Sin categoría'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={usos[m.id_merma] || ''}
                                onChange={(e) => handleUsoChange(m.id_merma, e.target.value)}
                                placeholder="0"
                                style={{
                                  width: '70px',
                                  padding: '6px',
                                  border: `1px solid ${COLORS.accent}`,
                                  borderRadius: '4px',
                                  textAlign: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  color: COLORS.accent,
                                  transition: 'all 0.3s ease',
                                  backgroundColor: `rgba(255, 214, 0, 0.08)`
                                }}
                              />
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleSelectOne(m.id_merma, false)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: COLORS.primary,
                                  color: COLORS.white,
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  transition: 'all 0.3s ease',
                                  boxShadow: `0 2px 4px rgba(148, 25, 24, 0.2)`
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#7d1614';
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = COLORS.primary;
                                  e.target.style.transform = 'scale(1)';
                                }}
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* SELECTOR DE MATERIAL */}
      <div className="buscador-panel" style={{ width: isTablet ? '100%' : '320px', marginTop: isTablet ? '0px' : '24px', padding: isMobile ? '14px' : '20px', border: `2px solid ${COLORS.secondary}`, borderRadius: '12px', backgroundColor: `rgba(199, 236, 255, 0.4)`, boxShadow: `0 4px 12px rgba(128, 194, 220, 0.2)` }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px', fontWeight: 'bold', color: COLORS.primary, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Buscar Merma
            </h3>
            
            {/* Campo Nombre - REQUERIDO */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                Nombre (requerido)
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: vidrio, aluminio"
                className="buscador-input"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `2px solid ${COLORS.secondary}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  backgroundColor: `rgba(255, 255, 255, 0.9)`,
                  transition: 'all 0.3s ease',
                  fontWeight: '500'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.primary;
                  e.target.style.boxShadow = `0 0 10px rgba(148, 25, 24, 0.3)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.secondary;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{ fontSize: '11px', color: COLORS.textLight, marginTop: '4px', fontStyle: 'italic' }}>
                Búsqueda parcial y sin mayúsculas
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: `2px solid rgba(148, 25, 24, 0.2)`, marginBottom: '16px' }}></div>

            {/* Radio buttons - OPCIONAL */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ marginBottom: '8px', display: 'block', fontSize: '12px', fontWeight: 'bold', color: COLORS.textLight }}>
                Tipo de Material (opcional)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = COLORS.primary} onMouseLeave={(e) => e.currentTarget.style.color = COLORS.text}>
                <input
                  type="radio"
                  name="tipoMaterial"
                  value="aluminio"
                  checked={tipoMaterial === 'aluminio'}
                  onChange={(e) => {
                    setTipoMaterial(e.target.value);
                    setDimensiones({ ancho: '', alto: '' });
                  }}
                  style={{ marginRight: '8px', cursor: 'pointer', accentColor: COLORS.primary }}
                />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Aluminio</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = COLORS.primary} onMouseLeave={(e) => e.currentTarget.style.color = COLORS.text}>
                <input
                  type="radio"
                  name="tipoMaterial"
                  value="vidrio"
                  checked={tipoMaterial === 'vidrio'}
                  onChange={(e) => {
                    setTipoMaterial(e.target.value);
                    setDimensiones({ ancho: '', alto: '' });
                  }}
                  style={{ marginRight: '8px', cursor: 'pointer', accentColor: COLORS.primary }}
                />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Vidrio</span>
              </label>
            </div>

            {/* Campos condicionales - OPCIONAL */}
            {tipoMaterial === 'aluminio' && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `rgba(148, 25, 24, 0.1)`, borderRadius: '6px', border: `1px solid rgba(128, 194, 220, 0.4)`, animation: 'fadeIn 0.3s ease-in' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                  Ancho (cm) - opcional
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dimensiones.ancho}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                    setDimensiones(prev => ({ ...prev, ancho: soloNumeros }));
                  }}
                  placeholder="Ingresa ancho"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${COLORS.secondary}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    backgroundColor: `rgba(255, 255, 255, 0.9)`,
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            )}

            {tipoMaterial === 'vidrio' && (
              <>
                <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: `rgba(148, 25, 24, 0.1)`, borderRadius: '6px', border: `1px solid rgba(128, 194, 220, 0.4)`, animation: 'fadeIn 0.3s ease-in' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                    Ancho (cm) - opcional
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dimensiones.ancho}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                      setDimensiones(prev => ({ ...prev, ancho: soloNumeros }));
                    }}
                    placeholder="Ingresa ancho"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${COLORS.secondary}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                      backgroundColor: `rgba(255, 255, 255, 0.9)`,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: `rgba(148, 25, 24, 0.1)`, borderRadius: '6px', border: `1px solid rgba(128, 194, 220, 0.4)`, animation: 'fadeIn 0.4s ease-in' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: COLORS.primary }}>
                    Alto (cm) - opcional
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dimensiones.alto}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                      setDimensiones(prev => ({ ...prev, alto: soloNumeros }));
                    }}
                    placeholder="Ingresa alto"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${COLORS.secondary}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                      backgroundColor: `rgba(255, 255, 255, 0.9)`,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              </>
            )}

            {/* Botones Buscar/Limpiar */}
            <div style={{ display: 'flex', gap: '8px', flexDirection: isTinyMobile ? 'column' : 'row' }}>
              <button
                onClick={handleBuscar}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: COLORS.primary,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 6px rgba(148, 25, 24, 0.3)`
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 4px 12px rgba(148, 25, 24, 0.5)`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 2px 6px rgba(148, 25, 24, 0.3)`;
                }}
              >
                Buscar
              </button>
              <button
                onClick={() => {
                  setResultadosBusqueda([]);
                  setNombre('');
                  setTipoMaterial('');
                  setDimensiones({ ancho: '', alto: '' });
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: COLORS.gray[400],
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 2px 6px rgba(0,0,0,0.1)`
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.gray[600];
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 4px 12px rgba(0,0,0,0.2)`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = COLORS.gray[400];
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 2px 6px rgba(0,0,0,0.1)`;
                }}
              >
                Limpiar
              </button>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <button
                onClick={handleGuardar}
                disabled={getAlgunoSeleccionado() && !isFormValid()}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: getAlgunoSeleccionado() && !isFormValid() ? '#ccc' : COLORS.primary,
                  color: getAlgunoSeleccionado() && !isFormValid() ? '#999' : COLORS.white,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: getAlgunoSeleccionado() && !isFormValid() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 12px rgba(148, 25, 24, 0.3)`,
                  opacity: getAlgunoSeleccionado() && !isFormValid() ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!getAlgunoSeleccionado() || isFormValid()) {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = `0 6px 20px rgba(148, 25, 24, 0.5)`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 4px 12px rgba(148, 25, 24, 0.3)`;
                }}
              >
                Guardar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
