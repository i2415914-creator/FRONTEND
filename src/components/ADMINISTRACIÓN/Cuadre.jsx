import React, { useEffect, useMemo, useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const Cuadre = ({ onToast }) => {
  const today = new Date();
  const defaultMes = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [mes, setMes] = useState(defaultMes);
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    fetchData();
  }, [mes]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`/api/cuadre-caja/pagos?mes=${mes}`),
        fetch(`/api/cuadre-caja/resumen?mes=${mes}`),
      ]);
      const pJson = await pRes.json();
      const rJson = await rRes.json();
      setPagos(pJson.success ? pJson.data : []);
      setResumen(rJson.success ? rJson.data : null);
    } catch (e) {
      onToast?.('Error al cargar cuadre', 'error');
    }
    setLoading(false);
  };

  const filteredPagos = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return pagos;
    return pagos.filter(p =>
      String(p.tipo || '').toLowerCase().includes(s) ||
      String(p.codigo || '').toLowerCase().includes(s) ||
      String(p.fecha || '').toLowerCase().includes(s)
    );
  }, [pagos, search]);

  const montoEnCajaCalculado = resumen ? parseFloat(resumen.monto_en_caja || 0) : 0;

  const semanaDeFecha = (f) => {
    if (!f) return '-';
    const d = new Date(f);
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = Math.floor((d - start) / (24 * 3600 * 1000));
    return Math.ceil((diff + start.getDay() + 1) / 7);
  };

  const handleGenerarPDF = () => {
    if (!resumen) return;
    const contenido = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #111827; color: #fff; }
        .total { font-weight: bold; text-align: right; margin-top: 20px; }
      </style></head><body>
      <h1>CUADRE DEL MES</h1>
      <p><strong>Mes:</strong> ${mes}</p>

      <h2>Pagos</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Codigo</th><th>Monto</th></tr></thead>
        <tbody>
          ${pagos.map(p => `
            <tr>
              <td>${p.fecha || '-'}</td>
              <td>${p.tipo}</td>
              <td>${p.codigo}</td>
              <td>S/ ${parseFloat(p.monto || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Resumen</h2>
      <table>
        <tbody>
          <tr><td>Ingreso</td><td>S/ ${parseFloat(resumen.ingreso || 0).toFixed(2)}</td></tr>
          <tr><td>Egreso</td><td>S/ ${parseFloat(resumen.egreso || 0).toFixed(2)}</td></tr>
          <tr><td>Monto en caja</td><td>S/ ${parseFloat(resumen.monto_en_caja || 0).toFixed(2)}</td></tr>
          <tr><td>Monto de la empresa</td><td>S/ ${parseFloat(resumen.monto_empresa_real || 0).toFixed(2)}</td></tr>
          <tr><td>Calculo</td><td>S/ ${parseFloat(resumen.monto_empresa || 0).toFixed(2)}</td></tr>
        </tbody>
      </table>

      <p class="total">TOTAL: S/ ${parseFloat(resumen.monto_empresa_real || 0).toFixed(2)}</p>
      </body></html>
    `;
    const w = window.open('', '_blank');
    w.document.write(contenido);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  if (loading) return <div style={{ padding: windowWidth < 640 ? '12px' : '24px', fontFamily: FONTS.body, color: COLORS.text }}>Cargando...</div>;
  if (!resumen) return <div style={{ padding: windowWidth < 640 ? '12px' : '24px', fontFamily: FONTS.body, color: COLORS.text }}>Sin datos del mes</div>;

  return (
    <div style={{
      padding: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: FONTS.body,
      color: COLORS.text
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: windowWidth < 768 ? 'flex-start' : 'center',
        marginBottom: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '24px',
        flexDirection: windowWidth < 768 ? 'column' : 'row',
        gap: windowWidth < 768 ? '12px' : '0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: windowWidth < 640 ? '8px' : windowWidth < 1024 ? '12px' : '16px',
          flexDirection: windowWidth < 640 ? 'column' : 'row',
          alignItems: windowWidth < 640 ? 'flex-start' : 'center',
          width: windowWidth < 768 ? '100%' : 'auto'
        }}>
          <h2 style={{
            fontSize: windowWidth < 640 ? '1.25rem' : windowWidth < 1024 ? '1.5rem' : '1.875rem',
            fontWeight: 700,
            fontFamily: FONTS.heading,
            color: COLORS.text,
            margin: 0
          }}>
            CUADRE DEL MES
          </h2>
          <div
            style={{
              padding: windowWidth < 640 ? '8px 12px' : '10px 16px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.border}`,
              background: COLORS.white,
              display: 'flex',
              alignItems: 'center',
              gap: windowWidth < 640 ? '6px' : '8px',
              fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem',
              width: windowWidth < 640 ? '100%' : 'auto',
              justifyContent: windowWidth < 640 ? 'space-between' : 'flex-start'
            }}
          >
            <span style={{ color: COLORS.text, fontWeight: 600 }}>MONTO DE LA EMPRESA</span>
            <span style={{ color: COLORS.text, fontFamily: FONTS.heading, fontWeight: 700 }}>
              S/ {parseFloat(resumen.monto_empresa_real || 0).toFixed(2)}
            </span>
          </div>
        </div>
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          style={{
            padding: windowWidth < 640 ? '8px 10px' : '10px 12px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '6px',
            backgroundColor: '#fff',
            color: COLORS.text,
            fontFamily: FONTS.body,
            fontSize: windowWidth < 640 ? '0.9rem' : '1rem',
            cursor: 'pointer',
            width: windowWidth < 640 ? '100%' : 'auto'
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '20px'
      }}>
        {/* Panel izquierdo: Pagos + búsqueda */}
        <div style={{
          padding: windowWidth < 640 ? '12px' : '16px',
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`,
          background: COLORS.light
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: windowWidth < 640 ? '8px' : '12px',
            marginBottom: windowWidth < 640 ? '12px' : '16px'
          }}>
            <input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: windowWidth < 640 ? '8px 10px' : '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                backgroundColor: '#fff',
                color: COLORS.text,
                fontFamily: FONTS.body,
                fontSize: windowWidth < 640 ? '0.85rem' : '0.9rem'
              }}
            />
          </div>

          <div style={{
            border: `1px solid ${COLORS.border}`,
            backgroundColor: '#fff',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              maxHeight: windowWidth < 640 ? '300px' : windowWidth < 1024 ? '400px' : '500px',
              overflowY: 'auto'
            }}>
              <table style={{
                width: '100%',
                fontSize: windowWidth < 640 ? '0.7rem' : windowWidth < 1024 ? '0.8rem' : '0.9rem',
                fontFamily: FONTS.body,
                borderCollapse: 'collapse'
              }}>
                <thead style={{
                  background: COLORS.light,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <tr>
                    <th style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                      textAlign: 'left',
                      color: COLORS.text,
                      fontFamily: FONTS.heading,
                      fontWeight: 600
                    }}>FECHA</th>
                    <th style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                      textAlign: 'left',
                      color: COLORS.text,
                      fontFamily: FONTS.heading,
                      fontWeight: 600,
                      display: windowWidth < 768 ? 'none' : 'table-cell'
                    }}>MES</th>
                    <th style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                      textAlign: 'left',
                      color: COLORS.text,
                      fontFamily: FONTS.heading,
                      fontWeight: 600,
                      display: windowWidth < 1024 ? 'none' : 'table-cell'
                    }}>SEMANA</th>
                    <th style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                      textAlign: 'left',
                      color: COLORS.text,
                      fontFamily: FONTS.heading,
                      fontWeight: 600
                    }}>CODIGO</th>
                    <th style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                      textAlign: 'left',
                      color: COLORS.text,
                      fontFamily: FONTS.heading,
                      fontWeight: 600
                    }}>TIPO</th>
                    <th style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                      textAlign: 'right',
                      color: COLORS.text,
                      fontFamily: FONTS.heading,
                      fontWeight: 600
                    }}>MONTO</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPagos.length === 0 ? (
                    <tr>
                      <td colSpan={windowWidth < 1024 ? 5 : 6} style={{
                        textAlign: 'center',
                        padding: windowWidth < 640 ? '12px' : '16px',
                        color: COLORS.textLight,
                        fontFamily: FONTS.body,
                        border: `1px solid ${COLORS.border}`
                      }}>
                        Sin pagos registrados
                      </td>
                    </tr>
                  ) : (
                    filteredPagos.map((p, idx) => (
                      <tr key={`${p.tipo}-${p.id}`} style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        background: idx % 2 === 0 ? COLORS.backgroundLight : COLORS.white,
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? COLORS.backgroundLight : COLORS.white}>
                        <td style={{
                          border: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : '8px 10px'
                        }}>
                          {p.fecha || '-'}
                        </td>
                        <td style={{
                          border: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                          display: windowWidth < 768 ? 'none' : 'table-cell'
                        }}>
                          {(p.fecha || '').slice(0, 7) || '-'}
                        </td>
                        <td style={{
                          border: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                          display: windowWidth < 1024 ? 'none' : 'table-cell'
                        }}>
                          {semanaDeFecha(p.fecha)}
                        </td>
                        <td style={{
                          border: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : '8px 10px'
                        }}>
                          {p.codigo}
                        </td>
                        <td style={{
                          border: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : '8px 10px'
                        }}>
                          {p.tipo}
                        </td>
                        <td style={{
                          border: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : '8px 10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: COLORS.error
                        }}>
                          S/ {parseFloat(p.monto || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{
                    background: COLORS.light,
                    borderTop: `2px solid ${COLORS.border}`
                  }}>
                    <td colSpan={windowWidth < 1024 ? 5 : 6} style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '8px' : '10px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: FONTS.heading
                    }}>
                      TOTAL
                    </td>
                  </tr>
                  <tr style={{ background: COLORS.light }}>
                    <td colSpan={windowWidth < 1024 ? 5 : 6} style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: windowWidth < 640 ? '8px' : '10px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: FONTS.heading,
                      color: COLORS.error
                    }}>
                      S/ {filteredPagos.reduce((acc, p) => acc + (parseFloat(p.monto || 0) || 0), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Panel derecho: Resumen del mes */}
        <div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '16px'
          }}>
            {/* Ingreso */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: windowWidth < 640 ? '12px' : '14px',
              backgroundColor: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontFamily: FONTS.body,
              fontSize: windowWidth < 640 ? '0.9rem' : '1rem'
            }}>
              <div style={{ color: COLORS.text }}>INGRESO</div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                S/ {parseFloat(resumen.ingreso || 0).toFixed(2)}
              </div>
            </div>

            {/* Egreso */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: windowWidth < 640 ? '12px' : '14px',
              backgroundColor: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontFamily: FONTS.body,
              fontSize: windowWidth < 640 ? '0.9rem' : '1rem'
            }}>
              <div style={{ color: COLORS.text }}>EGRESO</div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                S/ {parseFloat(resumen.egreso || 0).toFixed(2)}
              </div>
            </div>

            {/* Monto en Caja */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: windowWidth < 640 ? '12px' : '14px',
              backgroundColor: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontFamily: FONTS.body,
              fontSize: windowWidth < 640 ? '0.9rem' : '1rem'
            }}>
              <div style={{ color: COLORS.text }}>MONTO EN CAJA</div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                S/ {montoEnCajaCalculado.toFixed(2)}
              </div>
            </div>

            {/* Calculo */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: windowWidth < 640 ? '12px' : '14px',
              backgroundColor: '#fff',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontFamily: FONTS.body,
              fontSize: windowWidth < 640 ? '0.9rem' : '1rem'
            }}>
              <div style={{ color: COLORS.text }}>CALCULO</div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                S/ {parseFloat(resumen.monto_empresa || 0).toFixed(2)}
              </div>
            </div>

            {/* Total Progress Bar */}
            <div style={{
              padding: windowWidth < 640 ? '12px' : '14px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.border}`,
              background: COLORS.light
            }}>
              <div style={{
                marginBottom: windowWidth < 640 ? '8px' : '10px',
                fontWeight: 700,
                fontFamily: FONTS.heading,
                color: COLORS.text,
                fontSize: windowWidth < 640 ? '0.95rem' : '1rem'
              }}>
                TOTAL
              </div>
              <div style={{
                width: '100%',
                height: windowWidth < 640 ? '20px' : '24px',
                borderRadius: '4px',
                overflow: 'hidden',
                background: COLORS.gray[200]
              }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (resumen.monto_empresa || 0) / (resumen.ingreso || 1) * 100))}%`,
                    background: resumen.monto_empresa >= 0 ? COLORS.success : COLORS.error,
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* PDF Button */}
            <div style={{
              textAlign: 'center',
              marginTop: windowWidth < 640 ? '8px' : '12px'
            }}>
              <button
                onClick={handleGenerarPDF}
                style={{
                  padding: windowWidth < 640 ? '10px 20px' : windowWidth < 1024 ? '12px 24px' : '14px 32px',
                  color: '#fff',
                  backgroundColor: COLORS.success,
                  border: 'none',
                  borderRadius: '6px',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  fontSize: windowWidth < 640 ? '0.9rem' : windowWidth < 1024 ? '1rem' : '1.05rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: windowWidth < 640 ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.success}
              >
                📄 GUARDAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cuadre;