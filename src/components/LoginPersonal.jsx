import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import IMG from '../assets/IMG.png';
import VentasBody from "./VENTA/VentasBody";
import Administracion from "./ADMINISTRACIÓN/Administracion";
import Obras from "./OBRAS/GestionObras";
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../colors';
import {
  IconTools,
  IconDeviceDesktopAnalytics,
  IconAlignBoxLeftStretch,
  IconBuildingStore,
  IconLockFilled,
  IconLock,
} from '@tabler/icons-react';

const R = COLORS.primary;
const C = COLORS.secondary;
const BG  = '#e8edf2';
const SH1 = '#ffffff';
const SH2 = '#c5cbd3';

const normalizarArea = (s) => {
  if (!s) return "";
  const n = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
  return n === 'OPERACIONES' ? 'OBRAS' : n;
};

const AreaIconComp = ({ area, size = 20 }) => {
  const n = normalizarArea(area);
  const props = { size, stroke: 1, style: { flexShrink: 0 } };
  if (n === 'VENTAS')         return <IconBuildingStore {...props} />;
  if (n === 'ALMACEN')        return <IconAlignBoxLeftStretch {...props} />;
  if (n === 'ADMINISTRACION') return <IconDeviceDesktopAnalytics {...props} />;
  if (n === 'OBRAS' || n === 'TRABAJO') return <IconTools {...props} />;
  return <IconBuildingStore {...props} />;
};

