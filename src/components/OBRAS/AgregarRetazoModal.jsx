import React, { useEffect, useMemo, useState } from 'react';
import { IconX, IconDeviceFloppy, IconSparkles, IconAlertTriangle } from '@tabler/icons-react';
import { FONTS } from '../../colors';

const T = {
  celeste: '#80C2DC',
  celesteStrong: '#5aa8c9',
  text: '#1b3347',
  textSoft: '#4b6d84',
  bgGlass: 'rgba(170, 220, 244, 0.18)',
  bgGlassStrong: 'rgba(170, 220, 244, 0.28)',
  border: 'rgba(128,194,220,.5)',
};

const boxInset = {
  background: T.bgGlass,
  border: `1px solid ${T.border}`,
  boxShadow: 'inset 0 2px 8px rgba(255,255,255,.45), inset 0 -8px 20px rgba(90,168,201,.16), 0 8px 28px rgba(80,140,172,.18)',
  borderRadius: 12,
};

const inputStyle = {
  width: '100%',
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  background: 'rgba(220,244,255,.45)',
  boxShadow: 'inset 0 3px 8px rgba(255,255,255,.55), inset 0 -7px 14px rgba(90,168,201,.12)',
  color: T.text,
  fontSize: 13,
  fontFamily: FONTS.body,
  padding: '10px 12px',
  outline: 'none',
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: T.textSoft,
  marginBottom: 6,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  fontFamily: FONTS.body,
};

