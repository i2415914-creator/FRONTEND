import React, { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, FONTS } from '../colors';
import { buildApiUrl } from '../config';
import PresupuestoServicio from './PresupuestoServicio';

const PH = 'https://via.placeholder.com/1200x700?text=Servicio';
const imgSrc = s => s?.imagen_public_url || PH;
const servicioId = (s) => String(s?.id_servicio || s?.id || s?.idServicio || '');
const servicioNombre = (s) => String(s?.nombre || s?.nombre_servicio || s?.titulo || 'Servicio');
const normalizeServicio = (row = {}) => ({
  ...row,
  id_servicio: row?.id_servicio || row?.id || row?.idServicio,
  nombre: servicioNombre(row),
  descripcion: row?.descripcion || row?.detalle || '',
});

/* ══════════════════════════════════════════════════════════════════
   SERVICIO PANEL — desliza desde la IZQUIERDA, debajo del navbar
   Animación spring entrada/salida con anime.js-style CSS
══════════════════════════════════════════════════════════════════ */
const ServicioPanel = ({ servicio, servicios, onClose, onSelect }) => {
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const [navH, setNavH] = useState(64);

  /* detectar navbar height */
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (nav) setNavH(nav.getBoundingClientRect().height);
  }, []);

  /* entrada con CSS animation */
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.transform = 'translateX(-100%)';
      panelRef.current.style.opacity = '0';
      requestAnimationFrame(() => {
        panelRef.current.style.transition = 'transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease';
        panelRef.current.style.transform = 'translateX(0)';
        panelRef.current.style.opacity = '1';
      });
    }
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
      requestAnimationFrame(() => {
        overlayRef.current.style.transition = 'opacity 0.3s ease';
        overlayRef.current.style.opacity = '1';
      });
    }
  }, [servicio?.id_servicio]);

  /* salida animada */
  const closeAnim = () => {
    if (panelRef.current) {
      panelRef.current.style.transition = 'transform 0.32s cubic-bezier(0.55,0,1,0.45), opacity 0.28s ease';
      panelRef.current.style.transform = 'translateX(-105%)';
      panelRef.current.style.opacity = '0';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 340);
  };

  if (!servicio) return null;

  /* similares por palabras en común en el nombre */
  const palabras = servicio.nombre.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const similares = servicios
    .filter(s => s.id_servicio !== servicio.id_servicio)
    .map(s => {
      const nombreS = s.nombre.toLowerCase();
      const coincidencias = palabras.filter(w => nombreS.includes(w)).length;
      return { ...s, _score: coincidencias };
    })
    .filter(s => s._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 6);

  /* si no hay similares por nombre, mostrar los primeros */
  const fallback = similares.length === 0
    ? servicios.filter(s => s.id_servicio !== servicio.id_servicio).slice(0, 4)
    : similares;

  return (
    <>
      {/* Overlay */}
      <div ref={overlayRef}
        style={{ position: 'fixed', inset: 0, background: 'rgba(10,18,36,.44)', zIndex: 900, opacity: 0, cursor: 'pointer' }}
        onClick={closeAnim} />

      {/* Panel izquierdo */}
      <div ref={panelRef} style={{
        position: 'fixed',
        top: navH,
        left: 0,
        bottom: 0,
        width: 'min(480px, 100vw)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: `linear-gradient(180deg,#fff 0%,${COLORS.surface} 100%)`,
        boxShadow: '8px 0 48px rgba(10,18,54,.22)',
        borderRight: `4px solid ${COLORS.primary}`,
        transform: 'translateX(-100%)',
        opacity: 0,
      }}>

        {/* ── IMAGEN HERO ── */}
        <div style={{ position: 'relative', flexShrink: 0, height: 'clamp(200px,34vw,280px)', overflow: 'hidden', background: '#1a1a2e' }}>
          <img src={imgSrc(servicio)} alt={servicio.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(.88)' }}
            onError={e => { e.target.onerror = null; e.target.src = PH; }} />

          {/* Gradiente oscuro inferior */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.72) 0%,rgba(0,0,0,.08) 55%,transparent 100%)' }} />

          {/* Barra rojo→celeste→amarillo en top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg,${COLORS.primary},${COLORS.secondary},${COLORS.accent})` }} />

          {/* Badge categoría flotante */}
          {servicio.categoria && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.32)',
              padding: '4px 12px', borderRadius: 999,
              fontSize: 9, fontWeight: 700, letterSpacing: '.18em',
              textTransform: 'uppercase', color: '#fff',
              fontFamily: FONTS.body,
            }}>{servicio.categoria}</div>
          )}

          {/* Nombre flotante sobre imagen */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px' }}>
            <h2 style={{
              fontFamily: FONTS.heading,
              fontSize: 'clamp(20px,4vw,30px)', fontWeight: 700,
              color: '#fff', margin: 0, lineHeight: 1.05,
              textTransform: 'uppercase', letterSpacing: '.02em',
              textShadow: '0 2px 12px rgba(0,0,0,.5)',
            }}>{servicio.nombre}</h2>
          </div>

          {/* Botón ✕ */}
          <button onClick={closeAnim} style={{
            position: 'absolute', top: 12, right: 12,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,.42)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.3)',
            color: '#fff', fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.primary}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,.42)'}>
            ✕
          </button>
        </div>

        {/* ── CONTENIDO scrollable ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', padding: '20px 22px 48px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: `${COLORS.primary}44 transparent` }}>

          {/* Eyebrow */}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: COLORS.primary, fontFamily: FONTS.body }}>
            Detalle del Servicio
          </div>

          {/* Descripción */}
          {servicio.descripcion && (
            <p style={{ fontSize: 14, color: COLORS.textLight, lineHeight: 1.72, margin: 0, fontFamily: FONTS.body }}>
              {servicio.descripcion}
            </p>
          )}

          {/* Divisor */}
          <div style={{ height: 1, background: `linear-gradient(90deg,${COLORS.primary}44,${COLORS.secondary}22,transparent)` }} />

          {/* Atributos en grid */}
          {(servicio.grosor || servicio.categoria) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {servicio.categoria && (
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: COLORS.steel, marginBottom: 3, fontFamily: FONTS.body }}>Categoría</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, fontFamily: FONTS.body }}>{servicio.categoria}</div>
                </div>
              )}
              {servicio.grosor && (
                <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: COLORS.steel, marginBottom: 3, fontFamily: FONTS.body }}>Grosor</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, fontFamily: FONTS.body }}>{servicio.grosor}</div>
                </div>
              )}
            </div>
          )}

          {/* CTA eliminado */}

          {/* Servicios similares — masonry columns desordenado */}
          {fallback.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: COLORS.steel, fontFamily: FONTS.body, whiteSpace: 'nowrap' }}>
                  {similares.length > 0 ? 'Servicios Similares' : 'Otros Servicios'}
                </span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>

              {/* Masonry: columnCount + aspect ratios variables = efecto desordenado */}
              <div style={{ columnCount: 2, columnGap: 10 }}>
                {fallback.map((s, i) => {
                  const aspects = ['3/4', '4/3', '1/1', '3/2', '2/3', '16/9'];
                  const aspect = aspects[i % aspects.length];
                  const ac = [COLORS.primary, COLORS.secondary, COLORS.accent][i % 3];
                  return (
                    <div key={s.id_servicio}
                      onClick={() => onSelect(s)}
                      style={{ breakInside: 'avoid', marginBottom: 10, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${COLORS.border}`, transition: 'transform .22s,box-shadow .22s', display: 'block' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                      <div style={{ position: 'relative', aspectRatio: aspect, overflow: 'hidden', background: '#f1f5f9' }}>
                        <img src={imgSrc(s)} alt={s.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseLeave={e => e.currentTarget.style.transform = ''}
                          onError={e => { e.target.onerror = null; e.target.src = PH; }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.58) 0%,transparent 55%)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: 8, left: 8, width: 7, height: 7, borderRadius: '50%', background: ac, boxShadow: `0 0 8px ${ac}88` }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: FONTS.heading, textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1.2 }}>
                            {s.nombre}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════
   IMMERSIVE CAROUSEL HERO
══════════════════════════════════════════════════════════════════ */
const ImmersiveCarousel = ({ servicios, onClick }) => {
  const [active, setActive] = useState(0);
  const [textKey, setTextKey] = useState(0);
  const autoRef = useRef(null);
  const total = servicios.length;

  const go = useCallback((nextIdx) => {
    if (nextIdx === active) return;
    setActive(nextIdx);
    setTextKey(k => k + 1);
  }, [active]);

  const goNext = useCallback(() => go((active + 1) % total), [active, total, go]);
  const goPrev = useCallback(() => go((active - 1 + total) % total), [active, total, go]);

  useEffect(() => {
    autoRef.current = setInterval(goNext, 5500);
    return () => clearInterval(autoRef.current);
  }, [goNext]);

  const s = servicios[active];
  if (!s) return null;

  return (
    <div className="ic-root">
      {servicios.map((sv, i) => (
        <div key={sv.id_servicio || i}
          className={`ic-bg-layer ${i === active ? 'ic-bg-active' : ''}`}
          style={{ backgroundImage: `url(${imgSrc(sv)})`, opacity: i === active ? 1 : 0, zIndex: i === active ? 2 : 1 }} />
      ))}
      <div className="ic-vignette" />
      <div className="ic-left-grad" />

      <div className="ic-text-zone" key={textKey}>
        <div className="ic-eyebrow">
          <div className="ic-ey-line" />
          <span>{s.categoria || 'Vidriobras · Servicios'}</span>
        </div>
        <h1 className="ic-title">{s.nombre.toUpperCase()}</h1>
        {s.descripcion && <p className="ic-desc">{s.descripcion.substring(0, 130)}{s.descripcion.length > 130 ? '…' : ''}</p>}
        <div className="ic-actions">
          <button className="ic-discover-btn" onClick={() => onClick(s)}>
            <span className="ic-disc-icon">▶</span>
            <span>DESCUBRIR SERVICIO</span>
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="ic-thumbs-zone">
        <div className="ic-thumbs-outer">
          <div className="ic-thumbs-track"
            style={{ transform: `translateX(${-Math.max(0, active - 2) * (145 + 10)}px)` }}>
            {servicios.map((sv, i) => {
              const isActive = i === active;
              return (
                <div key={sv.id_servicio || i}
                  className={`ic-thumb ${isActive ? 'ic-thumb-active' : ''}`}
                  onClick={() => { clearInterval(autoRef.current); go(i); }}>
                  <img src={imgSrc(sv)} alt={sv.nombre} className="ic-thumb-img"
                    onError={e => { e.target.onerror = null; e.target.src = PH; }} />
                  <div className="ic-thumb-ov" />
                  <div className="ic-thumb-info">
                    <div className="ic-thumb-name">{sv.nombre.toUpperCase()}</div>
                  </div>
                  <div className="ic-thumb-bar" style={{ opacity: isActive ? 1 : 0 }} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="ic-arrows">
          <button className="ic-arrow" onClick={() => { clearInterval(autoRef.current); goPrev(); }}>&#8249;</button>
          <button className="ic-arrow" onClick={() => { clearInterval(autoRef.current); goNext(); }}>&#8250;</button>
        </div>
      </div>

      <div className="ic-counter">
        <span className="ic-counter-cur">{String(active + 1).padStart(2, '0')}</span>
        <span className="ic-counter-sep" />
        <span className="ic-counter-tot">{String(total).padStart(2, '0')}</span>
      </div>

      <div className="ic-progress-wrap">
        {servicios.map((_, i) => (
          <div key={i} className="ic-prog-seg">
            <div className="ic-prog-fill"
              style={{ background: i === active ? COLORS.accent : 'rgba(255,255,255,.25)', width: i === active ? '100%' : (i < active ? '100%' : '0%'), transition: i === active ? 'width 5.5s linear' : 'none' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══ MOSAIC ═══════════════════════════════════════════════════════ */
const MosaicWall = ({ items, onClick }) => {
  if (!items?.length) return null;
  const [big, ...rest] = items;
  return (
    <div className="mw-root">
      <MosCard p={big} big onClick={onClick} />
      <div className="mw-right">{rest.slice(0, 4).map(s => <MosCard key={s.id_servicio} p={s} onClick={onClick} />)}</div>
    </div>
  );
};
const MosCard = ({ p, big = false, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div className={`mc-card ${big ? 'mc-big' : ''}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onClick(p)}>
      <img src={imgSrc(p)} alt={p.nombre} className="mc-img"
        style={{ transform: hov ? 'scale(1.08)' : 'scale(1)', filter: hov ? 'brightness(.9)' : 'brightness(.68) grayscale(18%)' }} />
      <div className="mc-ov" />
      <div className="mc-accent" style={{ opacity: hov ? 1 : 0 }} />
      <div className="mc-info" style={{ transform: hov ? 'translateY(0)' : 'translateY(8px)' }}>
        <div className="mc-name">{p.nombre}</div>
        <div className="mc-cta" style={{ opacity: hov ? 1 : 0 }}>Ver más ↗</div>
      </div>
    </div>
  );
};

/* ══ DARK BAND ════════════════════════════════════════════════════ */
const DarkBand = ({ items, startIdx, onClick }) => {
  if (!items?.length) return null;
  const accents = [COLORS.primary, COLORS.secondary, COLORS.accent];
  return (
    <div className="db-root">
      <div style={{ height: 4, background: `linear-gradient(90deg,${COLORS.primary},${COLORS.secondary},${COLORS.accent})` }} />
      <div className="db-inner">
        <div className="db-header">
          <div className="db-eyebrow">Especialidades</div>
          <h2 className="db-title">EXPERTOS EN CADA DETALLE</h2>
          <div className="db-line" />
        </div>
        <div className="db-grid">
          {items.slice(0, 3).map((s, i) => (
            <DarkBandCard key={servicioId(s) || i} s={s} i={i} startIdx={startIdx} onClick={onClick} accents={accents} />
          ))}
        </div>
      </div>
    </div>
  );
};

const DarkBandCard = ({ s, i, startIdx, onClick, accents }) => {
  const [hov, setHov] = useState(false);
  const ac = accents[i % 3];
  return (
    <div className="db-card"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onClick(s)}
      style={{ borderBottom: `3px solid ${hov ? ac : 'transparent'}` }}>
      <div className="db-img-wrap">
        <img src={imgSrc(s)} alt={servicioNombre(s)} className="db-img"
          style={{ transform: hov ? 'scale(1.07)' : 'scale(1)', filter: hov ? 'brightness(1.05)' : 'brightness(.62) grayscale(28%)' }} />
        <div className="db-ov" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ac, opacity: hov ? 1 : 0, transition: 'opacity .3s', zIndex: 3 }} />
      </div>
      <div className="db-body">
        <div className="db-num" style={{ color: ac }}>0{startIdx + i + 1}</div>
        <div className="db-name">{servicioNombre(s)}</div>
        {s.descripcion && <p className="db-desc">{s.descripcion.substring(0, 80)}…</p>}
        <div className="db-bar" style={{ background: ac, width: hov ? '50%' : '20%' }} />
      </div>
    </div>
  );
};

