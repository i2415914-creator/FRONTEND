import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';

const Remetro = ({ notificacion, onToast, onGuardarSuccess, onPagoConfirmado }) => {
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaServicio, setFechaServicio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalMetodoPago, setModalMetodoPago] = useState(false);
  const [serviciosCliente, setServiciosCliente] = useState([]);
  const [servicioActivoIndex, setServicioActivoIndex] = useState(0);
  const [draftPorServicio, setDraftPorServicio] = useState({});
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );
  const fechaHoy = new Date().toISOString().split('T')[0];
  const notificacionId = notificacion?.id_notificacion || notificacion?.id || null;
  const isTablet = viewportWidth <= 1024;
  const isMobile = viewportWidth <= 760;
  const isTinyMobile = viewportWidth <= 420;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const normalizarFechaServicio = (valor) => {
    if (!valor) return '';
    const fecha = String(valor).slice(0, 10);
    return fecha >= fechaHoy ? fecha : fechaHoy;
  };

  const descripcionBaseNotificacion = (raw) => {
    if (!raw) return 'Servicio técnico';
    try {
      const meta = JSON.parse(raw);
      const cant = meta?.cantidad_servicios;
      if (typeof cant === 'number') return `Servicio técnico (${cant} item${cant === 1 ? '' : 's'})`;
      return 'Servicio técnico';
    } catch {
      return String(raw);
    }
  };

  const crearDraftDesdeServicio = (servicio) => ({
    ancho: String(servicio?.ancho_cm ?? servicio?.ancho ?? ''),
    alto: String(servicio?.alto_cm ?? servicio?.alto ?? ''),
    descripcion:
      servicio?.descripcion_presupuesto ||
      servicio?.nombre_servicio ||
      descripcionBaseNotificacion(notificacion?.descripcion),
    fecha_servicio: normalizarFechaServicio(fechaServicio || notificacion?.fecha || fechaHoy)
  });

  const actualizarDraftActivo = (patch) => {
    const servicio = serviciosCliente[servicioActivoIndex];
    if (!servicio?.id) return;

    setDraftPorServicio((prev) => {
      const base = prev[servicio.id] || crearDraftDesdeServicio(servicio);
      return {
        ...prev,
        [servicio.id]: {
          ...base,
          ...patch
        }
      };
    });
  };

  const aplicarServicio = (lista, index) => {
    if (!Array.isArray(lista) || !lista.length) return;
    const safeIndex = Math.max(0, Math.min(index, lista.length - 1));
    const servicio = lista[safeIndex];
    const draft = draftPorServicio[servicio?.id] || crearDraftDesdeServicio(servicio);
    setServicioActivoIndex(safeIndex);
    setAncho(draft.ancho);
    setAlto(draft.alto);
    setDescripcion(draft.descripcion);
    setFechaServicio(normalizarFechaServicio(draft.fecha_servicio));
  };

  const aplicarRemetroGuardado = (remetroData) => {
    if (!remetroData || typeof remetroData !== 'object') return;

    const patch = {};
    if (remetroData.ancho !== null && remetroData.ancho !== undefined && remetroData.ancho !== '') {
      patch.ancho = String(remetroData.ancho);
    }
    if (remetroData.alto !== null && remetroData.alto !== undefined && remetroData.alto !== '') {
      patch.alto = String(remetroData.alto);
    }
    if (typeof remetroData.descripcion === 'string' && remetroData.descripcion.trim()) {
      patch.descripcion = remetroData.descripcion;
    }
    if (remetroData.fecha_servicio) {
      patch.fecha_servicio = normalizarFechaServicio(remetroData.fecha_servicio);
    }

    if (Object.keys(patch).length) {
      actualizarDraftActivo(patch);
      if (patch.ancho !== undefined) setAncho(patch.ancho);
      if (patch.alto !== undefined) setAlto(patch.alto);
      if (patch.descripcion !== undefined) setDescripcion(patch.descripcion);
      if (patch.fecha_servicio !== undefined) setFechaServicio(patch.fecha_servicio);
    }
  };

  const totalServicios = serviciosCliente.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

  useEffect(() => {
    setPrecio(totalServicios > 0 ? totalServicios.toFixed(2) : '');
  }, [totalServicios]);

  // Obtener servicios estrictamente asociados a esta notificación
  useEffect(() => {
    if (!notificacionId) return;

    console.log('[REMETRO] Notificación recibida:', notificacion);

    const obtenerServiciosAsociados = async () => {
      try {
        setCargando(true);

        console.log('[REMETRO] Buscando servicios por notificacion:', notificacionId);
        const response = await fetch(`/api/presupuestos/notificacion/${notificacionId}/servicios`);
        const data = await response.json();

        console.log('[REMETRO] Respuesta servicios asociados:', data);

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const servicios = data.data
            .map((item, idx) => ({
              id: item.id_presupuesto || `${idx}`,
              orden: idx + 1,
              ancho_cm: parseFloat(item.ancho) || 0,
              alto_cm: parseFloat(item.alto) || 0,
              total: parseFloat(item.total) || 0,
              nombre_servicio: item.nombre_servicio || `servicio${idx + 1}`,
              descripcion_presupuesto: item.descripcion || '',
              imagen_url: item.imagen_url || '',
            }))
            .filter((s) => s.id);

          if (servicios.length) {
            setServiciosCliente(servicios);
            setDraftPorServicio((prev) => {
              const next = { ...prev };
              servicios.forEach((servicio) => {
                if (!next[servicio.id]) {
                  next[servicio.id] = crearDraftDesdeServicio(servicio);
                }
              });
              return next;
            });
            setServicioActivoIndex(0);
            const primer = servicios[0];
            const primerDraft = (draftPorServicio[primer?.id] || crearDraftDesdeServicio(primer));
            setAncho(primerDraft.ancho);
            setAlto(primerDraft.alto);
            setDescripcion(primerDraft.descripcion);
          } else {
            setServiciosCliente([]);
            setDescripcion(descripcionBaseNotificacion(notificacion?.descripcion));
          }
          const fechaNotif = notificacion.fecha || fechaHoy;
          setFechaServicio(fechaNotif < fechaHoy ? fechaHoy : fechaNotif);
        } else {
          console.log('[REMETRO] Sin servicios asociados a la notificación');
          setServiciosCliente([]);
          setDescripcion(descripcionBaseNotificacion(notificacion?.descripcion));
          const fechaNotif = notificacion.fecha || fechaHoy;
          setFechaServicio(fechaNotif < fechaHoy ? fechaHoy : fechaNotif);
        }
      } catch (error) {
        console.error('[REMETRO] Error obteniendo servicios asociados:', error);
        setServiciosCliente([]);
        setDescripcion(descripcionBaseNotificacion(notificacion?.descripcion));
        const fechaNotif = notificacion.fecha || fechaHoy;
        setFechaServicio(fechaNotif < fechaHoy ? fechaHoy : fechaNotif);
        onToast && onToast('Error al cargar servicios del presupuesto', 'error');
      } finally {
        setCargando(false);
      }
    };

    obtenerServiciosAsociados();
  }, [notificacionId]);

  useEffect(() => {
    if (!notificacionId) return;

    const cargarRemetroGuardado = async () => {
      try {
        const resp = await fetch(`/api/servicio/remetro/${notificacionId}`);
        const data = await resp.json();
        if (resp.ok && data.success && data.data) {
          aplicarRemetroGuardado(data.data);
        }
      } catch (error) {
        console.warn('[REMETRO] No se pudo precargar REMETRO guardado:', error);
      }
    };

    cargarRemetroGuardado();
  }, [notificacionId]);

  const handleGuardarConMetodo = async (metodoPago) => {
    const precioNumerico = Number(precio);
    const precioFinal = Number.isNaN(precioNumerico) || precioNumerico <= 0 ? null : precioNumerico;

    if (!precioFinal) {
      onToast && onToast('Ingrese un precio valido mayor a 0', 'error');
      return;
    }

    const notificacionId = notificacion?.id_notificacion || notificacion?.id || null;

    let carritoId = null;

    try {
      const respServicio = await fetch('/api/barra_progreso/servicio/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificacion_id: notificacionId,
          cliente_id: notificacion?.id_cliente || notificacion?.cliente_id || null,
          cliente_nombre: notificacion?.nombre || null,
          cliente_correo: notificacion?.correo || null
        })
      });
      const dataServicio = await respServicio.json();
      if (!respServicio.ok || !dataServicio.success) {
        onToast && onToast(dataServicio.message || 'No se pudo iniciar el servicio en carrito', 'error');
      } else {
        // Extraer carrito_id de la respuesta
        if (dataServicio.data && Array.isArray(dataServicio.data) && dataServicio.data.length > 0) {
          carritoId = dataServicio.data[0].id_carrito;
          console.log('[REMETRO] Carrito ID capturado:', carritoId);
        }
      }
    } catch (error) {
      onToast && onToast('No se pudo validar cliente para barra de servicio', 'error');
    }

    try {
      const serviciosActualizados = serviciosCliente
        .filter((servicio) => Boolean(servicio?.id))
        .map((servicio) => {
          const draft = draftPorServicio[servicio.id] || crearDraftDesdeServicio(servicio);
          return {
            id_presupuesto: servicio.id,
            ancho: Number(draft.ancho) || null,
            alto: Number(draft.alto) || null,
            descripcion: (draft.descripcion || '').trim() || null
          };
        });

      const respRemetro = await fetch('/api/servicio/remetro/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificacion_id: notificacionId,
          ancho: Number(ancho) || null,
          alto: Number(alto) || null,
          serie: '',
          precio: precioFinal,
          metodo_pago: metodoPago,
          descripcion,
          fecha_servicio: fechaServicio,
          servicios_actualizados: serviciosActualizados
        })
      });

      const dataRemetro = await respRemetro.json();
      if (!respRemetro.ok || !dataRemetro.success) {
        onToast && onToast(dataRemetro.message || 'No se pudo guardar REMETREO', 'error');
        return;
      }

      if (!dataRemetro.venta_registrada) {
        onToast && onToast('No se registro la venta del servicio. Verifique precio/metodo.', 'error');
        return;
      }

      if (!dataRemetro.remetro_guardado) {
        onToast && onToast('Venta registrada, pero no se pudo actualizar REMETREO por falta de notificacion.', 'error');
      }

      setServiciosCliente((prev) => prev.map((item, idx) => {
        if (idx !== servicioActivoIndex) return item;
        const draft = draftPorServicio[item.id] || {};
        return {
          ...item,
          ancho_cm: Number(draft.ancho) || Number(ancho) || item.ancho_cm,
          alto_cm: Number(draft.alto) || Number(alto) || item.alto_cm,
          descripcion_presupuesto: (draft.descripcion || descripcion || '').trim() || item.descripcion_presupuesto
        };
      }));
    } catch (error) {
      onToast && onToast('Error al guardar datos de REMETREO', 'error');
      return;
    }

    onToast && onToast('Pago registrado. Ahora genera el comprobante.', 'success');
    console.log('[REMETREO] Datos confirmados:', {
      ancho,
      alto,
      precio: precioFinal,
      metodoPago,
      descripcion,
      fechaServicio
    });

    const productoServicio = {
      nombre: (descripcion || 'Servicio técnico').trim(),
      descripcion: (descripcion || 'Servicio técnico').trim(),
      cantidad: 1,
      precio_unitario: Number(precioFinal),
      subtotal: Number(precioFinal),
      tipo_producto: 'SERVICIO',
      categoria: 'SERVICIO'
    };

    // Sumar el precio del servicio a la caja activa
    try {
      await fetch('/api/caja/sumar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: precioFinal })
      });
    } catch (_) {
      // No bloquear el flujo si falla la actualización de caja
    }

    if (onPagoConfirmado) {
      onPagoConfirmado({ carritoId: carritoId || null, productos: [productoServicio] });
    } else if (onGuardarSuccess) {
      onGuardarSuccess(carritoId || null);
    }
  };

  const handleGuardar = () => {
    const precioNumerico = Number(precio);
    if (Number.isNaN(precioNumerico) || precioNumerico <= 0) {
      onToast && onToast('Ingrese un precio valido mayor a 0', 'error');
      return;
    }
    if (!fechaServicio || fechaServicio < fechaHoy) {
      onToast && onToast('La fecha de servicio no puede ser anterior a hoy', 'error');
      return;
    }

    // TODO: MODO PRUEBA — descomentar las dos líneas de abajo y eliminar las de abajo cuando el diseño esté listo
    // setModalMetodoPago(true);

    // MODO PRUEBA: salta directo a DISEÑO sin pago ni comprobante
    onGuardarSuccess && onGuardarSuccess(null);
  };

  const servicioActivo = serviciosCliente[servicioActivoIndex] || null;
  const animacionesRemetro = `
    @keyframes rmDash {
      to { stroke-dashoffset: -28; }
    }
    @keyframes rmPulse {
      0% { opacity: .45; }
      50% { opacity: 1; }
      100% { opacity: .45; }
    }
    @keyframes rmGlow {
      0% { box-shadow: 0 0 0 rgba(90,139,168,0); }
      50% { box-shadow: 0 0 16px rgba(90,139,168,.22); }
      100% { box-shadow: 0 0 0 rgba(90,139,168,0); }
    }
  `;

  return (
    <div>
      <style>{animacionesRemetro}</style>
      {/* Cabecera: navegador de servicios */}
      <div style={{ marginBottom: '12px' }}>
        <div>
          {serviciosCliente.length > 0 && (
            <div style={{ marginTop: 2, padding: '6px 8px', border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.gray[50] }}>
              <div style={{
                display: 'flex',
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                alignItems: 'center',
                gap: 6,
                justifyContent: isMobile ? 'flex-start' : 'center',
                overflowX: isMobile ? 'auto' : 'visible',
                paddingBottom: isMobile ? 2 : 0
              }}>
                {serviciosCliente.map((servicio, idx) => (
                  <React.Fragment key={servicio.id || idx}>
                    <button
                      type="button"
                      onClick={() => aplicarServicio(serviciosCliente, idx)}
                      style={{
                        flex: '0 0 auto',
                        whiteSpace: 'nowrap',
                        border: idx === servicioActivoIndex ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                        background: idx === servicioActivoIndex ? 'rgba(148,25,24,.08)' : COLORS.white,
                        color: COLORS.text,
                        borderRadius: 999,
                        padding: '3px 9px',
                        fontFamily: FONTS.body,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {`${servicio.nombre_servicio || `servicio${idx + 1}`}`} ({servicio.ancho_cm}x{servicio.alto_cm})
                    </button>
                    {idx < serviciosCliente.length - 1 && (
                      <span style={{ color: COLORS.textLight, fontWeight: 700, fontSize: 14 }}>&lt;</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Layout principal: izquierda (imagen + gráfico) y derecha (datos) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isTablet ? '1fr' : '2.6fr 1fr',
        gap: isMobile ? '12px' : '14px',
        marginBottom: '16px'
      }}>
        {/* Área de medidas */}
        <div style={{
          order: isMobile ? 2 : 1,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '270px 1fr',
          gap: '12px',
          alignItems: 'stretch'
        }}>
          <div style={{
            order: isMobile ? 2 : 1,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            background: COLORS.gray[50],
            minHeight: isMobile ? '190px' : '272px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {servicioActivo?.imagen_url ? (
              <img
                src={servicioActivo.imagen_url}
                alt={servicioActivo.nombre_servicio || 'Servicio'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: COLORS.textLight, fontSize: 12, fontFamily: FONTS.body }}>Sin imagen</span>
            )}
          </div>

          {/* Rectángulo con medidas */}
          <div style={{
            order: isMobile ? 1 : 2,
            border: `2px solid ${COLORS.text}`,
            padding: isMobile ? '26px 12px' : '28px 18px',
            minHeight: isMobile ? '240px' : '272px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f3f6fb',
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(90,139,168,.11) 0, rgba(90,139,168,.11) 1px, transparent 1px, transparent 36px), repeating-linear-gradient(90deg, rgba(90,139,168,.08) 0, rgba(90,139,168,.08) 1px, transparent 1px, transparent 64px), linear-gradient(180deg, rgba(255,255,255,.9), rgba(226,236,246,.8))',
            borderRadius: 8,
            animation: 'rmGlow 2.8s ease-in-out infinite'
          }}>
            {/* Medida ANCHO - arriba centrado */}
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: isTinyMobile ? 11 : 12, fontFamily: FONTS.heading, color: COLORS.text }}>ANCHO</span>
              <input
                type="text"
                inputMode="numeric"
                value={ancho}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAncho(val);
                  actualizarDraftActivo({ ancho: val });
                }}
                placeholder="cm"
                style={{
                  width: isTinyMobile ? '62px' : '72px',
                  padding: '3px 6px',
                  border: `1px solid ${COLORS.text}`,
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 500,
                  fontFamily: FONTS.body,
                  fontSize: isTinyMobile ? 10 : 11,
                  color: COLORS.text
                }}
              />
            </div>

            {/* Dibujo dinámico de rectángulo basado en medidas */}
            {(() => {
              const anchoVal = parseFloat(ancho) || 100;
              const altoVal = parseFloat(alto) || 100;
              const maxWidth = 360;
              const maxHeight = 188;
              const ratio = anchoVal / altoVal;
              let rectWidth, rectHeight;

              if (ratio > maxWidth / maxHeight) {
                rectWidth = maxWidth;
                rectHeight = maxWidth / ratio;
              } else {
                rectHeight = maxHeight;
                rectWidth = maxHeight * ratio;
              }

              const svgWidth = 420;
              const svgHeight = 230;
              const offsetX = (svgWidth - rectWidth) / 2;
              const offsetY = (svgHeight - rectHeight) / 2;

              const x1 = offsetX;
              const y1 = offsetY;
              const x2 = offsetX + rectWidth;
              const y2 = offsetY + rectHeight;

              return (
                <svg width="390" height="210" style={{ maxWidth: '100%' }}>
                  <rect x={x1} y={y1} width={rectWidth} height={rectHeight} fill="rgba(128,194,220,.14)" stroke="rgba(26,42,58,.88)" strokeWidth="2.2" />

                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,74,98,.45)" strokeWidth="1.8" strokeDasharray="5 4" style={{ animation: 'rmDash 2.2s linear infinite' }} />
                  <line x1={x2} y1={y1} x2={x1} y2={y2} stroke="rgba(45,74,98,.45)" strokeWidth="1.8" strokeDasharray="5 4" style={{ animation: 'rmDash 2.2s linear infinite' }} />

                  <line x1={x1 - 8} y1={y1 - 10} x2={x2 + 8} y2={y1 - 10} stroke="rgba(26,42,58,.9)" strokeWidth="2" markerStart="url(#arrowleft)" markerEnd="url(#arrowright)" style={{ animation: 'rmPulse 2s ease-in-out infinite' }} />
                  <line x1={x2 + 14} y1={y1 - 4} x2={x2 + 14} y2={y2 + 4} stroke="rgba(26,42,58,.9)" strokeWidth="2" markerStart="url(#arrowup)" markerEnd="url(#arrowdown)" style={{ animation: 'rmPulse 2s ease-in-out infinite' }} />

                  <text x={(x1 + x2) / 2} y={y1 - 16} textAnchor="middle" fontSize="10" fontWeight="700" fill="rgba(26,42,58,.85)">{`ANCHO ${Math.round(anchoVal)} cm`}</text>
                  <text x={x2 + 22} y={(y1 + y2) / 2} textAnchor="start" fontSize="10" fontWeight="700" fill="rgba(26,42,58,.85)">{`ALTO ${Math.round(altoVal)} cm`}</text>

                  <defs>
                    <marker id="arrowleft" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                      <polygon points="10,5 0,0 0,10" fill={COLORS.text} />
                    </marker>
                    <marker id="arrowright" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                      <polygon points="0,5 10,0 10,10" fill={COLORS.text} />
                    </marker>
                    <marker id="arrowup" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                      <polygon points="5,0 0,10 10,10" fill={COLORS.text} />
                    </marker>
                    <marker id="arrowdown" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                      <polygon points="0,0 10,0 5,10" fill={COLORS.text} />
                    </marker>
                  </defs>
                </svg>
              );
            })()}

            {/* Medida LARGO - abajo centrado */}
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: isTinyMobile ? 11 : 12, fontFamily: FONTS.heading, color: COLORS.text }}>LARGO</span>
              <input
                type="text"
                inputMode="numeric"
                value={alto}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAlto(val);
                  actualizarDraftActivo({ alto: val });
                }}
                placeholder="cm"
                style={{
                  width: isTinyMobile ? '62px' : '72px',
                  padding: '3px 6px',
                  border: `1px solid ${COLORS.text}`,
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 500,
                  fontFamily: FONTS.body,
                  fontSize: isTinyMobile ? 10 : 11,
                  color: COLORS.text
                }}
              />
            </div>
          </div>
        </div>

        {/* Panel derecho: Resumen del servicio */}
        <div style={{ order: isMobile ? 1 : 2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            background: 'linear-gradient(180deg, #ffffff 0%, #f2f7ff 100%)',
            padding: '12px 12px 10px',
            boxShadow: '0 6px 18px rgba(15, 30, 53, .06)'
          }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 7,
              fontFamily: FONTS.heading,
              color: COLORS.text,
              letterSpacing: 0.5
            }}>PRECIO DEL SERVICIO</label>
            <input
              value={precio}
              type="text"
              inputMode="decimal"
              onChange={(e) => {
                const raw = e.target.value;
                // Solo dígitos y un punto decimal; sin signos + ni -
                const limpio = raw.replace(/[^0-9.]/g, '');
                // Evitar más de un punto decimal
                const partes = limpio.split('.');
                const normalizado = partes.length > 2
                  ? partes[0] + '.' + partes.slice(1).join('')
                  : limpio;
                setPrecio(normalizado);
              }}
              placeholder="Ingrese el precio"
              style={{
                width: '100%',
                padding: '11px 12px',
                border: `1px solid rgba(27,44,66,.18)`,
                borderRadius: '10px',
                fontFamily: FONTS.body,
                fontSize: 16,
                fontWeight: 700,
                background: 'rgba(255,255,255,.95)',
                color: COLORS.text,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,.04)'
              }}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: COLORS.textLight, fontFamily: FONTS.body }}>
              Suma de servicios asociados: {serviciosCliente.length}
            </div>
          </div>

          <div style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            background: '#fff',
            padding: '12px',
            boxShadow: '0 6px 18px rgba(15, 30, 53, .05)'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              marginBottom: 7,
              fontFamily: FONTS.heading,
              color: COLORS.text,
              letterSpacing: 0.5
            }}>DESCRIPCION DEL TRABAJO</label>
            <textarea
              value={descripcion}
              onChange={(e) => {
                const val = e.target.value;
                setDescripcion(val);
                actualizarDraftActivo({ descripcion: val });
              }}
              placeholder="Descripción del trabajo a realizar"
              rows={isMobile ? 4 : 6}
              style={{
                width: '100%',
                padding: '10px 11px',
                border: `1px solid rgba(27,44,66,.18)`,
                borderRadius: '10px',
                fontSize: 13,
                fontFamily: FONTS.body,
                resize: 'none',
                color: COLORS.text,
                lineHeight: 1.45,
                background: '#fbfdff'
              }}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: COLORS.textLight, fontFamily: FONTS.body }}>
              Este texto se guardara junto al pago de REMETRO.
            </div>
          </div>

          <div style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            background: '#fff',
            padding: '12px',
            boxShadow: '0 6px 18px rgba(15, 30, 53, .05)'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              marginBottom: 7,
              fontFamily: FONTS.heading,
              color: COLORS.text,
              letterSpacing: 0.5
            }}>FECHA PARA REALIZAR EL SERVICIO</label>
            <input
              value={fechaServicio}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || val >= fechaHoy) {
                  setFechaServicio(val);
                  actualizarDraftActivo({ fecha_servicio: val });
                }
              }}
              type="date"
              min={fechaHoy}
              style={{
                width: '100%',
                padding: '10px 11px',
                border: `1px solid rgba(27,44,66,.18)`,
                borderRadius: '10px',
                fontFamily: FONTS.body,
                fontSize: 13,
                color: COLORS.text,
                background: '#fbfdff'
              }}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: COLORS.textLight, fontFamily: FONTS.body }}>
              No se permiten fechas anteriores al dia actual.
            </div>
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <button
          style={{
            background: COLORS.text,
            color: COLORS.white,
            border: `2px solid ${COLORS.text}`,
            borderRadius: '8px',
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '420px' : 'none',
            padding: isMobile ? '10px 14px' : '8px 28px',
            fontWeight: 700,
            fontSize: isMobile ? 14 : 13,
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontFamily: FONTS.heading,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClick={handleGuardar}
        >
          GUARDAR
        </button>
      </div>

      {modalMetodoPago && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 20% 15%, rgba(128,194,220,0.26), rgba(0,0,0,0.38))',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.34), rgba(128,194,220,0.2))',
            borderRadius: '16px',
            border: '1px solid rgba(168,217,237,0.55)',
            width: 'min(92vw, 360px)',
            maxWidth: '92vw',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 22px 42px rgba(5,25,43,0.26), inset 0 1px 0 rgba(255,255,255,0.4)',
            transform: 'perspective(900px) rotateX(2deg)',
            backdropFilter: 'blur(14px) saturate(145%)',
            WebkitBackdropFilter: 'blur(14px) saturate(145%)'
          }}>
            <h3 style={{ margin: '0 0 14px 0', fontFamily: FONTS.heading, color: '#0f2a3f', letterSpacing: '0.02em' }}>
              Selecciona metodo de pago
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                style={{
                  background: 'linear-gradient(135deg, #80C2DC, #5a8ba8)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.24)',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(90,139,168,0.34), inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
                onClick={() => {
                  setModalMetodoPago(false);
                  handleGuardarConMetodo('al contado');
                }}
              >
                Pagar al contado
              </button>
              <button
                style={{
                  background: 'linear-gradient(135deg, #7a2ee6, #5b21b6)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.24)',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(91,33,182,0.34), inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
                onClick={() => {
                  setModalMetodoPago(false);
                  handleGuardarConMetodo('por yape');
                }}
              >
                Pagar por Yape
              </button>
              <button
                style={{
                  background: 'linear-gradient(135deg, #d43a37, #941918)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.24)',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(148,25,24,0.34), inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
                onClick={() => {
                  setModalMetodoPago(false);
                  handleGuardarConMetodo('por tarjeta');
                }}
              >
                Pagar por tarjeta
              </button>
              <button
                style={{ background: 'transparent', color: '#3b5568', border: 'none', padding: '8px', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setModalMetodoPago(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Remetro;
