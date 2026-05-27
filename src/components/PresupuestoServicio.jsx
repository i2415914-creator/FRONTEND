import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../colors';
import { addPresupuesto } from '../utils/ramPresupuestos';

const CSS_PRESUPUESTO = `
@keyframes psOverlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes psPanelIn {
  from { opacity: 0; transform: translateX(-34px) scale(.96) perspective(1000px) rotateY(7deg); }
  to { opacity: 1; transform: translateX(0) scale(1) perspective(1000px) rotateY(0deg); }
}
@keyframes psGlassSweep {
  0% { transform: translateX(-125%) skewX(-18deg); opacity: 0; }
  18% { opacity: .55; }
  100% { transform: translateX(260%) skewX(-18deg); opacity: 0; }
}

.ps-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(145deg, rgba(7,17,30,.42), rgba(20,43,58,.24));
  backdrop-filter: blur(10px) saturate(145%);
  -webkit-backdrop-filter: blur(10px) saturate(145%);
  z-index: 900;
  animation: psOverlayIn .22s ease both;
}

.ps-panel {
  position: fixed;
  left: 18px;
  width: min(500px, calc(100vw - 36px));
  background: linear-gradient(155deg, rgba(255,255,255,.96) 0%, rgba(228,246,255,.92) 58%, rgba(208,233,247,.86) 100%);
  border: 1.5px solid rgba(201,235,251,.86);
  border-radius: 28px;
  box-shadow:
    0 32px 72px rgba(8, 21, 38, .28),
    0 10px 24px rgba(90, 139, 168, .18),
    inset 0 1px 0 rgba(255,255,255,.95),
    inset 0 0 0 1px rgba(255,255,255,.36);
  overflow: hidden;
  z-index: 1000;
  animation: psPanelIn .32s cubic-bezier(.34,1.28,.64,1) both;
}

.ps-panel::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 8%;
  right: 8%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.98), transparent);
  pointer-events: none;
}

.ps-panel::after {
  content: '';
  position: absolute;
  top: 0;
  left: -55%;
  width: 34%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
  animation: psGlassSweep 6s ease-in-out infinite 1.1s;
  pointer-events: none;
}

.ps-header {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 20px 22px 14px;
  background: linear-gradient(180deg, rgba(255,255,255,.76), rgba(255,255,255,.48));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(128,194,220,.18);
}

.ps-content {
  position: relative;
  padding: 16px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.ps-section {
  background: linear-gradient(180deg, rgba(255,255,255,.48), rgba(229,246,255,.38));
  border: 1px solid rgba(128,194,220,.18);
  border-radius: 18px;
  padding: 14px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.64);
}

.ps-label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: ${COLORS.text};
  margin-bottom: 6px;
  letter-spacing: .2px;
}

.ps-input {
  width: 100%;
  padding: 12px 13px;
  border-radius: 12px;
  border: 1.5px solid rgba(128,194,220,.30);
  background: rgba(255,255,255,.78);
  color: ${COLORS.text};
  font-family: ${FONTS.body};
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
  box-shadow: inset 0 2px 5px rgba(90,139,168,.06);
}

.ps-input:focus {
  border-color: rgba(128,194,220,.62);
  box-shadow: 0 0 0 4px rgba(128,194,220,.14), inset 0 2px 5px rgba(90,139,168,.06);
  transform: translateY(-1px);
}

.ps-summary {
  background: linear-gradient(145deg, rgba(255,255,255,.74), rgba(212,237,248,.52));
  border: 1px solid rgba(128,194,220,.24);
  border-radius: 18px;
  padding: 16px;
}

.ps-save-btn {
  width: 100%;
  margin-top: 14px;
  padding: 14px 20px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(145deg, ${COLORS.primary}, #7b1313);
  color: ${COLORS.white};
  font-family: ${FONTS.heading};
  font-size: 1.02rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 10px 24px rgba(148,25,24,.26);
}

.ps-save-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.04);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 14px 28px rgba(148,25,24,.34);
}

.ps-save-btn:active {
  transform: translateY(2px);
  box-shadow: inset 0 4px 10px rgba(0,0,0,.18), 0 4px 10px rgba(148,25,24,.22);
}

@media (max-width: 768px) {
  .ps-panel {
    left: 8px;
    width: calc(100vw - 16px);
    border-radius: 22px;
  }
  .ps-content {
    padding: 14px 16px 18px;
  }
}
`;

