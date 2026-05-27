import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { IconPlus, IconSearch, IconChevronLeft, IconChevronRight, IconArrowRight } from "@tabler/icons-react";
import { animate, stagger, spring } from 'animejs';
import CorteModal from './Cortes/CorteModal';
import CortesDrawer from './Cortes/CortesDrawer';
import { useCartStore } from '../stores/cartStore';
import { buildApiUrl } from '../config';

const DEFAULT_IMG = "https://via.placeholder.com/400x400?text=Sin+Imagen";
const IMG = p => p?.IMG_P?.startsWith('http') ? p.IMG_P : DEFAULT_IMG;

/* ══════════════════════════════════════════════════════════════════
   HOOK — animar un grupo de elementos cuando aparecen
══════════════════════════════════════════════════════════════════ */
const useSpringIn = (selector, deps = []) => {
  useEffect(() => {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    animate(els, {
      opacity:    [0, 1],
      translateY: [28, 0],
      scale:      [0.94, 1],
      ease: spring({ stiffness: 180, damping: 14 }),
      delay: stagger(55),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/* ══════════════════════════════════════════════════════════════════
   LOADING SKELETON — animación de pulso con spring
══════════════════════════════════════════════════════════════════ */
const SkeletonCard = ({ idx }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0.35, 0.75, 0.35],
      ease: spring({ stiffness: 60, damping: 8 }),
      delay: idx * 60,
      loop: true,
    });
  }, [idx]);
  return (
    <div ref={ref} style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 2px 12px rgba(15,23,42,.06)' }}>
      <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg,#e8edf2 0%,#f1f5f9 50%,#e8edf2 100%)', backgroundSize: '200% 100%' }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 16, borderRadius: 8, background: '#e8edf2', width: '75%' }} />
        <div style={{ height: 11, borderRadius: 6, background: '#f1f5f9', width: '55%' }} />
        <div style={{ height: 20, borderRadius: 8, background: '#e8edf2', width: '40%', marginTop: 6 }} />
      </div>
    </div>
  );
};

const LoadingGrid = ({ count = 8 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} idx={i} />)}
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   QTY POPOVER — Portal montado en document.body para evitar
   que transform de ancestros rompa position:fixed en móvil
