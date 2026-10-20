import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { DotsThreeVertical } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export type RowAction =
  | { label: string; icon?: React.ReactNode; to: string; danger?: boolean }
  | { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean };

const MENU_WIDTH = 208;

/** Botão de "mais ações" por linha de tabela. O menu é renderizado em portal para não ser cortado pelo overflow da tabela. */
export function RowActions({ actions, label = "Ações" }: { actions: RowAction[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const fitsBelow = rect.bottom + 6 + menuHeight <= window.innerHeight;
    setPosition({
      top: fitsBelow ? rect.bottom + 6 : rect.top - 6 - menuHeight,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const itemClass = (danger?: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors",
      danger ? "text-red-600 hover:bg-red-50" : "text-ink hover:bg-surface",
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setPosition(null);
          setOpen((v) => !v);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink",
          open && "bg-surface-2 text-ink",
        )}
      >
        <DotsThreeVertical size={20} weight="bold" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              width: MENU_WIDTH,
              visibility: position ? "visible" : "hidden",
            }}
            className="fixed z-50 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-card"
          >
            {actions.map((action) =>
              "to" in action ? (
                <Link
                  key={action.label}
                  to={action.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemClass(action.danger)}
                >
                  {action.icon}
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    action.onClick();
                  }}
                  className={itemClass(action.danger)}
                >
                  {action.icon}
                  {action.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
