import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "accent";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 select-none whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none active:translate-y-[1px]";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-800 shadow-soft focus-visible:outline-accent",
  secondary:
    "bg-white text-brand border border-border hover:border-brand-600 hover:text-brand-800",
  ghost: "text-brand hover:bg-brand-50",
  outline:
    "border border-brand/30 text-brand hover:bg-brand hover:text-white",
  accent: "bg-accent text-white hover:bg-accent-strong shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  ),
);
Button.displayName = "Button";

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ to, variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return (
    <Link to={to} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}
