import { forwardRef, useId, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full rounded-xl border bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-surface";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlBase, "h-11", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(controlBase, "py-2.5 min-h-[96px] resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlBase, "h-11 appearance-none bg-no-repeat pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%235B6B7A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.75rem center",
      }}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, required, hint, error, children, className }: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const controlProps = { id, "aria-required": required || undefined, "aria-invalid": Boolean(error), "aria-describedby": error || hint ? `${id}-message` : undefined };
  const control = isValidElement<{ render?: (props: any) => React.ReactElement }>(children)
    ? children.props.render
      ? cloneElement(children, { render: (props: any) => cloneElement(children.props.render!(props), controlProps) })
      : cloneElement(children as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, controlProps)
    : children;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {control}
      {hint && !error && <p id={`${id}-message`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-message`} role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

interface CheckboxProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  description?: string;
}

export function Checkbox({ label, checked, onChange, error, description }: CheckboxProps) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 rounded focus-within:outline-2 focus-within:outline-accent">
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            checked ? "bg-accent border-accent" : "bg-white border-border",
            error && !checked && "border-red-500",
          )}
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.5 5 9l4.5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm leading-relaxed text-ink">
          {label}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      </label>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
