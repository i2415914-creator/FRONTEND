import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COLORS, FONTS } from '../../colors';
import { IconAlarm, IconDownload, IconExclamationMark, IconMail, IconMapPin, IconNotes, IconPencil, IconSquareAsterisk, IconUserFilled } from '@tabler/icons-react';
import QRCodeLib from 'qrcode';

const WATERMARK_LOGO = '/LOGO.svg';
const TEMP_ACCESS_STORAGE_PREFIX = 'venta_servicio_temp_access:';

const AnimatedSelect = ({ name, value, options, onChange, shellStyle, buttonStyle, menuZIndex = 20, onOpenChange, menuMaxHeight = 180, prefixIcon = null }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onOpenChange]);

  const normalizedOptions = options.map((option) => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    return option;
  });

  const currentOption = normalizedOptions.find((option) => option.value === value) || normalizedOptions[0];

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (onOpenChange) onOpenChange(next);
  };

  const handleSelect = (nextValue) => {
    onChange({ target: { name, value: nextValue } });
    setOpen(false);
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <div ref={wrapperRef} style={{ ...shellStyle, zIndex: open ? menuZIndex : 'auto' }}>
      <button
        type="button"
        onClick={toggleOpen}
        style={{
          ...buttonStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {prefixIcon && (
            <span style={{ color: '#5b7f98', opacity: 0.95, display: 'inline-flex', alignItems: 'center' }}>
              {prefixIcon}
            </span>
          )}
          <span>{currentOption?.label || ''}</span>
        </span>
        <span
          style={{
            fontSize: 12,
            color: '#29465e',
            transition: 'transform 0.22s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid #c6d8e4',
          boxShadow: '0 14px 26px rgba(32, 91, 127, 0.18)',
          overflow: 'hidden',
          overflowY: open ? 'auto' : 'hidden',
          transformOrigin: 'top center',
          transition: 'opacity 0.22s ease, transform 0.22s ease, max-height 0.22s ease',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scaleY(1)' : 'translateY(-8px) scaleY(0.92)',
          maxHeight: open ? menuMaxHeight : 0,
          pointerEvents: open ? 'auto' : 'none',
          scrollbarWidth: 'thin',
        }}
      >
        {normalizedOptions.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '9px 14px',
                border: 'none',
                borderBottom: '1px solid rgba(190, 208, 222, 0.45)',
                background: selected ? 'linear-gradient(90deg, #1f6dbf, #2f80d1)' : '#ffffff',
                color: selected ? '#ffffff' : '#223447',
                fontFamily: FONTS.body,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 0.18s ease, color 0.18s ease, padding-left 0.18s ease',
              }}
              onMouseEnter={(event) => {
                if (!selected) {
                  event.currentTarget.style.background = '#edf7fd';
                  event.currentTarget.style.paddingLeft = '18px';
                }
              }}
              onMouseLeave={(event) => {
                if (!selected) {
                  event.currentTarget.style.background = '#ffffff';
                  event.currentTarget.style.paddingLeft = '14px';
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ModalFacturacion = ({ productos, onClose, onComprobanteGenerado, deferRegistroPago = false, clienteActual = null, autoCloseOnComprobante = false, registroPagoId = null }) => {
  const COSTO_CORTE = 10;
  const [productosLocales] = useState(
    Array.isArray(productos) ? [...productos] : []
  );
  const [form, setForm] = useState({
    tipo_comprobante: 'boleta',
    nombre: '',
    documento: '',
    direccion: '',
    provincia: 'Huancayo',
    departamento: 'Junín',
    distrito: 'Huancayo',
    ubigeo: '120101',
    correo: ''
  });
  
  const [departamentos, setDepartamentos] = useState(['Junín']);
  const [provinciasDisponibles, setProvinciasDisponibles] = useState(['Huancayo']);
  const [distritosDisponibles, setDistritosDisponibles] = useState(['Huancayo']);
  const [ubigeoData, setUbigeoData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [comprobanteEmitido, setComprobanteEmitido] = useState(false);
  const [error, setError] = useState('');
  const [formNotice, setFormNotice] = useState({ text: '', field: '' });
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [pdfGeneradoBase64, setPdfGeneradoBase64] = useState('');
  const [pdfNombreArchivo, setPdfNombreArchivo] = useState('comprobante.pdf');
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [documentosSesion, setDocumentosSesion] = useState({ dni: '', ruc: '', actual: '' });
  const [layoutInsets, setLayoutInsets] = useState({ top: 64, bottom: 0 });
  const [activeSelect, setActiveSelect] = useState('');
  const [showOpeningNotice, setShowOpeningNotice] = useState(true);
  const [openingNoticeLeaving, setOpeningNoticeLeaving] = useState(false);
  const [accesoTemporalServicio, setAccesoTemporalServicio] = useState(null);
  const [accesoTemporalStorageKey, setAccesoTemporalStorageKey] = useState('');
  const [modalCredenciales, setModalCredenciales] = useState(null);
  const [credencialParaImprimir, setCredencialParaImprimir] = useState(null);
  const emisionEnCursoRef = useRef(false);

  const isMobile = viewportWidth < 768;

  useEffect(() => {
    const soloDigitos = (valor) => String(valor || '').replace(/\D/g, '');
    const normalizarNombre = (valor) => {
      let texto = String(valor || '').trim();
      texto = texto.replace(/^\d{8,11}\s*[-:|]\s*/i, '');
      return texto.trim();
    };
    const normalizarCorreo = (valor) => String(valor || '').trim();
    const tipoPorDocumento = (doc) => (doc.length === 11 ? 'factura' : 'boleta');
    const generarCorreoTemporalDesdeNombre = (nombre) => {
      const base = String(nombre || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .trim()
        .replace(/\s+/g, '');
      const localPart = base || 'cliente';
      return `${localPart}@vidriobras.com`;
    };

    const cargarClienteSesion = async () => {
      const nombreActual = normalizarNombre(clienteActual?.nombre);
      const documentoActual = soloDigitos(clienteActual?.documento);
      const correoActual = normalizarCorreo(clienteActual?.correo) || generarCorreoTemporalDesdeNombre(nombreActual);

      let nombre = nombreActual || normalizarNombre(localStorage.getItem('cliente_nombre'));
      let correo = correoActual || normalizarCorreo(localStorage.getItem('cliente_correo'));
      let documento = documentoActual || soloDigitos(localStorage.getItem('cliente_documento'));

      const token = localStorage.getItem('auth_token');
      const necesitaPerfil = !nombreActual || !correoActual || !documentoActual;
      if (token && necesitaPerfil) {
        try {
          const res = await fetch('/api/clientes/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data?.success && data?.cliente) {
            if (!nombreActual) {
              nombre = normalizarNombre(data.cliente.nombre) || nombre;
            }
            if (!correoActual) {
              correo = normalizarCorreo(data.cliente.correo) || correo;
            }
            if (!documentoActual) {
              documento = soloDigitos(data.cliente.documento) || documento;
            }
          }
        } catch {
          // Si falla el perfil, conservamos datos de sesión local.
        }
      }

      const docs = {
        dni: documento.length === 8 ? documento : '',
        ruc: documento.length === 11 ? documento : '',
        actual: documento,
      };
      setDocumentosSesion(docs);

      setForm((prev) => {
        const tipo = documento ? tipoPorDocumento(documento) : prev.tipo_comprobante;
        return {
          ...prev,
          tipo_comprobante: tipo,
          nombre: nombre || '',
          correo: correo || '',
          documento: documento || '',
        };
      });
    };

    cargarClienteSesion();
  }, [clienteActual?.nombre, clienteActual?.documento, clienteActual?.correo]);

  useEffect(() => {
    const cargarUbigeos = async () => {
      try {
        const res = await fetch('/api/ubigeos/obtener');
        const data = await res.json();
        if (data.success && data.data) {
          setUbigeoData(data.data);
          const defaults = data.data.defaults || {};
          const departamentosApi = data.data.departamentos || ['Junín'];
          const departamentoInicial = defaults.departamento || departamentosApi[0] || 'Junín';
          const provinciasJunin = data.data.provincias_por_departamento?.[departamentoInicial] || ['Huancayo'];
          const provinciaInicial = defaults.provincia || provinciasJunin[0] || 'Huancayo';
          const distritosIni = data.data.distritos_por_provincia?.[provinciaInicial] || ['Huancayo'];
          const distritoInicial = defaults.distrito || distritosIni[0] || 'Huancayo';
          const ubigeoInicial = defaults.ubigeo || data.data.ubigeos?.[`${departamentoInicial}|${provinciaInicial}|${distritoInicial}`] || '120101';

          setDepartamentos(departamentosApi);
          setProvinciasDisponibles(provinciasJunin);
          setDistritosDisponibles(distritosIni);
          setForm((prev) => ({
            ...prev,
            departamento: departamentoInicial,
            provincia: provinciaInicial,
            distrito: distritoInicial,
            ubigeo: ubigeoInicial,
          }));
        }
      } catch {
        // Conservamos los defaults mínimos hasta que el backend responda.
      }
    };
    cargarUbigeos();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const actualizarInsets = () => {
      const navbar = document.querySelector('nav');
      const footer = document.querySelector('footer');
      const top = navbar ? Math.ceil(navbar.getBoundingClientRect().height) : (isMobile ? 64 : 72);
      const bottom = footer ? Math.ceil(footer.getBoundingClientRect().height) : 0;
      setLayoutInsets({ top, bottom });
    };

    actualizarInsets();
    window.addEventListener('resize', actualizarInsets);
    window.addEventListener('scroll', actualizarInsets);

    return () => {
      window.removeEventListener('resize', actualizarInsets);
      window.removeEventListener('scroll', actualizarInsets);
    };
  }, [isMobile]);

  useEffect(() => {
    const hideDelayMs = 10000;
    const exitAnimMs = 260;

    const hideTimer = setTimeout(() => {
      setOpeningNoticeLeaving(true);
    }, hideDelayMs);

    const removeTimer = setTimeout(() => {
      setShowOpeningNotice(false);
      setOpeningNoticeLeaving(false);
    }, hideDelayMs + exitAnimMs);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    const doc = String(form.documento || clienteActual?.documento || '').replace(/\D/g, '');
    const correo = String(form.correo || clienteActual?.correo || '').trim().toLowerCase();

    try {
      if (doc) {
        const key = `${TEMP_ACCESS_STORAGE_PREFIX}${doc}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          setAccesoTemporalServicio(parsed);
          setAccesoTemporalStorageKey(key);
          return;
        }
      }

      if (correo) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || '';
          if (!key.startsWith(TEMP_ACCESS_STORAGE_PREFIX)) continue;
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            const correoGuardado = String(parsed?.correo || '').trim().toLowerCase();
            if (correoGuardado && correoGuardado === correo) {
              setAccesoTemporalServicio(parsed);
              setAccesoTemporalStorageKey(key);
              return;
            }
          } catch {
            // Ignorar entradas corruptas.
          }
        }
      }

      setAccesoTemporalServicio(null);
      setAccesoTemporalStorageKey('');
    } catch {
      setAccesoTemporalServicio(null);
      setAccesoTemporalStorageKey('');
    }
  }, [clienteActual?.documento, clienteActual?.correo, form.documento, form.correo]);

  useEffect(() => {
    if (accesoTemporalServicio?.jwt_temporal) return;
    const clienteId = String(clienteActual?.cliente_id || '').trim();
    if (!clienteId) return;

    let cancelado = false;
    const cargarAccesoTemporalBackend = async () => {
      try {
        const res = await fetch(`/api/clientes/temp-access/${clienteId}`);
        const data = await res.json();
        if (!res.ok || !data?.success || !data?.data) return;
        if (cancelado) return;
        setAccesoTemporalServicio(data.data);
      } catch {
        // Si falla, mantenemos el flujo sin bloquear el comprobante.
      }
    };

    cargarAccesoTemporalBackend();
    return () => { cancelado = true; };
  }, [accesoTemporalServicio?.jwt_temporal, clienteActual?.cliente_id]);

  useEffect(() => {
    const onAfterPrint = () => setCredencialParaImprimir(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  const productosJson = useMemo(() => {
    const safeProductos = Array.isArray(productosLocales) ? productosLocales : [];
    return JSON.stringify(safeProductos, null, 2);
  }, [productosLocales]);

  const resolverUbigeo = (departamento, provincia, distrito) => {
    return ubigeoData?.ubigeos?.[`${departamento}|${provincia}|${distrito}`] || form.ubigeo || '120101';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (formNotice.text) setFormNotice({ text: '', field: '' });
    
    if (name === 'tipo_comprobante') {
      setForm((prev) => {
        return {
          ...prev,
          [name]: value,
          documento: value === 'factura' ? '' : (documentosSesion.dni || prev.documento),
        };
      });
    }
    else if (name === 'departamento') {
      const srcProvincias = ubigeoData?.provincias_por_departamento || {};
      const srcDistritos = ubigeoData?.distritos_por_provincia || {};
      const nuevasProvincias = srcProvincias[value] || [];
      const nuevaProvincia = nuevasProvincias[0] || value;
      const nuevosDistritos = srcDistritos[nuevaProvincia] || [];
      const nuevoDistrito = nuevosDistritos[0] || nuevaProvincia;
      const nuevoUbigeo = resolverUbigeo(value, nuevaProvincia, nuevoDistrito);
      
      setProvinciasDisponibles(nuevasProvincias);
      setDistritosDisponibles(nuevosDistritos);
      
      setForm((prev) => ({ 
        ...prev, 
        [name]: value,
        provincia: nuevaProvincia,
        distrito: nuevoDistrito,
        ubigeo: nuevoUbigeo
      }));
    } 
    else if (name === 'provincia') {
      const srcDistritos = ubigeoData?.distritos_por_provincia || {};
      const nuevosDistritos = srcDistritos[value] || [];
      const nuevoDistrito = nuevosDistritos[0] || value;
      const nuevoUbigeo = resolverUbigeo(form.departamento, value, nuevoDistrito);
      
      setDistritosDisponibles(nuevosDistritos);
      setForm((prev) => ({ ...prev, [name]: value, distrito: nuevoDistrito, ubigeo: nuevoUbigeo }));
    }
    else if (name === 'distrito') {
      const nuevoUbigeo = resolverUbigeo(form.departamento, form.provincia, value);
      setForm((prev) => ({ ...prev, [name]: value, ubigeo: nuevoUbigeo }));
    }
    else if (name === 'documento') {
      const limpio = String(value || '').replace(/\D/g, '');
      setForm((prev) => ({ ...prev, [name]: limpio }));
      setDocumentosSesion((prev) => ({
        dni: limpio.length === 8 ? limpio : prev.dni,
        ruc: limpio.length === 11 ? limpio : prev.ruc,
        actual: limpio,
      }));
    }
    else if (name === 'nombre') {
      const limpio = String(value || '').replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
      setForm((prev) => ({ ...prev, [name]: limpio }));
    } 
    else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calcularTotales = () => {
    const safeProductos = Array.isArray(productosLocales) ? productosLocales : [];

    const calcularTotalProducto = (producto) => {
      if (producto?.subtotal != null && producto?.subtotal !== '') {
        return Number(producto.subtotal || 0);
      }

      if (producto?.tipo_producto === 'CORTE' && Array.isArray(producto?.cortes_detalles)) {
        const precioBase = Number(producto?.precio_unitario || 0);
        const esAluminio = String(producto?.categoria || '').toUpperCase().includes('ALUMIN');
        const total = producto.cortes_detalles.reduce((sum, corte) => {
          const cantidad = Number(corte?.cantidad || 1);
          const ancho = Number(corte?.ancho ?? corte?.ancho_cm ?? 0);
          const alto = Number(corte?.alto ?? corte?.alto_cm ?? 0);

          if (esAluminio) {
            const longitudCm = ancho > 0 ? ancho : alto;
            if (longitudCm <= 0) return sum;
            return sum + (((longitudCm / 100) * precioBase) + COSTO_CORTE) * cantidad;
          }

          if (ancho <= 0 || alto <= 0) return sum;
          return sum + ((((ancho * alto) / 10000) * precioBase) + COSTO_CORTE) * cantidad;
        }, 0);
        return Number(total.toFixed(2));
      }

      const cantidad = Number(producto?.cantidad || 1);
      const precio = Number(producto?.precio_unitario || 0);
      return cantidad * precio;
    };

    const total = safeProductos.reduce((acc, p) => {
      return acc + calcularTotalProducto(p);
    }, 0);
    const subtotal = Number((total / 1.18).toFixed(2));
    const igv = Number((total - subtotal).toFixed(2));
    return { subtotal, igv, total: Number(total.toFixed(2)) };
  };

  const totales = calcularTotales();
  const fechaVisual = useMemo(
    () => new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    []
  );

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontWeight: 700,
    fontFamily: FONTS.heading,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#1f4968',
  };

  const inputWithIconWrapStyle = {
    position: 'relative',
  };

  const inputIconStyle = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#5b7f98',
    opacity: 0.95,
    pointerEvents: 'none',
  };

  const fieldStyle = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #b8c9d6',
    borderRadius: 8,
    fontFamily: FONTS.body,
    fontSize: 14,
    background: '#fbfdff',
    color: '#223447',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const buttonCompact = loading || comprobanteEmitido;

  const getSelectShellStyle = (fieldName) => ({
    position: 'relative',
    transition: 'transform 0.24s ease, box-shadow 0.24s ease, filter 0.24s ease',
    transform: activeSelect === fieldName ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
    filter: activeSelect === fieldName ? 'brightness(1.015)' : 'brightness(1)',
    boxShadow: activeSelect === fieldName ? '0 8px 18px rgba(56, 127, 167, 0.14)' : 'none',
    borderRadius: 8,
  });

  const emitirComprobante = async (e) => {
    e.preventDefault();
    if (loading || comprobanteEmitido || emisionEnCursoRef.current) return;

    const mostrarAviso = (field, text) => {
      setFormNotice({ field, text });
    };

    const nombreLimpio = String(form.nombre || '').trim();
    const doc = String(form.documento || '').trim();
    const correo = String(form.correo || '').trim();
    const direccion = String(form.direccion || '').trim();

    if (!nombreLimpio) {
      mostrarAviso('nombre', 'Completa este campo');
      return;
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(nombreLimpio)) {
      mostrarAviso('nombre', 'El nombre solo debe contener letras.');
      return;
    }

    if (!doc) {
      mostrarAviso('documento', 'Completa este campo');
      return;
    }

    if (form.tipo_comprobante === 'boleta' && doc.length !== 8) {
      mostrarAviso('documento', 'El DNI debe tener 8 dígitos.');
      return;
    }

    if (form.tipo_comprobante === 'factura' && doc.length !== 11) {
      mostrarAviso('documento', 'El RUC debe tener 11 dígitos.');
      return;
    }

    if (!correo) {
      mostrarAviso('correo', 'Completa este campo');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      mostrarAviso('correo', 'Ingresa un correo válido.');
      return;
    }

    if (!direccion) {
      mostrarAviso('direccion', 'Completa este campo');
      return;
    }

    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñÜü]/.test(direccion)) {
      mostrarAviso('direccion', 'Ingresa una dirección válida (no solo números).');
      return;
    }

    if (!form.departamento || !form.provincia || !form.distrito || !form.ubigeo) {
      mostrarAviso('ubicacion', 'Completa la ubicación');
      return;
    }

    emisionEnCursoRef.current = true;
    setLoading(true);
    setFormNotice({ text: '', field: '' });
    setError('');
    setResultado(null);
    setMensaje('');
    setPdfGeneradoBase64('');

    try {
      const totales = calcularTotales();
      const productosPayload = (Array.isArray(productosLocales) ? productosLocales : []).map((producto) => {
        const esAluminio = String(producto?.categoria || '').toUpperCase().includes('ALUMIN');
        const cantidadCalculada = Number(
          producto?.cantidad_total_piezas ||
          producto?.cantidad ||
          (Array.isArray(producto?.cortes_detalles)
            ? producto.cortes_detalles.reduce((sum, corte) => sum + Number(corte?.cantidad || 1), 0)
            : 1)
        ) || 1;

        const subtotalCalculado = producto?.subtotal != null && producto?.subtotal !== ''
          ? Number(producto.subtotal || 0)
          : Number((cantidadCalculada * Number(producto?.precio_unitario || 0)).toFixed(2));

        const descripcionCortes = Array.isArray(producto?.cortes_detalles)
          ? producto.cortes_detalles.map((corte, index) => {
              const cantidad = Number(corte?.cantidad || 1);
              const ancho = Number(corte?.ancho ?? corte?.ancho_cm ?? 0);
              const alto = Number(corte?.alto ?? corte?.alto_cm ?? 0);
              const medida = esAluminio
                ? `${ancho > 0 ? ancho : alto} cm`
                : `${ancho} x ${alto} cm`;
              return `${index + 1}. ${medida} x${cantidad}`;
            }).join(' | ')
          : '';

        return {
          ...producto,
          cantidad: cantidadCalculada,
          precio_unitario: Number((subtotalCalculado / Math.max(cantidadCalculada, 1)).toFixed(2)),
          subtotal: subtotalCalculado,
          descripcion: producto?.descripcion || descripcionCortes || producto?.nombre || 'Producto VIDRIOBRAS'
        };
      });

      const payload = {
        cliente_data: {
          nombre: form.nombre,
          documento: form.documento,
          direccion: form.direccion,
          provincia: form.provincia,
          departamento: form.departamento,
          distrito: form.distrito,
          ubigeo: form.ubigeo,
          correo: form.correo
        },
        productos: productosPayload,
        totales
      };

      const response = await fetch('/api/facturacion/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Error al generar el comprobante');
        return;
      }

      const accesoTemporal = !deferRegistroPago ? accesoTemporalServicio : null;

      setResultado(data.data);
      setComprobanteEmitido(true);
      if (typeof onComprobanteGenerado === 'function') {
        onComprobanteGenerado(data.data);
      }
      if (!deferRegistroPago) {
        await generarPdf(data.data, {
          autoDownload: true,
          manageLoading: false,
          authToken: accesoTemporal?.jwt_temporal || null,
        });
        setMensaje('Comprobante generado, PDF guardado y descargado automáticamente.');
      } else {
        setMensaje('Comprobante generado correctamente.');
      }

      if (accesoTemporal?.jwt_temporal) {
        await mostrarAccesoTemporal(accesoTemporal);
        limpiarAccesoTemporalServicio(accesoTemporal.documento || form.documento);
        setAccesoTemporalServicio(null);
      }

      if (autoCloseOnComprobante && !accesoTemporal?.jwt_temporal && typeof onClose === 'function') {
        setTimeout(() => {
          onClose();
        }, 250);
      }
    } catch (err) {
      setError(`Error: ${err.message || err}`);
    } finally {
      emisionEnCursoRef.current = false;
      setLoading(false);
    }
  };

  const descargarXml = () => {
    if (!resultado?.xml) return;
    const blob = new Blob([resultado.xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resultado.serie}-${resultado.correlativo}.xml`;
    link.click();
  };

  const descargarPdfDesdeBase64 = (base64Pdf, fileName) => {
    if (!base64Pdf) return;
    const binaryString = atob(base64Pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const descargarPdfDirectoDelComprobante = (comprobanteData) => {
    const pdfBase64 = comprobanteData?.pdf || comprobanteData?.payload?.pdf || '';
    if (!pdfBase64) return false;
    const fileName = `${comprobanteData?.serie || 'comprobante'}-${comprobanteData?.correlativo || 'emitido'}.pdf`;
    setPdfGeneradoBase64(pdfBase64);
    setPdfNombreArchivo(fileName);
    descargarPdfDesdeBase64(pdfBase64, fileName);
    return true;
  };

  const generarPdfDesdePayloadComprobante = async (comprobanteData) => {
    const payload = comprobanteData?.payload;
    if (!payload) return false;

    try {
      const response = await fetch('/api/facturacion/generar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data?.success || !data?.pdf) return false;

      const fileName = `${comprobanteData?.serie || 'comprobante'}-${comprobanteData?.correlativo || 'emitido'}.pdf`;
      setPdfGeneradoBase64(data.pdf);
      setPdfNombreArchivo(fileName);
      descargarPdfDesdeBase64(data.pdf, fileName);
      return true;
    } catch {
      return false;
    }
  };

  const limpiarAccesoTemporalServicio = (documento) => {
    const keyPorStorage = String(accesoTemporalStorageKey || '').trim();
    const doc = String(documento || form.documento || '').replace(/\D/g, '');
    const keyPorDocumento = doc ? `${TEMP_ACCESS_STORAGE_PREFIX}${doc}` : '';
    const key = keyPorStorage || keyPorDocumento;
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignorar errores de storage.
    }
  };

  const imprimirCredenciales = (credenciales) => {
    if (!credenciales) return;
    setCredencialParaImprimir(credenciales);
    setTimeout(() => window.print(), 140);
  };

  const mostrarAccesoTemporal = async (acceso) => {
    if (!acceso?.jwt_temporal) return;
    const qrUrl = `${window.location.origin}/acceso?t=${acceso.jwt_temporal}`;
    const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#941918', light: '#ffffff' },
    });
    setModalCredenciales({
      ...acceso,
      qrUrl,
      qrDataUrl,
    });
  };

  const cerrarCredenciales = () => {
    setModalCredenciales(null);
    if (autoCloseOnComprobante && typeof onClose === 'function') {
      onClose();
    }
  };

  const generarPdf = async (comprobanteData = resultado, opts = {}) => {
    const { autoDownload = false, manageLoading = true, authToken = null } = opts;

    if (!comprobanteData?.payload) {
      alert('No hay payload disponible para generar PDF');
      return;
    }

    try {
      if (manageLoading) setLoading(true);
      const token = authToken || accesoTemporalServicio?.jwt_temporal || localStorage.getItem('auth_token');
      if (!token) {
        const descargado = descargarPdfDirectoDelComprobante(comprobanteData);
        if (descargado) {
          setMensaje('Comprobante generado y descargado. No se pudo registrar en el historial porque no hay sesion activa.');
          return true;
        }
        const generadoPorPayload = await generarPdfDesdePayloadComprobante(comprobanteData);
        if (generadoPorPayload) {
          setMensaje('Comprobante generado y descargado. No se pudo registrar en el historial porque no hay sesion activa.');
          return true;
        }
        alert('No hay sesion activa para registrar el comprobante');
        return false;
      }

      const totalComprobante = calcularTotales().total;
      const tipoReal = String(comprobanteData?.tipo || form.tipo_comprobante || 'boleta').toLowerCase();
      const tipoComprobante = tipoReal.includes('factura') ? 'factura' : 'boleta';

      const response = await fetch('/api/registro-pago/guardar-comprobante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payload: comprobanteData.payload,
          tipo_comprobante: tipoComprobante,
          monto: totalComprobante,
          registro_pago_id: registroPagoId,
          serie: comprobanteData.serie,
          correlativo: comprobanteData.correlativo
        })
      });
      const data = await response.json();

      if (!data.success) {
        const descargado = descargarPdfDirectoDelComprobante(comprobanteData);
        if (descargado) {
          setMensaje(`Comprobante generado y descargado. No se pudo registrar en el historial: ${data.message || 'Error'}`);
          return true;
        }
        const generadoPorPayload = await generarPdfDesdePayloadComprobante(comprobanteData);
        if (generadoPorPayload) {
          setMensaje(`Comprobante generado y descargado. No se pudo registrar en el historial: ${data.message || 'Error'}`);
          return true;
        }
        alert(`Error generando PDF: ${data.message || 'Error'}`);
        return false;
      }

      const pdfBase64 = data?.data?.pdf;
      if (!pdfBase64) {
        alert('No se recibio el PDF para descargar');
        return;
      }

      const fileName = `${comprobanteData.serie}-${comprobanteData.correlativo}.pdf`;
      setPdfGeneradoBase64(pdfBase64);
      setPdfNombreArchivo(fileName);
      if (autoDownload) {
        descargarPdfDesdeBase64(pdfBase64, fileName);
      }

      if (data?.data?.documento_url) {
        setMensaje(`Comprobante guardado en storage: ${data.data.documento_url}`);
      }
      return true;
    } catch (err) {
      const descargado = descargarPdfDirectoDelComprobante(comprobanteData);
      if (descargado) {
        setMensaje(`Comprobante generado y descargado. No se pudo registrar en el historial: ${err.message || err}`);
        return true;
      }
      const generadoPorPayload = await generarPdfDesdePayloadComprobante(comprobanteData);
      if (generadoPorPayload) {
        setMensaje(`Comprobante generado y descargado. No se pudo registrar en el historial: ${err.message || err}`);
        return true;
      }
      alert(`Error: ${err.message || err}`);
      return false;
    } finally {
      if (manageLoading) setLoading(false);
    }
  };

  const documentLabel = form.tipo_comprobante === 'factura' ? 'RUC' : 'DNI';

  const renderFieldNotice = (field) => {
    if (formNotice.field !== field || !formNotice.text) return null;
    return (
      <div
        style={{
          marginTop: 8,
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 13px',
          borderRadius: 10,
          border: '1px solid rgba(128,194,220,0.55)',
          background: 'linear-gradient(135deg, rgba(0,20,50,0.97), rgba(0,35,70,0.99))',
          boxShadow: '0 0 22px rgba(128,194,220,0.25), 0 4px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(128,194,220,0.15)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          animation: 'lb-tooltip-in 0.18s ease-out',
          fontFamily: FONTS.body,
          fontSize: 11.5,
          fontWeight: 600,
          color: 'rgba(200,235,255,0.95)',
          letterSpacing: '0.02em',
        }}
      >
        <span style={{
          content: '""',
          position: 'absolute',
          top: -6,
          left: 20,
          width: 10,
          height: 10,
          transform: 'rotate(45deg)',
          background: 'rgba(0,35,70,0.99)',
          borderLeft: '1px solid rgba(128,194,220,0.55)',
          borderTop: '1px solid rgba(128,194,220,0.55)',
        }} />
        <span style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #80C2DC, #4fa8cc)',
          color: '#001428',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(128,194,220,0.6)',
          fontSize: 10,
          fontFamily: FONTS.heading,
          fontWeight: 900,
        }}>!</span>
        <span>{formNotice.text}</span>
      </div>
    );
  };

  // ─── KEYFRAMES (shared styles) ──────────────────────────────────────────────
  const sharedStyles = `
    @keyframes voucherIn {
      0% { opacity: 0; transform: translateY(24px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fadeOverlay {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes loadingPulse {
      0% { filter: brightness(1); }
      50% { filter: brightness(1.08); }
      100% { filter: brightness(1); }
    }
    @keyframes sheenSweep {
      0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
      20% { opacity: 0.08; }
      50% { opacity: 0.13; }
      100% { transform: translateX(180%) skewX(-18deg); opacity: 0; }
    }
    @keyframes sunkBreath {
      0% { box-shadow: inset 0 4px 10px rgba(255,255,255,0.14), inset 0 -8px 14px rgba(10,47,78,0.42), 0 6px 14px rgba(13,62,99,0.18); }
      50% { box-shadow: inset 0 2px 8px rgba(255,255,255,0.1), inset 0 -10px 16px rgba(10,47,78,0.56), 0 4px 9px rgba(13,62,99,0.12); }
      100% { box-shadow: inset 0 4px 10px rgba(255,255,255,0.14), inset 0 -8px 14px rgba(10,47,78,0.42), 0 6px 14px rgba(13,62,99,0.18); }
    }
    @keyframes lb-tooltip-in {
      from { opacity: 0; transform: translateY(4px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes lb-tooltip-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    @keyframes actionButtonsIn {
      0% { opacity: 0; transform: translateY(10px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .vb-print-access-sheet{display:none;}
    @media print{
      body *{visibility:hidden !important;}
      .vb-print-access-sheet,.vb-print-access-sheet *{visibility:visible !important;}
      .vb-print-access-sheet{
        display:block !important;
        position:fixed;
        inset:0;
        background:#ffffff;
        padding:22px;
        z-index:999999;
      }
    }
  `;

  return (
    <>
      <style>{sharedStyles}</style>

      {/* ── NOTIFICACIÓN FLOTANTE — fuera del overlay con backdropFilter ── */}
      {showOpeningNotice && (
        <div style={{
          position: 'fixed',
          top: layoutInsets.top + 8,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 120,
          pointerEvents: 'none',
          animation: openingNoticeLeaving ? 'lb-tooltip-out 0.26s ease-in forwards' : 'none',
        }}>
          <div style={{
            width: isMobile ? 'calc(100vw - 56px)' : 'min(400px, calc(100vw - 160px))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: isMobile ? '9px 11px' : '9px 14px',
            borderRadius: 10,
            border: '1px solid rgba(224,178,33,0.55)',
            background: 'linear-gradient(135deg, rgba(255,228,155,0.82), rgba(247,201,72,0.68))',
            color: 'rgba(88,61,0,0.92)',
            fontFamily: FONTS.body,
            fontSize: isMobile ? 11 : 12,
            fontWeight: 600,
            boxShadow: '0 0 16px rgba(224,178,33,0.25), 0 4px 14px rgba(117,85,0,0.18)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: openingNoticeLeaving ? 'lb-tooltip-out 0.26s ease-in forwards' : 'lb-tooltip-in 0.18s ease-out',
          }}>
            <IconPencil size={28} stroke={1} />
            <span>Puede cambiar los datos para su comprobante, de no hacerlo se generarán con los que ya se tiene.</span>
          </div>
        </div>
      )}

      {/* ── OVERLAY (backdropFilter aquí — ya NO contiene la notificación) ── */}
      <div style={{
        animation: 'fadeOverlay 0.35s ease-out',
        position: 'fixed',
        top: `${layoutInsets.top}px`,
        left: 0,
        right: 0,
        bottom: `${layoutInsets.bottom}px`,
        background: 'rgba(12, 24, 38, 0.22)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 40,
        backdropFilter: 'blur(10px) saturate(115%)',
        WebkitBackdropFilter: 'blur(10px) saturate(115%)',
        padding: isMobile ? '0 8px' : '0 12px',
        overflow: 'auto',
      }}>
        <div style={{
          animation: 'voucherIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          position: 'relative',
          background: 'linear-gradient(90deg, rgba(146, 218, 245, 0.88) 0%, rgba(146, 218, 245, 0.88) 6%, transparent 6%, transparent 94%, rgba(146, 218, 245, 0.88) 94%, rgba(146, 218, 245, 0.88) 100%)',
          borderRadius: isMobile ? 16 : 22,
          width: 'min(560px, 100%)',
          boxShadow: 'none',
          fontFamily: FONTS.body,
          padding: isMobile ? '0 8px' : '0 10px',
        }}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 18px 30px rgba(24, 84, 112, 0.18)',
            border: '1px solid #d7e4ed',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '22%',
              background: 'linear-gradient(90deg, transparent, rgba(143, 212, 241, 0.16), transparent)',
              animation: 'sheenSweep 5.8s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 1,
            }} />
            <div style={{
              position: 'absolute',
              left: 0,
              top: 22,
              bottom: 22,
              width: 8,
              background: 'repeating-radial-gradient(circle at 0 8px, #d1dce5 0 2px, transparent 2px 8px)',
              opacity: 0.8,
              zIndex: 2,
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              right: 0,
              top: 22,
              bottom: 22,
              width: 8,
              background: 'repeating-radial-gradient(circle at 8px 8px, #d1dce5 0 2px, transparent 2px 8px)',
              opacity: 0.8,
              zIndex: 2,
              pointerEvents: 'none',
            }} />
            <img
              src={WATERMARK_LOGO}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '18% 8% auto 8%',
                width: '84%',
                height: 'auto',
                opacity: 0.06,
                pointerEvents: 'none',
                filter: 'grayscale(100%) contrast(120%)',
                zIndex: 0,
              }}
            />

            {/* HEADER */}
            <div style={{
              padding: isMobile ? '18px 18px 18px' : '22px 28px 22px',
              background: 'rgba(255,255,255,0.92)',
              color: '#0f3554',
              borderBottom: '1px dashed #d6e0e7',
              display: 'grid',
              gap: 12,
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{ fontFamily: FONTS.heading, fontSize: isMobile ? 22 : 26, fontWeight: 900, letterSpacing: '0.03em', color: '#14395d' }}>VIDRIOBRAS</div>
              <div>
                <div style={{ fontFamily: FONTS.heading, fontSize: isMobile ? 18 : 22, fontWeight: 900, letterSpacing: '0.03em' }}>COMPROBANTE ELECTRONICO</div>
                <div style={{ fontFamily: FONTS.body, fontSize: 13, color: '#6b7783', fontStyle: 'italic', marginTop: 10 }}>{fechaVisual}</div>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.heading, fontSize: 11, letterSpacing: '0.12em', color: '#768896' }}>TOTAL DEL COMPROBANTE</div>
                <div style={{ fontFamily: FONTS.body, fontSize: isMobile ? 32 : 40, lineHeight: 1.05, color: '#17222d' }}>S/ {totales.total.toFixed(2)}</div>
              </div>
            </div>

            {/* CONTENT */}
            <div style={{ padding: isMobile ? 14 : 18, display: 'grid', gap: 12, background: 'rgba(255,255,255,0.9)', position: 'relative', zIndex: 1 }}>

              {/* RESUMEN */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                gap: 10,
                background: '#ffffff',
                border: '1px dashed #d5dfe7',
                borderRadius: 0,
                padding: '12px 14px',
              }}>
                <div>
                  <div style={{ fontFamily: FONTS.heading, color: '#557488', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Productos</div>
                  <div style={{ fontFamily: FONTS.heading, color: '#0f172a', fontSize: 18, fontWeight: 900 }}>{Array.isArray(productosLocales) ? productosLocales.length : 0}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONTS.heading, color: '#557488', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Subtotal</div>
                  <div style={{ fontFamily: FONTS.heading, color: '#0f172a', fontSize: 18, fontWeight: 900 }}>S/ {totales.subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONTS.heading, color: '#557488', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>IGV</div>
                  <div style={{ fontFamily: FONTS.heading, color: '#143a57', fontSize: 22, fontWeight: 900, lineHeight: 1 }}>S/ {totales.igv.toFixed(2)}</div>
                </div>
              </div>

              <form onSubmit={emitirComprobante} noValidate style={{ display: 'grid', gap: 12 }}>
                {/* TIPO DE COMPROBANTE */}
                <div style={{
                  background: '#ffffff',
                  border: '1px dashed #d5dfe7',
                  borderRadius: 0,
                  padding: '12px 14px',
                }}>
                  <label style={{ ...labelStyle, color: '#2f556d' }}>Tipo de Comprobante</label>
                  <AnimatedSelect
                    name="tipo_comprobante"
                    value={form.tipo_comprobante}
                    onChange={handleChange}
                    onOpenChange={(open) => setActiveSelect(open ? 'tipo_comprobante' : '')}
                    options={[
                      { value: 'boleta', label: 'Boleta' },
                      { value: 'factura', label: 'Factura' },
                    ]}
                    shellStyle={getSelectShellStyle('tipo_comprobante')}
                    buttonStyle={{
                      ...fieldStyle,
                      background: '#fcfeff',
                      borderColor: '#bed0de',
                      fontWeight: 600,
                      paddingLeft: 38,
                    }}
                    menuZIndex={60}
                    prefixIcon={<IconNotes size={14} stroke={1} />}
                  />
                </div>

                {/* SECCIÓN: DATOS DEL CLIENTE */}
                <div style={{
                  background: '#ffffff',
                  border: '1px dashed #d5dfe7',
                  borderRadius: 0,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, color: '#1e4d6b', marginBottom: 10, letterSpacing: '0.08em' }}>PRODUCTO DESTINO</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={labelStyle}>Nombre cliente</label>
                      <div style={inputWithIconWrapStyle}>
                        <span style={inputIconStyle}><IconUserFilled size={13} /></span>
                        <input 
                          name="nombre" 
                          required 
                          value={form.nombre} 
                          onChange={handleChange} 
                          style={{...fieldStyle, background: '#fbfdff', paddingLeft: 38}}
                        />
                      </div>
                      {renderFieldNotice('nombre')}
                    </div>
                    <div>
                      <label style={labelStyle}>{documentLabel}</label>
                      <div style={inputWithIconWrapStyle}>
                        <span style={inputIconStyle}><IconSquareAsterisk size={14} stroke={1} /></span>
                        <input 
                          name="documento" 
                          required 
                          value={form.documento} 
                          onChange={handleChange} 
                          placeholder={form.tipo_comprobante === 'factura' ? 'Ej: 20123456789' : 'Ej: 12345678'}
                          style={{...fieldStyle, background: '#fbfdff', paddingLeft: 38}}
                        />
                      </div>
                      {renderFieldNotice('documento')}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Correo</label>
                    <div style={inputWithIconWrapStyle}>
                      <span style={inputIconStyle}><IconMail size={14} stroke={1} /></span>
                      <input 
                        type="email" 
                        name="correo" 
                        required 
                        value={form.correo} 
                        onChange={handleChange} 
                        style={{...fieldStyle, background: '#fbfdff', paddingLeft: 38}}
                      />
                    </div>
                    {renderFieldNotice('correo')}
                  </div>
                </div>

                {/* SECCIÓN: DIRECCIÓN */}
                <div style={{
                  background: '#ffffff',
                  border: '1px dashed #d5dfe7',
                  borderRadius: 0,
                  padding: '12px 14px',
                }}>
                  <label style={{ ...labelStyle, color: '#2e4a60' }}>Producto origen / Dirección completa</label>
                  <div style={inputWithIconWrapStyle}>
                    <span style={inputIconStyle}><IconMapPin size={14} stroke={1} /></span>
                    <input 
                      name="direccion" 
                      required 
                      value={form.direccion} 
                      onChange={handleChange} 
                      style={{...fieldStyle, background: '#fbfdff', paddingLeft: 38}}
                    />
                  </div>
                  {renderFieldNotice('direccion')}
                </div>

                {/* SECCIÓN: UBICACIÓN */}
                <div style={{
                  background: '#ffffff',
                  border: '1px dashed #d5dfe7',
                  borderRadius: 0,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, color: '#2f556d', marginBottom: 10, letterSpacing: '0.08em' }}>UBICACIÓN</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={labelStyle}>Departamento</label>
                      <AnimatedSelect
                        name="departamento"
                        value={form.departamento}
                        onChange={handleChange}
                        onOpenChange={(open) => setActiveSelect(open ? 'departamento' : '')}
                        options={departamentos}
                        shellStyle={getSelectShellStyle('departamento')}
                        buttonStyle={{...fieldStyle, background: '#fbfdff'}}
                        menuZIndex={50}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Provincia</label>
                      <AnimatedSelect
                        name="provincia"
                        value={form.provincia}
                        onChange={handleChange}
                        onOpenChange={(open) => setActiveSelect(open ? 'provincia' : '')}
                        options={provinciasDisponibles}
                        shellStyle={getSelectShellStyle('provincia')}
                        buttonStyle={{...fieldStyle, background: '#fbfdff'}}
                        menuZIndex={49}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Distrito</label>
                      <AnimatedSelect
                        name="distrito"
                        value={form.distrito}
                        onChange={handleChange}
                        onOpenChange={(open) => setActiveSelect(open ? 'distrito' : '')}
                        options={distritosDisponibles}
                        shellStyle={getSelectShellStyle('distrito')}
                        buttonStyle={{...fieldStyle, background: '#fbfdff'}}
                        menuZIndex={48}
                        menuMaxHeight={132}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Ubigeo</label>
                      <input 
                        name="ubigeo" 
                        required 
                        value={form.ubigeo} 
                        onChange={handleChange} 
                        readOnly
                        style={{...fieldStyle, background: '#f4f8fc', letterSpacing: '0.06em'}}
                      />
                    </div>
                  </div>
                  {renderFieldNotice('ubicacion')}
                </div>

                <textarea
                  name="productos"
                  rows="5"
                  value={productosJson}
                  readOnly
                  style={{ display: 'none' }}
                />

                {error && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0,20,50,0.97), rgba(0,35,70,0.99))',
                    color: 'rgba(200,235,255,0.95)',
                    border: '1px solid rgba(128,194,220,0.55)',
                    padding: '10px 12px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13,
                  }}>
                    ❌ {error}
                  </div>
                )}

                {formNotice.text && !['nombre', 'documento', 'correo', 'direccion', 'ubicacion'].includes(formNotice.field) && (
                  <div
                    style={{
                      alignSelf: 'center',
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '7px 13px',
                      borderRadius: 10,
                      border: '1px solid rgba(128,194,220,0.55)',
                      background: 'linear-gradient(135deg, rgba(0,20,50,0.97), rgba(0,35,70,0.99))',
                      boxShadow: '0 0 22px rgba(128,194,220,0.25), 0 4px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(128,194,220,0.15)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      animation: 'lb-tooltip-in 0.18s ease-out',
                      fontFamily: FONTS.body,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'rgba(200,235,255,0.95)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span style={{
                      content: '""',
                      position: 'absolute',
                      top: -6,
                      left: 20,
                      width: 10,
                      height: 10,
                      transform: 'rotate(45deg)',
                      background: 'rgba(0,35,70,0.99)',
                      borderLeft: '1px solid rgba(128,194,220,0.55)',
                      borderTop: '1px solid rgba(128,194,220,0.55)',
                    }} />
                    <span style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #80C2DC, #4fa8cc)',
                      color: '#001428',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(128,194,220,0.6)',
                      fontSize: 10,
                      fontFamily: FONTS.heading,
                      fontWeight: 900,
                    }}>!</span>
                    <span>{formNotice.text}</span>
                  </div>
                )}

                {!comprobanteEmitido && (
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      alignSelf: 'center',
                      justifySelf: 'center',
                      marginTop: 4,
                      padding: '12px 18px',
                      width: buttonCompact ? (isMobile ? '64%' : '36%') : (isMobile ? '72%' : '48%'),
                      border: 'none',
                      background: loading ? '#8fb9d1' : 'linear-gradient(180deg, #55c2ee 0%, #2ca7dc 52%, #1a89bd 100%)',
                      color: 'white',
                      fontSize: 15,
                      borderRadius: 10,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: FONTS.heading,
                      fontWeight: 800,
                      boxShadow: 'inset 0 3px 7px rgba(255,255,255,0.18), inset 0 -10px 14px rgba(8,42,68,0.62), inset 0 0 0 1px rgba(255,255,255,0.08), 0 3px 8px rgba(13,62,99,0.14)',
                      letterSpacing: '0.06em',
                      transition: 'width 0.35s ease, transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease',
                      transform: buttonCompact ? 'translateY(2px) scale(0.985)' : 'translateY(0)',
                      animation: loading ? 'loadingPulse 1s ease-in-out infinite, sunkBreath 1.8s ease-in-out infinite' : 'none',
                    }}
                  >
                    {loading ? 'Generando comprobante y PDF...' : 'Generar comprobante'}
                  </button>
                )}
              </form>

              {/* BOTONES DE DESCARGA */}
              <div style={{
                display: (resultado && !autoCloseOnComprobante) ? 'grid' : 'none',
                gap: 10,
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                animation: resultado ? 'actionButtonsIn 0.35s ease-out' : 'none',
              }}>
                <button
                  type="button"
                  onClick={() => descargarPdfDesdeBase64(pdfGeneradoBase64, pdfNombreArchivo)}
                  disabled={!pdfGeneradoBase64}
                  onMouseEnter={(event) => {
                    if (!pdfGeneradoBase64) return;
                    event.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                    event.currentTarget.style.filter = 'brightness(1.06)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0) scale(1)';
                    event.currentTarget.style.filter = 'brightness(1)';
                  }}
                  style={{
                    width: '100%',
                    background: pdfGeneradoBase64 ? 'linear-gradient(180deg, #19a7e8 0%, #0d8ac7 58%, #0a6f9f 100%)' : '#7fa6bc',
                    color: '#fff',
                    border: 'none',
                    padding: 12,
                    borderRadius: 10,
                    fontFamily: FONTS.heading,
                    fontWeight: 800,
                    cursor: pdfGeneradoBase64 ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 8px 16px rgba(13,138,199,0.26), inset 0 1px 0 rgba(255,255,255,0.2)',
                    transition: 'transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <IconDownload size={16} stroke={1.5} />
                  Mostrar PDF
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                    event.currentTarget.style.filter = 'brightness(1.06)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0) scale(1)';
                    event.currentTarget.style.filter = 'brightness(1)';
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(180deg, #b52121 0%, #941918 58%, #761211 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: 12,
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 'bold',
                    fontFamily: FONTS.heading,
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(148,25,24,0.26), inset 0 1px 0 rgba(255,255,255,0.14)',
                    transition: 'transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  ➜ Ir al Panel del Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalCredenciales && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'linear-gradient(145deg,#eaf8ff,#cceeff)',borderRadius:20,padding:'36px 32px',maxWidth:440,width:'100%',boxShadow:'0 0 60px rgba(90,139,168,.35)',border:'1px solid rgba(128,194,220,.45)',textAlign:'center',fontFamily:'Arial,sans-serif'}}>
            <div style={{color:'#941918',fontWeight:900,fontSize:22,letterSpacing:2,marginBottom:4}}>VIDRIOBRAS</div>
            <div style={{color:'#4fa8cc',fontWeight:700,fontSize:15,marginBottom:24}}>Cuenta temporal creada</div>

            <div style={{background:'rgba(128,194,220,.08)',border:'1px solid rgba(128,194,220,.22)',borderRadius:12,padding:'16px 20px',marginBottom:20,textAlign:'left'}}>
              <div style={{marginBottom:12}}>
                <div style={{color:'#6b7280',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Correo electrónico</div>
                <div style={{color:'#223447',fontWeight:700,fontSize:14,wordBreak:'break-all'}}>{modalCredenciales.correo}</div>
              </div>
              <div>
                <div style={{color:'#6b7280',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Contraseña (tu DNI/RUC)</div>
                <div style={{color:'#f2bd24',fontWeight:900,fontSize:18,letterSpacing:3}}>{modalCredenciales.contrasena}</div>
              </div>
            </div>

            <div style={{marginBottom:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{color:'#6b7280',fontSize:11,marginBottom:10}}>Escanea para ingresar directamente a tu panel</div>
              <img src={modalCredenciales.qrDataUrl} alt="QR acceso" width={180} height={180}
                style={{borderRadius:12,border:'3px solid #941918',background:'#fff',padding:4}}/>
            </div>

            <div style={{color:'#5a7a90',fontSize:11,marginBottom:24,lineHeight:1.6,textAlign:'left',background:'rgba(255,255,255,.55)',border:'1px solid rgba(128,194,220,.35)',borderRadius:8,padding:'10px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontWeight:700,color:'#2d4a62'}}>
                <IconExclamationMark stroke={1.25} size={14} color="#941918"/> Estos datos son personales.
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'#2d4a62'}}>
                <IconAlarm stroke={1.25} size={14} color="#4fa8cc"/> Si no completas el registro, la cuenta se elimina automáticamente a la 1:00 AM.
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>imprimirCredenciales(modalCredenciales)}
                style={{flex:1,padding:'11px 0',borderRadius:10,background:'#941918',border:'none',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer',letterSpacing:.5}}>
                Imprimir PDF
              </button>
              <button onClick={cerrarCredenciales}
                style={{flex:1,padding:'11px 0',borderRadius:10,background:'rgba(128,194,220,.12)',border:'1px solid rgba(128,194,220,.30)',color:'#4fa8cc',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {credencialParaImprimir && (
        <div className="vb-print-access-sheet">
          <div style={{maxWidth:520,margin:'0 auto',fontFamily:'Arial, sans-serif'}}>
            <div style={{color:'#941918',fontSize:26,fontWeight:900,letterSpacing:2,marginBottom:4}}>VIDRIOBRAS</div>
            <div style={{color:'#4fa8cc',fontSize:13,marginBottom:24,fontWeight:600}}>Acceso a tu cuenta temporal</div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Correo electrónico</div>
              <div style={{fontSize:16,fontWeight:700,background:'#f1f8fc',padding:'10px 14px',borderRadius:8,border:'1px solid #cde5f1',wordBreak:'break-all'}}>{credencialParaImprimir.correo}</div>
            </div>

            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Contraseña (tu DNI o RUC)</div>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:4,color:'#941918',background:'#fff3d6',padding:'10px 14px',borderRadius:8,border:'1px solid #ffd98a'}}>{credencialParaImprimir.contrasena}</div>
            </div>

            <div style={{textAlign:'center',margin:'24px 0 16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{fontSize:11,color:'#6b7280',marginBottom:10}}>Escanea para ingresar directamente</div>
              <img src={credencialParaImprimir.qrDataUrl} width={200} height={200} alt="QR acceso" style={{border:'3px solid #941918',borderRadius:10,padding:4,background:'#fff'}}/>
              <div style={{fontSize:10,color:'#9ca3af',marginTop:8,wordBreak:'break-all',textAlign:'center',maxWidth:420}}>{credencialParaImprimir.qrUrl}</div>
            </div>

            <div style={{fontSize:11,color:'#374151',lineHeight:1.7,background:'#eef9ff',border:'1px solid #bfe5f6',borderRadius:8,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontWeight:700}}>
                <IconExclamationMark stroke={1.25} size={14} color="#941918"/> Estos datos son personales.
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <IconAlarm stroke={1.25} size={14} color="#4fa8cc"/> Si no completas tu registro, la cuenta se elimina automáticamente a la 1:00 AM.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalFacturacion;