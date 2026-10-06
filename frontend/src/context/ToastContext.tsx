'use client';

import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  /** Si absent, un id est généré */
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  /** Durée d’affichage en ms (défaut 3000) */
  duration?: number;
  /** Vignette affichée à gauche (ex. photo du produit) */
  image?: string;
  /** Lien d’action à droite du message */
  action?: { label: string; href: string };
};

type ToastRecord = ToastOptions & {
  id: string;
  duration: number;
};

type ToastContextValue = {
  toast: {
    show: (options: ToastOptions) => string;
    success: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;
    info: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
  };
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3000;
const EXIT_MS = 280;
const MAX_STACK = 6;

function variantIcon(variant: ToastVariant) {
  const common = 'h-5 w-5 shrink-0';
  switch (variant) {
    case 'success':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'info':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return null;
  }
}

function variantStyles(variant: ToastVariant): { wrap: string; icon: string; bar: string } {
  switch (variant) {
    case 'success':
      return {
        wrap: 'border-[var(--ochre)]/35 bg-[var(--ivory)] ring-1 ring-[var(--ochre)]/15',
        icon: 'text-[var(--ochre)]',
        bar: 'bg-[var(--ochre)]',
      };
    case 'error':
      return {
        wrap: 'border-[var(--brick)]/40 bg-[var(--ivory)] ring-1 ring-[var(--brick)]/12',
        icon: 'text-[var(--brick)]',
        bar: 'bg-[var(--brick)]',
      };
    case 'info':
      return {
        wrap: 'border-[var(--wood)]/18 bg-[var(--ivory)] ring-1 ring-[var(--wood)]/08',
        icon: 'text-[var(--ochre)]',
        bar: 'bg-[var(--ochre)]/85',
      };
    case 'warning':
      return {
        wrap: 'border-[color:rgba(180,83,9,.45)] bg-[var(--ivory)] ring-1 ring-[color:rgba(180,83,9,.12)]',
        icon: 'text-[color:#b45309]',
        bar: 'bg-[color:#b45309]',
      };
    default:
      return {
        wrap: 'border-[var(--wood)]/15 bg-[var(--ivory)]',
        icon: 'text-[var(--wood)]',
        bar: 'bg-[var(--ochre)]',
      };
  }
}

type ToastItemProps = {
  record: ToastRecord;
  onDismiss: (id: string) => void;
};

function ToastItem({ record, onDismiss }: ToastItemProps) {
  const { id, title, message, variant = 'info', duration, image, action } = record;
  const styles = variantStyles(variant);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const clearTimers = useCallback(() => {
    if (dismissTimerRef.current != null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    dismissTimerRef.current = window.setTimeout(() => {
      setLeaving(true);
      exitTimerRef.current = window.setTimeout(() => onDismiss(id), EXIT_MS);
    }, duration);
    return () => clearTimers();
  }, [duration, id, onDismiss, clearTimers]);

  const live = variant === 'error' ? 'assertive' : 'polite';

  const handleManualClose = () => {
    clearTimers();
    setLeaving(true);
    exitTimerRef.current = window.setTimeout(() => onDismiss(id), EXIT_MS);
  };

  return (
    <div
      role="status"
      aria-live={live}
      aria-atomic="true"
      className={`relative pointer-events-auto w-full max-w-[min(100vw-2rem,22rem)] rounded-2xl border shadow-[0_12px_40px_rgba(44,26,14,.14)] transition-all duration-300 ease-out ${
        entered && !leaving ? 'translate-x-0 opacity-100' : 'translate-y-2 opacity-0 sm:translate-x-[calc(100%+1rem)] sm:translate-y-0'
      } ${styles.wrap}`}
    >
      <div className="flex items-center gap-3 p-3 pr-10 sm:p-4 sm:pr-10">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-[var(--wood)]/10" />
        ) : (
          <span className={`mt-0.5 ${styles.icon}`}>{variantIcon(variant)}</span>
        )}
        <div className="min-w-0 flex-1">
          {title ? (
            <p className={`font-ui text-sm font-semibold leading-snug text-[var(--wood)] ${image ? 'truncate' : ''}`}>{title}</p>
          ) : null}
          <p
            className={`font-ui text-sm leading-relaxed text-[var(--wood)]/90 ${title ? 'mt-1' : ''}`}
          >
            {image && variant === 'success' ? <span className={`mr-1 font-bold ${styles.icon}`}>✓</span> : null}
            {message}
          </p>
          {action ? (
            <Link
              href={action.href}
              onClick={handleManualClose}
              className="mt-1.5 inline-block font-ui text-xs font-bold text-[var(--ochre)] underline-offset-2 hover:underline"
            >
              {action.label} →
            </Link>
          ) : null}
        </div>
      </div>
      <div className="h-0.5 w-full overflow-hidden bg-[var(--wood)]/10">
        <div
          className={`h-full origin-left will-change-transform ${styles.bar}`}
          style={{
            animation: `toast-progress-shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleManualClose}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--wood)]/50 transition hover:bg-[var(--wood)]/08 hover:text-[var(--wood)]"
        aria-label="Fermer la notification"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const push = useCallback(
    (options: ToastOptions): string => {
      const id = options.id ?? (typeof crypto !== 'undefined' ? crypto.randomUUID() : `toast-${Date.now()}`);
      const duration = options.duration ?? DEFAULT_DURATION_MS;
      const record: ToastRecord = { ...options, id, duration };
      setToasts((prev) => {
        const next = [...prev, record];
        if (next.length > MAX_STACK) return next.slice(-MAX_STACK);
        return next;
      });
      return id;
    },
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: {
        show: (options: ToastOptions) => push(options),
        success: (message: string, title?: string) =>
          push({ message, title, variant: 'success' }),
        error: (message: string, title?: string) => push({ message, title, variant: 'error' }),
        info: (message: string, title?: string) => push({ message, title, variant: 'info' }),
        warning: (message: string, title?: string) =>
          push({ message, title, variant: 'warning' }),
      },
      dismiss,
      dismissAll,
    }),
    [push, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[250] flex max-h-[100dvh] flex-col-reverse items-center gap-2 overflow-visible p-3 sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-20 sm:w-auto sm:flex-col sm:items-end sm:gap-3 sm:p-5"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div key={t.id} className="relative">
            <ToastItem record={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé dans un ToastProvider');
  }
  return ctx;
}