/* ══ CINEMATIC PAIR ═══════════════════════════════════════════════ */
const CinematicPair = ({ servicio, idx, reverse, accentColor = COLORS.primary, onClick }) => {
  const [hov, setHov] = useState(false);
  if (!servicio) return null;
  return (
    <div className="cp-root" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onClick(servicio)}>
      <img src={imgSrc(servicio)} alt={servicio.nombre} className="cp-img" style={{ transform: hov ? 'scale(1.04)' : 'scale(1)' }} onError={e => { e.target.onerror = null; e.target.src = PH; }} />
      <div className="cp-grad" style={{ background: reverse ? 'linear-gradient(to left,rgba(0,0,0,.88) 0%,rgba(0,0,0,.55) 40%,rgba(0,0,0,.08) 100%)' : 'linear-gradient(to right,rgba(0,0,0,.88) 0%,rgba(0,0,0,.55) 40%,rgba(0,0,0,.08) 100%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accentColor, zIndex: 4 }} />
      <div className="cp-text" style={{ [reverse ? 'right' : 'left']: 'clamp(32px,7vw,100px)', textAlign: reverse ? 'right' : 'left' }}>
        <div className="cp-eyebrow" style={{ color: accentColor, justifyContent: reverse ? 'flex-end' : 'flex-start' }}>
          {!reverse && <div className="cp-ey-line" style={{ background: accentColor }} />}
          <span>SERVICIO {String(idx + 1).padStart(2, '0')}</span>
          {reverse && <div className="cp-ey-line" style={{ background: accentColor }} />}
        </div>
        <h2 className="cp-title">{servicio.nombre.toUpperCase()}</h2>
        {servicio.descripcion && <p className="cp-desc">{servicio.descripcion.substring(0, 140)}{servicio.descripcion.length > 140 ? '…' : ''}</p>}
      </div>
      <div className="cp-num-bg" style={{ [reverse ? 'left' : 'right']: '-20px' }}>{String(idx + 1).padStart(2, '0')}</div>
    </div>
  );
};

/* ══ TRIO CARDS ═══════════════════════════════════════════════════ */
const TrioCards = ({ items, onClick }) => {
  if (!items?.length) return null;
  const layouts = [
    { textPos: 'bottom-left', bg: `rgba(148,25,24,0.92)` },          // rojo corporativo
    { textPos: 'mid-dark', bg: null },
    { textPos: 'bottom-light', bg: `rgba(128,194,220,0.92)` },       // celeste corporativo
  ];
  return (
    <div className="trio-root">
      {items.slice(0, 3).map((s, i) => (
        <TrioCardItem key={servicioId(s) || i} s={s} i={i} onClick={onClick} layouts={layouts} />
      ))}
    </div>
  );
};

const TrioCardItem = ({ s, i, onClick, layouts }) => {
  const [hov, setHov] = useState(false);
  const lo = layouts[i % 3];
  const ac = [COLORS.primary, COLORS.secondary, COLORS.accent][i];
  return (
    <div className="trio-card"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onClick(s)}>
      <img src={imgSrc(s)} alt={servicioNombre(s)} className="trio-img"
        style={{ transform: hov ? 'scale(1.07)' : 'scale(1)', filter: lo.textPos === 'mid-dark' ? (hov ? 'brightness(.75)' : 'brightness(.6)') : (hov ? 'brightness(.88)' : 'brightness(.78)') }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ac, zIndex: 4 }} />
      {lo.textPos === 'bottom-left' && (
        <div className="trio-box-white" style={{ background: lo.bg }}>
          <div className="trio-box-tag" style={{ color: COLORS.accent }}>ESPECIAL</div>
          <div className="trio-box-name">{servicioNombre(s)}</div>
          <button className="trio-box-btn" style={{ background: '#fff', color: COLORS.primaryDark }}>Ver servicio</button>
        </div>
      )}
      {lo.textPos === 'mid-dark' && (
        <div className="trio-overlay-text">
          <div className="trio-ov-tag">{s.categoria || 'Servicio'}</div>
          <div className="trio-ov-name">{servicioNombre(s).toUpperCase()}</div>
          {s.descripcion && <p className="trio-ov-desc">{s.descripcion.substring(0, 70)}…</p>}
        </div>
      )}
      {lo.textPos === 'bottom-light' && (
        <div className="trio-box-light" style={{ background: lo.bg }}>
          <div className="trio-light-tag" style={{ color: COLORS.accent }}>DESTACADO</div>
          <div className="trio-light-name">{servicioNombre(s)}</div>
          <button className="trio-light-btn" style={{ background: '#fff', color: COLORS.primaryDark }}>Ver servicio</button>
        </div>
      )}
    </div>
  );
};

