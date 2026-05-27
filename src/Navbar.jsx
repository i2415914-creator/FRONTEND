import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { COLORS, FONTS } from './colors';
import { IconUser, IconShoppingCart, IconList, IconSearch, IconX } from '@tabler/icons-react';
import MenuDesplegable from './MenuDesplegable';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { useCartStore } from './stores/cartStore';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.items.length);

  return (
    <>
      <nav
        className="w-full fixed top-0 left-0 z-50 shadow overflow-x-hidden"
        style={{ background: COLORS.primary }}
      >
        {/* Fila principal */}
        <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          {/* Logo como enlace a Inicio */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/">
              <img
                src="/LOGO.svg"
                alt="Vidriobras Logo"
                className="h-10 w-auto sm:h-14 lg:h-16 object-contain rounded cursor-pointer"
                style={{ background: 'transparent', padding: 0 }}
              />
            </Link>
          </div>

          {/* Breadcrumb Navigation - Centrado en el navbar, oculto en pantallas pequeñas */}
          {location.pathname !== '/' && (
            <div className="hidden md:flex justify-center flex-grow">
              <BreadcrumbNavigation />
            </div>
          )}

          {/* Iconos y buscador */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-shrink-0">
            {/* Botón Usuario */}
            <button
              className="rounded-full p-1.5 sm:p-2 lg:p-2.5 transition hover:brightness-110"
              style={{ color: COLORS.primary, background: COLORS.light }}
              onClick={() => {
                try {
                  const t = localStorage.getItem('auth_token');
                  if (t) {
                    const parts = t.split('.');
                    if (parts.length === 3) {
                      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                      if (!payload.exp || (payload.exp * 1000) > Date.now()) {
                        navigate('/user');
                        return;
                      }
                    }
                  }
                } catch {}
                navigate('/login');
              }}
              aria-label="Usuario"
            >
              <IconUser stroke={2.5} size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>

            {/* Botón Carrito */}
            <button
              className="rounded-full p-1.5 sm:p-2 lg:p-2.5 transition hover:brightness-110"
              style={{ color: COLORS.primary, background: COLORS.light, position: 'relative' }}
              onClick={() => navigate('/carrito')}
              aria-label="Carrito de compras"
            >
              <IconShoppingCart stroke={2.5} size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#941918', color: '#fff',
                  borderRadius: '50%', fontSize: 10, fontWeight: 700,
                  minWidth: 17, height: 17, lineHeight: '17px',
                  textAlign: 'center', padding: '0 3px',
                  pointerEvents: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Buscador DESKTOP - visible solo en sm en adelante */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Buscar..."
                className="font-body w-48 md:w-56 lg:w-72 px-4 py-2 lg:py-2.5 rounded-full focus:outline-none text-sm transition"
                style={{ background: COLORS.light, color: COLORS.text }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.secondary }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </span>
            </div>

            {/* Botón Buscar MÓVIL - solo visible en xs */}
            <button
              className="sm:hidden rounded-full p-1.5 transition hover:brightness-110"
              style={{ color: COLORS.primary, background: COLORS.light }}
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Buscar"
            >
              {searchOpen
                ? <IconX stroke={2.5} size={18} />
                : <IconSearch stroke={2.5} size={18} />
              }
            </button>

            {/* Botón Menú Desplegable */}
            <button
              className="rounded-lg p-1.5 sm:p-2 lg:p-2.5 transition hover:brightness-110"
              style={{ background: COLORS.accent, color: COLORS.primary }}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <IconList stroke={2} size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </div>

        {/* Buscador expandido en MÓVIL - segunda fila */}
        {searchOpen && (
          <div className="sm:hidden px-3 pb-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                autoFocus
                className="font-body w-full px-4 py-2 rounded-full focus:outline-none text-sm"
                style={{ background: COLORS.light, color: COLORS.text }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.secondary }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </span>
            </div>
          </div>
        )}
      </nav>

      <MenuDesplegable open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export default Navbar;