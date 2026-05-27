import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import Gastos from './Gastos';
import Cuadre from './Cuadre';
import Cliente from './Cliente';
import Personal from './Personal';
import Proyecto from './Proyecto';
import DashboardETL from './DashboardETL';
import BrandButton from '../UI/BrandButton';
import BrandToast from '../UI/BrandToast';

/* ─── Estilos ─────────────────────────────────────────────── */
const ADM_STYLES = `
  @keyframes adm-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .adm-root {
    min-height: 100vh;
    padding: 0 20px 48px 20px;
    font-family: ${FONTS?.body ?? 'sans-serif'};
    background: linear-gradient(160deg, #daeef8 0%, #eaf5fb 50%, #f0f8ff 100%);
    color: #1a4a6a;
    overflow-x: hidden;
  }

  /* ── Fila superior ── */
  .adm-toprow {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 28px 4px 16px 4px;
  }

  .adm-logout {
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
    white-space: nowrap;
  }
  .adm-logout:hover {
    background: rgba(255,255,255,0.92);
    box-shadow: 0 4px 16px rgba(80,160,210,0.22);
    transform: translateY(-1px);
  }

  /* ── Tab strip ── */
  .adm-tabs {
    display: flex;
    padding: 0 4px;
    gap: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
  }
  .adm-tabs::-webkit-scrollbar { display: none; }

  .adm-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border: 1.5px solid rgba(80,170,220,0.30);
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    background: rgba(175,222,246,0.42);
    color: #3a8ab5;
    font-family: ${FONTS?.heading ?? 'sans-serif'};
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.15px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    position: relative;
    bottom: -1px;
    transition: background 0.2s, color 0.2s, padding 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  .adm-tab.active {
    background: rgba(255,255,255,0.97);
    color: #0c4f7a;
    border-color: rgba(70,165,220,0.45);
    border-bottom: 1.5px solid rgba(255,255,255,0.97);
    z-index: 2;
    box-shadow: 0 -3px 12px rgba(70,155,210,0.10);
  }

  .adm-tab:not(.active):hover {
    background: rgba(200,238,252,0.68);
    color: #0c4f7a;
  }

  /* ── Content card ── */
  .adm-card {
    position: relative;
    z-index: 1;
    width: 100%;
    background: rgba(255,255,255,0.94);
    border-radius: 0 16px 16px 16px;
    border: 1.5px solid rgba(70,165,220,0.38);
    box-shadow:
      0 10px 36px rgba(70,155,210,0.13),
      0 2px 6px rgba(70,155,210,0.06),
      inset 0 1px 0 rgba(255,255,255,0.80);
    padding: 24px 20px;
    backdrop-filter: blur(18px);
    box-sizing: border-box;
    animation: adm-fadein 0.28s ease both;
  }

  /* ── Dashboard cards ── */
  .adm-dash-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .adm-stat-card {
    background: rgba(220,242,255,0.45);
    border: 1.5px solid rgba(70,165,220,0.20);
    border-radius: 14px;
    padding: 14px 16px 10px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 14px rgba(70,155,210,0.08);
  }

  .adm-stat-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #4a90b8;
    margin-bottom: 6px;
  }

  .adm-stat-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0c4f7a;
    line-height: 1;
    margin-bottom: 10px;
  }

  .adm-stat-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 36px;
  }

  .adm-stat-bar {
    flex: 1;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(180deg, #3ab0e8 0%, #1a7ab5 100%);
    opacity: 0.75;
    transition: opacity 0.2s;
  }
  .adm-stat-card:hover .adm-stat-bar { opacity: 1; }

  /* ── Mini chart cards ── */
  .adm-charts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .adm-chart-card {
    background: rgba(255,255,255,0.70);
    border: 1.5px solid rgba(70,165,220,0.18);
    border-radius: 14px;
    padding: 14px 16px;
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 14px rgba(70,155,210,0.07);
    overflow: hidden;
    max-width: 100%;
  }

  .adm-chart-title {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #4a90b8;
    margin-bottom: 10px;
  }

  .adm-chart-card img {
    max-width: 100%;
    height: auto;
    display: block;
    border-radius: 8px;
  }

  /* ── Tablet (640px+) ── */
  @media (min-width: 640px) {
    .adm-tab {
      padding: 9px 14px;
      font-size: 0.75rem;
    }

    .adm-tabs {
      padding: 0 6px;
      gap: 3px;
    }

    .adm-card {
      padding: 26px 28px;
    }
  }

  /* ── Tablet (768px+) ── */
  @media (min-width: 768px) {
    .adm-root {
      padding: 0 28px 48px 28px;
    }

    .adm-toprow {
      padding: 32px 4px 18px 4px;
    }

    .adm-logout {
      padding: 9px 20px;
      font-size: 0.82rem;
    }

    .adm-tabs {
      padding: 0 8px;
      gap: 4px;
    }

    .adm-tab {
      padding: 10px 16px;
      font-size: 0.8rem;
      gap: 5px;
    }

    .adm-card {
      padding: 28px 32px;
    }

    .adm-stat-card {
      padding: 16px 20px 12px;
    }

    .adm-stat-value {
      font-size: 1.8rem;
    }

    .adm-dash-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .adm-charts-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .adm-chart-title {
      font-size: 0.75rem;
    }
  }

  /* ── Desktop (1024px+) ── */
  @media (min-width: 1024px) {
    .adm-root {
      padding: 0 32px 48px 32px;
    }

    .adm-toprow {
      padding: 36px 4px 20px 4px;
    }

    .adm-logout {
      padding: 10px 22px;
      font-size: 0.82rem;
    }

    .adm-tabs {
      padding: 0 8px;
      gap: 6px;
      overflow-x: visible;
      flex-wrap: nowrap;
    }

    .adm-tab {
      padding: 11px 20px;
      font-size: 0.85rem;
      gap: 6px;
      flex-shrink: 1;
    }

    .adm-card {
      padding: 32px 36px;
    }

    .adm-stat-card {
      padding: 18px 20px 14px;
    }

    .adm-stat-label {
      font-size: 0.75rem;
    }

    .adm-stat-value {
      font-size: 2rem;
    }

    .adm-dash-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .adm-charts-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    }

    .adm-chart-title {
      font-size: 0.78rem;
    }
  }

  /* ── Extra Large (1400px+) ── */
  @media (min-width: 1400px) {
    .adm-root {
      padding: 0 40px 48px 40px;
    }

    .adm-tabs {
      padding: 0 12px;
      gap: 8px;
    }

    .adm-tab {
      padding: 12px 24px;
      font-size: 0.9rem;
    }

    .adm-card {
      padding: 36px 40px;
    }

    .adm-charts-grid {
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    }
  }
`;

