import { useState, useEffect, useRef } from 'react';
import { IconLoader } from '@tabler/icons-react';
import { COLORS, FONTS, BRAND_THEME } from '../../colors';


const ProductosServicio = ({ notificacion, onToast, showHeader = true, onFinalizarEntrega, onGuardarSuccess }) => {
  const [barras, setBarras] = useState([{ id: 1, nombre: 'Barra 1', medidas: [], selectedAluminio: '', aluminioQuery: '', info: { fila: '', columna: '', stock: false } }]);
  const [cortesVidrioAgregadosPorPlancha, setCortesVidrioAgregadosPorPlancha] = useState({});
  const [corteVidrioInputPorPlancha, setCorteVidrioInputPorPlancha] = useState({});
  const [cortesAluminioAgregadosPorBarra, setCortesAluminioAgregadosPorBarra] = useState({});
  const [corteAluminioInputPorBarra, setCorteAluminioInputPorBarra] = useState({});
  const [cortesPorProducto, setCortesPorProducto] = useState([]);
  const [cargandoCortes, setCargandoCortes] = useState(false);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [selectedVidrio, setSelectedVidrio] = useState(null);
  const [vidrioQuery, setVidrioQuery] = useState('');
  const [planchasTrabajo, setPlanchasTrabajo] = useState([]);
  const [aluminioDropdownAbierto, setAluminioDropdownAbierto] = useState({});
  const [vidrioDropdownAbierto, setVidrioDropdownAbierto] = useState(false);
  const [posicionesVidrioManualPorPlancha, setPosicionesVidrioManualPorPlancha] = useState({});
  const [dragCorteVidrio, setDragCorteVidrio] = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [carritoId, setCarritoId] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );
  const svgAluminioRef = useRef(null);
  const svgVidrioRef = useRef(null);
  const autoOptimizadoRef = useRef(false); // Track if auto-optimization ran
  const isTablet = viewportWidth <= 1024;
  const isMobile = viewportWidth <= 760;
  const isTinyMobile = viewportWidth <= 480;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const fetchCortes = async () => {
      if (!notificacion?.id) {
        return;
      }

      setCargandoCortes(true);
      try {
        const response = await fetch(`/api/cortes/notificacion/${notificacion.id}`);
        const data = await response.json();
        if (data.success) {
          setCortesPorProducto(Array.isArray(data.productos) ? data.productos : []);
          setCarritoId(String(data.carrito_id || '').trim());
        } else {
          onToast && onToast(data.error || 'Error al cargar cortes', 'error');
        }
      } catch (error) {
        onToast && onToast('Error al conectar con el servidor', 'error');
      } finally {
        setCargandoCortes(false);
      }
    };

    // Recuperar productos seleccionados del localStorage
    const productosGuardados = localStorage.getItem('productosSeleccionadosEntrega');
    if (productosGuardados) {
      try {
        setProductosSeleccionados(JSON.parse(productosGuardados));
      } catch (e) {
        console.error('Error al recuperar productos:', e);
      }
    }

    fetchCortes();
  }, [notificacion?.id, onToast]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch('/api/productos');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setProductosCatalogo(Array.isArray(data) ? data : []);
      } catch (_) {
        setProductosCatalogo([]);
      }
    };

    fetchProductos();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/productos');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setProductosCatalogo(data);
      } catch { }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const separarPorCategoria = (productos) => {
    const vidrios = [];
    const aluminios = [];

    (productos || []).forEach((producto) => {
      const categoria = (producto.categoria || '').toUpperCase();
      if (categoria.includes('ALUMIN')) {
        aluminios.push(producto);
      } else {
        vidrios.push(producto);
      }
    });

    return { vidrios, aluminios };
  };

  const { vidrios, aluminios } = separarPorCategoria(cortesPorProducto);

  const obtenerCortesAluminio = () => {
    return (aluminios || []).flatMap((producto) => {
      return (producto.cortes || []).map((corte) => {
        const valor = Number(corte.ancho_cm || corte.alto_cm || 0);
        return {
          ...corte,
          producto_nombre: producto.producto_nombre,
          largo_cm: Number.isFinite(valor) ? valor : 0
        };
      });
    });
  };

  const cortesAluminio = obtenerCortesAluminio();
  const aluminiosUnicos = aluminios.map((producto) => ({
    nombre: producto.producto_nombre,
    fila: producto.producto_almacen_fila,
    columna: producto.producto_almacen_columna
  }));

  const aluminiosCatalogo = productosCatalogo
    .filter((producto) => ((producto.categoria || '').toUpperCase().includes('ALUMIN')))
    .map((producto) => ({
      nombre: producto.nombre,
      fila: producto.fila || '',
      columna: producto.columna || ''
    }));

  const aluminiosDisponibles = aluminiosCatalogo.length > 0 ? aluminiosCatalogo : aluminiosUnicos;
  const normalizarTextoBusqueda = (texto) => (texto || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const obtenerProductoIdDesdeItem = (item) => String(item?.producto_id || item?.id_producto || '').trim();
  const bloquearEntradaNoNumerica = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };
  const sanitizarEntradaNumerica = (valor, permitirDecimal = true) => {
    const texto = (valor || '').replace(',', '.');
    if (!permitirDecimal) {
      return texto.replace(/\D/g, '');
    }
    const limpio = texto.replace(/[^\d.]/g, '');
    const partes = limpio.split('.');
    if (partes.length <= 1) {
      return limpio;
    }
    return `${partes[0]}.${partes.slice(1).join('')}`;
  };
  const limitarMedidaCm = (valor) => {
    const num = parseFloat(valor);
    if (Number.isNaN(num)) {
      return '';
    }
    return String(Math.min(num, 300));
  };
  const largoBarraCm = 300;
  const vidrioPlanchaAncho = 300;
  const vidrioPlanchaAlto = 300;

  const obtenerCortesVidrio = () => {
    return (vidrios || []).flatMap((producto) => {
      return (producto.cortes || []).map((corte) => {
        const ancho = Number(corte.ancho_cm || 0);
        const alto = Number(corte.alto_cm || 0);
        return {
          ...corte,
          producto_nombre: producto.producto_nombre,
          ancho_cm: Number.isFinite(ancho) ? ancho : 0,
          alto_cm: Number.isFinite(alto) ? alto : 0,
          producto_almacen_fila: producto.producto_almacen_fila,
          producto_almacen_columna: producto.producto_almacen_columna
        };
      });
    });
  };

  const cortesVidrio = obtenerCortesVidrio();

  // Obtener vidrios únicos agrupados
  const obtenerVidriosUnicos = () => {
    const vidriosMap = new Map();
    cortesVidrio.forEach((corte) => {
      if (!vidriosMap.has(corte.producto_nombre)) {
        vidriosMap.set(corte.producto_nombre, {
          nombre: corte.producto_nombre,
          fila: corte.producto_almacen_fila,
          columna: corte.producto_almacen_columna,
          cortes: []
        });
      }
      vidriosMap.get(corte.producto_nombre).cortes.push(corte);
    });
    return Array.from(vidriosMap.values());
  };

  const vidriosUnicos = obtenerVidriosUnicos();

  const vidrioCatalogo = productosCatalogo
    .filter((producto) => ((producto.categoria || '').toUpperCase().includes('VIDRIO')))
    .map((producto) => ({
      nombre: producto.nombre,
      grosor: producto.grosor || '',
      fila: producto.fila || '',
      columna: producto.columna || ''
    }));
  const vidriosDisponibles = vidrioCatalogo.length > 0 ? vidrioCatalogo : vidriosUnicos;

  const coincideBusquedaVidrio = (vidrio, query) => {
    const texto = `${vidrio?.nombre || ''} ${vidrio?.grosor || ''}`;
    return normalizarTextoBusqueda(texto).includes(normalizarTextoBusqueda(query));
  };

  const obtenerAluminioPorNombre = (nombre) => {
    if (!nombre) return null;
    const buscado = normalizarTextoBusqueda(nombre);
    return aluminiosDisponibles.find((item) => normalizarTextoBusqueda(item.nombre) === buscado) || null;
  };

  const obtenerVidrioPorNombre = (nombre) => {
    if (!nombre) return null;
    const buscado = normalizarTextoBusqueda(nombre);
    return vidriosDisponibles.find((item) => normalizarTextoBusqueda(item.nombre) === buscado) || null;
  };

  const obtenerCortesBaseAluminio = (nombreAluminio) => {
    if (!nombreAluminio) return [];
    return cortesAluminio.filter((corte) => (corte.producto_nombre || '').toLowerCase() === nombreAluminio.toLowerCase());
  };

  // Al entrar a PRODUCTOS no se preselecciona ni vidrio ni aluminio.

  // Obtener cortes del vidrio seleccionado
  const selectedVidrioNombre = planchasTrabajo.find(p => p.id === selectedVidrio)?.nombre || null;

  const cortesVidrioSeleccionado = selectedVidrioNombre
    ? vidriosUnicos.find(v => v.nombre === selectedVidrioNombre)?.cortes || []
    : [];

  const cortesVidrioAgregadosSeleccionado = selectedVidrio
    ? (cortesVidrioAgregadosPorPlancha[selectedVidrio] || [])
    : [];

  const cortesVidrioActivosSeleccionado = [...cortesVidrioSeleccionado, ...cortesVidrioAgregadosSeleccionado];

  /**
   * Llama al backend de optimización (puerto 5000) para obtener la mejor distribución
   */
  const optimizarCortesConBackend = async (cortesADistr, tipoMaterial = 'vidrio') => {
    try {
      const productos = cortesADistr
        .filter((corte) => corte.ancho_cm > 0 && (tipoMaterial === 'aluminio' ? true : corte.alto_cm > 0))
        .map((corte, idx) => ({
          id: String(corte.id_corte || corte.id || idx),
          cantidad: 1,
          ...(tipoMaterial === 'vidrio'
            ? { ancho: corte.ancho_cm, alto: corte.alto_cm }
            : { largo: corte.ancho_cm || corte.largo_cm })
        }));

      if (productos.length === 0) {
        return null;
      }

      const response = await fetch('/api/optimizacion_cortes/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productos,
          tipo_material: tipoMaterial,
          plancha_ancho: vidrioPlanchaAncho,
          plancha_alto: vidrioPlanchaAlto,
          barra_largo: 300,
          permitir_rotacion: true,
          min_retazo: 20
        })
      });

      const data = await response.json();

      if (tipoMaterial === 'vidrio') {
        if (data.success && data.planchas && data.planchas.length > 0) {
          // Retornar TODAS las planchas optimizadas, no solo la primera
          return {
            success: true,
            planchas: data.planchas,
            total_planchas: data.total_planchas,
            eficiencia_global: data.eficiencia_global
          };
        }
      } else if (tipoMaterial === 'aluminio') {
        // Para aluminio, retornar el resultado completo con barras
        if (data.success && data.barras) {
          return data;
        }
      }

      return null;
    } catch (error) {
      console.warn('Error llamando a optimización backend, usando algoritmo local:', error);
      return null;
    }
  };

  const calcularDistribucionVidrio = (cortesADistr = cortesVidrioActivosSeleccionado) => {
    const piezas = cortesADistr
      .filter((corte) => corte.ancho_cm > 0 && corte.alto_cm > 0)
      .sort((a, b) => b.alto_cm - a.alto_cm);

    let x = 0;
    let y = 0;
    let altoFila = 0;
    const colocadas = [];

    piezas.forEach((pieza) => {
      if (pieza.ancho_cm > vidrioPlanchaAncho || pieza.alto_cm > vidrioPlanchaAlto) {
        return;
      }

      if (x + pieza.ancho_cm > vidrioPlanchaAncho) {
        y += altoFila;
        x = 0;
        altoFila = 0;
      }

      if (y + pieza.alto_cm > vidrioPlanchaAlto) {
        return;
      }

      colocadas.push({
        ...pieza,
        x,
        y
      });

      x += pieza.ancho_cm;
      altoFila = Math.max(altoFila, pieza.alto_cm);
    });

    return colocadas;
  };

  const obtenerClaveCorteVidrio = (corte, idx) => String(corte.id_corte ?? corte.id ?? `idx_${idx}_${corte.ancho_cm}_${corte.alto_cm}`);

  const piezasVidrioValidas = cortesVidrioActivosSeleccionado
    .filter((corte) => (corte.ancho_cm > 0 && corte.alto_cm > 0));
  const distribucionVidrioActual = calcularDistribucionVidrio(cortesVidrioActivosSeleccionado);
  const areaPlanchaVidrio = vidrioPlanchaAncho * vidrioPlanchaAlto;
  const areaUsadaVidrio = distribucionVidrioActual.reduce((acc, c) => acc + (c.ancho_cm * c.alto_cm), 0);
  const planchaVidrioLlena = piezasVidrioValidas.length > 0
    && (
      distribucionVidrioActual.length < piezasVidrioValidas.length
      || areaUsadaVidrio >= areaPlanchaVidrio
    );

  const posicionesVidrioManualActual = selectedVidrio
    ? (posicionesVidrioManualPorPlancha[selectedVidrio] || {})
    : {};

  const distribucionVidrioRender = distribucionVidrioActual.map((corte, idx) => {
    const key = obtenerClaveCorteVidrio(corte, idx);
    const manual = posicionesVidrioManualActual[key];
    const maxX = Math.max(0, vidrioPlanchaAncho - corte.ancho_cm);
    const maxY = Math.max(0, vidrioPlanchaAlto - corte.alto_cm);

    if (!manual) {
      return { ...corte, _key: key };
    }

    return {
      ...corte,
      _key: key,
      x: Math.max(0, Math.min(manual.x, maxX)),
      y: Math.max(0, Math.min(manual.y, maxY))
    };
  });

  const distribucionVidrioRenderOrdenada = dragCorteVidrio
    ? [...distribucionVidrioRender].sort((a, b) => {
      if (a._key === dragCorteVidrio.key) return 1;
      if (b._key === dragCorteVidrio.key) return -1;
      return 0;
    })
    : distribucionVidrioRender;

  const seSuperponenCortes = (a, b) => {
    return (
      a.x < b.x + b.ancho_cm
      && a.x + a.ancho_cm > b.x
      && a.y < b.y + b.alto_cm
      && a.y + a.alto_cm > b.y
    );
  };

  // Auto-optimizar la primera vez que se cargan cortes de vidrio
  useEffect(() => {
    if (autoOptimizadoRef.current) return; // Ya se optimizó
    if (!selectedVidrio) return; // No hay plancha seleccionada
    if (piezasVidrioValidas.length === 0) return; // No hay cortes
    if (Object.keys(posicionesVidrioManualActual).length > 0) return; // Ya tiene posiciones manuales

    // Marcar como optimizado antes de ejecutar para evitar loops
    autoOptimizadoRef.current = true;

    // Llamar a la optimización automáticamente
    handleAutoOrganizarVidrio();
  }, [selectedVidrio, piezasVidrioValidas.length]);

  // Auto-optimizar barras de aluminio cuando se cargan
  useEffect(() => {
    const optimizarAluminioAutomatico = async () => {
      if (!barras || barras.length === 0) return;
      if (cortesAluminio.length === 0) return;

      // Agrupar todos los cortes por tipo de aluminio
      const cortesPorAluminio = {};
      cortesAluminio.forEach(corte => {
        const nombreAluminio = corte.producto_nombre;
        if (!nombreAluminio) return;

        if (!cortesPorAluminio[nombreAluminio]) {
          cortesPorAluminio[nombreAluminio] = [];
        }
        cortesPorAluminio[nombreAluminio].push(corte);
      });

      // Optimizar cada tipo de aluminio
      for (const [nombreAluminio, cortes] of Object.entries(cortesPorAluminio)) {
        try {
          const cortesTransformados = cortes.map(c => ({
            ...c,
            largo_cm: c.largo_cm || c.ancho_cm || c.alto_cm || 0
          }));

          const resultado = await optimizarCortesConBackend(cortesTransformados, 'aluminio');

          if (resultado && resultado.barras && resultado.barras.length > 0) {
            const barrasOptimizadas = resultado.barras;

            // Encontrar todas las barras de este tipo de aluminio
            const barrasDeEsteTipo = barras.filter(b => b.selectedAluminio === nombreAluminio);

            // Si no hay suficientes barras, crear más
            if (barrasDeEsteTipo.length < barrasOptimizadas.length) {
              const barrasACrear = barrasOptimizadas.length - barrasDeEsteTipo.length;
              const nuevasBarras = [];

              for (let i = 0; i < barrasACrear; i++) {
                nuevasBarras.push({
                  id: Date.now() + i + Math.random(),
                  nombre: `Barra ${barras.length + i + 1}`,
                  medidas: [],
                  selectedAluminio: nombreAluminio,
                  aluminioQuery: '',
                  info: { fila: '', columna: '', stock: false }
                });
              }

              setBarras(prev => [...prev, ...nuevasBarras]);
              barrasDeEsteTipo.push(...nuevasBarras);
            }

            // Limpiar cortes de todas las barras de este tipo primero
            const nuevosCortes = {};
            barrasDeEsteTipo.forEach(barra => {
              nuevosCortes[barra.id] = [];
            });

            // Asignar cortes optimizados a las barras necesarias
            barrasOptimizadas.forEach((barraOpt, idx) => {
              const barraTarget = barrasDeEsteTipo[idx];
              if (barraTarget && barraOpt.cortes) {
                nuevosCortes[barraTarget.id] = barraOpt.cortes.map((c, cIdx) => ({
                  id: `opt_${barraTarget.id}_${cIdx}_${Date.now()}`,
                  largo_cm: c.largo,
                  corte_id: c.corte_id,
                  producto_nombre: nombreAluminio
                }));
              }
            });

            // Actualizar todas las barras a la vez
            setCortesAluminioAgregadosPorBarra(prev => ({
              ...prev,
              ...nuevosCortes
            }));

            console.log(`✓ Optimizado ${nombreAluminio}: ${barrasOptimizadas.length} barras, eficiencia ${resultado.eficiencia_global?.toFixed(1)}%`);
          }
        } catch (error) {
          console.warn(`Error optimizando aluminio ${nombreAluminio}:`, error);
        }
      }
    };

    // Solo ejecutar si hay barras y cortes
    if (barras.length > 0 && cortesAluminio.length > 0) {
      optimizarAluminioAutomatico();
    }
  }, [barras.length, cortesAluminio.length]);

  const buscarPosicionLibreVidrio = (corte, colocados) => {
    const maxX = Math.max(0, vidrioPlanchaAncho - corte.ancho_cm);
    const maxY = Math.max(0, vidrioPlanchaAlto - corte.alto_cm);

    for (let y = 0; y <= maxY; y += 1) {
      for (let x = 0; x <= maxX; x += 1) {
        const candidato = { ...corte, x, y };
        const choca = colocados.some((otro) => seSuperponenCortes(candidato, otro));
        if (!choca) {
          return { x, y };
        }
      }
    }

    return { x: corte.x, y: corte.y };
  };

  const resolverColisionesAlSoltarVidrio = (dragKey) => {
    if (!selectedVidrio) {
      return;
    }

    setPosicionesVidrioManualPorPlancha((prev) => {
      const manualPlancha = prev[selectedVidrio] || {};
      const layoutActual = distribucionVidrioActual.map((corte, idx) => {
        const key = obtenerClaveCorteVidrio(corte, idx);
        const manual = manualPlancha[key];
        const maxX = Math.max(0, vidrioPlanchaAncho - corte.ancho_cm);
        const maxY = Math.max(0, vidrioPlanchaAlto - corte.alto_cm);
        return {
          ...corte,
          _key: key,
          x: manual ? Math.max(0, Math.min(manual.x, maxX)) : corte.x,
          y: manual ? Math.max(0, Math.min(manual.y, maxY)) : corte.y
        };
      });

      const corteDrag = layoutActual.find((c) => c._key === dragKey);
      if (!corteDrag) {
        return prev;
      }

      const colocados = [corteDrag];
      const siguientes = layoutActual.filter((c) => c._key !== dragKey);
      const nuevoManual = {
        ...manualPlancha,
        [corteDrag._key]: { x: corteDrag.x, y: corteDrag.y }
      };

      siguientes.forEach((corte) => {
        let candidato = { ...corte };
        if (colocados.some((otro) => seSuperponenCortes(candidato, otro))) {
          const libre = buscarPosicionLibreVidrio(candidato, colocados);
          candidato = { ...candidato, x: libre.x, y: libre.y };
        }
        colocados.push(candidato);
        nuevoManual[candidato._key] = { x: candidato.x, y: candidato.y };
      });

      return {
        ...prev,
        [selectedVidrio]: nuevoManual
      };
    });
  };

  const iniciarArrastreCorteVidrio = (e, corte) => {
    if (!selectedVidrio || !svgVidrioRef.current) {
      return;
    }

    const rect = svgVidrioRef.current.getBoundingClientRect();
    const scaleX = vidrioPlanchaAncho / rect.width;
    const scaleY = vidrioPlanchaAlto / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setDragCorteVidrio({
      key: corte._key,
      offsetX: mouseX - corte.x,
      offsetY: mouseY - corte.y
    });
  };

  const handleAutoOrganizarVidrio = async () => {
    if (!selectedVidrio) {
      return;
    }

    // Intentar usar el backend de optimización primero
    const resultadoBackend = await optimizarCortesConBackend(cortesVidrioActivosSeleccionado, 'vidrio');

    if (resultadoBackend && resultadoBackend.success && resultadoBackend.planchas) {
      const planchasOptimizadas = resultadoBackend.planchas;

      // Si necesita más de una plancha, crear las planchas necesarias
      if (planchasOptimizadas.length > 1) {
        // Encontrar el vidrio actualmente seleccionado
        const planchaActual = planchasTrabajo.find(p => p.id === selectedVidrio);
        if (!planchaActual) return;

        // Crear planchas adicionales si son necesarias
        const planchasACrear = planchasOptimizadas.length - 1;
        const nuevasPlanchas = [];

        for (let i = 0; i < planchasACrear; i++) {
          const nuevoId = Date.now() + i;
          nuevasPlanchas.push({
            id: nuevoId,
            nombre: planchaActual.nombre // Mismo tipo de vidrio
          });
        }

        if (nuevasPlanchas.length > 0) {
          setPlanchasTrabajo(prev => [...prev, ...nuevasPlanchas]);
          onToast && onToast(`Optimización completa: ${planchasOptimizadas.length} planchas necesarias (eficiencia: ${resultadoBackend.eficiencia_global?.toFixed(1)}%)`, 'success');
        }

        // Distribuir los cortes optimizados en las planchas correspondientes
        const nuevasPosicionesPorPlancha = {};
        const nuevosCortesPorPlancha = {};

        planchasOptimizadas.forEach((plancha, planchaIdx) => {
          const planchaId = planchaIdx === 0 ? selectedVidrio : nuevasPlanchas[planchaIdx - 1].id;
          const nuevasPosiciones = {};

          plancha.cortes.forEach((corte, idx) => {
            // Buscar el corte original por ID
            const corteOriginal = cortesVidrioActivosSeleccionado.find(c => String(c.id_corte || c.id) === String(corte.corte_id));
            if (corteOriginal) {
              const key = obtenerClaveCorteVidrio(corteOriginal, idx);
              nuevasPosiciones[key] = { x: corte.x, y: corte.y };
            }
          });

          nuevasPosicionesPorPlancha[planchaId] = nuevasPosiciones;

          // Si no es la plancha actual, mover cortes a la nueva plancha
          if (planchaIdx > 0) {
            const cortesParaEstaPlancha = plancha.cortes.map(c => {
              const corteOriginal = cortesVidrioActivosSeleccionado.find(co => String(co.id_corte || co.id) === String(c.corte_id));
              return corteOriginal;
            }).filter(Boolean);

            nuevosCortesPorPlancha[planchaId] = cortesParaEstaPlancha;
          }
        });

        // Actualizar posiciones de todas las planchas
        setPosicionesVidrioManualPorPlancha(prev => ({
          ...prev,
          ...nuevasPosicionesPorPlancha
        }));

        // Mover cortes a las nuevas planchas
        if (Object.keys(nuevosCortesPorPlancha).length > 0) {
          setCortesVidrioAgregadosPorPlancha(prev => {
            const siguiente = { ...prev };

            // Limpiar cortes de la plancha actual que se movieron
            const cortesQueSeQuedanEnPrimera = planchasOptimizadas[0].cortes.map(c => {
              return cortesVidrioActivosSeleccionado.find(co => String(co.id_corte || co.id) === String(c.corte_id));
            }).filter(Boolean);

            siguiente[selectedVidrio] = cortesQueSeQuedanEnPrimera;

            // Asignar cortes a nuevas planchas
            Object.assign(siguiente, nuevosCortesPorPlancha);

            return siguiente;
          });
        }
      } else {
        // Solo una plancha necesaria - aplicar optimización normal
        const primeraPlanchaCortes = planchasOptimizadas[0].cortes || [];
        const nuevasPosiciones = {};

        primeraPlanchaCortes.forEach((corte, idx) => {
          const corteOriginal = cortesVidrioActivosSeleccionado.find(c => String(c.id_corte || c.id) === String(corte.corte_id));
          if (corteOriginal) {
            const key = obtenerClaveCorteVidrio(corteOriginal, idx);
            nuevasPosiciones[key] = { x: corte.x, y: corte.y };
          }
        });

        setPosicionesVidrioManualPorPlancha((prev) => ({
          ...prev,
          [selectedVidrio]: nuevasPosiciones
        }));

        onToast && onToast(`Optimización aplicada: 1 plancha (eficiencia: ${resultadoBackend.eficiencia_global?.toFixed(1)}%)`, 'success');
      }
    } else {
      // Fallback: usar algoritmo local (borrar posiciones manuales)
      setPosicionesVidrioManualPorPlancha((prev) => {
        const next = { ...prev };
        delete next[selectedVidrio];
        return next;
      });
    }

    setDragCorteVidrio(null);
  };

  useEffect(() => {
    if (!dragCorteVidrio || !selectedVidrio || !svgVidrioRef.current) {
      return undefined;
    }

    const onMouseMove = (e) => {
      const rect = svgVidrioRef.current.getBoundingClientRect();
      const scaleX = vidrioPlanchaAncho / rect.width;
      const scaleY = vidrioPlanchaAlto / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const corte = distribucionVidrioRender.find((item) => item._key === dragCorteVidrio.key);
      if (!corte) {
        return;
      }

      const maxX = Math.max(0, vidrioPlanchaAncho - corte.ancho_cm);
      const maxY = Math.max(0, vidrioPlanchaAlto - corte.alto_cm);
      const newX = Math.max(0, Math.min(mouseX - dragCorteVidrio.offsetX, maxX));
      const newY = Math.max(0, Math.min(mouseY - dragCorteVidrio.offsetY, maxY));

      setPosicionesVidrioManualPorPlancha((prev) => ({
        ...prev,
        [selectedVidrio]: {
          ...(prev[selectedVidrio] || {}),
          [dragCorteVidrio.key]: { x: newX, y: newY }
        }
      }));
    };

    const onMouseUp = () => {
      const dragKey = dragCorteVidrio.key;
      setDragCorteVidrio(null);
      resolverColisionesAlSoltarVidrio(dragKey);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragCorteVidrio, selectedVidrio, distribucionVidrioRender]);

  const handleAgregarBarra = () => {
    const newId = Math.max(...barras.map(b => b.id), 0) + 1;
    setBarras([...barras, {
      id: newId,
      nombre: `Barra ${newId}`,
      medidas: [],
      selectedAluminio: '',
      aluminioQuery: '',
      info: {
        fila: '',
        columna: '',
        stock: false
      }
    }]);
  };

  const handleEliminarBarra = (barraId) => {
    if (barras.length <= 1) {
      onToast && onToast('Debe quedar al menos una barra', 'error');
      return;
    }
    setBarras((prev) => prev.filter((barra) => barra.id !== barraId));
    setCortesAluminioAgregadosPorBarra((prev) => {
      const next = { ...prev };
      delete next[barraId];
      return next;
    });
    setCorteAluminioInputPorBarra((prev) => {
      const next = { ...prev };
      delete next[barraId];
      return next;
    });
  };

  const handleBuscarAluminioBarra = (barraId, value) => {
    const match = obtenerAluminioPorNombre(value);
    setBarras((prev) => prev.map((barra) => {
      if (barra.id !== barraId) return barra;
      if (!match) {
        return { ...barra, aluminioQuery: value };
      }
      return {
        ...barra,
        selectedAluminio: match.nombre,
        aluminioQuery: match.nombre,
        info: {
          ...barra.info,
          fila: match.fila || '',
          columna: match.columna || '',
          stock: true
        }
      };
    }));
  };

  const handleSeleccionarAluminioBarra = (barraId, nombreAluminio) => {
    handleBuscarAluminioBarra(barraId, nombreAluminio);
    setAluminioDropdownAbierto((prev) => ({ ...prev, [barraId]: false }));
  };

  const handleAgregarCorteAluminio = (barraId) => {
    const barraActual = barras.find((barra) => barra.id === barraId);
    if (!barraActual) {
      return;
    }

    const input = corteAluminioInputPorBarra[barraId] || { largo: '', cantidad: '1' };
    const largo = parseFloat(input.largo);
    const cantidad = parseInt(input.cantidad, 10) || 1;

    if (largo && !Number.isNaN(largo) && largo > 0 && largo <= 300 && cantidad > 0) {
      const cortesBaseBarra = obtenerCortesBaseAluminio(barraActual.selectedAluminio);
      const cortesCustomBarra = cortesAluminioAgregadosPorBarra[barraId] || [];
      const cortesActivosBarra = cortesCustomBarra.length > 0 ? cortesCustomBarra : cortesBaseBarra;
      const totalUsadoActual = cortesActivosBarra.reduce((acc, corte) => acc + (corte.largo_cm || 0), 0);
      const totalNuevo = totalUsadoActual + (largo * cantidad);

      if (totalUsadoActual >= largoBarraCm) {
        onToast && onToast('La barra de aluminio ya está llena', 'error');
        return;
      }
      if (totalNuevo > largoBarraCm) {
        onToast && onToast('La barra de aluminio ya está llena', 'error');
        return;
      }

      const nuevosCortes = [];
      for (let i = 0; i < cantidad; i++) {
        nuevosCortes.push({ id: Date.now() + i, largo_cm: largo });
      }
      setCortesAluminioAgregadosPorBarra((prev) => ({
        ...prev,
        [barraId]: [...(prev[barraId] || []), ...nuevosCortes]
      }));
      setCorteAluminioInputPorBarra((prev) => ({
        ...prev,
        [barraId]: { largo: '', cantidad: '1' }
      }));
      if (totalNuevo >= largoBarraCm) {
        onToast && onToast('La barra de aluminio ya está llena', 'success');
      }
    } else if (largo > 300) {
      onToast && onToast('La medida máxima permitida es 300 cm (3 metros)', 'error');
    } else {
      onToast && onToast('Ingresa valores válidos para largo y cantidad', 'error');
    }
  };

  const handleEliminarCorteAluminio = (barraId, id) => {
    setCortesAluminioAgregadosPorBarra((prev) => ({
      ...prev,
      [barraId]: (prev[barraId] || []).filter((c) => c.id !== id)
    }));
  };

  const handleAgregarCorteVidrio = () => {
    if (!selectedVidrio) {
      onToast && onToast('Selecciona primero una plancha de vidrio', 'error');
      return;
    }
    const input = corteVidrioInputPorPlancha[selectedVidrio] || { ancho: '', alto: '', cantidad: '1' };
    const ancho = parseFloat(input.ancho);
    const alto = parseFloat(input.alto);
    const cantidad = parseInt(input.cantidad, 10) || 1;
    
    if (ancho && alto && !isNaN(ancho) && !isNaN(alto) && ancho > 0 && alto > 0 && ancho <= 300 && alto <= 300 && cantidad > 0) {
      const nuevosCortes = [];
      for (let i = 0; i < cantidad; i++) {
        nuevosCortes.push({ id: Date.now() + i, ancho_cm: ancho, alto_cm: alto });
      }

      const cortesConNuevos = [...cortesVidrioActivosSeleccionado, ...nuevosCortes];
      const piezasValidasConNuevos = cortesConNuevos.filter((corte) => (corte.ancho_cm > 0 && corte.alto_cm > 0));
      const distribucionConNuevos = calcularDistribucionVidrio(cortesConNuevos);
      const areaUsadaConNuevos = distribucionConNuevos.reduce((acc, c) => acc + (c.ancho_cm * c.alto_cm), 0);

      if (distribucionConNuevos.length < piezasValidasConNuevos.length) {
        onToast && onToast('La plancha de vidrio ya está llena', 'error');
        return;
      }

      setCortesVidrioAgregadosPorPlancha((prev) => ({
        ...prev,
        [selectedVidrio]: [...(prev[selectedVidrio] || []), ...nuevosCortes]
      }));
      setCorteVidrioInputPorPlancha((prev) => ({
        ...prev,
        [selectedVidrio]: { ancho: '', alto: '', cantidad: '1' }
      }));
      if (areaUsadaConNuevos >= areaPlanchaVidrio) {
        onToast && onToast('La plancha de vidrio ya está llena', 'success');
      }
    } else if (ancho > 300 || alto > 300) {
      onToast && onToast('La medida máxima permitida es 300 cm (3 metros)', 'error');
    } else {
      onToast && onToast('Ingresa valores válidos para ancho, alto y cantidad', 'error');
    }
  };

  const handleEliminarCorteVidrio = (id) => {
    if (!selectedVidrio) return;
    setCortesVidrioAgregadosPorPlancha((prev) => ({
      ...prev,
      [selectedVidrio]: (prev[selectedVidrio] || []).filter((c) => c.id !== id)
    }));
    setPosicionesVidrioManualPorPlancha((prev) => {
      const porPlancha = { ...(prev[selectedVidrio] || {}) };
      delete porPlancha[String(id)];
      return {
        ...prev,
        [selectedVidrio]: porPlancha
      };
    });
  };

  const handleSeleccionarPlanchaVidrio = (value) => {
    setVidrioQuery(value);
  };

  const handleAgregarPlanchaTrabajo = () => {
    const match = obtenerVidrioPorNombre(vidrioQuery);
    if (!match) {
      onToast && onToast('Selecciona una plancha válida del almacén', 'error');
      return;
    }
    const id = `pl_${Date.now()}`;
    setPlanchasTrabajo((prev) => [...prev, { id, nombre: match.nombre }]);
    setSelectedVidrio(id);
    setVidrioQuery(match.nombre);
  };

  const construirItemsDescuentoStock = () => {
    const itemsMap = {};

    // Descuento por uso real en PRODUCTOS:
    // 1 por cada barra de aluminio seleccionada y 1 por cada plancha de vidrio seleccionada.
    const conteoPorNombre = {};
    (planchasTrabajo || []).forEach((plancha) => {
      const nombre = normalizarTextoBusqueda(plancha?.nombre);
      if (!nombre) return;
      conteoPorNombre[nombre] = (conteoPorNombre[nombre] || 0) + 1;
    });
    (barras || []).forEach((barra) => {
      const nombre = normalizarTextoBusqueda(barra?.selectedAluminio);
      if (!nombre) return;
      conteoPorNombre[nombre] = (conteoPorNombre[nombre] || 0) + 1;
    });

    Object.entries(conteoPorNombre).forEach(([nombreNormalizado, cantidadRepetida]) => {
      if (!cantidadRepetida || cantidadRepetida <= 0) return;

      const matchSeleccionado = (productosSeleccionados || []).find((item) =>
        normalizarTextoBusqueda(item?.nombre) === nombreNormalizado
      );
      const matchCatalogo = (productosCatalogo || []).find((item) =>
        normalizarTextoBusqueda(item?.nombre) === nombreNormalizado
      );
      const pid = obtenerProductoIdDesdeItem(matchSeleccionado) || obtenerProductoIdDesdeItem(matchCatalogo);
      if (!pid) return;

      itemsMap[pid] = Number(itemsMap[pid] || 0) + Number(cantidadRepetida);
    });

    // Fallback: si no hubo uso en PRODUCTOS, descontar lo confirmado en selección general.
    if (Object.keys(itemsMap).length === 0) {
      (productosSeleccionados || []).forEach((item) => {
        const pid = obtenerProductoIdDesdeItem(item);
        if (!pid) return;
        const cantidad = Math.max(1, parseInt(item?.cantidad_seleccionada || item?.cantidad || 1, 10) || 1);
        itemsMap[pid] = Number(itemsMap[pid] || 0) + cantidad;
      });
    }

    return Object.entries(itemsMap)
      .map(([producto_id, cantidad]) => ({ producto_id, cantidad: Number(cantidad) }))
      .filter((item) => item.producto_id && item.cantidad > 0);
  };

  const generarReportePDF = async () => {
    try {
      // Convertir SVG a imagen PNG
      const svgToImage = (svgElement) => {
        if (!svgElement) return null;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        return new Promise((resolve) => {
          img.onload = () => {
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = url;
        });
      };

      // Obtener imágenes
      const imgAluminio = await svgToImage(svgAluminioRef.current);
      const imgVidrio = await svgToImage(svgVidrioRef.current);

      // Preparar datos de productos y cortes
      const productosAluminio = aluminios.map(p => ({
        nombre: p.producto_nombre,
        cortes: (p.cortes || []).map(c => ({
          ancho: c.ancho_cm,
          alto: c.alto_cm,
          cantidad: 1
        }))
      }));

      const productosVidrio = vidriosUnicos.map(v => ({
        nombre: v.nombre,
        ubication: `Fila ${v.fila} / Col ${v.columna}`,
        cortes: v.cortes.map(c => ({
          ancho: c.ancho_cm,
          alto: c.alto_cm,
          cantidad: 1
        }))
      }));

      // Generar HTML del reporte
      const contenidoHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte de Cortes - VIDRIOBRAS</title>
          <style>
            * { margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
            .container { max-width: 900px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 15px; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .header p { font-size: 12px; color: #666; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section-title { font-size: 16px; font-weight: bold; background-color: #f0f0f0; padding: 10px; margin-bottom: 15px; border-left: 4px solid #cc0000; }
            .diagram { margin: 20px 0; text-align: center; }
            .diagram img { max-width: 100%; height: auto; border: 1px solid #ccc; }
            .diagraM-title { font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #333; }
            .productos-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .productos-table th, .productos-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .productos-table th { background-color: #333; color: white; font-weight: bold; }
            .productos-table tr:nth-child(even) { background-color: #f9f9f9; }
            .cortes-detail { margin-left: 30px; font-size: 11px; margin-top: 8px; }
            .corte-item { display: inline-block; margin-right: 15px; }
            .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; }
            .fecha { font-size: 12px; color: #666; margin-bottom: 12px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>REPORTE DE ENTREGAS</h1>
              <p>VIDRIOBRAS - Gestión de Producción</p>
              <div class="fecha">Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
            </div>

            <!-- Sección PRODUCTOS SELECCIONADOS -->
            <div class="section">
              <div class="section-title">📦 PRODUCTOS SELECCIONADOS</div>
              
              ${productosSeleccionados.length > 0 ? `
                <table class="productos-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Descripción</th>
                      <th>Código</th>
                      <th>Categoría</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productosSeleccionados.map(p => `
                      <tr>
                        <td><strong>${p.nombre || '-'}</strong></td>
                        <td>${p.descripcion || '-'}</td>
                        <td>${p.codigo || '-'}</td>
                        <td>${p.categoria || '-'}</td>
                        <td>${p.cantidad_seleccionada || 1}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color: #999;">Sin productos seleccionados</p>'}
            </div>

            <!-- Sección ALUMINIOS -->
            <div class="section">
              <div class="section-title">📐 CORTES DE ALUMINIO</div>
              
              ${imgAluminio ? `
                <div class="diagram">
                  <div class="diagraM-title">Distribución de Aluminio en Barra de 300cm</div>
                  <img src="${imgAluminio}" alt="Diagrama de Aluminio">
                </div>
              ` : ''}

              ${productosAluminio.length > 0 ? `
                <table class="productos-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad Cortes</th>
                      <th>Detalles (Remetreo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productosAluminio.map(p => `
                      <tr>
                        <td><strong>${p.nombre}</strong></td>
                        <td>${p.cortes.length}</td>
                        <td>
                          <div class="cortes-detail">
                            ${p.cortes.map((c, i) => `<span class="corte-item">${i + 1}. ${c.ancho}cm</span>`).join('')}
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color: #999;">Sin cortes de aluminio registrados</p>'}
            </div>

            <!-- Sección VIDRIOS -->
            <div class="section">
              <div class="section-title">🔷 CORTES DE VIDRIO</div>
              
              ${imgVidrio ? `
                <div class="diagram">
                  <div class="diagraM-title">Distribución de Vidrio en Plancha 300×300cm</div>
                  <img src="${imgVidrio}" alt="Diagrama de Vidrio">
                </div>
              ` : ''}

              ${productosVidrio.length > 0 ? `
                <table class="productos-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad Cortes</th>
                      <th>Detalles (Remetreo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productosVidrio.map(v => `
                      <tr>
                        <td><strong>${v.nombre}</strong></td>
                        <td>${v.cortes.length}</td>
                        <td>
                          <div class="cortes-detail">
                            ${v.cortes.map((c, i) => `<span class="corte-item">${i + 1}. ${c.ancho}×${c.alto}</span>`).join('')}
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color: #999;">Sin cortes de vidrio registrados</p>'}
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>&copy; 2026 VIDRIOBRAS - Sistema de Gestión de Entregas | Reporte Generado Automáticamente</p>
            </div>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      // Abrir en nueva ventana para impresión/PDF
      const ventana = window.open('', '_blank');
      ventana.document.write(contenidoHTML);
      ventana.document.close();

      // Retornar datos para finalización
      return {
        aluminios: productosAluminio,
        vidrios: productosVidrio,
        productos: productosSeleccionados, // Incluir productos seleccionados
        imgAluminio,
        imgVidrio
      };
    } catch (error) {
      console.error('Error generando PDF:', error);
      onToast && onToast('Error al generar el PDF', 'error');
      return null;
    }
  };

  const finalizarEntregaCompleta = async () => {
    if (finalizando) return;
    setFinalizando(true);

    try {
      const itemsStock = construirItemsDescuentoStock();
      let stockData = null;
      if (itemsStock.length > 0) {
        const stockResponse = await fetch('/api/barra_progreso/servicio/descontar-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carrito_id: carritoId || null, items: itemsStock })
        });
        stockData = await stockResponse.json();
        if (!stockData.success) {
          const detalle = stockData.message || stockData.error || 'No se pudo actualizar stock';
          onToast && onToast(detalle, 'error');
          return;
        }
      }

      const response = await fetch('/api/barra_progreso/servicio/estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: notificacion?.id_cliente || notificacion?.cliente_id || localStorage.getItem('cliente_id') || null,
          cliente_nombre: notificacion?.nombre || localStorage.getItem('cliente_nombre') || null,
          cliente_correo: notificacion?.correo || localStorage.getItem('cliente_correo') || null,
          estado: 'instalacion'
        })
      });

      const data = await response.json();
      if (data.success) {
        const clienteSyncId = String(
          notificacion?.id_cliente || notificacion?.cliente_id || localStorage.getItem('cliente_id') || ''
        ).trim();

        if (clienteSyncId) {
          try {
            const syncPayload = {
              cliente_id: clienteSyncId,
              estado: 'instalacion',
              at: Date.now()
            };
            localStorage.setItem('servicio_estado_sync', JSON.stringify(syncPayload));
            window.dispatchEvent(new CustomEvent('servicio_estado_actualizado', { detail: syncPayload }));
          } catch (e) {
            console.warn('[PRODUCTOS] No se pudo emitir sincronizacion de estado:', e);
          }
        }

        if (Array.isArray(stockData?.actualizados) && stockData.actualizados.length > 0) {
          setProductosCatalogo((prev) => {
            const cambios = new Map(
              stockData.actualizados.map((item) => [String(item?.producto_id || '').trim(), Number(item?.nuevo)])
            );
            let changed = false;
            const next = (prev || []).map((p) => {
              const pid = String(p?.id_producto || '').trim();
              if (!cambios.has(pid)) return p;
              const nuevaCantidad = cambios.get(pid);
              if (!Number.isFinite(nuevaCantidad)) return p;
              changed = true;
              return { ...p, cantidad: nuevaCantidad };
            });
            return changed ? next : prev;
          });
        }

        localStorage.removeItem('productosSeleccionadosEntrega');
        setProductosSeleccionados([]);
        onToast && onToast('Stock descontado y servicio actualizado a instalación', 'success');
        onGuardarSuccess && onGuardarSuccess();
      } else {
        onToast && onToast(data.message || 'Error al actualizar estado del servicio', 'error');
      }
    } catch (error) {
      console.error('Error actualizando servicio en productos:', error);
      onToast && onToast('Error al actualizar estado del servicio: ' + error.message, 'error');
    } finally {
      setFinalizando(false);
    }
  };

  const glassPanelStyle = {
    background: BRAND_THEME.panelGradient,
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)',
    border: BRAND_THEME.glassBorder,
    borderRadius: '12px',
    boxShadow: BRAND_THEME.glassShadow
  };

  const sunkenInputStyle = {
    background: 'rgba(255,255,255,0.78)',
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: '8px',
    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.16), inset 0 -1px 2px rgba(255,255,255,0.62)',
    color: COLORS.text,
    fontFamily: FONTS.body,
    transition: 'all 0.2s ease'
  };

  const sectionLabelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
    fontFamily: FONTS.heading,
    color: COLORS.text,
    letterSpacing: '0.4px'
  };

  return (
    <div style={{
      padding: isMobile ? '10px' : '14px',
      borderRadius: '14px',
      background: 'linear-gradient(165deg, rgba(255,255,255,0.68), rgba(199,236,255,0.42))',
      border: `1px solid ${COLORS.borderStrong}`,
      boxShadow: '0 10px 35px rgba(15,23,42,0.08)',
      animation: 'panelIn 0.45s ease'
    }}>
      {/* ─── OVERLAY DE PROCESAMIENTO ─── */}
      {finalizando && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(30, 30, 40, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20
          }}>
            <IconLoader size={48} style={{ animation: 'spin 1s linear infinite' }} stroke={2} color={COLORS.primary} />
            <p style={{
              fontSize: 15,
              color: '#ffffff',
              fontWeight: 500,
              letterSpacing: '0.3px'
            }}>
              Procesando...
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes planchaGlow {
          0% { box-shadow: 0 0 0 rgba(90,139,168,0); }
          50% { box-shadow: 0 0 14px rgba(90,139,168,.22); }
          100% { box-shadow: 0 0 0 rgba(90,139,168,0); }
        }
      `}</style>

      <h3 style={{
        fontSize: isMobile ? 16 : 18,
        fontWeight: 800,
        marginBottom: 16,
        fontFamily: FONTS.heading,
        color: COLORS.text,
        letterSpacing: '0.6px',
        textTransform: 'uppercase'
      }}>Productos</h3>

      {showHeader && (
        <>
          {/* Header: Cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '20px', alignItems: 'end', ...glassPanelStyle, padding: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, fontFamily: FONTS.heading, color: COLORS.text }}>CLIENTE</label>
              <input
                type="text"
                defaultValue={notificacion?.nombre || ''}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  ...sunkenInputStyle,
                  fontWeight: 500,
                  fontSize: 14
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Layout dos columnas: Área con barras | Aluminios */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1.2fr 2fr', gap: '16px', marginBottom: '20px', alignItems: 'start' }}>
        {/* Columna izquierda: ALUMINIOS con cortes */}
        <div style={{ ...glassPanelStyle, border: `1px solid ${COLORS.text}55`, padding: '12px', animation: 'panelIn 0.5s ease' }}>
          <h4 style={{ fontFamily: FONTS.heading, fontWeight: 700, marginBottom: 12, textAlign: 'center', fontSize: 14, color: COLORS.text }}>ALUMINIOS</h4>
          {barras.map((barra) => {
            const cortesBaseBarra = obtenerCortesBaseAluminio(barra.selectedAluminio);
            const cortesCustomBarra = cortesAluminioAgregadosPorBarra[barra.id] || [];
            const cortesActivosBarra = cortesCustomBarra.length > 0 ? cortesCustomBarra : cortesBaseBarra;
            const inputBarra = corteAluminioInputPorBarra[barra.id] || { largo: '', cantidad: '1' };
            const totalUsadoBarra = cortesActivosBarra.reduce((acc, corte) => acc + (corte.largo_cm || 0), 0);
            const porcentajeUsadoBarra = Math.min((totalUsadoBarra / largoBarraCm) * 100, 100);
            const barraLlena = totalUsadoBarra >= largoBarraCm;

            return (
              <div key={barra.id} style={{ ...glassPanelStyle, border: `1px solid ${COLORS.text}45`, padding: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: COLORS.text }}>{barra.nombre}</span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={sectionLabelStyle}>ALUMINIO A USAR</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={barra.aluminioQuery || ''}
                      onFocus={() => setAluminioDropdownAbierto((prev) => ({ ...prev, [barra.id]: true }))}
                      onBlur={() => setTimeout(() => setAluminioDropdownAbierto((prev) => ({ ...prev, [barra.id]: false })), 140)}
                      onChange={(e) => {
                        handleBuscarAluminioBarra(barra.id, e.target.value);
                        setAluminioDropdownAbierto((prev) => ({ ...prev, [barra.id]: true }));
                      }}
                      placeholder="Escribe y selecciona aluminio"
                      style={{
                        width: '100%',
                        padding: '6px',
                        ...sunkenInputStyle,
                        fontSize: 10,
                        backgroundColor: 'rgba(255,255,255,0.72)'
                      }}
                    />

                    {aluminioDropdownAbierto[barra.id] && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 30,
                        marginTop: 4,
                        maxHeight: 180,
                        overflowY: 'auto',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 6,
                        background: COLORS.white,
                        boxShadow: '0 10px 24px rgba(0,0,0,0.12)'
                      }}>
                        {aluminiosDisponibles
                          .filter((aluminio) => normalizarTextoBusqueda(aluminio.nombre).includes(normalizarTextoBusqueda(barra.aluminioQuery)))
                          .map((aluminio, idx) => (
                            <button
                              key={`${barra.id}-${aluminio.nombre}-${idx}`}
                              onMouseDown={() => handleSeleccionarAluminioBarra(barra.id, aluminio.nombre)}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 10px',
                                border: 'none',
                                borderBottom: `1px solid ${COLORS.gray[200]}`,
                                background: 'transparent',
                                fontSize: 11,
                                fontFamily: FONTS.body,
                                color: COLORS.text,
                                cursor: 'pointer'
                              }}
                            >
                              {aluminio.nombre}
                            </button>
                          ))}
                        {aluminiosDisponibles.filter((aluminio) => normalizarTextoBusqueda(aluminio.nombre).includes(normalizarTextoBusqueda(barra.aluminioQuery))).length === 0 && (
                          <div style={{ padding: '8px 10px', fontSize: 10, color: COLORS.textLight, fontFamily: FONTS.body }}>
                            Sin coincidencias
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isTinyMobile ? '1fr' : '1fr 1fr', gap: '8px', fontSize: 11 }}>
                  <div>
                    <label style={sectionLabelStyle}>FILA</label>
                    <input
                      type="text"
                      readOnly
                      value={barra.info.fila || ''}
                      style={{ width: '100%', padding: '6px', ...sunkenInputStyle, fontSize: 10, backgroundColor: 'rgba(241,245,249,0.68)' }}
                    />
                  </div>
                  <div>
                    <label style={sectionLabelStyle}>COLUMNA</label>
                    <input
                      type="text"
                      readOnly
                      value={barra.info.columna || ''}
                      style={{ width: '100%', padding: '6px', ...sunkenInputStyle, fontSize: 10, backgroundColor: 'rgba(241,245,249,0.68)' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: 11, gap: 8, fontFamily: FONTS.body, color: COLORS.text }}>
                    <input type="checkbox" checked={barra.info.stock} readOnly />
                    <span>SI HAY EN STOCK</span>
                  </label>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={sectionLabelStyle}>AGREGAR CORTE (cm)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    <input
                      type="number"
                      placeholder="Largo (cm)"
                      max={300}
                      value={inputBarra.largo}
                      onKeyDown={bloquearEntradaNoNumerica}
                      onChange={(e) => setCorteAluminioInputPorBarra((prev) => ({ ...prev, [barra.id]: { ...inputBarra, largo: limitarMedidaCm(sanitizarEntradaNumerica(e.target.value, true)) } }))}
                      style={{
                        flex: isMobile ? '1 1 100%' : 1,
                        padding: '6px',
                        ...sunkenInputStyle,
                        fontSize: 10,
                        backgroundColor: 'rgba(255,255,255,0.72)'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={inputBarra.cantidad}
                      onKeyDown={bloquearEntradaNoNumerica}
                      onChange={(e) => setCorteAluminioInputPorBarra((prev) => ({ ...prev, [barra.id]: { ...inputBarra, cantidad: sanitizarEntradaNumerica(e.target.value, false) } }))}
                      style={{
                        width: isMobile ? 'calc(50% - 4px)' : '80px',
                        padding: '6px',
                        ...sunkenInputStyle,
                        fontSize: 10,
                        backgroundColor: 'rgba(255,255,255,0.72)'
                      }}
                    />
                    <button
                      onClick={() => handleAgregarCorteAluminio(barra.id)}
                      style={{
                        padding: '6px 12px',
                        width: isMobile ? 'calc(50% - 4px)' : 'auto',
                        background: COLORS.accent,
                        color: COLORS.primaryDark,
                        border: '1px solid rgba(255,255,255,0.34)',
                        borderRadius: '8px',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: FONTS.heading,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Agregar
                    </button>
                  </div>

                  {cortesCustomBarra.length > 0 && (
                    <div style={{ background: 'rgba(241,245,249,0.48)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: '6px', fontFamily: FONTS.heading, color: COLORS.text }}>Cortes agregados ({cortesCustomBarra.length}):</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {cortesCustomBarra.map((corte, idx) => (
                          <div key={corte.id} style={{
                            background: COLORS.white,
                            border: `1px solid ${COLORS.text}`,
                            borderRadius: '3px',
                            padding: '4px 8px',
                            fontSize: '10px',
                            fontFamily: FONTS.body,
                            color: COLORS.text,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>#{idx + 1}: {corte.largo_cm}cm</span>
                            <button
                              onClick={() => handleEliminarCorteAluminio(barra.id, corte.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: COLORS.error,
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '0',
                                lineHeight: '1'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleEliminarBarra(barra.id)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: BRAND_THEME.redGradient,
                      color: COLORS.white,
                      border: '1px solid rgba(255,255,255,0.34)',
                      borderRadius: '8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: FONTS.heading,
                      marginBottom: '8px'
                    }}
                  >
                    Eliminar barra
                  </button>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>Barra 300 cm</div>

                  {barraLlena && (
                    <div style={{
                      marginBottom: '6px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: COLORS.accent,
                      color: COLORS.primaryDark,
                      fontSize: 10,
                      fontWeight: 700,
                      textAlign: 'center',
                      fontFamily: FONTS.heading
                    }}>
                      BARRA LLENA
                    </div>
                  )}

                  {cortesActivosBarra.length > 0 ? (
                    <svg
                      ref={svgAluminioRef}
                      width="100%"
                      height="50"
                      viewBox="0 0 300 50"
                      style={{ border: `1px solid ${COLORS.text}`, borderRadius: '4px', background: COLORS.gray[200], marginBottom: '8px' }}
                    >
                      <rect x="10" y="15" width="280" height="20" fill={COLORS.gray[300]} stroke={COLORS.text} strokeWidth="1" />

                      {(() => {
                        let xPos = 10;
                        const colors = [COLORS.secondary, COLORS.primary, COLORS.accent, COLORS.secondaryDark, COLORS.primaryLight];
                        return cortesActivosBarra.map((corte, idx) => {
                          const width = (corte.largo_cm / largoBarraCm) * 280;
                          const color = colors[idx % colors.length];
                          const result = (
                            <g key={`${corte.id_corte || corte.id || idx}`}>
                              <rect
                                x={xPos}
                                y="15"
                                width={width}
                                height="20"
                                fill={color}
                                stroke={COLORS.text}
                                strokeWidth="1"
                                opacity="0.8"
                              />
                              {width > 25 && (
                                <text
                                  x={xPos + width / 2}
                                  y="28"
                                  fontSize="10"
                                  fill={COLORS.white}
                                  textAnchor="middle"
                                  fontWeight="bold"
                                >
                                  {corte.largo_cm}cm
                                </text>
                              )}
                            </g>
                          );
                          xPos += width;
                          return result;
                        });
                      })()}

                      <text x="10" y="50" fontSize="9" fill={COLORS.text}>0</text>
                      <text x="285" y="50" fontSize="9" fill={COLORS.text}>300</text>
                    </svg>
                  ) : (
                    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px', background: COLORS.border, marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', color: COLORS.textLight }}>Sin cortes de aluminio</div>
                    </div>
                  )}

                  <div style={{ border: `1px solid ${COLORS.text}66`, borderRadius: '10px', padding: '8px', background: 'rgba(226,232,240,0.58)' }}>
                    <div style={{ width: '100%', height: '18px', background: '#e2e8f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: `${porcentajeUsadoBarra}%`, height: '100%', background: COLORS.info }} />
                      <div style={{ position: 'absolute', top: '2px', left: '8px', fontSize: '10px', fontWeight: 600, color: COLORS.text }}>0 cm</div>
                      <div style={{ position: 'absolute', top: '2px', right: '8px', fontSize: '10px', fontWeight: 600, color: COLORS.text }}>{largoBarraCm} cm</div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: COLORS.text }}>
                      Usado: {totalUsadoBarra} cm de {largoBarraCm} cm
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px' }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: COLORS.text }}>Cortes:</div>
                      {cargandoCortes ? (
                        <div style={{ color: COLORS.textLight }}>Cargando cortes...</div>
                      ) : cortesActivosBarra.length === 0 ? (
                        <div style={{ color: COLORS.textLight }}>Sin cortes de aluminio</div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {cortesActivosBarra.map((corte, idx) => (
                            <span key={`${corte.id_corte || corte.id || idx}`} style={{ background: COLORS.info, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '4px 8px', fontSize: '10px', color: COLORS.white }}>
                              {corte.largo_cm} cm
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={handleAgregarBarra}
            style={{
              width: '100%',
              background: COLORS.accent,
              color: COLORS.primaryDark,
              border: '1px solid rgba(255,255,255,0.34)',
              borderRadius: '8px',
              padding: '8px',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: FONTS.heading
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span> Agregar Barra
          </button>
        </div>

        {/* Columna derecha: VIDRIO / Plancha con área de corte */}
        <div>
          <div style={{ ...glassPanelStyle, border: `1px solid ${COLORS.text}55`, padding: '12px', marginBottom: '12px', animation: 'panelIn 0.6s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0, marginBottom: '12px' }}>
              <h4 style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 13, color: COLORS.text }}>VIDRIO</h4>

              {vidriosDisponibles.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                  <div style={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
                    <input
                      value={vidrioQuery}
                      onFocus={() => setVidrioDropdownAbierto(true)}
                      onBlur={() => setTimeout(() => setVidrioDropdownAbierto(false), 140)}
                      onChange={(e) => {
                        setVidrioQuery(e.target.value);
                        setVidrioDropdownAbierto(true);
                      }}
                      placeholder="Buscar plancha de vidrio"
                      style={{
                        padding: '6px 8px',
                        fontSize: 10,
                        fontFamily: FONTS.body,
                        fontWeight: 600,
                        ...sunkenInputStyle,
                        backgroundColor: 'rgba(255,255,255,0.72)',
                        color: COLORS.text,
                        minWidth: isMobile ? '0' : '180px',
                        width: isMobile ? '100%' : 'auto'
                      }}
                    />
                    {vidrioDropdownAbierto && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 30,
                        background: COLORS.white,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxHeight: 180,
                        overflowY: 'auto',
                        minWidth: isMobile ? '0' : '220px'
                      }}>
                        {vidriosDisponibles
                          .filter((v) => coincideBusquedaVidrio(v, vidrioQuery))
                          .map((v) => (
                            <button
                              key={v.nombre}
                              onMouseDown={() => {
                                handleSeleccionarPlanchaVidrio(v.nombre);
                                setVidrioDropdownAbierto(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '7px 10px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontFamily: FONTS.body,
                                fontSize: 11,
                                color: COLORS.text
                              }}
                            >
                              {v.nombre}{v.grosor ? ` (${v.grosor})` : ''}
                            </button>
                          ))}
                        {vidriosDisponibles.filter((v) => coincideBusquedaVidrio(v, vidrioQuery)).length === 0 && (
                          <div style={{ padding: '8px 10px', fontSize: 10, color: COLORS.muted, fontFamily: FONTS.body }}>
                            Sin coincidencias
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAgregarPlanchaTrabajo}
                    style={{
                      padding: '6px 8px',
                      flexShrink: 0,
                      border: '1px solid rgba(255,255,255,0.34)',
                      borderRadius: '8px',
                      background: COLORS.accent,
                      color: COLORS.primaryDark,
                      fontWeight: 700,
                      fontFamily: FONTS.heading,
                      cursor: 'pointer'
                    }}
                    title="Agregar otra plancha"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {planchasTrabajo.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {planchasTrabajo.map((plancha) => (
                  <div
                    key={plancha.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: `1px solid ${selectedVidrio === plancha.id ? COLORS.text : COLORS.border}`,
                      background: selectedVidrio === plancha.id ? COLORS.info : COLORS.white,
                      borderRadius: '999px',
                      padding: '4px 8px 4px 10px'
                    }}
                  >
                    <span
                      onClick={() => {
                        setSelectedVidrio(plancha.id);
                        setVidrioQuery(plancha.nombre);
                      }}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: FONTS.body,
                        color: selectedVidrio === plancha.id ? COLORS.white : COLORS.text
                      }}
                    >
                      {plancha.nombre}
                    </span>
                    <span
                      onClick={() => {
                        const nuevas = planchasTrabajo.filter((p) => p.id !== plancha.id);
                        setPlanchasTrabajo(nuevas);
                        setPosicionesVidrioManualPorPlancha((prev) => {
                          const next = { ...prev };
                          delete next[plancha.id];
                          return next;
                        });
                        if (selectedVidrio === plancha.id) {
                          const siguiente = nuevas[0] || null;
                          setSelectedVidrio(siguiente ? siguiente.id : null);
                          setVidrioQuery(siguiente ? siguiente.nombre : '');
                        }
                      }}
                      title="Eliminar plancha"
                      style={{
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: selectedVidrio === plancha.id ? COLORS.white : COLORS.textLight,
                        opacity: 0.8
                      }}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Nombre del producto */}
            {selectedVidrio && (
              <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(241,245,249,0.62)', borderRadius: '8px', borderLeft: `3px solid ${COLORS.info}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, fontFamily: FONTS.heading, color: COLORS.text }}>
                  {selectedVidrioNombre || 'Producto'}
                </div>
              </div>
            )}

            {/* Área de medidas - Agregar cortes */}
            <div style={{ marginBottom: '12px' }}>
              <label style={sectionLabelStyle}>AGREGAR CORTE (cm)</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <input
                  type="number"
                  placeholder="Ancho"
                  max={300}
                  value={(corteVidrioInputPorPlancha[selectedVidrio] || { ancho: '', alto: '', cantidad: '1' }).ancho}
                  onKeyDown={bloquearEntradaNoNumerica}
                  onChange={(e) => setCorteVidrioInputPorPlancha((prev) => ({ ...prev, [selectedVidrio]: { ...(prev[selectedVidrio] || { ancho: '', alto: '', cantidad: '1' }), ancho: limitarMedidaCm(sanitizarEntradaNumerica(e.target.value, true)) } }))}
                  style={{
                    flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
                    padding: '6px',
                    ...sunkenInputStyle,
                    fontSize: 10,
                    backgroundColor: 'rgba(255,255,255,0.72)'
                  }}
                />
                <input
                  type="number"
                  placeholder="Alto"
                  max={300}
                  value={(corteVidrioInputPorPlancha[selectedVidrio] || { ancho: '', alto: '', cantidad: '1' }).alto}
                  onKeyDown={bloquearEntradaNoNumerica}
                  onChange={(e) => setCorteVidrioInputPorPlancha((prev) => ({ ...prev, [selectedVidrio]: { ...(prev[selectedVidrio] || { ancho: '', alto: '', cantidad: '1' }), alto: limitarMedidaCm(sanitizarEntradaNumerica(e.target.value, true)) } }))}
                  style={{
                    flex: isMobile ? '1 1 calc(50% - 4px)' : 1,
                    padding: '6px',
                    ...sunkenInputStyle,
                    fontSize: 10,
                    backgroundColor: 'rgba(255,255,255,0.72)'
                  }}
                />
                <input
                  type="number"
                  placeholder="Cantidad"
                  value={(corteVidrioInputPorPlancha[selectedVidrio] || { ancho: '', alto: '', cantidad: '1' }).cantidad}
                  onKeyDown={bloquearEntradaNoNumerica}
                  onChange={(e) => setCorteVidrioInputPorPlancha((prev) => ({ ...prev, [selectedVidrio]: { ...(prev[selectedVidrio] || { ancho: '', alto: '', cantidad: '1' }), cantidad: sanitizarEntradaNumerica(e.target.value, false) } }))}
                  style={{
                    width: isMobile ? 'calc(50% - 4px)' : '80px',
                    padding: '6px',
                    ...sunkenInputStyle,
                    fontSize: 10,
                    backgroundColor: 'rgba(255,255,255,0.72)'
                  }}
                />
                <button
                  onClick={handleAgregarCorteVidrio}
                  style={{
                    padding: '6px 12px',
                    width: isMobile ? 'calc(50% - 4px)' : 'auto',
                    background: COLORS.accent,
                    color: COLORS.primaryDark,
                    border: '1px solid rgba(255,255,255,0.34)',
                    borderRadius: '8px',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: FONTS.heading,
                    whiteSpace: 'nowrap'
                  }}
                >
                  + Agregar
                </button>
              </div>

              {/* Lista de cortes agregados */}
              {cortesVidrioAgregadosSeleccionado.length > 0 && (
                <div style={{ background: 'rgba(241,245,249,0.48)', border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '8px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: '6px', fontFamily: FONTS.heading, color: COLORS.text }}>Cortes agregados ({cortesVidrioAgregadosSeleccionado.length}):</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {cortesVidrioAgregadosSeleccionado.map((corte, idx) => (
                      <div key={corte.id} style={{ 
                        background: COLORS.white, 
                        border: `1px solid ${COLORS.text}`, 
                        borderRadius: '3px', 
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontFamily: FONTS.body,
                        color: COLORS.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>#{idx + 1}: {corte.ancho_cm}×{corte.alto_cm}cm</span>
                        <button
                          onClick={() => handleEliminarCorteVidrio(corte.id)}
                          style={{
                            background: COLORS.error,
                            color: COLORS.white,
                            border: 'none',
                            borderRadius: '2px',
                            padding: '2px 4px',
                            fontSize: '9px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Área de corte visual - Plancha 3m x 3m */}
            <div style={{
              border: `1px solid ${COLORS.text}66`,
              backgroundColor: '#f3f6fb',
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(90,139,168,.11) 0, rgba(90,139,168,.11) 1px, transparent 1px, transparent 36px), repeating-linear-gradient(90deg, rgba(90,139,168,.08) 0, rgba(90,139,168,.08) 1px, transparent 1px, transparent 64px), linear-gradient(180deg, rgba(255,255,255,.9), rgba(226,236,246,.8))',
              minHeight: isMobile ? '240px' : '280px',
              position: 'relative',
              borderRadius: '10px',
              padding: '8px',
              animation: 'planchaGlow 2.8s ease-in-out infinite'
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={handleAutoOrganizarVidrio}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(199,236,255,0.65)',
                    color: COLORS.secondaryDark,
                    border: `1px solid ${COLORS.secondary}`,
                    borderRadius: 12,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: FONTS.heading,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: 12 }}>▦</span>
                  Auto-organizar
                </button>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, marginBottom: '4px', textAlign: 'center', color: COLORS.text }}>
                PLANCHA {vidrioPlanchaAncho}cm × {vidrioPlanchaAlto}cm
              </div>
              {distribucionVidrioRender.length > 0 && (
                <div style={{ fontSize: 10, color: COLORS.textLight, marginBottom: 6, textAlign: 'center', fontFamily: FONTS.body }}>
                  Arrastra los cortes para moverlos dentro de la plancha
                </div>
              )}
              {planchaVidrioLlena && (
                <div style={{
                  marginBottom: '6px',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  background: COLORS.accent,
                  color: COLORS.primaryDark,
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: 'center',
                  fontFamily: FONTS.heading
                }}>
                  PLANCHA LLENA
                </div>
              )}
              {cortesVidrioActivosSeleccionado.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.secondary, fontSize: 42, padding: '84px 0', fontFamily: FONTS.heading, opacity: 0.75, letterSpacing: 1.2 }}>
                  Sin cortes
                </div>
              ) : (
                <svg 
                  ref={svgVidrioRef}
                  width="100%" 
                  height={isMobile ? '220' : '260'} 
                  viewBox={`0 0 ${vidrioPlanchaAncho} ${vidrioPlanchaAlto}`} 
                  style={{ border: `1px solid ${COLORS.text}`, borderRadius: 6, background: 'rgba(255,255,255,0.35)' }}
                >
                  <rect x="0" y="0" width={vidrioPlanchaAncho} height={vidrioPlanchaAlto} fill={COLORS.gray[300]} stroke={COLORS.text} strokeWidth="2" />
                  {distribucionVidrioRenderOrdenada.map((corte, idx) => (
                    <g key={corte._key}>
                      <rect
                        x={corte.x}
                        y={corte.y}
                        width={corte.ancho_cm}
                        height={corte.alto_cm}
                        fill={COLORS.gray[500]}
                        stroke="transparent"
                        strokeWidth="0"
                        opacity={dragCorteVidrio?.key === corte._key ? '0.95' : '0.75'}
                        style={{ cursor: 'move' }}
                        onMouseDown={(e) => iniciarArrastreCorteVidrio(e, corte)}
                      />
                      <text
                        x={corte.x + 4}
                        y={corte.y + 12}
                        fontSize="10"
                        fill={COLORS.text}
                        style={{ pointerEvents: 'none' }}
                      >
                        {corte.ancho_cm}×{corte.alto_cm}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Botón guardar */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          disabled={finalizando}
          style={{
            background: finalizando ? COLORS.gray[400] : BRAND_THEME.redGradient,
            color: COLORS.white,
            border: `1px solid ${finalizando ? COLORS.gray[400] : 'rgba(255,255,255,0.34)'}`,
            borderRadius: '10px',
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '440px' : 'none',
            padding: isMobile ? '11px 16px' : '10px 40px',
            fontWeight: 700,
            fontSize: 14,
            cursor: finalizando ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            fontFamily: FONTS.heading,
            boxShadow: '0 12px 24px rgba(15,23,42,0.2)',
            opacity: finalizando ? 0.6 : 1
          }}
          onClick={finalizarEntregaCompleta}
        >
          {finalizando ? 'FINALIZANDO...' : 'GUARDAR'}
        </button>
      </div>
    </div>
  );
};

export default ProductosServicio;
