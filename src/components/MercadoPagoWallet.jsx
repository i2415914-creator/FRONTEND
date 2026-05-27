import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../colors';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-31db4b36-66c5-4017-a197-d65775a236d4';

export default function MercadoPagoWallet({
	carritoId,
	clienteId,
	total,
	items,
	onPaymentSuccess,
	onPaymentError,
	onLoading,
	onBack
}) {
	const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
	const isMobile = viewportWidth < 768;

	useEffect(() => {
		const handleResize = () => setViewportWidth(window.innerWidth);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const [isLoading, setIsLoading] = useState(true);
	const [mpLoaded, setMpLoaded] = useState(false);
	const [preferenceId, setPreferenceId] = useState(null);
	const [error, setError] = useState(null);

	const handleExpiredSession = () => {
		['auth_token', 'cliente_id', 'cliente_correo', 'cliente_nombre', 'cliente_numero', 'cliente_documento']
			.forEach((key) => localStorage.removeItem(key));
		setError('Se cerró su sesión, vuelva a ingresar.');
		onPaymentError('Se cerró su sesión, vuelva a ingresar.');
		window.location.href = '/login';
	};

	// 1. Cargar SDK de Mercado Pago
	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://sdk.mercadopago.com/js/v2';
		script.async = true;

		script.onload = () => {
			if (!window.MercadoPago) {
				setError('No se pudo cargar Mercado Pago SDK');
				onPaymentError('No se pudo cargar Mercado Pago SDK');
				return;
			}
			setMpLoaded(true);
		};

		script.onerror = () => {
			setError('Error al cargar el SDK de Mercado Pago');
			onPaymentError('Error al cargar el SDK de Mercado Pago');
		};

		document.body.appendChild(script);

		return () => {
			if (document.body.contains(script)) {
				document.body.removeChild(script);
			}
		};
	}, [onPaymentError]);

	// 2. Crear preferencia en el backend
	useEffect(() => {
		if (!mpLoaded) return;

		const crearPreferencia = async () => {
			try {
				setIsLoading(true);
				const authToken = localStorage.getItem('auth_token');
				const clienteIdLS = localStorage.getItem('cliente_id');
				let emailCliente = localStorage.getItem('cliente_correo') || '';

				if (!authToken || !clienteIdLS) {
					throw new Error('Se cerró su sesión, vuelva a ingresar.');
				}

				if (!emailCliente) {
					try {
						const meRes = await fetch('/api/clientes/me', { headers: { Authorization: `Bearer ${authToken}` } });
						if (meRes.status === 401) {
							handleExpiredSession();
							return;
						}
						const meJson = await meRes.json();
						emailCliente = meJson?.cliente?.correo || '';
					} catch {}
				}

				const body = {
					carrito_id: carritoId,
					cliente_id: clienteIdLS,
					items: items || [],
					email_cliente: emailCliente,
					total: total,
					purpose: 'wallet_purchase'  // ✅ Especificar que es para Wallet
				};

				console.log('[WALLET] Creando preferencia:', body);

				const res = await fetch('/api/pagos/crear_preferencia', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${authToken}`
					},
					body: JSON.stringify(body)
				});

				if (res.status === 401) {
					handleExpiredSession();
					return;
				}

				const data = await res.json();
				console.log('[WALLET] Respuesta preferencia:', data);

				if (!res.ok || !data.success) {
					throw new Error(data?.message || 'No se pudo crear la preferencia');
				}

				setPreferenceId(data.preference_id);
				console.log('[WALLET] ✅ Preferencia creada:', data.preference_id);

			} catch (err) {
				console.error('[WALLET] Error creando preferencia:', err);
				setError(err.message);
				onPaymentError(err.message || 'Error al crear preferencia');
			} finally {
				setIsLoading(false);
			}
		};

		crearPreferencia();
	}, [mpLoaded]);

	// Solo popup: no inicializar el Brick en el DOM principal
	const handleOpenPopup = () => {
			if (!preferenceId) {
				setError('La preferencia de pago aún no está lista. Intenta nuevamente en unos segundos.');
				return;
			}

			const popup = window.open('', 'mp_wallet_popup', 'width=500,height=700');
			if (!popup) return;

			popup.document.write(`
				<html>
					<head>
						<title>Pagar con Mercado Pago</title>
						<style>
							body { font-family: Arial, sans-serif; background: #f9f9f9; margin:0; padding:0; }
							.header { background: ${COLORS.primary}; color: #fff; padding: 16px; text-align: center; font-size: 20px; }
							.info { background: #e3f2fd; color: #1565c0; padding: 10px; border-radius: 4px; margin: 16px; font-size: 13px; }
							.total { background: ${COLORS.primary}; color: #fff; padding: 12px; border-radius: 4px; margin: 16px; text-align: center; font-weight: bold; }
						</style>
					</head>
					<body>
						<div class="header">💳 Pagar con Cuenta Mercado Pago</div>
						<div class="total">Total a pagar: S/ ${Number(total).toFixed(2)}</div>
						<div id="wallet_container"></div>
						<div class="info">
							💡 <strong>Información:</strong><br />
							Inicia sesión con tu cuenta de Mercado Pago o Mercado Libre para pagar de forma segura. También puedes agregar una nueva tarjeta durante el pago.
						</div>
					</body>
				</html>
			`);
			popup.document.close();

			const script = popup.document.createElement('script');
			script.src = 'https://sdk.mercadopago.com/js/v2';
			script.async = true;
			script.onload = async () => {
				if (!popup.window.MercadoPago) {
					popup.alert('No se pudo cargar Mercado Pago SDK');
					return;
				}
				const mpInstance = new popup.window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
				try {
					await mpInstance.bricks().create('wallet', 'wallet_container', {
						initialization: { preferenceId },
						onError: (error) => {
							popup.alert('Error en el proceso de pago');
						},
						onSubmit: async (formData) => {
							// El pago se procesa automáticamente
						}
					});
				} catch (err) {
					popup.alert('Error al inicializar el formulario de pago');
				}
			};
			popup.document.body.appendChild(script);
	};

	return (
		<div style={{
			padding: isMobile ? 14 : 24,
			border: '1px solid rgba(128,194,220,0.45)',
			borderRadius: 24,
			maxWidth: '100%',
			background: 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(241,250,255,0.95) 100%)',
			boxShadow: '0 18px 42px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
			position: 'relative',
			overflow: 'hidden',
		}}>
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				height: 5,
				background: 'linear-gradient(120deg, #80C2DC 0%, #38bdf8 45%, #0284c7 100%)',
			}} />
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h3 style={{
					fontFamily: FONTS.heading,
					color: '#9b1c1c',
					fontSize: isMobile ? 22 : 28,
					margin: 0,
					lineHeight: 1,
					letterSpacing: 0.4,
				}}>
					Mercado Pago
				</h3>
				<button
					type="button"
					onClick={onBack}
					style={{
						padding: '8px 14px',
						border: '1px solid rgba(128,194,220,0.45)',
						borderRadius: 12,
						background: 'linear-gradient(135deg, #ffffff, #f2f8fc)',
						cursor: 'pointer',
						fontFamily: FONTS.body,
						fontWeight: 700,
						color: '#1f2937',
						boxShadow: '0 6px 16px rgba(15,23,42,0.08)',
					}}
				>
					Volver
				</button>
			</div>

			<div style={{ marginTop: 14, marginBottom: 16, fontFamily: FONTS.body, color: '#64748b', fontSize: 14 }}>
				Abriremos la experiencia oficial de Mercado Pago en una ventana segura para completar el cobro.
			</div>

			{/* Información del pago */}
			<div style={{
				background: 'linear-gradient(135deg, rgba(235,248,255,0.95), rgba(245,252,255,0.95))',
				color: '#9b1c1c',
				border: '1px solid rgba(128,194,220,0.45)',
				padding: '14px 16px',
				borderRadius: 16,
				marginBottom: 20,
				textAlign: 'center',
				fontWeight: 800,
				fontFamily: FONTS.heading,
				fontSize: 17,
				boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 24px rgba(14,116,144,0.12)',
			}}>
				Total a pagar: S/ {Number(total).toFixed(2)}
			</div>


			{/* Mensaje de carga */}
			{isLoading && (
				<div style={{
					textAlign: 'center',
					padding: 20,
					color: '#0f4c81',
					fontFamily: FONTS.body,
					background: 'linear-gradient(135deg, rgba(238,248,255,0.95), rgba(221,241,255,0.95))',
					border: '1px solid rgba(128,194,220,0.4)',
					borderRadius: 12,
				}}>
					Preparando formulario de pago...
				</div>
			)}

			{/* No mostrar error de inicialización del Brick aquí, solo errores de preferencia o de carga SDK */}
			{error && !preferenceId && (
				<div style={{
					background: 'linear-gradient(135deg, rgba(0,20,50,0.97), rgba(0,35,70,0.99))',
					color: 'rgba(200,235,255,0.95)',
					border: '1px solid rgba(128,194,220,0.55)',
					padding: 12,
					borderRadius: 12,
					marginBottom: 20,
					fontFamily: FONTS.body,
					boxShadow: '0 0 16px rgba(128,194,220,0.18), 0 4px 14px rgba(0,0,0,0.35)',
				}}>
					{error}
				</div>
			)}

			{/* Botón para abrir el Brick en popup */}
			{!isLoading && preferenceId && (
				<button
					type="button"
					onClick={handleOpenPopup}
					style={{
						padding: '16px 14px',
						background: 'linear-gradient(145deg, #0ea5c6 0%, #0284c7 55%, #0369a1 100%)',
						color: '#fff',
						border: '1px solid rgba(14,116,144,0.55)',
						borderRadius: 14,
						fontWeight: 'bold',
						cursor: 'pointer',
						fontSize: isMobile ? 16 : 18,
						width: isMobile ? '100%' : 'fit-content',
						minWidth: isMobile ? 0 : 360,
						maxWidth: isMobile ? '100%' : 'none',
						display: 'block',
						margin: '0 auto 16px',
						boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.16), inset 0 -4px 10px rgba(2,60,94,0.55), 0 4px 10px rgba(2,132,199,0.18)',
						fontFamily: FONTS.heading,
						letterSpacing: 0.2,
					}}
				>
					Abrir pago en ventana aparte
				</button>
			)}

			{/* Ya no se renderiza el Brick aquí, solo en el popup */}

			{/* Información adicional */}
			<div style={{
				marginTop: 20,
				padding: '14px 16px',
				background: 'linear-gradient(135deg, rgba(226,240,250,0.95), rgba(214,233,248,0.95))',
				border: '1px solid rgba(128,194,220,0.45)',
				borderRadius: 14,
				fontSize: 13,
				color: '#0f4c81',
				fontFamily: FONTS.body,
				lineHeight: 1.45,
			}}>
				<strong style={{ fontFamily: FONTS.heading }}>Información:</strong><br />
				Inicia sesión con tu cuenta de Mercado Pago o Mercado Libre para pagar de forma segura. También puedes agregar una nueva tarjeta durante el pago.
			</div>
		</div>
	);
}
