import React, { useEffect, useRef, useState } from 'react';
import { COLORS, FONTS } from '../colors';
import MercadoPagoYape from './MercadoPagoYape';
import MercadoPagoWallet from './MercadoPagoWallet';
import MercadoPagoOtros from './MercadoPagoOtros';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-31db4b36-66c5-4017-a197-d65775a236d4';
const USE_TEST_MODE = true;
const SHOW_METHODS = true;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEST_CARD_DETAILS = {
  number: '4009175332806176',
  expiration: '11/30',
  cvv: '123',
  name: 'APRO',
  dni: '12345678',
};
const WATERMARK_LOGO = '/V.png';

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1px solid ${hasError ? '#7ec8e6' : COLORS.borderStrong}`,
  fontSize: 15,
  fontFamily: FONTS.body,
  outline: 'none',
  background: hasError ? '#f1f9ff' : '#ffffff',
  color: COLORS.text,
  boxSizing: 'border-box',
});

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 700,
  color: COLORS.gray[800],
  fontFamily: FONTS.heading,
  fontSize: 13,
  letterSpacing: 0.3,
};

const errorStyle = {
  marginTop: 6,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  color: '#0f4c81',
  fontSize: 12,
  fontFamily: FONTS.body,
  fontWeight: 600,
  background: 'linear-gradient(135deg, #eef8ff 0%, #dff2ff 100%)',
  border: '1px solid #a6d7f2',
  borderRadius: 8,
  padding: '5px 10px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 10px rgba(41,111,168,0.12)',
  animation: 'errorShake 0.3s ease',
};

const ErrorNotice = ({ message, style = {} }) => {
  const background = 'linear-gradient(135deg, rgba(0,20,50,0.97), rgba(0,35,70,0.99))';
  const borderColor = 'rgba(128,194,220,0.55)';
  const textColor = 'rgba(200,235,255,0.95)';
  return (
    <div style={{ ...errorStyle, background, border: `1px solid ${borderColor}`, color: textColor, ...style }}>
      <span style={{ position: 'absolute', top: -8, left: 16, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: `8px solid ${borderColor}` }} />
      <span style={{ position: 'absolute', top: -7, left: 17, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: `7px solid ${background}` }} />
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#80C2DC', color: '#0b3c63', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, lineHeight: 1, flexShrink: 0 }}>!</span>
      <span>{message}</span>
    </div>
  );
};

const cardInputStyle = (hasError) => ({
  width: '100%',
  padding: '7px 0',
  border: 'none',
  borderBottom: `1px solid ${hasError ? 'rgba(126,200,230,0.95)' : 'rgba(255,255,255,0.42)'}`,
  background: 'transparent',
  color: '#fff',
  outline: 'none',
  fontFamily: FONTS.body,
  fontSize: 16,
});

const titularInputStyle = (hasError) => ({
  ...cardInputStyle(hasError),
  borderBottom: `2px solid ${hasError ? 'rgba(126,200,230,0.95)' : 'rgba(255,255,255,0.68)'}`,
  paddingBottom: 9,
  boxShadow: hasError ? 'inset 0 -2px 0 rgba(126,200,230,0.45)' : 'inset 0 -1px 0 rgba(255,255,255,0.24)',
});

const cardNumberDisplayStyle = (hasError) => ({
  width: '100%',
  padding: '12px 14px',
  border: `1px solid ${hasError ? 'rgba(126,200,230,0.95)' : 'rgba(255,255,255,0.34)'}`,
  borderRadius: 6,
  background: hasError ? 'rgba(126,200,230,0.2)' : 'rgba(255,255,255,0.12)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -2px 6px rgba(0,0,0,0.22), 0 6px 14px rgba(3,22,42,0.28)',
  color: '#fff',
  outline: 'none',
  fontFamily: FONTS.heading,
  letterSpacing: 2.4,
  fontSize: 30,
  textShadow: '0 1px 0 rgba(255,255,255,0.28), 0 2px 0 rgba(12,46,80,0.55), 0 6px 10px rgba(2,18,35,0.45)',
  transform: 'translateZ(12px)',
});

const getIdentificationError = (identificationType, identificationNumber) => {
  const digits = identificationNumber.replace(/\D/g, '');
  if (!digits) return 'Ingresa tu número de documento';
  if (identificationType === 'DNI' && digits.length !== 8) return 'El DNI debe tener 8 dígitos';
  if (identificationType === 'RUC' && digits.length !== 11) return 'El RUC debe tener 11 dígitos';
  if (identificationType === 'CE' && (digits.length < 8 || digits.length > 12)) return 'El CE debe tener entre 8 y 12 dígitos';
  return '';
};

const getExpirationError = (expirationDate) => {
  if (!/^\d{2}\/\d{2}$/.test(expirationDate)) return 'Usa el formato MM/AA';
  const [monthText, yearText] = expirationDate.split('/');
  const month = Number(monthText);
  const year = Number(`20${yearText}`);
  if (month < 1 || month > 12) return 'Mes inválido';
  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59, 999);
  if (expiry < now) return 'La tarjeta está vencida';
  return '';
};

const getLocalPaymentMethodFromBin = (bin) => {
  if (!bin || bin.length < 1) return null;
  if (/^4/.test(bin)) return { id: 'visa', name: 'Visa', issuer: { id: 'visa' } };
  if (/^5[1-5]/.test(bin) || /^2(?:2[2-9]|[3-6]\d|7[01])/.test(bin)) return { id: 'master', name: 'Mastercard', issuer: { id: 'master' } };
  if (/^3[47]/.test(bin)) return { id: 'amex', name: 'American Express', issuer: { id: 'amex' } };
  if (/^6(?:011|5)/.test(bin) || /^64[4-9]/.test(bin)) return { id: 'discover', name: 'Discover', issuer: { id: 'discover' } };
  return { id: 'card', name: 'Tarjeta', issuer: { id: 'card' } };
};

export default function MercadoPagoCardForm({
  carritoId, clienteId, total, items = [],
  onPaymentSuccess, onPaymentError, onLoading,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(USE_TEST_MODE);
  const [mp, setMp] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [payerEmail, setPayerEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [identificationType, setIdentificationType] = useState('DNI');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const docDropdownRef = useRef(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedInstallment] = useState(1);
  const [showYape, setShowYape] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showOtros, setShowOtros] = useState(false);
  const [errors, setErrors] = useState({});
  const [detectingCard, setDetectingCard] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!showDocDropdown) return;
    const handleClickOutside = (e) => {
      if (docDropdownRef.current && !docDropdownRef.current.contains(e.target)) setShowDocDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDocDropdown]);

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
      if (!window.MercadoPago) { onPaymentError('No se pudo cargar Mercado Pago SDK'); return; }
      const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
      setMp(mpInstance);
      setMpLoaded(true);
    };
    script.onerror = () => onPaymentError('No se pudo cargar Mercado Pago SDK');
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [onPaymentError]);

  useEffect(() => {
    const bin = cardNumber.replace(/\D/g, '').slice(0, 6);
    if (USE_TEST_MODE) {
      if (bin.length < 1) { setPaymentMethod(null); setDetectingCard(false); return; }
      setDetectingCard(true);
      setPaymentMethod(getLocalPaymentMethodFromBin(bin));
      setDetectingCard(false);
      return;
    }
    if (!mpLoaded || !mp) return;
    if (bin.length < 6) { setPaymentMethod(null); setDetectingCard(false); return; }
    let cancelled = false;
    const detectPaymentMethod = async () => {
      try {
        setDetectingCard(true);
        const pmResponse = await mp.getPaymentMethods({ bin });
        if (!cancelled) setPaymentMethod(pmResponse.results?.[0] || null);
      } catch { if (!cancelled) setPaymentMethod(null); }
      finally { if (!cancelled) setDetectingCard(false); }
    };
    detectPaymentMethod();
    return () => { cancelled = true; };
  }, [cardNumber, mp, mpLoaded]);

  useEffect(() => { setErrors({}); }, [showYape, showWallet, showOtros]);

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpirationDate = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const validateCardForm = () => {
    const nextErrors = {};
    const cardDigits = cardNumber.replace(/\D/g, '');
    const cvvDigits = securityCode.replace(/\D/g, '');
    const name = cardholderName.trim();
    if (!emailRegex.test(payerEmail.trim())) nextErrors.payerEmail = 'Ingresa un correo válido';
    if (USE_TEST_MODE) {
      if (cardDigits !== TEST_CARD_DETAILS.number) nextErrors.cardNumber = 'Número de tarjeta inválido';
      if (expirationDate !== TEST_CARD_DETAILS.expiration) nextErrors.expirationDate = 'Fecha de expiración inválida';
      if (cvvDigits !== TEST_CARD_DETAILS.cvv) nextErrors.securityCode = 'CVV inválido';
      if (name.toUpperCase() !== TEST_CARD_DETAILS.name) nextErrors.cardholderName = 'Titular inválido';
      const idDigits = identificationNumber.replace(/\D/g, '');
      if (identificationType !== 'DNI' || idDigits !== TEST_CARD_DETAILS.dni) nextErrors.identificationNumber = 'DNI inválido';
      return nextErrors;
    }
    if (cardDigits.length < 13 || cardDigits.length > 19) nextErrors.cardNumber = 'Ingresa una tarjeta válida';
    const expirationError = getExpirationError(expirationDate);
    if (expirationError) nextErrors.expirationDate = expirationError;
    if (!/^\d{3,4}$/.test(cvvDigits)) nextErrors.securityCode = 'El CVV debe tener 3 o 4 dígitos';
    if (name.length < 2 || !/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/.test(name)) nextErrors.cardholderName = 'Ingresa un nombre válido';
    const identificationError = getIdentificationError(identificationType, identificationNumber);
    if (identificationError) nextErrors.identificationNumber = identificationError;
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateCardForm();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setIsProcessing(true);
    onLoading(true);
    try {
      const jwt = localStorage.getItem('auth_token');
      const clienteIdLS = localStorage.getItem('cliente_id');
      let emailCliente = payerEmail.trim() || localStorage.getItem('cliente_correo') || '';
      if (USE_TEST_MODE) {
        const fakePaymentData = {
          success: true,
          message: 'Pago de prueba aceptado',
          payment_id: `test-card-${Date.now()}`,
          status: 'approved',
          status_detail: 'accredited',
          amount: total,
          payment_method_id: 'visa',
        };
        await onPaymentSuccess(fakePaymentData);
        onLoading(false);
        setIsProcessing(false);
        return;
      }
      if (!jwt || !clienteIdLS) throw new Error('Se cerró su sesión, vuelva a ingresar.');
      if (!emailCliente) {
        try {
          const meRes = await fetch('/api/clientes/me', { headers: { Authorization: `Bearer ${jwt}` } });
          if (meRes.status === 401) { handleExpiredSession(); return; }
          const meJson = await meRes.json();
          emailCliente = meJson?.cliente?.correo || '';
          if (emailCliente) setPayerEmail(emailCliente);
        } catch {}
      }
      const cardNumberValue = cardNumber.replace(/\s/g, '');
      const [month, year] = expirationDate.split('/');
      const tokenData = {
        cardNumber: cardNumberValue,
        cardholderName: cardholderName.trim(),
        cardExpirationMonth: month.trim(),
        cardExpirationYear: `20${year.trim()}`,
        securityCode: securityCode.replace(/\D/g, ''),
        identificationType,
        identificationNumber: identificationNumber.replace(/\D/g, ''),
      };
      const tokenResult = await mp.createCardToken(tokenData);
      const tokenId = tokenResult?.id || tokenResult?.card_token?.id;
      if (!tokenId) throw new Error('Error al crear Card Token');
      let paymentMethodToUse = paymentMethod;
      if (!paymentMethodToUse) {
        const pmResponse = await mp.getPaymentMethods({ bin: cardNumberValue.substring(0, 6) });
        paymentMethodToUse = pmResponse.results?.[0] || null;
      }
      if (!paymentMethodToUse) throw new Error('No se pudo identificar la tarjeta');
      const body = {
        token: tokenId,
        carrito_id: carritoId,
        cliente_id: clienteIdLS,
        amount: total,
        payment_method_id: paymentMethodToUse.id,
        issuer_id: paymentMethodToUse.issuer?.id?.toString() || null,
        installments: selectedInstallment || 1,
        payer_email: emailCliente,
        payer_identification: { type: identificationType || 'DNI', number: identificationNumber.replace(/\D/g, '') },
      };
      const res = await fetch('/api/pagos/procesar_pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { handleExpiredSession(); return; }
      const data = await res.json();
      if (!data.success) {
        const errorMessage = data.error || data.message || JSON.stringify(data);
        const causeDetails = Array.isArray(data.cause)
          ? data.cause.map((c) => typeof c === 'object' ? (c.message || c.description || JSON.stringify(c)) : String(c)).filter(Boolean).join(' | ')
          : data.cause;
        throw new Error(`Pago rechazado: ${causeDetails ? `${errorMessage} (${causeDetails})` : errorMessage}`);
      }
      setPaymentSuccess(data);
      await new Promise((resolve) => setTimeout(resolve, 2400));
      await onPaymentSuccess(data);
    } catch (err) {
      console.error('[MP] Error:', err);
      onPaymentError(err.message);
    } finally {
      setIsProcessing(false);
      onLoading(false);
    }
  };

  // Estado base del botón Pagar — se calcula antes del return
  const btnDisabled = isProcessing || !mpLoaded;
  const btnBaseStyle = {
    width: '100%',
    padding: '13px 16px',
    border: 'none',
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 16,
    fontFamily: FONTS.heading,
    cursor: btnDisabled ? 'not-allowed' : 'pointer',
    color: '#fff',
    background: btnDisabled
      ? '#94a3b8'
      : 'linear-gradient(120deg, #80C2DC 0%, #5a8ba8 100%)',
    boxShadow: '0 12px 24px rgba(90,139,168,0.22)',
    // transition definida inline — siempre se aplica sin importar el hosting
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
    minWidth: isMobile ? 0 : 210,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    opacity: btnDisabled ? 0.82 : 1,
  };

  // Handlers de hover/click del botón Pagar — inline para garantizar que
  // funcionen en cualquier hosting sin depender del CSS purgado o bloqueado
  const onPayBtnMouseEnter = (e) => {
    if (btnDisabled) return;
    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
    e.currentTarget.style.boxShadow = '0 18px 32px rgba(90,139,168,0.38)';
    e.currentTarget.style.filter = 'brightness(1.12)';
  };
  const onPayBtnMouseLeave = (e) => {
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = '0 12px 24px rgba(90,139,168,0.22)';
    e.currentTarget.style.filter = 'none';
  };
  const onPayBtnMouseDown = (e) => {
    if (btnDisabled) return;
    e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
    e.currentTarget.style.boxShadow = '0 6px 14px rgba(90,139,168,0.18)';
    e.currentTarget.style.filter = 'brightness(0.94)';
  };
  const onPayBtnMouseUp = (e) => {
    if (btnDisabled) return;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = '0 12px 24px rgba(90,139,168,0.22)';
    e.currentTarget.style.filter = 'none';
  };

  // Estilo del método de pago (botones del panel derecho)
  const metodoBtnStyle = (isMobile, isActive, disabled) => ({
    width: isMobile ? '100%' : 188,
    minWidth: isMobile ? '100%' : 188,
    maxWidth: isMobile ? '100%' : 188,
    height: 64,
    padding: '0 14px',
    border: '1px solid rgba(255,255,255,0.28)',
    borderRadius: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled
      ? 'linear-gradient(135deg, rgba(87, 112, 148, 0.92) 0%, rgba(108, 146, 170, 0.96) 100%)'
      : isActive
        ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
        : 'linear-gradient(135deg, #173a63 0%, #2f69a0 52%, #6eb1d3 100%)',
    color: '#fff',
    opacity: disabled ? 0.9 : 1,
    boxShadow: '0 10px 24px rgba(8,34,60,0.34), inset 0 1px 0 rgba(255,255,255,0.26)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
    boxSizing: 'border-box',
  });
  const onMetodoEnter = (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 28px rgba(8,34,60,0.42), inset 0 1px 0 rgba(255,255,255,0.3)'; };
  const onMetodoLeave = (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(8,34,60,0.34), inset 0 1px 0 rgba(255,255,255,0.26)'; };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <style>{`
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        @keyframes glassPaymentIn {
          0% { opacity: 0; transform: translateY(12px) scale(.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes docDropdownIn {
          0%   { opacity: 0; transform: scaleY(0.45) translateY(-10px); }
          65%  { opacity: 1; transform: scaleY(1.04) translateY(1px); }
          100% { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        @keyframes mpSpinnerRotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cardEntrance {
          0%   { opacity: 0; transform: translateY(28px) scale(.93) rotateX(8deg); }
          55%  { opacity: 1; transform: translateY(-4px) scale(1.015) rotateX(-1deg); }
          80%  { transform: translateY(2px) scale(.998) rotateX(0.5deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); }
        }
        @keyframes successCheckmark {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .mp-card-visual:hover {
          transform: translateY(-3px) scale(1.012) !important;
          box-shadow: 0 32px 52px rgba(8,34,60,0.46), 0 6px 0 rgba(10,42,72,0.62), inset 0 1px 0 rgba(255,255,255,0.32) !important;
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease !important;
        }
        .mp-card-input {
          background: transparent !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        .mp-card-input:focus {
          background: transparent !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        .mp-card-input:-webkit-autofill,
        .mp-card-input:-webkit-autofill:hover,
        .mp-card-input:-webkit-autofill:focus,
        .mp-card-input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          box-shadow: 0 0 0 1000px rgba(0,0,0,0) inset !important;
          -webkit-box-shadow: 0 0 0 1000px rgba(0,0,0,0) inset !important;
          transition: background-color 9999s ease-out 0s;
        }
        .mp-doc-option:hover { background: rgba(62,175,210,0.13) !important; }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(280px,340px)',
        gap: isMobile ? 10 : 12,
        alignItems: 'start',
      }}>

        {/* ── Panel izquierdo ── */}
        {showYape ? (
          <MercadoPagoYape carritoId={carritoId} clienteId={clienteId} total={total}
            onPaymentSuccess={onPaymentSuccess} onPaymentError={onPaymentError}
            onLoading={onLoading} onBack={() => setShowYape(false)} />
        ) : showWallet ? (
          <MercadoPagoWallet carritoId={carritoId} clienteId={clienteId} total={total} items={items}
            onPaymentSuccess={onPaymentSuccess} onPaymentError={onPaymentError}
            onLoading={onLoading} onBack={() => setShowWallet(false)} />
        ) : showOtros ? (
          <div style={{ display: 'grid', minWidth: 0, gap: 12, padding: 16, borderRadius: 20, background: 'linear-gradient(135deg,rgba(255,255,255,0.92) 0%,rgba(232,244,249,0.92) 100%)', border: '1px solid rgba(189,224,239,0.95)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85),0 14px 28px rgba(15,23,42,0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'glassPaymentIn .26s ease' }}>
            <div style={{ fontFamily: FONTS.heading, color: COLORS.secondaryDark, fontSize: 20, lineHeight: 1 }}>Otros métodos</div>
            <MercadoPagoOtros carritoId={carritoId} clienteId={clienteId} total={total}
              onPaymentSuccess={onPaymentSuccess} onPaymentError={onPaymentError}
              onLoading={onLoading} onBack={() => setShowOtros(false)} embedded />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', minWidth: 0, gap: 12, padding: 16, borderRadius: 20, background: 'linear-gradient(135deg,rgba(255,255,255,0.92) 0%,rgba(232,244,249,0.92) 100%)', border: '1px solid rgba(189,224,239,0.95)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85),0 14px 28px rgba(15,23,42,0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'glassPaymentIn .26s ease' }}>
            <div style={{ fontFamily: FONTS.heading, color: COLORS.secondaryDark, fontSize: 20, lineHeight: 1 }}>Tarjeta</div>

            {/* Fila correo / doc / num-doc */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr 1fr' : '1.35fr 0.55fr 0.7fr'), gap: 12, alignItems: 'end', width: isMobile ? '100%' : (isTablet ? '92%' : '75%'), justifySelf: 'center' }}>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input id="payerEmail" type="email" placeholder="tu-email@dominio.com" required value={payerEmail}
                  onChange={(e) => { setPayerEmail(e.target.value); clearError('payerEmail'); }}
                  style={inputStyle(Boolean(errors.payerEmail))} />
                {errors.payerEmail && <ErrorNotice message={errors.payerEmail} />}
              </div>
              <div>
                <label style={labelStyle}>Documento</label>
                <div ref={docDropdownRef} style={{ position: 'relative' }}>
                  <div onClick={() => setShowDocDropdown((p) => !p)}
                    style={{ ...inputStyle(Boolean(errors.identificationType)), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
                    <span>{identificationType}</span>
                    <span style={{ fontSize: 10, opacity: 0.55, display: 'inline-block', transform: showDocDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s ease' }}>▼</span>
                  </div>
                  {showDocDropdown && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, background: '#ffffff', borderRadius: 12, boxShadow: '0 10px 28px rgba(15,23,42,0.14)', border: '1px solid rgba(189,224,239,0.9)', overflow: 'hidden', animation: 'docDropdownIn 0.26s cubic-bezier(0.22,1,0.36,1) both', transformOrigin: 'top center' }}>
                      {['DNI', 'CE', 'RUC'].map((type) => (
                        <div key={type} className="mp-doc-option"
                          onClick={() => { setIdentificationType(type); setShowDocDropdown(false); clearError('identificationNumber'); }}
                          style={{ padding: '11px 14px', fontFamily: FONTS.body, fontSize: 15, cursor: 'pointer', background: identificationType === type ? 'rgba(62,175,210,0.1)' : 'transparent', color: identificationType === type ? COLORS.secondaryDark : COLORS.text, fontWeight: identificationType === type ? 700 : 400, borderBottom: type !== 'RUC' ? '1px solid rgba(189,224,239,0.5)' : 'none' }}>
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ gridColumn: isTablet ? '1 / -1' : 'auto' }}>
                <label style={labelStyle}>Número de documento</label>
                <input id="identificationNumber" type="text" inputMode="numeric"
                  placeholder={identificationType === 'RUC' ? '20123456789' : '12345678'}
                  required value={identificationNumber}
                  onChange={(e) => { setIdentificationNumber(e.target.value.replace(/\D/g, '').slice(0, 12)); clearError('identificationNumber'); }}
                  style={inputStyle(Boolean(errors.identificationNumber))} />
                {errors.identificationNumber && <ErrorNotice message={errors.identificationNumber} />}
              </div>
            </div>

            {/* Visual de tarjeta */}
            <div className="mp-card-visual" style={{ borderRadius: 27, padding: '22px 20px 20px', color: '#ffffff', minHeight: isMobile ? 250 : 292, width: isMobile ? '100%' : (isTablet ? '92%' : '75%'), justifySelf: 'center', display: 'grid', gap: 16, background: 'linear-gradient(135deg,#173a63 0%,#2f69a0 48%,#6eb1d3 100%)', boxShadow: '0 24px 38px rgba(8,34,60,0.38),0 6px 0 rgba(10,42,72,0.58),inset 0 1px 0 rgba(255,255,255,0.28),inset 0 -10px 22px rgba(0,0,0,0.18)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.22)', animation: 'cardEntrance 0.62s cubic-bezier(0.22,1,0.36,1) both', cursor: 'default', perspective: 800 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
                <img src={WATERMARK_LOGO} alt="" aria-hidden="true" style={{ width: '44%', maxWidth: 210, opacity: 0.3, objectFit: 'contain', filter: 'drop-shadow(0 8px 14px rgba(7,26,49,0.2))', transform: 'translateY(2px)', userSelect: 'none', WebkitUserDrag: 'none' }} />
              </div>
              <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', top: -72, right: -28, background: 'rgba(255,255,255,0.03)' }} />
              <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', bottom: -74, left: -36, background: 'rgba(255,255,255,0.02)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 46, height: 32, borderRadius: 6, background: 'linear-gradient(135deg,#d8b15a 0%,#f6de96 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5),0 6px 10px rgba(0,0,0,0.22)', transform: 'translateZ(14px)' }} />
                <div style={{ fontFamily: FONTS.heading, fontSize: 17, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  {detectingCard ? 'Detectando...' : (paymentMethod?.name || paymentMethod?.id || 'Tarjeta')}
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, opacity: 0.78, fontFamily: FONTS.body, marginBottom: 6, letterSpacing: 1 }}>NÚMERO DE TARJETA</div>
                <input className="mp-card-input" id="cardNumber" type="text" inputMode="numeric"
                  placeholder="4509 9535 6623 3704" maxLength={23} required value={cardNumber}
                  onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); clearError('cardNumber'); }}
                  style={{ ...cardNumberDisplayStyle(Boolean(errors.cardNumber)), fontSize: isMobile ? 20 : (isTablet ? 24 : 30), letterSpacing: isMobile ? 1.2 : 2.4, padding: isMobile ? '10px 12px' : '12px 14px' }} />
                {errors.cardNumber && <ErrorNotice message={errors.cardNumber} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: 16, position: 'relative', alignItems: 'end', zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.78, fontFamily: FONTS.body, marginBottom: 6, letterSpacing: 1 }}>TITULAR</div>
                  <input className="mp-card-input" id="cardholderName" type="text" placeholder="Nombre" required value={cardholderName}
                    onChange={(e) => { setCardholderName(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, '')); clearError('cardholderName'); }}
                    style={titularInputStyle(Boolean(errors.cardholderName))} />
                  {errors.cardholderName && <ErrorNotice message={errors.cardholderName} />}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.78, fontFamily: FONTS.body, marginBottom: 6, letterSpacing: 1 }}>VENCE</div>
                    <input className="mp-card-input" id="expirationDate" type="text" inputMode="numeric"
                      placeholder="12/30" maxLength={5} required value={expirationDate}
                      onChange={(e) => { setExpirationDate(formatExpirationDate(e.target.value)); clearError('expirationDate'); }}
                      style={cardInputStyle(Boolean(errors.expirationDate))} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.78, fontFamily: FONTS.body, marginBottom: 6, letterSpacing: 1 }}>CVV</div>
                    <input className="mp-card-input" id="securityCode" type="text" inputMode="numeric"
                      placeholder="123" maxLength={4} required value={securityCode}
                      onChange={(e) => { setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4)); clearError('securityCode'); }}
                      style={cardInputStyle(Boolean(errors.securityCode))} />
                  </div>
                </div>
              </div>
              {(errors.expirationDate || errors.securityCode) && (
                <ErrorNotice message={errors.expirationDate || errors.securityCode} style={{ marginTop: -4 }} />
              )}
            </div>

            {/* Fila: texto + botón PAGAR */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.8fr 1fr auto', gap: 12, alignItems: 'end', width: isMobile ? '100%' : (isTablet ? '92%' : '75%'), justifySelf: 'center' }}>
              <div style={{ fontFamily: FONTS.body, color: COLORS.textLight, fontSize: 13, paddingBottom: 10 }}>
                La marca se detecta automáticamente en la tarjeta.
              </div>
              {!isMobile && <div />}

              {/* ✅ Botón "Pagar" con hover + spinner completamente inline */}
              <button
                type="submit"
                disabled={btnDisabled}
                style={btnBaseStyle}
                onMouseEnter={onPayBtnMouseEnter}
                onMouseLeave={onPayBtnMouseLeave}
                onMouseDown={onPayBtnMouseDown}
                onMouseUp={onPayBtnMouseUp}
              >
                {/* Spinner giratorio — usa @keyframes mpSpinnerRotate definida arriba */}
                {isProcessing && (
                  <svg
                    style={{ width: 18, height: 18, flexShrink: 0, animation: 'mpSpinnerRotate 0.85s linear infinite' }}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  >
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{isProcessing ? 'Procesando pago...' : `Pagar S/ ${Number(total).toFixed(2)}`}</span>
              </button>
            </div>
          </form>
        )}

        {/* ── Panel derecho: Total + Métodos ── */}
        <div style={{ display: 'grid', gap: 12, alignContent: 'start', minWidth: 0 }}>
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'linear-gradient(135deg,rgba(255,255,255,0.9),rgba(232,244,249,0.95))', border: '1px solid rgba(189,224,239,0.95)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85),0 14px 28px rgba(15,23,42,0.08)', animation: 'glassPaymentIn .3s ease' }}>
            <div style={{ fontFamily: FONTS.heading, color: COLORS.secondaryDark, fontSize: 16 }}>Total</div>
            <div style={{ marginTop: 6, fontFamily: FONTS.heading, color: COLORS.text, fontSize: isMobile ? 24 : 30, lineHeight: 1 }}>
              S/ {Number(total).toFixed(2)}
            </div>
          </div>

          {SHOW_METHODS && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'linear-gradient(135deg,rgba(255,255,255,0.9),rgba(232,244,249,0.95))', border: '1px solid rgba(189,224,239,0.95)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85),0 14px 28px rgba(15,23,42,0.08)', display: 'grid', gap: 10, alignItems: 'center', justifyItems: isMobile ? 'stretch' : 'center', animation: 'glassPaymentIn .34s ease' }}>
              <div style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.textLight, borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: 6, width: '100%', textAlign: 'center' }}>Métodos de pago</div>

              {/* Yape */}
              <button type="button"
                disabled={showYape}
                style={metodoBtnStyle(isMobile, showYape, showYape)}
                onMouseEnter={!showYape ? onMetodoEnter : undefined}
                onMouseLeave={!showYape ? onMetodoLeave : undefined}
                onClick={() => {
                  if (showYape) return;
                  setShowYape(true);
                  setShowWallet(false);
                  setShowOtros(false);
                }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 10, whiteSpace: 'nowrap' }}>
                  {showYape ? (
                    <span style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Yape</span>
                  ) : (
                    <img src="/logo yape.png" alt="Yape" style={{ height: 32, width: 72, objectFit: 'contain', display: 'block' }} />
                  )}
                </div>
              </button>

              {/* Tarjeta */}
              <button type="button"
                disabled={!showYape}
                style={metodoBtnStyle(isMobile, !showYape, !showYape)}
                onMouseEnter={showYape ? onMetodoEnter : undefined}
                onMouseLeave={showYape ? onMetodoLeave : undefined}
                onClick={() => {
                  if (!showYape) return;
                  setShowYape(false);
                  setShowWallet(false);
                  setShowOtros(false);
                }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 8, whiteSpace: 'nowrap' }}>
                  {!showYape ? (
                    <span style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tarjeta</span>
                  ) : (
                    <><span style={{ width: 18, height: 14, borderRadius: 4, background: 'linear-gradient(135deg,#d8b15a 0%,#f6de96 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)' }} /><span style={{ color: '#fff', fontFamily: FONTS.heading, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tarjeta</span></>
                  )}
                </div>
              </button>

              {/* Mercado Pago Wallet */}
              {false && (
                <button type="button" style={metodoBtnStyle(isMobile)}
                  onMouseEnter={onMetodoEnter} onMouseLeave={onMetodoLeave}
                  onClick={() => { setShowWallet(!showWallet); setShowYape(false); setShowOtros(false); }}>
                  {showWallet
                    ? <><span style={{ width: 22, height: 16, borderRadius: 4, background: 'linear-gradient(135deg,#d8b15a 0%,#f6de96 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)', flexShrink: 0 }} /><span style={{ color: '#fff', fontFamily: FONTS.heading, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tarjeta</span></>
                    : <img src="/mercado pago.png" alt="Mercado Pago" style={{ height: 40, objectFit: 'contain', display: 'block' }} />}
                </button>
              )}

              {/* Otros métodos */}
              {false && (
                <button type="button" style={metodoBtnStyle(isMobile)}
                  onMouseEnter={onMetodoEnter} onMouseLeave={onMetodoLeave}
                  onClick={() => { setShowOtros(!showOtros); setShowYape(false); setShowWallet(false); }}>
                  {showOtros
                    ? <><span style={{ width: 22, height: 16, borderRadius: 4, background: 'linear-gradient(135deg,#d8b15a 0%,#f6de96 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)', flexShrink: 0 }} /><span style={{ color: '#fff', fontFamily: FONTS.heading, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tarjeta</span></>
                    : <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', fontFamily: FONTS.heading, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Otros métodos</span>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal pago exitoso */}
      {paymentSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 40, maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', animation: 'slideInUp 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'successCheckmark 0.6s cubic-bezier(0.22,1,0.36,1)', boxShadow: '0 0 0 12px rgba(16,185,129,0.1)', fontSize: 40 }}>✓</div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.text, margin: '0 0 8px 0' }}>¡Pago Exitoso!</h2>
            <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textLight, margin: '0 0 24px 0' }}>Tu compra ha sido procesada correctamente.</p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 600, marginBottom: 8 }}>DETALLES DEL PAGO</div>
              <div style={{ fontSize: 13, color: COLORS.text, marginBottom: 8, wordBreak: 'break-all' }}><strong>ID:</strong> {paymentSuccess.payment_id || paymentSuccess.id || 'N/A'}</div>
              <div style={{ fontSize: 13, color: COLORS.text }}><strong>Monto:</strong> S/ {Number(total).toFixed(2)}</div>
            </div>
            <button
              onClick={() => { setPaymentSuccess(null); onPaymentSuccess(paymentSuccess); }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', color: 'white', fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)'; }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}