function AgregarRetazoModal({ open, onClose, onSaved }) {
  const [categorias, setCategorias] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    id_categoria: '',
    nombre: '',
    lugar: '',
    ancho_cm: '',
    alto_cm: '',
    cantidad: 1,
    descripcion: '',
  });

  const area = useMemo(() => {
    const a = Number(form.ancho_cm || 0);
    const h = Number(form.alto_cm || 0);
    if (a <= 0 || h <= 0) return 0;
    return Number((a * h).toFixed(3));
  }, [form.ancho_cm, form.alto_cm]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const loadCategorias = async () => {
      try {
        const res = await fetch('/api/retazos/categorias');
        const json = await res.json();
        if (!mounted) return;
        if (json?.success && Array.isArray(json.data)) {
          setCategorias(json.data);
        } else {
          setCategorias([]);
        }
      } catch {
        if (mounted) setCategorias([]);
      }
    };
    loadCategorias();
    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const sanitizeNombre = (value) => String(value || '').replace(/[0-9]/g, '');
  const sanitizeDecimal = (value) => {
    let v = String(value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    }
    if (v.startsWith('.')) v = `0${v}`;
    return v;
  };
  const sanitizeInt = (value) => String(value || '').replace(/[^0-9]/g, '');

  const validateForm = () => {
    const errors = {};
    const nombre = String(form.nombre || '').trim();
    const lugar = String(form.lugar || '').trim();
    const ancho = Number(form.ancho_cm || 0);
    const alto = Number(form.alto_cm || 0);
    const cantidad = Number(form.cantidad || 0);

    if (!form.id_categoria) errors.id_categoria = 'Selecciona una categoria.';
    if (!nombre) errors.nombre = 'El nombre es obligatorio.';
    if (/\d/.test(nombre)) errors.nombre = 'El nombre no puede contener numeros.';
    if (!lugar) errors.lugar = 'El lugar es obligatorio.';
    if (!(ancho > 0)) errors.ancho_cm = 'El ancho debe ser mayor a 0.';
    if (!(alto > 0)) errors.alto_cm = 'El alto debe ser mayor a 0.';
    if (!(cantidad > 0)) errors.cantidad = 'La cantidad debe ser mayor a 0.';

    setFieldErrors(errors);
    return { ok: Object.keys(errors).length === 0, errors };
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = validateForm();
    if (!validation.ok) {
      setError('Revisa los campos marcados para continuar.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        ancho_cm: Number(form.ancho_cm || 0),
        alto_cm: Number(form.alto_cm || 0),
        cantidad: Number(form.cantidad || 0),
        area,
      };

      const res = await fetch('/api/retazos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'No se pudo guardar el retazo');
      }

      if (typeof onSaved === 'function') onSaved(json?.data || null);
      window.dispatchEvent(new CustomEvent('retazo_guardado', { detail: json?.data || null }));

      setForm({
        id_categoria: '',
        nombre: '',
        lugar: '',
        ancho_cm: '',
        alto_cm: '',
        cantidad: 1,
        descripcion: '',
      });
      onClose();
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1400,
      background: 'rgba(15, 38, 55, .32)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <form noValidate onSubmit={submit} style={{
        width: 'min(760px, 95vw)',
        ...boxInset,
        background: 'linear-gradient(160deg, rgba(215,241,255,.28), rgba(180,224,246,.18))',
        padding: 20,
        borderRadius: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconSparkles size={16} color={T.celesteStrong} />
              <h3 style={{ margin: 0, color: T.text, fontFamily: FONTS.heading, fontSize: 22, letterSpacing: '.02em' }}>
                Agregar Retazo
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textSoft, fontFamily: FONTS.body }}>
              Registro rapido con efecto vidrio celeste.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bgGlassStrong,
            color: T.text,
            cursor: 'pointer',
          }}>
            <IconX size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: 12,
            borderRadius: 12,
            padding: '10px 12px',
            border: '1px solid rgba(203,102,54,.45)',
            background: 'linear-gradient(135deg, rgba(255,235,227,.86), rgba(255,246,240,.78))',
            color: '#8f3a1b',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONTS.body,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 18px rgba(180,95,52,.14)',
          }}>
            <IconAlertTriangle size={15} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <div>
            <div style={labelStyle}>Categoria</div>
            <select value={form.id_categoria} onChange={(e) => setField('id_categoria', e.target.value)} style={{ ...inputStyle, borderColor: fieldErrors.id_categoria ? '#d88a68' : T.border }}>
              <option value="">Selecciona categoria</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.descripcion || 'Sin nombre'}</option>
              ))}
            </select>
            {fieldErrors.id_categoria && <div style={{ marginTop: 5, color: '#8f3a1b', fontSize: 11, fontWeight: 700 }}>{fieldErrors.id_categoria}</div>}
          </div>

          <div>
            <div style={labelStyle}>Nombre</div>
            <input value={form.nombre} onChange={(e) => setField('nombre', sanitizeNombre(e.target.value))} maxLength={20} style={{ ...inputStyle, borderColor: fieldErrors.nombre ? '#d88a68' : T.border }} />
            {fieldErrors.nombre && <div style={{ marginTop: 5, color: '#8f3a1b', fontSize: 11, fontWeight: 700 }}>{fieldErrors.nombre}</div>}
          </div>

          <div>
            <div style={labelStyle}>Lugar</div>
            <input value={form.lugar} onChange={(e) => setField('lugar', e.target.value)} maxLength={50} style={{ ...inputStyle, borderColor: fieldErrors.lugar ? '#d88a68' : T.border }} />
            {fieldErrors.lugar && <div style={{ marginTop: 5, color: '#8f3a1b', fontSize: 11, fontWeight: 700 }}>{fieldErrors.lugar}</div>}
          </div>

          <div>
            <div style={labelStyle}>Ancho (cm)</div>
            <input type="text" inputMode="decimal" value={form.ancho_cm} onChange={(e) => setField('ancho_cm', sanitizeDecimal(e.target.value))} style={{ ...inputStyle, borderColor: fieldErrors.ancho_cm ? '#d88a68' : T.border }} />
            {fieldErrors.ancho_cm && <div style={{ marginTop: 5, color: '#8f3a1b', fontSize: 11, fontWeight: 700 }}>{fieldErrors.ancho_cm}</div>}
          </div>

          <div>
            <div style={labelStyle}>Alto (cm)</div>
            <input type="text" inputMode="decimal" value={form.alto_cm} onChange={(e) => setField('alto_cm', sanitizeDecimal(e.target.value))} style={{ ...inputStyle, borderColor: fieldErrors.alto_cm ? '#d88a68' : T.border }} />
            {fieldErrors.alto_cm && <div style={{ marginTop: 5, color: '#8f3a1b', fontSize: 11, fontWeight: 700 }}>{fieldErrors.alto_cm}</div>}
          </div>

          <div>
            <div style={labelStyle}>Cantidad</div>
            <input type="text" inputMode="numeric" value={form.cantidad} onChange={(e) => setField('cantidad', sanitizeInt(e.target.value))} style={{ ...inputStyle, borderColor: fieldErrors.cantidad ? '#d88a68' : T.border }} />
            {fieldErrors.cantidad && <div style={{ marginTop: 5, color: '#8f3a1b', fontSize: 11, fontWeight: 700 }}>{fieldErrors.cantidad}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>Descripcion</div>
            <input value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} maxLength={20} style={inputStyle} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={labelStyle}>Area (cm2)</div>
            <input value={area ? area : ''} readOnly style={{ ...inputStyle, fontWeight: 700, color: '#0f4f6f' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button type="button" onClick={onClose} style={{
            border: `1px solid ${T.border}`,
            background: 'rgba(255,255,255,.55)',
            color: T.textSoft,
            borderRadius: 11,
            padding: '10px 14px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONTS.body,
          }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{
            border: `1px solid ${T.celesteStrong}`,
            background: 'linear-gradient(135deg, #79c1df, #5aa8c9)',
            color: '#fff',
            borderRadius: 11,
            padding: '10px 16px',
            fontWeight: 800,
            cursor: saving ? 'default' : 'pointer',
            fontFamily: FONTS.body,
            opacity: saving ? .7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 10px 24px rgba(68,149,183,.36)',
          }}>
            <IconDeviceFloppy size={15} />
            {saving ? 'Guardando...' : 'Guardar retazo'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AgregarRetazoModal;
