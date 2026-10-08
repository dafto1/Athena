// Primitive UI components shared across all Athena pages.
// Each component is small, focused, and styled to match the design system.

import Link from "next/link";
import { X } from "lucide-react";

// ─── Typography ──────────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-slate-600">{description}</p>
      )}
    </header>
  );
}

// ─── Form primitives ─────────────────────────────────────────────────────────

const inputBase =
  "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea {...props} className={`${inputBase} ${props.className ?? ""}`} />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select {...props} className={`${inputBase} ${props.className ?? ""}`} />
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:opacity-50",
  secondary:
    "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:opacity-50",
  ghost:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleProps) {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className ?? ""}`;
}

const iconGhostClass =
  "rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:cursor-not-allowed disabled:opacity-50";
const iconDangerClass =
  "rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps) {
  return (
    <button
      {...props}
      className={buttonClassName({ variant, size, className })}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: ButtonStyleProps & { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonClassName({ variant, size, className })}>
      {children}
    </Link>
  );
}

export function ToolbarButton({
  label,
  active = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
}) {
  return (
    <Button
      {...props}
      type="button"
      variant={active ? "primary" : "secondary"}
      size="sm"
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function IconButton({
  label,
  variant = "ghost",
  active = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "ghost" | "danger";
  active?: boolean;
}) {
  const cls = variant === "danger" ? iconDangerClass : iconGhostClass;
  const activeCls = active ? "bg-violet-100 text-violet-700" : "";
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`${cls} ${activeCls} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function IconLink({
  href,
  label,
  children,
  download,
  external = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  download?: string;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        download={download}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className={iconGhostClass}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={label} title={label} className={iconGhostClass}>
      {children}
    </Link>
  );
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm"
    >
      <span>{message}</span>
      <IconButton label="Dismiss error" onClick={onDismiss} className="ml-3">
        <X className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-3 text-base font-semibold text-slate-800">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Badge / Tag ─────────────────────────────────────────────────────────────

type BadgeVariant = "slate" | "violet" | "amber" | "rose" | "emerald";

const badgeVariants: Record<BadgeVariant, string> = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  violet: "bg-violet-100 text-violet-800 border-violet-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  rose: "bg-rose-50 text-rose-800 border-rose-200",
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export function Badge({
  children,
  variant = "slate",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeVariants[variant]}`}
    >
      {children}
    </span>
  );
}
