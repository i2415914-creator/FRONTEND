import React, { useEffect, useMemo, useState, useRef } from "react";
import { animate, stagger } from "animejs";
import BarraProgreso from "./BarraProgreso";
import BarraProgresoServicio from "./BarraProgresoServicio";
import { useNavigate } from "react-router-dom";
import {
  IconFileTypePdf, IconMail, IconPhone, IconId,
  IconLogout, IconEdit, IconChartBar, IconCreditCard,
  IconAlertCircle, IconReceipt, IconTrash, IconCalendarEvent, IconCalendarWeek,
} from "@tabler/icons-react";
import CompletaDatosGoogle from "./CompletaDatosGoogle";

const CARD = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(148,25,24,0.04)",
};

const PanelCliente = ({ onLogout }) => {
  const PEDIDO_DELETE_DELIVERED_MS = 60 * 1000;
  const [progresoPedido, setProgresoPedido]     = useState({ estado: null, progreso: 0, mostrar: false });
  const [progresoServicio, setProgresoServicio] = useState({ estado: null, progreso: 0, mostrar: false });
  const [progresoPedidoLista, setProgresoPedidoLista] = useState([]);
  const [progresoServicioLista, setProgresoServicioLista] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [clienteId, setClienteId]     = useState(null);
  const [token, setToken]             = useState(null);
  const cardsAnimated                 = useRef(false);
  const registroPagoRefreshTimeoutRef = useRef(null);
  const chartOverlayTimeoutRef        = useRef(null);
  const pedidoEntregadoAtRef          = useRef({});
  const pedidoDeleteTimersRef         = useRef({});
  const [chartFocused, setChartFocused] = useState(false);

  const isPedidoEntregado = (estado) => {
    const s = String(estado || "").toLowerCase();
    return s.includes("entregado");
  };

  const syncPedidoPrincipal = (items) => {
    const principal = items[0] || null;
    setProgresoPedido(principal
      ? { estado: principal.estado || null, progreso: principal.progreso || 0, mostrar: !!principal.mostrar_barra }
      : { estado: null, progreso: 0, mostrar: false });
  };

  const eliminarPedidoEntregado = async (carritoId, cId, authToken) => {
    try {
      if (!carritoId || !authToken) return;
      await fetch(`/api/clientes/pedidos/${carritoId}/auto_delete_entregado`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      if (cId) await recargarBarraProgreso(cId, authToken);
    } catch (e) {
      console.warn("[PanelCliente] Error auto-eliminando pedido entregado:", e);
    }
  };

  const initialCliente = () => {
    try {
      return {
        nombre: "",
        correo: "",
        numero: "",
        documento: "",
      };
    } catch { return null; }
  };

  const [cliente, setCliente]               = useState(initialCliente);
  const [datosMostrar, setDatosMostrar]     = useState(null);
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [faltantes, setFaltantes]           = useState([]);
  const [pedidos, setPedidos]               = useState([]);
  const [comprobantes, setComprobantes]     = useState([]);
  const [busquedaComprobante, setBusquedaComprobante] = useState("");
  const [fechaInicioComprobante, setFechaInicioComprobante] = useState("");
  const [fechaFinComprobante, setFechaFinComprobante] = useState("");
  const [visibleComprobantes, setVisibleComprobantes] = useState(3);
  const [nuevosComprobantes, setNuevosComprobantes] = useState([]);
  const [eliminandoComprobantes, setEliminandoComprobantes] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [eliminandoConfirmado, setEliminandoConfirmado] = useState(false);
  const [graficoPagos, setGraficoPagos]     = useState(null);
  const [loadingGraficoPagos, setLoadingGraficoPagos] = useState(true);
  const [mostrarModalDatos, setMostrarModalDatos] = useState(false);

  const cargarComprobantes = async (authToken, options = {}) => {
    const { animarNuevos = false } = options;
    try {
      const params = new URLSearchParams();
      if (fechaInicioComprobante) params.set("fecha_inicio", fechaInicioComprobante);
      if (fechaFinComprobante) params.set("fecha_fin", fechaFinComprobante);
      const query = params.toString();
      const url = query ? `/api/registro-pago/listar?${query}` : "/api/registro-pago/listar";

      const resC = await fetch(url, { headers: { "Authorization": `Bearer ${authToken}` } });
      if (resC.ok) {
        const jC = await resC.json();
        if (jC.success) {
          const lista = jC.comprobantes || [];
          setComprobantes((prev) => {
            if (animarNuevos) {
              const prevIds = new Set((prev || []).map((item) => item.id_registro));
              const nuevosIds = lista
                .filter((item) => !prevIds.has(item.id_registro))
                .map((item) => item.id_registro);

              if (nuevosIds.length) {
                setNuevosComprobantes((curr) => Array.from(new Set([...curr, ...nuevosIds])));
                setTimeout(() => {
                  setNuevosComprobantes((curr) => curr.filter((id) => !nuevosIds.includes(id)));
                }, 3200);
              }
            }
            return lista;
          });
        }
      }
    } catch (e) {
      console.warn("Error cargando comprobantes:", e);
    }
  };

  useEffect(() => {
    if (!nuevosComprobantes.length) return;
    const targets = Array.from(document.querySelectorAll("tr.pc-row-new"));
    if (!targets.length) return;

    animate(targets, {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.96, 1],
      duration: 520,
      easing: "easeOutExpo",
      delay: stagger(70),
    });

    animate(targets, {
      backgroundColor: ["#fff8d9", "#ffffff"],
      duration: 1200,
      easing: "easeOutQuad",
      direction: "alternate",
      loop: false,
    });
  }, [nuevosComprobantes]);

  const solicitarEliminarComprobante = (idRegistro) => {
    setConfirmDeleteId(idRegistro);
  };

  const cancelarEliminarComprobante = () => {
    if (eliminandoConfirmado) return;
    setConfirmDeleteId(null);
  };

  const confirmarEliminarComprobante = async () => {
    const idRegistro = confirmDeleteId;
    const authToken = token || localStorage.getItem("auth_token");
    if (!authToken || !idRegistro) return;

    try {
      setEliminandoConfirmado(true);
      const res = await fetch(`/api/registro-pago/${idRegistro}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        window.alert(data?.message || "No se pudo eliminar el comprobante.");
        setEliminandoConfirmado(false);
        return;
      }

      setConfirmDeleteId(null);
      setEliminandoComprobantes((prev) => Array.from(new Set([...prev, idRegistro])));
      setTimeout(() => {
        setComprobantes((prev) => prev.filter((item) => item.id_registro !== idRegistro));
        setNuevosComprobantes((prev) => prev.filter((id) => id !== idRegistro));
        setEliminandoComprobantes((prev) => prev.filter((id) => id !== idRegistro));
        setEliminandoConfirmado(false);
      }, 320);
    } catch (e) {
      console.warn("Error eliminando comprobante:", e);
      window.alert("Ocurrió un error al eliminar el comprobante.");
      setEliminandoConfirmado(false);
    }
  };

  const cargarGraficoPagos = async (authToken, options = {}) => {
    const { silent = false } = options;
    if (!authToken) {
      if (!silent) setGraficoPagos(null);
      setLoadingGraficoPagos(false);
      return;
    }

    try {
      if (!silent && !graficoPagos?.image_base64) {
        setLoadingGraficoPagos(true);
      }
      const res = await fetch("/api/clientes/grafico-pagos", {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setGraficoPagos((prev) => {
          const next = data.data || null;
          if (
            prev?.image_base64 === next?.image_base64 &&
            prev?.total_pagado === next?.total_pagado &&
            prev?.dias_con_compra === next?.dias_con_compra &&
            prev?.operaciones === next?.operaciones &&
            prev?.month === next?.month
          ) {
            return prev;
          }
          return next;
        });
      } else if (!silent) {
        setGraficoPagos(null);
      }
    } catch (e) {
      console.warn("Error cargando grafico de pagos:", e);
      if (!silent) setGraficoPagos(null);
    } finally {
      if (!silent || !graficoPagos?.image_base64) {
        setLoadingGraficoPagos(false);
      }
    }
  };

  const recargarBarraProgreso = async (cId, tkn) => {
    if (!cId || !tkn) {
      setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
      setProgresoPedidoLista([]);
      return;
    }
    try {
      const res = await fetch(`/api/barra_progreso/${cId}`, {
        headers: { "Authorization": `Bearer ${tkn}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
        setProgresoPedidoLista([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        const items = Array.isArray(data.items) && data.items.length
          ? data.items
          : (data.mostrar_barra ? [{
              carrito_id: data.carrito_id || null,
              estado: data.estado || null,
              progreso: data.progreso || 0,
              mostrar_barra: true,
            }] : []);

        setProgresoPedidoLista(items);
        syncPedidoPrincipal(items);
      } else {
        setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
        setProgresoPedidoLista([]);
      }
    } catch (err) {
      setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
      setProgresoPedidoLista([]);
    }
  };

  useEffect(() => {
    const authToken = token || localStorage.getItem("auth_token");
    if (!authToken) return;

    const timers = pedidoDeleteTimersRef.current;
    const deliveredAt = pedidoEntregadoAtRef.current;
    const now = Date.now();
    const presentes = new Set();

    progresoPedidoLista.forEach((item) => {
      const id = String(item?.carrito_id || "").trim();
      if (!id) return;
      presentes.add(id);

      if (!isPedidoEntregado(item?.estado)) {
        if (timers[id]) {
          clearTimeout(timers[id]);
          delete timers[id];
        }
        delete deliveredAt[id];
        return;
      }

      if (!deliveredAt[id]) deliveredAt[id] = now;
      const remaining = PEDIDO_DELETE_DELIVERED_MS - (now - deliveredAt[id]);

      if (remaining <= 0) {
        if (!timers[id]) {
          timers[id] = setTimeout(() => {
            eliminarPedidoEntregado(id, clienteId, authToken).finally(() => {
              if (pedidoDeleteTimersRef.current[id]) delete pedidoDeleteTimersRef.current[id];
            });
          }, 50);
        }
        return;
      }

      if (!timers[id]) {
        timers[id] = setTimeout(() => {
          eliminarPedidoEntregado(id, clienteId, authToken).finally(() => {
            if (pedidoDeleteTimersRef.current[id]) delete pedidoDeleteTimersRef.current[id];
          });
        }, remaining);
      }
    });

    Object.keys(timers).forEach((id) => {
      if (!presentes.has(id)) {
        clearTimeout(timers[id]);
        delete timers[id];
      }
    });

    Object.keys(deliveredAt).forEach((id) => {
      if (!presentes.has(id)) delete deliveredAt[id];
    });
  }, [progresoPedidoLista, clienteId, token]);

  const recargarBarraProgresoServicio = async (cId) => {
    if (!cId) {
      setProgresoServicio({ estado: null, progreso: 0, mostrar: false });
      setProgresoServicioLista([]);
      return;
    }
    try {
      const raw = localStorage.getItem("servicio_instalado_temp");
      if (raw) {
        const temp = JSON.parse(raw);
        const markerClienteId      = String(temp?.cliente_id || "").trim();
        const clienteIdNormalizado = String(cId || "").trim();
        if (markerClienteId === clienteIdNormalizado && Number(temp?.until || 0) > Date.now()) {
          const temporal = { carrito_id: "temporal", estado: "Instalado", progreso: 100, mostrar_barra: true };
          setProgresoServicio({ estado: "Instalado", progreso: 100, mostrar: true });
          setProgresoServicioLista([temporal]);
          return;
        }
        if (Number(temp?.until || 0) <= Date.now()) localStorage.removeItem("servicio_instalado_temp");
      }
    } catch (e) { console.warn("[PanelCliente] Error leyendo estado temporal de servicio:", e); }
    try {
      const res = await fetch(`/api/barra_progreso/servicio/${cId}`);
      if (!res.ok) {
        setProgresoServicio({ estado: null, progreso: 0, mostrar: false });
        setProgresoServicioLista([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        const items = Array.isArray(data.items) && data.items.length
          ? data.items
          : (data.mostrar_barra ? [{
              carrito_id: data.carrito_id || null,
              estado: data.estado || null,
              progreso: data.progreso || 0,
              mostrar_barra: true,
            }] : []);

        const principal = items[0] || null;
        setProgresoServicioLista(items);
        setProgresoServicio(principal
          ? { estado: principal.estado || null, progreso: principal.progreso || 0, mostrar: !!principal.mostrar_barra }
          : { estado: null, progreso: 0, mostrar: false });
      } else {
        setProgresoServicio({ estado: null, progreso: 0, mostrar: false });
        setProgresoServicioLista([]);
      }
    } catch (err) {
      setProgresoServicio({ estado: null, progreso: 0, mostrar: false });
      setProgresoServicioLista([]);
    }
  };

  useEffect(() => {
    if (!loading && !cardsAnimated.current) {
      cardsAnimated.current = true;
      import("animejs").then((mod) => {
        const animate = mod.animate;
        const stagger = mod.stagger;
        if (!animate) return;
        animate(".pc-card", {
          opacity: [0, 1],
          translateY: [28, 0],
          delay: stagger ? stagger(90) : undefined,
          duration: 720,
          ease: "outExpo",
        });
        animate(".pc-avatar-coin", {
          rotateY: [0, 360],
          duration: 7600,
          loop: true,
          ease: "linear",
        });
        animate(".pc-chart-shell", {
          opacity: [0, 1],
          translateY: [18, 0],
          scale: [0.98, 1],
          duration: 760,
          ease: "outExpo",
        });
      }).catch(() => {
        document.querySelectorAll(".pc-card").forEach(el => { el.style.opacity = "1"; });
      });
    }
  }, [loading]);

  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) { navigate("/login"); return; }
    setToken(authToken);
    window.dispatchEvent(new CustomEvent("tokenUpdated", { detail: { token: authToken } }));
    (async () => {
      try {
        const r = await fetch("/api/clientes/me", { headers: { "Authorization": `Bearer ${authToken}` } });
        if (r.status === 401) { localStorage.removeItem("auth_token"); navigate("/login"); return; }
        const j = await r.json();
        if (r.ok && j?.success && j?.cliente) {
          setCliente(prev => ({ ...(prev || {}), ...j.cliente }));
          if (j.cliente.id_cliente) {
            setClienteId(j.cliente.id_cliente);
            await recargarBarraProgreso(j.cliente.id_cliente, authToken);
            await recargarBarraProgresoServicio(j.cliente.id_cliente);
          }
        }
      } catch (e) {
        setError(`Error: ${e.message || "No se pudo cargar el perfil"}`);
      } finally {
        // No bloquear toda la vista por llamadas secundarias (grafico/comprobantes/datos extra)
        setLoading(false);
      }

      // Cargas secundarias en background para evitar spinner eterno
      try {
        await cargarComprobantes(authToken);
      } catch (_) {}

      try {
        await cargarGraficoPagos(authToken);
      } catch (_) {}

      try {
        const rDatos = await fetch("/api/clientes/datos_completos", { headers: { "Authorization": `Bearer ${authToken}` } });
        if (rDatos.status === 401) { localStorage.removeItem("auth_token"); navigate("/login"); return; }
        const jDatos = await rDatos.json();
        setDatosCompletos(jDatos?.success ? jDatos.datos_completos : false);
        setFaltantes(jDatos?.faltantes || []);
      } catch (_) {}
    })();
  }, [navigate]);

  useEffect(() => {
    const handleServicioFinalizado = (event) => {
      if (clienteId) recargarBarraProgresoServicio(clienteId);
    };
    window.addEventListener("servicio_finalizado", handleServicioFinalizado);
    return () => window.removeEventListener("servicio_finalizado", handleServicioFinalizado);
  }, [clienteId]);

  useEffect(() => {
    const handleServicioEstadoActualizado = (event) => {
      const syncClienteId = String(event?.detail?.cliente_id || "").trim();
      const ownClienteId = String(clienteId || "").trim();
      if (!syncClienteId || !ownClienteId || syncClienteId !== ownClienteId) return;
      recargarBarraProgresoServicio(ownClienteId);
    };

    const handleStorage = (event) => {
      if (event.key !== "servicio_estado_sync" || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        const syncClienteId = String(payload?.cliente_id || "").trim();
        const ownClienteId = String(clienteId || "").trim();
        if (!syncClienteId || !ownClienteId || syncClienteId !== ownClienteId) return;
        recargarBarraProgresoServicio(ownClienteId);
      } catch (_) {}
    };

    window.addEventListener("servicio_estado_actualizado", handleServicioEstadoActualizado);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("servicio_estado_actualizado", handleServicioEstadoActualizado);
      window.removeEventListener("storage", handleStorage);
    };
  }, [clienteId]);

  useEffect(() => {
    const authToken = token || localStorage.getItem("auth_token");
    if (!authToken || !clienteId) return;

    const refreshTodo = async () => {
      await cargarComprobantes(authToken, { animarNuevos: true });
      await recargarBarraProgreso(clienteId, authToken);
      await recargarBarraProgresoServicio(clienteId);
    };

    const handleVentaConfirmada = (event) => {
      const syncClienteId = String(event?.detail?.cliente_id || "").trim();
      if (syncClienteId && String(clienteId || "").trim() !== syncClienteId) return;
      refreshTodo();
    };

    const handleStorageVenta = (event) => {
      if (event.key !== "venta_confirmada" || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        const syncClienteId = String(payload?.cliente_id || "").trim();
        if (syncClienteId && String(clienteId || "").trim() !== syncClienteId) return;
        refreshTodo();
      } catch (_) {}
    };

    window.addEventListener("venta-confirmada", handleVentaConfirmada);
    window.addEventListener("storage", handleStorageVenta);
    return () => {
      window.removeEventListener("venta-confirmada", handleVentaConfirmada);
      window.removeEventListener("storage", handleStorageVenta);
    };
  }, [clienteId, token]);

  useEffect(() => {
    if (!clienteId) return;
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return;

    const authToken = token || localStorage.getItem("auth_token");
    const API_BASE = (import.meta.env.VITE_API_URL || "https://api.vidriobras.com").replace(/\/$/, "");
    const es = new EventSource(`${API_BASE}/api/realtime/notificaciones`);

    const onChanged = (evt) => {
      try {
        const payload = JSON.parse(evt.data || "{}");
        if (payload?.initial) return;
        const changes = Array.isArray(payload?.changes) ? payload.changes : [];
        const relevant = changes.some((c) => {
          const r = c?.record;
          return String(r?.id_cliente || r?.cliente_id || "") === String(clienteId);
        });
        if (!relevant) return;
        // Pequeño delay para que carrito_compras ya esté actualizado
        setTimeout(async () => {
          await recargarBarraProgreso(clienteId, authToken);
          await recargarBarraProgresoServicio(clienteId);
        }, 350);
      } catch { /* ignorar payload malformed */ }
    };

    es.addEventListener("notificaciones_changed", onChanged);

    return () => {
      es.removeEventListener("notificaciones_changed", onChanged);
      es.close();
    };
  }, [clienteId, token]);

  useEffect(() => {
    return () => {
      const timers = pedidoDeleteTimersRef.current;
      Object.keys(timers).forEach((id) => {
        clearTimeout(timers[id]);
        delete timers[id];
      });
    };
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    const authToken = token || localStorage.getItem("auth_token");
    if (!authToken) return;

    let cancelled = false;
    let timerId = null;

    const tick = async () => {
      if (cancelled) return;
      await recargarBarraProgreso(clienteId, authToken);
      if (cancelled) return;
      await recargarBarraProgresoServicio(clienteId);
      if (cancelled) return;
      await cargarComprobantes(authToken, { animarNuevos: true });
      // El grafico se refresca por realtime; evitamos pegarle cada pocos segundos.
      if (!cancelled) timerId = setTimeout(tick, 5000);
    };

    timerId = setTimeout(tick, 5000);
    return () => { cancelled = true; clearTimeout(timerId); };
  }, [clienteId, token]);

  const logout = () => {
    ["auth_token","cliente_id","cliente_correo","cliente_nombre","cliente_numero","cliente_documento","carrito_id"]
      .forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("servicio_instalado_temp");
    if (onLogout) onLogout();
    navigate("/login");
  };

  const getInitials = (nombre) => {
    if (!nombre) return "?";
    return nombre.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const datosIncompletos = !cliente?.numero || !cliente?.documento;
  const fechaMaximaBusqueda = new Date().toISOString().split("T")[0];
  const formatCurrency = (value) => new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

  const normalizeDateKey = (value) => {
    if (!value) return null;
    const raw = String(value).trim();

    // Mantener fecha ISO sin pasar por zona horaria del navegador
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;

    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatFechaComprobante = (value) => {
    const iso = normalizeDateKey(value);
    if (!iso) return "—";
    const [yy, mm, dd] = iso.split("-");
    const meses = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
    const mes = meses[Math.max(0, Math.min(11, Number(mm) - 1))];
    return `${dd} ${mes} ${yy}`;
  };

  const onFechaInicioChange = (value) => {
    const fecha = value && value > fechaMaximaBusqueda ? fechaMaximaBusqueda : value;
    setFechaInicioComprobante(fecha);
    if (fechaFinComprobante && fecha && fechaFinComprobante < fecha) {
      setFechaFinComprobante(fecha);
    }
  };

  const onFechaFinChange = (value) => {
    const fecha = value && value > fechaMaximaBusqueda ? fechaMaximaBusqueda : value;
    setFechaFinComprobante(fecha);
    if (fechaInicioComprobante && fecha && fechaInicioComprobante > fecha) {
      setFechaInicioComprobante(fecha);
    }
  };

  const comprobantesFiltrados = useMemo(() => {
    const term = (busquedaComprobante || "").trim().toLowerCase();
    const hasDateFilter = Boolean(fechaInicioComprobante || fechaFinComprobante);
    if (!term && !hasDateFilter) return comprobantes;

    const termNumber = term.replace("s/", "").replace(",", ".").trim();
    const inicioIso = fechaInicioComprobante || null;
    const finIso = fechaFinComprobante || null;

    return comprobantes.filter((item) => {
      const tipo = String(item?.tipo || "").toLowerCase();
      const monto = Number(item?.monto || 0).toFixed(2);
      const fechaItemIso = normalizeDateKey(item?.fecha);

      const matchTexto = !term || tipo.includes(term) || monto.includes(termNumber);
      const matchInicio = !inicioIso || (fechaItemIso && fechaItemIso >= inicioIso);
      const matchFin = !finIso || (fechaItemIso && fechaItemIso <= finIso);

      return matchTexto && matchInicio && matchFin;
    });
  }, [comprobantes, busquedaComprobante, fechaInicioComprobante, fechaFinComprobante]);

  const comprobantesMostrados = useMemo(() => {
    return comprobantesFiltrados.slice(0, visibleComprobantes);
  }, [comprobantesFiltrados, visibleComprobantes]);

  const onScrollComprobantes = (event) => {
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
    if (!nearBottom) return;

    setVisibleComprobantes((prev) => {
      if (prev >= comprobantesFiltrados.length) return prev;
      return Math.min(prev + 3, comprobantesFiltrados.length);
    });
  };

  useEffect(() => {
    setVisibleComprobantes(3);
  }, [busquedaComprobante, fechaInicioComprobante, fechaFinComprobante]);

  useEffect(() => {
    const authToken = token || localStorage.getItem("auth_token");
    if (!authToken || loading) return;
    cargarComprobantes(authToken);
  }, [fechaInicioComprobante, fechaFinComprobante]);

  const abrirModalDatos = () => {
    setMostrarModalDatos(true);
  };

  const showChartOverlay = () => {
    if (chartOverlayTimeoutRef.current) {
      clearTimeout(chartOverlayTimeoutRef.current);
      chartOverlayTimeoutRef.current = null;
    }
    setChartFocused(true);
  };

  const hideChartOverlay = () => {
    if (chartOverlayTimeoutRef.current) clearTimeout(chartOverlayTimeoutRef.current);
    chartOverlayTimeoutRef.current = setTimeout(() => {
      setChartFocused(false);
      chartOverlayTimeoutRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (chartOverlayTimeoutRef.current) {
        clearTimeout(chartOverlayTimeoutRef.current);
      }
    };
  }, []);

  const handleDatosActualizados = (datosActualizados) => {
    setCliente((prev) => ({
      ...prev,
      nombre: datosActualizados?.nombre || prev?.nombre,
      numero: datosActualizados?.numero || prev?.numero,
      documento: datosActualizados?.documento || prev?.documento,
    }));
    setMostrarModalDatos(false);
  };

  return (
    <div className="pc-page" style={{ minHeight:"100vh", background:"linear-gradient(150deg,#f0f7fb 0%,#f9fafb 55%,#edf4f8 100%)", padding:"28px 20px 52px", fontFamily:"'Open Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Open+Sans:wght@400;500;600&display=swap');
        @keyframes pc-spin { to { transform:rotate(360deg); } }
        .pc-card { will-change:transform,opacity; }
        .pc-page { width: 100%; overflow-x: clip; }
        .pc-btn:hover { filter:brightness(0.93); transform:translateY(-1px); }
        .pc-link:hover { background:rgba(148,25,24,0.12)!important; border-color:rgba(148,25,24,0.45)!important; transform:scale(1.12)!important; }
        .pc-row:hover td { background:#f0f7fb!important; }
        .pc-avatar-stage { perspective: 900px; }
        .pc-avatar-coin { transform-style: preserve-3d; backface-visibility: visible; will-change: transform; }
        .pc-chart-frame { position: relative; z-index: 1; }
        .pc-chart-shell {
          position: relative;
          z-index: 1;
          overflow: hidden;
          transform-origin: center center;
          transition: transform .34s cubic-bezier(.22,1,.36,1), box-shadow .34s cubic-bezier(.22,1,.36,1), border-color .34s ease, filter .34s ease;
        }
        .pc-chart-shell:hover {
          transform: translateY(-4px) scale(1.06);
          box-shadow: 0 18px 36px rgba(90,139,168,0.22);
          border-color: rgba(128,194,220,0.9);
          filter: saturate(1.03);
          z-index: 12;
        }
        .pc-chart-image {
          width: 100%;
          height: auto;
          display: block;
          transform-origin: center center;
          transition: transform .34s cubic-bezier(.22,1,.36,1), filter .34s ease;
        }
        .pc-chart-shell:hover .pc-chart-image {
          transform: scale(1.02);
          filter: contrast(1.02) saturate(1.08);
        }
        .pc-chart-overlay-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.22);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1600;
          padding: 22px;
          animation: pc-fade-in .18s ease;
        }
        .pc-chart-overlay-content {
          width: min(47vw, 560px);
          max-height: 44vh;
          border-radius: 18px;
          overflow: auto;
          border: 1px solid rgba(199, 228, 240, 0.95);
          background: linear-gradient(180deg,#ffffff 0%,#f8fbfd 100%);
          box-shadow: 0 20px 42px rgba(15,23,42,0.30);
          transform: scale(1);
          animation: pc-pop-in .22s cubic-bezier(.22,1,.36,1);
          padding: 8px;
        }
        .pc-chart-overlay-image {
          width: 100%;
          height: auto;
          max-height: calc(44vh - 16px);
          display: block;
          object-fit: contain;
          border-radius: 12px;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        .pc-search {
          width: min(100%, 360px);
          height: 38px;
          border-radius: 10px;
          border: 1px solid #c7e4f0;
          background: #f8fcff;
          color: #1f2937;
          padding: 0 12px;
          font-size: 13px;
          outline: none;
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .pc-search:focus {
          border-color: #80c2dc;
          box-shadow: 0 0 0 3px rgba(128,194,220,0.2);
          background: #ffffff;
        }
        .pc-comprobantes-filters {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) 214px minmax(214px, auto);
          align-items: center;
          gap: 18px;
          margin-bottom: 14px;
        }
        .pc-comprobantes-header {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) 214px 214px;
          align-items: center;
          gap: 18px;
          margin-bottom: 10px;
        }
        .pc-comprobantes-title-row {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .pc-comprobantes-title-row h3 {
          overflow-wrap: anywhere;
        }
        .pc-header-date-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 800;
          letter-spacing: .35px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .pc-date-filter-end-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
          min-width: 0;
        }
        .pc-date-filter {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: 214px;
          height: 38px;
          border: 1px solid #c7e4f0;
          border-radius: 10px;
          background: #f8fcff;
          padding: 0 10px;
        }
        .pc-btn-todo {
          height: 38px;
          border-radius: 10px;
          border: 1px solid #c7e4f0;
          background: #eef6fb;
          color: #0c4a6e;
          font-size: 12.5px;
          font-weight: 700;
          padding: 0 12px;
          white-space: nowrap;
          cursor: pointer;
          transition: transform .18s ease, filter .18s ease, border-color .18s ease;
          flex: 0 0 auto;
        }
        .pc-btn-todo:hover {
          filter: brightness(0.96);
          border-color: #80c2dc;
          transform: translateY(-1px);
        }
        .pc-btn-todo:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .pc-track-item {
          animation: pc-track-in .42s cubic-bezier(.22,1,.36,1);
        }
        .pc-track-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 2px 0 8px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .35px;
          text-transform: uppercase;
        }
        .pc-track-label-pedido {
          color: #8b1d1d;
          background: #fff1f1;
          border: 1px solid #fecaca;
        }
        .pc-track-label-servicio {
          color: #0c4a6e;
          background: #eef6fb;
          border: 1px solid #c7e4f0;
        }
        .pc-float-incomplete {
          position: fixed;
          top: 94px;
          left: 110px;
          z-index: 1200;
          width: min(88vw, 416px);
          pointer-events: none;
        }
        .pc-comprobantes-scroll {
          overflow-x: auto;
          height: 220px;
          max-height: 220px;
          overflow-y: auto;
          scrollbar-gutter: stable;
        }
        .pc-actions-cell {
          display: inline-flex;
          align-items: center;
          gap: 32px;
        }
        .pc-metrics-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(0, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .pc-metric-hide-thin {
          display: block;
        }
        .pc-metric-monto {
          min-width: 0;
        }
        .pc-metric-card {
          min-width: 0;
        }
        .pc-metric-monto-value {
          font-size: clamp(15px, 1.35vw, 22px);
          line-height: 1.15;
          white-space: nowrap;
          letter-spacing: .2px;
        }
        .pc-metric-label {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: .6px;
          margin-bottom: 4px;
          line-height: 1.2;
          white-space: normal;
          overflow-wrap: normal;
          word-break: normal;
          hyphens: none;
        }
        .pc-date-input {
          border: none;
          outline: none;
          background: transparent;
          color: #1f2937;
          font-size: 13px;
          min-width: 0;
          flex: 1;
        }
        .pc-col-hide-thin,
        .pc-col-hide-thin-cell {
          display: table-cell;
        }
        .pc-delete-mobile-hide {
          display: inline-flex;
        }
        .pc-pdf-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          transition: all .2s;
          color: #dc2626;
          box-shadow: 0 1px 0 rgba(220, 38, 38, 0.12);
        }
        .pc-pdf-icon {
          width: 16px;
          height: 16px;
        }
        .pc-date-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: .7;
        }
        @media (max-width: 1180px) {
          .pc-comprobantes-filters {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          }
          .pc-comprobantes-filters > .pc-search {
            grid-column: 1 / -1;
            width: 100%;
          }
          .pc-date-filter-end-wrap .pc-date-filter {
            width: auto;
            min-width: 0;
            flex: 1 1 auto;
          }
        }
        @media (max-width: 960px) {
          .pc-comprobantes-header,
          .pc-comprobantes-filters {
            grid-template-columns: 1fr;
          }
          .pc-header-date-label {
            display: none;
          }
          .pc-date-filter,
          .pc-date-filter-end-wrap {
            width: 100%;
          }
          .pc-date-filter-end-wrap {
            justify-content: stretch;
          }
          .pc-btn-todo {
            min-width: 96px;
          }
          .pc-float-incomplete {
            left: 16px;
            right: 16px;
            width: auto;
            top: 82px;
          }
          .pc-chart-overlay-content {
            width: min(92vw, 720px);
            max-height: 70vh;
          }
          .pc-chart-overlay-image {
            max-height: calc(70vh - 16px);
          }
          .pc-actions-cell {
            gap: 14px;
          }
        }
        @media (max-width: 640px) {
          .pc-page {
            padding: 20px 12px 36px !important;
          }
          .pc-card {
            border-radius: 14px;
          }
          .pc-comprobantes-title-row h3 {
            font-size: 14px !important;
          }
          .pc-search,
          .pc-date-filter,
          .pc-btn-todo {
            height: 36px;
          }
          .pc-date-filter-end-wrap {
            gap: 6px;
          }
          .pc-comprobantes-scroll table {
            min-width: 520px;
          }
          .pc-comprobantes-scroll th,
          .pc-comprobantes-scroll td {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .pc-actions-cell {
            gap: 8px;
          }
        }
        @media (max-width: 520px) {
          .pc-comprobantes-scroll table {
            min-width: 260px;
          }
          .pc-col-hide-thin,
          .pc-col-hide-thin-cell {
            display: none !important;
          }
          .pc-delete-mobile-hide {
            display: none !important;
          }
          .pc-actions-cell {
            width: 100%;
            justify-content: center;
            gap: 0;
          }
          .pc-pdf-link {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            border-color: #fca5a5;
            background: #fee2e2;
            color: #b91c1c;
            box-shadow: 0 4px 10px rgba(185, 28, 28, 0.22);
          }
          .pc-pdf-icon {
            width: 20px;
            height: 20px;
          }
          .pc-metrics-grid {
            grid-template-columns: minmax(170px, 1.45fr) minmax(96px, 1fr);
          }
          .pc-metric-label {
            font-size: 9px;
            letter-spacing: .35px;
            line-height: 1.15;
          }
          .pc-metric-hide-thin {
            display: none !important;
          }
        }
        @media (max-width: 420px) {
          .pc-chart-overlay-content {
            width: 94vw;
            max-height: 74vh;
          }
          .pc-chart-overlay-image {
            max-height: calc(74vh - 16px);
          }
          .pc-btn-todo {
            padding: 0 10px;
            font-size: 12px;
          }
        }
        .pc-delete-btn:hover {
          background: #fee2e2 !important;
          border-color: #fca5a5 !important;
          color: #b91c1c !important;
          transform: translateY(-1px);
        }
        .pc-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 1700;
          background: rgba(15, 23, 42, 0.34);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }
        .pc-confirm-modal {
          width: min(92vw, 440px);
          border-radius: 16px;
          border: 1px solid #fbcaca;
          background: linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.28);
          padding: 18px 18px 16px;
        }
        .pc-confirm-title {
          margin: 0 0 8px;
          color: #7f1d1d;
          font-size: 17px;
          font-weight: 800;
          font-family: 'Oswald', sans-serif;
          letter-spacing: .3px;
        }
        .pc-confirm-text {
          margin: 0;
          color: #475569;
          font-size: 13.5px;
          line-height: 1.45;
        }
        .pc-confirm-actions {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .pc-confirm-btn {
          height: 36px;
          border-radius: 9px;
          padding: 0 14px;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .pc-confirm-btn-cancel {
          background: #ffffff;
          border-color: #d1d5db;
          color: #475569;
        }
        .pc-confirm-btn-delete {
          background: linear-gradient(135deg,#941918,#c94543);
          color: #ffffff;
          box-shadow: 0 6px 14px rgba(148,25,24,0.28);
        }
        .pc-row-new {
          animation: pc-row-enter .38s cubic-bezier(.22,1,.36,1);
        }
        .pc-row-new td {
          animation: pc-row-enter-cell .45s cubic-bezier(.22,1,.36,1), pc-row-flash 2.8s ease .08s;
          will-change: transform, opacity, background-color;
        }
        .pc-row-delete td {
          animation: pc-row-delete .32s ease forwards;
        }
        @keyframes pc-row-enter {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pc-row-enter-cell {
          0% { transform: translateY(6px) scale(.992); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes pc-row-flash {
          0% { background: #e0f2fe !important; }
          55% { background: #f0f9ff !important; }
          100% { background: transparent !important; }
        }
        @keyframes pc-row-delete {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(18px); }
        }
        @keyframes pc-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pc-pop-in {
          from { opacity: 0; transform: scale(.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pc-track-in {
          0% { opacity: 0; transform: translateY(10px) scale(.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {loading && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"65vh", gap:18 }}>
          <div style={{ width:52, height:52, border:"3px solid #e5e7eb", borderTop:"3px solid #80C2DC", borderRadius:"50%", animation:"pc-spin 0.85s linear infinite" }} />
          <p style={{ color:"#9ca3af", fontSize:13, letterSpacing:2, textTransform:"uppercase", margin:0 }}>Cargando perfil</p>
        </div>
      )}

      {!loading && error && (
        <div style={{ maxWidth:860, margin:"0 auto 20px", padding:"14px 20px", borderRadius:12, background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", display:"flex", alignItems:"center", gap:10 }}>
          <IconAlertCircle size={18} stroke={2} />
          <span style={{ fontSize:14 }}>{error}</span>
        </div>
      )}

      {!loading && (
        <div style={{ maxWidth:1300, margin:"0 auto" }}>

          {confirmDeleteId && (
            <div className="pc-confirm-overlay" onClick={cancelarEliminarComprobante}>
              <div className="pc-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h4 className="pc-confirm-title">Eliminar Comprobante</h4>
                <p className="pc-confirm-text">¿Deseas eliminar este comprobante de pago? Esta acción no se puede deshacer.</p>
                <div className="pc-confirm-actions">
                  <button
                    type="button"
                    className="pc-confirm-btn pc-confirm-btn-cancel"
                    onClick={cancelarEliminarComprobante}
                    disabled={eliminandoConfirmado}
                    style={{ opacity: eliminandoConfirmado ? 0.6 : 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="pc-confirm-btn pc-confirm-btn-delete"
                    onClick={confirmarEliminarComprobante}
                    disabled={eliminandoConfirmado}
                    style={{ opacity: eliminandoConfirmado ? 0.7 : 1 }}
                  >
                    {eliminandoConfirmado ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {chartFocused && graficoPagos?.image_base64 && (
            <div
              className="pc-chart-overlay-backdrop"
              onMouseEnter={showChartOverlay}
            >
              <div
                className="pc-chart-overlay-content"
                onMouseEnter={showChartOverlay}
                onMouseLeave={hideChartOverlay}
              >
                <img
                  className="pc-chart-overlay-image"
                  src={`data:image/png;base64,${graficoPagos.image_base64}`}
                  alt={`Vista ampliada del gráfico de ${graficoPagos.month || "este mes"}`}
                />
              </div>
            </div>
          )}

          {/* ── Notificacion flotante de datos incompletos ── */}
          {datosIncompletos && (
            <div className="pc-float-incomplete">
              <div className="pc-card" style={{ ...CARD, background:"rgba(148,25,24,0.11)", border:"1px solid rgba(148,25,24,0.3)", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 18px rgba(148,25,24,0.12)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:9, color:"#7f1d1d", minWidth:0 }}>
                  <IconAlertCircle size={17} stroke={2} />
                  <span style={{ fontSize:13, fontWeight:600, lineHeight:1.35 }}>Tu perfil esta incompleto. Completa tus datos para acceder a todos los servicios.</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Columna izquierda */}
            <div className="lg:col-span-1 flex flex-col gap-5">

              {/* Tarjeta perfil */}
              <div className="pc-card" style={{ ...CARD, padding:"28px 22px" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:22 }}>
                  <div className="pc-avatar-stage" style={{ marginBottom:14 }}>
                    <div className="pc-avatar-coin" style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(145deg,#941918 0%,#c94543 100%)", border:"3px solid #ffd600", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, color:"#fff", fontFamily:"'Oswald',sans-serif", letterSpacing:1, boxShadow:"0 4px 20px rgba(148,25,24,0.35)" }}>
                      {getInitials(cliente?.nombre)}
                    </div>
                  </div>
                  <h2 style={{ margin:"0 0 8px", fontSize:17, fontWeight:700, color:"#1f2937", fontFamily:"'Oswald',sans-serif", textAlign:"center" }}>{cliente?.nombre || "—"}</h2>
                  <button onClick={logout} className="pc-btn" style={{ marginTop:12, display:"inline-flex", alignItems:"center", gap:7, padding:"7px 14px", background:"#fff1f1", border:"1px solid #f4c4c4", borderRadius:9, color:"#941918", fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:"'Open Sans',sans-serif", transition:"filter 0.2s, transform 0.2s" }}>
                    <IconLogout size={14} stroke={2} /> Cerrar sesion
                  </button>
                </div>
                <div style={{ height:1, background:"linear-gradient(90deg,transparent,#e5e7eb,transparent)", marginBottom:20 }} />
                <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                  {[
                    { icon:<IconMail  size={14} stroke={2}/>, label:"Correo",    val:cliente?.correo    },
                    { icon:<IconPhone size={14} stroke={2}/>, label:"Telefono",  val:cliente?.numero    },
                    { icon:<IconId    size={14} stroke={2}/>, label:"Documento", val:cliente?.documento },
                  ].map(({ icon, label, val }) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:11 }}>
                      <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:"#e8f4f9", border:"1px solid #c7e4f0", display:"flex", alignItems:"center", justifyContent:"center", color:"#5a8ba8" }}>{icon}</div>
                      <div>
                        <div style={{ fontSize:10, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.1, marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:13.5, color:val ? "#374151" : "#d1d5db", fontWeight:val ? 500 : 400 }}>{val || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {datosIncompletos && (
                  <button onClick={abrirModalDatos} className="pc-btn" style={{ marginTop:22, width:"100%", padding:"10px", borderRadius:9, background:"linear-gradient(135deg,#941918,#c94543)", border:"none", color:"#ffffff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, fontFamily:"'Open Sans',sans-serif", transition:"filter 0.2s, transform 0.2s", boxShadow:"0 4px 14px rgba(148,25,24,0.3)" }}>
                    <IconEdit size={14} stroke={2} /> Completar perfil
                  </button>
                )}
              </div>

              {/* Frecuencia de compras */}
              <div className="pc-card" style={{ ...CARD, padding:"22px 20px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:18 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:"#e8f4f9", border:"1px solid #c7e4f0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <IconChartBar size={15} stroke={2} color="#5a8ba8"/>
                  </div>
                  <h4 style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#1f2937", fontFamily:"'Oswald',sans-serif" }}>Actividad de Compras</h4>
                  <span style={{ marginLeft:"auto", fontSize:10.5, fontWeight:700, color:"#5a8ba8", background:"#eef6fb", border:"1px solid #c7e4f0", borderRadius:999, padding:"4px 10px" }}>
                    {graficoPagos?.month || "Mes actual"}
                  </span>
                </div>
                {loadingGraficoPagos ? (
                  <div style={{ minHeight:220, display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontSize:13, fontWeight:600 }}>
                    Generando gráfico del mes...
                  </div>
                ) : graficoPagos?.image_base64 ? (
                  <>
                    <div className="pc-metrics-grid">
                      {[
                        { key:"monto", label:"Monto pagado", value:formatCurrency(graficoPagos.total_pagado), color:"#941918", bg:"#fff1f1", border:"#f4c4c4", hideThin:false },
                        { key:"dias", label:"Dias con compra", value:graficoPagos.dias_con_compra || 0, color:"#0c4a6e", bg:"#eef6fb", border:"#c7e4f0", hideThin:true },
                        { key:"ops", label:"Operaciones", value:graficoPagos.operaciones || 0, color:"#92400e", bg:"#fff7ed", border:"#fed7aa", hideThin:false },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`${item.hideThin ? "pc-metric-hide-thin" : ""} ${item.key === "monto" ? "pc-metric-monto" : ""} pc-metric-card`.trim()}
                          style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${item.border}`, background:item.bg }}
                        >
                          <div className="pc-metric-label">{item.label}</div>
                          <div className={item.key === "monto" ? "pc-metric-monto-value" : ""} style={{ fontSize:16, fontWeight:700, color:item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="pc-chart-shell"
                      onMouseEnter={showChartOverlay}
                      onMouseLeave={hideChartOverlay}
                      style={{ overflow:"hidden", borderRadius:16, border:"1px solid #dbeafe", background:"linear-gradient(180deg,#ffffff 0%,#f8fbfd 100%)", boxShadow:"0 10px 24px rgba(90,139,168,0.12)", cursor:"zoom-in" }}
                    >
                      <img
                        className="pc-chart-image"
                        src={`data:image/png;base64,${graficoPagos.image_base64}`}
                        alt={`Grafico de pagos de ${graficoPagos.month || "este mes"}`}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ minHeight:220, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, color:"#94a3b8", textAlign:"center", padding:"8px 10px" }}>
                    <IconChartBar size={42} stroke={1.4} color="#80C2DC" />
                    <div>
                      <p style={{ margin:"0 0 6px", fontSize:14, color:"#475569", fontWeight:700 }}>Aún no hay pagos registrados este mes</p>
                      <p style={{ margin:0, fontSize:12.5, color:"#94a3b8" }}>Cuando existan pagos asociados a tu cuenta, el gráfico aparecerá aquí.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Columna derecha */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Estado de pedidos */}
              <div className="pc-card" style={{ ...CARD, padding:"24px" }}>
                {progresoPedidoLista.length > 0
                  ? progresoPedidoLista.map((item, index) => (
                      <div className="pc-track-item" key={item.carrito_id || `pedido-${index}`}>
                        <div className="pc-track-label pc-track-label-pedido">
                          Pedido {index + 1}
                          {progresoPedidoLista.length > 1 ? ` de ${progresoPedidoLista.length}` : ""}
                        </div>
                        <BarraProgreso estado={item.estado} progreso={item.progreso} mostrar={item.mostrar_barra} />
                      </div>
                    ))
                  : (
                    <div className="pc-track-item">
                      <BarraProgreso estado={progresoPedido.estado} progreso={progresoPedido.progreso} mostrar={progresoPedido.mostrar} />
                    </div>
                  )}

                {progresoServicioLista.length > 0
                  ? progresoServicioLista.map((item, index) => (
                      <div className="pc-track-item" key={item.carrito_id || `servicio-${index}`}>
                        <div className="pc-track-label pc-track-label-servicio">
                          Servicio {index + 1}
                          {progresoServicioLista.length > 1 ? ` de ${progresoServicioLista.length}` : ""}
                        </div>
                        <BarraProgresoServicio estado={item.estado} progreso={item.progreso} mostrar={item.mostrar_barra} />
                      </div>
                    ))
                  : (
                    <div className="pc-track-item">
                      <BarraProgresoServicio estado={progresoServicio.estado} progreso={progresoServicio.progreso} mostrar={progresoServicio.mostrar} />
                    </div>
                  )}
              </div>

              {/* Comprobantes */}
              <div className="pc-card" style={{ ...CARD, padding:"26px", flex:1 }}>
                <div className="pc-comprobantes-header">
                  <div className="pc-comprobantes-title-row">
                    <div style={{ width:30, height:30, borderRadius:8, background:"#e8f4f9", border:"1px solid #c7e4f0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <IconCreditCard size={15} stroke={2} color="#5a8ba8"/>
                    </div>
                    <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#1f2937", fontFamily:"'Oswald',sans-serif", letterSpacing:0.5 }}>Comprobantes de Pago</h3>
                  </div>
                  <span className="pc-header-date-label">Fecha inicio</span>
                  <span className="pc-header-date-label">Fecha fin</span>
                </div>
                <div className="pc-comprobantes-filters">
                  <input
                    className="pc-search"
                    value={busquedaComprobante}
                    onChange={(e) => setBusquedaComprobante(e.target.value)}
                    placeholder="Buscar por monto, boleta o factura"
                  />
                  <div className="pc-date-filter" title="Fecha de inicio">
                    <IconCalendarWeek size={16} stroke={2} color="#5a8ba8" />
                    <input
                      className="pc-date-input"
                      type="date"
                      max={fechaMaximaBusqueda}
                      value={fechaInicioComprobante}
                      onChange={(e) => onFechaInicioChange(e.target.value)}
                    />
                  </div>
                  <div className="pc-date-filter-end-wrap">
                    <div className="pc-date-filter" title="Fecha de fin">
                      <IconCalendarEvent size={16} stroke={2} color="#5a8ba8" />
                      <input
                        className="pc-date-input"
                        type="date"
                        max={fechaMaximaBusqueda}
                        min={fechaInicioComprobante || undefined}
                        value={fechaFinComprobante}
                        onChange={(e) => onFechaFinChange(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="pc-btn-todo"
                      onClick={() => {
                        setFechaInicioComprobante("");
                        setFechaFinComprobante("");
                      }}
                      disabled={!fechaInicioComprobante && !fechaFinComprobante}
                      title="Mostrar todos los comprobantes"
                    >
                      Todo
                    </button>
                  </div>
                </div>
                {comprobantes.length === 0 ? (
                  <div style={{ padding:"46px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:14, color:"#d1d5db" }}>
                    <IconReceipt size={44} stroke={1} style={{ opacity:0.4 }} />
                    <p style={{ margin:0, fontSize:14, color:"#9ca3af" }}>No tienes comprobantes de pago registrados</p>
                  </div>
                ) : (
                  <div className="pc-comprobantes-scroll" onScroll={onScrollComprobantes}>
                    <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 4px" }}>
                      <thead>
                        <tr>
                          <th className="pc-col-hide-thin" style={{ padding:"8px 14px 14px", textAlign:"center", fontSize:10.5, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.4, borderBottom:"1px solid #e5e7eb", fontFamily:"'Open Sans',sans-serif" }}>Tipo</th>
                          <th className="pc-col-hide-thin" style={{ padding:"8px 14px 14px", textAlign:"center", fontSize:10.5, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.4, borderBottom:"1px solid #e5e7eb", fontFamily:"'Open Sans',sans-serif" }}>Fecha</th>
                          <th style={{ padding:"8px 14px 14px", textAlign:"right", fontSize:10.5, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.4, borderBottom:"1px solid #e5e7eb", fontFamily:"'Open Sans',sans-serif" }}>Monto</th>
                          <th style={{ padding:"8px 14px 14px", textAlign:"center", fontSize:10.5, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1.4, borderBottom:"1px solid #e5e7eb", fontFamily:"'Open Sans',sans-serif" }}>PDF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comprobantesMostrados.map((c, idx) => (
                          <tr key={c.id_registro} className={`pc-row ${nuevosComprobantes.includes(c.id_registro) ? "pc-row-new" : ""} ${eliminandoComprobantes.includes(c.id_registro) ? "pc-row-delete" : ""}`} style={{ cursor:"default" }}>
                            <td className="pc-col-hide-thin-cell" style={{ padding:"11px 14px", textAlign:"center", background:idx%2===0?"#f9fafb":"transparent", borderRadius:"9px 0 0 9px", color:"#1f2937", fontWeight:600, fontSize:13, transition:"background 0.15s" }}>{c.tipo}</td>
                            <td className="pc-col-hide-thin-cell" style={{ padding:"11px 14px", textAlign:"center", background:idx%2===0?"#f9fafb":"transparent", color:"#6b7280", fontSize:13, transition:"background 0.15s" }}>{formatFechaComprobante(c.fecha)}</td>
                            <td style={{ padding:"11px 14px", textAlign:"right", background:idx%2===0?"#f9fafb":"transparent", color:"#941918", fontWeight:700, fontSize:14.5, transition:"background 0.15s", whiteSpace:"nowrap" }}>S/ {Number(c.monto).toFixed(2)}</td>
                            <td style={{ padding:"11px 14px", textAlign:"center", background:idx%2===0?"#f9fafb":"transparent", borderRadius:"0 9px 9px 0", transition:"background 0.15s" }}>
                              <div className="pc-actions-cell">
                                {c.documento_url ? (
                                  <a href={c.documento_url} target="_blank" rel="noopener noreferrer" className="pc-link pc-pdf-link" title="Descargar PDF">
                                    <IconFileTypePdf className="pc-pdf-icon" size={16} stroke={1.7}/>
                                  </a>
                                ) : <span style={{ color:"#d1d5db", fontSize:12 }}>—</span>}
                                <button
                                  type="button"
                                  disabled={eliminandoComprobantes.includes(c.id_registro)}
                                  onClick={() => solicitarEliminarComprobante(c.id_registro)}
                                  className="pc-delete-btn pc-delete-mobile-hide"
                                  style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, background:"#fff7f7", border:"1px solid #fecaca", transition:"all 0.2s", color:"#dc2626", cursor:eliminandoComprobantes.includes(c.id_registro) ? "not-allowed" : "pointer", opacity:eliminandoComprobantes.includes(c.id_registro) ? 0.6 : 1 }}
                                  title="Eliminar comprobante"
                                >
                                  <IconTrash size={16} stroke={2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {comprobantesFiltrados.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: "28px 10px", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
                              No se encontraron comprobantes con esa búsqueda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {comprobantesFiltrados.length > comprobantesMostrados.length && (
                      <div style={{ textAlign: "center", padding: "10px 6px 2px", color: "#94a3b8", fontSize: 12.5, fontWeight: 600 }}>
                        Desliza para cargar más comprobantes...
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {mostrarModalDatos && (
            <CompletaDatosGoogle
              asModal={true}
              onClose={() => setMostrarModalDatos(false)}
              onDatosActualizados={handleDatosActualizados}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PanelCliente;
