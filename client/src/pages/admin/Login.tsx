import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SpinnerGap, ArrowLeft } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/fields";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@hospedalink.com.br");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"
        >
          <ArrowLeft size={16} />
          Voltar ao site
        </Link>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M10 22V10h4.6c2.8 0 4.6 1.6 4.6 3.9 0 1.7-.9 3-2.5 3.5L20 22h-3.4l-2.9-4.2H12.9V22H10z" fill="#fff" />
                <circle cx="23.5" cy="8.5" r="1.7" fill="#1F7A5C" />
              </svg>
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight text-ink">
                Hospeda <span className="text-accent">Link</span>
              </p>
              <p className="text-xs text-muted">Painel administrativo</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Senha">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <SpinnerGap size={16} className="animate-spin" /> : null}
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Acesso restrito à equipe interna.
          </p>
        </div>
      </div>
    </div>
  );
}
