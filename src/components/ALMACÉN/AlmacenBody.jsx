import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLogout, IconBox, IconChartBar } from '@tabler/icons-react';
import { FONTS } from '../../colors';
import RegistroProductos from './RegistroProductos';
import ControlStock from './ControlStock';
import BrandToast from '../UI/BrandToast';

const TAB_CONFIG = [
  { key: 'registro', label: 'Registro de Productos', icon: IconBox },
  { key: 'stock',    label: 'Control de Stock',      icon: IconChartBar },
];

const STYLES = `
  @keyframes alm-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .alm-root {
    padding: 0 12px 40px 12px;
    font-family: ${FONTS?.body ?? 'sans-serif'};
    background: linear-gradient(160deg, #daeef8 0%, #eaf5fb 50%, #f0f8ff 100%);
    overflow: hidden;
  }
  @media (min-width: 768px) {
    .alm-root {
      padding: 0 20px 48px 20px;
    }
  }
  .alm-toprow {
    display: flex;
    justify-content: flex-end;
    padding: 24px 4px 16px 4px;
  }
  @media (min-width: 768px) {
    .alm-toprow {
      padding: 36px 4px 20px 4px;
    }
  }
  .alm-logout {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.72);
    color: #1a6fa8;
    border: 1.5px solid rgba(80,160,210,0.32);
    border-radius: 10px;
    font-family: ${FONTS?.heading ?? 'sans-serif'};
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.3px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(80,160,210,0.10);
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  @media (min-width: 768px) {
    .alm-logout {
      padding: 8px 20px;
      font-size: 0.82rem;
    }
  }
  .alm-logout:hover {
    background: rgba(255,255,255,0.92);
    box-shadow: 0 4px 16px rgba(80,160,210,0.22);
    transform: translateY(-1px);
  }
  .alm-wrapper { 
    width: 100%; 
    animation: alm-fadein 0.35s ease both; 
    overflow: hidden;
  }
  .alm-tabs { 
    display: flex; 
    padding: 0 4px; 
    gap: 2px;
    flex-wrap: wrap;
    overflow: visible;
  }
  .alm-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 16px;
    border: 1.5px solid rgba(80,170,220,0.30);
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    background: rgba(175,222,246,0.42);
    color: #3a8ab5;
    font-family: ${FONTS?.heading ?? 'sans-serif'};
    font-weight: 700; 
    font-size: 0.75rem; 
    letter-spacing: 0.2px;
    cursor: pointer; 
    backdrop-filter: blur(8px);
    position: relative; 
    bottom: -1px;
    transition: background 0.2s, color 0.2s;
    white-space: nowrap;
  }
  @media (min-width: 768px) {
    .alm-tab {
      padding: 11px 28px;
      font-size: 0.875rem;
      gap: 8px;
    }
  }
  .alm-tab.active {
    background: rgba(255,255,255,0.97); color: #0c4f7a;
    border-color: rgba(70,165,220,0.45);
    border-bottom: 1.5px solid rgba(255,255,255,0.97);
    z-index: 2; box-shadow: 0 -3px 12px rgba(70,155,210,0.10);
  }
  .alm-tab:not(.active):hover { background: rgba(200,238,252,0.68); color: #0c4f7a; }
  .alm-card {
    position: relative; z-index: 1; width: 100%;
    background: rgba(255,255,255,0.94);
    border-radius: 0 12px 12px 12px;
    border: 1.5px solid rgba(70,165,220,0.38);
    box-shadow: 0 10px 36px rgba(70,155,210,0.13), 0 2px 6px rgba(70,155,210,0.06), inset 0 1px 0 rgba(255,255,255,0.80);
    padding: 16px 16px;
    backdrop-filter: blur(18px);
    box-sizing: border-box;
    animation: alm-fadein 0.28s ease both;
    overflow: hidden;
  }
  @media (min-width: 768px) {
    .alm-card {
      border-radius: 0 16px 16px 16px;
      padding: 32px 36px;
    }
  }
`;

const AlmacenBody = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('registro');
  const [toast, setToast] = useState(null);
  const [productosCache, setProductosCache]   = useState([]);
  const [categoriasCache, setCategoriasCache] = useState([]);

  useEffect(() => {
    const id = 'alm-styles-v4';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id; tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('personalToken')) {
      navigate('/personal', { replace: true });
    }
  }, [navigate]);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const cargarProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/productos');
      if (!res.ok) throw new Error('No se pudo conectar al servidor.');
      const data = await res.json();
      setProductosCache(Array.isArray(data) ? data : []);
    } catch (err) { showToast(`Error al cargar productos: ${err.message}`, 'error'); }
  }, [showToast]);

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias');
      if (!res.ok) throw new Error('No se pudo conectar al servidor.');
      const data = await res.json();
      setCategoriasCache(Array.isArray(data) ? data : []);
    } catch (err) { showToast(`Error al cargar categorías: ${err.message}`, 'error'); }
  }, [showToast]);

  useEffect(() => { cargarProductos(); cargarCategorias(); }, [cargarProductos, cargarCategorias]);

  const handleLogout = () => {
    ['personalToken', 'auth_token', 'cliente_id', 'cliente_correo'].forEach(k => localStorage.removeItem(k));
    // Conservar historial cliente, solo quitar rutas de staff
    const staffPaths = new Set(['/almacen', '/administracion', '/obras', '/operaciones', '/personal']);
    try {
      const stored = localStorage.getItem('breadcrumb_history');
      const history = stored ? JSON.parse(stored) : [];
      const cleaned = history.filter(b => !staffPaths.has(b.path));
      localStorage.setItem('breadcrumb_history', JSON.stringify(cleaned));
    } catch {}
    navigate('/personal', { replace: true });
  };

  return (
    <div className="alm-root">
      <BrandToast toast={toast} onClose={() => setToast(null)} />
      <div className="alm-toprow">
        <button className="alm-logout" onClick={handleLogout}>
          <IconLogout stroke={1.5} size={16} /> Salir
        </button>
      </div>
      <div className="alm-wrapper">
        <div className="alm-tabs">
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`alm-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              <Icon size={15} stroke={2} /> {label}
            </button>
          ))}
        </div>
        <div className="alm-card" key={tab}>
          {tab === 'registro' && (
            <RegistroProductos
              categoriasCache={categoriasCache}
              productosCache={productosCache}
              cargarProductos={cargarProductos}
              showToast={showToast}
            />
          )}
          {tab === 'stock' && <ControlStock productosCache={productosCache} />}
        </div>
      </div>
    </div>
  );
};

export default AlmacenBody;