import React, { useEffect, useMemo, useRef, useState } from "react";
import { COLORS, FONTS } from "../colors";
import { IconClockBolt, IconRulerMeasure, IconBuildingWarehouse, IconStackBack, IconColumns2, IconHomeCheck } from "@tabler/icons-react";
import * as TablerIcons from "@tabler/icons-react";
import { animate, stagger, splitText } from "animejs";

const BarraProgresoServicio = ({ estado, progreso = 0, mostrar = false }) => {
  const emptyTextRef = useRef(null);
  const stepCircleRefs = useRef([]);
  const prevStepRef = useRef(-1);
  const [estadoAnimKey, setEstadoAnimKey] = useState(0);

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

  const estadoTxt = (estado || "").toLowerCase();
  // Mapeo correcto por estado: 0 Inicio, 1 Realizando, 2 Instalación, 3 Instalado
  const byEstado = estadoTxt.includes("final") || estadoTxt.includes("instalad")
    ? 3
    : estadoTxt.includes("instal")
    ? 2
    : estadoTxt.includes("realiz")
    ? 1
    : 0;

  const byProgress = normalizedTarget >= 100 ? 3 : normalizedTarget >= 65 ? 2 : normalizedTarget >= 30 ? 1 : 0;

  // Si hay estado, usarlo como fuente de verdad para no adelantar la barra por porcentaje.
  const hasEstado = Boolean((estado || "").trim());
  const activeStep = hasEstado ? byEstado : byProgress;

  const showInicioTooltip = activeStep === 0;
  const showRealizandoTooltip = activeStep === 1;
  const showInstalacionTooltip = activeStep === 2;
  const showInstaladoTooltip = activeStep === 3;
  const IconInstalacion = TablerIcons.IconBrandGoogleHome || TablerIcons.IconHome2 || IconHomeCheck;
  const steps = [
    { label: "Inicio", icon: IconRulerMeasure, stroke: 1 },
    { label: "Realizando", icon: IconStackBack, stroke: 1 },
    { label: "Instalación", icon: IconInstalacion, stroke: 1, size: 14 },
    { label: "Instalado", icon: IconColumns2, stroke: 2 },
  ];

  // Animar círculos al cambiar activeStep
  useEffect(() => {
    if (!mostrar || !estado) {
      prevStepRef.current = -1;
      return;
    }
    const prev = prevStepRef.current;
    if (prev === activeStep) return;
    const isInit = prev === -1;
    stepCircleRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i <= activeStep && (i > prev || isInit)) {
        animate(el, {
          scale: [0.45, 1.28, 1],
          opacity: [0.5, 1],
          duration: 520,
          delay: isInit ? i * 100 : (i - Math.max(prev, -1) - 1) * 70,
          ease: "outBack(1.25)",
        });
      }
    });
    prevStepRef.current = activeStep;
  }, [activeStep, mostrar, estado]);

  // Animar texto de estado al cambiar
  useEffect(() => {
    if (!estado) return;
    setEstadoAnimKey(k => k + 1);
  }, [estado]);

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
            <span style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#eef6fb", border: "1px solid #c7e4f0" }}>
              <IconBuildingWarehouse size={16} stroke={2} color="#0c4a6e" />
            </span>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, fontFamily: FONTS.heading, color: "#1f2937" }}>Seguimiento de Servicio</h3>
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
            No hay servicio en proceso
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)",
      border: "1px solid rgba(199,228,240,0.9)",
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
        @keyframes vbServicioPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(45,120,151,0.35); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 7px rgba(45,120,151,0); }
        }
        @keyframes vbStepPop {
          0%   { transform: scale(0.45); }
          55%  { transform: scale(1.28); }
          100% { transform: scale(1); }
        }
        @keyframes vbRipple {
          0%   { transform: scale(0.85); opacity: 0.85; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes vbRipple2 {
          0%   { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes vbEstadoIn {
          0%   { opacity: 0; transform: translateY(8px) scale(0.97); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vbBarShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes vbBarEnter {
          from { opacity: 0; transform: scaleX(0.7); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        .vbServicioInicioTooltip {
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
        .vbServicioInicioTooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #dff4ff transparent transparent transparent;
        }
        .vbServicioInicioTooltipTrigger:hover .vbServicioInicioTooltip,
        .vbServicioInicioTooltipTrigger:focus-within .vbServicioInicioTooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .vbServicioRealizandoTooltip {
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
        .vbServicioRealizandoTooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #dff4ff transparent transparent transparent;
        }
        .vbServicioRealizandoTooltipTrigger:hover .vbServicioRealizandoTooltip,
        .vbServicioRealizandoTooltipTrigger:focus-within .vbServicioRealizandoTooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .vbServicioInstalacionTooltip {
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
        .vbServicioInstalacionTooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #dff4ff transparent transparent transparent;
        }
        .vbServicioInstalacionTooltipTrigger:hover .vbServicioInstalacionTooltip,
        .vbServicioInstalacionTooltipTrigger:focus-within .vbServicioInstalacionTooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .vbServicioInstaladoTooltip {
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
        .vbServicioInstaladoTooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: #dff4ff transparent transparent transparent;
        }
        .vbServicioInstaladoTooltipTrigger:hover .vbServicioInstaladoTooltip,
        .vbServicioInstaladoTooltipTrigger:focus-within .vbServicioInstaladoTooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#eef6fb", border: "1px solid #c7e4f0" }}>
            <IconBuildingWarehouse size={16} stroke={2} color="#0c4a6e" />
          </span>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, fontFamily: FONTS.heading, color: "#1f2937" }}>Seguimiento de Servicio</h3>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#0c4a6e",
          background: "rgba(232,244,249,0.95)",
          border: "1px solid #c7e4f0",
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
        <span key={estadoAnimKey} style={{ fontSize: 13, color: "#475569", fontFamily: FONTS.body, display: "inline-block", animation: estadoAnimKey > 0 ? "vbEstadoIn 0.42s ease-out both" : "none" }}><b style={{ color: "#1f2937" }}>Estado:</b> {estado}</span>
        <span style={{ fontSize: 11.5, color: "#64748b", fontFamily: FONTS.body, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <IconClockBolt size={14} stroke={2} />
          Actualizado en tiempo real
        </span>
      </div>

      <div style={{ position: "relative", padding: "4px 0 2px" }}>
        <div style={{ position: "absolute", left: 8, right: 8, top: 17, height: 3, background: "#e2e8f0", borderRadius: 999 }} />
        <div style={{ position: "absolute", left: 8, top: 17, height: 3, width: `calc(${((activeStep + 0.5) / 3) * 100}% - 16px)`, maxWidth: "calc(100% - 16px)", background: "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 30%, #bae6fd 50%, #0ea5e9 70%, #38bdf8 100%)", backgroundSize: "300% 100%", borderRadius: 999, transition: "width 0.85s cubic-bezier(0.22,1,0.36,1)", animation: "vbBarShimmer 2.8s linear infinite", transformOrigin: "left", boxShadow: "0 1px 6px rgba(14,165,233,0.35)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
          {steps.map(({ label, icon: StepIcon, stroke, size }, idx) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: idx === 0 ? "flex-start" : idx === 3 ? "flex-end" : "center", gap: 6 }}>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {idx === activeStep && (
                  <>
                    <span style={{
                      position: "absolute", width: 24, height: 24, borderRadius: "50%",
                      border: "2px solid rgba(14,165,233,0.6)",
                      animation: "vbRipple 1.7s ease-out infinite",
                      pointerEvents: "none", zIndex: 1,
                    }} />
                    <span style={{
                      position: "absolute", width: 24, height: 24, borderRadius: "50%",
                      border: "1.5px solid rgba(14,165,233,0.35)",
                      animation: "vbRipple2 1.7s ease-out 0.55s infinite",
                      pointerEvents: "none", zIndex: 1,
                    }} />
                  </>
                )}
                <span
                  ref={el => { stepCircleRefs.current[idx] = el; }}
                  className={
                    idx === 0 && showInicioTooltip
                      ? "vbServicioInicioTooltipTrigger"
                      : idx === 1 && showRealizandoTooltip
                      ? "vbServicioRealizandoTooltipTrigger"
                      : idx === 2 && showInstalacionTooltip
                      ? "vbServicioInstalacionTooltipTrigger"
                      : idx === 3 && showInstaladoTooltip
                      ? "vbServicioInstaladoTooltipTrigger"
                      : undefined
                  }
                  title={
                    idx === 0 && showInicioTooltip
                      ? "Se confirmaron las medidas; ahora se está preparando su servicio."
                      : idx === 1 && showRealizandoTooltip
                      ? "El servicio ya está listo; prepárese para la instalación."
                      : idx === 2 && showInstalacionTooltip
                      ? "La instalación está en proceso; espere unos minutos mientras se completa."
                      : idx === 3 && showInstaladoTooltip
                      ? "Su servicio se culminó; puede verlo en nuestros proyectos."
                      : undefined
                  }
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: idx <= activeStep ? "2px solid #0ea5e9" : "1.5px solid #d1d5db",
                    background: idx <= activeStep
                      ? "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)"
                      : "#f8fafc",
                    color: idx <= activeStep ? "#0c4a6e" : "#94a3b8",
                    animation: idx === activeStep ? "vbServicioPulse 1.9s ease-in-out infinite" : "none",
                    zIndex: 2,
                    position: "relative",
                    transition: "border-color 0.4s ease, background 0.4s ease, color 0.4s ease, box-shadow 0.4s ease",
                    boxShadow: idx === activeStep
                      ? "0 0 0 3px rgba(14,165,233,0.2), 0 2px 8px rgba(14,165,233,0.25)"
                      : idx < activeStep
                      ? "0 1px 4px rgba(14,165,233,0.15)"
                      : "none",
                  }}
                >
                  <StepIcon size={size || 13} stroke={stroke || 2} color="currentColor" />
                  {idx === 0 && showInicioTooltip && (
                    <span className="vbServicioInicioTooltip">
                      Se confirmaron las medidas; ahora se está preparando su servicio.
                    </span>
                  )}
                  {idx === 1 && showRealizandoTooltip && (
                    <span className="vbServicioRealizandoTooltip">
                      El servicio ya está listo; prepárese para la instalación.
                    </span>
                  )}
                  {idx === 2 && showInstalacionTooltip && (
                    <span className="vbServicioInstalacionTooltip">
                      La instalación está en proceso; espere unos minutos mientras se completa.
                    </span>
                  )}
                  {idx === 3 && showInstaladoTooltip && (
                    <span className="vbServicioInstaladoTooltip">
                      Su servicio se culminó; puede verlo en nuestros proyectos.
                    </span>
                  )}
                </span>
              </div>
              <span style={{ fontSize: 10.4, fontWeight: 700, color: idx <= activeStep ? "#075985" : "#94a3b8", textAlign: "center", transition: "color 0.45s ease" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarraProgresoServicio;