const PresupuestoServicio = ({ selectedServicio, handleCloseSelected, initialPresupuesto = null, onSave = null }) => {
  const [presupuesto, setPresupuesto] = useState({
    ancho: '',
    alto: '',
    materiales: '',
    manoObra: '',
    transporte: '',
    indirectos: '10',
    ganancia: '30',
    cliente_documento: '',
    cliente_razon_social: ''
  });
  const [layoutInsets, setLayoutInsets] = useState({ top: 72, bottom: 12 });

  const numericFields = new Set([
    'ancho',
    'alto',
    'materiales',
    'manoObra',
    'transporte',
    'indirectos',
    'ganancia'
  ]);

  const updatePresupuesto = (field, value) => {
    if (numericFields.has(field)) {
      const sanitized = String(value || '')
        .replace(/,/g, '.')
        .replace(/[^0-9.]/g, '');

      if (sanitized === '') {
        setPresupuesto((prev) => ({ ...prev, [field]: '' }));
        return;
      }

      const parts = sanitized.split('.');
      const normalized = parts.length > 1
        ? `${parts.shift()}.${parts.join('')}`
        : sanitized;

      const num = Number(normalized);
      if (!Number.isFinite(num) || num < 0) {
        return;
      }

      setPresupuesto((prev) => ({ ...prev, [field]: normalized }));
      return;
    }
    setPresupuesto((prev) => ({ ...prev, [field]: value }));
  };

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const anchoCm = toNumber(presupuesto.ancho);

  // when initialPresupuesto changes, populate fields
  useEffect(() => {
    if (initialPresupuesto) {
      setPresupuesto({
        ancho: initialPresupuesto.ancho || '',
        alto: initialPresupuesto.alto || '',
        materiales: initialPresupuesto.materiales || '',
        manoObra: initialPresupuesto.manoObra || '',
        transporte: initialPresupuesto.transporte || '',
        indirectos: initialPresupuesto.indirectos || '10',
        ganancia: initialPresupuesto.ganancia || '30',
        cliente_documento: initialPresupuesto.cliente_documento || '',
        cliente_razon_social: ''
      });
    }
  }, [initialPresupuesto]);

  useEffect(() => {
    const updateInsets = () => {
      const navbar = document.querySelector('nav');
      const footer = document.querySelector('footer');
      const top = navbar ? Math.ceil(navbar.getBoundingClientRect().height) + 10 : 72;
      const bottom = footer ? Math.ceil(footer.getBoundingClientRect().height) + 10 : 12;
      setLayoutInsets({ top, bottom });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('scroll', updateInsets);
    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('scroll', updateInsets);
    };
  }, []);

  const altoCm = toNumber(presupuesto.alto);
  const areaM2 = (anchoCm / 100) * (altoCm / 100);
  const costoMateriales = toNumber(presupuesto.materiales);
  const costoManoObra = toNumber(presupuesto.manoObra);
  const costoTransporte = toNumber(presupuesto.transporte);
  const pctIndirectos = toNumber(presupuesto.indirectos);
  const pctGanancia = toNumber(presupuesto.ganancia);
  const costoBase = costoMateriales + costoManoObra + costoTransporte;
  const costoIndirectos = costoBase * (pctIndirectos / 100);
  const subtotal = costoBase + costoIndirectos;
  const total = subtotal * (1 + pctGanancia / 100);

  const handleGuardarPresupuesto = () => {
    if (!selectedServicio?.id_servicio) {
      alert('El campo servicio_id es requerido.');
      return;
    }

    // Build same structure as before so consuming table remains unchanged
    const precioUnitario = total; // cost after ganancia
    const cantidad = 1;
    const subtotalNew = precioUnitario * cantidad;
    const igv = parseFloat((subtotalNew * 0.18).toFixed(2));
    const totalFinal = parseFloat((subtotalNew + igv).toFixed(2));

    const presupuestoData = {
      servicio_id: selectedServicio.id_servicio,
      descripcion: selectedServicio.nombre,
      cliente_documento: presupuesto.cliente_documento,
      // keep original inputs so we can edit later
      ancho: presupuesto.ancho,
      alto: presupuesto.alto,
      materiales: presupuesto.materiales,
      manoObra: presupuesto.manoObra,
      transporte: presupuesto.transporte,
      indirectos: presupuesto.indirectos,
      ganancia: presupuesto.ganancia,
      cantidad,
      precio_unitario: precioUnitario.toFixed(2),
      subtotal: subtotalNew.toFixed(2),
      igv,
      total: totalFinal
    };

    if (initialPresupuesto) {
      // editing existing entry
      if (typeof onSave === 'function') {
        onSave({ ...initialPresupuesto, ...presupuestoData });
      }
      alert('Presupuesto modificado');
    } else {
      const added = addPresupuesto(presupuestoData);
      window.dispatchEvent(new CustomEvent('presupuestoGuardado', { detail: added }));
    }

    setPresupuesto({
      ancho: '',
      alto: '',
      materiales: '',
      manoObra: '',
      transporte: '',
      indirectos: '10',
      ganancia: '30',
      cliente_documento: '',
      cliente_razon_social: ''
    });
    handleCloseSelected();
  };

  const modalContent = (
    <>
      <style>{CSS_PRESUPUESTO}</style>
      <div
        className="ps-overlay"
        role="button"
        tabIndex={0}
        onClick={handleCloseSelected}
        onKeyDown={(e) => e.key === 'Escape' && handleCloseSelected()}
        style={{ zIndex: 900 }}
      />
      <div
        className="ps-panel"
        style={{
          top: layoutInsets.top,
          bottom: layoutInsets.bottom,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ps-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: FONTS.heading, color: COLORS.text, fontSize: '1.6rem' }}>Presupuesto de servicio</h3>
            <div style={{ color: COLORS.textLight, marginTop: 6, fontSize: 13 }}>
              Proyecto: <b>{selectedServicio?.nombre || '-'}</b>
            </div>
          </div>
          <button
            onClick={handleCloseSelected}
            style={{ background: 'rgba(255,255,255,.32)', border: '1px solid rgba(128,194,220,.22)', cursor: 'pointer', fontSize: 18, width: 40, height: 40, borderRadius: 12, color: COLORS.primary, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)' }}
          >
            X
          </button>
        </div>

        <div className="ps-content">
        {selectedServicio?.imagen_public_url && (
          <div className="ps-section" style={{ padding: 10 }}>
            <img
              src={selectedServicio.imagen_public_url}
              alt={selectedServicio.nombre}
              style={{ width: '100%', height: 210, objectFit: 'cover', borderRadius: 16, display: 'block', boxShadow: '0 14px 26px rgba(26,42,58,.18)' }}
            />
          </div>
        )}

        <div className="ps-section" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="ps-label">Ancho (cm)</label>
              <input
                type="text"
                inputMode="decimal"
                value={presupuesto.ancho}
                onChange={(e) => updatePresupuesto('ancho', e.target.value)}
                className="ps-input"
              />
            </div>
            <div>
              <label className="ps-label">Alto (cm)</label>
              <input
                type="text"
                inputMode="decimal"
                value={presupuesto.alto}
                onChange={(e) => updatePresupuesto('alto', e.target.value)}
                className="ps-input"
              />
            </div>
          </div>
          <div>
            <label className="ps-label">Costo materiales (S/)</label>
            <input
              type="text"
              inputMode="decimal"
              value={presupuesto.materiales}
              onChange={(e) => updatePresupuesto('materiales', e.target.value)}
              className="ps-input"
            />
          </div>
          <div>
            <label className="ps-label">Mano de obra (S/)</label>
            <input
              type="text"
              inputMode="decimal"
              value={presupuesto.manoObra}
              onChange={(e) => updatePresupuesto('manoObra', e.target.value)}
              className="ps-input"
            />
          </div>
          <div>
            <label className="ps-label">Transporte (S/)</label>
            <input
              type="text"
              inputMode="decimal"
              value={presupuesto.transporte}
              onChange={(e) => updatePresupuesto('transporte', e.target.value)}
              className="ps-input"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="ps-label">Indirectos (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={presupuesto.indirectos}
                onChange={(e) => updatePresupuesto('indirectos', e.target.value)}
                className="ps-input"
              />
            </div>
            <div>
              <label className="ps-label">Ganancia (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={presupuesto.ganancia}
                onChange={(e) => updatePresupuesto('ganancia', e.target.value)}
                className="ps-input"
              />
            </div>
          </div>
        </div>

        <div className="ps-summary" style={{ marginTop: 'auto' }}>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Area: {areaM2 ? areaM2.toFixed(2) : '0.00'} m2
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Costo base: S/ {costoBase.toFixed(2)}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Indirectos: S/ {costoIndirectos.toFixed(2)}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Subtotal: S/ {subtotal.toFixed(2)}
          </div>
          <div style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.primary, marginTop: 6 }}>
            Total: S/ {total.toFixed(2)}
          </div>
          <button
            onClick={handleGuardarPresupuesto}
            className="ps-save-btn"
          >
            Guardar Presupuesto
          </button>
        </div>
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default PresupuestoServicio;