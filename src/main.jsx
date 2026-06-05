import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 1. Eliminamos el import problemático y definimos la constante vacía aquí mismo:
const API_BASE_URL = "";

// 2. Tu interceptor fetch sigue igual y funcionará perfecto con Nginx:
const originalFetch = window.fetch.bind(window);
window.fetch = async (resource, init) => {
  if (typeof resource === "string" && resource.startsWith("/api")) {
    resource = `${API_BASE_URL}${resource}`;
  } else if (resource instanceof Request) {
    const path = new URL(resource.url, window.location.href).pathname;
    if (path.startsWith("/api")) {
      const queryString = new URL(resource.url, window.location.href).search;
      resource = new Request(`${API_BASE_URL}${path}${queryString}`, resource);
    }
  }
  return originalFetch(resource, init);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <Routes>
      <Route path="/*" element={<App />} />
    </Routes>
  </Router>
);