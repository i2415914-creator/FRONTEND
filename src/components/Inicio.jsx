import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const DEFAULT_SERVICE_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='42'>VIDRIOBRAS</text></svg>";

// ─── Botón Neon solo bordes superior e inferior ──────────────────────────────
const NeonButton = ({ onClick, children }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        position: 'relative',
        padding: '12px 44px',
        cursor: 'pointer',
        userSelect: 'none',
        color: hovered ? '#fff' : '#80C2DC',
        fontSize: '0.95rem',
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        transition: 'color 0.3s ease',
      }}
    >
      {/* Borde superior — se expande desde el centro hacia los lados */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: hovered ? '100%' : '0%',
        height: '1.5px',
        background: '#80C2DC',
        boxShadow: hovered
          ? '0 -5px 14px 0 rgba(128,194,220,0.9), 0 -1px 6px 0 rgba(128,194,220,0.7)'
          : '0 -3px 8px 0 rgba(128,194,220,0.4)',
        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease',
      }} />

      {/* Borde inferior — se expande desde el centro hacia los lados */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: hovered ? '100%' : '0%',
        height: '1.5px',
        background: '#80C2DC',
        boxShadow: hovered
          ? '0 5px 14px 0 rgba(128,194,220,0.9), 0 1px 6px 0 rgba(128,194,220,0.7)'
          : '0 3px 8px 0 rgba(128,194,220,0.4)',
        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease',
      }} />

      {children}
    </div>
  );
};

// ─── Tarjeta Misión / Visión ────────────────────────────────────────────────
const InfoCard = ({ titulo, texto, color, delay, rotate }) => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 340px', maxWidth: 480, background: '#fff',
        borderRadius: '24px', padding: '36px 32px', border: 'none', cursor: 'default',
        boxShadow: hovered
          ? `0 20px 60px 0 ${color}99, 0 4px 20px rgba(0,0,0,0.10)`
          : `0 8px 40px 0 ${color}55, 0 2px 12px rgba(0,0,0,0.06)`,
        opacity: visible ? 1 : 0,
        transform: !visible ? 'translateY(40px)' : hovered ? 'rotate(0deg) scale(1.03)' : `rotate(${rotate})`,
        transition: `opacity 0.7s ease ${delay}ms, transform 0.3s ease, box-shadow 0.3s ease`,
        zIndex: hovered ? 10 : 1, position: 'relative',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase' }}>NUESTRA</p>
      <h3 style={{ margin: '6px 0 20px', fontSize: '1.7rem', fontWeight: 800, color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{titulo}</h3>
      <p style={{ margin: 0, color: '#444', lineHeight: 1.8, fontSize: '0.97rem' }}>{texto}</p>
    </div>
  );
};

const MisionVision = () => (
  <div className="w-full px-8 py-20" style={{ background: '#f9f9f9' }}>
    <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
      <InfoCard titulo="Visión de Empresa" texto="Expandirnos a nivel regional y consolidarnos como líderes en instalación y distribución de vidrio y aluminio, brindando soluciones innovadoras y de alta calidad a cada cliente." color="#941918" delay={0} rotate="-1.5deg" />
      <InfoCard titulo="Misión de Empresa" texto="Realizar instalaciones con materiales de alta calidad, garantizando seguridad, durabilidad y satisfacción total del cliente en cada proyecto que emprendemos." color="#80C2DC" delay={150} rotate="1.5deg" />
    </div>
  </div>
);

// ─── Carrusel Equipo ─────────────────────────────────────────────────────────
const teamData = [
  { nombre: 'Carlos Mendoza',  cargo: 'Instalador Principal',  desc: 'Especialista en ventanas y mamparas con más de 10 años de experiencia en el rubro.' },
  { nombre: 'Ana Quispe',      cargo: 'Gerente de Ventas',     desc: 'Responsable de atención al cliente, cotizaciones y cierre de contratos comerciales.' },
  { nombre: 'Luis Herrera',    cargo: 'Técnico de Aluminio',   desc: 'Experto en estructuras de aluminio, perfiles y acabados de alta precisión.' },
  { nombre: 'María Torres',    cargo: 'Jefa de Almacén',       desc: 'Controla el inventario y la distribución de materiales para cada proyecto.' },
  { nombre: 'Jorge Palomino',  cargo: 'Instalador de Vidrio',  desc: 'Manejo de vidrios templados, laminados y de seguridad para todo tipo de obra.' },
];