/* ══ DROPDOWN — abre hacia arriba via Portal ══ */
const AreaDropdown = ({ value, areas, onChange }) => {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({});
  const trigRef           = useRef(null);
  const menuRef           = useRef(null);

  const openUp = () => {
    if (!trigRef.current) return;
    const r = trigRef.current.getBoundingClientRect();
    setPos({ position:'fixed', left:r.left, width:r.width, bottom: window.innerHeight - r.top + 6, zIndex:99999 });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const h = e => { if (!trigRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div style={{ position:'relative' }}>
      <button type="button" ref={trigRef}
        onClick={() => open ? setOpen(false) : openUp()}
        style={{
          width:'100%', padding:'13px 18px',
          borderRadius:50, border:'none', background:BG,
          boxShadow: open
            ? `inset 3px 3px 8px ${SH2}, inset -3px -3px 8px ${SH1}`
            : `6px 6px 14px ${SH2}, -6px -6px 14px ${SH1}`,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
          fontFamily:"'Open Sans',sans-serif", fontSize:14,
          color: value ? '#2d3748' : '#a0aec0',
          transition:'box-shadow .22s', textAlign:'left',
        }}>
        <span style={{ display:'flex', alignItems:'center', gap:10 }}>
          {value
            ? <><AreaIconComp area={value} size={18} />
              <span style={{ fontWeight:600 }}>{value}</span></>
            : 'Selecciona tu área…'
          }
        </span>
        <svg style={{ flexShrink:0, color:'#a0aec0', transition:'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && createPortal(
        <div ref={menuRef} style={{
          ...pos, background:BG, borderRadius:18,
          boxShadow:`8px 8px 20px ${SH2}, -8px -8px 20px ${SH1}`,
          overflow:'hidden', padding:6,
          fontFamily:"'Open Sans',sans-serif",
        }}>
          {areas.map(a => (
            <button type="button" key={a}
              onClick={() => { onChange(a); setOpen(false); }}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding:'10px 14px', border:'none', borderRadius:12,
                background: value === a ? `linear-gradient(135deg,${R},#c94543)` : 'transparent',
                cursor:'pointer', fontSize:13.5,
                fontWeight: value === a ? 700 : 400,
                color: value === a ? '#fff' : '#4a5568',
                textAlign:'left', transition:'background .14s',
              }}
              onMouseEnter={e => { if (value !== a) e.currentTarget.style.background = `${C}22`; }}
              onMouseLeave={e => { if (value !== a) e.currentTarget.style.background = 'transparent'; }}>
              <AreaIconComp area={a} size={17} />
              <span style={{ flex:1 }}>{a}</span>
              {value === a && <span style={{ fontSize:12, opacity:.85 }}>✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

/* ══ INPUT neumórfico — definido FUERA del componente para no re-montarse ══ */
const NInput = ({ type: initialType, placeholder, value, onChange, required, icon, toggleable, noNumbers, validate }) => {
  const [focus, setFocus]       = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const type = toggleable ? (showPass ? 'text' : 'password') : initialType;

  const handleChange = (e) => {
    let val = e.target.value;
    // Bloquear números en el campo nombre
    if (noNumbers) val = val.replace(/[0-9]/g, '');
    onChange({ ...e, target: { ...e.target, value: val } });
    setError('');
  };

  const handleBlur = () => {
    setFocus(false);
    if (required && !value.trim()) setError('Este campo es obligatorio');
    else if (validate) { const msg = validate(value); if (msg) setError(msg); }
  };

  return (
    <div style={{ position:'relative' }}>
      {!toggleable && (
        <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#a0aec0', display:'flex', pointerEvents:'none', zIndex:1 }}>
          {icon}
        </span>
      )}

      <input type={type} placeholder={placeholder} value={value}
        onChange={handleChange}
        onFocus={() => { setFocus(true); setError(''); }} onBlur={handleBlur}
        style={{
          width:'100%',
          padding: toggleable ? '14px 46px 14px 18px' : '14px 18px 14px 44px',
          borderRadius:50, border:'none', background:BG,
          boxShadow: error
            ? `inset 4px 4px 10px ${SH2}, inset -4px -4px 10px ${SH1}, 0 0 0 2px rgba(239,68,68,.35)`
            : focus
              ? `inset 4px 4px 10px ${SH2}, inset -4px -4px 10px ${SH1}`
              : `6px 6px 14px ${SH2}, -6px -6px 14px ${SH1}`,
          fontFamily:"'Open Sans',sans-serif", fontSize:14,
          color:'#2d3748', outline:'none', boxSizing:'border-box',
          transition:'box-shadow .22s',
        }}
      />

      {toggleable && (
        <button type="button"
          onClick={() => setShowPass(s => !s)}
          style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#a0aec0', display:'flex', alignItems:'center', padding:4, transition:'color .18s' }}
          onMouseEnter={e => e.currentTarget.style.color = C}
          onMouseLeave={e => e.currentTarget.style.color = '#a0aec0'}>
          {showPass ? <IconLock size={17} stroke={1} /> : <IconLockFilled size={17} />}
        </button>
      )}

      {/* Tooltip de error estilo glassmorphism oscuro */}
      {error && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 10px)', left:'50%',
          transform:'translateX(-50%)',
          background:'linear-gradient(135deg,rgba(0,18,46,0.97),rgba(0,30,62,0.99))',
          border:'1px solid rgba(128,194,220,0.45)',
          borderRadius:10, padding:'8px 14px',
          boxShadow:'0 0 20px rgba(128,194,220,.2),0 6px 24px rgba(0,0,0,.45)',
          backdropFilter:'blur(14px)',
          display:'inline-flex', alignItems:'center', gap:8,
          whiteSpace:'nowrap', zIndex:200,
          fontFamily:"'Open Sans',sans-serif", fontSize:12, fontWeight:600,
          color:'rgba(200,235,255,.95)', letterSpacing:'.02em',
        }}>
          {/* Ícono ! */}
          <span style={{ width:16, height:16, borderRadius:'50%', background:'linear-gradient(135deg,#80C2DC,#4fa8cc)', color:'#001428', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, flexShrink:0 }}>!</span>
          {error}
          {/* Flecha abajo */}
          <span style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%) rotate(45deg)', width:10, height:10, background:'rgba(0,30,62,0.99)', borderRight:'1px solid rgba(128,194,220,.45)', borderBottom:'1px solid rgba(128,194,220,.45)' }} />
        </div>
      )}
    </div>
  );
};

/* ══ MAIN ══ */
const LoginPersonal = () => {
  const [form, setForm]           = useState({ nombre:'', codigo:'', area:'' });
  const [mensaje, setMensaje]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [areas, setAreas]         = useState([]);
  const [autenticado, setAutenticado] = useState(false);
  const [areaUsuario, setAreaUsuario] = useState('');
  const [mounted, setMounted]     = useState(false);
  const navigate                  = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useEffect(() => {
    fetch('/api/tipo_personal/descripciones')
      .then(r => r.json()).then(setAreas)
      .catch(() => setAreas(['VENTAS','ALMACÉN','TRABAJO','ADMINISTRACIÓN']));
  }, []);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('personalToken');
      if (!token) return;
      try {
        const res  = await fetch('/api/personal/me', { headers:{ Authorization:`Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.success && data.personal) {
          setAutenticado(true);
          const area = data.personal.area || '';
          setAreaUsuario(area);
          setForm(f => ({ ...f, nombre: data.personal.name || f.nombre, area }));
          const an = normalizarArea(area);
          if (an === 'ALMACEN')        navigate('/almacen');
          if (an === 'ADMINISTRACION') navigate('/administracion');
          if (an === 'OBRAS' || an === 'TRABAJO') navigate('/obras');
        } else { localStorage.removeItem('personalToken'); }
      } catch {}
    };
    restore();
  }, [navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    // Validación manual — no usamos required nativo
    if (!form.area)          return setMensaje('Selecciona un área');
    if (!form.nombre.trim()) return setMensaje('Ingresa tu nombre');
    if (!form.codigo)        return setMensaje('Ingresa tu código de acceso');
    setMensaje(''); setLoading(true);
    try {
      const res  = await fetch('/api/personal/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nombre: form.nombre.trim(), codigo:form.codigo, area:form.area }),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje('¡Ingreso exitoso!'); setAutenticado(true); setAreaUsuario(form.area);
        try { localStorage.setItem('usuario', JSON.stringify({ nombre:form.nombre, codigo:form.codigo, rol:form.area })); } catch {}
        try { if (data.token) localStorage.setItem('personalToken', data.token); } catch {}
        const an = normalizarArea(form.area);
        if (an === 'ALMACEN')        { navigate('/almacen');       return; }
        if (an === 'ADMINISTRACION') { navigate('/administracion'); return; }
        if (an === 'OBRAS' || an === 'TRABAJO') { navigate('/obras'); return; }
      } else { setMensaje(data.error || 'Nombre o código incorrecto'); }
    } catch { setMensaje('Error de conexión'); }
    setLoading(false);
  };

  if (autenticado) {
    const an = normalizarArea(areaUsuario);
    if (an === 'VENTAS')         return <VentasBody />;
    if (an === 'ADMINISTRACION') return <Administracion />;
    if (an === 'ALMACEN')        { navigate('/almacen'); return null; }
    if (an === 'OBRAS' || an === 'TRABAJO') return <Obras />;
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:BG, padding:'16px', marginTop:'-64px', overflow:'hidden', position:'relative' }}>
      <style>{CSS}</style>

      {/* Card neumórfica */}
      <div className={`nm-card ${mounted ? 'in' : ''}`}>

        {/* Avatar — logo circular */}
        <div className="nm-avatar-wrap">
          <div className="nm-avatar-outer">
            <div className="nm-avatar-inner">
              <img src={IMG} alt="Vidriobras" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%', display:'block' }} />
            </div>
          </div>
        </div>

        {/* Nombre empresa */}
        <div className="nm-brand">VIDRIOBRAS</div>
        <div className="nm-brand-sub">Sistema Interno</div>

        {/* Área selector */}
        <div className="nm-field">
          <AreaDropdown value={form.area} areas={areas}
            onChange={a => setForm({ ...form, area:a, nombre:'', codigo:'' })} />
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:16, width:'100%' }}>
          <NInput type="text" placeholder="Nombre" value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            noNumbers
            icon={
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            } />

          <NInput type="password" placeholder="Código de acceso" value={form.codigo}
            onChange={e => setForm({ ...form, codigo:e.target.value })}
            toggleable />

          <button type="submit" disabled={loading} className={`nm-btn ${loading ? 'busy' : ''}`}>
            {loading ? <><span className="nm-spin"/>Verificando…</> : 'Ingresar'}
          </button>
        </form>

        {/* Mensaje */}
        {mensaje && (
          <div className={`nm-msg ${mensaje.includes('exitoso') ? 'ok' : 'err'}`}>
            {mensaje.includes('exitoso') ? '✓ ' : '⚠ '}{mensaje}
          </div>
        )}

        {/* Footer */}
        <p className="nm-footer">
          Acceso restringido · <span style={{ color:C, cursor:'pointer' }}>Vidriobras</span>
        </p>
      </div>
    </div>
  );
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

  @keyframes nm-in   {from{opacity:0;transform:translateY(24px)scale(.96)}to{opacity:1;transform:translateY(0)scale(1)}}
  @keyframes nm-spin {to{transform:rotate(360deg)}}
  @keyframes nm-sh   {0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes nm-pulse{0%,100%{box-shadow:0 0 0 0 rgba(128,194,220,0)}50%{box-shadow:0 0 0 8px rgba(128,194,220,.18)}}

  .nm-card{
    width:100%;max-width:340px;
    padding:40px 32px 32px;
    border-radius:32px;
    background:${BG};
    box-shadow:14px 14px 32px ${SH2},-14px -14px 32px ${SH1};
    display:flex;flex-direction:column;align-items:center;gap:14px;
    opacity:0;
  }
  .nm-card.in{animation:nm-in .55s cubic-bezier(.22,1,.36,1) forwards}

  /* Avatar */
  .nm-avatar-wrap{margin-bottom:4px}
  .nm-avatar-outer{
    width:82px;height:82px;border-radius:50%;
    background:${BG};
    box-shadow:6px 6px 14px ${SH2},-6px -6px 14px ${SH1};
    display:flex;align-items:center;justify-content:center;
    animation:nm-pulse 3s ease-in-out infinite;
  }
  .nm-avatar-inner{
    width:68px;height:68px;border-radius:50%;
    overflow:hidden;
    box-shadow:inset 3px 3px 8px ${SH2},inset -3px -3px 8px ${SH1};
  }

  /* Brand */
  .nm-brand{font-family:'Nunito',sans-serif;font-size:18px;font-weight:800;color:#2d3748;letter-spacing:.1em;margin-top:-4px}
  .nm-brand-sub{font-family:'Open Sans',sans-serif;font-size:10px;color:#a0aec0;letter-spacing:.16em;text-transform:uppercase;margin-top:-8px}

  .nm-field{width:100%}

  /* Botón */
  .nm-btn{
    width:100%;padding:14px;
    border-radius:50px;border:none;
    background:linear-gradient(135deg,${C} 0%,#5ab3d4 100%);
    color:#fff;
    font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;
    letter-spacing:.06em;cursor:pointer;
    box-shadow:5px 5px 14px ${SH2},-3px -3px 10px ${SH1},0 8px 20px rgba(128,194,220,.4);
    transition:transform .18s,box-shadow .18s;
    display:flex;align-items:center;justify-content:center;gap:8px;
    position:relative;overflow:hidden;
  }
  .nm-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);background-size:200% 100%;animation:nm-sh 2.6s linear infinite;opacity:0;transition:opacity .3s}
  .nm-btn:hover::after{opacity:1}
  .nm-btn:hover:not(.busy){transform:translateY(-2px);box-shadow:5px 5px 14px ${SH2},-3px -3px 10px ${SH1},0 14px 28px rgba(128,194,220,.5)}
  .nm-btn:active{box-shadow:inset 4px 4px 10px rgba(0,0,0,.12),inset -4px -4px 10px rgba(255,255,255,.5)}
  .nm-btn.busy{background:#cbd5e0;box-shadow:none;cursor:not-allowed}
  .nm-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;animation:nm-spin .7s linear infinite;flex-shrink:0}

  /* Mensaje */
  .nm-msg{width:100%;padding:10px 14px;border-radius:14px;font-family:'Open Sans',sans-serif;font-size:12.5px;font-weight:600;text-align:center;box-shadow:inset 3px 3px 7px ${SH2},inset -3px -3px 7px ${SH1}}
  .nm-msg.ok{color:#38a169}
  .nm-msg.err{color:#e53e3e}

  .nm-footer{font-family:'Open Sans',sans-serif;font-size:11px;color:#a0aec0;margin:0;text-align:center}

  @media(max-width:400px){
    .nm-card{padding:32px 22px 26px;max-width:300px}
  }
`;

export default LoginPersonal;