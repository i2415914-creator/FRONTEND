import React, { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────
   DemoDisenoBarra  –  5 opciones visuales para elegir el diseño de
   seguimiento de pedido / servicio.
   Ruta temporal:  /demo-barra
───────────────────────────────────────────────────────────────────── */

const DEMO_PROGRESO = 65;
const DEMO_ESTADO   = "En taller";

/* Hook reutilizable: anima suavemente un valor numérico hacia target */
function useAnimatedValue(target) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setVal(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.3) { clearInterval(id); return target; }
        return prev + diff * 0.12;
      });
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return val;
}

/* ════════════════════════════════════════════════════════════════════
   OPCIÓN 1 – "Segmentos" estilo videojuego / energía
════════════════════════════════════════════════════════════════════ */
function Opcion1({ val }) {
  const segments = 20;
  const filled   = Math.round((val / 100) * segments);
  return (
    <div style={card}>
      <style>{`
        @keyframes seg-pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        @keyframes seg-last  { 0%,100%{box-shadow:0 0 6px #f43f5e} 50%{box-shadow:0 0 18px #f43f5e,0 0 32px #fb7185} }
      `}</style>
      <Header title="Opción 1 — Energía" sub="Segmentos estilo carga" color="#dc2626" />
      <StatusRow estado={DEMO_ESTADO} val={val} color="#dc2626" />
      <div style={{ display:"flex", gap: 4, margin:"14px 0 12px" }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 28, borderRadius: 4,
              background: i < filled
                ? `linear-gradient(180deg, #fb7185 0%, #dc2626 60%, #991b1b 100%)`
                : "rgba(229,231,235,0.6)",
              border: i < filled ? "1px solid rgba(251,113,133,0.5)" : "1px solid #e5e7eb",
              boxShadow: i < filled ? "inset 0 1px 0 rgba(255,255,255,0.35)" : "none",
              animation: i === filled - 1 ? "seg-last 1.2s ease-in-out infinite" : "none",
              transition: "background .2s, box-shadow .2s",
            }}
          />
        ))}
      </div>
      <Steps steps={STEPS_P} active={1} accentColor="#dc2626" lightColor="#fef2f2" borderColor="#fca5a5" textColor="#991b1b" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OPCIÓN 2 – "Circular" anillo SVG con porcentaje grande
════════════════════════════════════════════════════════════════════ */
function Opcion2({ val }) {
  const r   = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;
  return (
    <div style={{ ...card, display:"flex", gap:18, alignItems:"center" }}>
      <style>{`
        @keyframes ring-glow { 0%,100%{filter:drop-shadow(0 0 4px #c94543)} 50%{filter:drop-shadow(0 0 14px #f43f5e)} }
      `}</style>
      <div style={{ flexShrink: 0, position:"relative", width:130, height:130 }}>
        <svg width="130" height="130" style={{ transform:"rotate(-90deg)", animation:"ring-glow 2s ease-in-out infinite" }}>
          <circle cx="65" cy="65" r={r} fill="none" stroke="#fee2e2" strokeWidth="13" />
          <circle
            cx="65" cy="65" r={r} fill="none"
            stroke="url(#grad2)" strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition:"stroke-dashoffset .5s cubic-bezier(0.22,1,0.36,1)" }}
          />
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#941918" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:26, fontWeight:900, color:"#991b1b", lineHeight:1 }}>{Math.round(val)}%</span>
          <span style={{ fontSize:10, color:"#9ca3af", fontWeight:700, letterSpacing:0.5, marginTop:2 }}>AVANCE</span>
        </div>
      </div>
      <div style={{ flex:1 }}>
        <Header title="Opción 2 — Circular" sub="Anillo con porcentaje" color="#dc2626" />
        <StatusRow estado={DEMO_ESTADO} val={val} color="#dc2626" />
        <Steps steps={STEPS_P} active={1} accentColor="#dc2626" lightColor="#fef2f2" borderColor="#fca5a5" textColor="#991b1b" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OPCIÓN 3 – "Dark Neon" fondo oscuro con brillo