const injectStyles = () => {
  const id = 'adm-styles-v1';
  if (!document.getElementById(id)) {
    const tag = document.createElement('style');
    tag.id = id; tag.textContent = ADM_STYLES;
    document.head.appendChild(tag);
  }
};

/* ─── Tab config ──────────────────────────────────────────── */
const TABS = [
  { key: 'inicio',    label: 'Inicio'     },
  { key: 'personal',  label: 'Personal'   },
  { key: 'gastos',    label: 'Gastos'     },
  { key: 'cuadre',    label: 'Cuadre'     },
  { key: 'clientes',  label: 'Clientes'   },
  { key: 'proyecto',  label: 'Proyecto'   },
  { key: 'dashboard', label: '📊 Dashboard' },
];

/* ─── Component ───────────────────────────────────────────── */
const Administracion = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');
  const [toast, setToast] = useState(null);
  const [charts, setCharts] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  // Guard de sesión
  useEffect(() => {
    if (!localStorage.getItem('personalToken')) {
      navigate('/personal', { replace: true });
    }
  }, [navigate]);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (activeTab !== 'inicio') return;
    setChartsLoading(true);
    
    // Fetch matplotlib charts
    fetch('/api/charts/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success && data?.charts) {
          setCharts(data.charts);
        }
      })
      .catch(() => setCharts(null))
      .finally(() => setChartsLoading(false));
  }, [activeTab]);

  const handleLogout = useCallback(() => {
    ['personalToken', 'auth_token', 'cliente_id', 'cliente_correo'].forEach(k =>
      localStorage.removeItem(k)
    );
    const STAFF_PATHS = new Set(['/almacen', '/administracion', '/obras', '/operaciones', '/personal']);
    try {
      const raw = localStorage.getItem('breadcrumb_history');
      const history = raw ? JSON.parse(raw) : [];
      const cleaned = history.filter(b => !STAFF_PATHS.has(b.path));
      localStorage.setItem('breadcrumb_history', JSON.stringify(cleaned));
    } catch (_) {}
    navigate('/personal', { replace: true });
  }, [navigate]);

  return (
    <div className="adm-root">
      <BrandToast toast={toast} onClose={() => setToast(null)} />

      {/* ── Top row: logout | (space) | pdf ── */}
      <div className="adm-toprow">
        <button
          className="adm-logout"
          onClick={handleLogout}
        >
          <IconLogout size={16} stroke={1.5} />
          Salir
        </button>


      </div>

      {/* ── Tabs + card ── */}
      <div>
        {/* Tab strip */}
        <div className="adm-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`adm-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div className="adm-card" key={activeTab}>

          {/* ── INICIO dashboard ── */}
          {activeTab === 'inicio' && (
            <>
              {/* Charts */}
              {chartsLoading ? (
                <div style={{ color: '#4a90b8', fontSize: '0.9rem', marginTop: '20px' }}>Cargando gráficos…</div>
                ) : charts ? (
                  <div className="adm-charts-grid" style={{ marginTop: '20px' }}>
                    {charts.summary_bars && (
                      <div className="adm-chart-card">
                        <div className="adm-chart-title">Resumen General</div>
                        <img src={charts.summary_bars} alt="Resumen de datos" style={{ width: '100%', height: 'auto' }} />
                      </div>
                    )}
                    {charts.products_by_cat && (
                      <div className="adm-chart-card">
                        <div className="adm-chart-title">Productos por Categoría</div>
                        <img src={charts.products_by_cat} alt="Productos" style={{ width: '100%', height: 'auto' }} />
                      </div>
                    )}
                    {charts.clients_chart && (
                      <div className="adm-chart-card">
                        <div className="adm-chart-title">Clientes</div>
                        <img src={charts.clients_chart} alt="Clientes" style={{ width: '100%', height: 'auto' }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '20px' }}>No se pudieron cargar los gráficos</div>
                )}
            </>
          )}

          {activeTab === 'proyecto'  && <Proyecto  onToast={showToast} />}
          {activeTab === 'personal'  && <Personal  />}
          {activeTab === 'gastos'    && <Gastos    onToast={showToast} />}
          {activeTab === 'cuadre'    && <Cuadre    onToast={showToast} />}
          {activeTab === 'clientes'  && <Cliente   onToast={showToast} />}
          {activeTab === 'dashboard' && <DashboardETL />}
        </div>
      </div>
    </div>
  );
};

export default Administracion;