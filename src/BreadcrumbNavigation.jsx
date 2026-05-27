import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Rutas de personal que se acumulan en historial (excepto /personal que es solo un gateway)
const STAFF_DEST_PATHS = new Set(['/almacen', '/administracion', '/obras', '/operaciones']);

// Mapeo rutas → label (todo MAYÚSCULAS)
const routeLabels = {
  '/': 'INICIO',
  '/carrito': 'CARRITO',
  '/user': 'USUARIO',
  '/panelcliente': 'USUARIO',
  '/login': 'LOGIN',
  '/personal': 'PERSONAL',
  '/almacen': 'ALMACEN',
  '/administracion': 'ADMINISTRACION',
  '/obras': 'OBRAS',
  '/operaciones': 'OBRAS',
};

const normalizeBreadcrumbPath = (path) => {
  if (!path) return '/';
  if (path === '/panelcliente') return '/user';
  if (path === '/operaciones') return '/obras';
  return path;
};

const dedupeConsecutiveBreadcrumbs = (list) => {
  const result = [];
  (list || []).forEach((item) => {
    if (!item?.path) return;
    if (result.length && result[result.length - 1].path === item.path) return;
    result.push(item);
  });
  return result;
};

const isAuthTokenValid = () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || (payload.exp * 1000) > Date.now();
  } catch {
    return false;
  }
};

const isPersonalTokenValid = () => !!localStorage.getItem('personalToken');

function BreadcrumbNavigation() {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = normalizeBreadcrumbPath(location.pathname);
    const label = routeLabels[currentPath] || currentPath.replace('/', '').replace(/-/g, ' ').toUpperCase();
    const loggedIn = isAuthTokenValid();
    const hasPersonalToken = isPersonalTokenValid();

    // Cargar historial
    const stored = localStorage.getItem('breadcrumb_history');
    let history = stored ? JSON.parse(stored) : [];
    history = (history || []).map((b) => ({
      ...b,
      path: normalizeBreadcrumbPath(b.path),
      label: routeLabels[normalizeBreadcrumbPath(b.path)] || b.label.toUpperCase(),
    }));
    history = dedupeConsecutiveBreadcrumbs(history);

    // Siempre filtrar /personal del historial (es solo un gateway)
    history = history.filter(b => b.path !== '/personal');

    // Si no hay token de personal, filtrar rutas de staff del historial mostrado
    if (!hasPersonalToken) {
      history = history.filter(b => !STAFF_DEST_PATHS.has(b.path));
    }

    if (loggedIn) {
      history = history.filter(b => b.path !== '/login');
    } else {
      history = history.filter(b => b.path !== '/user');
    }

    // ── /personal: gateway, no se guarda en historial, se muestra como crumb final ──
    if (currentPath === '/personal') {
      const displayed = history.filter(b => b.path !== '/').slice(-3);
      displayed.push({ path: currentPath, label });
      setBreadcrumbs(displayed);
      return; // No modificar localStorage
    }

    // ── Rutas de staff de destino (/almacen, etc): acumulan con historial existente ──
    // ── Rutas de cliente: ídem ──

    if (!hasPersonalToken && STAFF_DEST_PATHS.has(currentPath)) {
      setBreadcrumbs([]);
      return;
    }

    if (loggedIn && currentPath === '/login') {
      setBreadcrumbs(history.filter(b => b.path !== '/').slice(-4));
      localStorage.setItem('breadcrumb_history', JSON.stringify(history));
      return;
    }

    if (history.length && history[history.length - 1].path === currentPath) {
      setBreadcrumbs(history.filter(b => b.path !== '/').slice(-4));
      localStorage.setItem('breadcrumb_history', JSON.stringify(history));
      return;
    }

    history = history.filter(b => b.path !== currentPath);
    history.push({ path: currentPath, label });

    const filtered = history.filter(b => b.path !== '/');
    if (filtered.length > 3) {
      const toRemove = filtered.length - 3;
      const removedPaths = filtered.slice(0, toRemove).map(r => r.path);
      history = history.filter(b => !removedPaths.includes(b.path));
    }

    localStorage.setItem('breadcrumb_history', JSON.stringify(history));
    setBreadcrumbs(history.filter(b => b.path !== '/').slice(-4));
  }, [location.pathname]);

  if (!breadcrumbs.length || breadcrumbs[breadcrumbs.length - 1].path === '/') {
    return null;
  }

  return (
    <nav aria-label="breadcrumb">
      <ol className="flex space-x-2">
        {breadcrumbs.map((crumb, idx) => (
          <li key={crumb.path}>
            <button
              className={`text-white font-body text-base px-2 py-1 rounded hover:bg-white/10 transition ${idx === breadcrumbs.length - 1 ? 'font-bold' : ''}`}
              onClick={() => {
                if (crumb.path === '/login' && isAuthTokenValid()) {
                  navigate('/user');
                  return;
                }
                navigate(crumb.path);
              }}
              disabled={idx === breadcrumbs.length - 1}
            >
              {crumb.label}
            </button>
            {idx < breadcrumbs.length - 1 && <span className="text-white">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default BreadcrumbNavigation;


