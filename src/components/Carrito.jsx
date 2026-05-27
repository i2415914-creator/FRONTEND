import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS, FONTS } from '../colors';
import { IconShoppingCart, IconTrash, IconFilePencil, IconRotateClockwise2, IconTruckLoading, IconAppWindow, IconCategoryPlus, IconX, IconCreditCard } from '@tabler/icons-react';
import MercadoPagoCardForm from './MercadoPagoCardForm';
import ModalFacturacion from './VENTA/ModalFacturacion';
import CortesDrawer from './Cortes/CortesDrawer';
import { useCartStore } from '../stores/cartStore';

const formatPrice = (n) =>
  Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const FACTURACION_PENDIENTE_KEY = 'facturacion_pendiente';

const Carrito = () => {
  const ENABLE_MERCADO_PAGO = true;
  const SKIP_MERCADO_PAGO_CARD_FOR_TESTS = false;
  const [carritoId, setCarritoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [toastTipo, setToastTipo] = useState('update');
  const [toastLeaving, setToastLeaving] = useState(false);
  const [editingQty, setEditingQty] = useState({});
  const [stockByProduct, setStockByProduct] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardFormLoading, setCardFormLoading] = useState(false);
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [facturacionProductos, setFacturacionProductos] = useState([]);
  const [registroPagoPendienteId, setRegistroPagoPendienteId] = useState(null);
  const [showCortesDrawer, setShowCortesDrawer] = useState(false);
  const [corteEnEdicion, setCorteEnEdicion] = useState(null);
  const [costoCorte, setCostoCorte] = useState(0);
  const [preciosPorProducto, setPreciosPorProducto] = useState({});
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const navigate = useNavigate();
  const location = useLocation();
  const carritoLocal = useCartStore((state) => state.items);
  const ensureCartId = useCartStore((state) => state.ensureCartId);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateCorteItem = useCartStore((state) => state.updateCorteItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');

  const normalizarCortesParaPago = (cortes, esAluminio = false) => {
    return (Array.isArray(cortes) ? cortes : []).map((corte) => {
      const anchoCm = Number(corte?.ancho_cm ?? corte?.ancho ?? corte?.largo_cm ?? 0) || 0;
      const altoCm = esAluminio ? 0 : (Number(corte?.alto_cm ?? corte?.alto ?? 0) || 0);
      const cantidad = Number(corte?.cantidad || 1) || 1;
      return { ancho_cm: anchoCm, alto_cm: altoCm, cantidad };
    }).filter((corte) => corte.ancho_cm > 0 && corte.cantidad > 0 && (esAluminio || corte.alto_cm > 0));
  };

  const obtenerCantidadItem = (item) => Number(item?.cantidad ?? item?.qty ?? 1) || 1;

  const construirProductosConfirmarCompra = (items) => {
    const productsById = {};
    (Array.isArray(items) ? items : []).forEach((item) => {
      const productoId = item.id_producto || item.id;
      if (!productoId) return;
      const cantidad = obtenerCantidadItem(item);
      const categoria = String(item?.categoria || '').toUpperCase();
      const esAluminio = categoria.includes('ALUMINIO');
      const prod = {
        producto_id: productoId,
        cantidad,
        tipo_venta: item.tipo_venta || 'plancha',
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoria: item.categoria,
        codigo: item.codigo,
      };
      if (item.tipo_venta === 'corte' && item.cortes) {
        prod.cortes = normalizarCortesParaPago(item.cortes, esAluminio);
      }

      if (productsById[productoId]) {
        productsById[productoId].cantidad += cantidad;
      } else {
        productsById[productoId] = prod;
      }
    });
    return Object.values(productsById).filter((p) => !!p.producto_id);
  };

  const construirProductosFacturacion = (items) => {
    return (Array.isArray(items) ? items : []).map((p) => ({
      codigo: p.codigo || p.codigo_producto || p.id_producto,
      descripcion: p.descripcion || p.nombre,
      cantidad: Number(p.cantidad) || 1,
      precio_unitario: Number(p.precio_unitario) || 0,
    }));
  };

  const guardarFacturacionPendiente = (productos) => {
    const payload = Array.isArray(productos) ? productos : [];
    setFacturacionProductos(payload);
    setShowFacturacionModal(true);
    try { sessionStorage.setItem(FACTURACION_PENDIENTE_KEY, JSON.stringify(payload)); } catch {}
  };

  const limpiarFacturacionPendiente = () => {
    setFacturacionProductos([]);
    setRegistroPagoPendienteId(null);
    setShowFacturacionModal(false);
    try { sessionStorage.removeItem(FACTURACION_PENDIENTE_KEY); } catch {}
  };

  const marcarFacturacionCompletada = () => {
    try { sessionStorage.removeItem(FACTURACION_PENDIENTE_KEY); } catch {}
    localStorage.removeItem('carrito_id');
    clearCart();
    setCarritoId(null);
    setFacturacionProductos([]);
    setRegistroPagoPendienteId(null);
  };

  const resolverMetodoPago = (paymentData = {}) => {
    const paymentMethodId = String(paymentData?.payment_method_id || '').toLowerCase();
    const paymentId = String(paymentData?.payment_id || paymentData?.id || '').toLowerCase();

    if (paymentMethodId.includes('yape') || paymentId.includes('yape')) {
      return { metodo_pago: 'por yape', payment_method_id: 'yape' };
    }

    if (
      paymentMethodId.includes('pagoefectivo') ||
      paymentMethodId.includes('cash') ||
      paymentMethodId.includes('efectivo') ||
      paymentMethodId.includes('atm') ||
      paymentId.includes('efectivo')
    ) {
      return { metodo_pago: 'al contado', payment_method_id: paymentMethodId || 'pagoefectivo' };
    }

    if (
      paymentMethodId.includes('credit') ||
      paymentMethodId.includes('debit') ||
      paymentMethodId.includes('visa') ||
      paymentMethodId.includes('master') ||
      paymentMethodId.includes('amex') ||
      paymentMethodId.includes('card')
    ) {
      return { metodo_pago: 'por tarjeta', payment_method_id: paymentMethodId || 'card' };
    }

    return { metodo_pago: 'por tarjeta', payment_method_id: paymentMethodId || '' };
  };

  const registrarCompraParaSeguimiento = async () => {
    if (ENABLE_MERCADO_PAGO) return true;
    const clienteId = localStorage.getItem('cliente_id');
    const authToken = localStorage.getItem('auth_token') || token;
    const carritoIdActual = carritoId || localStorage.getItem('carrito_id');
    const productos = construirProductosConfirmarCompra(carritoLocal);
    if (!clienteId || !authToken || !carritoIdActual || productos.length === 0) return false;
    try {
      const metodo = { metodo_pago: 'al contado', payment_method_id: 'manual' };
      const res = await fetch('/api/pagos/confirmar_compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          carrito_id: carritoIdActual,
          cliente_id: clienteId,
          productos,
          payment_id: `manual-${Date.now()}`,
          ...metodo,
        }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setRegistroPagoPendienteId(data?.registro_pago_id || null);
      return !!data?.success;
    } catch { return false; }
  };

  const procesarPagoExitoso = async (paymentData) => {
    setLoading(true);
    console.log('[CARRITO] Pago exitoso:', paymentData);
    const clienteId = localStorage.getItem('cliente_id');
    const tokenActual = localStorage.getItem('auth_token') || token;
    const metodoPagoPayload = resolverMetodoPago(paymentData);
    try {
      const productosParaGuardar = construirProductosConfirmarCompra(carritoLocal);
      const productNameMap = carritoLocal.reduce((acc, item) => {
        const id = item?.id_producto || item?.id;
        if (!id) return acc;
        acc[id] = acc[id] || item?.nombre || item?.descripcion || item?.codigo || 'este producto';
        return acc;
      }, {});
      const res = await fetch('/api/pagos/confirmar_compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenActual}` },
        body: JSON.stringify({
          carrito_id: carritoId || localStorage.getItem('carrito_id'),
          cliente_id: clienteId,
          productos: productosParaGuardar,
          payment_id: paymentData?.payment_id || paymentData?.id || `test-payment-${Date.now()}`,
          metodo_pago: metodoPagoPayload.metodo_pago,
          payment_method_id: metodoPagoPayload.payment_method_id,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setLoading(false);
          setMensaje('Se cerró su sesión, vuelva a iniciar sesión.');
          const from = location?.pathname || '/carrito';
          navigate(`/login?from=${encodeURIComponent(from)}`, { state: { from } });
          return;
        }
        let errorBody;
        try {
          const text = await res.text();
          errorBody = text ? JSON.parse(text) : null;
        } catch {
          errorBody = null;
        }
        const errorMessage = errorBody?.message || (typeof errorBody === 'string' ? errorBody : null) || 'Pago confirmado pero hubo un error al guardar tu compra.';
        if (res.status === 400 && Array.isArray(errorBody?.stock_faltante) && errorBody.stock_faltante.length > 0) {
          const detalles = errorBody.stock_faltante
            .map((item) => {
              const nombre = productNameMap[item.producto_id] || 'este producto';
              const disponible = Number(item.disponible || 0);
              const solicitado = Number(item.solicitado || 0);
              return `para ${nombre} solo hay ${disponible} disponible${disponible === 1 ? '' : 's'}${solicitado ? ` de ${solicitado} solicitadas` : ''}`;
            })
            .join('; ');
          setMensaje(`⚠️ ${errorMessage}. ${detalles}`);
        } else {
          setMensaje(`⚠️ ${errorMessage}`);
        }
        console.error('[CARRITO] Error confirmando compra:', res.status, errorBody || 'no JSON body');
        setLoading(false);
        return;
      }
      const resultadoGuardar = await res.json();
      if (resultadoGuardar.success) {
        setRegistroPagoPendienteId(resultadoGuardar?.registro_pago_id || null);
        setShowCardForm(false);
        const eventPayload = {
          carrito_id: carritoId || localStorage.getItem('carrito_id'),
          cliente_id: clienteId,
          total: totalBruto,
          payment_id: paymentData?.payment_id || paymentData?.id || `test-payment-${Date.now()}`,
          timestamp: Date.now(),
        };
        window.dispatchEvent(new CustomEvent('venta-confirmada', { detail: eventPayload }));
        try { localStorage.setItem('venta_confirmada', JSON.stringify(eventPayload)); } catch {}
        setMensaje('✅ ¡Pago realizado! El seguimiento ya fue registrado y la venta ya está disponible en caja.');
        const productosFacturacion = construirProductosFacturacion(carritoLocal);
        guardarFacturacionPendiente(productosFacturacion);
        clearCart();
        setCarritoId(null);
        localStorage.removeItem('carrito_id');
        setLoading(false);
      } else {
        setMensaje('⚠️ Pago confirmado pero hubo un error al guardar tu compra. Contacta soporte.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[CARRITO] Error guardando compra:', err);
      setMensaje('⚠️ Pago confirmado pero hubo un error al guardar. Contacta soporte.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e) => { if (e.detail?.token) setToken(e.detail.token); };
    window.addEventListener('tokenUpdated', handler);
    return () => window.removeEventListener('tokenUpdated', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(FACTURACION_PENDIENTE_KEY);
      if (!saved) return;
      const productos = JSON.parse(saved);
      if (Array.isArray(productos) && productos.length > 0) {
        setFacturacionProductos(productos);
        setShowFacturacionModal(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (showFacturacionModal) setLoading(false);
  }, [showFacturacionModal]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const status = urlParams.get('status');
    const carritoIdParam = urlParams.get('carrito_id');
    if (status && carritoIdParam) {
      console.log('[CARRITO] Retorno de Mercado Pago - Status:', status);
      if (status === 'success') setMensaje('✅ ¡Pago exitoso! Genera el comprobante cuando estés listo.');
      else if (status === 'pending') setMensaje('⏳ Pago pendiente. Te notificaremos cuando se confirme.');
      else if (status === 'failure') setMensaje('❌ El pago no pudo completarse. Intenta nuevamente.');
      window.history.replaceState({}, document.title, '/carrito');
    }
  }, [location.search, carritoLocal]);

  // =====================================================================
  // ✅ FIX: realizarPedido — loading no se apaga en finally cuando abre
  //         el card form. Se apaga con un delay de 400ms para que el
  //         spinner sea visible antes de que aparezca el modal de pago.
  // =====================================================================
  const realizarPedido = async () => {
    setLoading(true);
    setMensaje('');

    try {
      const clienteId = localStorage.getItem('cliente_id');
      if (!clienteId || !token) {
        const from = location?.pathname || '/carrito';
        navigate(`/login?from=${encodeURIComponent(from)}`, { state: { from } });
        setLoading(false);
        return;
      }

      if (!carritoId) {
        setMensaje('No hay un carrito activo. Agrega productos e inténtalo nuevamente.');
        setLoading(false);
        return;
      }

      if (!Array.isArray(carritoLocal) || carritoLocal.length === 0) {
        showToast('Añade mínimo un producto.', 'empty-cart');
        setLoading(false);
        return;
      }

      if (!validarStockAntesDePagar()) {
        setLoading(false);
        return;
      }

      if (!ENABLE_MERCADO_PAGO) {
        guardarFacturacionPendiente(construirProductosFacturacion(carritoLocal));
        showToast('Mercado Pago deshabilitado. Continúa con la emisión de comprobante.', 'payment-info');
        setLoading(false);
        return;
      }

      if (SKIP_MERCADO_PAGO_CARD_FOR_TESTS) {
        showToast('Modo prueba activo: pago aprobado sin datos de tarjeta.', 'payment-info');
        await procesarPagoExitoso({ payment_id: `mp-test-${Date.now()}`, status: 'approved', test_mode: true });
        setLoading(false);
        return;
      }

      // Mostrar formulario de pago — el spinner es visible ~400ms antes de que
      // aparezca el modal, dando feedback visual claro al usuario.
      setShowCardForm(true);
      showToast('Completa tus datos de tarjeta para finalizar el pago.', 'payment-info');
      setTimeout(() => setLoading(false), 400);

    } catch (err) {
      console.error('[REALIZARPEDIDO] Error:', err);
      setMensaje('❌ Ocurrió un error al iniciar el pago. Intenta nuevamente.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const cid = ensureCartId();
    localStorage.setItem('carrito_id', cid);
    setCarritoId(cid);
  }, [ensureCartId]);

  useEffect(() => {
    fetch('/api/cortes/config')
      .then((r) => r.json())
      .then((data) => { if (data?.success && typeof data.costo_corte === 'number') setCostoCorte(data.costo_corte); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/productos')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const stockMap = {};
        const precioMap = {};
        data.forEach((producto) => {
          const id = producto?.id_producto || producto?.id;
          if (!id) return;
          const stock = Number(producto?.cantidad || 0);
          stockMap[id] = Number.isFinite(stock) ? Math.max(0, stock) : 0;
          const precio = Number(producto?.precio_unitario || 0);
          if (precio > 0) precioMap[id] = precio;
        });
        setStockByProduct(stockMap);
        setPreciosPorProducto(precioMap);
      })
      .catch(() => {});
  }, []);

  // Corregir en tabla los precios inflados de ítems de corte del localStorage viejo
  useEffect(() => {
    if (Object.keys(preciosPorProducto).length === 0) return;
    carritoLocal.forEach((item) => {
      if (item.tipo_venta !== 'corte') return;
      if (item.precio_m2) return; // ya corregido
      const id = item.id_producto || item.id;
      const precioM2 = preciosPorProducto[id];
      if (!precioM2 || !Array.isArray(item.cortes) || item.cortes.length === 0) return;
      const esAluminio = (item.categoria || '').toUpperCase().includes('ALUMINIO');
      let total = 0;
      for (const c of item.cortes) {
        const ancho = Number(c.ancho_cm || 0);
        const alto = Number(c.alto_cm || 0);
        const cantidad = Number(c.cantidad || 0);
        if (ancho <= 0 || cantidad <= 0) continue;
        if (!esAluminio && alto <= 0) continue;
        const precioBase = esAluminio
          ? (ancho / 100) * precioM2
          : (ancho * alto / 10000) * precioM2;
        total += (precioBase + costoCorte) * cantidad;
      }
      total = Math.round(total * 100) / 100;
      updateCorteItem(item.item_uid, item.cortes, total, precioM2);
    });
  }, [preciosPorProducto, costoCorte]);

  useEffect(() => {
    if (!mensaje) return;
    setToastLeaving(false);
    const leaveTimer = setTimeout(() => setToastLeaving(true), 2200);
    const hideTimer = setTimeout(() => { setMensaje(''); setToastLeaving(false); }, 2600);
    return () => { clearTimeout(leaveTimer); clearTimeout(hideTimer); };
  }, [mensaje]);

  const showToast = (texto, tipo = 'update') => { setToastTipo(tipo); setMensaje(texto); };

  const getStockDisponible = (item) => {
    const id = item?.id_producto || item?.id;
    if (!id) return null;
    const stock = stockByProduct[id];
    if (typeof stock !== 'number' || Number.isNaN(stock)) return null;
    return Math.max(0, stock);
  };

  const validarCantidadPorStock = (item, nuevaCantidad) => {
    if (!item || item.tipo_venta === 'corte') return { ok: true, cantidad: Math.max(1, Number(nuevaCantidad || 1)) };
    const stock = getStockDisponible(item);
    const cantidadDeseada = Math.max(1, Number(nuevaCantidad || 1));
    if (stock === null) return { ok: true, cantidad: cantidadDeseada };
    if (stock <= 0) { showToast('Ya no hay stock disponible para este producto.', 'stock'); return { ok: false, cantidad: Number(item.cantidad || 1) }; }
    if (cantidadDeseada > stock) { showToast(`Stock máximo disponible: ${stock}.`, 'stock-max'); return { ok: false, cantidad: stock }; }
    if (cantidadDeseada === stock) showToast('Llegaste al límite de stock disponible para este producto.', 'stock-max');
    else if (stock - cantidadDeseada <= 2) showToast(`Quedan pocas unidades: ${stock - cantidadDeseada}.`, 'stock');
    return { ok: true, cantidad: cantidadDeseada };
  };

  const validarStockAntesDePagar = () => {
    for (const item of carritoLocal) {
      if (item?.tipo_venta === 'corte') continue;
      const stock = getStockDisponible(item);
      if (stock === null) {
        showToast(`No se pudo verificar stock de ${item?.nombre || 'este producto'}. Recarga la página e inténtalo de nuevo.`, 'stock');
        return false;
      }
      const cantidad = obtenerCantidadItem(item);
      if (stock <= 0 || cantidad > stock) {
        showToast(`El producto ${item?.nombre || ''} superó el stock disponible.`, 'stock');
        return false;
      }
    }
    return true;
  };

  const actualizarCantidad = (item, itemKey, nuevaCantidad) => {
    if (nuevaCantidad <= 0) { handleEliminar(itemKey); return; }
    const validacion = validarCantidadPorStock(item, nuevaCantidad);
    if (!validacion.ok) {
      if (validacion.cantidad !== Number(item?.cantidad || 1)) updateQuantity(itemKey, validacion.cantidad);
      setEditingQty((prev) => ({ ...prev, [itemKey]: validacion.cantidad }));
      return;
    }
    updateQuantity(itemKey, validacion.cantidad);
    setEditingQty((prev) => ({ ...prev, [itemKey]: validacion.cantidad }));
    showToast('Cantidad actualizada', 'update');
  };

  const recalcularTotalCortes = (cortes, precioM2, esAluminio, cCorte) => {
    if (!Array.isArray(cortes) || !precioM2) return null;
    let total = 0;
    for (const c of cortes) {
      const ancho = Number(c.ancho_cm || 0);
      const alto = Number(c.alto_cm || 0);
      const cantidad = Number(c.cantidad || 0);
      if (ancho <= 0 || cantidad <= 0) continue;
      if (!esAluminio && alto <= 0) continue;
      const precioBase = esAluminio
        ? (ancho / 100) * precioM2
        : (ancho * alto / 10000) * precioM2;
      total += (precioBase + (cCorte || 0)) * cantidad;
    }
    return Math.round(total * 100) / 100;
  };

  const handleEliminar = (itemKey) => { removeItem(itemKey); showToast('Producto eliminado del carrito', 'update'); };
  const abrirEditorDeCortes = async (item) => {
    let precioM2 = item.precio_m2;
    if (!precioM2 && item.id_producto) {
      try {
        const r = await fetch(`/api/productos/${item.id_producto}`);
        if (r.ok) {
          const p = await r.json();
          precioM2 = Number(p.precio_unitario || 0) || undefined;
        }
      } catch {}
    }
    // Si hay precio real y cortes guardados, corregir el total en el store inmediatamente
    if (precioM2 && Array.isArray(item.cortes) && item.cortes.length > 0) {
      const esAluminio = (item.categoria || '').toUpperCase().includes('ALUMINIO');
      const totalCorregido = recalcularTotalCortes(item.cortes, precioM2, esAluminio, costoCorte);
      if (totalCorregido !== null) {
        updateCorteItem(item.item_uid, item.cortes, totalCorregido, precioM2);
      }
    }
    setCorteEnEdicion({ ...item, precio_m2: precioM2 });
    setShowCortesDrawer(true);
  };
  const cerrarEditorDeCortes = () => { setShowCortesDrawer(false); setCorteEnEdicion(null); };
  const guardarCortesEditados = ({ cortes, total }) => {
    if (!corteEnEdicion?.item_uid) return;
    updateCorteItem(corteEnEdicion.item_uid, cortes, total, corteEnEdicion.precio_m2);
    showToast('Medidas actualizadas', 'update');
    cerrarEditorDeCortes();
  };

  const totalBruto = Number(carritoLocal.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0).toFixed(2));
  const subtotalSinIgv = Number((totalBruto / 1.18).toFixed(2));
  const igv = Number((totalBruto - subtotalSinIgv).toFixed(2));

  const cardBase = {
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(199,228,240,0.9)',
    borderRadius: 16,
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  };

  return (
    <div className="cart-shell" style={{ maxWidth: 1260, margin: '0 auto', padding: isMobile ? '18px 10px 14px' : (isTablet ? '28px 16px 18px' : '38px 24px 24px') }}>
      <style>{`
        .cart-shell { position: relative; }
        .cart-entry { animation: cartFadeUp .52s cubic-bezier(.22,1,.36,1); }
        .cart-entry-soft { animation: cartFadeUp .62s cubic-bezier(.22,1,.36,1); }
        .cart-card-hover { transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease; }
        .cart-card-hover:hover { transform: translateY(-2px); box-shadow: 0 16px 30px rgba(15,23,42,0.12); border-color: rgba(128,194,220,.95) !important; }
        .cart-row { transition: transform .18s ease, background-color .18s ease; }
        .cart-row:hover { transform: translateY(-1px); background-color: #f0f7fb !important; }
        .cart-icon-btn { transition: transform .16s ease, filter .16s ease; }
        .cart-icon-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(15,23,42,0.18); filter: brightness(.98); }
        @keyframes cartFadeUp { 0% { opacity: 0; transform: translateY(10px) scale(.995); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .cart-cut-btn { width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; border: none; background: transparent; color: #b07a00; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
        .cart-cut-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(176,122,0,0.22); }
        .cart-top-toast-wrap { position: fixed; top: 108px; left: 0; right: 0; z-index: 9999; display: flex; justify-content: center; pointer-events: none; }
        .cart-top-toast { display: inline-flex; align-items: center; gap: 8px; min-width: 280px; max-width: 440px; padding: 11px 14px; border-radius: 12px; border: 1px solid #bde0ef; background: linear-gradient(120deg, rgba(232,244,249,0.98), rgba(255,255,255,0.98)); color: #0c4a6e; box-shadow: 0 14px 30px rgba(15,23,42,0.18); animation: cartToastIn .24s ease; }
        .cart-top-toast.stock-max { border: 1px solid #facc15; background: linear-gradient(120deg, #fff8db, #ffe88a); color: #7c5a00; }
        .cart-top-toast.payment-info { border: 1px solid #bde0ef; background: linear-gradient(120deg, rgba(232,244,249,0.98), rgba(255,255,255,0.98)); color: #0c4a6e; }
        .cart-top-toast.leave { animation: cartToastOut .28s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cartToastIn { 0% { opacity: 0; transform: translateY(-10px) scale(.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes cartToastOut { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-6px) scale(.98); } }
        @media (max-width: 767px) {
          .cart-mobile-hide { display: none !important; }
          .cart-table-mobile { min-width: 0 !important; }
          .cart-mobile-name { min-width: 130px !important; padding-left: 8px !important; padding-right: 8px !important; font-size: 14px !important; }
          .cart-mobile-price { min-width: 96px !important; font-size: 14px !important; font-weight: 900 !important; color: #082f49 !important; padding-left: 6px !important; padding-right: 6px !important; }
          .cart-mobile-price-head { font-size: 12px !important; color: #0b3c63 !important; letter-spacing: 0.01em !important; }
          .cart-mobile-price-cell { background: linear-gradient(120deg, rgba(128,194,220,0.2), rgba(173,216,235,0.12)) !important; }
          .cart-mobile-total-value { background: linear-gradient(120deg, rgba(128,194,220,0.22), rgba(173,216,235,0.14)) !important; font-size: 16px !important; font-weight: 900 !important; color: #001f36 !important; }
          .cart-mobile-subtotal-head { color: #7a2a00 !important; }
          .cart-mobile-subtotal-cell { background: linear-gradient(120deg, rgba(255,214,170,0.45), rgba(255,235,200,0.35)) !important; color: #7a2a00 !important; font-size: 15px !important; font-weight: 900 !important; }
        }
      `}</style>

      {mensaje && (
        <div className="cart-top-toast-wrap">
          <div className={`cart-top-toast ${toastTipo === 'stock-max' ? 'stock-max' : ''} ${toastTipo === 'payment-info' ? 'payment-info' : ''} ${toastLeaving ? 'leave' : ''}`} role="status" aria-live="polite">
            <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {toastTipo === 'stock' || toastTipo === 'stock-max' ? <IconTruckLoading stroke={2} size={18} />
                : toastTipo === 'empty-cart' ? <IconCategoryPlus stroke={1} size={18} />
                : toastTipo === 'payment-info' ? <IconAppWindow stroke={1} size={18} />
                : <IconRotateClockwise2 stroke={2} size={18} />}
            </span>
            <span className="font-body" style={{ fontFamily: FONTS.body, fontWeight: 600 }}>{mensaje}</span>
          </div>
        </div>
      )}

      <div className="cart-entry cart-card-hover" style={{ ...cardBase, padding: isMobile ? '14px 12px' : '18px 20px', marginBottom: 16, background: 'linear-gradient(120deg, rgba(232,244,249,0.95), rgba(255,255,255,0.92))' }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e8f4f9', border: '1px solid #c7e4f0', color: '#5a8ba8' }}>
            <IconShoppingCart size={18} stroke={2} />
          </span>
          <div>
            <h2 className="font-heading" style={{ margin: 0, fontWeight: 700, fontSize: isMobile ? 22 : 28, color: COLORS.text }}>Carrito de Compras</h2>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.textLight, fontFamily: FONTS.body }}>Gestiona tus productos y finaliza el pedido con pago seguro.</p>
          </div>
        </div>
      </div>

      <div className="cart-entry-soft cart-card-hover" style={{ ...cardBase, padding: 10, overflowX: isMobile ? 'hidden' : 'auto' }}>
        <table className="table-auto w-full shadow-sm text-sm rounded-2xl overflow-hidden font-body cart-table-mobile"
          style={{ minWidth: isMobile ? 0 : 1000, borderColor: COLORS.border, backgroundColor: COLORS.backgroundLight, borderRadius: 12 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(120deg,#f8fbff,#eef6fb)' }}>
              <th className="px-4 py-3 text-left font-heading cart-mobile-name" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>NOMBRE</th>
              <th className="px-4 py-3 text-left font-heading cart-mobile-hide" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>GROSOR</th>
              <th className="px-4 py-3 text-left font-heading cart-mobile-hide" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>CODIGO</th>
              <th className="px-8 py-3 text-left font-heading cart-mobile-hide" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border, width: '40%' }}>DESCRIPCIÓN</th>
              <th className="px-2 py-3 text-left font-heading cart-mobile-hide" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border, width: 64 }}>CANTIDAD</th>
              <th className="px-4 py-3 text-center font-heading cart-mobile-hide" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>Acción</th>
              <th className="px-4 py-3 text-right font-heading cart-mobile-price cart-mobile-price-head" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border, whiteSpace: 'nowrap', minWidth: isMobile ? 0 : 160 }}>PRECIO UNITARIO</th>
              <th className="px-4 py-3 text-right font-heading cart-mobile-price cart-mobile-price-head cart-mobile-subtotal-head" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {carritoLocal.map((row, idx) => (
              <tr key={`${row.id_producto || row.id}-${idx}`} className="font-body cart-row" style={{ backgroundColor: idx % 2 === 0 ? COLORS.white : COLORS.gray[50] }}>
                <td className="px-4 py-2 font-body cart-mobile-name" style={{ minWidth: 250, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', wordBreak: 'break-word', borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }} title={row.nombre}>{row.nombre}</td>
                <td className="px-4 py-2 font-body cart-mobile-hide" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}>{row.grosor}</td>
                <td className="px-4 py-2 font-body cart-mobile-hide" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}>{row.codigo}</td>
                <td className="px-8 py-2 font-body cart-mobile-hide" style={{ width: '40%', borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}>
                  {row.tipo_venta === 'corte' ? `Cortes personalizados${Array.isArray(row.cortes) && row.cortes.length ? ` (${row.cortes.length} medida${row.cortes.length > 1 ? 's' : ''})` : ''}` : row.descripcion}
                </td>
                <td className="px-2 py-2 font-body cart-mobile-hide" style={{ width: 128, textAlign: 'center', borderColor: COLORS.border }}>
                  {row.tipo_venta === 'corte' ? (
                    <button type="button" className="cart-cut-btn cart-icon-btn" title="Editar o agregar medidas" onClick={() => abrirEditorDeCortes(row)}>
                      <IconFilePencil stroke={1} size={20} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                      <button type="button" onClick={() => actualizarCantidad(row, row.item_uid, Math.max(1, Number(editingQty[row.item_uid] ?? row.cantidad) - 1))} className="font-body" style={{ padding: '4px 8px', backgroundColor: '#e8f4f9', borderRadius: 8, border: '1px solid #c7e4f0', fontFamily: FONTS.body, color: '#0c4a6e', cursor: 'pointer' }}>-</button>
                      <input type="number" min={1} value={editingQty[row.item_uid] ?? row.cantidad}
                        onChange={(e) => { const val = Math.max(1, Number(e.target.value)); setEditingQty((p) => ({ ...p, [row.item_uid]: val })); }}
                        onBlur={() => { const val = Number(editingQty[row.item_uid] ?? row.cantidad); actualizarCantidad(row, row.item_uid, Math.max(1, val)); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        className="font-body" style={{ width: 64, textAlign: 'center', border: '1px solid #c7e4f0', borderRadius: 8, fontFamily: FONTS.body, background: '#fff' }}
                      />
                      <button type="button" onClick={() => actualizarCantidad(row, row.item_uid, Number(editingQty[row.item_uid] ?? row.cantidad) + 1)} className="font-body" style={{ padding: '4px 8px', backgroundColor: '#e8f4f9', borderRadius: 8, border: '1px solid #c7e4f0', fontFamily: FONTS.body, color: '#0c4a6e', cursor: 'pointer' }}>+</button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-center font-body cart-mobile-hide" style={{ borderColor: COLORS.border }}>
                  <div className="flex justify-center">
                    <button onClick={() => handleEliminar(row.item_uid)} className="font-heading cart-icon-btn" title="Eliminar producto"
                      style={{ background: 'transparent', color: '#b91c1c', borderRadius: 8, width: 34, height: 34, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconTrash size={14} stroke={2} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 font-body text-right cart-mobile-price cart-mobile-price-cell" style={{ maxWidth: isMobile ? 'none' : 120, whiteSpace: 'nowrap', overflow: isMobile ? 'visible' : 'hidden', textOverflow: isMobile ? 'clip' : 'ellipsis', borderColor: COLORS.border, color: COLORS.secondaryDark, fontWeight: 700, fontFamily: FONTS.body }} title={`S/ ${formatPrice(row.precio_unitario)}`}>S/ {formatPrice(row.precio_unitario)}</td>
                <td className="px-4 py-2 font-body text-right cart-mobile-price cart-mobile-price-cell cart-mobile-subtotal-cell" style={{ maxWidth: isMobile ? 'none' : 120, whiteSpace: 'nowrap', overflow: isMobile ? 'visible' : 'hidden', textOverflow: isMobile ? 'clip' : 'ellipsis', borderColor: COLORS.border, color: COLORS.secondaryDark, fontWeight: 700, fontFamily: FONTS.body }} title={`S/ ${formatPrice(row.subtotal)}`}>S/ {formatPrice(row.subtotal)}</td>
              </tr>
            ))}
            <tr style={{ background: 'linear-gradient(90deg, #ffffff 0%, #f6f8fa 30%, #d1d5db 100%)' }}>
              <td colSpan={isMobile ? 2 : 7} className="px-4 py-2 text-right font-heading cart-mobile-total-value" style={{ whiteSpace: 'nowrap', fontWeight: 600, fontFamily: FONTS.heading, color: COLORS.secondaryDark, borderTop: '2px solid #d1d5db' }}>SUBTOTAL</td>
              <td className="px-4 py-2 text-right font-heading cart-mobile-total-value" style={{ whiteSpace: 'nowrap', minWidth: isMobile ? 0 : 160, fontWeight: 600, fontFamily: FONTS.heading, color: COLORS.black, borderTop: '2px solid #d1d5db' }}>S/ {formatPrice(subtotalSinIgv)}</td>
            </tr>
            <tr style={{ background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 55%, #eef2f7 100%)' }}>
              <td colSpan={isMobile ? 2 : 7} className="px-4 py-2 text-right font-heading cart-mobile-total-value" style={{ whiteSpace: 'nowrap', fontWeight: 600, fontFamily: FONTS.heading, color: COLORS.secondaryDark }}>IGV (18%)</td>
              <td className="px-4 py-2 text-right font-heading" style={{ whiteSpace: 'nowrap', minWidth: isMobile ? 0 : 160, fontWeight: 600, fontFamily: FONTS.heading, color: COLORS.black }}>S/ {formatPrice(igv)}</td>
            </tr>
            <tr style={{ background: 'linear-gradient(90deg, #ffffff 0%, #f3f6f9 30%, #d1d5db 100%)' }}>
              <td colSpan={isMobile ? 2 : 7} className="px-4 py-2 text-right font-heading" style={{ whiteSpace: 'nowrap', fontWeight: 800, fontFamily: FONTS.heading, color: COLORS.secondaryDark }}>TOTAL</td>
              <td className="px-4 py-2 text-right font-heading" style={{ whiteSpace: 'nowrap', minWidth: isMobile ? 0 : 160, fontWeight: 700, fontFamily: FONTS.heading, color: COLORS.black }}>S/ {formatPrice(totalBruto)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {showCortesDrawer && corteEnEdicion && (
        <CortesDrawer
          producto={{ ...corteEnEdicion, precio_unitario: corteEnEdicion.precio_m2 ?? corteEnEdicion.precio_unitario }}
          costoCorte={costoCorte}
          initialCortes={corteEnEdicion.cortes}
          initialTotal={null}
          confirmLabel="Guardar medidas"
          onConfirm={guardarCortesEditados}
          onClose={cerrarEditorDeCortes}
        />
      )}

      {ENABLE_MERCADO_PAGO && showCardForm && (
        <div
          onClick={() => { if (!cardFormLoading) { setShowCardForm(false); setLoading(false); } }}
          style={{ position: 'fixed', top: isMobile ? 62 : 86, right: 0, bottom: 0, left: 0, zIndex: 80, background: 'rgba(15,23,42,0.22)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: isMobile ? '8px' : '16px', overflowY: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(1160px, 100%)', maxHeight: isMobile ? 'calc(100vh - 72px)' : 'calc(100vh - 110px)', overflow: 'hidden', borderRadius: isMobile ? 14 : 24, border: '1px solid rgba(199,228,240,0.85)', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,249,255,0.98))', boxShadow: '0 24px 48px rgba(15,23,42,0.18)', display: 'flex', flexDirection: 'column', animation: 'cartPaymentIn .24s ease' }}
          >
            <style>{`@keyframes cartPaymentIn { 0% { opacity: 0; transform: translateY(-14px) scale(.985); } 100% { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
            <div style={{ padding: isMobile ? '10px 12px' : '14px 20px', background: 'linear-gradient(135deg, #3ab4d6 0%, #5ecae8 55%, #82daf5 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontFamily: FONTS.heading, fontSize: isMobile ? 16 : 20, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 10, color: '#ffffff', letterSpacing: 0.3 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <IconCreditCard size={18} stroke={1.8} color="#a8d4f0" />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.4 }}>Pago seguro</div>
                  <div style={{ fontSize: 11, opacity: 0.62, fontFamily: FONTS.body, fontWeight: 400, marginTop: 1 }}>Ingresa los datos de tu tarjeta</div>
                </div>
              </div>
              <button
                onClick={() => { setShowCardForm(false); setLoading(false); }}
                style={{ background: 'rgba(255,255,255,0.09)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: isMobile ? '6px 10px' : '7px 14px', fontFamily: FONTS.heading, fontSize: isMobile ? 12 : 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.18s', fontWeight: 600 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,64,64,0.72)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
              >
                <IconX size={15} stroke={2.2} /> Cerrar
              </button>
            </div>
            <div style={{ padding: isMobile ? 8 : 14, overflowY: 'auto' }}>
              <MercadoPagoCardForm
                carritoId={carritoId}
                clienteId={localStorage.getItem('cliente_id')}
                total={totalBruto}
                items={carritoLocal}
                onPaymentSuccess={procesarPagoExitoso}
                onPaymentError={(error) => { console.log('[CARRITO] Error en pago:', error); setMensaje(`Error: ${error}`); }}
                onLoading={(isLoading) => setCardFormLoading(isLoading)}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ✅ FIX: Botón con hover real usando onMouseEnter/onMouseLeave
              — garantiza que los efectos funcionen en cualquier hosting
              sin depender de clases CSS que puedan ser purgadas.
          ===================================================================== */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={realizarPedido}
          className="font-heading"
          disabled={loading || cardFormLoading}
          onMouseEnter={(e) => {
            if (!loading && !cardFormLoading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 18px 32px rgba(148,25,24,0.34)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 10px 22px rgba(148,25,24,0.26)';
            e.currentTarget.style.filter = 'none';
          }}
          onMouseDown={(e) => {
            if (!loading && !cardFormLoading) {
              e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(148,25,24,0.18)';
              e.currentTarget.style.filter = 'brightness(0.95)';
            }
          }}
          onMouseUp={(e) => {
            if (!loading && !cardFormLoading) {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 10px 22px rgba(148,25,24,0.26)';
              e.currentTarget.style.filter = 'none';
            }
          }}
          style={{
            background: loading || cardFormLoading
              ? '#94a3b8'
              : 'linear-gradient(120deg, #941918 0%, #c94543 100%)',
            color: '#fff',
            padding: '13px 36px',
            border: 'none',
            borderRadius: 10,
            fontWeight: 'bold',
            fontSize: 18,
            fontFamily: FONTS.heading,
            boxShadow: '0 10px 22px rgba(148,25,24,0.26)',
            cursor: loading || cardFormLoading ? 'not-allowed' : 'pointer',
            letterSpacing: 1,
            transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease, background 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'center',
            opacity: loading || cardFormLoading ? 0.75 : 1,
            minWidth: 240,
          }}
        >
          {loading && (
            <svg
              style={{ width: 20, height: 20, animation: 'spin 0.85s linear infinite', flexShrink: 0 }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {loading ? 'Procesando...' : (ENABLE_MERCADO_PAGO ? 'REALIZAR PEDIDO' : 'CONTINUAR A COMPROBANTE')}
        </button>

        {facturacionProductos.length > 0 && !showFacturacionModal && (
          <button
            type="button"
            onClick={() => setShowFacturacionModal(true)}
            style={{ marginTop: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid #0d9488', background: '#0f766e', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: FONTS.heading }}
          >
            Generar comprobante
          </button>
        )}
      </div>

      {showFacturacionModal && (
        <ModalFacturacion
          productos={facturacionProductos.length > 0 ? facturacionProductos : construirProductosFacturacion(carritoLocal)}
          registroPagoId={registroPagoPendienteId}
          onComprobanteGenerado={async () => {
            const okSeguimiento = await registrarCompraParaSeguimiento();
            if (!okSeguimiento) { showToast('Se generó el comprobante, pero no se pudo registrar el seguimiento.', 'payment-info'); return; }
            marcarFacturacionCompletada();
            showToast('Compra registrada y carrito limpiado correctamente.', 'update');
          }}
          onClose={() => {
            limpiarFacturacionPendiente();
            localStorage.removeItem('carrito_id');
            clearCart();
            setCarritoId(null);
            setMensaje('');
            setTimeout(() => navigate('/panelcliente', { replace: true }), 300);
          }}
        />
      )}
    </div>
  );
};

export default Carrito;