/* ══ 3D CARDS ════════════════════════════════════════════════════ */
const Card3D = ({ s, idx, onClick }) => {
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [hov, setHov] = useState(false);
  const ref = useRef(null);
  const bc = [COLORS.primary, COLORS.secondary, COLORS.accent][idx % 3];
  const onMove = e => { const r = ref.current.getBoundingClientRect(); setRot({ x: ((e.clientY - r.top) / r.height - .5) * 16, y: -((e.clientX - r.left) / r.width - .5) * 16 }); };
  return (
    <div ref={ref} className="c3d-outer"
      style={{ transform: hov ? `perspective(700px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(1.04)` : 'perspective(700px) scale(1)' }}
      onMouseMove={onMove} onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setRot({ x: 0, y: 0 }); }}
      onClick={() => onClick(s)}>
      <img src={imgSrc(s)} alt={s.nombre} className="c3d-img" style={{ filter: hov ? 'brightness(1.05) saturate(1.1)' : 'brightness(.75) grayscale(14%)' }} />
      <div className="c3d-border" style={{ borderColor: bc, opacity: hov ? 1 : 0 }} />
      <div className="c3d-gloss" style={{ opacity: hov ? .15 : 0 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: bc, opacity: hov ? 1 : .4, transition: 'opacity .3s', zIndex: 4 }} />
      <div className="c3d-num" style={{ color: bc }}>{String(idx + 1).padStart(2, '0')}</div>
      <div className="c3d-info">
        <div className="c3d-name">{s.nombre}</div>
        <div className="c3d-arrow" style={{ color: bc, opacity: hov ? 1 : 0 }}>→</div>
      </div>
    </div>
  );
};
const Row3D = ({ items, startIdx, onClick }) => {
  if (!items?.length) return null;
  return (
    <div className="r3d-root">
      <div className="r3d-header">
        <span className="r3d-tag">CATÁLOGO</span>
        <h2 className="r3d-title">SOLUCIONES QUE TRANSFORMAN ESPACIOS</h2>
        <div className="r3d-accent" />
      </div>
      <div className="r3d-grid">
        {items.slice(0, 3).map((s, i) => <Card3D key={s.id_servicio} s={s} idx={startIdx + i} onClick={onClick} />)}
      </div>
    </div>
  );
};

