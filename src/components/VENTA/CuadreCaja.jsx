import React, { useEffect, useRef, useState } from "react";
import { IconFileTypePdf } from '@tabler/icons-react';
import { COLORS, FONTS } from "../../colors";
import { apiFetch, buildApiUrl } from "../../config";

const CuadreCaja = () => {
  const usuario = "Juan Pérez"; // Temporal
  const [totales, setTotales] = useState({ tarjeta: 0, contado: 0, yape: 0, total: 0 });
  const [totalesAnimados, setTotalesAnimados] = useState({ tarjeta: 0, contado: 0, yape: 0, total: 0 });
  const [comprobantes, setComprobantes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [retiro, setRetiro] = useState("");
  const [baseCaja, setBaseCaja] = useState(0);
  const [baseCajaAnimada, setBaseCajaAnimada] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState(false);
  const [retiros, setRetiros] = useState([]);
  const [estadoRealtime, setEstadoRealtime] = useState("conectando");
  const [pulsoRealtime, setPulsoRealtime] = useState(false);
  const animationFrameTotalesRef = useRef(null);
  const animationFrameCajaRef = useRef(null);
  const totalesAnimadosRef = useRef({ tarjeta: 0, contado: 0, yape: 0, total: 0 });
  const baseCajaAnimadaRef = useRef(0);
  const timeoutPulsoRef = useRef(null);

  const normalizarCuadreData = (data) => ({
    totales: {
      tarjeta: Number(data?.totales?.tarjeta || 0),
      contado: Number(data?.totales?.contado || 0),
      yape: Number(data?.totales?.yape || 0),
      total: Number(data?.totales?.total || 0),
    },
    comprobantes: Array.isArray(data?.comprobantes) ? data.comprobantes : [],
    cantidadEnCaja: Number(data?.cantidad_en_caja || 0),
    retiros: Array.isArray(data?.retiros) ? data.retiros : [],
  });

  const dispararPulsoRealtime = () => {
    setPulsoRealtime(false);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => setPulsoRealtime(true));
    } else {
      setPulsoRealtime(true);
    }

    if (timeoutPulsoRef.current) {
      clearTimeout(timeoutPulsoRef.current);
    }
    timeoutPulsoRef.current = setTimeout(() => setPulsoRealtime(false), 850);
  };

  const aplicarCuadreCaja = (rawData, options = {}) => {
    const { desdeStream = false } = options;
    const data = normalizarCuadreData(rawData);
    setTotales(data.totales);
    setComprobantes(data.comprobantes);
    setBaseCaja(data.cantidadEnCaja);
    setRetiros(data.retiros);

    if (desdeStream) {
      setEstadoRealtime('conectado');
      dispararPulsoRealtime();
    }
  };

  const cargarCuadreCaja = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/caja/cuadre");
      const data = await res.json();
      aplicarCuadreCaja(data);
    } catch (err) {
      setError("No se pudo cargar el cuadre de caja");
    } finally {
      setLoading(false);
    }
  };

  const cardGlassStyle = {
    background: 'linear-gradient(145deg, rgba(186, 232, 255, 0.45), rgba(120, 206, 245, 0.18))',
    borderRadius: '16px',
    boxShadow: '0 14px 32px rgba(77, 147, 199, 0.18)',
    padding: '24px',
    border: '1px solid rgba(140, 212, 247, 0.55)',
    backdropFilter: 'blur(8px)',
    animation: 'cardFloatIn 420ms ease-out both'
  };

  useEffect(() => {
    totalesAnimadosRef.current = totalesAnimados;
  }, [totalesAnimados]);

  useEffect(() => {
    baseCajaAnimadaRef.current = baseCajaAnimada;
  }, [baseCajaAnimada]);

  useEffect(() => {
    if (animationFrameTotalesRef.current) {
      cancelAnimationFrame(animationFrameTotalesRef.current);
    }

    const origen = { ...totalesAnimadosRef.current };
    const destino = { ...totales };
    const duracion = 700;
    const inicio = performance.now();

    const animar = (ahora) => {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      const eased = 1 - Math.pow(1 - progreso, 3);
      const siguiente = {
        tarjeta: origen.tarjeta + (destino.tarjeta - origen.tarjeta) * eased,
        contado: origen.contado + (destino.contado - origen.contado) * eased,
        yape: origen.yape + (destino.yape - origen.yape) * eased,
        total: origen.total + (destino.total - origen.total) * eased,
      };
      totalesAnimadosRef.current = siguiente;
      setTotalesAnimados(siguiente);

      if (progreso < 1) {
        animationFrameTotalesRef.current = requestAnimationFrame(animar);
      }
    };

    animationFrameTotalesRef.current = requestAnimationFrame(animar);

    return () => {
      if (animationFrameTotalesRef.current) {
        cancelAnimationFrame(animationFrameTotalesRef.current);
      }
    };
  }, [totales]);

  useEffect(() => {
    if (animationFrameCajaRef.current) {
      cancelAnimationFrame(animationFrameCajaRef.current);
    }

    const origen = Number(baseCajaAnimadaRef.current || 0);
    const destino = Number(baseCaja || 0);
    const duracion = 700;
    const inicio = performance.now();

    const animar = (ahora) => {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      const eased = 1 - Math.pow(1 - progreso, 3);
      const siguiente = origen + (destino - origen) * eased;
      baseCajaAnimadaRef.current = siguiente;
      setBaseCajaAnimada(siguiente);

      if (progreso < 1) {
        animationFrameCajaRef.current = requestAnimationFrame(animar);
      }
    };

    animationFrameCajaRef.current = requestAnimationFrame(animar);

    return () => {
      if (animationFrameCajaRef.current) {
        cancelAnimationFrame(animationFrameCajaRef.current);
      }
    };
  }, [baseCaja]);

  useEffect(() => {
    cargarCuadreCaja();

    const handleVentaConfirmada = async () => {
      await cargarCuadreCaja();
    };

    const handleStorage = (event) => {
      if (event.key !== 'venta_confirmada' || !event.newValue) return;
      cargarCuadreCaja();
    };

    window.addEventListener('venta-confirmada', handleVentaConfirmada);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('venta-confirmada', handleVentaConfirmada);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return undefined;

    const es = new EventSource(buildApiUrl('/api/realtime/caja'));

    const onCajaChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        const ultimoCambioConData = [...changes].reverse().find((change) => change?.record);
        if (!ultimoCambioConData?.record) return;
        setEstadoRealtime('conectado');
        aplicarCuadreCaja(ultimoCambioConData.record, { desdeStream: !payload?.initial });
      } catch {
        // Ignorar payloads incompletos del stream.
      }
    };

    const onHeartbeat = () => setEstadoRealtime('conectado');

    es.addEventListener('caja_changed', onCajaChanged);
    es.addEventListener('heartbeat', onHeartbeat);
    es.onerror = () => setEstadoRealtime('reconectando');

    return () => {
      es.removeEventListener('caja_changed', onCajaChanged);
      es.removeEventListener('heartbeat', onHeartbeat);
      es.close();
      if (timeoutPulsoRef.current) {
        clearTimeout(timeoutPulsoRef.current);
      }
    };
  }, []);

  const handleRetiro = () => {
    if (!retiro || isNaN(retiro) || Number(retiro) <= 0) {
      setError("Ingrese un monto válido");
      return;
    }
    if (Number(retiro) > baseCaja) {
      setError("No puede retirar más que el total en caja");
      return;
    }
    setModal(true);
  };

  const confirmarRetiro = () => {
    setLoading(true);
    apiFetch("/api/caja/retiro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto: Number(retiro), usuario }),
    })
      .then(res => res.json())
      .then(data => {
        setModal(false);
        setRetiro("");
        setError("");
        if (data.success) {
          setSuccess(data.message || "Retiro registrado correctamente");
          setTimeout(() => setSuccess(""), 3500);
          // Recargar cuadre completo (cantidad en caja + retiros)
          apiFetch("/api/caja/cuadre")
            .then(res => res.json())
            .then(data => aplicarCuadreCaja(data));
        } else {
          setError(data.message || "Error al registrar el retiro");
        }
      })
      .catch(() => {
        setError("Error al registrar el retiro");
        setModal(false);
      })
      .finally(() => setLoading(false));
  };

  // Filtrar comprobantes por búsqueda
  const comprobantesFiltrados = comprobantes.filter(c =>
    (c.comprobante || c.numero || c.documento || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cliente?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const esPdfUrl = (valor) => {
    const v = String(valor || '').trim();
    if (!v) return false;
    return v.startsWith('http://') || v.startsWith('https://') || v.endsWith('.pdf');
  };

  // Imprimir arqueo profesional
  const handleImprimir = () => {
    const fechaHoy = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const horaHoy  = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const totalRetirado = retiros.reduce((acc, r) => acc + Number(r.monto), 0);

    const extraerNombreComprobante = (val) => {
      const v = String(val || '').trim();
      if (!v) return '-';
      // Si es URL, extraer el nombre del archivo sin extensión
      if (v.startsWith('http')) {
        const partes = v.split('/');
        const archivo = partes[partes.length - 1] || '';
        return archivo.replace(/\.pdf$/i, '') || v;
      }
      return v;
    };

    const filasComprobantes = comprobantes.length === 0
      ? `<tr><td colspan="3" style="text-align:center;color:#888;padding:12px;">Sin comprobantes registrados hoy</td></tr>`
      : comprobantes.map((c, i) => `
          <tr style="background:${i % 2 === 0 ? '#f0faff' : '#ffffff'}">
            <td>${extraerNombreComprobante(c.comprobante || c.documento || c.numero)}</td>
            <td>${c.cliente || '-'}</td>
            <td style="text-align:right;font-weight:600;">S/ ${Number(c.monto || 0).toFixed(2)}</td>
          </tr>`).join('');

    const filasRetiros = retiros.length === 0
      ? `<tr><td colspan="2" style="text-align:center;color:#888;padding:12px;">Sin retiros registrados hoy</td></tr>`
      : retiros.map((r, i) => `
          <tr style="background:${i % 2 === 0 ? '#fff5f5' : '#ffffff'}">
            <td>Retiro #${i + 1} &nbsp;<span style="font-size:11px;color:#888;">${r.fecha || ''}</span></td>
            <td style="text-align:right;font-weight:600;color:#b91c1c;">S/ ${Number(r.monto || 0).toFixed(2)}</td>
          </tr>`).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Arqueo de Caja – VIDRIOBRAS</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 32px 40px; font-size: 13px; }

          /* Encabezado */
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .brand-title { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #0c1445; }
          .brand-title span { color: #0ea5e9; }
          .brand-subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
          .doc-info { text-align: right; }
          .doc-info h2 { font-size: 18px; font-weight: 700; color: #0ea5e9; }
          .doc-info p { font-size: 11px; color: #64748b; margin-top: 4px; }

          /* Resumen totales */
          .totales-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
          .totales-card { background: linear-gradient(135deg, #e0f5ff 0%, #cceeff 100%); border: 1px solid #bae6fd; border-radius: 10px; padding: 14px 16px; }
          .totales-card.highlight { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-color: #0369a1; color: #fff; }
          .totales-card .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.75; }
          .totales-card .value { font-size: 20px; font-weight: 800; margin-top: 4px; }
          .totales-card.highlight .label, .totales-card.highlight .value { color: #fff; opacity: 1; }

          /* Cantidad en caja */
          .caja-banner { background: linear-gradient(90deg, #0c1445 0%, #0ea5e9 100%); color: #fff; border-radius: 10px; padding: 14px 22px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
          .caja-banner .label-c { font-size: 12px; font-weight: 600; opacity: 0.8; }
          .caja-banner .amount { font-size: 26px; font-weight: 900; }

          /* Secciones */
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #0369a1; border-left: 4px solid #0ea5e9; padding-left: 10px; margin-bottom: 10px; }
          .section { margin-bottom: 28px; }

          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #0ea5e9; color: #fff; }
          th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
          td { padding: 9px 12px; border-bottom: 1px solid #e2f3fc; }

          .total-row td { font-weight: 700; font-size: 13px; background: #f0fafe; border-top: 2px solid #0ea5e9; }

          /* Footer */
          .footer { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }

          @page { margin: 0mm; }
          @media print {
            body { padding: 16px 24px; }
          }
        </style>
      </head>
      <body>
        <!-- Encabezado -->
        <div class="header">
          <div class="brand">
            <div>
              <div class="brand-title">VIDRIO<span>BRAS</span></div>
              <div class="brand-subtitle">Sistema de gestión de caja</div>
            </div>
          </div>
          <div class="doc-info">
            <h2>ARQUEO DE CAJA</h2>
            <p>Fecha: ${fechaHoy}</p>
            <p>Hora de impresión: ${horaHoy}</p>
          </div>
        </div>

        <!-- Totales por método -->
        <div class="totales-grid">
          <div class="totales-card">
            <div class="label">Por Tarjeta</div>
            <div class="value">S/ ${totales.tarjeta.toFixed(2)}</div>
          </div>
          <div class="totales-card">
            <div class="label">Al Contado</div>
            <div class="value">S/ ${totales.contado.toFixed(2)}</div>
          </div>
          <div class="totales-card">
            <div class="label">Por Yape</div>
            <div class="value">S/ ${totales.yape.toFixed(2)}</div>
          </div>
          <div class="totales-card highlight">
            <div class="label">Total General</div>
            <div class="value">S/ ${totales.total.toFixed(2)}</div>
          </div>
        </div>

        <!-- Cantidad en caja -->
        <div class="caja-banner">
          <div class="label-c">Cantidad actual en Caja</div>
          <div class="amount">S/ ${baseCaja.toFixed(2)}</div>
        </div>

        <!-- Comprobantes -->
        <div class="section">
          <div class="section-title">Comprobantes del día</div>
          <table>
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Cliente</th>
                <th style="text-align:right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${filasComprobantes}
            </tbody>
            ${comprobantes.length > 0 ? `
            <tfoot>
              <tr class="total-row">
                <td colspan="2">Total comprobantes</td>
                <td style="text-align:right;">S/ ${comprobantes.reduce((a, c) => a + Number(c.monto || 0), 0).toFixed(2)}</td>
              </tr>
            </tfoot>` : ''}
          </table>
        </div>

        <!-- Retiros -->
        <div class="section">
          <div class="section-title">Retiros realizados hoy</div>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align:right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${filasRetiros}
            </tbody>
            ${retiros.length > 0 ? `
            <tfoot>
              <tr class="total-row">
                <td>Total retirado</td>
                <td style="text-align:right;color:#b91c1c;">S/ ${totalRetirado.toFixed(2)}</td>
              </tr>
            </tfoot>` : ''}
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <span>VIDRIOBRAS – Arqueo de caja</span>
          <span>Impreso el ${fechaHoy} a las ${horaHoy}</span>
        </div>
      </body>
      </html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1200);
    }, 300);
  };

  // Crear nueva caja
  const handleCrearNuevaCaja = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar la caja actual y crear una nueva? Se guardará el monto actual.')) {
      setLoading(true);
      apiFetch("/api/caja/crear-nueva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turno: "diurno" })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSuccess(data.message || "Nueva caja creada exitosamente");
            // Recargar cuadre con la nueva caja (cantidad = 0, sin retiros)
            setTimeout(() => {
              apiFetch("/api/caja/cuadre")
                .then(res => res.json())
                .then(cuadreData => {
                  aplicarCuadreCaja(cuadreData);
                  setSuccess("");
                });
            }, 1500);
          } else {
            setError(data.message || "Error al crear nueva caja");
          }
        })
        .catch(() => {
          setError("Error al crear nueva caja");
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <div style={{ 
      background: COLORS.backgroundLight, 
      minHeight: '100vh', 
      padding: '24px',
      fontFamily: FONTS.body
    }}>
      <style>{`
        @keyframes cardFloatIn {
          from { opacity: 0; transform: translateY(14px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes livePulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.28); }
          100% { box-shadow: 0 0 0 14px rgba(13, 148, 136, 0); }
        }
      `}</style>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '32px' 
      }}>
        {/* Panel izquierdo: Totales y comprobantes */}
        <div>
          <div style={{ 
            background: COLORS.white, 
            borderRadius: '16px', 
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.08)`, 
            padding: '24px', 
            marginBottom: '32px' 
          }}>
            <h2 style={{ 
              fontSize: '2.2rem', 
              fontWeight: 700, 
              marginBottom: '20px',
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}>Cuadre de Caja</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '18px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid rgba(13, 148, 136, 0.22)' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '999px', background: estadoRealtime === 'conectado' ? '#0d9488' : '#f59e0b', animation: pulsoRealtime ? 'livePulseGlow 850ms ease-out' : 'none' }} />
              <span style={{ fontSize: '0.85rem', color: '#0f766e', fontFamily: FONTS.body, fontWeight: 700 }}>
                {estadoRealtime === 'conectado' ? 'Tiempo real activo' : 'Reconectando tiempo real...'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Por Tarjeta:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    background: COLORS.border, 
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${totalesAnimados.total > 0 ? (totalesAnimados.tarjeta / totalesAnimados.total) * 100 : 0}%`,
                      height: '100%',
                      background: COLORS.primary,
                      transition: 'width 0.7s cubic-bezier(.22,1,.36,1)'
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, color: COLORS.primary, fontFamily: FONTS.body }}>S/ {totalesAnimados.tarjeta.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Al Contado:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    background: COLORS.border, 
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${totalesAnimados.total > 0 ? (totalesAnimados.contado / totalesAnimados.total) * 100 : 0}%`,
                      height: '100%',
                      background: COLORS.success,
                      transition: 'width 0.7s cubic-bezier(.22,1,.36,1)'
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, color: COLORS.success, fontFamily: FONTS.body }}>S/ {totalesAnimados.contado.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Por Yape:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    background: COLORS.border, 
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${totalesAnimados.total > 0 ? (totalesAnimados.yape / totalesAnimados.total) * 100 : 0}%`,
                      height: '100%',
                      background: COLORS.secondary,
                      transition: 'width 0.7s cubic-bezier(.22,1,.36,1)'
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, color: COLORS.secondary, fontFamily: FONTS.body }}>S/ {totalesAnimados.yape.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ marginTop: '20px', fontSize: '1.6rem', fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                Total General: S/ {totalesAnimados.total.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={cardGlassStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: FONTS.heading, color: COLORS.text }}>Comprobantes</h3>
              <input
                type="text"
                placeholder="Buscar comprobante..."
                style={{ 
                  border: '1px solid rgba(117, 199, 236, 0.7)', 
                  borderRadius: '8px', 
                  padding: '8px 12px',
                  fontFamily: FONTS.body,
                  color: COLORS.text,
                  background: 'rgba(240, 251, 255, 0.65)',
                  backdropFilter: 'blur(4px)'
                }}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.9rem', fontFamily: FONTS.body }}>
                <thead>
                  <tr style={{ background: 'rgba(175, 228, 248, 0.45)' }}>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Comprobante</th>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Cliente</th>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Monto</th>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobantesFiltrados.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: COLORS.textLight, padding: '16px' }}>No hay comprobantes</td></tr>
                  ) : comprobantesFiltrados.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(129, 208, 241, 0.45)', animation: 'rowFadeIn 300ms ease-out both' }}>
                      <td style={{ padding: '8px', color: COLORS.text, fontWeight: 600, textAlign: 'center' }}>
                        {esPdfUrl(c.documento) ? (
                          <a
                            href={c.documento}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver comprobante PDF"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#c83232' }}
                          >
                            <IconFileTypePdf size={22} stroke={1.8} />
                          </a>
                        ) : (
                          <span>{c.comprobante || c.numero || '-'}</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', color: COLORS.text }}>{c.cliente}</td>
                      <td style={{ padding: '8px', color: COLORS.text }}>S/ {c.monto.toFixed(2)}</td>
                      <td style={{ padding: '8px', color: COLORS.text }}>{c.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Panel derecho: Base de caja y retiro */}
        <div>
          <div style={{ 
            background: COLORS.white, 
            borderRadius: '16px', 
            boxShadow: pulsoRealtime ? `0 10px 30px rgba(13, 148, 136, 0.16)` : `0 4px 16px rgba(0, 0, 0, 0.08)`, 
            padding: '24px', 
            marginBottom: '32px',
            transition: 'box-shadow 0.45s ease, transform 0.45s ease',
            transform: pulsoRealtime ? 'translateY(-2px)' : 'translateY(0)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', fontFamily: FONTS.heading, color: COLORS.text }}>Cantidad en Caja</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>S/ {baseCajaAnimada.toFixed(2)}</span>
              <button
                style={{ 
                  background: COLORS.primary, 
                  color: COLORS.white, 
                  padding: '12px 20px', 
                  borderRadius: '8px', 
                  fontWeight: 700, 
                  border: 'none', 
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
                  fontFamily: FONTS.heading,
                  fontSize: '1rem'
                }}
                onClick={handleImprimir}
              >Imprimir Arqueo</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Cantidad a Retirar</label>
              <input
                type="number"
                min={1}
                max={baseCaja}
                style={{ 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: '8px', 
                  padding: '8px 12px', 
                  width: '100%',
                  fontFamily: FONTS.body,
                  color: COLORS.text
                }}
                value={retiro}
                onChange={e => setRetiro(e.target.value)}
              />
            </div>
            <button
              style={{ 
                background: COLORS.primary, 
                color: COLORS.white, 
                padding: '12px 20px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                width: '100%', 
                border: 'none', 
                cursor: 'pointer',
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
                fontFamily: FONTS.heading,
                fontSize: '1rem'
              }}
              onClick={handleRetiro}
              disabled={loading}
            >Retirar</button>
            {/* <button
              style={{ 
                background: COLORS.secondary, 
                color: COLORS.white, 
                padding: '12px 20px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                width: '100%', 
                border: 'none', 
                cursor: 'pointer',
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
                fontFamily: FONTS.heading,
                fontSize: '1rem',
                marginTop: '12px'
              }}
              onClick={handleCrearNuevaCaja}
              disabled={loading}
            >Crear Nueva Caja</button> */}
            {error && <div style={{ marginTop: '8px', color: COLORS.error, fontWeight: 600, fontFamily: FONTS.body }}>{error}</div>}
            {success && <div style={{ marginTop: '8px', color: COLORS.success, fontWeight: 600, fontFamily: FONTS.body }}>{success}</div>}
          </div>

          {/* Sección de retiros realizados */}
          <div style={{ 
            background: COLORS.white, 
            borderRadius: '16px', 
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.08)`, 
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', fontFamily: FONTS.heading, color: COLORS.text }}>Retiros Realizados Hoy</h3>
            {retiros.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.textLight, padding: '16px', fontFamily: FONTS.body }}>No hay retiros registrados hoy</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {retiros.map((r, idx) => (
                  <div key={r.id_gasto || idx} style={{ 
                    border: `1px solid ${COLORS.border}`, 
                    borderRadius: '8px', 
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text }}>Retiro #{idx + 1}</div>
                      <div style={{ fontSize: '0.85rem', color: COLORS.textLight, fontFamily: FONTS.body }}>{r.fecha}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: COLORS.primary, fontFamily: FONTS.heading }}>S/ {Number(r.monto).toFixed(2)}</div>
                  </div>
                ))}
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: `2px solid ${COLORS.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, fontFamily: FONTS.heading, color: COLORS.text, fontSize: '1.1rem' }}>Total Retirado:</span>
                  <span style={{ fontWeight: 700, fontSize: '1.3rem', color: COLORS.error, fontFamily: FONTS.heading }}>
                    S/ {retiros.reduce((acc, r) => acc + Number(r.monto), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal de confirmación */}
          {modal && (
            <div style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0, 0, 0, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 50 
            }}>
              <div style={{ 
                background: COLORS.white, 
                borderRadius: '16px', 
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15)`, 
                padding: '32px', 
                maxWidth: '400px', 
                width: '100%' 
              }}>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', fontFamily: FONTS.heading, color: COLORS.text }}>
                  ¿Confirmar retiro de S/ {retiro}?
                </h4>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button 
                    style={{ 
                      background: COLORS.primary, 
                      color: COLORS.white, 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      fontWeight: 700, 
                      border: 'none', 
                      cursor: 'pointer',
                      fontFamily: FONTS.heading,
                      fontSize: '1rem'
                    }} 
                    onClick={confirmarRetiro}
                  >Confirmar</button>
                  <button 
                    style={{ 
                      background: COLORS.border, 
                      color: COLORS.text, 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      fontWeight: 700, 
                      border: 'none', 
                      cursor: 'pointer',
                      fontFamily: FONTS.heading,
                      fontSize: '1rem'
                    }} 
                    onClick={() => setModal(false)}
                  >Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CuadreCaja;
