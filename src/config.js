// Forzamos a que en producción use una ruta relativa. 
// Así Nginx interceptará cualquier '/api/...' y lo mandará a tu backend real.
export const API_BASE_URL = "";

export const buildApiUrl = (path = "") => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${safePath}`;
};

export const apiFetch = async (resource, init) => {
  let url = resource;

  if (typeof resource === "string") {
    if (resource.startsWith("/api")) {
      url = `${API_BASE_URL}${resource}`;
    }
  } else if (resource instanceof Request) {
    const path = new URL(resource.url, window.location.href).pathname;
    if (path.startsWith("/api")) {
      const reqUrl = `${API_BASE_URL}${path}${resource.url.includes("?") ? new URL(resource.url).search : ""}`;
      url = new Request(reqUrl, resource);
    }
  }

  const res = await fetch(url, init);

  const contentType = res.headers.get("content-type") || "";
  if (res.status >= 400) {
    const text = await res.text();
    throw new Error(`API error (${res.status}) ${res.statusText}: ${text}`);
  }
  if (contentType.includes("text/html")) {
    const text = await res.text();
    throw new Error(`API returned HTML for JSON request: ${text.slice(0, 300)}...`);
  }

  return res;
};