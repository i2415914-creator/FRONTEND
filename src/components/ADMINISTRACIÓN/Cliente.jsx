import React, { useEffect, useState } from 'react';
import { IconFileTypePdf } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';

const Cliente = ({ onToast }) => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ventasLoading, setVentasLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes_admin');
      if (!res.ok) throw new Error('No se pudo cargar clientes');
      const data = await res.json();
      if (data.success) {
        setClientes(Array.isArray(data.data) ? data.data : []);
      } else {
        onToast?.('Error al cargar clientes', 'error');
      }
    } catch (e) {
      onToast?.('Error al cargar clientes', 'error');
    }
    setLoading(false);
  };

  const handleSelectCliente = async (cliente) => {
    setSelectedCliente(cliente);
    setVentas([]);

    setVentasLoading(true);
    try {
      const res = await fetch(`/api/clientes_admin/${cliente.id_cliente}/ventas`);
      if (!res.ok) throw new Error('No se pudo cargar ventas');
      const data = await res.json();
      if (data.success) {
        setVentas(Array.isArray(data.data) ? data.data : []);
      } else {
        setVentas([]);
      }
    } catch (e) {
      onToast?.('Error al cargar ventas del cliente', 'error');
      setVentas([]);
    }
    setVentasLoading(false);
  };

  if (loading) {
    return <div style={{ padding: windowWidth < 640 ? '12px' : '24px', fontFamily: FONTS.body }}>Cargando clientes...</div>;
  }

  return (
    <div style={{
      padding: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '16px' : '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      color: COLORS.text,
      fontFamily: FONTS.body
    }}>
      {/* Header */}
      <div style={{
        marginBottom: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '16px'
      }}>
        <h2 style={{
          fontSize: windowWidth < 640 ? '1.35rem' : windowWidth < 1024 ? '1.6rem' : '1.875rem',
          fontWeight: 700,
          color: COLORS.text,
          fontFamily: FONTS.heading,
          letterSpacing: '0.5px',
          margin: 0,
          marginBottom: windowWidth < 640 ? '4px' : '6px'
        }}>
          CLIENTES DE LA EMPRESA
        </h2>
        <p style={{
          fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem',
          color: COLORS.textLight,
          margin: 0
        }}>
          Total: {clientes.length} clientes registrados
        </p>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth < 768 ? '1fr' : '1.05fr 1fr',
        gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '18px'
      }}>
        {/* Left Panel - Clientes Table */}
        <div style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '12px',
          boxShadow: '0 10px 26px rgba(0,0,0,0.06)',
          background: COLORS.white,
          padding: windowWidth < 640 ? '12px' : '16px',
          overflow: 'hidden'
        }}>
          <h3 style={{
            fontSize: windowWidth < 640 ? '1rem' : windowWidth < 1024 ? '1.1rem' : '1.2rem',
            fontFamily: FONTS.heading,
            color: COLORS.text,
            marginBottom: windowWidth < 640 ? '8px' : '12px',
            margin: 0
          }}>
            Lista de Clientes
          </h3>
          <div style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
            background: COLORS.white,
            maxHeight: windowWidth < 640 ? '400px' : windowWidth < 1024 ? '500px' : '620px',
            overflowY: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: windowWidth < 640 ? '0.8rem' : windowWidth < 1024 ? '0.85rem' : '0.95rem'
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: COLORS.gray[100],
                zIndex: 5
              }}>
                <tr>
                  <th style={{
                    borderBottom: `1px solid ${COLORS.border}`,
                    padding: windowWidth < 640 ? '8px 10px' : windowWidth < 1024 ? '10px 12px' : '12px 14px',
                    textAlign: 'left',
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    color: COLORS.text
                  }}>
                    Nombre
                  </th>
                  <th style={{
                    borderBottom: `1px solid ${COLORS.border}`,
                    padding: windowWidth < 640 ? '8px 10px' : windowWidth < 1024 ? '10px 12px' : '12px 14px',
                    textAlign: 'left',
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    color: COLORS.text,
                    display: windowWidth < 768 ? 'none' : 'table-cell'
                  }}>
                    Correo
                  </th>
                  <th style={{
                    borderBottom: `1px solid ${COLORS.border}`,
                    padding: windowWidth < 640 ? '8px 10px' : windowWidth < 1024 ? '10px 12px' : '12px 14px',
                    textAlign: 'left',
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    color: COLORS.text,
                    display: windowWidth < 1024 ? 'none' : 'table-cell'
                  }}>
                    Documento
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={windowWidth < 1024 ? 2 : 3} style={{
                      textAlign: 'center',
                      padding: windowWidth < 640 ? '12px' : '16px',
                      color: COLORS.textLight
                    }}>
                      Sin clientes registrados
                    </td>
                  </tr>
                ) : (
                  clientes.map((c, idx) => {
                    const isSelected = selectedCliente?.id_cliente === c.id_cliente;
                    const rowBg = isSelected ? COLORS.light : idx % 2 === 0 ? COLORS.gray[50] : COLORS.white;
                    return (
                      <tr
                        key={c.id_cliente}
                        onClick={() => handleSelectCliente(c)}
                        style={{
                          cursor: 'pointer',
                          background: rowBg,
                          transition: 'background 0.2s ease',
                          borderBottom: `1px solid ${COLORS.border}`
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.light}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBg}
                      >
                        <td style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '8px 10px' : windowWidth < 1024 ? '10px 12px' : '12px 14px'
                        }}>
                          {c.nombre || 'Sin nombre'}
                        </td>
                        <td style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '8px 10px' : windowWidth < 1024 ? '10px 12px' : '12px 14px',
                          display: windowWidth < 768 ? 'none' : 'table-cell',
                          fontSize: windowWidth < 1024 ? '0.8rem' : '0.85rem'
                        }}>
                          {c.correo || '-'}
                        </td>
                        <td style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '8px 10px' : windowWidth < 1024 ? '10px 12px' : '12px 14px',
                          display: windowWidth < 1024 ? 'none' : 'table-cell'
                        }}>
                          {c.documento || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Client Details OR Empty State */}
        {selectedCliente ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: windowWidth < 640 ? '12px' : windowWidth < 1024 ? '14px' : '16px'
          }}>
            {/* Cliente Info */}
            <div style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              boxShadow: '0 10px 26px rgba(0,0,0,0.06)',
              background: COLORS.white,
              padding: windowWidth < 640 ? '12px' : '16px'
            }}>
              <h3 style={{
                fontSize: windowWidth < 640 ? '1rem' : windowWidth < 1024 ? '1.1rem' : '1.2rem',
                fontFamily: FONTS.heading,
                color: COLORS.text,
                marginBottom: windowWidth < 640 ? '8px' : '12px',
                margin: 0
              }}>
                Información del Cliente
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth < 768 ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
                gap: windowWidth < 640 ? '8px' : '10px',
                fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem'
              }}>
                <div><span style={{ fontWeight: 700, color: COLORS.text }}>Nombre: </span>{selectedCliente.nombre || '-'}</div>
                <div><span style={{ fontWeight: 700, color: COLORS.text }}>Correo: </span>{selectedCliente.correo || '-'}</div>
                <div><span style={{ fontWeight: 700, color: COLORS.text }}>Teléfono: </span>{selectedCliente.numero || '-'}</div>
                <div><span style={{ fontWeight: 700, color: COLORS.text }}>Documento: </span>{selectedCliente.documento || '-'}</div>
                <div><span style={{ fontWeight: 700, color: COLORS.text }}>Tipo: </span>{selectedCliente.tipo_documento?.descripcion || '-'}</div>
                <div><span style={{ fontWeight: 700, color: COLORS.text }}>Estado: </span>{selectedCliente.estado_cliente?.descripcion || '-'}</div>
              </div>
            </div>

            {/* Ventas Table */}
            <div style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              boxShadow: '0 10px 26px rgba(0,0,0,0.06)',
              background: COLORS.white,
              padding: windowWidth < 640 ? '12px' : '16px'
            }}>
              <h3 style={{
                fontSize: windowWidth < 640 ? '1rem' : windowWidth < 1024 ? '1.1rem' : '1.2rem',
                fontFamily: FONTS.heading,
                color: COLORS.text,
                marginBottom: windowWidth < 640 ? '8px' : '12px',
                margin: 0
              }}>
                Boletas y Facturas
              </h3>
              {ventasLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: windowWidth < 640 ? '12px' : '16px',
                  color: COLORS.textLight,
                  fontSize: windowWidth < 640 ? '0.85rem' : '0.95rem'
                }}>
                  Cargando ventas...
                </div>
              ) : (
                <div style={{
                  maxHeight: windowWidth < 640 ? '300px' : windowWidth < 1024 ? '350px' : '400px',
                  overflowY: 'auto',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: windowWidth < 640 ? '0.75rem' : windowWidth < 1024 ? '0.8rem' : '0.9rem'
                  }}>
                    <thead style={{ background: COLORS.gray[100] }}>
                      <tr>
                        <th style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px',
                          textAlign: 'left',
                          fontFamily: FONTS.heading,
                          fontWeight: 600,
                          color: COLORS.text
                        }}>
                          Fecha
                        </th>
                        <th style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px',
                          textAlign: 'center',
                          fontFamily: FONTS.heading,
                          fontWeight: 600,
                          color: COLORS.text
                        }}>
                          Comprobante
                        </th>
                        <th style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px',
                          textAlign: 'right',
                          fontFamily: FONTS.heading,
                          fontWeight: 600,
                          color: COLORS.text
                        }}>
                          Monto
                        </th>
                        <th style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px',
                          textAlign: 'left',
                          fontFamily: FONTS.heading,
                          fontWeight: 600,
                          color: COLORS.text,
                          display: windowWidth < 768 ? 'none' : 'table-cell'
                        }}>
                          Método
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventas.length === 0 ? (
                        <tr>
                          <td colSpan={windowWidth < 768 ? 3 : 4} style={{
                            textAlign: 'center',
                            padding: windowWidth < 640 ? '12px' : '14px',
                            color: COLORS.textLight
                          }}>
                            Sin ventas registradas
                          </td>
                        </tr>
                      ) : (
                        ventas.map((v, idx) => (
                          <tr key={v.id_registro} style={{
                            background: idx % 2 === 0 ? COLORS.gray[50] : COLORS.white,
                            borderBottom: `1px solid ${COLORS.border}`
                          }}>
                            <td style={{
                              borderBottom: `1px solid ${COLORS.border}`,
                              padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px'
                            }}>
                              {v.fecha || '-'}
                            </td>
                            <td style={{
                              borderBottom: `1px solid ${COLORS.border}`,
                              padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px',
                              textAlign: 'center'
                            }}>
                              {v.documento ? (
                                <a
                                  href={v.documento}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Ver comprobante PDF"
                                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: COLORS.error }}
                                >
                                  <IconFileTypePdf size={windowWidth < 640 ? 18 : 22} stroke={1.8} />
                                </a>
                              ) : (
                                <span style={{ color: COLORS.textLight }}>-</span>
                              )}
                            </td>
                            <td style={{
                              borderBottom: `1px solid ${COLORS.border}`,
                              padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: COLORS.success
                            }}>
                              S/ {(parseFloat(v.monto || 0) || 0).toFixed(2)}
                            </td>
                            <td style={{
                              borderBottom: `1px solid ${COLORS.border}`,
                              padding: windowWidth < 640 ? '6px 8px' : windowWidth < 1024 ? '8px 10px' : '10px 12px',
                              display: windowWidth < 768 ? 'none' : 'table-cell'
                            }}>
                              {v.metodo_pago?.descripcion || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {ventas.length > 0 && (
                      <tfoot>
                        <tr style={{ background: COLORS.light, fontWeight: 700, borderTop: `2px solid ${COLORS.border}` }}>
                          <td colSpan={windowWidth < 768 ? 2 : 3} style={{
                            borderBottom: `1px solid ${COLORS.border}`,
                            padding: windowWidth < 640 ? '8px' : '10px',
                            textAlign: 'right',
                            fontFamily: FONTS.heading
                          }}>
                            TOTAL
                          </td>
                          <td style={{
                            borderBottom: `1px solid ${COLORS.border}`,
                            padding: windowWidth < 640 ? '8px' : '10px',
                            textAlign: 'right',
                            fontFamily: FONTS.heading,
                            color: COLORS.success
                          }}>
                            S/ {ventas.reduce((acc, v) => acc + (parseFloat(v.monto || 0) || 0), 0).toFixed(2)}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, display: windowWidth < 768 ? 'none' : 'table-cell' }}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            boxShadow: '0 10px 26px rgba(0,0,0,0.06)',
            background: COLORS.white,
            padding: windowWidth < 640 ? '12px' : '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.textLight,
            minHeight: windowWidth < 640 ? '250px' : windowWidth < 1024 ? '350px' : '420px'
          }}>
            <p style={{ fontSize: windowWidth < 640 ? '0.9rem' : '1rem', margin: 0 }}>
              Selecciona un cliente para ver sus detalles
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cliente;
