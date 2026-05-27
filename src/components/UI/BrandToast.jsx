import {
  IconCircleCheck,
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react';
import { FONTS } from '../../colors';

const iconByType = {
  success: IconCircleCheck,
  error: IconAlertCircle,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
};

const toastPaletteByType = {
  success: {
    background: 'linear-gradient(135deg, rgba(128,194,220,0.50), rgba(90,139,168,0.42))',
    border: '1px solid rgba(128,194,220,0.82)',
    icon: '#effbff',
    text: '#f4fdff',
    shadow: '0 18px 38px rgba(90,139,168,0.42)',
  },
  info: {
    background: 'linear-gradient(135deg, rgba(128,194,220,0.50), rgba(90,139,168,0.42))',
    border: '1px solid rgba(128,194,220,0.82)',
    icon: '#effbff',
    text: '#f4fdff',
    shadow: '0 18px 38px rgba(90,139,168,0.42)',
  },
  warning: {
    background: 'linear-gradient(135deg, rgba(148,25,24,0.28), rgba(176,31,30,0.26))',
    border: '1px solid rgba(255,141,141,0.42)',
    icon: '#ffd9d9',
    text: '#ffecec',
    shadow: '0 18px 38px rgba(148,25,24,0.32)',
  },
  error: {
    background: 'linear-gradient(135deg, rgba(148,25,24,0.30), rgba(176,31,30,0.28))',
    border: '1px solid rgba(255,141,141,0.45)',
    icon: '#ffd9d9',
    text: '#ffecec',
    shadow: '0 18px 38px rgba(148,25,24,0.36)',
  },
};

function BrandToast({ toast, onClose }) {
  if (!toast) return null;

  const type = toast.tipo || 'info';
  const ToastIcon = iconByType[type] || IconInfoCircle;
  const palette = toastPaletteByType[type] || toastPaletteByType.info;

  return (
    <div
      className="fixed left-1/2 z-50 w-[min(94vw,640px)] rounded-2xl px-4 py-3 backdrop-blur-xl"
      style={{
        transform: 'translateX(-50%)',
        background: palette.background,
        border: palette.border,
        color: palette.text,
        boxShadow: palette.shadow,
        fontFamily: FONTS.body,
        top: 'calc(var(--navbar-height, 64px) + 18px)',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <ToastIcon 
          size={22} 
          stroke={2.2} 
          className="mt-0.5 shrink-0"
          style={{ color: palette.icon }}
        />
        <div className="flex-1">
          <p className="font-body text-sm font-semibold leading-5">
            {toast.mensaje}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificacion"
          className="rounded-lg p-1 transition hover:bg-white/20"
          style={{ color: palette.icon }}
        >
          <IconX size={18} />
        </button>
      </div>
    </div>
  );
}

export default BrandToast;
