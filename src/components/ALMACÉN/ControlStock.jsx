import React, { useState, useEffect } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';

const INSET_STYLE = {
  padding: '10px 12px',
  border: '1.5px solid rgba(128, 194, 220, 0.28)',
  borderRadius: '8px',
  fontFamily: FONTS.body,
  fontSize: '0.9rem',
  color: COLORS.text,
  backgroundColor: 'rgba(255, 255, 255, 0.75)',
  boxShadow: 'inset 0 2px 6px rgba(90, 139, 168, 0.08), inset 0 1px 0 rgba(255,255,255, 0.8)',
  transition: 'all 0.2s ease',
  outline: 'none'
};

const loadJsPDF = () => new Promise((resolve, reject) => {
  if (window.jspdf?.jsPDF) return resolve(window.jspdf.jsPDF);
  const s1 = document.createElement('script');
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
    s2.onload  = () => resolve(window.jspdf.jsPDF);
    s2.onerror = reject;
    document.head.appendChild(s2);
  };
  s1.onerror = reject;
  document.head.appendChild(s1);
});

const ControlStock = ({ productosCache, categoriasCache }) => {
  const [pedidoCantidades, setPedidoCantidades] = useState({});
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [selectedProductos, setSelectedProductos] = useState(new Set());
  const [excludedProductos, setExcludedProductos] = useState(new Set());
  const [productosNuevos, setProductosNuevos] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Formulario para nuevo producto
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formCantidad, setFormCantidad] = useState('');
  const [formGrosor, setFormGrosor] = useState('');

  // Hook para detectar resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const enStock = productosCache.filter(p => Number(p.cantidad) > 10);
  const seleccionados = Array.from(selectedProductos).map(id => 
    productosCache.find(p => p.id_producto === id)
  ).filter(Boolean);
  const bajoPedido = [
    ...productosCache.filter(p => Number(p.cantidad) <= 10 && !excludedProductos.has(p.id_producto)),
    ...seleccionados.filter(p => !excludedProductos.has(p.id_producto)),
    ...productosNuevos
  ];

  const handleAgregarProductoNuevo = () => {
    if (!formNombre.trim()) return alert('El nombre es obligatorio');
    if (!formCodigo.trim()) return alert('El código es obligatorio');
    if (!formCantidad || Number(formCantidad) < 1) return alert('La cantidad debe ser ≥ 1');

    const nuevoProducto = {
      id_producto: `temp-${Date.now()}`,
      nombre: formNombre,
      codigo: formCodigo,
      cantidad: Number(formCantidad),
      grosor: formGrosor,
      esNuevo: true
    };

    setProductosNuevos(prev => [...prev, nuevoProducto]);
    setPedidoCantidades(prev => ({ ...prev, [nuevoProducto.id_producto]: formCantidad }));
    
    // Guardar en localStorage
    const productosGuardados = JSON.parse(localStorage.getItem('productosNuevosPedido') || '[]');
    productosGuardados.push(nuevoProducto);
    localStorage.setItem('productosNuevosPedido', JSON.stringify(productosGuardados));
    
    // Limpiar formulario
    setFormNombre('');
    setFormCodigo('');
    setFormCantidad('');
    setFormGrosor('');
  };

  const handleEliminarProductoNuevo = (id) => {
    setProductosNuevos(prev => prev.filter(p => p.id_producto !== id));
    setPedidoCantidades(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    
    // Actualizar localStorage
    const productosGuardados = JSON.parse(localStorage.getItem('productosNuevosPedido') || '[]');
    const actualizado = productosGuardados.filter(p => p.id_producto !== id);
    localStorage.setItem('productosNuevosPedido', JSON.stringify(actualizado));
  };

  // Cargar productos nuevos del localStorage al montar
  React.useEffect(() => {
    const productosGuardados = JSON.parse(localStorage.getItem('productosNuevosPedido') || '[]');
    if (productosGuardados.length > 0) {
      setProductosNuevos(productosGuardados);
      const cantidades = {};
      productosGuardados.forEach(p => {
        cantidades[p.id_producto] = p.cantidad;
      });
      setPedidoCantidades(prev => ({ ...prev, ...cantidades }));
    }
  }, []);

  const handleToggleProducto = (id) => {
    setSelectedProductos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Al deseleccionar, también lo agregamos a excluidos
        setExcludedProductos(prev2 => {
          const next2 = new Set(prev2);
          next2.add(id);
          return next2;
        });
      } else {
        next.add(id);
        // Al seleccionar, lo removemos de excluidos
        setExcludedProductos(prev2 => {
          const next2 = new Set(prev2);
          next2.delete(id);
          return next2;
        });
      }
      return next;
    });
  };

  const handleEliminarDelPedido = (id) => {
    setExcludedProductos(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSelectedProductos(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPedidoCantidades(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleGenerarPDF = async () => {
    if (bajoPedido.length === 0) {
      alert('No hay productos con bajo stock para generar pedido.');
      return;
    }

    setGenerandoPDF(true);
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const now = new Date();
      const fechaStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
      const horaStr  = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      // Banda roja superior
      doc.setFillColor(148, 25, 24);
      doc.rect(0, 0, W, 25, 'F');
      // Línea dorada
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 25, W, 2, 'F');

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18); doc.setTextColor(255, 255, 255);
      doc.text('PEDIDO DE COMPRA', W / 2, 12, { align: 'center' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 210, 170);
      doc.text('Control de Stock — Productos Bajo Inventario', W / 2, 19, { align: 'center' });
      doc.setFontSize(7); doc.setTextColor(255, 235, 200);
      doc.text(`${fechaStr}   ${horaStr}`, W - 10, 10, { align: 'right' });

      // Recuadro de info
      const totalQty = bajoPedido.reduce((s, p) => s + Number(p.cantidad || 0), 0);
      const pedidoQty = bajoPedido.reduce((s, p) => s + Number(pedidoCantidades[p.id_producto] || 0), 0);

      doc.setFillColor(252, 249, 246);
      doc.roundedRect(12, 30, W - 24, 12, 2, 2, 'F');
      doc.setDrawColor(220, 180, 140); doc.setLineWidth(0.4);
      doc.roundedRect(12, 30, W - 24, 12, 2, 2, 'S');

      const kv = (label, value, x) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(148, 25, 24);
        doc.text(label, x, 35);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(26, 74, 106);
        doc.text(String(value), x, 40);
      };
      kv('PRODUCTOS A PEDIR', bajoPedido.length, 15);
      kv('CANTIDAD TOTAL A PEDIR', pedidoQty, 75);
      kv('FECHA DE PEDIDO', fechaStr, 150);

      // Tabla
      const head = [['#', 'Código', 'Producto', 'Grosor', 'Cantidad a Pedir']];
      const body = bajoPedido.map((p, i) => {
        const cantidadPedir = Number(pedidoCantidades[p.id_producto] || 0);
        return [
          i + 1,
          p.codigo || '—',
          p.nombre || '',
          p.grosor || '—',
          cantidadPedir > 0 ? String(cantidadPedir) : '—'
        ];
      });

      doc.autoTable({
        startY: 45, head, body,
        styles: {
          font: 'helvetica', fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          textColor: [26, 74, 106], lineColor: [200, 230, 245], lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [148, 25, 24], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7.5, halign: 'center', cellPadding: 4,
        },
        alternateRowStyles: { fillColor: [242, 250, 255] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'center', cellWidth: 25 },
          2: { cellWidth: 'auto' },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'center', cellWidth: 30 },
        },
        didDrawPage: () => {
          const pg  = doc.internal.getCurrentPageInfo().pageNumber;
          const tot = doc.internal.getNumberOfPages();
          doc.setFillColor(148, 25, 24);
          doc.rect(0, H - 10, W, 10, 'F');
          doc.setFillColor(212, 175, 55);
          doc.rect(0, H - 12, W, 2, 'F');
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(255, 210, 170);
          doc.text('VIDRIOBRAS — Pedido de Compra Confidencial', 14, H - 3.5);
          doc.text(`Pág. ${pg} / ${tot}`, W - 14, H - 3.5, { align: 'right' });
        },
        margin: { left: 12, right: 12, top: 45, bottom: 15 },
      });

      doc.save(`pedido-compra-${now.toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '1.5rem' : '2rem',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(243, 251, 255, 0.2) 100%)',
      padding: isMobile ? '16px' : '24px',
      borderRadius: '14px',
      border: '1px solid rgba(128, 194, 220, 0.15)'
    }}>
      {/* EN STOCK */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: isMobile ? '16px' : '20px',
        borderRadius: '12px',
        border: '1.5px solid rgba(128, 194, 220, 0.25)',
        boxShadow: '0 4px 12px rgba(90, 139, 168, 0.08)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: COLORS.primary,
          fontFamily: FONTS.heading,
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          En Stock (&gt; 10 unidades)
        </h3>

        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1.5px solid rgba(128, 194, 220, 0.25)',
          backgroundColor: 'rgba(243, 251, 255, 0.3)',
          boxShadow: 'inset 0 2px 4px rgba(90, 139, 168, 0.06)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? '0.75rem' : '0.9rem',
            fontFamily: FONTS.body,
            minWidth: isMobile ? '280px' : 'auto'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(128, 194, 220, 0.15)', position: 'sticky', top: 0 }}>
                <th style={{
                  border: '1px solid rgba(128, 194, 220, 0.2)',
                  padding: isMobile ? '0.5rem' : '0.75rem',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: COLORS.text,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  fontSize: isMobile ? '0.65rem' : '0.8rem',
                  width: isMobile ? '35px' : '40px'
                }}>
                  ✓
                </th>
                <th style={{
                  border: '1px solid rgba(128, 194, 220, 0.2)',
                  padding: isMobile ? '0.5rem' : '0.75rem',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: COLORS.text,
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  fontSize: isMobile ? '0.65rem' : '0.8rem'
                }}>
                  Nombre
                </th>
                <th style={{
                  border: '1px solid rgba(128, 194, 220, 0.2)',
                  padding: isMobile ? '0.5rem' : '0.75rem',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: COLORS.text,
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  fontSize: isMobile ? '0.65rem' : '0.8rem'
                }}>
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody>
              {productosCache.filter(p => Number(p.cantidad) > 10).length === 0 ? (
                <tr>
                  <td colSpan={3} style={{
                    textAlign: 'center',
                    color: COLORS.textLight,
                    padding: isMobile ? '1rem' : '1.5rem',
                    fontFamily: FONTS.body,
                    fontSize: isMobile ? '0.75rem' : 'inherit'
                  }}>
                    Todos los productos están bajo stock
                  </td>
                </tr>
              ) : (
                productosCache.filter(p => Number(p.cantidad) > 10).map(p => {
                  const isSelected = selectedProductos.has(p.id_producto);
                  return (
                    <tr key={p.id_producto} style={{
                      borderBottom: '1px solid rgba(128, 194, 220, 0.12)',
                      backgroundColor: isSelected ? 'rgba(148, 25, 24, 0.08)' : 'rgba(255, 255, 255, 0.5)',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(148, 25, 24, 0.12)' : 'rgba(128, 194, 220, 0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(148, 25, 24, 0.08)' : 'rgba(255, 255, 255, 0.5)'; }}>
                      <td style={{
                        border: '1px solid rgba(128, 194, 220, 0.12)',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        textAlign: 'center'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleProducto(p.id_producto)}
                          style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                        />
                      </td>
                      <td style={{
                        border: '1px solid rgba(128, 194, 220, 0.12)',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        color: COLORS.text,
                        fontWeight: 500,
                        fontSize: isMobile ? '0.75rem' : 'inherit',
                        wordBreak: 'break-word'
                      }}>
                        {p.nombre}
                      </td>
                      <td style={{
                        border: '1px solid rgba(128, 194, 220, 0.12)',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        fontWeight: 700,
                        color: '#0b8a58',
                        fontSize: isMobile ? '0.75rem' : 'inherit'
                      }}>
                        {p.cantidad}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PENDIENTE */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: isMobile ? '16px' : '20px',
        borderRadius: '12px',
        border: '1.5px solid rgba(128, 194, 220, 0.25)',
        boxShadow: '0 4px 12px rgba(90, 139, 168, 0.08)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: COLORS.primary,
          fontFamily: FONTS.heading,
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          Pendiente de Pedido (≤ 10 unidades)
        </h3>

        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1.5px solid rgba(128, 194, 220, 0.25)',
          backgroundColor: 'rgba(243, 251, 255, 0.3)',
          boxShadow: 'inset 0 2px 4px rgba(90, 139, 168, 0.06)',
          marginBottom: '1rem'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? '0.7rem' : '0.9rem',
            fontFamily: FONTS.body,
            minWidth: isMobile ? '350px' : 'auto'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(128, 194, 220, 0.15)', position: 'sticky', top: 0 }}>
                <th style={{
                  border: '1px solid rgba(128, 194, 220, 0.2)',
                  padding: isMobile ? '0.5rem' : '0.75rem',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: COLORS.text,
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  fontSize: isMobile ? '0.6rem' : '0.8rem'
                }}>
                  Nombre
                </th>
                <th style={{
                  border: '1px solid rgba(128, 194, 220, 0.2)',
                  padding: isMobile ? '0.5rem' : '0.75rem',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: COLORS.text,
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  fontSize: isMobile ? '0.6rem' : '0.8rem'
                }}>
                  Cantidad
                </th>
                <th style={{
                  border: '1px solid rgba(128, 194, 220, 0.2)',
                  padding: isMobile ? '0.5rem' : '0.75rem',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: COLORS.text,
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  fontSize: isMobile ? '0.6rem' : '0.8rem'
                }}>
                  Cantidad a pedir
                </th>
                <th style={{
                  border: '1px solid rgba(128, 194, 220, 0.2)',
                  padding: isMobile ? '0.5rem' : '0.75rem',
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: COLORS.text,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  fontSize: isMobile ? '0.6rem' : '0.8rem',
                  width: isMobile ? '40px' : '50px'
                }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {bajoPedido.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{
                    textAlign: 'center',
                    color: COLORS.textLight,
                    padding: isMobile ? '1rem' : '1.5rem',
                    fontFamily: FONTS.body,
                    fontSize: isMobile ? '0.75rem' : 'inherit'
                  }}>
                    Todos los productos tienen buena existencia
                  </td>
                </tr>
              ) : (
                bajoPedido.map(p => {
                  return (
                    <tr key={p.id_producto} style={{
                      borderBottom: '1px solid rgba(128, 194, 220, 0.12)',
                      backgroundColor: p.esNuevo ? 'rgba(144, 202, 249, 0.2)' : 'rgba(255, 250, 240, 0.5)',
                      borderLeft: p.esNuevo ? '4px solid #2196F3' : 'none',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.esNuevo ? 'rgba(144, 202, 249, 0.35)' : 'rgba(255, 190, 100, 0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.esNuevo ? 'rgba(144, 202, 249, 0.2)' : 'rgba(255, 250, 240, 0.5)'; }}>
                      <td style={{
                        border: '1px solid rgba(128, 194, 220, 0.12)',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        color: COLORS.text,
                        fontWeight: 500,
                        fontSize: isMobile ? '0.7rem' : 'inherit',
                        wordBreak: 'break-word'
                      }}>
                        {p.nombre} {p.esNuevo && <span style={{ color: '#2196F3', fontWeight: 700 }}>●</span>}
                      </td>
                      <td style={{
                        border: '1px solid rgba(128, 194, 220, 0.12)',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        fontWeight: 700,
                        color: '#c97f00',
                        fontSize: isMobile ? '0.7rem' : 'inherit'
                      }}>
                        {p.cantidad}
                      </td>
                      <td style={{
                        border: '1px solid rgba(128, 194, 220, 0.12)',
                        padding: isMobile ? '0.5rem' : '0.75rem'
                      }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pedidoCantidades[p.id_producto] || ''}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setPedidoCantidades(prev => ({ ...prev, [p.id_producto]: val }));
                          }}
                          style={{
                            ...INSET_STYLE,
                            width: '100%',
                            boxSizing: 'border-box',
                            fontSize: isMobile ? '0.7rem' : 'inherit',
                            padding: isMobile ? '6px 8px' : '10px 12px'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(128, 194, 220, 0.55)';
                            e.target.style.boxShadow = 'inset 0 2px 6px rgba(90, 139, 168, 0.1), 0 0 0 3px rgba(128, 194, 220, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(128, 194, 220, 0.28)';
                            e.target.style.boxShadow = 'inset 0 2px 6px rgba(90, 139, 168, 0.08), inset 0 1px 0 rgba(255,255,255, 0.8)';
                          }}
                        />
                      </td>
                      <td style={{
                        border: '1px solid rgba(128, 194, 220, 0.12)',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => handleEliminarDelPedido(p.id_producto)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#e8443a',
                            transition: 'transform 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.15)';
                            e.currentTarget.style.color = '#cc3830';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.color = '#e8443a';
                          }}
                          title="Eliminar del pedido"
                        >
                          <IconTrash size={isMobile ? 14 : 18} stroke={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Formulario para agregar producto nuevo */}
        <div style={{
          background: 'rgba(243, 251, 255, 0.5)',
          border: '1px dashed rgba(128, 194, 220, 0.5)',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '1.5rem',
          marginBottom: isMobile ? '0.5rem' : '1rem'
        }}>
          <h4 style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: 700,
            color: COLORS.primary,
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            AGREGAR PRODUCTO
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '8px' : '10px',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              placeholder="Nombre del producto"
              value={formNombre}
              onChange={e => setFormNombre(e.target.value)}
              style={{ ...INSET_STYLE, gridColumn: isMobile ? '1' : '1 / -1', fontSize: isMobile ? '0.85rem' : 'inherit' }}
            />
            <input
              type="text"
              placeholder="Código"
              value={formCodigo}
              onChange={e => setFormCodigo(e.target.value)}
              style={{ ...INSET_STYLE, fontSize: isMobile ? '0.85rem' : 'inherit' }}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Cantidad"
              value={formCantidad}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setFormCantidad(val);
              }}
              style={{ ...INSET_STYLE, fontSize: isMobile ? '0.85rem' : 'inherit' }}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Grosor (opcional)"
              value={formGrosor}
              onChange={e => {
                const val = e.target.value;
                const cleanVal = val.replace(/[^0-9.]/g, '');
                const parts = cleanVal.split('.');
                const finalVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanVal;
                setFormGrosor(finalVal);
              }}
              style={{ ...INSET_STYLE, fontSize: isMobile ? '0.85rem' : 'inherit' }}
            />
          </div>

          <button
            onClick={handleAgregarProductoNuevo}
            style={{
              width: '100%',
              backgroundColor: 'rgba(128, 194, 220, 0.7)',
              color: COLORS.text,
              padding: isMobile ? '8px' : '10px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 700,
              fontSize: isMobile ? '0.8rem' : '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 194, 220, 0.9)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(128, 194, 220, 0.7)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Agregar a tabla
          </button>
        </div>

        <button
          style={{
            width: '100%',
            backgroundColor: COLORS.secondary,
            color: COLORS.white,
            padding: isMobile ? '10px 12px' : '12px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONTS.heading,
            fontSize: isMobile ? '0.8rem' : '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 8px rgba(128, 194, 220, 0.2)'
          }}
          onClick={handleGenerarPDF}
          disabled={generandoPDF}
          onMouseEnter={(e) => {
            if (!generandoPDF) {
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(128, 194, 220, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(128, 194, 220, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {generandoPDF ? '⏳ Generando PDF…' : 'Crear PDF'}
        </button>
      </div>
    </div>
  );
};

export default ControlStock;
