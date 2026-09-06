import type {
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "line";
}) {
  const look =
    variant === "primary"
      ? "bg-forest text-bg shadow-sm hover:-translate-y-0.5 hover:bg-forest-deep hover:shadow-md"
      : variant === "line"
        ? "border border-line-strong bg-surface text-ink hover:-translate-y-0.5 hover:border-forest/40 hover:bg-white"
        : "text-ink-soft hover:bg-bg-warm";
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-all duration-200 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none",
        look,
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="flex items-baseline justify-between gap-3 font-medium text-ink-soft">
        {label}
        {hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

const fieldClass =
  "min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none transition-all duration-200 placeholder:text-muted focus:border-forest focus:bg-white focus:shadow-[0_0_0_3px_rgba(36,72,59,0.08)]";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

export function Card({
  className,
  children,
  interactive = false,
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-line/90 bg-surface p-5 shadow-card",
        interactive && "transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "forest" | "clay";
}) {
  const look =
    tone === "forest"
      ? "border-forest/15 bg-forest-soft text-forest-deep"
      : tone === "clay"
        ? "border-clay/15 bg-clay/10 text-clay"
        : "border-line bg-bg-warm text-ink-soft";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide", look)}>
      {children}
    </span>
  );
}

export function FormBox({
  title,
  children,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { title: string }) {
  return (
    <form
      className="grid gap-3 rounded-xl border border-line bg-bg-warm/75 p-4 shadow-card"
      {...props}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="size-2 rounded-full bg-clay" />
        <p className="font-display text-lg text-ink">{title}</p>
      </div>
      {children}
    </form>
  );
}