/* ══ SCATTERED ═══════════════════════════════════════════════════ */
const ScatteredStrip = ({ items, startIdx, onClick }) => {
  if (!items?.length) return null;
  const heights = ['270px', '350px', '230px', '310px', '255px'];
  const mts = ['0', '-55px', '25px', '-38px', '15px'];
  return (
    <div className="ss-root">
      {items.slice(0, 5).map((s, i) => (
        <ScatteredCard key={servicioId(s) || i} s={s} i={i} startIdx={startIdx} onClick={onClick} heights={heights} mts={mts} />
      ))}
    </div>
  );
};

const ScatteredCard = ({ s, i, startIdx, onClick, heights, mts }) => {
  const [hov, setHov] = useState(false);
  return (
    <div className="ss-card"
      style={{ height: heights[i], marginTop: mts[i], zIndex: hov ? 10 : 1 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onClick(s)}>
      <img src={imgSrc(s)} alt={servicioNombre(s)} className="ss-img"
        style={{ transform: hov ? 'scale(1.12)' : 'scale(1)', filter: hov ? 'brightness(1) grayscale(0%)' : 'brightness(.72) grayscale(18%)' }} />
      <div className="ss-ov" style={{ opacity: hov ? .88 : .55 }} />
      <div className="ss-tag" style={{ opacity: hov ? 1 : 0, background: COLORS.accent, color: COLORS.primaryDark }}>
        S-{String(startIdx + i + 1).padStart(2, '0')}
      </div>
      <div className="ss-info"><div className="ss-name">{servicioNombre(s)}</div></div>
    </div>
  );
};

/* ══ FULL BANNER ══════════════════════════════════════════════════ */
const FullBanner = ({ servicio, idx, onClick }) => {
  if (!servicio) return null;
  return (
    <div className="fb-root" onClick={() => onClick(servicio)}>
      <img src={imgSrc(servicio)} alt={servicio.nombre} className="fb-img" onError={e => { e.target.onerror = null; e.target.src = PH; }} />
      <div className="fb-ov" />
      <div className="fb-content">
        <div className="fb-num">{String(idx + 1).padStart(2, '0')}</div>
        <h2 className="fb-title">{servicio.nombre.toUpperCase()}</h2>
        {servicio.descripcion && <p className="fb-desc">{servicio.descripcion.substring(0, 100)}…</p>}
      </div>
      <div className="fb-deco" />
    </div>
  );
};

/* ══ REST GRID ════════════════════════════════════════════════════ */
const RestGrid = ({ items, startIdx, onClick }) => {
  if (!items?.length) return null;
  return (
    <div className="rg-root">
      {items.map((s, i) => (
        <RestGridCard key={servicioId(s) || i} s={s} i={i} startIdx={startIdx} onClick={onClick} />
      ))}
    </div>
  );
};

const RestGridCard = ({ s, i, startIdx, onClick }) => {
  const [hov, setHov] = useState(false);
  const ac = [COLORS.primary, COLORS.secondary, COLORS.accent][i % 3];
  return (
    <div className="rg-card"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onClick(s)}>
      <img src={imgSrc(s)} alt={servicioNombre(s)} className="rg-img"
        style={{ transform: hov ? 'scale(1.09)' : 'scale(1)', filter: hov ? 'brightness(.88)' : 'brightness(.62) grayscale(14%)' }} />
      <div className="rg-ov" style={{ opacity: hov ? 1 : .65 }} />
      <div className="rg-bar" style={{ background: ac, width: hov ? '100%' : '0%' }} />
      <div className="rg-info">
        <span className="rg-num" style={{ color: ac }}>{String(startIdx + i + 1).padStart(2, '0')}</span>
        <span className="rg-name">{servicioNombre(s)}</span>
      </div>
    </div>
  );
};

