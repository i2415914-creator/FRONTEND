import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../colors';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-31db4b36-66c5-4017-a197-d65775a236d4';
const USE_TEST_MODE = true;
const TEST_YAPE_PHONE = '111111111';
const TEST_YAPE_OTP = '123456';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorStyle = {
  marginTop: 6,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: 'rgba(200,235,255,0.95)',
  fontSize: 12,
  fontFamily: FONTS.body,
  fontWeight: 600,
  background: 'linear-gradient(135deg, rgba(0,20,50,0.97), rgba(0,35,70,0.99))',
  border: '1px solid rgba(128,194,220,0.55)',
  borderRadius: 8,
  padding: '6px 10px',
  boxShadow: '0 0 18px rgba(128,194,220,0.22), 0 4px 16px rgba(0,0,0,0.42), inset 0 1px 0 rgba(128,194,220,0.14)',
};

const ErrorNotice = ({ message }) => (
  <div style={errorStyle}>
    <span style={{
      position: 'absolute',
      top: -8,
      left: 16,
      width: 0,
      height: 0,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderBottom: '8px solid rgba(128,194,220,0.55)',
    }} />
    <span style={{
      position: 'absolute',
      top: -7,
      left: 17,
      width: 0,
      height: 0,
      borderLeft: '7px solid transparent',
      borderRight: '7px solid transparent',
      borderBottom: '7px solid rgba(0,35,70,0.99)',
    }} />
    <span style={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#80C2DC',
      color: '#0b3c63',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 900,
      lineHeight: 1,
      flexShrink: 0,
    }}>!</span>
    <span>{message}</span>
  </div>
);

