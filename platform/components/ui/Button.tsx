import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';

// KUKO WAY button language (concept §20): primary is solid and gently
// rounded ("START PRACTICE →"), secondary is outlined ("EXPLORE"). `inverse`
// and `inverse-ghost` are for the always-dark practice mode / video surfaces
// (bg-night) — light text on near-black in both themes.
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse' | 'inverse-ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary:
    'bg-transparent text-ink-900 border border-ink-900/25 hover:border-ink-900/40 hover:bg-sand-100 focus-visible:outline-brand-600',
  ghost: 'bg-transparent text-ink-700 hover:bg-sand-100 focus-visible:outline-brand-600',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  inverse: 'bg-[#f4f0e8] text-night hover:bg-white focus-visible:outline-[#f4f0e8]',
  'inverse-ghost': 'bg-transparent text-[#f4f0e8] hover:bg-white/10 focus-visible:outline-[#f4f0e8]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});
