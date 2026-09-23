import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function PageHeader({
  title,
  description,
  backTo,
  action,
}: {
  title: string;
  description?: string;
  backTo?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {backTo && (
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
