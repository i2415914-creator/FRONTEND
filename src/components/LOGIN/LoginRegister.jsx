import React, { useState, useRef } from "react";
import { IconMail, IconLock, IconLockFilled, IconUser, IconPhone, IconId, IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';

const isDocMsg = (m) =>
  m && (m.includes("documento") || m.includes("RENIEC") || m.includes("SUNAT") || m.includes("dígitos") || m.includes("Selecciona"));

const DocPill = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} className="lb-doc-pill" style={{
    padding: "7px 14px", borderRadius: 8, fontSize: 12,
    fontFamily: "'Open Sans',sans-serif", fontWeight: 700, letterSpacing: "0.06em",
    border: active ? "1.5px solid #80C2DC" : "1.5px solid rgba(80,140,180,0.8)",
    background: active ? "rgba(128,194,220,0.35)" : "rgba(0,30,60,0.82)",
    color: "#fff",
    cursor: "pointer", transition: "all 0.2s",
    display: "flex", alignItems: "center", gap: 5,
    userSelect: "none", flexShrink: 0,
    boxShadow: active ? "0 0 12px rgba(128,194,220,0.35)" : "0 1px 4px rgba(0,0,0,0.3)",
    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
  }}>
    <span style={{ width: 7, height: 7, borderRadius: "50%", border: `1.5px solid ${active ? "#80C2DC" : "rgba(200,235,255,0.7)"}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {active && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#80C2DC" }} />}
    </span>
    {label}
  </button>
);

// ── Tooltip temático reutilizable — misma estética que el del login ──
const LbTooltip = ({ visible, text = "Completa este campo" }) => {
  if (!visible) return null;
  return (
    <div className="lb-tooltip">
      <span className="lb-tooltip-icon">!</span>
      <span className="lb-tooltip-text">{text}</span>
    </div>
  );
};

const getNoticeType = (text) => {
  if (!text) return "info";
  const lower = text.toLowerCase();
  if (lower.includes("exitoso") || lower.includes("verificado")) return "success";
  if (lower.includes("consultando") || lower.includes("verificando")) return "info";
  return "error";
};

const NoticeMessage = ({ text }) => {
  if (!text) return null;
  const type = getNoticeType(text);
  const icon = type === "success"
    ? <IconCircleCheck size={17} stroke={2} />
    : type === "info"
      ? <IconInfoCircle size={17} stroke={2} />
      : <IconAlertCircle size={17} stroke={2} />;

  return (
    <div className={`lb-notice lb-notice-${type}`} style={{ marginTop: 8 }}>
      <span className="lb-notice-icon">{icon}</span>
      <span className="lb-notice-text">{text}</span>
    </div>
  );
};

const LoginRegister = ({
  panelClassName = "",
  isLogin, tipoDoc, handleTipoDoc, form, setForm,
  handleDocumentoBlur, documentoValido, docLoading,
  mensaje, handleSubmit, documentoInputRef, loading, glass,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // ── Estado del tooltip personalizado ──
  const [tooltip, setTooltip] = useState({ visible: false, field: null, text: "Completa este campo" });
  const tooltipTimerRef       = useRef(null);

  const showTooltip = (field, text = "Completa este campo") => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip({ visible: true, field, text });
    tooltipTimerRef.current = setTimeout(() => setTooltip({ visible: false, field: null, text: "Completa este campo" }), 2500);
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip({ visible: false, field: null, text: "Completa este campo" });
  };

  // ── Submit con validación secuencial custom (sin tooltips nativos) ──
  const handleSubmitCustom = (e) => {
    e.preventDefault();
    hideTooltip();

    if (!tipoDoc)         { showTooltip("tipoDoc");  return; }
    if (!form.documento)  { showTooltip("documento"); return; }
    if (!documentoValido) { return; } // el mensaje RENIEC/SUNAT ya se muestra
    if (!form.nombre)     { showTooltip("nombre");   return; }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test((form.nombre || "").trim())) { showTooltip("nombre", "Solo letras en nombre completo"); return; }
    if (!form.numero)     { showTooltip("numero");   return; }
    if (!/^9\d{8}$/.test((form.numero || "").trim())) { showTooltip("numero", "Debe iniciar con 9 y tener 9 dígitos"); return; }
    if (!form.correo)     { showTooltip("correo");   return; }
    if (!form.contraseña) { showTooltip("pass");     return; }

    handleSubmit(e);
  };

  return (
    <div className={`lb-register-panel ${panelClassName}`.trim()} style={{
      width: "50%", padding: "30px 26px",
      ...glass,
      display: "flex", flexDirection: "column", justifyContent: "center",
      opacity: !isLogin ? 1 : 0,
      transform: !isLogin ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.38s ease, transform 0.38s ease",
      pointerEvents: !isLogin ? "auto" : "none",
      overflow: "hidden",
      position: "relative",
      borderLeft: "1.5px solid rgba(128,194,220,0.35)",
      boxShadow: "inset 1px 0 0 rgba(255,255,255,0.1)",
    }}>
      {/* Brillo superior */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,rgba(128,194,220,0.2),rgba(128,194,220,0.6),rgba(128,194,220,0.1))", pointerEvents: "none" }} />
      {/* Brillo inferior */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(128,194,220,0.3),transparent)", pointerEvents: "none" }} />

      <div style={{ width: 30, height: 2.5, background: "linear-gradient(90deg,#80C2DC,#a8d9ed)", borderRadius: 2, marginBottom: 11, boxShadow: "0 0 10px rgba(128,194,220,0.6)" }} />
      <p style={{ color: "rgba(128,194,220,0.7)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Open Sans',sans-serif", margin: "0 0 4px" }}>
        Crear cuenta
      </p>
      <h2 className="lb-heading-sub" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 27, color: "#fff", margin: "0 0 14px", lineHeight: 1, textShadow: "0 2px 16px rgba(0,60,100,0.5), 0 0 30px rgba(128,194,220,0.4)" }}>
        Registro
      </h2>

      {/* noValidate suprime los tooltips nativos del browser */}
      <form onSubmit={handleSubmitCustom} noValidate className="lb-form-gap" style={{ display: "flex", flexDirection: "column", gap: 9 }}>

        {/* ── Tipo de documento ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ color: "#fff", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Open Sans',sans-serif", fontWeight: 800, textShadow: "0 0 12px rgba(128,194,220,0.8), 0 0 20px rgba(128,194,220,0.4)" }}>
            Tipo de documento
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>

            {/* Pill RUC — el tooltip de "tipoDoc" sale aquí */}
            <div style={{ position: "relative" }}>
              <LbTooltip visible={tooltip.visible && tooltip.field === "tipoDoc"} text={tooltip.text || "Selecciona un tipo"} />
              <DocPill label="RUC" active={tipoDoc === "RUC"} onClick={() => { handleTipoDoc("RUC"); hideTooltip(); }} />
            </div>

            {/* Pill DNI */}
            <DocPill label="DNI" active={tipoDoc === "DNI"} onClick={() => { handleTipoDoc("DNI"); hideTooltip(); }} />

            {/* Input número documento con su tooltip */}
            <div style={{ position: "relative", flex: 1 }}>
              <LbTooltip visible={tooltip.visible && tooltip.field === "documento"} text={tooltip.text || "Ingresa el número"} />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13 }}>
                <IconId stroke={1} />
              </span>
              <input
                type="text"
                placeholder={tipoDoc ? `Nº ${tipoDoc}` : "Número"}
                value={form.documento}
                onChange={e => { setForm({ ...form, documento: e.target.value }); hideTooltip(); }}
                onBlur={handleDocumentoBlur}
                onFocus={hideTooltip}
                ref={documentoInputRef}
                className="lb-input"
                style={{ flex: 1 }}
                disabled={!tipoDoc}
                maxLength={tipoDoc === "DNI" ? 8 : 11}
              />
            </div>
          </div>

          {isDocMsg(mensaje) && <NoticeMessage text={mensaje} />}
          {docLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#80C2DC", fontSize: 11, fontFamily: "'Open Sans',sans-serif" }}>
              <span style={{ display: "inline-block", width: 8, height: 8, border: "2px solid rgba(128,194,220,0.2)", borderTopColor: "#80C2DC", borderRadius: "50%", animation: "lb-spin 0.75s linear infinite" }} />
              Consultando…
            </div>
          )}
          {!docLoading && documentoValido && form.nombre && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#34d399", fontSize: 11, fontFamily: "'Open Sans',sans-serif" }}>
              <span>✓</span> Documento verificado
            </div>
          )}
        </div>

        {/* ── Nombre completo ── */}
        <div style={{ position: "relative" }}>
          <LbTooltip visible={tooltip.visible && tooltip.field === "nombre"} text={tooltip.text} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13 }}>
            <IconUser stroke={2} />
          </span>
          <input
            type="text"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={e => {
              const value = e.target.value;
              // Permite solo letras y espacios.
              if (value === '' || /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(value)) {
                setForm({ ...form, nombre: value });
                hideTooltip();
              }
            }}
            onFocus={hideTooltip}
            className="lb-input"
            style={{ color: form.nombre ? "#fff" : "rgba(200,235,255,0.65)" }}
            disabled={!documentoValido}
          />
        </div>

        {/* ── Teléfono ── */}
        <div style={{ position: "relative" }}>
          <LbTooltip visible={tooltip.visible && tooltip.field === "numero"} text={tooltip.text} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13 }}>
            <IconPhone stroke={1.25} />
          </span>
          <input
            type="text"
            placeholder="Número de teléfono"
            value={form.numero}
            onChange={e => {
              const value = e.target.value;
              if (value === '' || /^[0-9]+$/.test(value)) {
                setForm({ ...form, numero: value });
                hideTooltip();
              }
            }}
            onFocus={hideTooltip}
            className="lb-input"
            disabled={!documentoValido}
            maxLength="9"
          />
        </div>

        {/* ── Correo ── */}
        <div style={{ position: "relative" }}>
          <LbTooltip visible={tooltip.visible && tooltip.field === "correo"} text={tooltip.text} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13 }}>
            <IconMail stroke={1} />
          </span>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={form.correo}
            onChange={e => { setForm({ ...form, correo: e.target.value }); hideTooltip(); }}
            onBlur={e => setForm({ ...form, correo: e.target.value.trimEnd() })}
            onFocus={hideTooltip}
            className="lb-input"
            disabled={!documentoValido}
          />
        </div>

        {/* ── Contraseña ── */}
        <div style={{ position: "relative" }}>
          <LbTooltip visible={tooltip.visible && tooltip.field === "pass"} text={tooltip.text} />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13, cursor: "pointer" }}
          >
            {showPassword ? <IconLock stroke={1} /> : <IconLockFilled />}
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={form.contraseña}
            onChange={e => { setForm({ ...form, contraseña: e.target.value }); hideTooltip(); }}
            onFocus={hideTooltip}
            className="lb-input"
            disabled={!documentoValido}
          />
        </div>

        <button
          type="submit"
          className="lb-btn-yellow"
          style={{ marginTop: 2 }}
          disabled={loading}
        >
          {loading ? "Registrando..." : "Crear Cuenta"}
        </button>

        <div className="lb-divider" style={{ margin: "2px 0 0" }}>O regístrate con</div>
        <div id="googleSignInDivRegistro" style={{ display: !isLogin ? "flex" : "none", justifyContent: "center" }} />
      </form>

      {!isDocMsg(mensaje) && <NoticeMessage text={mensaje} />}
    </div>
  );
};

export default LoginRegister;