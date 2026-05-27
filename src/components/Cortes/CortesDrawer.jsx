import React, { useEffect, useMemo, useState } from 'react';
import { COLORS, FONTS } from '../../colors';
import { IconExternalLink, IconFileScissors } from '@tabler/icons-react';

const NAVBAR_OFFSET = 86;

const formatPrice = (n) =>
  Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const CortesDrawer = ({
  producto,
  costoCorte = 0,
  initialCortes,
  initialTotal,
  confirmLabel = 'Agregar al carrito',
  onConfirm,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [footerOffset, setFooterOffset] = useState(0);
  const [showMaxToast, setShowMaxToast] = useState(false);
  const [toastLeaving, setToastLeaving] = useState(false);
  const [removingIdx, setRemovingIdx] = useState(null);
  const [dimsMax, setDimsMax] = useState({ ancho: 300, alto: 300 });
  const esAluminio = (producto?.categoria || '').toUpperCase().includes('ALUMINIO');

  useEffect(() => {
    fetch('/api/categorias/detalles')
      .then(r => r.json())
      .then(d => {
        if (!d?.data) return;
        const cat = (producto?.categoria || '').toUpperCase();
        const det = d.data.find(row => {
          const n = (row.categoria_nombre || '').toUpperCase();
          return cat.includes('VIDRIO') ? n.includes('VIDRIO')
               : cat.includes('ALUMIN') ? n.includes('ALUMIN')
               : false;
        });
        if (!det) return;
        if (esAluminio) {
          setDimsMax({ ancho: Number(det.barra_largo_cm || 300), alto: 300 });
        } else {
          setDimsMax({
            ancho: Number(det.plancha_ancho_cm || 300),
            alto:  Number(det.plancha_alto_cm  || 300),
          });
        }
      })
      .catch(() => {});
  }, [producto?.categoria, esAluminio]);
  const normalizeCortes = (source) => {
    return (Array.isArray(source) ? source : [])
      .map((corte) => ({
        ancho_cm: Number(corte?.ancho_cm ?? corte?.largo_cm ?? 0),
        alto_cm: esAluminio ? 0 : Number(corte?.alto_cm ?? 0),
        cantidad: Number(corte?.cantidad || 0),
      }))
      .filter((corte) => corte.ancho_cm > 0 && (esAluminio || corte.alto_cm > 0) && corte.cantidad > 0);
  };

  const buildInitialCortes = () => {
    if (Array.isArray(initialCortes) && initialCortes.length > 0) {
      const sanitized = normalizeCortes(initialCortes).map((corte) => ({
        ancho_cm: corte.ancho_cm || '',
        alto_cm: esAluminio ? '' : (corte.alto_cm || ''),
        cantidad: corte.cantidad || 1,
      }));

      if (sanitized.length > 0) {
        return sanitized;
      }
    }
    return [{ ancho_cm: '', alto_cm: '', cantidad: 1 }];
  };
  
  const [cortes, setCortes] = useState(buildInitialCortes);
  const initialSnapshot = useMemo(() => JSON.stringify(normalizeCortes(initialCortes)), [initialCortes, esAluminio]);

  useEffect(() => {
    setCortes(buildInitialCortes());
  }, [initialCortes, producto, esAluminio]);

  useEffect(() => {
    const updateFooterOffset = () => {
      const footer = document.querySelector('footer');
      if (!footer) {
        setFooterOffset(0);
        return;
      }

      const rect = footer.getBoundingClientRect();
      const styles = window.getComputedStyle(footer);
      const isVisible =
        styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        rect.height > 0;

      setFooterOffset(isVisible ? Math.ceil(rect.height) : 0);
    };

    updateFooterOffset();
    window.addEventListener('resize', updateFooterOffset);
    window.addEventListener('scroll', updateFooterOffset, { passive: true });

    const observer = new MutationObserver(updateFooterOffset);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', updateFooterOffset);
      window.removeEventListener('scroll', updateFooterOffset);
      observer.disconnect();
    };
  }, []);

  const cortesValidos = useMemo(() => {
    return normalizeCortes(cortes);
  }, [cortes, esAluminio]);

  const isDirty = useMemo(() => {
    return JSON.stringify(cortesValidos) !== initialSnapshot;
  }, [cortesValidos, initialSnapshot]);

  const calcularTotal = useMemo(() => {
    const precioUnit = Number(producto?.precio_unitario || 0);
    return cortes.reduce((acc, c) => {
      const ancho = Number(c.ancho_cm || 0);
      const alto = esAluminio ? 1 : Number(c.alto_cm || 0);
      const cantidad = Number(c.cantidad || 0);
      if (ancho <= 0 || (alto <= 0 && !esAluminio) || cantidad <= 0) return acc;
      
      let precioCorte;
      if (esAluminio) {
        // Para aluminio: precio por metro lineal
        const longitudMetros = ancho / 100;
        const precioBase = longitudMetros * precioUnit;
        precioCorte = (precioBase + costoCorte) * cantidad;
      } else {
        // Para vidrio: cálculo por área en m²
        const areaCm2 = ancho * alto;
        const areaM2 = areaCm2 / 10000;
        const precioBase = areaM2 * precioUnit;
        precioCorte = (precioBase + costoCorte) * cantidad;
      }
      return acc + precioCorte;
    }, 0);
  }, [cortes, producto, costoCorte, esAluminio]);

  const triggerMaxToast = () => {
    if (showMaxToast) return;
    setToastLeaving(false);
    setShowMaxToast(true);
    setTimeout(() => setToastLeaving(true), 2400);
    setTimeout(() => setShowMaxToast(false), 2750);
  };

  const getCorteErrors = (corte) => {
    const errors = {};
    const ancho = Number(corte.ancho_cm);
    const alto = Number(corte.alto_cm);
    const cantidad = Number(corte.cantidad);

    if (corte.ancho_cm === '' || Number.isNaN(ancho)) {
      errors.ancho_cm = 'Ingresa una medida válida';
    } else if (ancho <= 0) {
      errors.ancho_cm = 'La medida debe ser mayor a 0';
    } else if (ancho > dimsMax.ancho) {
      errors.ancho_cm = `Máx. ${dimsMax.ancho} cm (compra una plancha entera)`;
    }

    if (!esAluminio) {
      if (corte.alto_cm === '' || Number.isNaN(alto)) {
        errors.alto_cm = 'Ingresa una medida válida';
      } else if (alto <= 0) {
        errors.alto_cm = 'La medida debe ser mayor a 0';
      } else if (alto > dimsMax.alto) {
        errors.alto_cm = `Máx. ${dimsMax.alto} cm (compra una plancha entera)`;
      }
    }

    if (corte.cantidad === '' || Number.isNaN(cantidad)) {
      errors.cantidad = 'Ingresa una cantidad válida';
    } else if (cantidad <= 0) {
      errors.cantidad = 'La cantidad debe ser mayor a 0';
    }

    return errors;
  };

  const allErrors = useMemo(() => cortes.map(getCorteErrors), [cortes, esAluminio, dimsMax]);
  const hasErrors = useMemo(() => allErrors.some(e => Object.keys(e).length > 0), [allErrors]);

  const sanitizeNumericInput = (rawValue, integerOnly = false) => {
    if (rawValue === '') return '';
    const normalized = String(rawValue).replace(',', '.');
    let cleaned = normalized.replace(/[^\d.]/g, '');

    if (integerOnly) {
      return cleaned.replace(/\./g, '');
    }

    const parts = cleaned.split('.');
    if (parts.length <= 1) return cleaned;
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    return cleaned;
  };

  const blockInvalidNumberKeys = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const updateCorte = (idx, key, value) => {
    const isCantidad = key === 'cantidad';
    const cleanValue = sanitizeNumericInput(value, isCantidad);
    if (value !== '' && cleanValue === '') return;
    if (!isCantidad && cleanValue !== '' && Number(cleanValue) > Math.max(dimsMax.ancho, dimsMax.alto)) triggerMaxToast();

    setCortes((prev) => prev.map((c, i) => (
      i === idx ? { ...c, [key]: cleanValue } : c
    )));
  };

  const addCorte = () => {
    setCortes((prev) => [...prev, { ancho_cm: '', alto_cm: '', cantidad: 1 }]);
  };

  const removeCorte = (idx) => {
    setRemovingIdx(idx);
    setTimeout(() => {
      setRemovingIdx(null);
      setCortes((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        return next.length > 0 ? next : [{ ancho_cm: '', alto_cm: '', cantidad: 1 }];
      });
    }, 380);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 220);
  };

  const handleConfirm = () => {
    if (hasErrors || cortesValidos.length === 0) return;
    const payload = cortesValidos;
    const total = !isDirty && typeof initialTotal === 'number'
      ? Number(initialTotal.toFixed(2))
      : Number(calcularTotal.toFixed(2));
    onConfirm?.({ cortes: payload, total });
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: NAVBAR_OFFSET,
        right: 0,
        bottom: footerOffset,
        left: 0,
        zIndex: 45,
        pointerEvents: 'auto',
        overflow: 'hidden',
        background: 'rgba(15,23,42,0.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 500,
          maxWidth: 'calc(100vw - 4px)',
          height: '100%',
          background: '#f8fafc',
          borderRight: '1px solid rgba(199,228,240,0.8)',
          borderRadius: '0 0 10px 0',
          boxShadow: '4px 0 32px rgba(15,23,42,0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
          animation: isClosing ? 'drawerOut .22s ease forwards' : 'drawerIn .24s ease',
        }}
      >
      <style>{`
        @keyframes drawerIn {
          0% { opacity: 0; transform: translateX(-14px) translateY(-140px) scale(.985); }
          100% { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
        }
        @keyframes drawerOut {
          0% { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-14px) translateY(-90px) scale(.985); }
        }
        .corte-input:focus { border-color: ${COLORS.secondary} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.13); }
        .corte-input.error { border-color: #ef4444 !important; background: #fff5f5 !important; }
      `}</style>

      {/* HEADER */}
      <div style={{
        padding: '18px 22px 14px',
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #7a1212 100%)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: FONTS.heading, color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconFileScissors stroke={1} size={22} style={{ flexShrink: 0 }} />
            {esAluminio ? 'Cortes de barra' : 'Cortes personalizados'}
          </h3>
          <div style={{ color: 'rgba(255,255,255,0.78)', marginTop: 3, fontSize: 13, fontFamily: FONTS.body }}>
            {producto?.nombre || '-'}
          </div>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#fff',
            padding: '6px 10px',
            fontSize: 18,
            lineHeight: 1,
            fontWeight: 700,
          }}
          aria-label="Cerrar editor de cortes"
        >✕</button>
      </div>

      {/* TOAST ROJO CERCA DEL NAVBAR */}
      <style>{`
        @keyframes corteToastIn {
          0% { opacity: 0; transform: translateY(-12px) scale(.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes corteToastOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-8px) scale(.97); }
        }
        @keyframes corteCardIn {
          0% { opacity: 0; transform: translateY(14px) scale(.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes corteCardOut {
          0%   { opacity: 1; transform: translateX(0) scaleY(1);   max-height: 300px; padding-top: 14px; padding-bottom: 14px; margin-bottom: 0; }
          40%  { opacity: 0; transform: translateX(-22px) scaleY(0.85); }
          100% { opacity: 0; transform: translateX(-28px) scaleY(0);   max-height: 0;   padding-top: 0;    padding-bottom: 0;    margin-bottom: -12px; }
        }
      `}</style>
      {showMaxToast && (
        <div style={{
          position: 'fixed',
          top: 108,
          left: 0,
          right: 0,
          zIndex: 1400,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 300,
            maxWidth: 440,
            padding: '11px 18px',
            borderRadius: 12,
            border: '1px solid #fca5a5',
            background: 'linear-gradient(120deg, #fff0f0, #ffe4e4)',
            color: '#991b1b',
            boxShadow: '0 14px 30px rgba(15,23,42,0.18)',
            fontFamily: FONTS.body,
            fontWeight: 600,
            fontSize: 14,
            animation: toastLeaving ? 'corteToastOut .28s ease forwards' : 'corteToastIn .24s ease',
          }} role="status" aria-live="polite">
            <IconExternalLink stroke={2} size={20} style={{ flexShrink: 0, color: '#dc2626' }} />
            <span>Medida máxima: <b>{dimsMax.ancho} cm{esAluminio ? '' : ` × ${dimsMax.alto} cm`}</b>. Para más, compra una plancha completa.</span>
          </div>
        </div>
      )}

      {/* LISTA DE CORTES */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cortes.map((c, idx) => {
          const err = allErrors[idx] || {};
          return (
            <div key={idx} style={{
              background: '#fff',
              border: `1px solid ${Object.keys(err).length > 0 ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: 10,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
              flexShrink: 0,
              animation: removingIdx === idx
                ? 'corteCardOut .38s cubic-bezier(0.4,0,0.2,1) forwards'
                : `corteCardIn .26s ease both`,
              animationDelay: removingIdx === idx ? '0s' : `${idx * 0.06}s`,
              overflow: 'hidden',
            }}>
              {/* Badge número */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  background: COLORS.primary,
                  color: '#fff',
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                }}>
                  Corte #{idx + 1}
                </span>
                <button
                  onClick={() => removeCorte(idx)}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: '#991b1b',
                    fontFamily: FONTS.body,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >✕ Quitar</button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: esAluminio ? '2fr 1fr' : '1fr 1fr 1fr',
                gap: 10,
              }}>
                {/* Ancho / Longitud */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {esAluminio ? 'Longitud (cm)' : 'Ancho (cm)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={dimsMax.ancho}
                    value={c.ancho_cm}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={(e) => updateCorte(idx, 'ancho_cm', e.target.value)}
                    className={`corte-input${err.ancho_cm ? ' error' : ''}`}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${err.ancho_cm ? '#ef4444' : '#cbd5e1'}`,
                      fontFamily: FONTS.body,
                      fontSize: 15,
                      background: err.ancho_cm ? '#fff5f5' : '#fff',
                      color: COLORS.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {err.ancho_cm && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontFamily: FONTS.body }}>
                      ✕ {err.ancho_cm}
                    </div>
                  )}
                </div>

                {/* Alto */}
                {!esAluminio && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Alto (cm)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={dimsMax.alto}
                      value={c.alto_cm}
                      onKeyDown={blockInvalidNumberKeys}
                      onChange={(e) => updateCorte(idx, 'alto_cm', e.target.value)}
                      className={`corte-input${err.alto_cm ? ' error' : ''}`}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${err.alto_cm ? '#ef4444' : '#cbd5e1'}`,
                        fontFamily: FONTS.body,
                        fontSize: 15,
                        background: err.alto_cm ? '#fff5f5' : '#fff',
                        color: COLORS.text,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {err.alto_cm && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontFamily: FONTS.body }}>
                        ✕ {err.alto_cm}
                      </div>
                    )}
                  </div>
                )}

                {/* Cantidad */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={c.cantidad}
                    onKeyDown={blockInvalidNumberKeys}
                    onChange={(e) => updateCorte(idx, 'cantidad', e.target.value)}
                    className="corte-input"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontFamily: FONTS.body,
                      fontSize: 15,
                      background: '#fff',
                      color: COLORS.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {err.cantidad && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontFamily: FONTS.body }}>
                      ✕ {err.cantidad}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Botón agregar corte */}
        <button
          onClick={addCorte}
          style={{
            background: '#fff',
            color: COLORS.primary,
            border: `2px dashed ${COLORS.primary}`,
            padding: '12px 16px',
            borderRadius: 10,
            fontWeight: 700,
            fontFamily: FONTS.heading,
            fontSize: 14,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          + {esAluminio ? 'Agregar otro corte de barra' : 'Agregar otro corte'}
        </button>
      </div>

      {/* FOOTER: total + confirmar */}
      <div style={{
        padding: '10px 18px',
        borderTop: '1px solid #e2e8f0',
        background: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: FONTS.heading, color: COLORS.secondaryDark, fontSize: 14, fontWeight: 700 }}>
            Precio total
          </span>
          <b style={{ fontFamily: FONTS.heading, fontSize: 20, color: COLORS.text }}>
            S/ {formatPrice(!isDirty && typeof initialTotal === 'number' ? initialTotal : Number(calcularTotal))}
          </b>
        </div>
        <button
          onClick={handleConfirm}
          disabled={hasErrors}
          style={{
            width: hasErrors ? '100%' : '50%',
            alignSelf: 'center',
            display: 'block',
            margin: '0 auto',
            background: hasErrors ? '#94a3b8' : '#0ea5e9',
            color: '#fff',
            border: hasErrors ? '1px solid #94a3b8' : '1px solid #0284c7',
            borderBottom: hasErrors ? '1px solid #94a3b8' : '2px solid #0369a1',
            padding: '10px 14px',
            borderRadius: 8,
            fontWeight: 700,
            fontFamily: FONTS.heading,
            fontSize: 13,
            letterSpacing: 0.3,
            cursor: hasErrors ? 'not-allowed' : 'pointer',
            boxShadow: hasErrors
              ? 'inset 0 3px 7px rgba(0,0,0,0.18)'
              : 'inset 0 3px 7px rgba(0,0,0,0.18), inset 0 1px 3px rgba(0,0,0,0.1)',
            transition: 'filter .15s',
          }}
          onMouseEnter={e => { if (!hasErrors) e.currentTarget.style.filter = 'brightness(1.08)'; }}
          onMouseLeave={e => { if (!hasErrors) e.currentTarget.style.filter = 'brightness(1)'; }}
          onMouseDown={e => { if (!hasErrors) e.currentTarget.style.filter = 'brightness(0.94)'; }}
          onMouseUp={e => { if (!hasErrors) e.currentTarget.style.filter = 'brightness(1.08)'; }}
        >
          {hasErrors ? '⚠ Corrige las medidas para continuar' : confirmLabel}
        </button>
      </div>

      </div>
    </div>
  );
};

export default CortesDrawer;
