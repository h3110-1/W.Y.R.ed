import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full w-full flex justify-center">
      <div className="w-full max-w-md px-4 py-5 flex flex-col gap-4">{children}</div>
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface/90 backdrop-blur p-4 ${className}`}
    >
      {children}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  full?: boolean
}

export function Button({
  variant = 'primary',
  full,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-[15px] transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed select-none'
  const variants: Record<string, string> = {
    primary:
      'bg-gradient-to-br from-brand to-brand-2 text-white shadow-lg shadow-brand/20',
    secondary: 'bg-surface-2 text-text border border-border',
    ghost: 'bg-transparent text-muted hover:text-text',
    danger: 'bg-b/15 text-b border border-b/40',
  }
  return (
    <button
      className={`${base} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Input({
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-[16px] text-text placeholder:text-muted outline-none focus:border-brand ${className}`}
      {...rest}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </label>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-4xl font-black tracking-tight">
        <span className="text-text">w.y.</span>
        <span className="bg-gradient-to-br from-brand to-brand-2 bg-clip-text text-transparent">
          r.ed
        </span>
      </h1>
      <p className="mt-1 text-sm text-muted">Would You Rather, with your people</p>
    </div>
  )
}

export function Pill({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'good' | 'warn' | 'a' | 'b'
}) {
  const tones: Record<string, string> = {
    default: 'bg-surface-2 text-muted border-border',
    good: 'bg-good/15 text-good border-good/30',
    warn: 'bg-warn/15 text-warn border-warn/30',
    a: 'bg-a/15 text-a border-a/30',
    b: 'bg-b/15 text-b border-b/30',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-b">{children}</p>
}