════════════════════════════════════════════════════════════════════ */
function Opcion3({ val }) {
  return (
    <div style={{ ...card, background:"linear-gradient(145deg,#0f0f1a,#1a0a10)", border:"1px solid rgba(241,78,78,0.25)" }}>
      <style>{`
        @keyframes neon-shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(220%)} }
        @keyframes neon-knob { 0%,100%{box-shadow:0 0 0 2px rgba(248,65,65,0.2),0 0 12px #f43f5e} 50%{box-shadow:0 0 0 4px rgba(248,65,65,0.1),0 0 28px #f43f5e,0 0 50px rgba(248,65,65,0.35)} }
      `}</style>
      <Header title="Opción 3 — Dark Neon" sub="Brillo moderno oscuro" color="#f87171" dark />
      <StatusRow estado={DEMO_ESTADO} val={val} color="#f87171" dark />
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:11, color:"rgba(248,113,113,0.7)", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>progreso</span>
          <span style={{ fontSize:13, color:"#f87171", fontWeight:900 }}>{Math.round(val)}%</span>
        </div>
        <div style={{ position:"relative", height:18, borderRadius:999, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(248,113,113,0.18)", overflow:"hidden" }}>
          <div style={{ width:`${val}%`, height:"100%", background:"linear-gradient(90deg,#7f1d1d,#dc2626,#f87171)", borderRadius:999, position:"relative", overflow:"hidden", boxShadow:"0 0 20px rgba(248,113,113,0.5)", transition:"width .5s cubic-bezier(0.22,1,0.36,1)" }}>
            <span style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(90deg,rgba(255,255,255,0.06) 0 10px,transparent 10px 20px)" }} />
            <span style={{ position:"absolute", top:0, bottom:0, width:"40%", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)", animation:"neon-shimmer 1.6s ease-in-out infinite" }} />
          </div>
          <span style={{ position:"absolute", top:"50%", left:`calc(${Math.min(val,100)}% - 9px)`, width:18, height:18, borderRadius:"50%", background:"radial-gradient(circle at 35% 35%,#fca5a5,#ef4444 60%,#7f1d1d)", animation:"neon-knob 1.6s ease-in-out infinite", pointerEvents:"none" }} />
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {STEPS_P.map((s, i) => (
          <span key={s.label} style={{ flex:1, textAlign:"center", padding:"6px 4px", borderRadius:8, border: i <= 1 ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(255,255,255,0.07)", background: i <= 1 ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.03)", color: i <= 1 ? "#f87171" : "rgba(255,255,255,0.2)", fontSize:11, fontWeight:700 }}>
            <s.icon size={12} style={{ display:"block", margin:"0 auto 3px" }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OPCIÓN 4 – "Liquid / Ola" barra con efecto agua
════════════════════════════════════════════════════════════════════ */
function Opcion4({ val }) {
  return (
    <div style={card}>
      <style>{`
        @keyframes wave1 { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes wave2 { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
      `}</style>
      <Header title="Opción 4 — Liquid" sub="Efecto ola de agua" color="#0c4a6e" />
      <StatusRow estado={DEMO_ESTADO} val={val} color="#0c4a6e" />
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:11.5, color:"#6b7280", fontWeight:700 }}>Progreso del pedido</span>
          <span style={{ fontSize:11.5, color:"#0c4a6e", fontWeight:800 }}>{Math.round(val)}%</span>
        </div>
        <div style={{ borderRadius:12, height:44, border:"1px solid #93c5d8", background:"linear-gradient(180deg,#f3fbff,#e0f7ff)", overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", bottom:0, left:0, width:"100%", height:`${val}%`, transition:"height .5s cubic-bezier(0.22,1,0.36,1)", overflow:"hidden" }}>
            <svg viewBox="0 0 200 20" preserveAspectRatio="none" style={{ position:"absolute", top:-14, width:"400%", height:28, animation:"wave1 2.2s linear infinite" }}>
              <path d="M0 10 Q25 0 50 10 Q75 20 100 10 Q125 0 150 10 Q175 20 200 10 L200 20 L0 20Z" fill="rgba(14,165,233,0.35)" />
            </svg>
            <svg viewBox="0 0 200 20" preserveAspectRatio="none" style={{ position:"absolute", top:-10, width:"400%", height:22, animation:"wave2 2.8s linear infinite" }}>
              <path d="M0 10 Q25 20 50 10 Q75 0 100 10 Q125 20 150 10 Q175 0 200 10 L200 20 L0 20Z" fill="rgba(2,132,199,0.55)" />
            </svg>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, top:6, background:"linear-gradient(180deg,rgba(2,132,199,0.55),rgba(12,74,110,0.85))" }} />
          </div>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:17, fontWeight:900, color: val > 50 ? "#fff" : "#0c4a6e", textShadow: val > 50 ? "0 1px 6px rgba(0,0,0,0.3)" : "none", letterSpacing:0.5 }}>{Math.round(val)}%</span>
          </div>
        </div>
      </div>
      <Steps steps={STEPS_P} active={1} accentColor="#0284c7" lightColor="#e0f7ff" borderColor="#93c5d8" textColor="#0c4a6e" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OPCIÓN 5 – "Delivery Tracker" estilo Amazon / courier premium
════════════════════════════════════════════════════════════════════ */
function Opcion5({ val }) {
  const steps = [
    { label:"Pedido recibido",   sub:"Registrado", icon:"📦" },
    { label:"En preparación",    sub:"Taller",     icon:"⚙️" },
    { label:"Listo para retiro", sub:"Almacén",    icon:"✅" },
  ];
  const active = val >= 100 ? 2 : val >= 40 ? 1 : 0;
  return (
    <div style={card}>
      <style>{`
        @keyframes track-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,69,67,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(201,69,67,0); }
        }
        @keyframes check-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <Header title="Opción 5 — Delivery" sub="Estilo rastreo de courier" color="#941918" />
      <div style={{ display:"flex", alignItems:"flex-start", gap:0, margin:"18px 0 6px", position:"relative" }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div style={{ flex: 1, display:"flex", flexDirection:"column", alignItems: i===0?"flex-start":i===2?"flex-end":"center", gap:8 }}>
              <div style={{
                width: 42, height: 42, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize: 18,
                background: i <= active ? "linear-gradient(145deg,#fef2f2,#fee2e2)" : "#f9fafb",
                border: i <= active ? `2.5px solid ${i === active ? "#c94543" : "#fca5a5"}` : "2px solid #e5e7eb",
                boxShadow: i <= active ? "0 4px 14px rgba(201,69,67,0.2)" : "none",
                animation: i === active ? "track-pulse 1.8s ease-in-out infinite" : "none",
                position:"relative", zIndex:2,
              }}>
                {s.icon}
              </div>
              <div style={{ textAlign: i===0?"left":i===2?"right":"center" }}>
                <div style={{ fontSize:11.5, fontWeight:700, color: i <= active ? "#881337" : "#9ca3af" }}>{s.label}</div>
                <div style={{ fontSize:10, color:"#9ca3af", marginTop:1 }}>{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ position:"relative", flex:0.6, height:4, marginTop:19, borderRadius:999, background:"#e5e7eb", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, width: i < active ? "100%" : i === active - 1 ? `${(val % 50) * 2}%` : "0%", background:"linear-gradient(90deg,#941918,#c94543)", transition:"width .5s cubic-bezier(0.22,1,0.36,1)", borderRadius:999 }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop:12, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:12.5, color:"#7f1d1d", fontWeight:700 }}>Progreso estimado</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:80, height:8, borderRadius:999, background:"#fee2e2", overflow:"hidden" }}>
            <div style={{ width:`${val}%`, height:"100%", background:"linear-gradient(90deg,#941918,#f87171)", transition:"width .5s", borderRadius:999 }} />
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:"#991b1b" }}>{Math.round(val)}%</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Helpers compartidos
─────────────────────────────────────────────────────────────── */
const card = {
  background:"#fff",
  borderRadius:16,
  padding:22,
  boxShadow:"0 8px 28px rgba(15,23,42,0.10)",
  border:"1px solid #f1f5f9",
  marginBottom: 20,
};

function Header({ title, sub, color, dark = false }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:15, fontWeight:800, color: dark ? "#fff" : "#1f2937", fontFamily:"'Oswald',sans-serif", letterSpacing:0.3 }}>{title}</div>
      <div style={{ fontSize:11, color: dark ? "rgba(255,255,255,0.45)" : "#9ca3af", fontWeight:600, marginTop:1 }}>{sub}</div>
    </div>
  );
}

function StatusRow({ estado, val, color, dark = false }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
      <span style={{ fontSize:12.5, color: dark ? "rgba(255,255,255,0.65)" : "#475569", fontWeight:600 }}>
        Estado: <b style={{ color: dark ? "#f87171" : "#1f2937" }}>{estado}</b>
      </span>
    </div>
  );
}

import { IconPackage, IconBuildingStore, IconCircleCheckFilled } from "@tabler/icons-react";
const STEPS_P = [
  { label:"Recibido", icon: IconPackage },
  { label:"En taller", icon: IconBuildingStore },
  { label:"Entregado", icon: IconCircleCheckFilled },
];

function Steps({ steps, active, accentColor, lightColor, borderColor, textColor }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {steps.map(({ label, icon: Icon }, i) => (
        <span key={label} style={{
          flex:1, textAlign:"center",
          padding:"6px 4px",
          borderRadius:8,
          border: i <= active ? `1px solid ${borderColor}` : "1px solid #e5e7eb",
          background: i <= active ? lightColor : "#f9fafb",
          color: i <= active ? textColor : "#94a3b8",
          fontSize:11, fontWeight:700,
        }}>
          <Icon size={12} style={{ display:"block", margin:"0 auto 3px" }} stroke={2} />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Página principal de la demo
════════════════════════════════════════════════════════════════════ */
export default function DemoDisenoBarra() {
  const val = useAnimatedValue(DEMO_PROGRESO);

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", padding:"88px 20px 48px", fontFamily:"'Open Sans',sans-serif" }}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <div style={{ marginBottom:28, textAlign:"center" }}>
          <h1 style={{ fontFamily:"'Oswald',sans-serif", fontSize:26, color:"#1f2937", margin:"0 0 6px" }}>
            Elige el diseño que más te guste
          </h1>
          <p style={{ color:"#6b7280", fontSize:13 }}>
            Todos muestran un pedido al {DEMO_PROGRESO}% de avance en estado <b>"{DEMO_ESTADO}"</b>
          </p>
        </div>

        <Opcion1 val={val} />
        <Opcion2 val={val} />
        <Opcion3 val={val} />
        <Opcion4 val={val} />
        <Opcion5 val={val} />

        <div style={{ textAlign:"center", padding:"14px 0 8px", color:"#9ca3af", fontSize:12, fontWeight:600 }}>
          Dile a Copilot cuál opción prefieres y se aplica de inmediato ✦
        </div>
      </div>
    </div>
  );
}
