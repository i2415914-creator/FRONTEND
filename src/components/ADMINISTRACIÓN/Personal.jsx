import React, { useEffect, useState, useCallback, useMemo } from "react";
import { COLORS, FONTS } from "../../colors";

const Personal = () => {
  const [personalList, setPersonalList] = useState([]);
  const [tipoPersonalList, setTipoPersonalList] = useState([]);
  const [mostrarNuevoPersonal, setMostrarNuevoPersonal] = useState(false);
  const [nuevoPersonal, setNuevoPersonal] = useState({
    nombre: "",
    codigo: "",
    tipo_personal_id: "",
    cv: "",
    fecha_nacimiento: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [subiendoCv, setSubiendoCv] = useState(false);
  const [allBonos, setAllBonos] = useState([]);
  const [nuevoBono, setNuevoBono] = useState("");
  const [bonoAEliminar, setBonoAEliminar] = useState("");
  const [selectedBonoId, setSelectedBonoId] = useState("");
  const [selectedPersonalIds, setSelectedPersonalIds] = useState([]);
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [personalBonos, setPersonalBonos] = useState([]);
  const [montoPagoBono, setMontoPagoBono] = useState("");
  const [montoPagoMensual, setMontoPagoMensual] = useState("");
  const [toast, setToast] = useState(null);
  const [erroresPersonal, setErroresPersonal] = useState({});
  const [erroresMontoBono, setErroresMontoBono] = useState("");
  const [erroresMontoMensual, setErroresMontoMensual] = useState("");
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Funciones de validación
  const validarPersonal = (personal) => {
    const errores = {};
    if (!personal.nombre.trim()) {
      errores.nombre = "El nombre es requerido";
    } else if (personal.nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    if (!personal.codigo.trim()) {
      errores.codigo = "El código es requerido";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(personal.codigo)) {
      errores.codigo = "El código solo puede contener letras, números, guiones y guiones bajos";
    }
    if (!personal.tipo_personal_id) {
      errores.tipo_personal_id = "Debe seleccionar un tipo de personal";
    }
    if (personal.fecha_nacimiento) {
      const fecha = new Date(personal.fecha_nacimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) {
        errores.fecha_nacimiento = "La fecha no puede ser en el pasado";
      }
    }
    return errores;
  };

  const validarMonto = (monto, tipo = "bono") => {
    if (!monto || monto.trim() === "") {
      return `El monto del ${tipo} es requerido`;
    }
    const num = parseFloat(monto);
    if (isNaN(num)) {
      return `El monto debe ser un número válido`;
    }
    if (num <= 0) {
      return `El monto debe ser mayor a 0`;
    }
    if (num > 999999) {
      return `El monto no puede exceder 999,999`;
    }
    return "";
  };

  const limpiarMonto = (valor) => {
    // Remover cualquier carácter que no sea dígito o punto decimal
    const limpio = valor.replace(/[^0-9.]/g, "");
    // Evitar múltiples puntos
    const partes = limpio.split(".");
    if (partes.length > 2) {
      return partes[0] + "." + partes.slice(1).join("");
    }
    return limpio;
  };

  const showToast = useCallback((mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchPersonal = async () => {
    try {
      const res = await fetch("/api/personal");
      const data = await res.json();
      setPersonalList(data.success ? data.data : []);
    } catch (e) {
      showToast("Error al cargar personal", "error");
    }
  };

  const fetchAllBonos = async () => {
    try {
      const res = await fetch("/api/bonos");
      const data = await res.json();
      setAllBonos(data.success ? data.data : []);
    } catch (e) {
      showToast("Error al cargar bonos", "error");
    }
  };

  const fetchTipoPersonal = async () => {
    try {
      const res = await fetch("/api/tipo_personal");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTipoPersonalList(data);
      } else {
        setTipoPersonalList(data.success ? data.data : []);
      }
    } catch (e) {
      showToast("Error al cargar tipos de personal", "error");
    }
  };

  const fetchPersonalBonos = async (personalId) => {
    try {
      const res = await fetch(`/api/personal/${personalId}/bonos`);
      const data = await res.json();
      setPersonalBonos(data.success ? data.data : []);
    } catch (e) {
      showToast("Error al cargar bonos", "error");
    }
  };

  const uploadCvFile = async (file) => {
    if (!file) return null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/personal/upload-cv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        return data.data.url;
      } else {
        showToast(data.message || "Error al subir el CV", "error");
        return null;
      }
    } catch (e) {
      showToast("Error al subir el CV", "error");
      return null;
    }
  };

  useEffect(() => {
    fetchPersonal();
    fetchTipoPersonal();
    fetchAllBonos();
  }, []);

  const handleCrearPersonal = async () => {
    const errores = validarPersonal(nuevoPersonal);
    setErroresPersonal(errores);
    
    if (Object.keys(errores).length > 0) {
      showToast("Completa correctamente todos los campos requeridos", "error");
      return;
    }

    try {
      let cvUrl = nuevoPersonal.cv;
      
      // Si hay un archivo seleccionado, validar que sea PDF
      if (cvFile) {
        if (cvFile.type !== "application/pdf") {
          showToast("El CV debe ser un archivo PDF", "error");
          return;
        }
        if (cvFile.size > 5 * 1024 * 1024) { // 5MB
          showToast("El archivo PDF no debe exceder 5MB", "error");
          return;
        }
        setSubiendoCv(true);
        cvUrl = await uploadCvFile(cvFile);
        setSubiendoCv(false);
        if (!cvUrl) {
          return;
        }
      }

      const res = await fetch("/api/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoPersonal,
          cv: cvUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Personal creado correctamente");
        setNuevoPersonal({
          nombre: "",
          codigo: "",
          tipo_personal_id: "",
          cv: "",
          fecha_nacimiento: "",
        });
        setCvFile(null);
        setMostrarNuevoPersonal(false);
        setErroresPersonal({});
        await fetchPersonal();
      } else {
        showToast(data.message || "Error al crear personal", "error");
      }
    } catch (e) {
      showToast("Error al crear personal", "error");
    }
  };

  const handleSelectPersonal = (personal) => {
    setSelectedPersonal(personal);
    fetchPersonalBonos(personal.id_personal);
    setMontoPagoBono("");
    setMontoPagoMensual("");
  };

  const handleTogglePersonalCheck = (personalId) => {
    if (!selectedBonoId) {
      return;
    }

    setSelectedPersonalIds((prev) => {
      if (prev.includes(personalId)) {
        return prev.filter((id) => id !== personalId);
      }
      return [...prev, personalId];
    });
  };

  const handleGuardarAsignacionBono = async () => {
    if (!selectedBonoId) {
      showToast("Selecciona un bono", "error");
      return;
    }
    if (selectedPersonalIds.length === 0) {
      showToast("Selecciona al menos un personal", "error");
      return;
    }

    setGuardandoAsignacion(true);
    try {
      const resultados = await Promise.all(
        selectedPersonalIds.map(async (personalId) => {
          const res = await fetch(`/api/personal/${personalId}/bonos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bono_id: selectedBonoId }),
          });
          const data = await res.json();
          return { ok: Boolean(data.success), personalId };
        })
      );

      const exitos = resultados.filter((r) => r.ok).length;
      const fallidos = resultados.length - exitos;

      if (exitos > 0 && fallidos === 0) {
        showToast(`Bono asignado a ${exitos} personal`);
      } else if (exitos > 0) {
        showToast(`Asignados: ${exitos}, con error: ${fallidos}`, "error");
      } else {
        showToast("No se pudo asignar el bono", "error");
      }

      setSelectedPersonalIds([]);
      if (selectedPersonal?.id_personal) {
        fetchPersonalBonos(selectedPersonal.id_personal);
      }
    } catch (e) {
      showToast("Error al guardar asignacion", "error");
    } finally {
      setGuardandoAsignacion(false);
    }
  };

  const handleCrearBono = async () => {
    const descripcion = nuevoBono.trim();
    if (!descripcion) {
      showToast("Ingresa el nombre del bono", "error");
      return;
    }

    try {
      const res = await fetch("/api/bonos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Bono creado");
        setNuevoBono("");
        await fetchAllBonos();
      } else {
        showToast(data.message || "Error al crear bono", "error");
      }
    } catch (e) {
      showToast("Error al crear bono", "error");
    }
  };

  const handleEliminarBono = async () => {
    if (!bonoAEliminar) {
      showToast("Selecciona un bono para eliminar", "error");
      return;
    }

    try {
      const res = await fetch(`/api/bonos/${bonoAEliminar}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Bono eliminado");
        if (selectedBonoId === bonoAEliminar) {
          setSelectedBonoId("");
        }
        setBonoAEliminar("");
        await fetchAllBonos();
      } else {
        showToast(data.message || "Error al eliminar bono", "error");
      }
    } catch (e) {
      showToast("Error al eliminar bono", "error");
    }
  };

  const handleEliminarPersonal = async () => {
    if (!selectedPersonal) return;

    const confirmEliminar = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${selectedPersonal.nombre}? Esta acción no se puede deshacer.`
    );

    if (!confirmEliminar) return;

    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${selectedPersonal.nombre} eliminado correctamente`);
        setSelectedPersonal(null);
        setErroresPersonal({});
        await fetchPersonal();
      } else {
        showToast(data.message || "Error al eliminar personal", "error");
      }
    } catch (e) {
      showToast("Error al eliminar personal", "error");
    }
  };

  const handlePagarBono = async () => {
    const error = validarMonto(montoPagoBono, "bono");
    setErroresMontoBono(error);
    
    if (error) {
      showToast(error, "error");
      return;
    }
    
    if (!selectedPersonal) {
      showToast("Selecciona un personal", "error");
      return;
    }

    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/pago-bono`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: parseFloat(montoPagoBono), fecha: new Date().toISOString().split("T")[0] }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Bono pagado y registrado correctamente");
        setMontoPagoBono("");
        setErroresMontoBono("");
      } else {
        showToast(data.message || "Error al pagar bono", "error");
      }
    } catch (e) {
      showToast("Error al pagar bono", "error");
    }
  };

  const handlePagarMensual = async () => {
    const error = validarMonto(montoPagoMensual, "pago mensual");
    setErroresMontoMensual(error);
    
    if (error) {
      showToast(error, "error");
      return;
    }
    
    if (!selectedPersonal) {
      showToast("Selecciona un personal", "error");
      return;
    }

    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: parseFloat(montoPagoMensual), fecha: new Date().toISOString().split("T")[0] }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pago mensual registrado correctamente");
        setMontoPagoMensual("");
        setErroresMontoMensual("");
      } else {
        showToast(data.message || "Error al registrar pago mensual", "error");
      }
    } catch (e) {
      showToast("Error al registrar pago mensual", "error");
    }
  };

  const nextPayText = (() => {
    const today = new Date();
    const day = today.getDate();
    const nextPayDay = day < 15 ? 15 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const nextPayMonth = day < 15 ? today.getMonth() : today.getMonth() + 1;
    const nextPayDate = new Date(today.getFullYear(), nextPayMonth, nextPayDay);
    return nextPayDate.toLocaleDateString("es-ES");
  })();

  const tiposPersonalDisponibles = useMemo(() => {
    const mapa = new Map();

    (tipoPersonalList || []).forEach((t) => {
      const id = t?.id_tipo;
      const descripcion = (t?.descripcion || "").trim();
      if (id && descripcion) {
        mapa.set(id, { id_tipo: id, descripcion });
      }
    });

    (personalList || []).forEach((p) => {
      const id = p?.tipo_personal?.id_tipo;
      const descripcion = (p?.tipo_personal?.descripcion || "").trim();
      if (id && descripcion && !mapa.has(id)) {
        mapa.set(id, { id_tipo: id, descripcion });
      }
    });

    return Array.from(mapa.values()).sort((a, b) => a.descripcion.localeCompare(b.descripcion, "es"));
  }, [tipoPersonalList, personalList]);

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: windowWidth < 768 ? "1fr" : "1fr 1.2fr", 
      gap: 20 
    }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "10px 14px",
            borderRadius: 12,
            color: COLORS.white,
            background: toast.tipo === "success" ? COLORS.success : COLORS.error,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            fontWeight: 700,
            zIndex: 50,
            fontFamily: FONTS.heading,
          }}
        >
          {toast.mensaje}
        </div>
      )}

      {/* Tabla de personal */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, fontFamily: FONTS.heading, color: COLORS.text }}>
            Personal de la Empresa
          </h3>
          <button
            onClick={() => setMostrarNuevoPersonal((v) => !v)}
            style={{ background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontFamily: FONTS.heading, cursor: "pointer" }}
          >
            {mostrarNuevoPersonal ? "Cancelar" : "Nuevo personal"}
          </button>
        </div>

        {mostrarNuevoPersonal && (
          <div style={{ marginBottom: 12, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 10, background: COLORS.white, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: windowWidth < 640 ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <div>
                <input
                  type="text"
                  placeholder="Nombre (mín. 3 caracteres)"
                  value={nuevoPersonal.nombre}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, nombre: e.target.value }));
                    if (e.target.value.trim()) {
                      setErroresPersonal((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.nombre;
                        return newErrors;
                      });
                    }
                  }}
                  style={{ 
                    width: "100%",
                    padding: 10, 
                    borderRadius: 8, 
                    border: `1px solid ${erroresPersonal.nombre ? COLORS.error : COLORS.border}`, 
                    fontFamily: FONTS.body, 
                    color: COLORS.text,
                    boxShadow: erroresPersonal.nombre ? `0 0 0 2px ${COLORS.error}22` : "none"
                  }}
                />
                {erroresPersonal.nombre && (
                  <div style={{ fontSize: "0.75rem", color: COLORS.error, marginTop: 4, fontFamily: FONTS.body }}>
                    {erroresPersonal.nombre}
                  </div>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Código (letras, números, -, _)"
                  value={nuevoPersonal.codigo}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, codigo: e.target.value }));
                    if (e.target.value.trim()) {
                      setErroresPersonal((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.codigo;
                        return newErrors;
                      });
                    }
                  }}
                  style={{ 
                    width: "100%",
                    padding: 10, 
                    borderRadius: 8, 
                    border: `1px solid ${erroresPersonal.codigo ? COLORS.error : COLORS.border}`, 
                    fontFamily: FONTS.body, 
                    color: COLORS.text,
                    boxShadow: erroresPersonal.codigo ? `0 0 0 2px ${COLORS.error}22` : "none"
                  }}
                />
                {erroresPersonal.codigo && (
                  <div style={{ fontSize: "0.75rem", color: COLORS.error, marginTop: 4, fontFamily: FONTS.body }}>
                    {erroresPersonal.codigo}
                  </div>
                )}
              </div>
              <div>
                <select
                  value={nuevoPersonal.tipo_personal_id}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, tipo_personal_id: e.target.value }));
                    if (e.target.value) {
                      setErroresPersonal((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.tipo_personal_id;
                        return newErrors;
                      });
                    }
                  }}
                  style={{ 
                    width: "100%",
                    padding: 10, 
                    borderRadius: 8, 
                    border: `1px solid ${erroresPersonal.tipo_personal_id ? COLORS.error : COLORS.border}`, 
                    fontFamily: FONTS.body, 
                    color: COLORS.text,
                    boxShadow: erroresPersonal.tipo_personal_id ? `0 0 0 2px ${COLORS.error}22` : "none"
                  }}
                >
                  <option value="">-- Tipo de personal --</option>
                  {tiposPersonalDisponibles.map((t) => (
                    <option key={t.id_tipo} value={t.id_tipo}>{t.descripcion}</option>
                  ))}
                </select>
                {erroresPersonal.tipo_personal_id && (
                  <div style={{ fontSize: "0.75rem", color: COLORS.error, marginTop: 4, fontFamily: FONTS.body }}>
                    {erroresPersonal.tipo_personal_id}
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  style={{ 
                    width: "100%",
                    padding: 10, 
                    borderRadius: 8, 
                    border: `1px solid ${COLORS.border}`, 
                    fontFamily: FONTS.body, 
                    color: COLORS.text
                  }}
                />
                <div style={{ fontSize: "0.75rem", color: COLORS.textLight, marginTop: 4, fontFamily: FONTS.body }}>
                  Máx 5MB, formato PDF
                </div>
              </div>
              <div>
                <input
                  type="date"
                  value={nuevoPersonal.fecha_nacimiento}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setNuevoPersonal((prev) => ({ ...prev, fecha_nacimiento: e.target.value }));
                    if (e.target.value) {
                      setErroresPersonal((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.fecha_nacimiento;
                        return newErrors;
                      });
                    }
                  }}
                  style={{ 
                    width: "100%",
                    padding: 10, 
                    borderRadius: 8, 
                    border: `1px solid ${erroresPersonal.fecha_nacimiento ? COLORS.error : COLORS.border}`, 
                    fontFamily: FONTS.body, 
                    color: COLORS.text,
                    boxShadow: erroresPersonal.fecha_nacimiento ? `0 0 0 2px ${COLORS.error}22` : "none"
                  }}
                />
                {erroresPersonal.fecha_nacimiento && (
                  <div style={{ fontSize: "0.75rem", color: COLORS.error, marginTop: 4, fontFamily: FONTS.body }}>
                    {erroresPersonal.fecha_nacimiento}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, gap: 10 }}>
              <button
                onClick={() => {
                  setMostrarNuevoPersonal(false);
                  setErroresPersonal({});
                }}
                style={{ background: COLORS.textLight, color: COLORS.white, border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontFamily: FONTS.heading, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearPersonal}
                disabled={subiendoCv}
                style={{ background: subiendoCv ? COLORS.textLight : COLORS.success, color: COLORS.white, border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontFamily: FONTS.heading, cursor: subiendoCv ? "not-allowed" : "pointer" }}
              >
                {subiendoCv ? "Subiendo CV..." : "Guardar personal"}
              </button>
            </div>
          </div>
        )}

        <div style={{ maxHeight: "600px", overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", fontSize: "0.95rem", background: COLORS.white }}>
            <thead style={{ position: "sticky", top: 0, background: COLORS.light }}>
              <tr>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: "10px", textAlign: "center", width: 56, fontFamily: FONTS.heading, color: COLORS.text }}>Check</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: "10px", textAlign: "left", fontFamily: FONTS.heading, color: COLORS.text }}>Nombre</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: "10px", textAlign: "left", fontFamily: FONTS.heading, color: COLORS.text }}>Código</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: "10px", textAlign: "left", fontFamily: FONTS.heading, color: COLORS.text }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {personalList.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 14, color: COLORS.textLight, fontFamily: FONTS.body }}>
                    Sin personal registrado
                  </td>
                </tr>
              ) : (
                personalList.map((p) => {
                  const isSelected = selectedPersonal?.id_personal === p.id_personal;
                  return (
                    <tr
                      key={p.id_personal}
                      onClick={() => handleSelectPersonal(p)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? COLORS.backgroundLight : COLORS.white,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <td style={{ padding: "10px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedPersonalIds.includes(p.id_personal)}
                          disabled={!selectedBonoId}
                          onChange={() => handleTogglePersonalCheck(p.id_personal)}
                          style={{ cursor: selectedBonoId ? "pointer" : "not-allowed" }}
                        />
                      </td>
                      <td style={{ padding: "10px", fontFamily: FONTS.body, color: COLORS.text }}>{p.nombre || "Sin nombre"}</td>
                      <td style={{ padding: "10px", fontFamily: FONTS.body, color: COLORS.text }}>{p.Codigo || "-"}</td>
                      <td style={{ padding: "10px", fontFamily: FONTS.body, color: COLORS.text }}>{p.tipo_personal?.descripcion || "Sin tipo"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel de detalles del personal */}
      <div style={{ background: COLORS.backgroundLight, padding: 18, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 8px 22px rgba(0,0,0,0.06)" }}>
        <div style={{ marginBottom: 14, padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
          <h5 style={{ fontWeight: 800, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Asignar Bono</h5>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Nuevo bono"
              value={nuevoBono}
              onChange={(e) => setNuevoBono(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body, color: COLORS.text }}
            />
            <button
              onClick={handleCrearBono}
              style={{ background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, fontFamily: FONTS.heading, cursor: "pointer" }}
            >
              Crear bono
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedBonoId}
              onChange={(e) => {
                setSelectedBonoId(e.target.value);
                setSelectedPersonalIds([]);
              }}
              style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body, color: COLORS.text }}
            >
              <option value="">-- Seleccionar bono --</option>
              {allBonos.map((b) => (
                <option key={b.id_bono} value={b.id_bono}>{b.descripcion}</option>
              ))}
            </select>
            <button
              onClick={handleGuardarAsignacionBono}
              disabled={!selectedBonoId || selectedPersonalIds.length === 0 || guardandoAsignacion}
              style={{
                background: !selectedBonoId || selectedPersonalIds.length === 0 || guardandoAsignacion ? COLORS.textLight : COLORS.primary,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                padding: "10px 14px",
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor: !selectedBonoId || selectedPersonalIds.length === 0 || guardandoAsignacion ? "not-allowed" : "pointer",
              }}
            >
              {guardandoAsignacion ? "Guardando..." : "Guardar"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
            <select
              value={bonoAEliminar}
              onChange={(e) => setBonoAEliminar(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body, color: COLORS.text }}
            >
              <option value="">-- Seleccionar bono a eliminar --</option>
              {allBonos.map((b) => (
                <option key={`del-${b.id_bono}`} value={b.id_bono}>{b.descripcion}</option>
              ))}
            </select>
            <button
              onClick={handleEliminarBono}
              disabled={!bonoAEliminar}
              style={{
                background: !bonoAEliminar ? COLORS.textLight : COLORS.error,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                padding: "10px 14px",
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor: !bonoAEliminar ? "not-allowed" : "pointer",
              }}
            >
              Eliminar bono
            </button>
          </div>
          <div style={{ marginTop: 8, fontFamily: FONTS.body, color: COLORS.textLight, fontSize: "0.9rem" }}>
            Selecciona un bono y luego marca el check del personal para asignarlo.
          </div>
        </div>

        {selectedPersonal ? (
          <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, fontFamily: FONTS.heading, color: COLORS.text }}>
              Detalles de {selectedPersonal.nombre}
            </h4>
            <button
              onClick={handleEliminarPersonal}
              style={{
                background: COLORS.error,
                color: COLORS.white,
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 700,
                fontFamily: FONTS.heading,
                cursor: "pointer",
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
            >
              🗑️ Eliminar
            </button>
          </div>
          <div style={{ marginBottom: 12, padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, fontSize: "0.95rem" }}>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text }}><strong>Código:</strong> {selectedPersonal.Codigo || "-"}</div>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text, display: "flex", alignItems: "center", gap: 8 }}>
                <strong>CV:</strong>
                {selectedPersonal.cv ? (
                  <a
                    href={selectedPersonal.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      background: COLORS.error,
                      color: COLORS.white,
                      borderRadius: 6,
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"}
                    onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    📄 Ver PDF
                  </a>
                ) : (
                  <span style={{ color: COLORS.textLight }}>Sin CV</span>
                )}
              </div>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text }}><strong>Fecha de nacimiento:</strong> {selectedPersonal.fecha_nacimiento || "-"}</div>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text }}><strong>Tipo:</strong> {selectedPersonal.tipo_personal?.descripcion || "Sin tipo"}</div>
            </div>
          </div>

          {/* Bonos */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <h5 style={{ fontWeight: 800, margin: 0, fontFamily: FONTS.heading, color: COLORS.text }}>Bonos Asignados</h5>
              <div style={{ display: "flex", flexDirection: windowWidth < 640 ? "column" : "row", gap: 8, alignItems: "stretch", width: windowWidth < 640 ? "100%" : "auto" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    placeholder="Monto"
                    value={montoPagoBono}
                    onChange={(e) => {
                      const limpio = limpiarMonto(e.target.value);
                      setMontoPagoBono(limpio);
                      if (limpio.trim()) {
                        setErroresMontoBono("");
                      }
                    }}
                    onBlur={() => {
                      if (montoPagoBono) {
                        setErroresMontoBono(validarMonto(montoPagoBono, "bono"));
                      }
                    }}
                    onKeyDown={(e) => {
                      // Bloquear: +, -, e, E y otros caracteres especiales
                      if (["+", "-", "e", "E"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    step="0.01"
                    min="0"
                    style={{ 
                      width: windowWidth < 640 ? "100%" : 130, 
                      padding: 10, 
                      borderRadius: 8, 
                      border: `1px solid ${erroresMontoBono ? COLORS.error : COLORS.border}`, 
                      fontFamily: FONTS.body, 
                      color: COLORS.text,
                      boxShadow: erroresMontoBono ? `0 0 0 2px ${COLORS.error}22` : "none"
                    }}
                  />
                  {erroresMontoBono && (
                    <div style={{ fontSize: "0.7rem", color: COLORS.error, marginTop: 4, fontFamily: FONTS.body }}>
                      {erroresMontoBono}
                    </div>
                  )}
                </div>
                <button
                  onClick={handlePagarBono}
                  disabled={!montoPagoBono || !!erroresMontoBono}
                  style={{ 
                    background: !montoPagoBono || erroresMontoBono ? COLORS.textLight : COLORS.success, 
                    color: COLORS.white, 
                    border: "none", 
                    borderRadius: 8, 
                    padding: "10px 16px", 
                    fontWeight: 700, 
                    fontFamily: FONTS.heading, 
                    cursor: !montoPagoBono || erroresMontoBono ? "not-allowed" : "pointer", 
                    whiteSpace: "nowrap" 
                  }}
                >
                  Pagar
                </button>
              </div>
            </div>
            <div style={{ background: COLORS.white, padding: 12, borderRadius: 10, border: `1px solid ${COLORS.border}`, maxHeight: 200, overflowY: "auto" }}>
              {personalBonos.length === 0 ? (
                <div style={{ color: COLORS.textLight, fontFamily: FONTS.body, fontSize: "0.95rem" }}>Sin bonos asignados</div>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {personalBonos.map((b) => (
                    <li key={b.bono_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontFamily: FONTS.body, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{b.bonos?.descripcion || b.bono_id}</span>
                      </div>
                      <span style={{ color: COLORS.textLight, fontSize: "0.85rem" }}>Asignado</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Próximos pagos */}
          <div style={{ marginBottom: 14, padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <h5 style={{ fontWeight: 800, marginBottom: 6, fontFamily: FONTS.heading, color: COLORS.text }}>Próximos pagos estimados</h5>
            <div style={{ fontFamily: FONTS.body, color: COLORS.textLight }}>Próximo pago: {nextPayText}</div>
          </div>

          {/* Registrar pago mensual */}
          <div style={{ padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <h5 style={{ fontWeight: 800, marginBottom: 12, fontFamily: FONTS.heading, color: COLORS.text }}>Registrar Pago Mensual</h5>
            <div style={{ display: "flex", gap: 12, flexDirection: windowWidth < 640 ? "column" : "row", alignItems: windowWidth < 640 ? "stretch" : "flex-start" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  placeholder="Monto mensual"
                  value={montoPagoMensual}
                  onChange={(e) => {
                    const limpio = limpiarMonto(e.target.value);
                    setMontoPagoMensual(limpio);
                    if (limpio.trim()) {
                      setErroresMontoMensual("");
                    }
                  }}
                  onBlur={() => {
                    if (montoPagoMensual) {
                      setErroresMontoMensual(validarMonto(montoPagoMensual, "pago mensual"));
                    }
                  }}
                  onKeyDown={(e) => {
                    // Bloquear: +, -, e, E y otros caracteres especiales
                    if (["+", "-", "e", "E"].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  step="0.01"
                  min="0"
                  style={{ 
                    width: "100%",
                    padding: 12, 
                    borderRadius: 8, 
                    border: `1px solid ${erroresMontoMensual ? COLORS.error : COLORS.border}`, 
                    fontFamily: FONTS.body, 
                    color: COLORS.text,
                    boxShadow: erroresMontoMensual ? `0 0 0 2px ${COLORS.error}22` : "none"
                  }}
                />
                {erroresMontoMensual && (
                  <div style={{ fontSize: "0.7rem", color: COLORS.error, marginTop: 6, fontFamily: FONTS.body }}>
                    {erroresMontoMensual}
                  </div>
                )}
              </div>
              <button
                onClick={handlePagarMensual}
                disabled={!montoPagoMensual || !!erroresMontoMensual}
                style={{ 
                  background: !montoPagoMensual || erroresMontoMensual ? COLORS.textLight : COLORS.success, 
                  color: COLORS.white, 
                  border: "none", 
                  borderRadius: 10, 
                  padding: "12px 22px", 
                  fontWeight: 800, 
                  fontFamily: FONTS.heading, 
                  cursor: !montoPagoMensual || erroresMontoMensual ? "not-allowed" : "pointer", 
                  boxShadow: !montoPagoMensual || erroresMontoMensual ? "none" : "0 6px 16px rgba(16,185,129,0.25)",
                  whiteSpace: "nowrap",
                  minWidth: windowWidth < 640 ? "100%" : "auto"
                }}
              >
                Pagar
              </button>
            </div>
          </div>

          </>
        ) : (
          <div style={{ padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body, color: COLORS.textLight }}>
            Selecciona un personal para ver sus detalles y registrar pagos.
          </div>
        )}
      </div>
    </div>
  );
};

export default Personal;
