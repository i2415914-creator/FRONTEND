import { BUTTON_VARIANTS, FONTS } from '../../colors';

const sizeStyles = {
  sm: { padding: '8px 12px', fontSize: 13, borderRadius: 10 },
  md: { padding: '10px 16px', fontSize: 14, borderRadius: 12 },
  lg: { padding: '12px 22px', fontSize: 15, borderRadius: 14 },
};

function BrandButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style = {},
  type = 'button',
  disabled = false,
  ...props
}) {
  const variantStyle = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  const hoverStyles = {
    transform: 'translateY(-2px)',
    boxShadow: variant === 'ghost' 
      ? '0 4px 12px rgba(0,0,0,0.1)'
      : 'updatedBoxShadow'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-heading font-bold transition-all duration-200 hover:shadow-lg active:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none ${className}`}
      style={{
        ...sizeStyle,
        ...variantStyle,
        fontFamily: FONTS.heading,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        letterSpacing: '0.3px',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default BrandButton;
