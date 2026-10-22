type Variant =
  | 'primary'
  | 'dark'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'volt'
  | 'outline-light'
  | 'outline-danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-pitch text-white hover:bg-pitch-dark shadow-sm hover:shadow-md',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  outline: 'border border-line bg-white text-ink hover:border-ink',
  ghost: 'text-ink hover:bg-surface',
  danger: 'bg-danger text-white hover:opacity-90',
  // Dùng trên nền tối (hero, banner)
  'outline-danger':
    'border border-danger/40 bg-white text-danger hover:bg-danger-soft',
  volt: 'bg-volt text-ink hover:bg-white',
  'outline-light':
    'border border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

/** Class cho nút; dùng được cho cả <button> lẫn <Link>. */
export function buttonClass(
  variant: Variant = 'primary',
  size: Size = 'md',
  extra = '',
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}