// Dimensiones fijas
const SIDE_W    = 400;  // ancho tarjeta lateral
const CENTER_W  = 500;  // ancho tarjeta central
const SIDE_H    = 260;  // alto tarjeta lateral
const CENTER_H  = 320;  // alto tarjeta central
const AVATAR_D  = 110;  // diámetro círculo lateral
const AVATAR_DC = 130;  // diámetro círculo central
const GAP       = 24;   // espacio entre tarjetas

// Ancho visible = tarjeta izq + gap + centro + gap + tarjeta der
const VIEWPORT_W = SIDE_W + GAP + CENTER_W + GAP + SIDE_W;

const TeamCard = ({ item, isCenter, sideW, centerW, sideH, centerH, avD, avDC, fontSize }) => {
  const color   = isCenter ? '#941918' : '#80C2DC';
  const cardW   = isCenter ? centerW : sideW;
  const cardH   = isCenter ? centerH : sideH;
  const avatarDiameter = isCenter ? avDC : avD;
  // Mitad del círculo sobresale por encima del rectángulo
  const topSpace = avatarDiameter / 2;

  return (
    <div style={{
      width: cardW,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: topSpace,     // espacio completo para el círculo (no lo tapa)
      position: 'relative',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* Círculo: sin relleno, borde grueso de color, completamente ENCIMA del rectángulo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: avatarDiameter,
        height: avatarDiameter,
        borderRadius: '50%',
        background: 'rgba(15,15,30,0.92)',   // fondo oscuro
        border: `5px solid ${color}`,         // borde grueso de color
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${fontSize}px`,
        color: color,
        fontWeight: 800,
        zIndex: 3,                            // encima del rectángulo siempre
      }}>
        {item.nombre.charAt(0)}
      </div>

      {/* Rectángulo con color sólido — empieza DEBAJO del círculo completo */}
      <div style={{
        width: '100%',
        height: cardH,
        background: color,
        borderRadius: '20px',
        padding: `${avatarDiameter / 2 + 14}px 22px 24px`,  // espacio para la mitad del círculo
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: isCenter
          ? '0 20px 56px rgba(148,25,24,0.5)'
          : '0 8px 28px rgba(128,194,220,0.35)',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <p style={{
          margin: '0 0 4px',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
        }}>
          {item.cargo}
        </p>
        <h3 style={{
          margin: '0 0 10px',
          color: '#fff',
          fontSize: isCenter ? '1.05rem' : '0.9rem',
          fontWeight: 800,
          lineHeight: 1.3,
        }}>
          {item.nombre}
        </h3>
        <p style={{
          margin: 0,
          color: 'rgba(255,255,255,0.82)',
          fontSize: '0.74rem',
          lineHeight: 1.6,
        }}>
          {item.desc}
        </p>
      </div>
    </div>
  );
};

const TeamCarousel = () => {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const total = teamData.length;

  // Responsivo
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const SIDE_W = windowWidth < 768 ? 180 : 400;
  const CENTER_W = windowWidth < 768 ? 240 : 500;
  const SIDE_H = windowWidth < 768 ? 120 : 260;
  const CENTER_H = windowWidth < 768 ? 160 : 320;
  const AVATAR_D = windowWidth < 768 ? 50 : 110;
  const AVATAR_DC = windowWidth < 768 ? 60 : 130;
  const CENTER_FONT_SIZE = windowWidth < 768 ? 24 : 32;
  const SIDE_FONT_SIZE = windowWidth < 768 ? 19 : 26;
  const GAP = windowWidth < 768 ? 12 : 24;
  const offsets = windowWidth < 1024 ? [0] : [-2, -1, 0, 1, 2];
  const VIEWPORT_W = windowWidth < 1024 ? CENTER_W : SIDE_W + GAP + CENTER_W + GAP + SIDE_W;

  // Auto-avanza cada 3s con fade entre tarjetas
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActive(prev => (prev + 1) % total);
        setFading(false);
      }, 280);
    }, 3200);
    return () => clearInterval(id);
  }, [total]);

  // Calcula el translateX para que el activo quede centrado en el viewport
  // Posición X de inicio de cada tarjeta (izq, centro tiene ancho distinto)
  // Todos los índices son tratados como SIDE_W excepto el activo (CENTER_W)
  // Para simplificar: todos los cards en el track tienen siempre su ancho real
  // Track: ...SIDE SIDE CENTER SIDE SIDE...  según posición relativa al activo

  // Construimos el orden circular: activo en índice 2 (el del medio de 5 visibles)
  // Mostramos: [active-2, active-1, active, active+1, active+2]
  const getIdx = (offset) => (active + offset + total) % total;

  // Posición X del centro del viewport donde queremos el card activo
  // viewport = VIEWPORT_W, centro = VIEWPORT_W / 2
  // El track tiene: SIDE + GAP + SIDE + GAP + CENTER + GAP + SIDE + GAP + SIDE
  // El activo (CENTER) empieza en: SIDE + GAP + SIDE + GAP = 2*(SIDE_W + GAP)
  // Centro del activo = 2*(SIDE_W+GAP) + CENTER_W/2
  // Para centrarlo en el viewport: translateX = VIEWPORT_W/2 - (2*(SIDE_W+GAP) + CENTER_W/2)
  const offsetX = windowWidth < 1024 ? 0 : (VIEWPORT_W / 2) - (2 * (SIDE_W + GAP) + CENTER_W / 2);

  return (
    <div
      className="w-full py-20"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(15,15,30,0.92)',
      }}
    >

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Viewport centrado */}
        <div style={{
          width: VIEWPORT_W,
          margin: '0 auto',
          overflow: 'hidden',
          paddingTop: AVATAR_DC / 2 + 8,  // espacio para la mitad del círculo central
        }}>
          {/* Track deslizante — 5 tarjetas visibles (activo en centro) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: GAP,
            transform: `translateX(${offsetX}px)`,
            transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease',
            opacity: fading ? 0.35 : 1,
            willChange: 'transform',
          }}>
            {offsets.map((offset) => {
              const idx      = getIdx(offset);
              const isCenter = offset === 0;
              return (
                <TeamCard
                  key={`${active}-${offset}`}
                  item={teamData[idx]}
                  isCenter={isCenter}
                  sideW={SIDE_W}
                  centerW={CENTER_W}
                  sideH={SIDE_H}
                  centerH={CENTER_H}
                  avD={AVATAR_D}
                  avDC={AVATAR_DC}
                  fontSize={isCenter ? CENTER_FONT_SIZE : SIDE_FONT_SIZE}
                />
              );
            })}
          </div>
        </div>

        {/* Dots indicadores */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {teamData.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === active ? 28 : 10,
                height: 10,
                borderRadius: 5,
                background: i === active ? '#941918' : '#80C2DC',
                opacity: i === active ? 1 : 0.45,
                transition: 'all 0.4s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ───────────────────────────────────────────────────
function Inicio() {
  const [servicios, setServicios] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/servicios/random')
      .then(res => res.json())
      .then(data => { if (data.success) setServicios(data.data); });
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const areas = [
    { nombre: 'Área de Almacén', desc: 'Gestiona la recepción, almacenamiento y control del inventario de materiales para garantizar disponibilidad en cada proyecto.' },
    { nombre: 'Área de Ventas',  desc: 'Encargada de la atención al cliente, facturación, cotizaciones y registro de productos y servicios.' },
  ];

  const [areasVisible, setAreasVisible] = useState(false);
  const areasRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (areasRef.current) {
        const rect = areasRef.current.getBoundingClientRect();
        setAreasVisible(rect.top < window.innerHeight - 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const CardContent = ({ serv }) => (
    <>
      <img
        src={serv?.imagen_public_url || DEFAULT_SERVICE_IMAGE}
        alt={serv?.nombre}
        onError={(e) => {
          e.currentTarget.src = DEFAULT_SERVICE_IMAGE;
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px', zIndex: 2 }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700, textShadow: '1px 2px 6px rgba(0,0,0,0.9)' }}>{serv?.nombre}</h3>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', textShadow: '1px 1px 4px rgba(0,0,0,0.9)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{serv?.descripcion}</p>
      </div>
    </>
  );

  const Card = ({ serv, rotate, height }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div style={{ height, position: 'relative', zIndex: hovered ? 10 : 1 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', width: '100%', height: '100%', boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.38)' : '0 8px 32px rgba(0,0,0,0.22)', transform: hovered ? 'rotate(0deg) scale(1.03)' : `rotate(${rotate})`, transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
          <CardContent serv={serv} />
        </div>
      </div>
    );
  };

  const s = servicios;

  const gridColumns = windowWidth < 768 ? '1fr' : windowWidth < 1024 ? '1fr 1fr' : '1fr 1.3fr 1fr';
  const cardHeight = windowWidth < 768 ? 200 : 220;
  const centerHeight = windowWidth < 768 ? 400 : 456;

  return (
    <section className="w-full flex flex-col items-center" style={{ marginTop: 0, paddingTop: 0 }}>

      {/* HERO */}
      <div className="w-full flex relative items-center justify-start" style={{ minHeight: '100vh', height: '100vh', background: 'linear-gradient(135deg, #80C2DC 0%, #FFFFFF 40%, #FFFFFF 60%, #941918 120%)', marginTop: 0, paddingTop: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: '100%', minHeight: '100vh', height: '100vh', backgroundImage: 'url(/tienda%20anime.png)', backgroundSize: 'cover', backgroundPosition: 'top', filter: 'brightness(0.92)', opacity: 0.32, position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
        <img src="/R.png" alt="Logo R" className="absolute w-[300px] md:w-[500px] lg:w-[700px] opacity-60 z-10" style={{ top: '55%', right: '0%', transform: 'translateY(-50%)', minWidth: 300, maxWidth: 800, WebkitImageRendering: 'crisp-edges', imageRendering: 'crisp-edges' }} />
        <div className="absolute left-4 md:left-16 top-1/2 transform -translate-y-1/2 text-left z-20 max-w-sm md:max-w-md lg:max-w-lg bg-black bg-opacity-30 rounded-xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">Vidrio perfecto,<br />instalación que inspira confianza.</h2>
          <div className="text-sm md:text-base lg:text-lg text-white font-normal leading-relaxed mt-2">
            <span className="block">Transformamos tus espacios con vidrio de alta calidad; Instalación precisa que garantiza elegancia, seguridad y durabilidad.</span>
          </div>
        </div>
      </div>

      {/* MISIÓN Y VISIÓN */}
      <MisionVision />

      {/* NUESTROS PROYECTOS */}
      <div className="w-full px-8 py-20 bg-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[#941918]">Nuestros Proyectos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '16px', maxWidth: '900px', margin: '0 auto', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card serv={s[0]} rotate="-2deg"  height={cardHeight} />
            <Card serv={s[3]} rotate="1.5deg" height={cardHeight} />
          </div>
          <Card serv={s[1]} rotate="0deg" height={centerHeight} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card serv={s[2]} rotate="2deg"    height={cardHeight} />
            <Card serv={s[4]} rotate="-1.5deg" height={cardHeight} />
          </div>
        </div>
        <div className="mt-12">
          <NeonButton onClick={() => navigate('/proyectos')}>Ver más</NeonButton>
        </div>
      </div>

      {/* CARRUSEL EQUIPO */}
      <TeamCarousel />



    </section>
  );
}

export default Inicio;