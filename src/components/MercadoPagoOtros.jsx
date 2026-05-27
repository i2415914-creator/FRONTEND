import React, { useEffect, useRef, useState } from 'react';
import { COLORS, FONTS } from '../colors';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-31db4b36-66c5-4017-a197-d65775a236d4';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTHER_PAYMENT_METHOD_OPTIONS = [
	{ id: 'pagoefectivo_atm', name: 'PagoEfectivo (Cajeros)' },
	{ id: 'pagoefectivo', name: 'PagoEfectivo' },
];

const textStyle = (hasError) => ({
	width: '100%',
	padding: '11px 12px',
	border: `1px solid ${hasError ? '#7ec8e6' : COLORS.borderStrong}`,
	borderRadius: 12,
	fontSize: 14,
	fontFamily: FONTS.body,
	background: hasError ? '#f1f9ff' : '#fff',
	outline: 'none',
	boxSizing: 'border-box',
});

function AnimatedSelect({ options, value, onChange, hasError, placeholder = 'Selecciona' }) {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		if (!open) return;
		const handler = (e) => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [open]);

	const selected = options.find((o) => String(o.id) === String(value));

	return (
		<div ref={ref} style={{ position: 'relative', width: '100%' }}>
			<style>{`
				@keyframes selectDropIn {
					0%   { opacity: 0; transform: translateY(-10px) scaleY(0.88); }
					65%  { opacity: 1; transform: translateY(2px) scaleY(1.015); }
					100% { opacity: 1; transform: translateY(0) scaleY(1); }
				}
				@keyframes optionFadeSlide {
					from { opacity: 0; transform: translateX(-8px); }
					to   { opacity: 1; transform: translateX(0); }
				}
				.mp-aselect-list { animation: selectDropIn 0.24s cubic-bezier(0.34,1.56,0.64,1) forwards; transform-origin: top center; }
				.mp-aselect-option { animation: optionFadeSlide 0.18s ease both; }
				.mp-aselect-option:hover { background: rgba(61,184,224,0.12) !important; color: #0284c7 !important; }
				.mp-aselect-selected { background: rgba(61,184,224,0.15) !important; color: #0369a1 !important; font-weight: 700; }
			`}</style>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				style={{
					width: '100%',
					padding: '11px 12px',
					border: `${open || hasError ? 2 : 1}px solid ${open ? '#3db8e0' : (hasError ? '#7ec8e6' : COLORS.borderStrong)}`,
					borderRadius: 12,
					fontSize: 14,
					fontFamily: FONTS.body,
					background: open ? '#f0faff' : (hasError ? '#f1f9ff' : '#fff'),
					outline: 'none',
					boxSizing: 'border-box',
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					textAlign: 'left',
					color: selected ? '#1e293b' : '#94a3b8',
					transition: 'border-color 0.2s, background 0.2s',
				}}
			>
				<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
					{selected ? selected.name : placeholder}
				</span>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none"
					style={{ flexShrink: 0, marginLeft: 6, transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
					<path d="M2 4.5L7 9.5L12 4.5" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>
			{open && (
				<div
					className="mp-aselect-list"
					style={{
						position: 'absolute',
						top: 'calc(100% + 4px)',
						left: 0,
						right: 0,
						background: '#fff',
						border: '1px solid rgba(61,184,224,0.45)',
						borderRadius: 12,
						boxShadow: '0 8px 28px rgba(8,34,60,0.13), 0 2px 8px rgba(61,184,224,0.1)',
						zIndex: 9999,
						overflow: 'hidden',
					}}
				>
					{options.map((opt, i) => (
						<div
							key={opt.id}
							className={`mp-aselect-option${String(opt.id) === String(value) ? ' mp-aselect-selected' : ''}`}
							onMouseDown={() => { onChange(opt.id); setOpen(false); }}
							style={{
								padding: '10px 14px',
								fontSize: 14,
								fontFamily: FONTS.body,
								cursor: 'pointer',
								color: '#1e293b',
								borderBottom: i < options.length - 1 ? '1px solid rgba(226,232,240,0.7)' : 'none',
								animationDelay: `${i * 40}ms`,
								background: 'transparent',
							}}
						>
							{opt.name}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default function MercadoPagoOtros({
	carritoId,
	clienteId,
	total,
	onPaymentSuccess,
	onPaymentError,
	onLoading,
	onBack,
	embedded = false
}) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [mpLoaded, setMpLoaded] = useState(false);
	const [mp, setMp] = useState(null);
	const [docTypes, setDocTypes] = useState([]);
	const [paymentMethods] = useState(OTHER_PAYMENT_METHOD_OPTIONS);

	// Form state
	const [payerFirstName, setPayerFirstName] = useState('');
	const [payerLastName, setPayerLastName] = useState('');
	const [email, setEmail] = useState('');
	const [identificationType, setIdentificationType] = useState('');
	const [identificationNumber, setIdentificationNumber] = useState('');
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pagoefectivo_atm');
	const [errors, setErrors] = useState({});

	const handleExpiredSession = () => {
		['auth_token', 'cliente_id', 'cliente_correo', 'cliente_nombre', 'cliente_numero', 'cliente_documento']
			.forEach((key) => localStorage.removeItem(key));
		onPaymentError('Se cerró su sesión, vuelva a ingresar.');
		window.location.href = '/login';
	};

	useEffect(() => {
		const loadEmail = async () => {
			const authToken = localStorage.getItem('auth_token');
			if (!authToken) return;
			try {
				const meRes = await fetch('/api/clientes/me', { headers: { Authorization: `Bearer ${authToken}` } });
				if (meRes.status === 401) {
					handleExpiredSession();
					return;
				}
				const meJson = await meRes.json();
				if (meJson?.cliente?.correo) setEmail(meJson.cliente.correo);
			} catch {}
		};
		loadEmail();
	}, []);

	// 1. Cargar SDK de Mercado Pago
	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://sdk.mercadopago.com/js/v2';
		script.async = true;

		script.onload = () => {
			if (!window.MercadoPago) {
				onPaymentError('No se pudo cargar Mercado Pago SDK');
				return;
			}

			const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, {
				locale: 'es-PE'
			});

			setMp(mpInstance);
			setMpLoaded(true);
		};

		document.body.appendChild(script);

		return () => {
			if (document.body.contains(script)) {
				document.body.removeChild(script);
			}
		};
	}, [onPaymentError]);

	// 2. Obtener tipos de documentos cuando MP cargue
	useEffect(() => {
		if (!mp) return;

		const getDocTypes = async () => {
			try {
				console.log('[OTROS] Obteniendo tipos de documento...');
				const types = await mp.getIdentificationTypes();
				console.log('[OTROS] Tipos de documento:', types);
				setDocTypes(types || []);

				if (types && types.length > 0) {
					setIdentificationType(types[0].id);
				}
			} catch (err) {
				console.error('[OTROS] Error obteniendo tipos de documento:', err);
				onPaymentError('Error al obtener tipos de documento');
			}
		};

		getDocTypes();
	}, [mp]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		const nextErrors = {};
		if (payerFirstName.trim().length < 2) nextErrors.payerFirstName = 'Ingresa un nombre válido';
		if (payerLastName.trim().length < 2) nextErrors.payerLastName = 'Ingresa un apellido válido';
		if (!emailRegex.test(email.trim())) nextErrors.email = 'Ingresa un correo válido';
		if (!identificationType) nextErrors.identificationType = 'Selecciona un documento';
		if (identificationNumber.replace(/\D/g, '').length < 8) nextErrors.identificationNumber = 'Ingresa un documento válido';
		if (!selectedPaymentMethod) nextErrors.selectedPaymentMethod = 'Selecciona un método de pago';
		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			return;
		}

		setIsProcessing(true);
		onLoading(true);

		try {
			if (!payerFirstName || !payerLastName || !email || !identificationType || !identificationNumber) {
				throw new Error('Por favor completa todos los campos');
			}

			const authToken = localStorage.getItem('auth_token');
			const clienteIdLS = localStorage.getItem('cliente_id');

			if (!authToken || !clienteIdLS) {
				throw new Error('Se cerró su sesión, vuelva a ingresar.');
			}

			const paymentData = {
				transaction_amount: Number(total),
				description: `Pedido VIDRIOBRAS - Carrito ${carritoId}`,
				payment_method_id: selectedPaymentMethod,
				payer: {
					email: email,
					first_name: payerFirstName,
					last_name: payerLastName,
					identification: {
						type: identificationType,
						number: identificationNumber
					}
				},
				carrito_id: carritoId,
				cliente_id: clienteIdLS
			};

			console.log('[OTROS] Enviando pago:', paymentData);

			const res = await fetch('/api/pagos/procesar_otros_metodos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify(paymentData)
			});

			if (res.status === 401) {
				handleExpiredSession();
				return;
			}

			const data = await res.json();
			console.log('[OTROS] Respuesta completa:', data);
			console.log('[OTROS] External URL:', data.external_resource_url);
			console.log('[OTROS] Success:', data.success);

			if (!res.ok || !data.success) {
				throw new Error(data?.message || 'Pago rechazado');
			}

			// Si hay external_resource_url (PagoEfectivo), redirigir
			if (data.external_resource_url) {
				console.log('[OTROS] Redirigiendo a:', data.external_resource_url);
				window.location.href = data.external_resource_url;
			} else {
				console.log('[OTROS] ✅ Pago procesado:', data);
				onPaymentSuccess(data);
			}

		} catch (err) {
			console.error('[OTROS] Error:', err);
			onPaymentError(err.message || 'Error al procesar el pago');
		} finally {
			setIsProcessing(false);
			onLoading(false);
		}
	};

	return (
		<div style={{
			padding: embedded ? 0 : 16,
			border: embedded ? 'none' : `1px solid ${COLORS.borderStrong}`,
			borderRadius: embedded ? 0 : 20,
			width: '100%',
			minWidth: 0,
			background: embedded ? 'transparent' : 'linear-gradient(180deg, #ffffff, #f8fbff)',
			boxShadow: embedded ? 'none' : '0 16px 34px rgba(15,23,42,0.08)',
			display: 'grid',
			gap: 12,
			boxSizing: 'border-box',
		}}>


			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: embedded ? 2 : 8 }}>
			<h3 style={{
				fontFamily: FONTS.heading,
				color: COLORS.primary,
				fontSize: embedded ? 0 : 18,
				margin: 0,
				height: embedded ? 0 : 'auto',
				overflow: embedded ? 'hidden' : 'visible',
				fontWeight: 700,
			}}>
				Otros métodos
			</h3>
			</div>

		<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
			{/* Nombre + Apellido en fila */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
				<div>
					<label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontFamily: FONTS.heading, fontSize: 12 }}>Nombre</label>
					<input
						type="text"
						value={payerFirstName}
						onChange={(e) => {
							setPayerFirstName(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñÜü\s]/g, ''));
							setErrors((prev) => ({ ...prev, payerFirstName: '' }));
						}}
						placeholder="Juan"
						required
						inputMode="text"
						style={textStyle(Boolean(errors.payerFirstName))}
					/>
					{errors.payerFirstName && <div style={{ marginTop: 4, color: COLORS.error, fontSize: 11, fontFamily: FONTS.body }}>{errors.payerFirstName}</div>}
				</div>
				<div>
					<label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontFamily: FONTS.heading, fontSize: 12 }}>Apellido</label>
					<input
						type="text"
						value={payerLastName}
						onChange={(e) => {
							setPayerLastName(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñÜü\s]/g, ''));
							setErrors((prev) => ({ ...prev, payerLastName: '' }));
						}}
						placeholder="Pérez"
						required
						inputMode="text"
						style={textStyle(Boolean(errors.payerLastName))}
					/>
					{errors.payerLastName && <div style={{ marginTop: 4, color: COLORS.error, fontSize: 11, fontFamily: FONTS.body }}>{errors.payerLastName}</div>}
				</div>
			</div>

			{/* Email */}
			<div>
				<label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontFamily: FONTS.heading, fontSize: 12 }}>
					Correo electrónico
				</label>
				<input
					type="email"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						setErrors((prev) => ({ ...prev, email: '' }));
					}}
					placeholder="tu@email.com"
					required
					style={textStyle(Boolean(errors.email))}
				/>
				{errors.email && <div style={{ marginTop: 4, color: COLORS.error, fontSize: 11, fontFamily: FONTS.body }}>{errors.email}</div>}
			</div>

			{/* Tipo doc + Número doc en fila */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
				<div>
					<label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontFamily: FONTS.heading, fontSize: 12 }}>Tipo de documento</label>
					<AnimatedSelect
						options={docTypes}
						value={identificationType}
						onChange={(id) => { setIdentificationType(id); setErrors((prev) => ({ ...prev, identificationType: '' })); }}
						hasError={Boolean(errors.identificationType)}
						placeholder="Selecciona"
					/>
					{errors.identificationType && <div style={{ marginTop: 4, color: COLORS.error, fontSize: 11, fontFamily: FONTS.body }}>{errors.identificationType}</div>}
				</div>
				<div>
					<label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontFamily: FONTS.heading, fontSize: 12 }}>Número de documento</label>
					<input
						type="text"
						value={identificationNumber}
						onChange={(e) => {
							setIdentificationNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
							setErrors((prev) => ({ ...prev, identificationNumber: '' }));
						}}
						placeholder="12345678"
						required
						style={textStyle(Boolean(errors.identificationNumber))}
					/>
					{errors.identificationNumber && <div style={{ marginTop: 4, color: COLORS.error, fontSize: 11, fontFamily: FONTS.body }}>{errors.identificationNumber}</div>}
				</div>
			</div>

			{/* Método de Pago */}
			<div>
				<label style={{ fontWeight: 700, display: 'block', marginBottom: 4, fontFamily: FONTS.heading, fontSize: 12 }}>Método de pago</label>
				<AnimatedSelect
					options={paymentMethods}
					value={selectedPaymentMethod}
					onChange={(id) => { setSelectedPaymentMethod(id); setErrors((prev) => ({ ...prev, selectedPaymentMethod: '' })); }}
					hasError={Boolean(errors.selectedPaymentMethod)}
				/>
				{errors.selectedPaymentMethod && <div style={{ marginTop: 4, color: COLORS.error, fontSize: 11, fontFamily: FONTS.body }}>{errors.selectedPaymentMethod}</div>}
			</div>

				{/* Información sobre PagoEfectivo */}
				{selectedPaymentMethod === 'pagoefectivo_atm' && (
					<div style={{
						position: 'relative',
						display: 'flex',
						alignItems: 'flex-start',
						gap: 10,
						background: 'linear-gradient(135deg, rgba(0,20,50,0.95), rgba(0,35,70,0.98))',
						border: '1px solid rgba(128,194,220,0.5)',
						padding: '10px 12px',
						borderRadius: 12,
						fontSize: 12,
						color: '#cbe8ff',
						fontFamily: FONTS.body,
						boxShadow: '0 0 14px rgba(128,194,220,0.2), 0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(128,194,220,0.12)',
						lineHeight: 1.45,
					}}>
						<span style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 18,
							height: 18,
							borderRadius: '50%',
							background: '#80C2DC',
							color: '#00233f',
							fontSize: 11,
							fontWeight: 800,
							flexShrink: 0,
							marginTop: 1,
						}}>i</span>
						<span>
							<strong style={{ color: '#d9f0ff' }}>PagoEfectivo:</strong>{' '}
							Después de procesar, recibirás un código para pagar en cualquier cajero automático de las principales redes del Perú.
						</span>
					</div>
				)}

				{/* Botón enviar */}
				<button
					type="submit"
					disabled={isProcessing}
					style={{
						width: 320,
						maxWidth: '100%',
						alignSelf: 'center',
						padding: '12px 14px',
						background: isProcessing ? '#94a3b8' : 'linear-gradient(145deg, #0ea5c6 0%, #0284c7 55%, #0369a1 100%)',
						color: 'white',
						border: '1px solid rgba(14,116,144,0.55)',
						borderRadius: 12,
						fontWeight: 800,
						cursor: isProcessing ? 'not-allowed' : 'pointer',
						fontFamily: FONTS.heading,
						fontSize: 16,
						boxShadow: isProcessing
							? 'none'
							: 'inset 0 2px 10px rgba(255,255,255,0.16), inset 0 -4px 10px rgba(2,60,94,0.55), 0 4px 10px rgba(2,132,199,0.18)',
					}}
				>
					{isProcessing ? 'Procesando...' : `Pagar S/ ${total.toFixed(2)}`}
				</button>
			</form>
		</div>
	);
}
