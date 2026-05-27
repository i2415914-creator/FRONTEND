import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS, FONTS } from "../../colors";
import LoginRegister from "./LoginRegister";
import { IconMail, IconLock, IconLockFilled, IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';

const API_BASE = (import.meta.env.VITE_API_URL || "https://api.vidriobras.com").replace(/\/$/, "");

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .lb-input {
    width: 100%;
    background: rgba(0, 10, 28, 0.65);
    border: 1px solid rgba(128,194,220,0.5);
    border-radius: 10px;
    padding: 10px 14px 10px 38px;
    font-size: 13px;
    font-family: 'Open Sans', sans-serif;
    color: #fff;
    outline: none;
    transition: all 0.25s;
  }
  .lb-input::placeholder { color: rgba(200,230,255,0.95); font-weight: 500; }
  .lb-input:focus {
    background: rgba(0,20,50,0.95);
    border-color: #80C2DC;
    box-shadow: 0 0 0 3px rgba(128,194,220,0.15), 0 0 14px rgba(128,194,220,0.2);
  }
  .lb-input:disabled {
    opacity: 1;
    cursor: not-allowed;
    background: rgba(0,10,28,0.65);
    border-color: rgba(128,194,220,0.3);
  }
  .lb-input:disabled::placeholder { color: rgba(180,215,240,0.85); }

  .lb-input-plain {
    width: 100%;
    background: rgba(0,10,28,0.65);
    border: 1px solid rgba(128,194,220,0.5);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    font-family: 'Open Sans', sans-serif;
    color: #fff;
    outline: none;
    transition: all 0.25s;
  }
  .lb-input-plain::placeholder { color: rgba(200,230,255,0.95); font-weight: 500; }
  .lb-input-plain:focus {
    background: rgba(0,20,50,0.95);
    border-color: #80C2DC;
    box-shadow: 0 0 0 3px rgba(128,194,220,0.15), 0 0 14px rgba(128,194,220,0.2);
  }
  .lb-input-plain:disabled {
    opacity: 1;
    cursor: not-allowed;
    background: rgba(0,10,28,0.65);
    border-color: rgba(128,194,220,0.3);
  }
  .lb-input-plain:disabled::placeholder { color: rgba(180,215,240,0.65); }

  .lb-btn-red {
    width: 100%;
    background: linear-gradient(135deg, #c94543, #941918);
    color: #fff;
    font-family: 'Oswald', sans-serif;
    font-weight: 600; font-size: 14px;
    letter-spacing: 0.1em; text-transform: uppercase;
    border: none; border-radius: 12px; padding: 12px 0; cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 0 20px rgba(148,25,24,0.55), 0 4px 16px rgba(148,25,24,0.4);
  }
  .lb-btn-red:hover:not(:disabled) {
    box-shadow: 0 0 32px rgba(200,60,50,0.7), 0 6px 20px rgba(148,25,24,0.5);
    transform: translateY(-1px);
  }
  .lb-btn-red:disabled { opacity:.4; cursor:not-allowed; }

  .lb-btn-yellow {
    width: 100%;
    background: linear-gradient(135deg, #ffe033, #ffd600);
    color: #1a0a0a;
    font-family: 'Oswald', sans-serif;
    font-weight: 600; font-size: 14px;
    letter-spacing: 0.1em; text-transform: uppercase;
    border: none; border-radius: 12px; padding: 12px 0; cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 0 20px rgba(255,214,0,0.4), 0 4px 14px rgba(255,214,0,0.3);
  }
  .lb-btn-yellow:hover:not(:disabled) {
    box-shadow: 0 0 32px rgba(255,214,0,0.6), 0 6px 18px rgba(255,214,0,0.4);
    transform: translateY(-1px);
  }
  .lb-btn-yellow:disabled { opacity:.4; cursor:not-allowed; }

  .lb-btn-ghost {
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.65);
    color: #fff;
    font-family: 'Oswald', sans-serif;
    font-weight: 600; font-size: 13px;
    letter-spacing: 0.1em; text-transform: uppercase;
    border-radius: 12px; padding: 10px 30px; cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 0 14px rgba(255,255,255,0.12);
  }
  .lb-btn-ghost:hover {
    background: rgba(255,255,255,0.22);
    box-shadow: 0 0 24px rgba(255,255,255,0.25);
    transform: translateY(-1px);
  }

  .lb-divider {
    display:flex; align-items:center; gap:8px;
    color: rgba(128,194,220,0.3);
    font-size:10px; font-family:'Open Sans',sans-serif;
    letter-spacing:0.08em; text-transform:uppercase;
  }
  .lb-divider::before,.lb-divider::after {
    content:''; flex:1; height:1px;
    background: linear-gradient(90deg,transparent,rgba(128,194,220,0.3),transparent);
  }

  .lb-link { color:rgba(128,194,220,0.8); font-size:11.5px; text-decoration:none; font-family:'Open Sans',sans-serif; transition:all 0.2s; cursor:pointer; }
  .lb-link:hover { color:#80C2DC; text-shadow:0 0 8px rgba(128,194,220,0.6); }

  .lb-notice {
    margin-top: 8px;
    border-radius: 10px;
    border: 1px solid rgba(128,194,220,0.35);
    background: linear-gradient(135deg, rgba(0,20,50,0.92), rgba(0,35,70,0.95));
    box-shadow: 0 0 18px rgba(128,194,220,0.18), 0 4px 16px rgba(0,0,0,0.25);
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Open Sans', sans-serif;
    font-size: 12px;
    line-height: 1.35;
  }
  .lb-notice-error {
    border-color: rgba(248,113,113,0.45);
    background: linear-gradient(135deg, rgba(65,10,18,0.92), rgba(95,20,28,0.96));
    color: #fecaca;
  }
  .lb-notice-success {
    border-color: rgba(52,211,153,0.45);
    background: linear-gradient(135deg, rgba(6,44,32,0.92), rgba(9,70,48,0.96));
    color: #a7f3d0;
  }
  .lb-notice-info {
    border-color: rgba(128,194,220,0.45);
    color: rgba(200,235,255,0.95);
  }
  .lb-notice-icon { display:flex; align-items:center; justify-content:center; }
  .lb-notice-text { flex:1; }

  /* ══════════════════════════════════════════════════════════════
     CUSTOM VALIDATION TOOLTIP — temática glassmorphism azul
     ══════════════════════════════════════════════════════════════ */
  .lb-tooltip {
    position: absolute;
    bottom: calc(100% + 9px);
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(0,20,50,0.97), rgba(0,35,70,0.99));
    border: 1px solid rgba(128,194,220,0.55);
    border-radius: 10px;
    padding: 7px 13px;
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
    z-index: 9999;
    pointer-events: none;
    box-shadow:
      0 0 22px rgba(128,194,220,0.25),
      0 4px 18px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(128,194,220,0.15);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    animation: lb-tooltip-in 0.18s ease-out;
  }
  /* Flecha borde */
  .lb-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(128,194,220,0.55);
  }
  /* Flecha relleno (capa interior) */
  .lb-tooltip::before {
    content: '';
    position: absolute;
    top: calc(100% + 1px);
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(0,35,70,0.99);
    z-index: 1;
  }
  .lb-tooltip-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #80C2DC, #4fa8cc);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    color: #001428;
    flex-shrink: 0;
    box-shadow: 0 0 10px rgba(128,194,220,0.6);
    font-family: 'Oswald', sans-serif;
  }
  .lb-tooltip-text {
    font-family: 'Open Sans', sans-serif;
    font-size: 11.5px;
    font-weight: 600;
    color: rgba(200,235,255,0.95);
    letter-spacing: 0.02em;
  }
  @keyframes lb-tooltip-in {
    from { opacity: 0; transform: translateX(-50%) translateY(5px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes lb-spin { to { transform:rotate(360deg); } }
  .lb-card-breathe {
    box-shadow:
      0 0 0 1px rgba(128,194,220,0.15),
      0 0 28px rgba(128,194,220,0.08),
      0 8px 32px rgba(0,0,0,0.12);
  }

  /* ══════════════════════════════════════════════════════════════
     RESPONSIVE DESIGN
     ══════════════════════════════════════════════════════════════ */
  @media (max-width: 767px) {
    .lb-card-breathe {
      flex-direction: column !important;
      max-width: 95% !important;
      width: 95% !important;
      max-height: none !important;
      height: auto !important;
    }
    .lb-mobile-switch {
      display: flex !important;
      width: 100%;
      gap: 8px;
      padding: 12px 12px 0;
      background: linear-gradient(180deg, rgba(128,194,220,0.15), rgba(128,194,220,0.04));
      border-bottom: 1px solid rgba(128,194,220,0.25);
    }
    .lb-mobile-switch-btn {
      flex: 1;
      height: 34px;
      border-radius: 10px;
      border: 1px solid rgba(128,194,220,0.35);
      background: rgba(0, 30, 60, 0.45);
      color: rgba(220,240,255,0.88);
      font-family: 'Oswald', sans-serif;
      font-size: 12px;
      letter-spacing: .06em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .lb-mobile-switch-btn.lb-active {
      background: linear-gradient(135deg, rgba(201,69,67,0.95), rgba(148,25,24,0.95));
      border-color: rgba(248,113,113,0.7);
      color: #fff;
      box-shadow: 0 0 12px rgba(148,25,24,0.35);
    }
    .lb-login-panel, .lb-register-panel {
      width: 100% !important;
      padding: 24px 20px !important;
      border-right: none !important;
      border-left: none !important;
      position: relative !important;
    }
    .lb-mobile-hidden {
      display: none !important;
    }
    .lb-mobile-active {
      display: flex !important;
    }
    .lb-sliding-panel { display: none !important; }
    .lb-input, .lb-input-plain { font-size: 14px !important; padding: 11px 14px 11px 38px !important; }
    .lb-btn-red, .lb-btn-yellow { font-size: 13px !important; padding: 13px 0 !important; }
    .lb-btn-ghost { font-size: 12px !important; padding: 10px 24px !important; }
    .lb-doc-pill { padding: 9px 16px !important; font-size: 13px !important; min-height: 40px; }
    .lb-heading-main { font-size: 24px !important; }
    .lb-heading-sub { font-size: 20px !important; }
    .lb-icon-container { width: 50px !important; height: 50px !important; }
    .lb-icon-container svg { width: 20px !important; height: 20px !important; }
    .lb-mobile-separator {
      width: 100%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(128,194,220,0.4), transparent);
      margin: 16px 0; display: block;
    }
    .lb-form-gap { gap: 10px !important; }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    .lb-card-breathe { max-width: 90% !important; width: 90% !important; }
    .lb-login-panel, .lb-register-panel { padding: 28px 22px !important; }
    .lb-input, .lb-input-plain { font-size: 12.5px !important; padding: 9px 12px 9px 36px !important; }
    .lb-btn-red, .lb-btn-yellow { font-size: 13px !important; padding: 11px 0 !important; }
    .lb-btn-ghost { font-size: 12px !important; padding: 9px 26px !important; }
    .lb-heading-main { font-size: 24px !important; }
    .lb-heading-sub { font-size: 22px !important; }
    .lb-sliding-panel { padding: 28px 18px !important; }
    .lb-sliding-panel h2 { font-size: 20px !important; }
    .lb-sliding-panel p { font-size: 11.5px !important; }
  }

  @media (min-width: 1025px) {
    .lb-card-breathe { max-width: 700px; }
  }

  .lb-mobile-switch {
    display: none;
  }
`;

function injectStyles() {
  if (document.getElementById("__lb4")) return;
  const s = document.createElement("style");
  s.id = "__lb4";
  s.textContent = GLOBAL_STYLES;
  document.head.appendChild(s);
}

export default function LoginInicioSesion() {
  const navigate = useNavigate(), location = useLocation(), docRef = useRef(null);

  const [isLogin, setIsLogin]                 = useState(true);
  const [loginForm, setLoginForm]             = useState({ correo: "", contraseña: "" });
  const [tipoDoc, setTipoDoc]                 = useState("");
  const [form, setForm]                       = useState({ nombre: "", correo: "", contraseña: "", numero: "", documento: "", tipo_documento: "", tipo_cliente_id: "" });
  const [documentoValido, setDocumentoValido] = useState(false);
  const [docLoading, setDocLoading]           = useState(false);
  const [mensaje, setMensaje]                 = useState("");
  const [loading, setLoading]                 = useState(false);
  const [showPassword, setShowPassword]       = useState(false);

  // ── Estado del tooltip personalizado ──
  const [tooltip, setTooltip]   = useState({ visible: false, field: null });
  const tooltipTimerRef         = useRef(null);

  const showTooltip = (field) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip({ visible: true, field });
    tooltipTimerRef.current = setTimeout(() => setTooltip({ visible: false, field: null }), 2500);
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip({ visible: false, field: null });
  };

  const getNoticeType = (text) => {
    if (!text) return "info";
    const lower = text.toLowerCase();
    if (lower.includes("exitoso") || lower.includes("verificado")) return "success";
    if (lower.includes("verificando")) return "info";
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
      <div className={`lb-notice lb-notice-${type}`}>
        <span className="lb-notice-icon">{icon}</span>
        <span className="lb-notice-text">{text}</span>
      </div>
    );
  };

  useEffect(() => { injectStyles(); }, []);

  // Limpiar timer al desmontar
  useEffect(() => () => { if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); }, []);

  const fromPath = location.state?.from || (() => {
    try { return new URLSearchParams(location.search).get("from") || undefined; } catch { return undefined; }
  })();

  useEffect(() => {
    if (window.google?.accounts) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true;
    document.body.appendChild(s);
    return () => document.body.removeChild(s);
  }, []);

  useEffect(() => {
    let retry = 0;
    const tid = isLogin ? "googleSignInDivLogin" : "googleSignInDivRegistro", isReg = !isLogin;
    function render() {
      const div = document.getElementById(tid); if (!div) return;
      if (!window.google?.accounts) { if (retry++ < 10) setTimeout(render, 300); else setMensaje("No se pudo cargar Google."); return; }
      div.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: "1000681433446-mgbmp68bol11vjn56rfsb2ai9l732tbb.apps.googleusercontent.com",
        callback: async (response) => {
          setMensaje("Verificando con Google...");
          try {
            let res = await fetch(`${API_BASE}/api/auth/google-login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential: response.credential }) });
            let json = await res.json();
            if (json.success) { saveCliente(json); navigate(fromPath || "/user", { replace: true }); return; }
            if (res.status === 404 || json.message?.toLowerCase().includes("no registrado")) {
              res = await fetch(`${API_BASE}/api/auth/google-register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential: response.credential }) });
              json = await res.json();
              if (json.success) { saveCliente(json); navigate(fromPath || "/user", { replace: true }); return; }
              setMensaje(json.message || "No se pudo registrar con Google"); return;
            }
            setMensaje(json.message || "No se pudo iniciar sesión con Google");
          } catch { setMensaje("Error de conexión con Google Auth"); }
        },
        ux_mode: "popup", auto_select: false,
      });
      window.google.accounts.id.renderButton(div, { theme: "filled_black", size: "medium", text: isReg ? "signup_with" : "signin_with", shape: "pill", logo_alignment: "left" });
    }
    render();
  }, [isLogin, fromPath]);

  function saveCliente(json) {
    if (json.token) localStorage.setItem("auth_token", json.token);
    const c = json.cliente; if (!c) return;
    if (c.id_cliente) localStorage.setItem("cliente_id", c.id_cliente);
    ["cliente_correo", "cliente_nombre", "cliente_numero", "cliente_documento"].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
  }

  const handleTipoDoc = (tipo) => {
    const next = tipoDoc === tipo ? "" : tipo;
    setTipoDoc(next); setDocumentoValido(false); setMensaje("");
    setForm(p => ({ ...p, documento: "", tipo_documento: next, nombre: next ? p.nombre : "" }));
    if (next && docRef.current) setTimeout(() => docRef.current?.focus(), 50);
  };

  const handleDocumentoBlur = async () => {
    setMensaje(""); setDocLoading(false); setDocumentoValido(false);
    if (!tipoDoc) { setMensaje("Selecciona el tipo de documento"); return; }
    const len = tipoDoc === "DNI" ? 8 : 11, doc = (form.documento || "").trim();
    if (doc.length !== len) { setMensaje(`El ${tipoDoc} debe tener ${len} dígitos`); return; }
    setDocLoading(true);
    try {
      const res  = await fetch("/api/consulta_documento_html", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: tipoDoc, numero: doc }) });
      const data = await res.json();
      if (!data.success || data.error) { setMensaje(data.message || "No se encontró en RENIEC/SUNAT"); setForm(f => ({ ...f, nombre: "" })); setDocLoading(false); setDocumentoValido(false); setTimeout(() => docRef.current?.focus(), 100); return; }
      if (data.html) setForm(f => ({ ...f, nombre: data.html }));
      setDocLoading(false); setDocumentoValido(true);
    } catch { setMensaje("Error consultando documento."); setForm(f => ({ ...f, nombre: "" })); setDocLoading(false); setDocumentoValido(false); setTimeout(() => docRef.current?.focus(), 100); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMensaje("");
    if (!documentoValido) { setMensaje("Valida el documento."); return; }
    const nombreLimpio = (form.nombre || "").trim();
    const numeroLimpio = (form.numero || "").trim();
    const correoLimpio = (form.correo || "").trimEnd();
    if (!nombreLimpio || !correoLimpio || !form.contraseña || !numeroLimpio) { setMensaje("Completa todos los campos."); return; }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(nombreLimpio)) { setMensaje("El nombre solo debe contener letras."); return; }
    if (!/^9\d{8}$/.test(numeroLimpio)) { setMensaje("El número debe iniciar con 9 y tener 9 dígitos."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/clientes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nombreLimpio, correo: correoLimpio, contraseña: form.contraseña, numero: numeroLimpio, documento: form.documento, tipo_cliente_id: form.tipo_cliente_id, tipo_documento: form.tipo_documento }) });
      const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = { success: false, message: text }; }
      if (json.success) {
        if (json.token) {
          saveCliente(json);
          try { const id = json.cliente?.id_cliente, c = localStorage.getItem("carrito_id"); if (id && c) await fetch(`${API_BASE}/api/carrito_compras/attach`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carrito_id: c, cliente_id: id }) }); } catch {}
          navigate(fromPath || "/user", { replace: true });
          return;
        }

        // Respaldo: login interno si el endpoint de registro no devuelve token.
        const loginRes = await fetch(`${API_BASE}/api/clientes/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: correoLimpio, contraseña: form.contraseña })
        });
        const loginJson = await loginRes.json().catch(() => ({}));
        if (!(loginRes.status === 200 && loginJson.success)) {
          setMensaje("La cuenta se creó, pero no se pudo iniciar sesión automática. Inicia sesión manualmente.");
          setLoading(false);
          return;
        }
        saveCliente(loginJson);
        try { const id = loginJson.cliente?.id_cliente, c = localStorage.getItem("carrito_id"); if (id && c) await fetch(`${API_BASE}/api/carrito_compras/attach`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carrito_id: c, cliente_id: id }) }); } catch {}
        navigate(fromPath || "/user", { replace: true });
        return;
      } else { setMensaje(json.error?.message || json.error || json.message || "No se pudo registrar"); }
      setLoading(false);
    } catch { setMensaje("Error de conexión"); setLoading(false); }
  };

  // ── Login con validación personalizada (sin tooltip nativo del browser) ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!loginForm.correo)     { showTooltip("correo"); return; }
    if (!loginForm.contraseña) { showTooltip("pass");   return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/clientes/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ correo: loginForm.correo, contraseña: loginForm.contraseña }) });
      const json = await res.json();
      if (res.status === 200 && json.success) {
        saveCliente(json);
        try {
          const c = localStorage.getItem("carrito_id"), id = json.cliente?.id_cliente;
          if (id) {
            if (c) await fetch(`${API_BASE}/api/carrito_compras/attach`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carrito_id: c, cliente_id: id }) });
            else {
              const r = await fetch(`${API_BASE}/api/carrito_compras`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cliente_id: id }) });
              const j = await r.json().catch(() => ({}));
              if (j?.carrito_id) localStorage.setItem("carrito_id", j.carrito_id);
            }
          }
        } catch {}
        navigate(fromPath || "/user", { replace: true });
      } else if (res.status === 404)  { setMensaje("Correo incorrecto"); }
        else if (res.status === 403 && json.message?.includes("Google")) { setMensaje("Este usuario fue registrado con Google. Vuelve a iniciar sesión con Google."); }
        else if (res.status === 401)  { setMensaje("Contraseña incorrecta"); }
        else { setMensaje(json.message || "Credenciales incorrectas"); }
      setLoading(false);
    } catch { setMensaje("Error de conexión"); setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      paddingTop: 72,
      paddingBottom: 20,
      overflowY: "auto",
      overflowX: "hidden",
      fontFamily: "'Open Sans',sans-serif",
      background: "rgba(128,194,220,0.08)",
    }}>
      {/* Fondos decorativos */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(128,194,220,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 200, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(128,194,220,0.05) 0%,transparent 70%)", top: "20%", left: "-3%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 180, height: 350, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(128,194,220,0.05) 0%,transparent 70%)", top: "25%", right: "-2%", pointerEvents: "none" }} />

      {/* ── CARD con respiración ── */}
      <div
        className="lb-card-breathe"
        style={{
          width: "100%", maxWidth: 700,
          display: "flex", flexDirection: "row",
          borderRadius: 22, overflow: "hidden",
          position: "relative", zIndex: 1,
          border: "1px solid rgba(128,194,220,0.25)",
        }}
      >
        <div className="lb-mobile-switch">
          <button
            type="button"
            className={`lb-mobile-switch-btn ${isLogin ? "lb-active" : ""}`}
            onClick={() => { setMensaje(""); hideTooltip(); setIsLogin(true); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`lb-mobile-switch-btn ${!isLogin ? "lb-active" : ""}`}
            onClick={() => { setMensaje(""); hideTooltip(); setIsLogin(false); }}
          >
            Registro
          </button>
        </div>

        {/* ── LOGIN (izquierda) ── */}
        <div className={`lb-login-panel ${isLogin ? "lb-mobile-active" : "lb-mobile-hidden"}`} style={{
          width: "50%", padding: "36px 30px",
          background: "linear-gradient(160deg, rgba(128,194,220,0.22) 0%, rgba(80,160,200,0.18) 40%, rgba(40,120,170,0.25) 100%)",
          backdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
          WebkitBackdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
          borderRight: "1px solid rgba(128,194,220,0.3)",
          boxShadow: "inset 0 0 40px rgba(128,194,220,0.08), inset 1px 0 0 rgba(255,255,255,0.15)",
          display: "flex", flexDirection: "column", justifyContent: "center",
          opacity: isLogin ? 1 : 0, transition: "opacity 0.3s ease",
          pointerEvents: isLogin ? "auto" : "none",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(128,194,220,0.6),transparent)", pointerEvents: "none" }} />

          {/* Ícono V */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="lb-icon-container" style={{
              width: 58, height: 58, borderRadius: "50%",
              border: "2px solid rgba(128,194,220,0.5)",
              background: "rgba(0,40,70,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(128,194,220,0.3), inset 0 0 20px rgba(128,194,220,0.05)",
            }}>
              <svg className="v-icon-animated" width="28" height="28" viewBox="0 0 30 30" fill="none">
                <path d="M 6 6 L 15 24 L 24 6" stroke="#80C2DC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ color: "#80C2DC" }} />
              </svg>
            </div>
          </div>

          <h2 className="lb-heading-main" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 28, color: "#fff", margin: "0 0 20px", lineHeight: 1, textAlign: "center", textShadow: "0 2px 16px rgba(0,60,100,0.5), 0 0 30px rgba(128,194,220,0.4)" }}>
            Iniciar Sesión
          </h2>

          {/* noValidate suprime los tooltips nativos del browser */}
          <form onSubmit={handleLogin} noValidate className="lb-form-gap" style={{ display: "flex", flexDirection: "column", gap: 11 }}>

            {/* Campo correo */}
            <div style={{ position: "relative" }}>
              {tooltip.visible && tooltip.field === "correo" && (
                <div className="lb-tooltip">
                  <span className="lb-tooltip-icon">!</span>
                  <span className="lb-tooltip-text">Completa este campo</span>
                </div>
              )}
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13 }}>
                <IconMail stroke={1} />
              </span>
              <input
                className="lb-input"
                type="email"
                placeholder="Correo electrónico"
                value={loginForm.correo}
                onChange={e => { setLoginForm({ ...loginForm, correo: e.target.value }); hideTooltip(); }}
                onBlur={e => setLoginForm({ ...loginForm, correo: e.target.value.trimEnd() })}
                onFocus={hideTooltip}
              />
            </div>

            {/* Campo contraseña */}
            <div style={{ position: "relative" }}>
              {tooltip.visible && tooltip.field === "pass" && (
                <div className="lb-tooltip">
                  <span className="lb-tooltip-icon">!</span>
                  <span className="lb-tooltip-text">Completa este campo</span>
                </div>
              )}
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(180,225,245,0.85)", fontSize: 13, cursor: "pointer" }}
              >
                {showPassword ? <IconLock stroke={1} /> : <IconLockFilled />}
              </span>
              <input
                className="lb-input"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={loginForm.contraseña}
                onChange={e => { setLoginForm({ ...loginForm, contraseña: e.target.value }); hideTooltip(); }}
                onFocus={hideTooltip}
              />
            </div>

            <div style={{ textAlign: "right", marginTop: -4 }}>
              <a href="#" className="lb-link">¿Olvidaste tu contraseña?</a>
            </div>

            <button className="lb-btn-red" type="submit" disabled={loading} style={{ marginTop: 2 }}>
              {loading ? "Cargando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="lb-divider" style={{ margin: "14px 0 10px" }}>O ingresa con</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div id="googleSignInDivLogin" />
          </div>
          {isLogin && <NoticeMessage text={mensaje} />}
        </div>

        {/* Mobile separator */}
        <div className="lb-mobile-separator" style={{ display: "none" }} />

        {/* ── PANEL CENTRAL DESLIZANTE ── */}
        <div className="lb-sliding-panel" style={{
          position: "absolute", top: 0,
          left: isLogin ? "50%" : "0%",
          width: "50%", height: "100%",
          background: `linear-gradient(145deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 50%, ${COLORS.primaryDark} 100%)`,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "32px 22px", zIndex: 10,
          transition: "left 0.7s cubic-bezier(0.77,0,0.18,1)",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${COLORS.secondary},${COLORS.accent},${COLORS.primary})`, boxShadow: "0 0 10px rgba(128,194,220,0.5)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 20, right: 20, width: 44, height: 44, border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 22, left: 20, width: 30, height: 30, border: "1px solid rgba(255,214,0,0.25)", transform: "rotate(45deg)", pointerEvents: "none" }} />

          <div style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 190 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 22px rgba(255,255,255,0.15)",
            }}>
              <svg className="v-icon-animated" width="26" height="26" viewBox="0 0 30 30" fill="none">
                <path d="M 6 6 L 15 24 L 24 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ color: "#fff" }} />
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 22, color: "#fff", marginBottom: 8, lineHeight: 1.2, textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
              {isLogin ? "¿Primera vez?" : "¿Ya tienes cuenta?"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontFamily: "'Open Sans',sans-serif", lineHeight: 1.6, marginBottom: 22 }}>
              {isLogin ? "Regístrate y accede a todos los servicios de VidriosBras." : "Inicia sesión para continuar."}
            </p>
            <button className="lb-btn-ghost" onClick={() => { setMensaje(""); hideTooltip(); setIsLogin(!isLogin); }}>
              {isLogin ? "Regístrate" : "Inicia Sesión"}
            </button>
          </div>
        </div>

        {/* ── REGISTRO (derecha) ── */}
        <LoginRegister
          panelClassName={!isLogin ? "lb-mobile-active" : "lb-mobile-hidden"}
          isLogin={isLogin} tipoDoc={tipoDoc} handleTipoDoc={handleTipoDoc}
          form={form} setForm={setForm} handleDocumentoBlur={handleDocumentoBlur}
          documentoValido={documentoValido} docLoading={docLoading}
          mensaje={mensaje} handleSubmit={handleSubmit}
          documentoInputRef={docRef} loading={loading}
          glass={{
            background: "linear-gradient(160deg, rgba(128,194,220,0.22) 0%, rgba(80,160,200,0.18) 40%, rgba(40,120,170,0.25) 100%)",
            backdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
            WebkitBackdropFilter: "blur(28px) saturate(200%) brightness(1.08)",
            boxShadow: "inset 0 0 40px rgba(128,194,220,0.08), inset -1px 0 0 rgba(255,255,255,0.1)",
          }}
        />
      </div>
    </div>
  );
}