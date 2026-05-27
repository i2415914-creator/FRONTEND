
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconPhone, IconId, IconUser, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";

const CompletaDatosGoogle = ({ onDatosActualizados, asModal = false, onClose }) => {
  const [form, setForm] = useState({
    nombre: "",
    numero: "",
    documento: "",
    tipo_documento_id: "",
    tipo: "",
    tipo_cliente_id: "",
  });
  const [tipoClienteIds, setTipoClienteIds] = useState({ RUC: "", DNI: "" });
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [tiposDocumento, setTiposDocumento] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from;

  useEffect(() => {
    fetch("/api/tipo_documento")
      .then(async (r) => {
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = null; }
        if (j && j.success && Array.isArray(j.tipos)) {
          setTiposDocumento(j.tipos);
          const toUpper = (s) => (s || "").toString().toUpperCase();
          const ruc = (j.tipos || []).find((x) => toUpper(x.descripcion).includes("RUC"));
          const dni = (j.tipos || []).find((x) => toUpper(x.descripcion).includes("DNI"));
          setTipoClienteIds({ RUC: ruc ? ruc.id_tipo : "", DNI: dni ? dni.id_tipo : "" });
        }
      })
      .catch(() => setTiposDocumento([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      if (!asModal) navigate("/login");
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/clientes/me", { headers: { Authorization: `Bearer ${token}` } });
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = null; }
        if (r.ok && j?.success && j?.cliente) {
          setForm((prev) => ({
            ...prev,
            nombre: j.cliente.nombre || "",
            numero: j.cliente.numero || "",
            documento: j.cliente.documento || "",
          }));
        }
      } catch {}
      setCargandoDatos(false);
    })();
  }, [navigate, asModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const nuevo = { ...f, [name]: value };

      if (name === "numero") {
        // Solo digitos, sin negativos, maximo 9 y siempre iniciando en 9
        let soloDigitos = (value || "").replace(/\D+/g, "").slice(0, 9);
        if (soloDigitos.length === 1 && soloDigitos !== "9") {
          soloDigitos = "9";
        } else if (soloDigitos.length > 1 && soloDigitos[0] !== "9") {
          soloDigitos = `9${soloDigitos.slice(1)}`;
        }
        nuevo.numero = soloDigitos;
      }

      if (name === "documento") {
        // Solo digitos, sin negativos, longitud segun tipo seleccionado
        const soloDigitos = (value || "").replace(/\D+/g, "");
        const tipoSel = tiposDocumento.find((td) => td.id_tipo === f.tipo_documento_id);
        const descSel = (tipoSel?.descripcion || "").toUpperCase();
        const maxLen = descSel.includes("DNI") ? 8 : descSel.includes("RUC") ? 11 : 15;
        nuevo.documento = soloDigitos.slice(0, maxLen);
      }

      if (name === "nombre") {
        // No permitir numeros ni signo negativo
        nuevo.nombre = (value || "").replace(/[0-9-]/g, "");
      }

      if (name === "tipo_documento_id") {
        const doc = tiposDocumento.find((td) => td.id_tipo === value);
        nuevo.tipo = doc ? doc.descripcion : "";
        nuevo.documento = "";
        nuevo.nombre = "";
        if (doc) {
          const desc = doc.descripcion.toUpperCase();
          if (desc.includes("RUC")) nuevo.tipo_cliente_id = tipoClienteIds.RUC;
          else if (desc.includes("DNI")) nuevo.tipo_cliente_id = tipoClienteIds.DNI;
          else nuevo.tipo_cliente_id = "";
        }
      }
      return nuevo;
    });
  };

  const handleDocumentoBlur = async () => {
    setMensaje("");
    if (!form.documento || !form.tipo_documento_id) return;

    const tipoSel = tiposDocumento.find((td) => td.id_tipo === form.tipo_documento_id);
    const desc = (tipoSel?.descripcion || "").toUpperCase();
    const tipoConsulta = desc.includes("RUC") ? "RUC" : desc.includes("DNI") ? "DNI" : (tipoSel?.descripcion || "");
    const numero = (form.documento || "").trim();

    if (tipoConsulta === "DNI" && numero.length !== 8) {
      setMensaje("El DNI debe tener 8 dígitos");
      return;
    }
    if (tipoConsulta === "RUC" && numero.length !== 11) {
      setMensaje("El RUC debe tener 11 dígitos");
      return;
    }

    setDocLoading(true);
    try {
      const res = await fetch("/api/consulta_documento_html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: tipoConsulta, numero }),
      });
      const data = await res.json();
      if (!data?.success || data?.error) {
        setMensaje(data?.message || "No se encontró el documento en RENIEC/SUNAT");
        setForm((f) => ({ ...f, nombre: "" }));
        return;
      }
      setForm((f) => ({ ...f, nombre: data?.html || "" }));
    } catch {
      setMensaje("Error consultando documento.");
      setForm((f) => ({ ...f, nombre: "" }));
    } finally {
      setDocLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    const numero = (form.numero || "").trim();
    const documento = (form.documento || "").trim();
    const nombre = (form.nombre || "").trim();

    if (!numero || !form.tipo_documento_id || !documento || !nombre) {
      setMensaje("Completa todos los campos obligatorios");
      return;
    }

    if (!/^9\d{8}$/.test(numero)) {
      setMensaje("El numero debe empezar con 9 y tener 9 digitos");
      return;
    }

    if (!/^\d+$/.test(documento)) {
      setMensaje("El documento solo puede contener numeros");
      return;
    }

    const tipoSel = tiposDocumento.find((td) => td.id_tipo === form.tipo_documento_id);
    const descSel = (tipoSel?.descripcion || "").toUpperCase();
    if (descSel.includes("DNI") && documento.length !== 8) {
      setMensaje("El DNI debe tener 8 digitos");
      return;
    }
    if (descSel.includes("RUC") && documento.length !== 11) {
      setMensaje("El RUC debe tener 11 digitos");
      return;
    }

    if (/\d/.test(nombre)) {
      setMensaje("El nombre no puede contener numeros");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const body = {
        nombre: form.nombre,
        numero: form.numero,
        documento: form.documento,
        tipo_cliente_id: form.tipo_cliente_id,
      };
      const res = await fetch("/api/clientes/actualiza_datos_google", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json?.success) {
        setMensaje(json.message || "No se pudo actualizar");
        return;
      }

      try {
        ["cliente_nombre", "cliente_numero", "cliente_documento"].forEach((k) => localStorage.removeItem(k));
      } catch {}

      if (onDatosActualizados) onDatosActualizados(form);

      if (asModal) {
        if (onClose) onClose();
      } else {
        if (fromPath) navigate(fromPath, { replace: true });
        else navigate("/user", { replace: true });
      }
    } catch {
      setMensaje("Error de conexión");
    }
    setLoading(false);
  };

  if (cargandoDatos) {
    return <div style={{ textAlign: "center", marginTop: 40 }}>Cargando datos...</div>;
  }

  const fieldWrap = { position: "relative" };
  const fieldIcon = {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#5a8ba8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  };
  const inputBase = {
    width: "100%",
    padding: "11px 12px 11px 38px",
    borderRadius: 9,
    border: "1px solid rgba(128,194,220,0.55)",
    background: "rgba(232,244,249,0.75)",
    fontSize: 15,
    color: "#1f2937",
    outline: "none",
  };

  const getNoticeType = (text, isLoading = false) => {
    if (isLoading) return "info";
    if (!text) return "info";
    const lower = text.toLowerCase();
    if (lower.includes("guard") || lower.includes("actualiz")) return "success";
    if (lower.includes("consultando") || lower.includes("verificando")) return "info";
    return "error";
  };

  const noticeType = getNoticeType(mensaje);
  const noticeStyles = {
    base: {
      marginTop: 2,
      borderRadius: 10,
      border: "1px solid rgba(128,194,220,0.35)",
      background: "linear-gradient(135deg, rgba(0,20,50,0.92), rgba(0,35,70,0.95))",
      boxShadow: "0 0 18px rgba(128,194,220,0.18), 0 4px 16px rgba(0,0,0,0.25)",
      padding: "8px 10px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontFamily: "'Open Sans', sans-serif",
      fontSize: 12,
      lineHeight: 1.35,
      color: "rgba(200,235,255,0.95)",
    },
    info: {
      borderColor: "rgba(128,194,220,0.45)",
      color: "rgba(200,235,255,0.95)",
    },
    error: {
      borderColor: "rgba(248,113,113,0.45)",
      background: "linear-gradient(135deg, rgba(65,10,18,0.92), rgba(95,20,28,0.96))",
      color: "#fecaca",
    },
    success: {
      borderColor: "rgba(52,211,153,0.45)",
      background: "linear-gradient(135deg, rgba(6,44,32,0.92), rgba(9,70,48,0.96))",
      color: "#a7f3d0",
    },
  };

  const formCard = (
    <div style={{ maxWidth: 560, width: "100%", background: "rgba(232,244,249,0.86)", borderRadius: 18, boxShadow: "0 20px 50px rgba(15,23,42,0.22)", border: "1px solid rgba(128,194,220,0.45)", padding: 22, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontFamily: "'Oswald',sans-serif", color: "#1f2937", fontSize: 24 }}>Completa tus datos</h3>
        {asModal && (
          <button onClick={onClose} style={{ border: "none", background: "rgba(148,25,24,0.09)", color: "#941918", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>X</button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={fieldWrap}>
          <span style={fieldIcon}><IconPhone size={16} stroke={2} /></span>
          <input name="numero" value={form.numero} onChange={handleChange} placeholder="Número de teléfono" required inputMode="numeric" maxLength={9} style={inputBase} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ ...fieldWrap, width: 170 }}>
            <span style={fieldIcon}><IconId size={16} stroke={2} /></span>
            <select name="tipo_documento_id" value={form.tipo_documento_id} onChange={handleChange} required style={{ ...inputBase, fontSize: 14, appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}>
              <option value="">Tipo documento</option>
              {tiposDocumento.map((td) => (
                <option key={td.id_tipo} value={td.id_tipo}>{td.descripcion}</option>
              ))}
            </select>
          </div>
          <div style={{ ...fieldWrap, flex: 1 }}>
            <span style={fieldIcon}><IconId size={16} stroke={2} /></span>
            <input name="documento" value={form.documento} onChange={handleChange} onBlur={handleDocumentoBlur} placeholder="Documento" required inputMode="numeric" maxLength={form.tipo?.toUpperCase().includes("DNI") ? 8 : form.tipo?.toUpperCase().includes("RUC") ? 11 : 15} style={inputBase} />
          </div>
        </div>

        <div style={fieldWrap}>
          <span style={fieldIcon}><IconUser size={16} stroke={2} /></span>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo" required style={{ ...inputBase, fontWeight: 600 }} />
        </div>

        {docLoading && (
          <div style={{ ...noticeStyles.base, ...noticeStyles.info }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconInfoCircle size={17} stroke={2} />
            </span>
            <span style={{ flex: 1 }}>Consultando documento...</span>
          </div>
        )}

        {mensaje && (
          <div style={{ ...noticeStyles.base, ...(noticeType === "success" ? noticeStyles.success : noticeType === "error" ? noticeStyles.error : noticeStyles.info) }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {noticeType === "error" ? <IconAlertCircle size={17} stroke={2} /> : <IconInfoCircle size={17} stroke={2} />}
            </span>
            <span style={{ flex: 1 }}>{mensaje}</span>
          </div>
        )}

        <button type="submit" disabled={loading} style={{ marginTop: 2, padding: "11px 12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#941918,#c94543)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {loading ? "Guardando..." : "Guardar y continuar"}
        </button>
      </form>
    </div>
  );

  if (!asModal) {
    return <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 12px" }}>{formCard}</div>;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(90, 140, 170, 0.24)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {formCard}
    </div>
  );
};

export default CompletaDatosGoogle;