export default function MercadoPagoYape({
  carritoId, clienteId, total, onPaymentSuccess, onPaymentError, onLoading, onBack
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(USE_TEST_MODE);
  const [mp, setMp] = useState(null);
  const [payerEmail, setPayerEmail] = useState('');
  const [yapePhone, setYapePhone] = useState('');
  const [yapeOtp, setYapeOtp] = useState('');
  const [errors, setErrors] = useState({});

  const handleExpiredSession = () => {
    ['auth_token', 'cliente_id', 'cliente_correo', 'cliente_nombre', 'cliente_numero', 'cliente_documento']
      .forEach((key) => localStorage.removeItem(key));
    onPaymentError('Se cerró su sesión, vuelva a ingresar.');
    window.location.href = '/login';
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem('cliente_correo') || '';
    if (storedEmail) setPayerEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (USE_TEST_MODE) return;
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      if (!window.MercadoPago) { onPaymentError('No se pudo cargar SDK'); return; }
      const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
      setMp(mpInstance);
      setMpLoaded(true);
    };
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [onPaymentError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!emailRegex.test(payerEmail.trim())) nextErrors.payerEmail = 'Correo inválido';
    if (!/^\d{9}$/.test(yapePhone)) nextErrors.yapePhone = 'Debe tener 9 dígitos';
    if (!/^\d{6}$/.test(yapeOtp)) nextErrors.yapeOtp = 'OTP de 6 dígitos';
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }

    if (USE_TEST_MODE) {
      if (yapePhone !== TEST_YAPE_PHONE) nextErrors.yapePhone = 'Número Yape inválido';
      if (yapeOtp !== TEST_YAPE_OTP) nextErrors.yapeOtp = 'OTP inválido';
      if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }
    }

    setIsProcessing(true);
    onLoading(true);

    // Pequeño delay para que React pinte el spinner ANTES de ejecutar lógica pesada
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      if (USE_TEST_MODE) {
        // Simular latencia de red para que el spinner sea visible
        await new Promise(resolve => setTimeout(resolve, 1200));
        const fakePaymentData = {
          success: true,
          message: 'Pago de prueba aceptado',
          payment_id: `test-yape-${Date.now()}`,
          status: 'approved',
          status_detail: 'accredited',
          amount: Number(total),
          payment_method_id: 'yape',
        };
        await onPaymentSuccess(fakePaymentData);
        onLoading(false);
        setIsProcessing(false);
        return;
      }
      const payloadYape = {
        carrito_id: carritoId,
        cliente_id: clienteId,
        amount: Number(total),
        payment_method_id: 'yape',
        payer_email: emailCliente,
        installments: 1,
        // TOKEN BACKEND DESHABILITADO: no enviamos token de Mercado Pago
        yape_phone: yapePhone,
        yape_otp: yapeOtp
      };

      const res = await fetch('/api/pagos/procesar_pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payloadYape)
      });
      if (res.status === 401) { handleExpiredSession(); return; }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || `Pago rechazado (${res.status})`);

      // En éxito: NO resetear isProcessing — spinner permanece hasta que el padre
      // desmonte este componente al mostrar el comprobante.
      onPaymentSuccess(data);

    } catch (err) {
      // Solo en ERROR: resetear para que el usuario pueda reintentar
      setIsProcessing(false);
      onLoading(false);
      onPaymentError(err.message || 'Error al procesar Yape');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 10px', gap: 28, flexWrap: 'wrap' }}>
      <style>{`
        @keyframes yapePhoneIn {
          0%   { opacity: 0; transform: perspective(900px) rotateY(-20deg) rotateX(8deg) translateY(36px) scale(0.86); }
          64%  { opacity: 1; transform: perspective(900px) rotateY(3deg) rotateX(-1deg) translateY(-5px) scale(1.02); }
          100% { opacity: 1; transform: perspective(900px) rotateY(-6deg) rotateX(3deg) translateY(0) scale(1); }
        }
        @keyframes yapeFormIn {
          0%   { opacity: 0; transform: translateX(26px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes yapePulse {
          0%, 100% { box-shadow: 0 6px 20px rgba(0,0,0,0.4), 0 0 0 0 rgba(180,80,255,0.5); }
          50%       { box-shadow: 0 6px 20px rgba(0,0,0,0.4), 0 0 0 10px rgba(180,80,255,0); }
        }

        /* ── SPINNER ── */
        @keyframes yapeSpinnerRotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes yapeSpinnerDash {
          0%   { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
          50%  { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
        }

        /* ── BOTÓN YAPE ── */
        .yape-pay-btn {
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(120deg, #6d14b5 0%, #9333ea 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(107,20,181,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          /* transiciones suaves */
          transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.18s ease, opacity 0.18s ease;
          position: relative;
          overflow: hidden;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .yape-pay-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.15s ease;
          border-radius: 12px;
        }
        /* Hover (solo cuando no está deshabilitado) */
        .yape-pay-btn:not(:disabled):hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow: 0 12px 28px rgba(107,20,181,0.48);
          background: linear-gradient(120deg, #7b1bc8 0%, #a855f7 100%);
        }
        .yape-pay-btn:not(:disabled):hover::after {
          background: rgba(255,255,255,0.06);
        }
        /* Presión / click */
        .yape-pay-btn:not(:disabled):active {
          transform: translateY(2px) scale(0.972);
          box-shadow: 0 3px 10px rgba(107,20,181,0.25);
          background: linear-gradient(120deg, #5a0f99 0%, #7c22cc 100%);
          transition: transform 0.06s ease, box-shadow 0.06s ease;
        }
        .yape-pay-btn:not(:disabled):active::after {
          background: rgba(0,0,0,0.1);
        }
        /* Deshabilitado */
        .yape-pay-btn:disabled {
          background: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.75;
        }
        /* Estado procesando */
        .yape-pay-btn.processing {
          background: linear-gradient(120deg, #6d14b5 0%, #9333ea 100%);
          opacity: 0.85;
          cursor: wait;
          pointer-events: none;
        }
      `}</style>

      {/* CELULAR 3D */}
      <div style={{ animation: 'yapePhoneIn 0.72s cubic-bezier(0.22, 1, 0.36, 1) both', transform: 'perspective(900px) rotateY(-6deg) rotateX(3deg)', flexShrink: 0 }}>
        <div style={{ width: 210, background: 'linear-gradient(160deg, #1c1c2e 0%, #16213e 60%, #0f3460 100%)', borderRadius: 38, padding: '12px 9px', boxShadow: '6px 14px 32px rgba(0,0,0,0.6), 14px 28px 52px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.13)', position: 'relative', border: '1.5px solid rgba(255,255,255,0.09)' }}>
          <div style={{ position: 'absolute', right: -4, top: 76, width: 4, height: 36, borderRadius: '0 4px 4px 0', background: 'linear-gradient(180deg,#252535,#181828)', boxShadow: '2px 2px 6px rgba(0,0,0,0.55)' }} />
          <div style={{ position: 'absolute', left: -4, top: 62, width: 4, height: 26, borderRadius: '4px 0 0 4px', background: 'linear-gradient(180deg,#252535,#181828)', boxShadow: '-2px 2px 5px rgba(0,0,0,0.55)' }} />
          <div style={{ position: 'absolute', left: -4, top: 96, width: 4, height: 26, borderRadius: '4px 0 0 4px', background: 'linear-gradient(180deg,#252535,#181828)', boxShadow: '-2px 2px 5px rgba(0,0,0,0.55)' }} />
          <div style={{ background: 'linear-gradient(158deg, #5b1699 0%, #7c23c8 45%, #a044e8 100%)', borderRadius: 28, overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.32)', minHeight: 390, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 5, width: '100%' }}>
              <div style={{ width: 64, height: 20, borderRadius: 12, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#111' }} />
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: FONTS.body, paddingBottom: 8 }}>
              {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ paddingBottom: 10 }}>
              <img src="/yape.png" alt="Yape" style={{ width: 72, height: 72, borderRadius: 20, objectFit: 'cover', animation: 'yapePulse 2.4s ease-in-out infinite' }} />
            </div>
            <div style={{ textAlign: 'center', color: '#fff', fontFamily: FONTS.heading, paddingBottom: 12, width: '100%' }}>
              <div style={{ fontSize: 10, opacity: 0.65, letterSpacing: 1.2 }}>TOTAL A PAGAR</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.5, marginTop: 2 }}>S/ {Number(total).toFixed(2)}</div>
            </div>
            <div style={{ margin: '0 12px 10px', background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '8px 12px', color: 'rgba(255,255,255,0.82)', fontSize: 10, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 1.5 }}>
              Abre Yape, genera el OTP<br />e ingresa tus datos al costado
            </div>
            {!mpLoaded && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: FONTS.body, paddingBottom: 6 }}>Cargando SDK...</div>}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10, marginTop: 'auto', width: '100%' }}>
              <div style={{ width: 55, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.32)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 210, animation: 'yapeFormIn 0.44s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both', fontFamily: FONTS.body }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <img src="/yape.png" alt="Yape" style={{ width: 38, height: 38, borderRadius: 11, objectFit: 'cover', boxShadow: '0 4px 12px rgba(107,20,181,0.3)' }} />
          <div>
            <div style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 800, color: '#6d14b5' }}>Pago con Yape</div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.textLight }}>Completa tus datos</div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontFamily: FONTS.heading, fontSize: 12, color: '#334155', letterSpacing: 0.3 }}>Correo electrónico</label>
          <input type="email" value={payerEmail} placeholder="tu@email.com"
            onChange={(e) => { setPayerEmail(e.target.value); setErrors(p => ({ ...p, payerEmail: '' })); }}
            style={{ width: '100%', padding: '10px 13px', borderRadius: 11, border: `1px solid ${errors.payerEmail ? '#7ec8e6' : COLORS.borderStrong}`, background: errors.payerEmail ? '#f1f9ff' : '#fff', fontFamily: FONTS.body, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          {errors.payerEmail && <ErrorNotice message={errors.payerEmail} />}
        </div>

        {/* Celular */}
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontFamily: FONTS.heading, fontSize: 12, color: '#334155', letterSpacing: 0.3 }}>Celular Yape</label>
          <input type="tel" value={yapePhone} placeholder="987654321"
            onChange={(e) => { setYapePhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setErrors(p => ({ ...p, yapePhone: '' })); }}
            style={{ width: '100%', padding: '10px 13px', borderRadius: 11, border: `1px solid ${errors.yapePhone ? '#7ec8e6' : COLORS.borderStrong}`, background: errors.yapePhone ? '#f1f9ff' : '#fff', fontFamily: FONTS.body, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          {errors.yapePhone && <ErrorNotice message={errors.yapePhone} />}
        </div>

        {/* OTP */}
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontFamily: FONTS.heading, fontSize: 12, color: '#334155', letterSpacing: 0.3 }}>OTP Yape</label>
          <input type="text" value={yapeOtp} placeholder="• • • • • •" maxLength={6}
            onChange={(e) => { setYapeOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors(p => ({ ...p, yapeOtp: '' })); }}
            style={{ width: '100%', padding: '10px 13px', borderRadius: 11, border: `1px solid ${errors.yapeOtp ? '#7ec8e6' : COLORS.borderStrong}`, background: errors.yapeOtp ? '#f1f9ff' : '#fff', fontFamily: FONTS.body, fontSize: 16, outline: 'none', boxSizing: 'border-box', letterSpacing: 6, fontWeight: 700, textAlign: 'center' }}
          />
          {errors.yapeOtp && <ErrorNotice message={errors.yapeOtp} />}
        </div>

        {/* Info test */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0,20,50,0.95), rgba(0,35,70,0.98))', border: '1px solid rgba(128,194,220,0.5)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#cbe8ff', fontFamily: FONTS.body, lineHeight: 1.5, boxShadow: '0 0 14px rgba(128,194,220,0.2), 0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(128,194,220,0.12)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: '#80C2DC', color: '#00233f', fontSize: 11, fontWeight: 800, marginRight: 7, verticalAlign: 'middle' }}>i</span>
          <strong style={{ color: '#d9f0ff' }}>Test:</strong>{' '}
          <span style={{ color: '#cbe8ff' }}>cel. 111111111 / OTP: 123456</span>
        </div>

        {/* ── BOTÓN CON EFECTOS ── */}
        <button
          type="submit"
          disabled={isProcessing || !mpLoaded}
          className={`yape-pay-btn${isProcessing ? ' processing' : ''}`}
          style={{ fontFamily: FONTS.heading }}
        >
          {isProcessing ? (
            <>
              {/* Spinner SVG animado */}
              <svg
                width="18" height="18"
                viewBox="0 0 50 50"
                style={{ animation: 'yapeSpinnerRotate 1s linear infinite', flexShrink: 0 }}
              >
                <circle
                  cx="25" cy="25" r="20"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="5"
                />
                <circle
                  cx="25" cy="25" r="20"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  style={{ animation: 'yapeSpinnerDash 1.4s ease-in-out infinite' }}
                />
              </svg>
              Procesando...
            </>
          ) : (
            <>
              {/* Ícono de Yape (checkmark de pago) */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.83L6.7 12.94a.996.996 0 111.41-1.41l2.47 2.47 6.18-6.18a.996.996 0 111.41 1.41l-6.88 6.9c-.38.38-1.02.37-1.4-.1z" fill="rgba(255,255,255,0.85)" />
              </svg>
              Pagar con Yape
            </>
          )}
        </button>
      </form>
    </div>
  );
}