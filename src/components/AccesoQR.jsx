/**
 * AccesoQR.jsx
 * Ruta: /acceso?t=<jwt>
 *
 * El cliente escanea el QR del ticket → abre esta URL →
 * el JWT se guarda en localStorage → redirige a /user.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AccesoQR() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const [error, setError]   = useState(false);
  const [msg,   setMsg]     = useState("Verificando acceso...");

  useEffect(() => {
    const token = params.get("t");

    if (!token) {
      setError(true);
      setMsg("Enlace inválido. No se encontró token.");
      setTimeout(() => navigate("/login"), 2500);
      return;
    }

    try {
      // Decodificar payload del JWT (base64url → JSON)
      const parts   = token.split(".");
      if (parts.length !== 3) throw new Error("Formato inválido");

      const b64     = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded  = b64 + "=".repeat((4 - b64.length % 4) % 4);
      const payload = JSON.parse(atob(padded));

      // Verificar expiración básica (lado cliente, solo UX)
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        setError(true);
        setMsg("El enlace expiró. Solicita uno nuevo en tienda.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      // Guardar sesión
      localStorage.setItem("auth_token",  token);
      localStorage.setItem("cliente_id",  payload.sub);

      setMsg("✓ Acceso concedido. Redirigiendo...");
      setTimeout(() => navigate("/user"), 800);
    } catch (e) {
      setError(true);
      setMsg("Token inválido. Por favor acude a tienda.");
      setTimeout(() => navigate("/login"), 3000);
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg,#0d1321,#12192e)",
      color: "#fff",
      fontFamily: "Arial, sans-serif",
      gap: 16,
      padding: 32,
      textAlign: "center"
    }}>
      {/* Logo */}
      <div style={{ color: "#941918", fontWeight: 900, fontSize: 28, letterSpacing: 3 }}>
        VIDRIOBRAS
      </div>

      {/* Spinner o check */}
      {!error && (
        <div style={{
          width: 48, height: 48, border: "4px solid rgba(128,194,220,.2)",
          borderTop: "4px solid #80C2DC", borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }}/>
      )}
      {error && (
        <div style={{ fontSize: 40 }}>⚠️</div>
      )}

      <p style={{
        fontSize: 16,
        color: error ? "#ff7b7b" : "#80C2DC",
        fontWeight: 600,
        maxWidth: 320
      }}>
        {msg}
      </p>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