══════════════════════════════════════════════════════════════════ */
const QtyPop = ({ onConfirm, onClose, above = true, maxStock = Infinity }) => {
  const [qty, setQty] = useState(1);
  const [warning, setWarning] = useState('');
  const warnRef = useRef(null);
  const popRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  /* animación de entrada */
  useEffect(() => {
    if (!popRef.current) return;
    animate(popRef.current, {
      opacity:    [0, 1],
      translateY: isMobile ? [16, 0] : above ? [10, 0] : [-10, 0],
      scale:      [0.9, 1],
      ease: spring({ stiffness: 340, damping: 18 }),
    });
  }, []);

  /* animación de salida → luego ejecuta cb */
  const closeWithAnim = (cb) => {
    if (!popRef.current) { cb?.(); return; }
    animate(popRef.current, {
      opacity: [1, 0],
      scale:   [1, 0.9],
      translateY: isMobile ? [0, 16] : above ? [0, 10] : [0, -10],
      duration: 180,
      ease: 'out(2)',
      onComplete: () => cb?.(),
    });
  };

  const showWarning = (msg) => {
    setWarning(msg);
    if (warnRef.current) {
      animate(warnRef.current, {
        translateY: [6, 0], opacity: [0, 1], scale: [0.96, 1],
        ease: spring({ stiffness: 260, damping: 16 }), duration: 320,
      });
    }
  };

  const handleChange = (val) => {
    const n = Math.max(1, Math.floor(Number(val) || 1));
    if (n > maxStock) {
      setQty(maxStock);
      showWarning(`Stock disponible: ${maxStock} unidad${maxStock !== 1 ? 'es' : ''}`);
    } else { setQty(n); setWarning(''); }
  };

  const handleConfirm = () => {
    if (qty > maxStock) {
      showWarning(`Máximo ${maxStock} unidad${maxStock !== 1 ? 'es' : ''} disponible${maxStock !== 1 ? 's' : ''}`);
      return;
    }
    closeWithAnim(() => { onConfirm(qty); onClose(); });
  };

  /* Contenido del popover */
  const content = (
    <div ref={popRef}
      style={{
        opacity: 0,
        background: '#fff',
        border: '1.5px solid #941918',
        borderRadius: 14,
        padding: '18px 18px',
        boxShadow: '0 20px 52px rgba(0,0,0,.28)',
        zIndex: 9999,
        boxSizing: 'border-box',
        fontFamily: "'DM Sans',sans-serif",
        /* en móvil: fixed centrado; en desktop: absolute relativo al padre */
        ...(isMobile ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(300px, 88vw)',
        } : {
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          minWidth: 220,
          whiteSpace: 'nowrap',
          ...(above ? { bottom: 'calc(100% + 14px)' } : { top: 'calc(100% + 14px)' }),
        }),
      }}
      onClick={e => e.stopPropagation()}>

      {/* Flecha (solo desktop) */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          left: '50%', transform: 'translateX(-50%)',
          border: '8px solid transparent',
          ...(above ? { top: '100%', borderTopColor: '#941918' } : { bottom: '100%', borderBottomColor: '#941918' }),
        }} />
      )}

      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>Cantidad</div>

      {maxStock < Infinity && maxStock <= 10 && (
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
          Disponible: <span style={{ color: '#10b981', fontWeight: 700 }}>{maxStock}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 17, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => handleChange(qty - 1)}>−</button>
        <input style={{ width: isMobile ? '100%' : 52, flex: isMobile ? 1 : 'none', padding: '7px 8px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 15, fontWeight: 700, textAlign: 'center', fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }}
          type="number" min={1} max={maxStock} step={1} value={qty}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => { if (e.key === '.' || e.key === ',') e.preventDefault(); }}
          onFocus={e => e.currentTarget.style.borderColor = '#941918'}
          onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          autoFocus />
        <button style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 17, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qty >= maxStock ? .38 : 1 }}
          onClick={() => handleChange(qty + 1)}
          disabled={qty >= maxStock}>+</button>
      </div>

      {warning && (
        <div ref={warnRef} style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '7px 13px', marginBottom: 10, borderRadius: 10,
          border: '1px solid rgba(128,194,220,0.55)',
          background: 'linear-gradient(135deg,rgba(0,20,50,0.97),rgba(0,35,70,0.99))',
          boxShadow: '0 0 22px rgba(128,194,220,0.25),0 4px 18px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(14px)',
          fontSize: 11.5, fontWeight: 600,
          color: 'rgba(200,235,255,0.95)', letterSpacing: '0.02em',
          width: '100%', boxSizing: 'border-box',
        }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#80C2DC,#4fa8cc)', color: '#001428', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>!</span>
          <span>{warning}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={{ background: 'linear-gradient(135deg,#941918,#c94543)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", width: '100%', transition: 'transform .2s' }}
          onClick={handleConfirm}>Agregar</button>
        <button style={{ background: 'transparent', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", width: '100%', transition: 'background .18s,border-color .18s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
          onClick={() => closeWithAnim(onClose)}>Cancelar</button>
      </div>
    </div>
  );

  /* En móvil: montar via Portal en body + backdrop */
  if (isMobile) {
    return createPortal(
      <>
        <div onClick={() => closeWithAnim(onClose)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9998 }} />
        {content}
      </>,
      document.body
    );
  }

  /* Desktop: inline normal */
  return content;
};

/* ══════════════════════════════════════════════════════════════════
   STANDARD CARD
══════════════════════════════════════════════════════════════════ */
const Card = ({ p, delay = 0, onAdd, onCorte, esCorte, blocked }) => {
  const [hov, setHov] = useState(false);
  const [open, setOpen] = useState(false);
  const stock = Number(p.cantidad ?? 0);
  return (
    <div className="pc" data-product-id={p.id_producto || p.id} style={{ position: 'relative', zIndex: open ? 100 : 1 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="pc-img-wrap">
        <span className="pc-chip">{p.categoria || 'General'}</span>
        <img src={IMG(p)} alt={p.nombre} className="pc-img"
          style={{ transform: hov ? 'scale(1.1)' : 'scale(1)', filter: hov ? 'brightness(.82)' : 'brightness(1)' }}
          onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
        {stock > 0 && !blocked && (
          <div className="pc-hover-layer" style={{ opacity: hov || open ? 1 : 0 }}>
            <button className="btn-circ" onClick={e => { e.stopPropagation(); esCorte ? onCorte(p) : setOpen(o => !o); }}>
              <IconPlus stroke={2.5} size={20} />
            </button>
          </div>
        )}
        {stock <= 0 && (
          <div className="pc-hover-layer" style={{ opacity: hov ? 1 : 0, background: 'rgba(0,0,0,.38)', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Agotado
          </div>
        )}
      </div>
      {open && (
        <QtyPop onConfirm={qty => { onAdd(p, qty); setOpen(false); }} onClose={() => setOpen(false)} above={true} maxStock={stock} />
      )}
      <div className="pc-body">
        <div className="pc-name">{p.nombre}</div>
        {p.descripcion && <div className="pc-desc">{p.descripcion}</div>}
        <div className="pc-foot">
          {p.precio_unitario
            ? <span className="pc-price"><span className="pc-curr">S/</span>{p.precio_unitario}</span>
            : <span className="pc-consult">Consultar precio</span>}
          {stock > 0
            ? <span className="badge-stk">{stock <= 10 ? `Stock: ${stock}` : 'Stock'}</span>
            : <span className="badge-stk badge-stk-red">Agotado</span>}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   EDITORIAL BANNER
══════════════════════════════════════════════════════════════════ */
const EditorialBanner = ({ p, reverse = false, onClick }) => {
  if (!p) return null;
  return (
    <div className="ed" style={{ flexDirection: reverse ? 'row-reverse' : 'row' }}>
      <div className="ed-img-wrap" style={{ cursor: 'pointer' }} onClick={() => onClick?.(p)}>
        <img src={IMG(p)} alt={p.nombre} className="ed-img" onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
        <div className="ed-img-ov" />
      </div>
      <div className="ed-text" style={{ borderLeft: reverse ? '1px solid rgba(0,0,0,.07)' : 'none', borderRight: reverse ? 'none' : '1px solid rgba(0,0,0,.07)' }}>
        <div className="ed-eyebrow">{p.categoria || 'Destacado'}</div>
        <h2 className="ed-h2">{p.nombre}</h2>
        {p.descripcion && <p className="ed-p">{p.descripcion}</p>}
        <div className="ed-pills">
          {p.grosor && <span className="pill">Grosor: {p.grosor}</span>}
          {Number(p.cantidad ?? 0) > 0 && <span className="pill">Stock disponible</span>}
        </div>
        <button className="ed-cta" onClick={() => onClick?.(p)}>Ver detalles <IconArrowRight size={15} stroke={2} /></button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MOSAIC 1+3
══════════════════════════════════════════════════════════════════ */
const Mosaic4 = ({ productos, onAdd, onCorte, esCorte, blocked }) => {
  if (!productos?.length) return null;
  const [big, ...smalls] = productos;
  return (
    <div className="mos4">
      <MosCard p={big} big onAdd={onAdd} onCorte={onCorte} esCorte={esCorte} blocked={blocked} />
      <div className="mos4-stack">
        {smalls.slice(0, 3).map((p, i) => (
          <MosCard key={p.id_producto || p.codigo || i} p={p} onAdd={onAdd} onCorte={onCorte} esCorte={esCorte} blocked={blocked} />
        ))}
      </div>
    </div>
  );
};

const MosCard = ({ p, big = false, onAdd, onCorte, esCorte, blocked }) => {
  const [hov, setHov] = useState(false);
  const [open, setOpen] = useState(false);
  const stock = Number(p.cantidad ?? 0);
  return (
    <div className={`mos-card ${big ? 'mos-big' : ''}`} data-product-id={p.id_producto || p.id} style={{ zIndex: open ? 40 : 1, position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <img src={IMG(p)} alt={p.nombre} className="mos-img" style={{ transform: hov ? 'scale(1.07)' : 'scale(1)' }}
        onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
      <div className="mos-ov" style={{ opacity: hov ? 1 : 0.68 }} />
      <div className="mos-info">
        <span className="mos-cat">{p.categoria || 'General'}</span>
        <span className="mos-name">{p.nombre}</span>
        {p.precio_unitario && <span className="mos-price">S/ {p.precio_unitario}</span>}
        {hov && <span className="mos-sub">Explorar producto</span>}
      </div>
      {stock > 0 && !blocked && hov && (
        <button className="mos-btn" onClick={e => { e.stopPropagation(); esCorte(p) ? onCorte(p) : setOpen(true); }}>
          <IconPlus stroke={2.5} size={17} />
        </button>
      )}
      {stock <= 0 && <div className="mos-stock-msg">Agotado</div>}
      {open && stock > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200, minWidth: 'min(220px,80vw)' }}
          onClick={e => e.stopPropagation()}>
          <QtyPop onConfirm={qty => { onAdd(p, qty); setOpen(false); }} onClose={() => setOpen(false)} above={false} maxStock={stock} />
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   H STRIP
══════════════════════════════════════════════════════════════════ */
const HStrip = ({ productos, onAdd, onCorte, esCorte, blocked }) => {
  if (!productos?.length) return null;
  return (
    <div className="hstrip">
      {productos.slice(0, 3).map((p, i) => (
        <HStripCard key={p.id_producto || p.codigo || i} p={p} idx={i} onAdd={onAdd} onCorte={onCorte} esCorte={esCorte} blocked={blocked} />
      ))}
    </div>
  );
};

const HStripCard = ({ p, idx, onAdd, onCorte, esCorte, blocked }) => {
  const [hov, setHov] = useState(false);
  const [open, setOpen] = useState(false);
  const accents = ['#941918', '#1a3a5c', '#1a5c3a'];
  const ac = accents[idx % accents.length];
  const stock = Number(p.cantidad ?? 0);
  return (
    <div className="hsc" data-product-id={p.id_producto || p.id} style={{ zIndex: open ? 40 : 1, position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="hsc-img-wrap">
        <img src={IMG(p)} alt={p.nombre} className="hsc-img" style={{ transform: hov ? 'scale(1.08)' : 'scale(1)' }}
          onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
        <div className="hsc-ov" style={{ background: `linear-gradient(to top,${ac}cc 0%,transparent 55%)` }} />
      </div>
      <div className="hsc-body" style={{ borderTop: `3px solid ${ac}` }}>
        <div className="hsc-num" style={{ color: ac }}>0{idx + 1}</div>
        <div className="hsc-name">{p.nombre}</div>
        {p.descripcion && <div className="hsc-desc">{p.descripcion}</div>}
        <div className="hsc-foot">
          {p.precio_unitario && <span className="hsc-price" style={{ color: ac }}>S/ {p.precio_unitario}</span>}
          {stock > 0 && !blocked
            ? <button className="hsc-btn" style={{ background: ac }} onClick={e => { e.stopPropagation(); esCorte(p) ? onCorte(p) : setOpen(true); }}>
                <IconPlus stroke={2.5} size={16} />
              </button>
            : stock <= 0
              ? <span style={{ color: '#ff5050', fontSize: 11, fontWeight: 700 }}>Agotado</span>
              : null}
        </div>
      </div>
      {open && stock > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200, minWidth: 'min(220px,80vw)' }}
          onClick={e => e.stopPropagation()}>
          <QtyPop onConfirm={qty => { onAdd(p, qty); setOpen(false); }} onClose={() => setOpen(false)} above={false} maxStock={stock} />
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   DARK SPOTLIGHT
══════════════════════════════════════════════════════════════════ */
const DarkSpotlight = ({ productos, onAdd, onCorte, esCorte, blocked }) => {
  if (!productos?.length) return null;
  return (
    <div className="dspot">
      <div className="dspot-header">
        <div className="dspot-eyebrow">Selección Especial</div>
        <h2 className="dspot-h2">Materiales Premium</h2>
      </div>
      <div className="dspot-grid">
        {productos.slice(0, 3).map((p, i) => (
          <DSpotCard key={p.id_producto || p.codigo || i} p={p} idx={i} onAdd={onAdd} onCorte={onCorte} esCorte={esCorte} blocked={blocked} />
        ))}
      </div>
    </div>
  );
};

const DSpotCard = ({ p, idx, onAdd, onCorte, esCorte, blocked }) => {
  const [hov, setHov] = useState(false);
  const [open, setOpen] = useState(false);
  const stock = Number(p.cantidad ?? 0);
  return (
    <div className="dsc" data-product-id={p.id_producto || p.id} style={{ zIndex: open ? 40 : 1, position: 'relative' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="dsc-img-wrap">
        <img src={IMG(p)} alt={p.nombre} className="dsc-img"
          style={{ transform: hov ? 'scale(1.1)' : 'scale(1)', filter: hov ? 'brightness(1.12) saturate(1.15)' : 'brightness(.88)' }}
          onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
        {stock > 0 && !blocked && hov && (
          <button className="dsc-btn" onClick={e => { e.stopPropagation(); esCorte(p) ? onCorte(p) : setOpen(true); }}>
            <IconPlus stroke={2.5} size={18} /> Agregar
          </button>
        )}
        {stock <= 0 && (
          <span style={{ position: 'absolute', bottom: 10, left: 10, right: 10, color: '#fff', fontWeight: 700, fontSize: 12, background: 'rgba(0,0,0,.5)', padding: '4px 8px', borderRadius: 6, textAlign: 'center' }}>
            Agotado
          </span>
        )}
      </div>
      {open && stock > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200, minWidth: 'min(220px,80vw)' }}
          onClick={e => e.stopPropagation()}>
          <QtyPop onConfirm={qty => { onAdd(p, qty); setOpen(false); }} onClose={() => setOpen(false)} above={false} maxStock={stock} />
        </div>
      )}
      <div className="dsc-body">
        <span className="dsc-cat">{p.categoria || 'General'}</span>
        <div className="dsc-name">{p.nombre}</div>
        {p.precio_unitario && <div className="dsc-price">S/ {p.precio_unitario}</div>}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ZIGZAG PAIRS
══════════════════════════════════════════════════════════════════ */
const ZigzagPair = ({ p, reverse = false, onAdd, onCorte, esCorte, blocked }) => {
  if (!p) return null;
  const [open, setOpen] = useState(false);
  const stock = Number(p.cantidad ?? 0);
  return (
    <div className="zig" data-product-id={p.id_producto || p.id} style={{ flexDirection: reverse ? 'row-reverse' : 'row' }}>
      <div className="zig-img">
        <img src={IMG(p)} alt={p.nombre} className="zig-photo" onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
        <div className="zig-badge">{p.categoria || 'General'}</div>
      </div>
      <div className="zig-text" style={{ position: 'relative' }}>
        <div className="zig-num">{reverse ? '02' : '01'}</div>
        <h3 className="zig-h3">{p.nombre}</h3>
        {p.descripcion && <p className="zig-p">{p.descripcion}</p>}
        <div className="zig-meta">
          {p.grosor && <div className="zig-row"><span className="zig-k">Grosor</span><span className="zig-v">{p.grosor}</span></div>}
          {stock > 0 && <div className="zig-row"><span className="zig-k">Stock</span><span className="zig-v" style={{ color: '#10b981' }}>{stock} disponible{stock !== 1 ? 's' : ''}</span></div>}
        </div>
        {p.precio_unitario && <div className="zig-price">S/ {p.precio_unitario}</div>}
        {stock > 0 && !blocked && (
          <button className="zig-btn" onClick={() => setOpen(o => !o)}>
            <IconPlus stroke={2.5} size={16} /> Agregar al carrito
          </button>
        )}
        {stock <= 0 && <div style={{ color: '#b00', fontWeight: 700, marginTop: 8 }}>Agotado</div>}
        {open && stock > 0 && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', left: 0, zIndex: 200, minWidth: 'min(220px,80vw)' }}
            onClick={e => e.stopPropagation()}>
            <QtyPop onConfirm={qty => { esCorte(p) ? onCorte(p) : onAdd(p, qty); setOpen(false); }}
              onClose={() => setOpen(false)} above={true} maxStock={stock} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   DIVIDER
══════════════════════════════════════════════════════════════════ */
const Div = ({ label }) => (
  <div className="sdiv">
    <div className="sdiv-line" />
    <span className="sdiv-pill">{label}</span>
    <div className="sdiv-line sdiv-line-r" />
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   GRID CON ANIMACIÓN SPRING
══════════════════════════════════════════════════════════════════ */
const AnimatedGrid = ({ items, className = 'pgrid', style = {}, renderItem, animKey }) => {
  const gridRef = useRef(null);
  useEffect(() => {
    if (!gridRef.current || !items?.length) return;
    const cards = gridRef.current.querySelectorAll(':scope > *');
    if (!cards.length) return;
    // reset before animate
    Array.from(cards).forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(24px) scale(0.94)'; });
    animate(cards, {
      opacity:    [0, 1],
      translateY: [24, 0],
      scale:      [0.94, 1],
      ease: spring({ stiffness: 200, damping: 16 }),
      delay: stagger(60),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);

  return (
    <div ref={gridRef} className={className} style={style}>
      {items.map(renderItem)}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   DETALLE PANEL — desliza desde la izquierda, debajo del navbar
══════════════════════════════════════════════════════════════════ */
const DetallePanel = ({ p, onClose, onAdd, blocked }) => {
  const panelRef = useRef(null);
  const overlayRef = useRef(null);
  const stock = Number(p.cantidad ?? 0);

  /* entrada */
  useEffect(() => {
    if (overlayRef.current) {
      animate(overlayRef.current, { opacity: [0, 1], duration: 300, ease: 'linear' });
    }
    if (panelRef.current) {
      animate(panelRef.current, {
        translateX: ['-100%', '0%'],
        ease: spring({ stiffness: 280, damping: 22 }),
      });
    }
  }, []);

  /* salida → luego cierra */
  const closeAnim = () => {
    const done = onClose;
    if (panelRef.current) {
      animate(panelRef.current, {
        translateX: ['0%', '-100%'],
        duration: 320, ease: 'in(2)',
        onComplete: done,
      });
    }
    if (overlayRef.current) {
      animate(overlayRef.current, { opacity: [1, 0], duration: 300, ease: 'linear' });
    }
  };

  /* Detectar height del navbar para posicionar debajo */
  const [navH, setNavH] = useState(64);
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (nav) setNavH(nav.getBoundingClientRect().height);
  }, []);

  return (
    <>
      {/* Overlay semitransparente */}
      <div ref={overlayRef}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.38)', zIndex: 900, opacity: 0 }}
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
        background: 'linear-gradient(180deg,#ffffff 0%,#f8faff 100%)',
        boxShadow: '8px 0 40px rgba(10,24,54,0.22)',
        transform: 'translateX(-100%)', /* empieza fuera */
        borderRight: `4px solid #941918`,
      }}>

        {/* ── Imagen hero del panel ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={p.IMG_P?.startsWith('http') ? p.IMG_P : DEFAULT_IMG} alt={p.nombre}
            style={{ width: '100%', height: 'clamp(200px,32vw,280px)', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />

          {/* Gradiente sobre imagen */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,18,40,.72) 0%,transparent 55%)' }} />

          {/* Categoría + nombre sobre imagen */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 22px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#80C2DC', marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>
              {p.categoria || 'Producto'}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.15 }}>
              {p.nombre}
            </h2>
          </div>

          {/* Botón cerrar sobre la imagen */}
          <button onClick={closeAnim} style={{
            position: 'absolute', top: 12, right: 12,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.3)',
            color: '#fff', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', transition: 'background .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#941918'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,.45)'}>
            ✕
          </button>

          {/* Barra de acento inferior */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#941918,#80C2DC,#ffd600)' }} />
        </div>

        {/* ── Contenido ── */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

          {/* Precio */}
          {p.precio_unitario && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif" }}>S/</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 800, color: '#941918', letterSpacing: '-.03em', lineHeight: 1 }}>
                {p.precio_unitario}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif" }}>/ unidad</span>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(148,25,24,.25),rgba(128,194,220,.2),transparent)' }} />

          {/* Descripción */}
          {p.descripcion && (
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.72, margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
              {p.descripcion}
            </p>
          )}

          {/* Atributos en grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {p.grosor && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>Grosor</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: "'DM Sans',sans-serif" }}>{p.grosor}</div>
              </div>
            )}
            {p.codigo && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>Código</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', fontFamily: "'DM Sans',sans-serif" }}>{p.codigo}</div>
              </div>
            )}
            <div style={{ background: stock > 0 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${stock > 0 ? '#a7f3d0' : '#fca5a5'}`, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: stock > 0 ? '#10b981' : '#dc2626', marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>Stock</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: stock > 0 ? '#10b981' : '#dc2626', fontFamily: "'DM Sans',sans-serif" }}>
                {stock <= 0 ? 'Agotado' : stock <= 10 ? `${stock} unid.` : 'Disponible'}
              </div>
            </div>
          </div>

          {/* CTA */}
          {stock > 0 && !blocked && (
            <button onClick={() => onAdd(p)} style={{
              width: '100%', padding: '15px',
              background: 'linear-gradient(135deg,#941918,#c94543)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontSize: 14, fontWeight: 700, letterSpacing: '.06em',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(148,25,24,.32)',
              transition: 'transform .2s, box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(148,25,24,.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(148,25,24,.32)'; }}>
              <IconPlus size={18} stroke={2.5} />
              Agregar al carrito
            </button>
          )}

          {stock <= 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 14, padding: '14px 18px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#dc2626', fontFamily: "'DM Sans',sans-serif" }}>
              Producto agotado
            </div>
          )}
        </div>
      </div>
    </>
  );
};
const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState('');
  const [heroIdx, setHeroIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catSel, setCatSel] = useState(null);
  const [showCorte, setShowCorte] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [pCorte, setPCorte] = useState(null);
  const [costoCorte, setCostoCorte] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [avisoEstado, setAvisoEstado] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [toast, setToast] = useState(null); // { nombre, img }
  const toastTimerRef = useRef(null);
  const stockPulseTimeoutRef = useRef(null);

  const showToast = (p) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ nombre: p.nombre, img: IMG(p) });
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  };
  const addOrMergePlancha = useCartStore(s => s.addOrMergePlancha);
  const addCorte = useCartStore(s => s.addCorte);
  const ensureCartId = useCartStore(s => s.ensureCartId);

  useEffect(() => { localStorage.setItem('carrito_id', ensureCartId()); }, [ensureCartId]);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/productos');
      if (!r.ok) { setError('Error ' + r.status); setLoading(false); return; }
      const data = await r.json();
      setProductos(data || []);
      const m = {};
      (data || []).forEach(p => { if (p.categoria && p.IMG_P?.trim()) m[p.categoria] = m[p.categoria] || p.IMG_P; });
      setCats(Object.entries(m).slice(0, 3).map(([categoria, IMG_P]) => ({ categoria, IMG_P })));
      setAnimKey(k => k + 1);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  const pulseStockCards = useCallback((ids = []) => {
    const uniq = Array.from(new Set((ids || []).filter(Boolean)));
    if (!uniq.length) return;

    requestAnimationFrame(() => {
      const targets = [];
      uniq.forEach((id) => {
        const els = document.querySelectorAll(`[data-product-id="${id}"]`);
        els.forEach((el) => targets.push(el));
      });
      if (!targets.length) return;

      animate(targets, {
        scale: [1, 1.03, 1],
        boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 0 2px rgba(16,185,129,0.45)', '0 0 0 rgba(0,0,0,0)'],
        ease: spring({ stiffness: 240, damping: 14 }),
        delay: stagger(40),
      });
    });
  }, []);

  const applyRealtimeProductChanges = useCallback((changes = []) => {
    if (!Array.isArray(changes) || !changes.length) return;

    const touched = [];
    const newInserts = [];
    setProductos((prev) => {
      const map = new Map((prev || []).map((p) => [String(p.id_producto || p.id), p]));

      for (const ch of changes) {
        const op = (ch?.op || '').toLowerCase();
        const rec = ch?.record;
        const id = String(ch?.id || rec?.id_producto || rec?.id || '');
        if (!id) continue;

        if (op === 'delete') {
          const curr = map.get(id);
          if (curr) {
            map.set(id, { ...curr, cantidad: 0 });
            touched.push(id);
          }
          continue;
        }

        if (op === 'insert') {
          // Nuevo producto insertado
          if (rec) {
            map.set(id, rec);
            touched.push(id);
            newInserts.push(id);
          }
          continue;
        }

        if (!rec) continue;
        const curr = map.get(id);
        if (!curr) continue;

        const nextQty = Number(rec.cantidad ?? curr.cantidad ?? 0);
        if (Number(curr.cantidad ?? 0) !== nextQty) {
          map.set(id, { ...curr, cantidad: nextQty });
          touched.push(id);
        }
      }

      return Array.from(map.values());
    });

    // Animar nuevos productos
    if (newInserts.length) {
      setTimeout(() => {
        newInserts.forEach(id => {
          const els = document.querySelectorAll(`[data-product-id="${id}"]`);
          els.forEach((el) => {
            el.style.animation = 'none';
            setTimeout(() => {
              el.style.animation = 'spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both';
            }, 10);
          });
        });
      }, 50);
    }

    if (stockPulseTimeoutRef.current) clearTimeout(stockPulseTimeoutRef.current);
    stockPulseTimeoutRef.current = setTimeout(() => pulseStockCards(touched), 40);
  }, [pulseStockCards]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch('/api/clientes/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d?.success && d?.cliente) { setBlocked(!!d.cliente.estado_cliente_id); setAvisoEstado(!!d.cliente.estado_cliente_id); }
      }).catch(() => {});
  }, []);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return undefined;

    const es = new EventSource(buildApiUrl('/api/realtime/productos'));

    const onProductosChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || '{}');
        if (payload?.initial) return; // Ignorar snapshot inicial

        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        if (!changes.length) return;

        const inserts = changes.filter(c => c?.op === 'insert' && c?.record);
        const updates = changes.filter(c => c?.op === 'update' && c?.record);
        const deletes = changes.filter(c => c?.op === 'delete');
        
        const insertIds = new Set(inserts.map(c => String(c?.id || c?.record?.id_producto || '')));
        const updateIds = new Set(updates.map(c => String(c?.id || c?.record?.id_producto || '')));
        const deleteIds = new Set(deletes.map(c => String(c?.id || '')));

        setProductos(prev => {
          const map = new Map((prev || []).map(p => [String(p.id_producto || p.id), p]));
          
          // Procesar eliminaciones
          deleteIds.forEach(id => map.delete(id));
          
          // Procesar actualizaciones e inserciones
          [...inserts, ...updates].forEach(change => {
            const id = String(change?.id || change?.record?.id_producto || '');
            if (id && change?.record) {
              map.set(id, change.record);
            }
          });

          return Array.from(map.values());
        });

        // Animar nuevos productos
        if (insertIds.size > 0) {
          setTimeout(() => {
            insertIds.forEach(id => {
              const el = document.querySelector(`[data-product-id="${id}"]`);
              if (el) {
                el.style.animation = 'none';
                setTimeout(() => {
                  el.style.animation = 'spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both';
                }, 10);
              }
            });
          }, 50);
        }

        // Animar productos editados
        if (updateIds.size > 0) {
          setTimeout(() => {
            updateIds.forEach(id => {
              const el = document.querySelector(`[data-product-id="${id}"]`);
              if (el) {
                animate(el, {
                  opacity: [1, 0.6, 1],
                  scale: [1, 1.02, 1],
                  duration: 400,
                  easing: 'easeInOutQuad'
                });
              }
            });
          }, 50);
        }
      } catch {
        // Ignorar payloads malformados
      }
    };

    es.addEventListener('productos_changed', onProductosChanged);

    return () => {
      es.removeEventListener('productos_changed', onProductosChanged);
      es.close();
    };
  }, []);

  useEffect(() => {
    const onStorage = e => { if (e.key === 'productos-updated-at') fetchProductos(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fetchProductos]);

  useEffect(() => {
    const onProductosUpdatedLocal = (e) => {
      const changes = e?.detail?.changes || [];
      applyRealtimeProductChanges(changes);
    };
    window.addEventListener('productos-updated-local', onProductosUpdatedLocal);
    return () => window.removeEventListener('productos-updated-local', onProductosUpdatedLocal);
  }, [applyRealtimeProductChanges]);

  useEffect(() => {
    fetch('/api/cortes/config').then(r => r.json()).then(j => { if (j?.success) setCostoCorte(j.costo_corte); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (cats.length > 0 && !catSel) {
      const t = setTimeout(() => setHeroIdx(i => (i + 1) % cats.length), 5000);
      return () => clearTimeout(t);
    }
  }, [heroIdx, cats.length, catSel]);

  useEffect(() => {
    if (catSel) { const i = cats.findIndex(c => c.categoria === catSel); if (i !== -1) setHeroIdx(i); }
  }, [catSel, cats]);

  const isCorte = p => { const c = (p?.categoria || '').toUpperCase(); return c.includes('VIDRIO') || c.includes('ALUMINIO'); };
  const openCorte = p => { setPCorte(p); setShowCorte(true); };
  const addPlancha = (p, qty) => {
    const stock = Number(p.cantidad ?? 0);
    const n = Number(qty);
    if (n > stock) { alert(`Solo hay ${stock} unidad${stock !== 1 ? 'es' : ''} disponible${stock !== 1 ? 's' : ''} de "${p.nombre}".`); return; }
    addOrMergePlancha(p, n);
    showToast(p);
  };
  const onCorteConfirm = ({ cortes, total }) => { if (pCorte) addCorte(pCorte, cortes || [], total || 0); setShowDrawer(false); setPCorte(null); };

  /* ── Búsqueda con soporte de precio ─────────────────────────── */
  const matchesPrecio = (p, term) => {
    const precio = Number(p.precio_unitario ?? 0);
    const t = term.trim();
    // "<100" → menor que, ">50" → mayor que, "=63" ó "63" → igual
    if (/^<\d+(\.\d+)?$/.test(t))  return precio < Number(t.slice(1));
    if (/^>\d+(\.\d+)?$/.test(t))  return precio > Number(t.slice(1));
    if (/^=\d+(\.\d+)?$/.test(t))  return precio === Number(t.slice(1));
    if (/^\d+(\.\d+)?$/.test(t))   return String(precio).startsWith(t) || precio === Number(t);
    return false;
  };

  const filtrados = (catSel
    ? productos.filter(p => p.categoria === catSel)
    : productos.filter(p =>
        (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(search.toLowerCase()) ||
        matchesPrecio(p, search)
      )
  );

  /* ── Infinite scroll ─────────────────────────────────────────── */
  const PAGE = 16; // productos por página
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinelRef = useRef(null);

  // reset al cambiar búsqueda o categoría
  useEffect(() => { setVisibleCount(PAGE); }, [search, catSel]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => Math.min(c + PAGE, filtrados.length));
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtrados.length]);

  // productos visibles para el layout editorial
  const vf = filtrados.slice(0, visibleCount);

  const g1    = vf.slice(0, 8);
  const ed1   = vf[8] || null;
  const g2    = vf.slice(9, 17);
  const mos   = vf.slice(17, 21);
  const hstrip = vf.slice(21, 24);
  const dark  = vf.slice(24, 27);
  const zig1  = vf[27] || null;
  const zig2  = vf[28] || null;
  const g3    = vf.slice(29, 35);
  const rest  = vf.slice(35);

  const cp = { onAdd: addPlancha, onCorte: openCorte, blocked: blocked && avisoEstado };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#f9fafb', minHeight: '100vh', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        :root{--r:#941918;--r2:#c94543;--dk:#0f172a;--md:#475569;--sf:#94a3b8;}
        @keyframes heroIn{from{opacity:0;transform:scale(1.05)}to{opacity:1;transform:scale(1)}}
        @keyframes skShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes toastIn{0%{opacity:0;transform:translateX(110%)}60%{transform:translateX(-8px)}100%{opacity:1;transform:translateX(0)}}
        @keyframes toastOut{0%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(110%)}}
        @keyframes spring-in{0%{opacity:0;transform:scale(0.5) translateY(20px)}60%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1) translateY(0)}}

        /* ── HERO ── */
        .hero{position:relative;height:clamp(300px,52vw,560px);overflow:hidden;background:#0f172a}
        .hl{position:absolute;inset:0;transition:opacity .85s ease}
        .hl img{width:100%;height:100%;object-fit:cover;animation:heroIn .85s ease-out}
        .hg{position:absolute;inset:0;background:linear-gradient(to right,rgba(10,18,35,.76) 0%,rgba(10,18,35,.26) 62%,transparent 100%)}
        .ht{position:absolute;left:clamp(24px,6vw,80px);bottom:clamp(32px,7vw,70px);z-index:5}
        .hey{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:10px}
        .hh1{font-family:'Playfair Display',serif;font-size:clamp(28px,5vw,58px);font-weight:900;color:#fff;margin:0 0 22px;line-height:1.08;letter-spacing:-.02em;max-width:480px}
        .hbtn{background:var(--r);color:#fff;border:none;padding:13px 30px;border-radius:50px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 8px 28px rgba(148,25,24,.4);transition:transform .2s,box-shadow .2s}
        .hbtn:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(148,25,24,.5)}
        .hnav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.42);background:rgba(255,255,255,.12);backdrop-filter:blur(10px);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s,transform .2s;z-index:10}
        .hnav:hover{background:rgba(255,255,255,.26);transform:translateY(-50%) scale(1.1)}
        .hdots{position:absolute;bottom:18px;right:24px;display:flex;gap:7px;z-index:10}
        .hdot{height:8px;border:none;border-radius:999px;cursor:pointer;padding:0;background:rgba(255,255,255,.36);transition:all .3s}
        .hdot.on{width:28px;background:#fff}.hdot:not(.on){width:8px}

        /* ── CAT TILES ── */
        .ctt{position:relative;border-radius:14px;overflow:hidden;cursor:pointer;background:#e2e8f0}
        .ctt img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.22,1,.36,1)}
        .ctt:hover img,.ctt.sel img{transform:scale(1.08)}
        .ctov{position:absolute;inset:0;background:rgba(15,23,42,.32);transition:background .3s;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:18px 14px;gap:4px}
        .ctt:hover .ctov{background:rgba(15,23,42,.5)}.ctt.sel .ctov{background:rgba(148,25,24,.55)}
        .ctn{font-family:'Playfair Display',serif;font-size:clamp(13px,2vw,18px);font-weight:800;color:#fff;text-align:center;line-height:1.2}
        .cts{font-size:10px;font-weight:600;color:rgba(255,255,255,.78);letter-spacing:.1em;text-transform:uppercase}

        .slbl{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--r);margin-bottom:5px}
        .sttl{font-family:'Playfair Display',serif;font-size:clamp(20px,3vw,30px);font-weight:800;color:var(--dk);margin:0 0 6px;line-height:1.15}

        /* ── STD CARD ── */
        .pc{background:#fff;border-radius:16px;overflow:visible;border:1px solid rgba(0,0,0,.07);box-shadow:0 2px 12px rgba(15,23,42,.06);transition:transform .32s cubic-bezier(.34,1.56,.64,1),box-shadow .32s;display:flex;flex-direction:column;position:relative}
        .pc:hover{transform:translateY(-8px);box-shadow:0 22px 48px rgba(15,23,42,.13)}
        .pc-img-wrap{position:relative;overflow:hidden;background:#f1f5f9;border-radius:16px 16px 0 0;aspect-ratio:1/1}
        .pc-chip{position:absolute;top:10px;left:10px;background:rgba(255,255,255,.93);color:#0f172a;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:999px;border:1px solid rgba(0,0,0,.07);z-index:2}
        .pc-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s cubic-bezier(.34,1.56,.64,1),filter .3s}
        .pc-hover-layer{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .25s;background:rgba(15,23,42,.06)}
        .btn-circ{background:var(--r);color:#fff;border:none;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(148,25,24,.4);transition:transform .22s,box-shadow .22s}
        .btn-circ:hover{transform:scale(1.12);box-shadow:0 12px 32px rgba(148,25,24,.5)}
        .pc-body{padding:14px 16px 16px;flex:1;display:flex;flex-direction:column;gap:5px;border-top:1px solid rgba(0,0,0,.05)}
        .pc-name{font-family:'Playfair Display',serif;font-weight:700;font-size:15px;color:var(--dk);line-height:1.2;letter-spacing:-.01em}
        .pc-desc{font-size:11.5px;color:var(--sf);line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px;border-top:1px solid rgba(0,0,0,.05)}
        .pc-price{font-family:'Playfair Display',serif;font-size:19px;font-weight:800;color:var(--r);letter-spacing:-.03em}
        .pc-curr{font-size:11px;font-weight:600;color:var(--sf);margin-right:2px}
        .pc-consult{color:var(--sf);font-size:13px}
        .badge-stk{font-size:10px;font-weight:600;color:#10b981;background:#ecfdf5;padding:3px 9px;border-radius:999px;border:1px solid #a7f3d0}
        .badge-stk-red{color:#dc2626;background:#fef2f2;border-color:#fca5a5}

        /* ── QTY POP ── */
        .qpop{position:absolute;left:50%;transform:translateX(-50%);background:#fff;border:1.5px solid var(--r);border-radius:14px;padding:16px 18px;box-shadow:0 20px 48px rgba(0,0,0,.22);z-index:200;min-width:min(220px,80vw);max-width:90vw;box-sizing:border-box;white-space:normal}
        .qpop-above{bottom:calc(100% + 12px)}.qpop-below{top:calc(100% + 12px)}
        /* En pantallas pequeñas: centrado fijo en pantalla para no salirse */
        @media(max-width:640px){
          .qpop{
            position:fixed!important;
            left:50%!important;
            top:50%!important;
            bottom:auto!important;
            right:auto!important;
            transform:translate(-50%,-50%)!important;
            width:min(300px,90vw)!important;
            max-width:90vw!important;
            z-index:2000!important;
            box-shadow:0 28px 60px rgba(0,0,0,.36);
            border-radius:18px;
          }
          .qpop-arrow{display:none!important}
        }
        .qpop-arrow{position:absolute;left:50%;transform:translateX(-50%);border:8px solid transparent}
        .qpop-arr-above{top:100%;border-top-color:var(--r)}.qpop-arr-below{bottom:100%;border-bottom-color:var(--r)}
        .qpop-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sf);margin-bottom:10px}
        .qpop-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .qst{width:30px;height:30px;border-radius:8px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:17px;font-weight:700;color:var(--md);display:flex;align-items:center;justify-content:center}
        .qinp{width:52px;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:15px;font-weight:700;text-align:center;font-family:'DM Sans',sans-serif}
        .qinp:focus{outline:none;border-color:var(--r)}
        .qpop-btns{display:flex;flex-direction:column;gap:8px}
        .qbtn-ok{background:linear-gradient(135deg,var(--r),var(--r2));color:#fff;border:none;border-radius:8px;padding:11px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%;transition:transform .2s}
        .qbtn-ok:hover{transform:translateY(-1px)}
        .qbtn-x{background:transparent;color:var(--md);border:1.5px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%;text-align:center;transition:background .18s,border-color .18s}
        .qbtn-x:hover{background:#fee2e2;border-color:#fca5a5;color:#dc2626}

        /* ── EDITORIAL ── */
        .ed{display:flex;border-radius:20px;overflow:hidden;min-height:clamp(260px,36vw,450px);box-shadow:0 20px 52px rgba(15,23,42,.12)}
        .ed-img-wrap{flex:1.2;position:relative;overflow:hidden;min-height:260px}
        .ed-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s ease}
        .ed:hover .ed-img{transform:scale(1.05)}
        .ed-img-ov{position:absolute;inset:0;background:linear-gradient(135deg,rgba(148,25,24,.06),rgba(15,23,42,.04))}
        .ed-text{flex:1;background:linear-gradient(160deg,#fff 0%,#f8f9ff 100%);padding:clamp(28px,4vw,54px);display:flex;flex-direction:column;justify-content:center;gap:16px}
        .ed-eyebrow{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--r)}
        .ed-h2{font-family:'Playfair Display',serif;font-size:clamp(22px,3.5vw,38px);font-weight:900;color:var(--dk);line-height:1.12;letter-spacing:-.02em;margin:0}
        .ed-p{font-size:14px;color:var(--md);line-height:1.65;max-width:340px;margin:0}
        .ed-pills{display:flex;flex-wrap:wrap;gap:8px}
        .pill{font-size:11px;font-weight:600;color:var(--md);background:#f1f5f9;border:1px solid #e2e8f0;padding:5px 12px;border-radius:999px}
        .ed-cta{display:inline-flex;align-items:center;gap:8px;background:var(--dk);color:#fff;border:none;padding:13px 24px;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;align-self:flex-start;transition:background .22s,transform .22s;letter-spacing:.04em}
        .ed-cta:hover{background:var(--r);transform:translateX(3px)}
        @media(max-width:640px){.ed{flex-direction:column!important}.ed-img-wrap{min-height:200px;flex:none}.ed-text{border-left:1px solid rgba(0,0,0,.07)!important;border-right:none!important;border-top:none}}

        /* ── MOSAIC ── */
        .mos4{display:grid;grid-template-columns:1.1fr 1fr;grid-template-rows:clamp(320px,42vw,520px);gap:14px;border-radius:20px;overflow:visible}
        .mos4-stack{display:flex;flex-direction:column;gap:14px}
        .mos-card{position:relative;overflow:hidden;border-radius:14px;cursor:pointer;flex:1}
        .mos-big{height:100%}
        .mos-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .48s cubic-bezier(.34,1.56,.64,1)}
        .mos-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,18,35,.76) 0%,rgba(10,18,35,.16) 55%,transparent 100%);transition:opacity .3s}
        .mos-info{position:absolute;bottom:0;left:0;right:0;padding:16px 20px;display:flex;flex-direction:column;gap:3px}
        .mos-cat{font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.7)}
        .mos-name{font-family:'Playfair Display',serif;font-size:clamp(13px,1.8vw,18px);font-weight:800;color:#fff;line-height:1.2}
        .mos-price{font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-top:2px}
        .mos-sub{font-size:11px;color:rgba(255,255,255,.62);letter-spacing:.06em;text-transform:uppercase}
        .mos-btn{position:absolute;top:14px;right:14px;background:var(--r);color:#fff;border:none;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(148,25,24,.38);transition:transform .2s}
        .mos-btn:hover{transform:scale(1.12)}
        .mos-stock-msg{position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px}
        @media(max-width:600px){.mos4{grid-template-columns:1fr;grid-template-rows:auto}.mos4-stack{flex-direction:row}.mos-card{min-height:160px}}

        /* ── H STRIP ── */
        .hstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .hsc{background:#fff;border-radius:16px;overflow:visible;border:1px solid rgba(0,0,0,.07);box-shadow:0 2px 12px rgba(15,23,42,.06);transition:transform .32s cubic-bezier(.34,1.56,.64,1),box-shadow .32s;display:flex;flex-direction:column}
        .hsc:hover{transform:translateY(-8px);box-shadow:0 22px 48px rgba(15,23,42,.12)}
        .hsc-img-wrap{position:relative;overflow:hidden;aspect-ratio:16/10;border-radius:16px 16px 0 0}
        .hsc-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
        .hsc-ov{position:absolute;inset:0}
        .hsc-body{padding:18px 20px 20px;flex:1;display:flex;flex-direction:column;gap:6px}
        .hsc-num{font-family:'Playfair Display',serif;font-size:38px;font-weight:900;line-height:1;opacity:.18;letter-spacing:-.03em}
        .hsc-name{font-family:'Playfair Display',serif;font-weight:800;font-size:17px;color:var(--dk);line-height:1.2}
        .hsc-desc{font-size:12px;color:var(--sf);line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .hsc-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:12px;border-top:1px solid rgba(0,0,0,.05)}
        .hsc-price{font-family:'Playfair Display',serif;font-size:20px;font-weight:800;letter-spacing:-.03em}
        .hsc-btn{color:#fff;border:none;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .22s;flex-shrink:0}
        .hsc-btn:hover{transform:scale(1.12)}
        @media(max-width:640px){.hstrip{grid-template-columns:1fr}}

        /* ── DARK SPOT ── */
        .dspot{background:linear-gradient(160deg,#0f172a 0%,#1a2744 100%);border-radius:24px;padding:clamp(28px,4vw,52px)}
        .dspot-header{text-align:center;margin-bottom:36px}
        .dspot-eyebrow{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:8px}
        .dspot-h2{font-family:'Playfair Display',serif;font-size:clamp(22px,4vw,36px);font-weight:900;color:#fff;margin:0;line-height:1.1}
        .dspot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .dsc{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:visible;transition:transform .3s,box-shadow .3s;display:flex;flex-direction:column}
        .dsc:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.12)}
        .dsc-img-wrap{position:relative;overflow:hidden;aspect-ratio:1/1;border-radius:16px 16px 0 0}
        .dsc-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s cubic-bezier(.34,1.56,.64,1),filter .3s}
        .dsc-btn{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);background:var(--r);color:#fff;border:none;border-radius:50px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:7px;white-space:nowrap;box-shadow:0 6px 20px rgba(148,25,24,.45)}
        .dsc-btn:hover{transform:translateX(-50%) scale(1.05)}
        .dsc-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:5px}
        .dsc-cat{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.45)}
        .dsc-name{font-family:'Playfair Display',serif;font-weight:800;font-size:16px;color:#fff;line-height:1.2}
        .dsc-price{font-size:18px;font-weight:800;color:var(--r2);font-family:'Playfair Display',serif;letter-spacing:-.02em}
        @media(max-width:640px){.dspot-grid{grid-template-columns:1fr}}

        /* ── ZIGZAG ── */
        .zig{display:flex;border-radius:20px;overflow:visible;box-shadow:0 16px 48px rgba(15,23,42,.1)}
        .zig-img{flex:1.1;position:relative;overflow:hidden;min-height:320px;border-radius:20px 0 0 20px}
        .zig-photo{width:100%;height:100%;object-fit:cover;display:block;transition:transform .55s ease}
        .zig:hover .zig-photo{transform:scale(1.04)}
        .zig-badge{position:absolute;top:20px;left:20px;background:var(--r);color:#fff;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 12px;border-radius:999px}
        .zig-text{flex:1;background:#fff;padding:clamp(28px,4vw,52px);display:flex;flex-direction:column;justify-content:center;gap:14px;border:1px solid rgba(0,0,0,.07);border-radius:0 20px 20px 0}
        .zig-num{font-family:'Playfair Display',serif;font-size:72px;font-weight:900;color:rgba(148,25,24,.08);line-height:1;margin-bottom:-16px;letter-spacing:-.04em}
        .zig-h3{font-family:'Playfair Display',serif;font-size:clamp(20px,3vw,32px);font-weight:900;color:var(--dk);margin:0;line-height:1.15}
        .zig-p{font-size:14px;color:var(--md);line-height:1.65;margin:0;max-width:320px}
        .zig-meta{display:flex;flex-direction:column;gap:8px}
        .zig-row{display:flex;align-items:center;gap:12px}
        .zig-k{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sf);width:60px}
        .zig-v{font-size:13px;font-weight:600;color:var(--dk)}
        .zig-price{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:var(--r);letter-spacing:-.03em}
        .zig-btn{display:inline-flex;align-items:center;gap:8px;background:var(--r);color:#fff;border:none;padding:13px 24px;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;align-self:flex-start;transition:background .22s,transform .22s;letter-spacing:.04em;box-shadow:0 8px 24px rgba(148,25,24,.32)}
        .zig-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(148,25,24,.4)}
        @media(max-width:640px){.zig{flex-direction:column!important}.zig-img{min-height:220px;flex:none;border-radius:20px 20px 0 0}.zig-text{border-radius:0 0 20px 20px}}

        /* ── DIVIDER ── */
        .sdiv{display:flex;align-items:center;gap:16px;margin:52px 0 40px}
        .sdiv-line{flex:1;height:1px;background:linear-gradient(to right,rgba(148,25,24,.35),rgba(148,25,24,.08),transparent)}
        .sdiv-line-r{background:linear-gradient(to left,rgba(148,25,24,.35),rgba(148,25,24,.08),transparent)}
        .sdiv-pill{background:var(--r);color:#fff;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:6px 18px;border-radius:999px;white-space:nowrap}

        /* ── GRID ── */
        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(200px,44vw),1fr));gap:20px}
        @media(max-width:480px){.pgrid{grid-template-columns:repeat(2,1fr);gap:10px}}

        /* ── SEARCH ── */
        .swrap{position:relative;flex:0 1 340px}
        .swrap input{width:100%;padding:12px 18px 12px 46px;border:1.5px solid rgba(148,25,24,.18);border-radius:50px;font-size:15px;font-family:'DM Sans',sans-serif;background:#fff;color:var(--dk);box-shadow:0 4px 18px rgba(0,0,0,.06);transition:border-color .2s,box-shadow .2s;outline:none;box-sizing:border-box}
        .swrap input:focus{border-color:var(--r);box-shadow:0 4px 24px rgba(148,25,24,.15)}
        .sico{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--sf);pointer-events:none}

        /* ── MISC ── */
        .rbtn{background:none;border:1.5px solid var(--r);color:var(--r);padding:9px 22px;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .22s;letter-spacing:.04em}
        .rbtn:hover{background:var(--r);color:#fff}
        .wbanner{background:linear-gradient(135deg,#fef9ee,#fef3c7);border:1.5px solid #f59e0b;border-radius:14px;padding:13px 20px;color:#92400e;font-weight:600;font-size:14px;display:flex;align-items:center;gap:10px}

        /* ── SKELETON shimmer ── */
        .sk-shimmer{background:linear-gradient(90deg,#e8edf2 25%,#f5f7fa 50%,#e8edf2 75%);background-size:200% 100%;animation:skShimmer 1.6s ease-in-out infinite}

        /* ══ RESPONSIVE GLOBAL ══════════════════════════════════════════ */

        /* ── Tablet (≤768px) ── */
        @media(max-width:768px){
          /* hero */
          .hero{height:clamp(260px,55vw,400px)}
          .hh1{font-size:clamp(22px,5.5vw,38px)}
          .ht{left:20px;bottom:28px}

          /* cat tiles */
          .ctt{height:clamp(110px,18vw,170px)!important}

          /* search */
          .swrap{flex:1;min-width:0}

          /* std card */
          .pgrid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
          .pc-name{font-size:14px}

          /* editorial */
          .ed{flex-direction:column!important;min-height:auto}
          .ed-img-wrap{min-height:220px;flex:none;border-radius:0}
          .ed-text{padding:24px 20px;border-left:none!important;border-right:none!important;border-top:1px solid rgba(0,0,0,.07)}
          .ed-h2{font-size:clamp(20px,4vw,28px)}

          /* mosaic */
          .mos4{grid-template-columns:1fr;grid-template-rows:auto}
          .mos4-stack{flex-direction:row;gap:10px}
          .mos-card{min-height:150px}

          /* h-strip */
          .hstrip{grid-template-columns:repeat(2,1fr);gap:14px}

          /* dark spotlight */
          .dspot-grid{grid-template-columns:repeat(2,1fr);gap:14px}
          .dspot{padding:28px 20px;border-radius:16px}

          /* zigzag */
          .zig{flex-direction:column!important;border-radius:16px}
          .zig-img{min-height:200px;flex:none;border-radius:16px 16px 0 0}
          .zig-text{padding:22px 20px;border-radius:0 0 16px 16px}
          .zig-num{font-size:52px}
          .zig-price{font-size:24px}

          /* divider */
          .sdiv{margin:36px 0 28px}
        }

        /* ── Mobile (≤480px) ── */
        @media(max-width:480px){
          /* hero */
          .hero{height:clamp(220px,72vw,340px)}
          .hh1{font-size:clamp(18px,7vw,30px);margin-bottom:14px}
          .hbtn{padding:10px 22px;font-size:12px}
          .hnav{width:36px;height:36px}
          .ht{left:14px;bottom:20px}

          /* cat tiles */
          .ctt{height:clamp(90px,24vw,140px)!important}
          .ctn{font-size:13px}

          /* search wrap */
          .swrap{flex:1 1 100%}

          /* std card — fuerza 2 columnas simétricas */
          .pgrid{grid-template-columns:repeat(2,1fr);gap:10px}
          .pc{border-radius:12px}
          .pc-img-wrap{border-radius:12px 12px 0 0;aspect-ratio:1/1}
          .pc-name{font-size:12px;line-height:1.25}
          .pc-price{font-size:15px}
          .pc-desc{display:none}
          .btn-circ{width:36px;height:36px}
          .pc-body{padding:10px 12px 12px;gap:4px}
          .pc-foot{padding-top:8px}

          /* editorial */
          .ed-text{padding:18px 16px 22px}
          .ed-h2{font-size:clamp(18px,5vw,24px)}
          .ed-p{font-size:13px}

          /* mosaic */
          .mos4-stack{flex-direction:column}
          .mos-card{min-height:130px}
          .mos-name{font-size:13px}

          /* h-strip */
          .hstrip{grid-template-columns:1fr;gap:12px}

          /* dark spotlight */
          .dspot-grid{grid-template-columns:1fr}
          .dspot{padding:22px 14px;border-radius:14px}
          .dspot-h2{font-size:clamp(20px,5.5vw,28px)}

          /* zigzag */
          .zig-text{padding:18px 16px 22px}
          .zig-h3{font-size:clamp(18px,5vw,24px)}
          .zig-price{font-size:22px}
          .zig-btn{padding:11px 20px;font-size:12px}

          /* divider */
          .sdiv{margin:28px 0 20px}
          .sdiv-pill{font-size:9px;padding:5px 13px}

          /* qty popover */
          .qpop{min-width:180px;padding:13px 14px}

          /* drawer detalle */
          .pz-drawer{width:100vw;max-width:100vw;padding:18px 16px}
        }`}</style>

      {/* MODALS */}
      {showCorte && <CorteModal producto={pCorte}
        onSelectPlancha={(qty) => { setShowCorte(false); if (pCorte) addPlancha(pCorte, qty || 1); }}
        onSelectCorte={() => { setShowCorte(false); setShowDrawer(true); }}
        onClose={() => { setShowCorte(false); setPCorte(null); }} />}
      {showDrawer && <CortesDrawer producto={pCorte} costoCorte={costoCorte} onConfirm={onCorteConfirm}
        onClose={() => { setShowDrawer(false); setPCorte(null); }} />}

      {/* ══ HERO ══ */}
      {cats.length > 0 && (
        <div className="hero">
          {cats.map((c, i) => (
            <div key={c.categoria} className="hl" style={{ opacity: i === heroIdx ? 1 : 0, pointerEvents: i === heroIdx ? 'auto' : 'none' }}>
              <img src={c.IMG_P?.startsWith('http') ? c.IMG_P : DEFAULT_IMG} alt={c.categoria}
                onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
              <div className="hg" />
            </div>
          ))}
          <div className="ht">
            <div className="hey">Categoría destacada</div>
            <h1 className="hh1">{cats[heroIdx]?.categoria}</h1>
            <button className="hbtn" onClick={() => setCatSel(cats[heroIdx]?.categoria)}>Explorar categoría</button>
          </div>
          <button className="hnav" style={{ left: 20 }} onClick={() => setHeroIdx(i => i === 0 ? cats.length - 1 : i - 1)}><IconChevronLeft size={20} stroke={2} /></button>
          <button className="hnav" style={{ right: 20 }} onClick={() => setHeroIdx(i => (i + 1) % cats.length)}><IconChevronRight size={20} stroke={2} /></button>
          <div className="hdots">{cats.map((_, i) => <button key={i} className={`hdot ${i === heroIdx ? 'on' : ''}`} onClick={() => setHeroIdx(i)} />)}</div>
        </div>
      )}

      {/* ══ BODY ══ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(10px,3vw,40px)', overflowX: 'hidden', boxSizing: 'border-box' }}>

        {cats.length > 0 && (
          <section style={{ padding: '50px 0 36px' }}>
            <div style={{ marginBottom: 24 }}>
              <div className="slbl">Explorar por tipo</div>
              <h2 className="sttl">Categorías</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cats.length, 3)},1fr)`, gap: 14 }}>
              {cats.map(c => (
                <div key={c.categoria} className={`ctt ${catSel === c.categoria ? 'sel' : ''}`}
                  style={{ height: 'clamp(130px,17vw,210px)' }}
                  onClick={() => setCatSel(catSel === c.categoria ? null : c.categoria)}>
                  <img src={c.IMG_P?.startsWith('http') ? c.IMG_P : DEFAULT_IMG} alt={c.categoria}
                    onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
                  <div className="ctov">
                    <span className="ctn">{c.categoria}</span>
                    <span className="cts">{catSel === c.categoria ? '✓ Seleccionado' : 'Ver productos'}</span>
                  </div>
                </div>
              ))}
            </div>
            {catSel && <div style={{ marginTop: 18, textAlign: 'center' }}><button className="rbtn" onClick={() => setCatSel(null)}>Ver todas las categorías</button></div>}
          </section>
        )}

        {blocked && avisoEstado && <div className="wbanner" style={{ marginBottom: 28 }}>⚠️ Tienes un pedido pendiente. Termínalo antes de agregar más productos.</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, paddingBottom: 28 }}>
          <div>
            <div className="slbl">Catálogo</div>
            <h2 className="sttl">{catSel || 'Todos los Productos'}</h2>
            {!loading && (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                Mostrando {Math.min(visibleCount, filtrados.length)} de {filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div className="swrap">
            <span className="sico"><IconSearch size={17} stroke={1.8} /></span>
            <input type="text" placeholder="Nombre, categoría o precio (ej: 63, <100, >50)..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* ── LOADING skeleton ── */}
        {loading && <LoadingGrid count={8} />}

        {/* ── ERROR con skeleton pulsante ── */}
        {!loading && error && (
          <div>
            <LoadingGrid count={8} />
            <div style={{
              marginTop: 20,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 10,
              border: '1px solid rgba(128,194,220,0.55)',
              background: 'linear-gradient(135deg,rgba(0,20,50,0.97),rgba(0,35,70,0.99))',
              boxShadow: '0 0 22px rgba(128,194,220,0.25),0 4px 18px rgba(0,0,0,0.5)',
              fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
              color: 'rgba(200,235,255,0.95)', letterSpacing: '0.02em',
            }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#80C2DC,#4fa8cc)', color: '#001428', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>!</span>
              {error} —{' '}
              <button onClick={fetchProductos} style={{ background: 'none', border: 'none', color: '#80C2DC', cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: 0, textDecoration: 'underline' }}>
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* ── CONTENIDO ── */}
        {!loading && !error && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#64748b', marginBottom: 6 }}>Sin resultados</div>
            <div style={{ fontSize: 14 }}>Intenta con otro término o categoría.</div>
          </div>
        )}

        {!loading && !error && filtrados.length > 0 && (<>
          {g1.length > 0 && (
            <AnimatedGrid items={g1} animKey={animKey} renderItem={(p, i) =>
              <Card key={p.id_producto || p.codigo || i} p={p} esCorte={isCorte(p)} {...cp} />
            } />
          )}
          {ed1 && (<><Div label="Producto Destacado" /><EditorialBanner p={ed1} reverse={false} onClick={p => setProductoDetalle(p)} /></>)}
          {g2.length > 0 && (
            <AnimatedGrid items={g2} animKey={`g2-${animKey}`} style={{ marginTop: ed1 ? 52 : 0 }} renderItem={(p, i) =>
              <Card key={p.id_producto || p.codigo || i} p={p} esCorte={isCorte(p)} {...cp} />
            } />
          )}
          {mos.length > 0 && (<><Div label="También te puede interesar" /><Mosaic4 productos={mos} esCorte={isCorte} {...cp} /></>)}
          {hstrip.length > 0 && (<><Div label="Selección del día" /><HStrip productos={hstrip} esCorte={isCorte} {...cp} /></>)}
          {dark.length > 0 && (<><Div label="Materiales Premium" /><DarkSpotlight productos={dark} esCorte={isCorte} {...cp} /></>)}
          {(zig1 || zig2) && (
            <>
              <Div label="En detalle" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {zig1 && <ZigzagPair p={zig1} reverse={false} esCorte={isCorte} {...cp} />}
                {zig2 && <ZigzagPair p={zig2} reverse={true} esCorte={isCorte} {...cp} />}
              </div>
            </>
          )}
          {g3.length > 0 && (
            <>
              <Div label="Más productos" />
              <AnimatedGrid items={g3} animKey={`g3-${animKey}`} renderItem={(p, i) =>
                <Card key={p.id_producto || p.codigo || i} p={p} esCorte={isCorte(p)} {...cp} />
              } />
            </>
          )}
          {rest.length > 0 && filtrados[29] && (<><Div label="Producto Especial" /><EditorialBanner p={filtrados[29]} reverse={true} onClick={p => setProductoDetalle(p)} /></>)}
          {rest.length > 1 && (
            <AnimatedGrid items={rest.slice(1)} animKey={`rest-${animKey}`} style={{ marginTop: 52, paddingBottom: 64 }} renderItem={(p, i) =>
              <Card key={p.id_producto || p.codigo || i} p={p} esCorte={isCorte(p)} {...cp} />
            } />
          )}
          <div style={{ paddingBottom: 60 }} />

          {/* ── Sentinel de infinite scroll ── */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* Indicador de carga al final */}
          {visibleCount < filtrados.length && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '32px 0', color: '#94a3b8' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2.5px solid #e2e8f0',
                borderTopColor: '#941918',
                animation: 'spin 0.7s linear infinite',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Cargando más productos…</span>
            </div>
          )}
        </>)}
      </div>

      {/* ── DETALLE DE PRODUCTO — panel izquierdo con animación ── */}
      {productoDetalle && (
        <DetallePanel
          p={productoDetalle}
          onClose={() => setProductoDetalle(null)}
          onAdd={(p) => { if (isCorte(p)) { setProductoDetalle(null); openCorte(p); } else { addPlancha(p, 1); setProductoDetalle(null); } }}
          blocked={blocked && avisoEstado}
        />
      )}

      {/* ── TOAST: producto agregado ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 'clamp(16px,3vw,32px)', right: 'clamp(16px,3vw,32px)',
          zIndex: 2000, display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', borderRadius: 16,
          background: 'linear-gradient(135deg,rgba(0,18,46,0.97),rgba(0,30,62,0.99))',
          border: '1px solid rgba(128,194,220,0.45)',
          boxShadow: '0 0 28px rgba(128,194,220,0.2),0 8px 32px rgba(0,0,0,0.55)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          animation: 'toastIn .45s cubic-bezier(.22,1,.36,1) both',
          maxWidth: 'min(360px,90vw)', fontFamily: "'DM Sans',sans-serif",
          overflow: 'hidden',
        }}>
          <img src={toast.img} alt={toast.nombre}
            style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(128,194,220,0.35)' }}
            onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMG; }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#10b981' }}>Agregado al carrito</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,235,255,0.92)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {toast.nombre}
            </div>
          </div>
          <button onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 16, lineHeight: 1, padding: 4, flexShrink: 0, transition: 'color .18s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}>✕</button>
          {/* Barra de progreso */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#941918,#80C2DC,#ffd600)', animation: 'toastOut 3.2s linear forwards' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;