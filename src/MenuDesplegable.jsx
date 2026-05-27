import React from 'react';
import { Link } from 'react-router-dom';
import { IconTool, IconMapPin, IconBrandWhatsapp, IconBrandFacebook } from '@tabler/icons-react';
import { COLORS, FONTS } from './colors';

function MenuDesplegable({ open, onClose }) {
  const handleWordEnter = (e) => {
    e.currentTarget.style.color = COLORS.primary;
    e.currentTarget.style.transform = 'translateY(0) scale(1.08)';
    e.currentTarget.style.letterSpacing = '0.07em';
    e.currentTarget.style.filter = 'brightness(1.06)';
  };

  const handleWordLeave = (e, baseColor) => {
    e.currentTarget.style.color = baseColor;
    e.currentTarget.style.transform = open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(1)';
    e.currentTarget.style.letterSpacing = '0.02em';
    e.currentTarget.style.filter = 'brightness(1)';
  };

  const handleIconEnter = (e) => {
    e.currentTarget.style.color = COLORS.primary;
    e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
    e.currentTarget.style.filter = 'drop-shadow(0 6px 8px rgba(0,0,0,0.18))';
  };

  const handleIconLeave = (e, baseColor) => {
    e.currentTarget.style.color = baseColor;
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.filter = 'none';
  };

  return (
    <div
      className="fixed z-40 shadow-lg overflow-y-auto"
      style={{
        background: COLORS.accent,
        top: 'var(--navbar-height, 64px)',
        height: 'calc(100vh - var(--navbar-height, 64px))',
        right: 0,
        left: 'auto',
        width: '3.5rem',
        borderRadius: '0.5rem 0 0 0.5rem',
        maxWidth: '320px',
        minWidth: '95px',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
        transform: open ? 'translateX(0) scaleY(1)' : 'translateX(0) scaleY(0.02)',
        opacity: open ? 1 : 0,
        transition: 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
        transformOrigin: 'top right',
        willChange: 'transform, opacity',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div className="flex flex-col h-full justify-between">
        {/* Palabras menú */}
        <nav className="flex flex-col items-start mt-16 gap-4 pl-1 w-full">
          <Link to="/productos" className="font-heading text-[9px] sm:text-[10px] md:text-xs font-semibold transition whitespace-nowrap w-full text-left"
            style={{
              color: COLORS.black,
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'opacity 260ms ease 90ms, transform 360ms cubic-bezier(0.22, 1, 0.36, 1) 90ms, letter-spacing 220ms ease, filter 220ms ease',
              letterSpacing: '0.02em',
            }}
            onMouseOver={handleWordEnter}
            onMouseOut={e => handleWordLeave(e, COLORS.black)}
            onClick={onClose}
          >PRODUCTOS</Link>
          <Link to="/proyectos" className="font-heading text-[9px] sm:text-[10px] md:text-xs font-semibold transition whitespace-nowrap w-full text-left"
            style={{
              color: COLORS.black,
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'opacity 260ms ease 150ms, transform 360ms cubic-bezier(0.22, 1, 0.36, 1) 150ms, letter-spacing 220ms ease, filter 220ms ease',
              letterSpacing: '0.02em',
            }}
            onMouseOver={handleWordEnter}
            onMouseOut={e => handleWordLeave(e, COLORS.black)}
            onClick={onClose}
          >PROYECTOS</Link>
        </nav>
        {/* Iconos abajo */}
        <div className="flex flex-col items-center mb-8 gap-6 w-full">
          <Link to="/personal" className="transition flex justify-center w-full"
            style={{ color: COLORS.black, transition: 'transform 220ms ease, filter 220ms ease, color 180ms ease' }}
            onMouseOver={handleIconEnter}
            onMouseOut={e => handleIconLeave(e, COLORS.black)}
            onClick={onClose}
          >
            <IconTool size={28} stroke={1.25} color={COLORS.black} />
          </Link>
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="transition flex justify-center w-full"
            style={{ color: '#25D366', transition: 'transform 220ms ease, filter 220ms ease, color 180ms ease' }}
            onMouseOver={handleIconEnter}
            onMouseOut={e => handleIconLeave(e, '#25D366')}
          >
            <IconBrandWhatsapp size={28} stroke={1} color="#25D366" />
          </a>
          <a href="#ubicacion" className="transition flex justify-center w-full"
            style={{ color: COLORS.black, transition: 'transform 220ms ease, filter 220ms ease, color 180ms ease' }}
            onMouseOver={handleIconEnter}
            onMouseOut={e => handleIconLeave(e, COLORS.black)}
          >
            <IconMapPin size={28} stroke={1} color={COLORS.black} />
          </a>
          <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="transition flex justify-center w-full"
            style={{ color: '#1877F3', transition: 'transform 220ms ease, filter 220ms ease, color 180ms ease' }}
            onMouseOver={handleIconEnter}
            onMouseOut={e => handleIconLeave(e, '#1877F3')}
          >
            <IconBrandFacebook size={28} stroke={1} color="#1877F3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default MenuDesplegable;