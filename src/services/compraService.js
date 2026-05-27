// Realiza compra llamando al backend
export async function realizarCompra({ documento, productos, cortes, metodoPago, nombre_api_peru = '' }) {
  const res = await fetch('/api/compra/realizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documento, productos, cortes, metodo_pago: metodoPago, nombre_api_peru })
  });
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch (_) {
    return {
      success: false,
      message: `Respuesta invalida del servidor (HTTP ${res.status})`
    };
  }
}
