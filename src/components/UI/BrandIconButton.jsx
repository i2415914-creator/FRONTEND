import { COLORS } from '../../colors';

/**
 * BrandIconButton - Botón circular con icono estilo Vidriobras
 * 
 * Uso:
 * <BrandIconButton onClick={handleClick} ariaLabel="Usuario">
 *   <IconUser stroke={2.5} size={24} />
 * </BrandIconButton>
 * 
 * Props:
 * - children: Icono de Tabler Icons (required)
 * - onClick: Función al hacer clic
 * - ariaLabel: Texto descriptivo para accesibilidad
 * - size: Tamaño del botón - 'sm' | 'md' | 'lg' (default: 'md')
 * - className: Clases CSS adicionales
 * - disabled: Deshabilitar botón
 */
function BrandIconButton({ 
  children, 
  onClick, 
  ariaLabel, 
  size = 'md',
  className = '',
  disabled = false,
  ...props 
}) {
  // Tamaños de padding según el tamaño del botón
  const sizeStyles = {
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3'
  };

  return (
    <button
      className={`rounded-full transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${className}`}
      style={{ 
        color: COLORS.dark, 
        background: COLORS.light 
      }}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default BrandIconButton;
