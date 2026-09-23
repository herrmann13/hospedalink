import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SpinnerGap } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/admin/PageHeader";
import { Field, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";

export function Configuracoes() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<{ commissionRate: number }>("/api/admin/settings"),
  });
  const [rate, setRate] = useState("");

  const save = useMutation({
    mutationFn: (commissionRate: number) =>
      api.patch("/api/admin/settings", { commissionRate }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  const current = data?.commissionRate ?? 10;

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Parâmetros gerais do negócio."
      />

      <div className="max-w-md rounded-2xl border border-border bg-white p-6">
        <Field
          label="Taxa de captação padrão (%)"
          hint="Percentual aplicado sobre o valor da hospedagem nas propostas."
        >
          <Input
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={rate === "" ? String(current) : rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>

        <div className="mt-5 flex items-center gap-3">
          <Button
            onClick={() => save.mutate(Number(rate === "" ? current : rate))}
            disabled={save.isPending}
          >
            {save.isPending ? <SpinnerGap size={16} className="animate-spin" /> : null}
            Salvar
          </Button>
          {save.isSuccess && <span className="text-sm text-accent">Salvo.</span>}
        </div>
      </div>
    </div>
  );
}
