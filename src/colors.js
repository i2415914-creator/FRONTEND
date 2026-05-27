export const COLORS = {
  // Paleta corporativa vidriería
  primary: "#941918",        // Rojo corporativo
  secondary: "#80C2DC",      // Celeste vidrio
  accent: "#ffd600",         // Amarillo dorado
  
  // Variantes de primarios
  primaryLight: "#c94543",
  primaryDark: "#6b100f",
  secondaryLight: "#a8d9ed",
  secondaryDark: "#5a8ba8",
  accentLight: "#ffeb4d",
  accentDark: "#cc9f04",
  
  // Soporte
  dark: "#1a237e",
  light: "#e3f2fd",
  black: "#000000",
  white: "#ffffff",
  glass: "#c7ecff",
  steel: "#64748b",
  
  // Colores de estado
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  
  // Grises
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  
  border: "#e5e7eb",
  borderStrong: "#cbd5e1",
  text: "#1f2937",
  textLight: "#6b7280",
  background: "#ffffff",
  backgroundLight: "#f9fafb",
  surface: "#f8fbff",
  surfaceDark: "#0f172a",
};

export const FONTS = {
  heading: "'Oswald', sans-serif",
  body: "'Open Sans', sans-serif",
};

export const BRAND_THEME = {
  // Tema corporativo vidriería con celeste, rojo y amarillo
  panelGradient: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.white} 50%, ${COLORS.glass} 100%)`,
  heroGradient: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.secondary} 50%, ${COLORS.accent} 100%)`,
  accentGradient: `linear-gradient(120deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`,
  redGradient: `linear-gradient(120deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
  glassBorder: `1px solid ${COLORS.borderStrong}`,
  glassShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
};

export const BUTTON_VARIANTS = {
  primary: {
    background: COLORS.primary,
    color: COLORS.white,
    border: `2px solid ${COLORS.primary}`,
    boxShadow: '0 10px 22px rgba(148, 25, 24, 0.26)',
  },
  secondary: {
    background: COLORS.secondary,
    color: COLORS.white,
    border: `2px solid ${COLORS.secondary}`,
    boxShadow: '0 10px 22px rgba(128, 194, 220, 0.25)',
  },
  accent: {
    background: COLORS.accent,
    color: COLORS.primaryDark,
    border: `2px solid ${COLORS.accent}`,
    boxShadow: '0 10px 22px rgba(255, 214, 0, 0.25)',
  },
  outline: {
    background: COLORS.white,
    color: COLORS.primary,
    border: `2px solid ${COLORS.primary}`,
    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.1)',
  },
  danger: {
    background: COLORS.error,
    color: COLORS.white,
    border: `2px solid ${COLORS.error}`,
    boxShadow: '0 10px 20px rgba(239, 68, 68, 0.25)',
  },
  ghost: {
    background: COLORS.backgroundLight,
    color: COLORS.text,
    border: `2px solid ${COLORS.border}`,
    boxShadow: 'none',
  },
};

export const TOAST_VARIANTS = {
  success: {
    background: `linear-gradient(120deg, ${COLORS.success} 0%, #059669 100%)`,
    border: `1px solid #059669`,
    icon: COLORS.white,
  },
  error: {
    background: `linear-gradient(120deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    border: `1px solid ${COLORS.primaryDark}`,
    icon: COLORS.white,
  },
  warning: {
    background: `linear-gradient(120deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
    border: `1px solid ${COLORS.accentDark}`,
    icon: COLORS.primaryDark,
  },
  info: {
    background: `linear-gradient(120deg, ${COLORS.secondary} 0%, ${COLORS.secondaryDark} 100%)`,
    border: `1px solid ${COLORS.secondaryDark}`,
    icon: COLORS.white,
  },
};