/* ══ DIVIDER ═════════════════════════════════════════════════════ */
const SD = ({ label, color = COLORS.primary }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '52px clamp(20px,5vw,60px) 40px' }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right,${color}55,${color}18,transparent)` }} />
    <span style={{ background: color, color: color === COLORS.accent ? COLORS.primaryDark : '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', padding: '5px 16px', fontFamily: FONTS.body }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to left,${color}55,${color}18,transparent)` }} />
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════ */
const Proyectos = () => {
  const [servicios, setServicios] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [presupuestoOpen, setPresupuestoOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [areaUsuario, setAreaUsuario] = useState('');
  const [loading, setLoading] = useState(true);
  const [realtimeNuevoServicio, setRealtimeNuevoServicio] = useState(null);
  const [servicioResaltadoId, setServicioResaltadoId] = useState(null);

  const cargarServicios = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const r = await fetch('/api/servicios');
      const d = await r.json();
      if (d?.ok && Array.isArray(d.data)) {
        setServicios(d.data.map(normalizeServicio));
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const verificar = async () => {
      try {
        const token = localStorage.getItem('personalToken');
        if (!token) { setAreaUsuario(''); return; }
        const res = await fetch('/api/personal/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.personal)
          setAreaUsuario((data.personal.area || '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''));
        else setAreaUsuario('');
      } catch { setAreaUsuario(''); }
    };
    verificar();
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return undefined;

    const es = new EventSource(buildApiUrl('/api/realtime/servicios'));

    const onServiciosChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        if (!changes.length) return;

        const isInitial = Boolean(payload?.initial);

        setServicios((prev) => {
          let next = [...prev];

          if (isInitial) {
            const snap = changes
              .filter((ch) => ch?.op === 'snapshot' && ch?.record)
              .map((ch) => normalizeServicio(ch.record));
            if (snap.length) next = snap;
            return next;
          }

          for (const ch of changes) {
            const op = ch?.op;
            const rec = ch?.record ? normalizeServicio(ch.record) : null;
            const id = String(ch?.id || servicioId(rec || {}));
            if (!id) continue;

            if (op === 'insert' && rec) {
              const existe = next.some((s) => servicioId(s) === id);
              if (!existe) {
                next = [rec, ...next];
                setRealtimeNuevoServicio(rec?.nombre || 'Nuevo servicio');
                setServicioResaltadoId(id);
                setTimeout(() => setRealtimeNuevoServicio(null), 3200);
                setTimeout(() => setServicioResaltadoId(null), 4200);
              }
              continue;
            }

            if (op === 'update' && rec) {
              const idx = next.findIndex((s) => servicioId(s) === id);
              if (idx >= 0) next[idx] = { ...next[idx], ...rec };
              continue;
            }

            if (op === 'delete') {
              next = next.filter((s) => servicioId(s) !== id);
            }
          }

          return next;
        });
      } catch (e) {
        console.error('[Proyectos SSE] error parseando evento', e);
      }
    };

    es.addEventListener('servicios_changed', onServiciosChanged);

    es.onerror = () => {
      // EventSource reintenta solo; mantenemos la conexion viva.
    };

    return () => {
      es.removeEventListener('servicios_changed', onServiciosChanged);
      es.close();
    };
  }, []);

  const handleClick = s => {
    setSelectedServicio(s);
    if (areaUsuario === 'VENTAS') setPresupuestoOpen(true);
    else setDetalleOpen(true);
  };

  const handleClose = () => { setSelectedServicio(null); setPresupuestoOpen(false); setDetalleOpen(false); };

  const filtrados = servicios;
  const carousel = filtrados.slice(0, Math.min(filtrados.length, 8));
  const mosaic   = filtrados.slice(0, 5);
  const dark     = filtrados.slice(5, 8);
  const fp1      = filtrados[8] || null;
  const row3d    = filtrados.slice(9, 12);
  const scat     = filtrados.slice(12, 17);
  const fb1      = filtrados[17] || null;
  const fp2      = filtrados[18] || null;
  const rest     = filtrados.slice(19);

  return (
    <div style={{ fontFamily: FONTS.body, background: COLORS.backgroundLight, minHeight: '100vh', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        :root{
          --r:${COLORS.primary};--r2:${COLORS.primaryLight};
          --c:${COLORS.secondary};--y:${COLORS.accent};
          --dk:${COLORS.text};--w:${COLORS.white};
          --steel:${COLORS.steel};
        }
        @keyframes icTextIn{0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes icZoom{from{transform:scale(1.04)}to{transform:scale(1)}}
        @keyframes shimmer{0%{opacity:.4}50%{opacity:.72}100%{opacity:.4}}
        @keyframes srvRtIn{from{opacity:0;transform:translateY(-8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes srvGlow{0%{box-shadow:0 0 0 0 rgba(128,194,220,.48)}70%{box-shadow:0 0 0 10px rgba(128,194,220,0)}100%{box-shadow:0 0 0 0 rgba(128,194,220,0)}}

        /* ══ CAROUSEL ════ */
        .ic-root{position:relative;width:100%;height:clamp(480px,58vw,680px);overflow:hidden}
        .ic-bg-layer{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity .9s ease}
        .ic-bg-active{animation:icZoom 6s ease-out forwards}
        .ic-vignette{position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(to top,rgba(0,0,0,.78) 0%,rgba(0,0,0,.45) 28%,rgba(0,0,0,.12) 55%,transparent 100%)}
        .ic-left-grad{position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(to right,rgba(0,0,0,.55) 0%,rgba(0,0,0,.2) 38%,transparent 62%)}
        .ic-text-zone{position:absolute;left:clamp(28px,6vw,80px);bottom:clamp(88px,14vw,140px);z-index:6;max-width:480px}
        .ic-eyebrow{display:flex;align-items:center;gap:10px;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.62);margin-bottom:12px;font-family:'Open Sans',sans-serif;animation:icTextIn .55s .05s ease-out both}
        .ic-ey-line{width:22px;height:1.5px;background:var(--y);flex-shrink:0}
        .ic-title{font-family:'Oswald',sans-serif;font-size:clamp(34px,5.5vw,72px);font-weight:700;color:var(--w);line-height:1;letter-spacing:.01em;text-transform:uppercase;margin:0 0 14px;animation:icTextIn .55s .1s ease-out both}
        .ic-desc{font-size:13.5px;color:rgba(255,255,255,.62);line-height:1.65;max-width:380px;margin:0 0 22px;font-family:'Open Sans',sans-serif;animation:icTextIn .55s .16s ease-out both}
        .ic-actions{animation:icTextIn .55s .22s ease-out both}
        .ic-discover-btn{display:inline-flex;align-items:center;gap:10px;background:transparent;color:var(--w);border:1.5px solid rgba(255,255,255,.5);padding:11px 22px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;font-family:'Open Sans',sans-serif;transition:background .22s,border-color .22s}
        .ic-discover-btn:hover{background:var(--r);border-color:var(--r)}
        .ic-disc-icon{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--y);color:var(--y);display:inline-flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0}
        .ic-thumbs-zone{position:absolute;right:clamp(16px,3vw,40px);bottom:clamp(20px,3.5vw,40px);z-index:6;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
        .ic-arrows{display:flex;gap:7px}
        .ic-arrow{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.28);color:var(--w);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;backdrop-filter:blur(6px);transition:background .2s,border-color .2s;line-height:1}
        .ic-arrow:hover{background:var(--r);border-color:var(--r)}
        .ic-thumbs-outer{overflow:hidden;max-width:clamp(280px,38vw,520px)}
        .ic-thumbs-track{display:flex;gap:10px;transition:transform .55s cubic-bezier(.22,1,.36,1);will-change:transform}
        .ic-thumb{flex-shrink:0;width:clamp(100px,11vw,145px);border-radius:8px;overflow:hidden;cursor:pointer;position:relative;aspect-ratio:16/10;transition:opacity .35s,border-color .35s,transform .45s cubic-bezier(.22,1,.36,1),box-shadow .35s;opacity:.55;border:2px solid transparent}
        .ic-thumb:hover{opacity:.82}
        .ic-thumb-active{opacity:1;border-color:var(--y);transform:translateY(-5px) scale(1.06);box-shadow:0 10px 24px rgba(0,0,0,.5),0 0 0 2px var(--y)}
        .ic-thumb-img{width:100%;height:100%;object-fit:cover;display:block}
        .ic-thumb-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 65%)}
        .ic-thumb-info{position:absolute;bottom:0;left:0;right:0;padding:8px 9px}
        .ic-thumb-name{font-family:'Oswald',sans-serif;font-size:clamp(10px,1.1vw,13px);font-weight:600;color:var(--w);line-height:1.1;text-transform:uppercase}
        .ic-thumb-bar{position:absolute;top:0;left:0;right:0;height:2.5px;background:var(--y);transition:opacity .25s}
        .ic-counter{position:absolute;bottom:clamp(22px,3vw,38px);left:clamp(28px,6vw,80px);z-index:7;display:flex;align-items:center;gap:8px}
        .ic-counter-cur{font-family:'Oswald',sans-serif;font-size:22px;font-weight:600;color:var(--w);line-height:1;letter-spacing:.02em}
        .ic-counter-sep{width:24px;height:1px;background:rgba(255,255,255,.35);flex-shrink:0}
        .ic-counter-tot{font-family:'Oswald',sans-serif;font-size:13px;font-weight:400;color:rgba(255,255,255,.42)}
        .ic-progress-wrap{position:absolute;bottom:0;left:0;right:0;height:2px;display:flex;z-index:8}
        .ic-prog-seg{flex:1;overflow:hidden;background:rgba(255,255,255,.12)}
        .ic-prog-fill{height:100%}
        @media(max-width:640px){.ic-thumbs-zone{right:10px;bottom:14px}.ic-thumb{width:85px}.ic-title{font-size:clamp(28px,8vw,44px)}.ic-text-zone{bottom:72px;left:16px}.ic-counter{left:16px}}

        /* ══ MOSAIC ════ */
        .mw-root{display:grid;grid-template-columns:1.1fr 1fr;grid-template-rows:clamp(360px,46vw,540px);gap:3px}
        .mw-right{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:3px}
        .mc-card{position:relative;overflow:hidden;cursor:pointer;background:#ddd}
        .mc-big{grid-row:1}
        .mc-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .52s,filter .4s}
        .mc-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,10,10,.82) 0%,rgba(10,10,10,.06) 55%,transparent 100%)}
        .mc-accent{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--r),var(--c),var(--y));transition:opacity .3s}
        .mc-info{position:absolute;bottom:0;left:0;right:0;padding:20px 22px;transition:transform .3s}
        .mc-name{font-family:'Oswald',sans-serif;font-size:clamp(15px,2vw,22px);font-weight:600;color:var(--w);text-transform:uppercase;letter-spacing:.04em;line-height:1.1}
        .mc-cta{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--y);text-transform:uppercase;margin-top:5px;transition:opacity .25s;font-family:'Open Sans',sans-serif}
        @media(max-width:640px){.mw-root{grid-template-columns:1fr;grid-template-rows:auto}.mw-right{grid-template-columns:1fr 1fr;grid-template-rows:auto}.mc-card,.mc-big{height:200px}}

        /* ══ DARK BAND ════ */
        .db-root{background:linear-gradient(160deg,#0d0d0d 0%,#111827 100%)}
        .db-inner{padding:clamp(52px,7vw,88px) clamp(20px,5vw,72px)}
        .db-header{text-align:center;margin-bottom:52px}
        .db-eyebrow{font-size:11px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--c);margin-bottom:10px;font-family:'Open Sans',sans-serif}
        .db-title{font-family:'Oswald',sans-serif;font-size:clamp(26px,4.5vw,50px);font-weight:700;color:var(--w);margin:0 0 14px;text-transform:uppercase;letter-spacing:.03em}
        .db-line{width:60px;height:3px;background:linear-gradient(90deg,var(--r),var(--c));margin:0 auto}
        .db-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        @media(max-width:640px){.db-grid{grid-template-columns:1fr}}
        .db-card{cursor:pointer;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);transition:transform .3s,box-shadow .3s}
        .db-card:hover{transform:translateY(-8px);box-shadow:0 24px 48px rgba(0,0,0,.6)}
        .db-img-wrap{position:relative;overflow:hidden;aspect-ratio:4/3}
        .db-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s,filter .4s}
        .db-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 60%)}
        .db-body{padding:18px 20px 22px;display:flex;flex-direction:column;gap:7px}
        .db-num{font-family:'Oswald',sans-serif;font-size:42px;font-weight:700;line-height:1;opacity:.12;letter-spacing:-.03em}
        .db-name{font-family:'Oswald',sans-serif;font-size:clamp(17px,2vw,22px);font-weight:600;color:var(--w);text-transform:uppercase;line-height:1.15}
        .db-desc{font-size:13px;color:rgba(255,255,255,.46);line-height:1.55;margin:0;font-family:'Open Sans',sans-serif}
        .db-bar{height:2px;transition:width .4s ease;margin-top:8px}

        /* ══ CINEMATIC PAIR ════ */
        .cp-root{position:relative;width:100%;height:clamp(380px,48vw,580px);overflow:hidden;cursor:pointer}
        .cp-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .65s ease}
        .cp-grad{position:absolute;inset:0;z-index:2;pointer-events:none}
        .cp-text{position:absolute;top:50%;transform:translateY(-50%);z-index:5;max-width:clamp(280px,38vw,460px);display:flex;flex-direction:column;gap:14px}
        .cp-eyebrow{display:flex;align-items:center;gap:10px;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;font-family:'Open Sans',sans-serif}
        .cp-ey-line{width:22px;height:1.5px;flex-shrink:0}
        .cp-title{font-family:'Oswald',sans-serif;font-size:clamp(30px,4.5vw,60px);font-weight:700;color:#fff;line-height:1;text-transform:uppercase;letter-spacing:.02em;margin:0}
        .cp-desc{font-size:14px;color:rgba(255,255,255,.7);line-height:1.7;margin:0;font-family:'Open Sans',sans-serif;max-width:360px}
        .cp-btn{display:inline-block;border:none;padding:12px 26px;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;cursor:pointer;font-family:'Open Sans',sans-serif;transition:opacity .22s,transform .22s}
        .cp-btn:hover{opacity:.85;transform:translateX(4px)}
        .cp-num-bg{position:absolute;top:50%;transform:translateY(-50%);font-family:'Oswald',sans-serif;font-size:clamp(100px,18vw,220px);font-weight:700;color:rgba(255,255,255,.04);line-height:1;letter-spacing:-.06em;pointer-events:none;z-index:3;overflow:hidden;max-width:50%}
        @media(max-width:640px){.cp-text{left:20px!important;right:20px!important;text-align:left!important;max-width:none}.cp-eyebrow{justify-content:flex-start!important}.cp-btn{align-self:flex-start!important}}

        /* ══ TRIO ════ */
        .trio-root{display:grid;grid-template-columns:repeat(3,1fr);gap:0;height:clamp(420px,55vw,660px)}
        @media(max-width:640px){.trio-root{grid-template-columns:1fr;height:auto}}
        .trio-card{position:relative;overflow:hidden;cursor:pointer;display:flex;flex-direction:column}
        @media(max-width:640px){.trio-card{height:320px}}
        .trio-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .55s ease,filter .4s ease}
        .trio-box-white{position:absolute;bottom:0;left:0;right:0;padding:22px 24px 28px;z-index:4}
        .trio-box-tag{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-family:'Open Sans',sans-serif;margin-bottom:4px}
        .trio-box-name{font-family:'Oswald',sans-serif;font-size:clamp(18px,2.2vw,26px);font-weight:700;color:#fff;text-transform:uppercase;line-height:1.1;margin-bottom:14px}
        .trio-box-btn{display:inline-block;border:none;padding:10px 20px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;font-family:'Open Sans',sans-serif;transition:opacity .2s}
        .trio-box-btn:hover{opacity:.82}
        .trio-overlay-text{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;justify-content:flex-end;padding:28px 24px}
        .trio-ov-tag{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${COLORS.accent};font-family:'Open Sans',sans-serif;margin-bottom:4px}
        .trio-ov-name{font-family:'Oswald',sans-serif;font-size:clamp(18px,2.2vw,26px);font-weight:700;color:#fff;text-transform:uppercase;line-height:1.1;margin-bottom:8px}
        .trio-ov-desc{font-size:12px;color:rgba(255,255,255,.62);line-height:1.5;margin:0;font-family:'Open Sans',sans-serif}
        .trio-box-light{position:absolute;bottom:0;left:0;right:0;padding:22px 24px 28px;z-index:4;display:flex;flex-direction:column;align-items:center;text-align:center}
        .trio-light-tag{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-family:'Open Sans',sans-serif;margin-bottom:4px}
        .trio-light-name{font-family:'Oswald',sans-serif;font-size:clamp(16px,2vw,24px);font-weight:700;color:#fff;text-transform:uppercase;line-height:1.1;margin-bottom:14px}
        .trio-light-btn{display:inline-block;border:none;color:#fff;padding:10px 20px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;font-family:'Open Sans',sans-serif;transition:opacity .2s}
        .trio-light-btn:hover{opacity:.82}

        /* ══ 3D ════ */
        .r3d-root{padding:clamp(48px,6vw,80px) clamp(20px,5vw,60px);background:var(--w)}
        .r3d-header{text-align:center;margin-bottom:48px}
        .r3d-tag{font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--c);display:block;margin-bottom:10px;font-family:'Open Sans',sans-serif}
        .r3d-title{font-family:'Oswald',sans-serif;font-size:clamp(24px,4vw,44px);font-weight:700;color:var(--dk);text-transform:uppercase;margin:0 0 12px}
        .r3d-accent{width:60px;height:3px;background:linear-gradient(90deg,var(--r),var(--c),var(--y));margin:0 auto}
        .r3d-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:640px){.r3d-grid{grid-template-columns:1fr}}
        .c3d-outer{position:relative;overflow:hidden;cursor:pointer;aspect-ratio:4/3;transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s}
        .c3d-outer:hover{box-shadow:0 28px 56px rgba(0,0,0,.28)}
        .c3d-img{width:100%;height:100%;object-fit:cover;display:block;transition:filter .3s}
        .c3d-border{position:absolute;inset:0;border-width:3px;border-style:solid;pointer-events:none;transition:opacity .3s;z-index:3}
        .c3d-gloss{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.38) 0%,transparent 60%);pointer-events:none;z-index:4;transition:opacity .3s}
        .c3d-num{position:absolute;top:14px;left:14px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;letter-spacing:.18em;background:rgba(0,0,0,.32);padding:4px 10px;backdrop-filter:blur(6px);z-index:5}
        .c3d-info{position:absolute;bottom:0;left:0;right:0;padding:20px 22px;background:linear-gradient(to top,rgba(0,0,0,.88) 0%,transparent 100%);z-index:5}
        .c3d-name{font-family:'Oswald',sans-serif;font-size:clamp(17px,2vw,24px);font-weight:600;color:var(--w);text-transform:uppercase;line-height:1.1}
        .c3d-arrow{font-size:22px;transition:opacity .25s;margin-top:4px}

        /* ══ SCATTERED ════ */
        .ss-root{display:flex;gap:4px;overflow:hidden;align-items:flex-end}
        .ss-card{flex:1;position:relative;overflow:hidden;cursor:pointer;transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s}
        .ss-card:hover{transform:scaleY(1.04);box-shadow:0 12px 32px rgba(0,0,0,.28)}
        .ss-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s,filter .4s}
        .ss-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.05) 55%,transparent 100%);transition:opacity .3s}
        .ss-tag{position:absolute;top:14px;left:14px;font-size:10px;font-weight:700;letter-spacing:.14em;padding:4px 10px;transition:opacity .25s;font-family:'Open Sans',sans-serif}
        .ss-info{position:absolute;bottom:0;left:0;right:0;padding:16px 18px}
        .ss-name{font-family:'Oswald',sans-serif;font-size:clamp(14px,1.8vw,19px);font-weight:600;color:var(--w);text-transform:uppercase;line-height:1.15}
        @media(max-width:640px){.ss-root{flex-direction:column}.ss-card{height:200px!important;margin-top:0!important}}

        /* ══ BANNER ════ */
        .fb-root{position:relative;height:clamp(280px,36vw,420px);overflow:hidden;cursor:pointer}
        .fb-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .65s;filter:grayscale(18%)}
        .fb-root:hover .fb-img{transform:scale(1.04)}
        .fb-ov{position:absolute;inset:0;background:linear-gradient(to right,rgba(148,25,24,.9) 0%,rgba(148,25,24,.52) 45%,rgba(0,0,0,.2) 100%)}
        .fb-content{position:absolute;left:clamp(28px,6vw,80px);top:50%;transform:translateY(-50%);z-index:4;max-width:520px}
        .fb-num{font-family:'Oswald',sans-serif;font-size:80px;font-weight:700;color:rgba(255,255,255,.1);line-height:1;letter-spacing:-.04em;margin-bottom:-18px}
        .fb-title{font-family:'Oswald',sans-serif;font-size:clamp(28px,4.5vw,58px);font-weight:700;color:var(--w);text-transform:uppercase;margin:0 0 14px;line-height:1.05;letter-spacing:.02em}
        .fb-desc{font-size:15px;color:rgba(255,255,255,.75);line-height:1.6;margin:0 0 24px;font-family:'Open Sans',sans-serif}
        .fb-btn{background:var(--y);color:${COLORS.primaryDark};border:none;padding:13px 28px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;font-family:'Open Sans',sans-serif;transition:opacity .22s,transform .22s}
        .fb-btn:hover{opacity:.88;transform:translateX(4px)}
        .fb-deco{position:absolute;right:0;top:0;bottom:0;width:6px;background:linear-gradient(to bottom,var(--c),var(--y))}

        /* ══ REST ════ */
        .rg-root{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:3px}
        .rg-card{position:relative;overflow:hidden;cursor:pointer;aspect-ratio:4/3;background:#ddd}
        .rg-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s,filter .4s}
        .rg-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.82) 0%,rgba(0,0,0,.06) 55%,transparent 100%);transition:opacity .3s}
        .rg-bar{position:absolute;bottom:0;left:0;height:3px;transition:width .4s ease;z-index:3}
        .rg-info{position:absolute;bottom:0;left:0;right:0;padding:16px 18px;display:flex;flex-direction:column;gap:3px}
        .rg-num{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-family:'Open Sans',sans-serif;margin-bottom:2px}
        .rg-name{font-family:'Oswald',sans-serif;font-size:clamp(16px,2vw,20px);font-weight:600;color:var(--w);text-transform:uppercase;line-height:1.15}
        .pz-sk{animation:shimmer 1.6s ease-in-out infinite}

        /* ══ RESPONSIVE GLOBAL ══════════════════════════════════════════ */

        /* ── Tablet (≤768px) ── */
        @media(max-width:768px){
          /* carousel */
          .ic-root{height:clamp(360px,72vw,520px)}
          .ic-text-zone{left:20px;bottom:clamp(80px,18vw,120px);max-width:calc(100% - 40px)}
          .ic-title{font-size:clamp(28px,7vw,52px)}
          .ic-desc{display:none}
          .ic-thumbs-zone{right:10px;bottom:12px;gap:7px}
          .ic-thumb{width:clamp(80px,10vw,120px)}
          .ic-counter{left:20px}

          /* mosaic */
          .mw-root{grid-template-columns:1fr;grid-template-rows:auto}
          .mw-right{grid-template-columns:1fr 1fr;grid-template-rows:auto}
          .mc-card,.mc-big{height:clamp(180px,40vw,280px)}

          /* dark band */
          .db-grid{grid-template-columns:1fr 1fr}
          .db-inner{padding:40px 20px}

          /* cinematic pair */
          .cp-root{height:clamp(320px,55vw,480px)}
          .cp-text{left:20px!important;right:20px!important;text-align:left!important;max-width:none;bottom:20px;top:auto;transform:none}
          .cp-eyebrow{justify-content:flex-start!important}
          .cp-btn{align-self:flex-start!important}
          .cp-num-bg{display:none}

          /* trio */
          .trio-root{height:auto}
          .trio-card{height:280px}

          /* 3d cards */
          .r3d-grid{grid-template-columns:1fr 1fr}
          .r3d-root{padding:40px 20px}

          /* scattered */
          .ss-root{flex-wrap:wrap}
          .ss-card{flex:0 0 48%;min-height:200px;margin-top:0!important}

          /* banner */
          .fb-content{left:24px}
          .fb-num{font-size:52px}

          /* rest grid */
          .rg-root{grid-template-columns:repeat(2,1fr)}
        }

        /* ── Mobile (≤480px) ── */
        @media(max-width:480px){
          /* carousel */
          .ic-root{height:clamp(300px,90vw,420px)}
          .ic-title{font-size:clamp(24px,8vw,40px)}
          .ic-thumbs-zone{display:none}
          .ic-text-zone{left:16px;right:16px;bottom:52px;max-width:none}
          .ic-eyebrow{margin-bottom:8px}
          .ic-discover-btn{padding:9px 18px;font-size:10px}
          .ic-counter{bottom:16px;left:16px}

          /* mosaic */
          .mw-root{grid-template-columns:1fr}
          .mw-right{grid-template-columns:1fr}
          .mc-card,.mc-big{height:clamp(160px,48vw,240px)}

          /* dark band */
          .db-grid{grid-template-columns:1fr}
          .db-inner{padding:32px 16px}
          .db-title{font-size:clamp(22px,6vw,36px)}

          /* cinematic pair */
          .cp-root{height:clamp(280px,85vw,400px)}
          .cp-title{font-size:clamp(22px,7vw,40px)}

          /* trio */
          .trio-root{grid-template-columns:1fr}
          .trio-card{height:260px}

          /* 3d cards */
          .r3d-grid{grid-template-columns:1fr}
          .r3d-root{padding:32px 16px}

          /* scattered */
          .ss-root{flex-direction:column}
          .ss-card{height:200px!important;margin-top:0!important;width:100%}

          /* banner */
          .fb-root{height:clamp(220px,65vw,320px)}
          .fb-title{font-size:clamp(22px,6vw,36px)}
          .fb-desc{display:none}
          .fb-num{display:none}

          /* rest grid */
          .rg-root{grid-template-columns:1fr}

          /* divider */
          .sdiv{margin:32px 16px 24px}

          /* panel detalle */
          .pz-drawer{padding:16px}
        }`}</style>

      {/* ── LOADING ── */}
      {realtimeNuevoServicio && (
        <div style={{
          position: 'fixed',
          top: 84,
          right: 18,
          zIndex: 1200,
          background: 'linear-gradient(135deg, rgba(255,255,255,.92), rgba(199,236,255,.9))',
          border: `1px solid ${COLORS.secondary}`,
          borderRadius: 12,
          padding: '10px 14px',
          color: COLORS.text,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 12,
          boxShadow: '0 10px 24px rgba(15,23,42,.18)',
          animation: 'srvRtIn .32s ease, srvGlow 1.7s ease-out 1'
        }}>
          Nuevo servicio en tiempo real: {realtimeNuevoServicio}
        </div>
      )}

      {loading && (
        <div style={{ paddingTop: 80, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 3 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pz-sk" style={{ height: 260, background: `linear-gradient(135deg,${COLORS.gray[100]},${COLORS.gray[50]},${COLORS.gray[100]})`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '120px 0 80px', color: COLORS.textLight }}>
          <div style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, textTransform: 'uppercase', color: COLORS.steel, marginBottom: 8 }}>Sin servicios</div>
          <div style={{ fontSize: 14, fontFamily: FONTS.body }}>No hay servicios disponibles.</div>
        </div>
      )}

      {!loading && filtrados.length > 0 && (<>
        {carousel.length > 0 && (
          <div style={{ animation: carousel.some(s => String(s?.id_servicio || s?.id || '') === String(servicioResaltadoId || '')) ? 'srvRtIn .35s ease' : 'none' }}>
            <ImmersiveCarousel servicios={carousel} onClick={handleClick} />
          </div>
        )}
        {mosaic.length > 1 && (<><SD label="Nuestros Servicios" color={COLORS.primary} /><MosaicWall items={mosaic} onClick={handleClick} /></>)}
        {dark.length > 0 && (<><SD label="Especialidades" color={COLORS.secondary} /><DarkBand items={dark} startIdx={5} onClick={handleClick} /></>)}
        {fp1 && (<><SD label="Servicio Destacado" color={COLORS.primary} /><CinematicPair servicio={fp1} idx={8} reverse={false} accentColor={COLORS.primary} onClick={handleClick} /></>)}
        {row3d.length > 0 && <Row3D items={row3d} startIdx={9} onClick={handleClick} />}
        {scat.length > 0 && (<><SD label="Más Servicios" color={COLORS.accent} /><ScatteredStrip items={scat} startIdx={12} onClick={handleClick} /></>)}
        {fb1 && (<><SD label="Servicio Especial" color={COLORS.primary} /><FullBanner servicio={fb1} idx={17} onClick={handleClick} /></>)}
        {fp2 && (<><SD label="Servicio Especial" color={COLORS.secondary} /><CinematicPair servicio={fp2} idx={18} reverse={true} accentColor={COLORS.secondary} onClick={handleClick} /></>)}
        {rest.slice(0, 3).length > 0 && (<><SD label="También Ofrecemos" color={COLORS.accent} /><TrioCards items={rest.slice(0, 3)} onClick={handleClick} /></>)}
        {rest.slice(3).length > 0 && (<><SD label="Todos los Servicios" color={COLORS.primary} /><RestGrid items={rest.slice(3)} startIdx={22} onClick={handleClick} /></>)}
        <div style={{ paddingBottom: 80 }} />
      </>)}

      {/* PRESUPUESTO */}
      {presupuestoOpen && (
        <PresupuestoServicio selectedServicio={selectedServicio} handleCloseSelected={handleClose} />
      )}

      {/* PANEL IZQUIERDO CON ANIMACIÓN */}
      {detalleOpen && selectedServicio && (
        <ServicioPanel
          servicio={selectedServicio}
          servicios={servicios}
          onClose={handleClose}
          onSelect={s => setSelectedServicio(s)}
        />
      )}
    </div>
  );
};

export default Proyectos;