import React, { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS } from '../../colors';

/* ─── Animaciones CSS inyectadas una vez ─── */
const ANIMATION_CSS = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.35); }
  70%  { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
  100% { box-shadow: 0 0 0 0 rgba(148,25,24,0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes successPop {
  0%   { transform: scale(0.8); opacity: 0; }
  60%  { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
.inst-card {
  animation: fadeSlideIn 0.35s ease both;
}
.inst-img-thumb {
  animation: fadeSlideIn 0.25s ease both;
  transition: transform 0.2s, box-shadow 0.2s;
}
.inst-img-thumb:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 20px rgba(0,0,0,0.18);
}
.inst-btn-photo {
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}
.inst-btn-photo:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
}
.inst-btn-photo:active {
  transform: scale(0.97);
}
.inst-guardar {
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  animation: pulse-ring 2s infinite;
}
.inst-guardar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(245,158,11,0.4);
}
.inst-guardar:active:not(:disabled) {
  transform: scale(0.97);
}
.inst-success {
  animation: successPop 0.4s ease both;
}
`;

function injectStyles() {
  if (!document.getElementById('instalacion-anim')) {
    const s = document.createElement('style');
    s.id = 'instalacion-anim';
    s.textContent = ANIMATION_CSS;
    document.head.appendChild(s);
  }
}

const Instalacion = ({ notificacion, onToast, carritoData = {}, onFinalizarServicio }) => {
  const MAX_IMAGE_SIZE_MB = 10;
  const [imagenes, setImagenes] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [observaciones, setObservaciones] = useState(
    notificacion?.observaciones || ''
  );
  const [nombreServicio, setNombreServicio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [instalado, setInstalado] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isTablet = viewportWidth <= 980;
  const isMobile = viewportWidth <= 760;
  const isTinyMobile = viewportWidth <= 480;

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Generar previsualizaciones cuando cambian los archivos */
  useEffect(() => {
    const urls = imagenes.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [imagenes]);

  const agregarArchivos = (files) => {
    const nuevos = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (nuevos.length === 0) return;

    const archivo = nuevos[0];
    const limiteBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (archivo.size > limiteBytes) {
      onToast && onToast(`La imagen supera ${MAX_IMAGE_SIZE_MB} MB. Comprimela antes de subirla.`, 'error');
      return;
    }

    // Se permite una sola imagen: reemplaza la anterior.
    setImagenes([archivo]);
  };

  const handleFiles = (e) => agregarArchivos(e.target.files);
  const handleCamera = (e) => agregarArchivos(e.target.files);

  const handleRemoveImage = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    agregarArchivos(e.dataTransfer.files);
  };

  const handleGuardar = async () => {
    try {
      console.log('[INSTALACION] Botón GUARDAR presionado');
      console.log('[INSTALACION] Estado actual:', {
        nombreServicio: nombreServicio || 'VACÍO',
        observaciones: observaciones || 'VACÍO',
        imagenes: imagenes.length,
        carritoData,
        notificacion
      });

      setGuardando(true);

      // Validación 1: Nombre del Servicio
      if (!nombreServicio || nombreServicio.trim() === '') {
        console.warn('[INSTALACION] Validación fallida: Nombre del servicio vacío');
        onToast('Por favor ingresa el nombre del servicio', 'error');
        setGuardando(false);
        return;
      }

      // Validación 2: Observaciones
      if (!observaciones || observaciones.trim() === '') {
        console.warn('[INSTALACION] Validación fallida: Observaciones vacías');
        onToast('Por favor completa las observaciones de instalación', 'error');
        setGuardando(false);
        return;
      }

      // Validación 3: Foto
      if (imagenes.length === 0) {
        console.warn('[INSTALACION] Validación fallida: Sin fotos');
        onToast('Por favor selecciona al menos una foto', 'error');
        setGuardando(false);
        return;
      }

      console.log('[INSTALACION] ✓ Todas las validaciones pasaron');

      let carrito_id = carritoData?.carrito_id || notificacion?.carrito_id || notificacion?.id_carrito || null;
      let cliente_id = carritoData?.cliente_id || notificacion?.cliente_id || notificacion?.id_cliente;
      const notif_id = carritoData?.notif_id || notificacion?.id || notificacion?.id_notificacion || null;

      console.log('[INSTALACION] carritoData:', carritoData);
      console.log('[INSTALACION] notificacion:', notificacion);
      console.log('[INSTALACION] Datos iniciales: {carrito_id, cliente_id, notif_id}');
      console.log('[INSTALACION] Valores resueltos:', { carrito_id, cliente_id, notif_id });

      // Si no tenemos cliente_id, intentar buscarlo usando el carrito_id o el nombre de cliente
      if (!cliente_id) {
        console.log('[INSTALACION] Cliente_id no disponible, intentando buscarlo...');
        
        // Intentar obtener cliente_id del servidor si tenemos carrito_id
        if (carrito_id) {
          try {
            console.log('[INSTALACION] Buscando cliente_id por carrito_id:', carrito_id);
            const res = await fetch(`/api/carrito/${carrito_id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.data?.cliente_id || data.data?.id_cliente) {
                cliente_id = data.data.cliente_id || data.data.id_cliente;
                console.log('[INSTALACION] ✓ Cliente_id encontrado:', cliente_id);
              }
            }
          } catch (e) {
            console.warn('[INSTALACION] Error buscando cliente_id por carrito:', e);
          }
        }

        // Si aún no tenemos cliente_id y tenemos notificación con nombre/descripción
        if (!cliente_id && notificacion?.nombre) {
          try {
            console.log('[INSTALACION] Buscando cliente_id por nombre:', notificacion.nombre);
            const res = await fetch(`/api/cliente/buscar?nombre=${encodeURIComponent(notificacion.nombre)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data) {
                // El data puede ser un objeto único o un array
                if (Array.isArray(data.data)) {
                  if (data.data[0]?.id_cliente) {
                    cliente_id = data.data[0].id_cliente;
                    console.log('[INSTALACION] ✓ Cliente_id encontrado por nombre (array):', cliente_id);
                  }
                } else if (data.data?.id_cliente) {
                  cliente_id = data.data.id_cliente;
                  console.log('[INSTALACION] ✓ Cliente_id encontrado por nombre (objeto):', cliente_id);
                }
              }
            }
          } catch (e) {
            console.warn('[INSTALACION] Error buscando cliente_id por nombre:', e);
          }
        }
      }

      if (!cliente_id) {
        console.error('[INSTALACION] Error: No se pudo obtener cliente_id');
        onToast('Error: No se pudo obtener datos del cliente', 'error');
        setGuardando(false);
        return;
      }

      console.log('[INSTALACION] ✓ Cliente_id confirmado:', cliente_id);

      // Preparar FormData
      const formData = new FormData();
      if (carrito_id) {
        formData.append('carrito_id', carrito_id);
      }
      formData.append('cliente_id', cliente_id);
      if (notif_id) {
        formData.append('notif_id', notif_id);
      }
      formData.append('cleanup_mode', 'immediate');
      formData.append('nombre_servicio', nombreServicio.trim());
      formData.append('descripcion', observaciones.trim());
      
      // Agregar primera foto
      if (imagenes.length > 0) {
        formData.append('foto', imagenes[0]);
        console.log('[INSTALACION] Foto adjunta:', imagenes[0].name);
      }

      console.log('[INSTALACION] FormData preparado, enviando a /api/barra_progreso/servicio/finalizar');
      onToast('Guardando servicio...', 'success');

      // Enviar al backend
      const res = await fetch('/api/barra_progreso/servicio/finalizar', {
        method: 'POST',
        body: formData
      });

      console.log('[INSTALACION] Response status:', res.status);
      const data = await res.json();
      console.log('[INSTALACION] Response data:', data);

      if (data.success) {
        console.log('[INSTALACION] ✓ Servicio guardado correctamente');
        onToast('✓ Servicio guardado exitosamente', 'success');

        // Estado temporal solo frontend: mostrar "Instalado" por 10 minutos en PanelCliente.
        try {
          const until = Date.now() + (10 * 60 * 1000);
          const markerData = {
            cliente_id: String(cliente_id).trim(), // Asegurar formato consistente
            until
          };
          console.log('[INSTALACION] Guardando marker en localStorage:', markerData);
          localStorage.setItem('servicio_instalado_temp', JSON.stringify(markerData));

          const refreshData = {
            ts: Date.now(),
            cliente_id: String(cliente_id).trim(),
            notif_id: notif_id || null
          };
          localStorage.setItem('servicio_proyectos_refresh', JSON.stringify(refreshData));
          
          // Disparar evento personalizado para notificar a PanelCliente
          window.dispatchEvent(new CustomEvent('servicio_finalizado', { 
            detail: { cliente_id: String(cliente_id).trim() } 
          }));
          window.dispatchEvent(new CustomEvent('servicio_proyectos_refresh', {
            detail: refreshData
          }));
          console.log('[INSTALACION] ✓ Evento servicio_finalizado despachado');
        } catch (e) {
          console.warn('[INSTALACION] No se pudo guardar estado temporal de instalado:', e);
        }
        
        // Cambiar a estado "Instalado" por 10 minutos solo en frontend
        setInstalado(true);

        // Regresar al panel de notificaciones de OBRAS al culminar.
        setTimeout(() => {
          onFinalizarServicio && onFinalizarServicio({ cliente_id: String(cliente_id).trim(), notif_id: notif_id || null });
        }, 600);
        
        // Limpieza local rápida porque el servicio ya culminó.
        setTimeout(() => {
          setInstalado(false);
          setImagenes([]);
          setObservaciones('');
          setNombreServicio('');
        }, 1200);
      } else {
        console.error('[INSTALACION] Error del servidor:', data.message);
        onToast(`Error: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('[INSTALACION] Excepción capturada:', error);
      console.error('[INSTALACION] Stack:', error.stack);
      onToast('Error al guardar servicio: ' + error.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ fontFamily: FONTS.body, maxWidth: 900, margin: '0 auto', padding: isMobile ? '4px 0 18px' : '4px 0 24px' }}>

      {/* ── Header ── */}
      <div className="inst-card" style={{
        display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 10,
        flexDirection: isMobile ? 'column' : 'row',
        marginBottom: 22, borderBottom: `2px solid ${COLORS.primary}`,
        paddingBottom: 12
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 700, fontFamily: FONTS.heading, color: COLORS.primary }}>
            Instalación
          </h3>
          <p style={{ margin: 0, fontSize: isMobile ? 11 : 12, color: COLORS.textLight }}>
            Registra el servicio instalado con foto y observaciones
          </p>
        </div>
      </div>

      {/* ── Banner instalado ── */}
      {instalado && (
        <div className="inst-success" style={{
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
          color: COLORS.primaryDark, padding: '14px 20px', borderRadius: 12,
          marginBottom: 20, fontSize: 15, fontWeight: 700,
          textAlign: 'center', fontFamily: FONTS.heading,
          boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
          SERVICIO INSTALADO CORRECTAMENTE
          <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>(se limpiará en 10 min)</span>
        </div>
      )}

      {/* ── Nombre del Servicio ── */}
      <div className="inst-card" style={{
        background: '#fff',
        border: `1.5px solid ${COLORS.info}`,
        borderRadius: 12, padding: isMobile ? '14px 14px' : '16px 20px', marginBottom: 20,
        boxShadow: '0 2px 10px rgba(59,130,246,0.08)'
      }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8,
          fontFamily: FONTS.heading, color: COLORS.text, letterSpacing: 0.5 }}>
          NOMBRE DEL SERVICIO *
        </label>
        <input
          type="text"
          placeholder="Ej: Cristal 2.5mm, Espejo, Marco, etc."
          value={nombreServicio}
          onChange={(e) => setNombreServicio(e.target.value)}
          style={{
            width: '100%', padding: '11px 14px',
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 8, fontSize: 14, fontFamily: FONTS.body,
            color: COLORS.text, boxSizing: 'border-box',
            outline: 'none', transition: 'border-color 0.2s'
          }}
          onFocus={(e) => { e.target.style.borderColor = COLORS.info; }}
          onBlur={(e) => { e.target.style.borderColor = COLORS.border; }}
        />
      </div>

      {/* ── Grid: Foto | Observaciones ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: isMobile ? 14 : 20, marginBottom: 24 }}>

        {/* ── Panel foto ── */}
        <div className="inst-card" style={{
          background: '#fff', border: `1.5px solid ${COLORS.border}`,
          borderRadius: 12, padding: isMobile ? '14px 14px' : '16px 20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 12,
            fontFamily: FONTS.heading, color: COLORS.text, letterSpacing: 0.5 }}>
            FOTO DEL SERVICIO *
          </label>

          {/* Botones de captura */}
          {!instalado && (
            <div style={{ display: 'grid', gridTemplateColumns: isTinyMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {/* Tomar foto */}
              <button
                className="inst-btn-photo"
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, padding: '14px 10px',
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
                  color: '#fff', border: 'none', borderRadius: 10,
                  cursor: 'pointer', fontFamily: FONTS.heading,
                  fontWeight: 700, fontSize: 13, letterSpacing: 0.3,
                  boxShadow: '0 4px 14px rgba(148,25,24,0.25)'
                }}
              >
                Tomar Foto
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCamera}
                style={{ display: 'none' }}
              />

              {/* Subir archivo */}
              <button
                className="inst-btn-photo"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, padding: '14px 10px',
                  background: `linear-gradient(135deg, ${COLORS.info}, #2563eb)`,
                  color: '#fff', border: 'none', borderRadius: 10,
                  cursor: 'pointer', fontFamily: FONTS.heading,
                  fontWeight: 700, fontSize: 13, letterSpacing: 0.3,
                  boxShadow: '0 4px 14px rgba(59,130,246,0.25)'
                }}
              >
                Subir Archivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFiles}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Zona drag & drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? COLORS.primary : COLORS.border}`,
              borderRadius: 10, minHeight: isMobile ? 100 : 120, padding: 10,
              background: dragOver ? 'rgba(148,25,24,0.04)' : COLORS.backgroundLight,
              transition: 'all 0.2s', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6
            }}
          >
            {imagenes.length === 0 ? (
              <>
                <span style={{ fontSize: 28, opacity: 0.4 }}>[ ]</span>
                <span style={{ fontSize: 12, color: COLORS.textLight, textAlign: 'center' }}>
                  Arrastra imágenes aquí o usa los botones de arriba
                </span>
              </>
            ) : (
              <div style={{
                width: '100%', display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: 8
              }}>
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="inst-img-thumb"
                    style={{ position: 'relative', borderRadius: 8, overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                  >
                    <img
                      src={src}
                      alt={`preview-${idx}`}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      title="Eliminar"
                      style={{
                        position: 'absolute', top: 3, right: 3,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.65)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, lineHeight: 1
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {imagenes.length > 0 && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: COLORS.textLight }}>
              {imagenes.length} imagen{imagenes.length > 1 ? 'es' : ''} · Click ✕ para eliminar
            </p>
          )}
        </div>

        {/* ── Observaciones ── */}
        <div className="inst-card" style={{
          background: '#fff', border: `1.5px solid ${COLORS.border}`,
          borderRadius: 12, padding: isMobile ? '14px 14px' : '16px 20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column'
        }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 10,
            fontFamily: FONTS.heading, color: COLORS.text, letterSpacing: 0.5 }}>
            OBSERVACIONES DE INSTALACIÓN *
          </label>
          <textarea
            placeholder="Describe los detalles de la instalación realizada…"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={isMobile ? 7 : 9}
            style={{
              flex: 1, width: '100%', padding: '10px 13px',
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8, fontFamily: FONTS.body,
              fontSize: 13, color: COLORS.text,
              resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
              lineHeight: 1.6
            }}
            onFocus={(e) => { e.target.style.borderColor = COLORS.info; }}
            onBlur={(e) => { e.target.style.borderColor = COLORS.border; }}
          />
          <p style={{ margin: '8px 0 0', fontSize: 11, color: COLORS.textLight }}>
            Mínimo detalla el tipo de instalación, materiales y ubicación.
          </p>
        </div>
      </div>

      {/* ── Botón guardar ── */}
      <div style={{ textAlign: 'center' }}>
        <button
          className={guardando || instalado ? '' : 'inst-guardar'}
          onClick={handleGuardar}
          disabled={guardando || instalado}
          style={{
            background: instalado
              ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`
              : `linear-gradient(135deg, ${COLORS.accentLight}, ${COLORS.accent})`,
            color: COLORS.primaryDark,
            border: 'none',
            borderRadius: 10,
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '460px' : 'none',
            padding: isMobile ? '12px 16px' : '13px 52px',
            fontWeight: 700, fontSize: 15,
            cursor: guardando || instalado ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            fontFamily: FONTS.heading,
            letterSpacing: 1,
            boxShadow: instalado
              ? '0 4px 16px rgba(245,158,11,0.35)'
              : '0 4px 16px rgba(245,158,11,0.3)',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            opacity: guardando ? 0.8 : 1
          }}
        >
          {guardando ? (
            <>
              <span style={{
                width: 16, height: 16, border: '2px solid rgba(107,16,15,0.35)',
                borderTopColor: COLORS.primaryDark, borderRadius: '50%',
                display: 'inline-block', animation: 'spin 0.7s linear infinite'
              }} />
              GUARDANDO…
            </>
          ) : instalado ? (
            <>INSTALADO</>
          ) : (
            <>GUARDAR INSTALACIÓN</>
          )}
        </button>
      </div>
    </div>
  );
};

export default Instalacion;
