import React, { useEffect, useMemo, useRef } from "react";
import { COLORS, FONTS } from "../colors";
import { IconPackage, IconClockBolt, IconReceipt, IconShoppingCartCopy } from "@tabler/icons-react";
import { animate, stagger, splitText } from "animejs";

const BarraProgreso = ({ estado, progreso = 0, mostrar = false }) => {
  const emptyTextRef = useRef(null);

  useEffect(() => {
    const isEmptyState = !mostrar || !estado;
    if (!isEmptyState || !emptyTextRef.current) return;

    const splitter = splitText(emptyTextRef.current, { words: false, chars: true });
    const chars = splitter?.chars || [];
    if (!chars.length) return;

    const animation = animate(chars, {
      y: [
        { to: "-0.35rem", ease: "outExpo", duration: 420 },
        { to: 0, ease: "outCubic", duration: 520, delay: 60 },
      ],
      opacity: [0.78, 1],
      delay: stagger(28, { from: "center" }),
      ease: "inOutSine",
      loopDelay: 1300,
      loop: true,
    });

    return () => {
      if (animation?.pause) animation.pause();
      if (animation?.cancel) animation.cancel();
      if (splitter?.revert) splitter.revert();
    };
  }, [mostrar, estado]);

  const normalizedTarget = useMemo(() => {
    const n = Number(progreso);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }, [progreso]);

  const estadoTxt = (estado || "").toLowerCase().trim();
  const isEntregado =
    estadoTxt.includes("entreg") ||
    estadoTxt.includes("entrgad") ||
    estadoTxt.includes("finaliz") ||
    estadoTxt.includes("complet");
  const isEnProceso =
    estadoTxt.includes("proceso") ||
    estadoTxt.includes("taller") ||
    estadoTxt.includes("produccion") ||
    estadoTxt.includes("trabajo");

  const byEstado = isEntregado ? 2 : isEnProceso ? 1 : 0;
  const byProgress = normalizedTarget >= 100 ? 2 : normalizedTarget >= 45 ? 1 : 0;
  const activeStep = Math.max(byEstado, byProgress);
  const showInicioTooltip = activeStep === 0;
  const showProcesoTooltip = activeStep === 1;
  const showEntregadoTooltip = activeStep === 2;
  const steps = [
    { label: "Inicio", icon: IconReceipt, stroke: 1.25 },
    { label: "En proceso", icon: IconPackage, stroke: 1 },
    { label: "Entregado", icon: IconShoppingCartCopy, stroke: 1 },
  ];

  if (!mostrar || !estado) {
    return (
      <div style={{
        background: "linear-gradient(140deg, rgba(255,255,255,0.92), rgba(249,250,251,0.92))",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
        boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", border: "1px solid #fecaca" }}>
              <IconPackage size={16} stroke={2} color="#9f1239" />
            </span>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, fontFamily: FONTS.heading, color: "#1f2937" }}>Seguimiento de Pedido</h3>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.7 }}>SIN ACTIVIDAD</span>
        </div>
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <p
            ref={emptyTextRef}
            style={{
              color: "#64748b",
              fontStyle: "normal",
              fontFamily: FONTS.body,
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              textAlign: "center",
              letterSpacing: 0.2,
            }}
          >
            No hay pedido en proceso
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)",
      border: "1px solid rgba(254,205,211,0.7)",
      borderRadius: 14,
      padding: 18,
      marginBottom: 16,
      boxShadow: "0 12px 32px rgba(15,23,42,0.10)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      position: "relative",
      overflow: "visible",
    }}>
      <style>{`
        @keyframes vbPedidoPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(201,69,67,0.35); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 7px rgba(201,69,67,0); }
        }
        .vbInicioTooltip {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%) translateY(4px);
          background: #dff4ff;
          color: #0c4a6e;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.25;
          width: 250px;
          box-shadow: 0 8px 18px rgba(2, 6, 23, 0.25);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
          z-index: 30;
          text-align: left;
        }
        .vbInicioTooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #dff4ff transparent transparent transparent;
        }
        .vbInicioTooltipTrigger:hover .vbInicioTooltip,
        .vbInicioTooltipTrigger:focus-within .vbInicioTooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .vbProcesoTooltip {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%) translateY(4px);
          background: #dff4ff;
          color: #0c4a6e;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.25;
          width: 250px;
          box-shadow: 0 8px 18px rgba(2, 6, 23, 0.25);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
          z-index: 30;
          text-align: left;
        }
        .vbProcesoTooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #dff4ff transparent transparent transparent;
        }
        .vbProcesoTooltipTrigger:hover .vbProcesoTooltip,
        .vbProcesoTooltipTrigger:focus-within .vbProcesoTooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .vbEntregadoTooltip {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%) translateY(4px);
          background: #dff4ff;
          color: #0c4a6e;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.25;
          width: 250px;
          box-shadow: 0 8px 18px rgba(2, 6, 23, 0.25);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
          z-index: 30;
          text-align: left;
        }
        .vbEntregadoTooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #dff4ff transparent transparent transparent;
        }
        .vbEntregadoTooltipTrigger:hover .vbEntregadoTooltip,
        .vbEntregadoTooltipTrigger:focus-within .vbEntregadoTooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", border: "1px solid #fecaca" }}>
            <IconPackage size={16} stroke={2} color="#9f1239" />
          </span>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, fontFamily: FONTS.heading, color: "#1f2937" }}>Seguimiento de Pedido</h3>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#8b1d1d",
          background: "rgba(254,226,226,0.9)",
          border: "1px solid #fecaca",
          borderRadius: 999,
          padding: "3px 10px",
          minWidth: 56,
          textAlign: "center",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          En seguimiento
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
        <span style={{ fontSize: 13, color: "#475569", fontFamily: FONTS.body }}><b style={{ color: "#1f2937" }}>Estado:</b> {estado}</span>
        <span style={{ fontSize: 11.5, color: "#64748b", fontFamily: FONTS.body, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <IconClockBolt size={14} stroke={2} />
          Actualizado en tiempo real
        </span>
      </div>

      <div style={{ position: "relative", padding: "4px 0 2px" }}>
        <div style={{ position: "absolute", left: 8, right: 8, top: 18, height: 2, background: "#e5e7eb", borderRadius: 999 }} />
        <div style={{ position: "absolute", left: 8, top: 18, height: 2, width: `calc(${normalizedTarget}% - 16px)`, maxWidth: "calc(100% - 16px)", background: "linear-gradient(90deg,#fb7185,#f43f5e)", borderRadius: 999, transition: "width .35s cubic-bezier(0.22,1,0.36,1)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
          {steps.map(({ label, icon: StepIcon, stroke }, idx) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: idx === 0 ? "flex-start" : idx === 2 ? "flex-end" : "center", gap: 6 }}>
              <span
                className={
                  idx === 0 && showInicioTooltip
                    ? "vbInicioTooltipTrigger"
                    : idx === 1 && showProcesoTooltip
                    ? "vbProcesoTooltipTrigger"
                    : idx === 2 && showEntregadoTooltip
                    ? "vbEntregadoTooltipTrigger"
                    : undefined
                }
                title={
                  idx === 0 && showInicioTooltip
                    ? "Ya se pagó el pedido; espere unos minutos mientras se alistan sus productos."
                    : idx === 1 && showProcesoTooltip
                    ? "Se están terminando de alistar sus productos; espere unos minutos para la entrega."
                    : idx === 2 && showEntregadoTooltip
                    ? "Su pedido está listo; ya puede recogerlo."
                    : undefined
                }
                style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: idx <= activeStep ? "1px solid #f43f5e" : "1px solid #d1d5db",
                background: idx <= activeStep ? "#fff1f2" : "#f8fafc",
                color: idx <= activeStep ? "#9f1239" : "#94a3b8",
                animation: idx === activeStep ? "vbPedidoPulse 1.8s ease-in-out infinite" : "none",
                zIndex: 2,
                position: "relative",
              }}>
                <StepIcon size={13} stroke={stroke || 2} />
                {idx === 0 && showInicioTooltip && (
                  <span className="vbInicioTooltip">
                    Ya se pagó el pedido; espere unos minutos mientras se alistan sus productos.
                  </span>
                )}
                {idx === 1 && showProcesoTooltip && (
                  <span className="vbProcesoTooltip">
                    Se están terminando de alistar sus productos; espere unos minutos para la entrega.
                  </span>
                )}
                {idx === 2 && showEntregadoTooltip && (
                  <span className="vbEntregadoTooltip">
                    Su pedido está listo; ya puede recogerlo.
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10.8, fontWeight: 700, color: idx <= activeStep ? "#881337" : "#94a3b8" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarraProgreso;
