/**
 * Helper para buscar cliente por documento en la BD local.
 * Usado por busquedaClienteService.js
 */
export async function buscarClientePorDocumento(documento) {
  try {
    if (!documento || documento.trim() === '') {
      return {
        encontrado: false,
        cliente: null,
        mensaje: ''
      };
    }
    
    const response = await fetch('/api/cliente/buscar_documento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento: documento.trim() })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.encontrado) {
        return {
          encontrado: true,
          cliente: data.cliente,
          mensaje: 'Cliente ya está logueado en el sistema'
        };
      } else {
        return {
          encontrado: false,
          cliente: null,
          mensaje: 'No es cliente'
        };
      }
    } else {
      return {
        encontrado: false,
        cliente: null,
        mensaje: 'Error al buscar cliente'
      };
    }
  } catch (error) {
    console.error('Error en buscarClientePorDocumento:', error);
    return {
      encontrado: false,
      cliente: null,
      mensaje: 'Error de conexión'
    };
  }
}
