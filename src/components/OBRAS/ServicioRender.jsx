/**
 * Componente ServicioRender
 * Muestra una visualización isométrica/3D del servicio seleccionado
 * (Ventana, Puerta, Mampara, Espejo, Vitrina)
 */
import React, { useMemo } from 'react';
import { COLORS, FONTS } from '../../colors';

// Utilidades para proyección isométrica
const ISO = {
  // Proyecta coordenadas 3D (x, y, z) a 2D isométrico
  project(wx, wy, wz = 0) {
    return {
      x: (wx - wy) * 0.866, // cos(30°)
      y: (wx + wy) * 0.5 - wz // sin(30°)
    };
  },
  // Convierte array de puntos a string para polygon SVG
  face(pts) {
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  }
};

/**
 * Render de Ventana (corredera 2-3 hojas)
 */
const VentanaRender = ({ ancho = 150, alto = 120, hojas = 2 }) => {
  const viewBox = useMemo(() => {
    const padding = 20;
    const minX = -ancho * 0.866 - padding;
    const maxX = ancho * 0.866 + padding;
    const minY = -alto - padding;
    const maxY = alto * 0.5 + padding;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [ancho, alto]);

  // Puntos del marco
  const p1 = ISO.project(0, 0, 0);
  const p2 = ISO.project(ancho, 0, 0);
  const p3 = ISO.project(ancho, 0, alto);
  const p4 = ISO.project(0, 0, alto);

  const profundidad = 8;
  const p5 = ISO.project(0, profundidad, 0);
  const p6 = ISO.project(ancho, profundidad, 0);
  const p7 = ISO.project(ancho, profundidad, alto);
  const p8 = ISO.project(0, profundidad, alto);

  // Calcular posiciones de hojas
  const anchoHoja = ancho / hojas;
  const hojasPaths = [];

  for (let i = 0; i < hojas; i++) {
    const xInicio = i * anchoHoja;
    const hoja1 = ISO.project(xInicio + 2, 2, 2);
    const hoja2 = ISO.project(xInicio + anchoHoja - 2, 2, 2);
    const hoja3 = ISO.project(xInicio + anchoHoja - 2, 2, alto - 2);
    const hoja4 = ISO.project(xInicio + 2, 2, alto - 2);

    hojasPaths.push({
      face: ISO.face([hoja1, hoja2, hoja3, hoja4]),
      manija: ISO.project(xInicio + anchoHoja - 10, 2, alto / 2)
    });
  }

  return (
    <svg viewBox={viewBox} style={{ width: '100%', height: '100%', maxHeight: '400px' }}>
      {/* Marco exterior - frente */}
      <polygon
        points={ISO.face([p1, p2, p3, p4])}
        fill="#8899aa"
        stroke="#556677"
        strokeWidth="2"
        opacity="0.95"
      />

      {/* Marco exterior - profundidad */}
      <polygon
        points={ISO.face([p2, p6, p7, p3])}
        fill="#6a7a8a"
        stroke="#556677"
        strokeWidth="1"
        opacity="0.9"
      />

      {/* Hojas de vidrio */}
      {hojasPaths.map((hoja, idx) => (
        <g key={idx}>
          <polygon
            points={hoja.face}
            fill="rgba(180, 220, 255, 0.4)"
            stroke="#4a9eff"
            strokeWidth="2"
          />
          {/* Reflejo en vidrio */}
          <polygon
            points={hoja.face}
            fill="url(#vidrio-gradient)"
            opacity="0.3"
          />
          {/* Manija */}
          <circle
            cx={hoja.manija.x}
            cy={hoja.manija.y}
            r="3"
            fill="#333"
          />
        </g>
      ))}

      {/* Rieles */}
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="#556677"
        strokeWidth="3"
      />
      <line
        x1={p4.x}
        y1={p4.y}
        x2={p3.x}
        y2={p3.y}
        stroke="#556677"
        strokeWidth="3"
      />

      {/* Gradiente para reflejo de vidrio */}
      <defs>
        <linearGradient id="vidrio-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Dimensiones */}
      <text
        x={p2.x + 10}
        y={p2.y + 15}
        fill="#333"
        fontSize="12"
        fontFamily={FONTS.mono}
        fontWeight="600"
      >
        {ancho} cm
      </text>
      <text
        x={p3.x + 10}
        y={(p2.y + p3.y) / 2}
        fill="#333"
        fontSize="12"
        fontFamily={FONTS.mono}
        fontWeight="600"
      >
        {alto} cm
      </text>
    </svg>
  );
};

/**
 * Render de Puerta
 */
const PuertaRender = ({ ancho = 90, alto = 200 }) => {
  const viewBox = useMemo(() => {
    const padding = 20;
    const minX = -ancho * 0.866 - padding;
    const maxX = ancho * 0.866 + padding;
    const minY = -alto - padding;
    const maxY = alto * 0.5 + padding;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [ancho, alto]);

  // Marco
  const marcoEspesor = 5;
  const p1 = ISO.project(0, 0, 0);
  const p2 = ISO.project(ancho, 0, 0);
  const p3 = ISO.project(ancho, 0, alto);
  const p4 = ISO.project(0, 0, alto);

  // Hoja de vidrio
  const hoja1 = ISO.project(marcoEspesor, 2, marcoEspesor);
  const hoja2 = ISO.project(ancho - marcoEspesor, 2, marcoEspesor);
  const hoja3 = ISO.project(ancho - marcoEspesor, 2, alto - marcoEspesor);
  const hoja4 = ISO.project(marcoEspesor, 2, alto - marcoEspesor);

  // Tirador
  const tirador = ISO.project(ancho - 15, 2, alto / 2);

  // Bisagras
  const bisagra1 = ISO.project(5, 2, 20);
  const bisagra2 = ISO.project(5, 2, alto - 20);

  return (
    <svg viewBox={viewBox} style={{ width: '100%', height: '100%', maxHeight: '400px' }}>
      {/* Marco */}
      <polygon
        points={ISO.face([p1, p2, p3, p4])}
        fill="#8899aa"
        stroke="#556677"
        strokeWidth="3"
        opacity="0.95"
      />

      {/* Hoja de vidrio */}
      <polygon
        points={ISO.face([hoja1, hoja2, hoja3, hoja4])}
        fill="rgba(180, 220, 255, 0.35)"
        stroke="#4a9eff"
        strokeWidth="2"
      />

      {/* Reflejo diagonal */}
      <line
        x1={hoja1.x}
        y1={hoja1.y}
        x2={hoja3.x}
        y2={hoja3.y}
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1"
      />

      {/* Bisagras */}
      <circle cx={bisagra1.x} cy={bisagra1.y} r="3" fill="#333" />
      <circle cx={bisagra2.x} cy={bisagra2.y} r="3" fill="#333" />

      {/* Tirador */}
      <rect
        x={tirador.x - 2}
        y={tirador.y - 8}
        width="4"
        height="16"
        fill="#333"
        rx="2"
      />

      {/* Arco de apertura punteado */}
      <path
        d={`M ${hoja2.x} ${hoja2.y} A ${ancho} ${ancho} 0 0 1 ${hoja3.x} ${hoja3.y}`}
        stroke="#999"
        strokeWidth="1"
        strokeDasharray="3,3"
        fill="none"
      />

      {/* Dimensiones */}
      <text
        x={p2.x + 10}
        y={p2.y + 15}
        fill="#333"
        fontSize="12"
        fontFamily={FONTS.mono}
        fontWeight="600"
      >
        {ancho} cm
      </text>
      <text
        x={p3.x + 10}
        y={(p2.y + p3.y) / 2}
        fill="#333"
        fontSize="12"
        fontFamily={FONTS.mono}
        fontWeight="600"
      >
        {alto} cm
      </text>
    </svg>
  );
};

/**
 * Render de Mampara de Ducha
 */
const MamparaRender = ({ ancho = 100, alto = 180 }) => {
  const viewBox = useMemo(() => {
    const padding = 20;
    const minX = -ancho * 0.866 - padding;
    const maxX = ancho * 0.866 + padding;
    const minY = -alto - padding;
    const maxY = alto * 0.5 + padding;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [ancho, alto]);

  const panelAncho = ancho / 2;

  // Panel fijo
  const pf1 = ISO.project(0, 0, 0);
  const pf2 = ISO.project(panelAncho, 0, 0);
  const pf3 = ISO.project(panelAncho, 0, alto);
  const pf4 = ISO.project(0, 0, alto);

  // Panel móvil
  const pm1 = ISO.project(panelAncho, 0, 0);
  const pm2 = ISO.project(ancho, 0, 0);
  const pm3 = ISO.project(ancho, 0, alto);
  const pm4 = ISO.project(panelAncho, 0, alto);

  // Perfil central
  const perf1 = ISO.project(panelAncho - 2, 0, 0);
  const perf2 = ISO.project(panelAncho + 2, 0, 0);
  const perf3 = ISO.project(panelAncho + 2, 0, alto);
  const perf4 = ISO.project(panelAncho - 2, 0, alto);

  return (
    <svg viewBox={viewBox} style={{ width: '100%', height: '100%', maxHeight: '400px' }}>
      {/* Panel fijo */}
      <polygon
        points={ISO.face([pf1, pf2, pf3, pf4])}
        fill="rgba(180, 220, 255, 0.3)"
        stroke="#4a9eff"
        strokeWidth="2"
      />

      {/* Panel móvil */}
      <polygon
        points={ISO.face([pm1, pm2, pm3, pm4])}
        fill="rgba(180, 220, 255, 0.3)"
        stroke="#4a9eff"
        strokeWidth="2"
      />

      {/* Perfil central */}
      <polygon
        points={ISO.face([perf1, perf2, perf3, perf4])}
        fill="#8899aa"
        stroke="#556677"
        strokeWidth="1"
      />

      {/* Track de suelo */}
      <line
        x1={pf1.x}
        y1={pf1.y}
        x2={pm2.x}
        y2={pm2.y}
        stroke="#556677"
        strokeWidth="4"
      />

      {/* Gotas de agua */}
      <circle cx={pm1.x + 10} cy={pm1.y + 30} r="2" fill="rgba(100, 150, 200, 0.6)" />
      <circle cx={pm1.x + 15} cy={pm1.y + 50} r="1.5" fill="rgba(100, 150, 200, 0.6)" />
      <circle cx={pm1.x + 5} cy={pm1.y + 70} r="2.5" fill="rgba(100, 150, 200, 0.6)" />

      {/* Dimensiones */}
      <text
        x={pm2.x + 10}
        y={pm2.y + 15}
        fill="#333"
        fontSize="12"
        fontFamily={FONTS.mono}
        fontWeight="600"
      >
        {ancho} cm
      </text>
      <text
        x={pm3.x + 10}
        y={(pm2.y + pm3.y) / 2}
        fill="#333"
        fontSize="12"
        fontFamily={FONTS.mono}
        fontWeight="600"
      >
        {alto} cm
      </text>
    </svg>
  );
};

/**
 * Componente principal ServicioRender
 */
const ServicioRender = ({ servicio, ancho = 150, alto = 120, configuracion = {} }) => {
  const tipoServicio = servicio?.tipo || servicio?.nombre || 'ventana';

  const renderServicio = () => {
    const tipo = tipoServicio.toLowerCase();

    if (tipo.includes('ventana')) {
      return <VentanaRender ancho={ancho} alto={alto} hojas={configuracion.hojas || 2} />;
    } else if (tipo.includes('puerta')) {
      return <PuertaRender ancho={ancho} alto={alto} />;
    } else if (tipo.includes('mampara')) {
      return <MamparaRender ancho={ancho} alto={alto} />;
    } else {
      // Default: ventana
      return <VentanaRender ancho={ancho} alto={alto} hojas={2} />;
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #f0f8ff 0%, #e8f4f8 100%)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(128, 194, 220, 0.3)',
      boxShadow: '0 4px 16px rgba(90, 139, 168, 0.12)'
    }}>
      <div style={{
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontFamily: FONTS.heading,
          fontSize: '18px',
          fontWeight: '700',
          color: COLORS.text,
          margin: '0 0 8px 0'
        }}>
          Vista del Servicio
        </h3>
        <p style={{
          fontFamily: FONTS.body,
          fontSize: '13px',
          color: COLORS.textLight,
          margin: 0
        }}>
          {tipoServicio} • {ancho} × {alto} cm
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {renderServicio()}
      </div>

      {configuracion.descripcion && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '8px',
          fontSize: '12px',
          color: COLORS.textMid,
          fontFamily: FONTS.body
        }}>
          {configuracion.descripcion}
        </div>
      )}
    </div>
  );
};

export default ServicioRender;
