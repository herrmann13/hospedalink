import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { formatBRL, formatDate, daysBetween } from "@/lib/masks";
import type { AccommodationRequest, Negotiation, Partner, Proposal } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge, requestTone } from "@/components/ui/Badge";
import {
  REQUEST_STATUS_LABEL,
  NEGOTIATION_STATUS_LABEL,
  SERVICE_LABEL,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/fields";
import { Modal } from "@/components/ui/Modal";
import { SpinnerGap } from "@phosphor-icons/react";

const REQUEST_STATUSES = Object.keys(REQUEST_STATUS_LABEL) as (keyof typeof REQUEST_STATUS_LABEL)[];

export function SolicitacaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => api.get<{ request: AccommodationRequest & { internalNotes?: string | null } }>(`/api/admin/requests/${id}`),
  });

  const { data: partnersData } = useQuery({
    queryKey: ["partners"],
    queryFn: () => api.get<{ partners: Partner[] }>("/api/admin/partners"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<{ commissionRate: number }>("/api/admin/settings"),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["request", id] });
    qc.invalidateQueries({ queryKey: ["requests"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/api/admin/requests/${id}`, { status }),
    onSuccess: invalidate,
  });

  const saveNotes = useMutation({
    mutationFn: (internalNotes: string) => api.patch(`/api/admin/requests/${id}`, { internalNotes }),
    onSuccess: invalidate,
  });

  const [notes, setNotes] = useState("");
  const [partnerModal, setPartnerModal] = useState(false);
  const [proposalModal, setProposalModal] = useState(false);

  const request = data?.request;
  const partners = partnersData?.partners ?? [];
  const commissionRate = settingsData?.commissionRate ?? 10;

  if (isLoading || !request) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  const company = request.company;
  const nights = daysBetween(request.checkIn, request.checkOut);
  const negotiations = request.negotiations ?? [];
  const proposals = request.proposals ?? [];
  const contract = request.contracts?.[0];

  return (
    <div>
      <PageHeader
        backTo="/admin/solicitacoes"
        title={request.protocol}
        description={`Recebida em ${formatDate(request.createdAt)}`}
        action={
          <Badge tone={requestTone(request.status)}>
            {REQUEST_STATUS_LABEL[request.status]}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Empresa */}
          <Section title="Empresa">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Nome" value={company?.tradeName} />
              <Detail label="CNPJ" value={company?.cnpj} mono />
              <Detail label="Responsável" value={company?.contactName} />
              <Detail label="Cargo" value={company?.contactRole || "-"} />
              <Detail label="E-mail" value={company?.contactEmail} />
              <Detail label="Telefone" value={company?.contactPhone} />
            </dl>
          </Section>

          {/* Hospedagem */}
          <Section title="Hospedagem">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Quantidade de pessoas" value={String(request.numberOfGuests)} />
              <Detail label="Duração" value={`${nights} ${nights === 1 ? "dia" : "dias"}`} />
              <Detail label="Entrada" value={formatDate(request.checkIn)} />
              <Detail label="Saída" value={formatDate(request.checkOut)} />
              <Detail label="Local de trabalho" value={request.workLocation || "-"} />
              <Detail label="Orçamento" value={request.budgetRange || "-"} />
            </dl>
            <div className="mt-4 space-y-3">
              <Detail label="Preferência de acomodação" value={request.accommodationPreference.join(", ")} />
              {request.requirements && request.requirements.length > 0 && (
                <Detail
                  label="Serviços necessários"
                  value={request.requirements.map((s) => SERVICE_LABEL[s] ?? s).join(", ")}
                />
              )}
              {request.notes && <Detail label="Observações do cliente" value={request.notes} />}
            </div>
          </Section>

          {/* Parceiros associados */}
          <Section
            title="Parceiros considerados"
            action={
              <Button size="sm" variant="outline" onClick={() => setPartnerModal(true)}>
                <Plus size={16} />
                Associar parceiro
              </Button>
            }
          >
            {negotiations.length === 0 ? (
              <p className="text-sm text-muted">Nenhum parceiro associado ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {negotiations.map((n) => (
                  <NegotiationRow key={n.id} negotiation={n} onUpdate={invalidate} />
                ))}
              </ul>
            )}
          </Section>

          {/* Propostas */}
          <Section
            title="Propostas"
            action={
              <Button size="sm" variant="outline" onClick={() => setProposalModal(true)} disabled={partners.length === 0}>
                <Plus size={16} />
                Nova proposta
              </Button>
            }
          >
            {proposals.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma proposta cadastrada.</p>
            ) : (
              <ul className="space-y-3">
                {proposals.map((p) => (
                  <ProposalRow
                    key={p.id}
                    proposal={p}
                    onConvert={(proposalId) =>
                      api.post(`/api/admin/contracts`, { proposalId }).then(invalidate)
                    }
                    hasContract={!!contract && contract.proposalId === p.id}
                  />
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Coluna lateral: status e notas internas */}
        <div className="space-y-6">
          <Section title="Atendimento">
            <Field label="Status da solicitação">
              <Select
                value={request.status}
                onChange={(e) => updateStatus.mutate(e.target.value)}
                disabled={updateStatus.isPending}
              >
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {REQUEST_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </Section>

          <Section title="Observações da equipe">
            <Textarea
              defaultValue={request.internalNotes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Registre observações internas sobre o atendimento."
            />
            <Button
              size="sm"
              className="mt-3"
              onClick={() => saveNotes.mutate(notes || "")}
              disabled={saveNotes.isPending}
            >
              {saveNotes.isPending ? <SpinnerGap size={14} className="animate-spin" /> : null}
              Salvar observações
            </Button>
          </Section>

          {contract && (
            <Section title="Contrato vinculado">
              <dl className="space-y-3">
                <Detail label="Parceiro" value={contract.partner?.tradeName} />
                <Detail label="Valor total" value={formatBRL(contract.totalAmount)} />
                <Detail label="Taxa" value={formatBRL(contract.commissionAmount)} />
                <Detail label="Status" value={contract.status} />
              </dl>
            </Section>
          )}
        </div>
      </div>

      <AddPartnerModal
        open={partnerModal}
        onClose={() => setPartnerModal(false)}
        requestId={request.id}
        partners={partners}
        onDone={invalidate}
      />
      <AddProposalModal
        open={proposalModal}
        onClose={() => setProposalModal(false)}
        requestId={request.id}
        partners={partners}
        defaultGuests={request.numberOfGuests}
        defaultDays={nights}
        commissionRate={commissionRate}
        onDone={invalidate}
      />
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 text-sm text-ink ${mono ? "font-mono" : ""}`}>{value || "-"}</dd>
    </div>
  );
}

function NegotiationRow({ negotiation, onUpdate }: { negotiation: Negotiation; onUpdate: () => void }) {
  const update = useMutation({
    mutationFn: (status: string) => api.patch(`/api/admin/negotiations/${negotiation.id}`, { status }),
    onSuccess: onUpdate,
  });

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{negotiation.partner?.tradeName}</p>
          {negotiation.offeredDailyRate != null && (
            <p className="text-xs text-muted">
              Diária oferecida: {formatBRL(negotiation.offeredDailyRate)}
            </p>
          )}
        </div>
      </div>
      <Select
        value={negotiation.status}
        onChange={(e) => update.mutate(e.target.value)}
        className="w-full sm:w-44"
      >
        {Object.entries(NEGOTIATION_STATUS_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
    </li>
  );
}

function ProposalRow({
  proposal,
  onConvert,
  hasContract,
}: {
  proposal: Proposal;
  onConvert: (id: string) => void;
  hasContract: boolean;
}) {
  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{proposal.partner?.tradeName}</p>
          <p className="mt-0.5 text-xs text-muted">
            {proposal.numberOfGuests} hóspedes × {formatBRL(proposal.dailyRate ?? 0)} ×{" "}
            {proposal.numberOfDays} dias
          </p>
        </div>
        {hasContract ? (
          <Badge tone="accent">Contrato gerado</Badge>
        ) : (
          <Button size="sm" variant="accent" onClick={() => onConvert(proposal.id)}>
            <FileText size={14} />
            Gerar contrato
          </Button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-3 sm:gap-2">
        <div>
          <p className="text-xs text-muted">Hospedagem</p>
          <p className="font-medium text-ink">{formatBRL(proposal.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Taxa</p>
          <p className="font-medium text-ink">{formatBRL(proposal.commission)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Total</p>
          <p className="font-semibold text-accent">{formatBRL(proposal.totalAmount)}</p>
        </div>
      </div>
    </li>
  );
}

function AddPartnerModal({
  open,
  onClose,
  requestId,
  partners,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  requestId: string;
  partners: Partner[];
  onDone: () => void;
}) {
  const [partnerId, setPartnerId] = useState("");
  const [offeredDailyRate, setOfferedDailyRate] = useState("");
  const create = useMutation({
    mutationFn: () =>
      api.post(`/api/admin/requests/${requestId}/negotiations`, {
        partnerId,
        offeredDailyRate: offeredDailyRate ? Number(offeredDailyRate) : null,
      }),
    onSuccess: () => {
      onClose();
      onDone();
      setPartnerId("");
      setOfferedDailyRate("");
    },
  });

  const active = partners.filter((p) => p.status === "ACTIVE");

  return (
    <Modal open={open} onClose={onClose} title="Associar parceiro">
      <div className="space-y-4">
        <Field label="Parceiro" required>
          <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">Selecione um parceiro</option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tradeName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Diária oferecida (R$)" hint="Opcional">
          <Input
            type="number"
            step="0.01"
            value={offeredDailyRate}
            onChange={(e) => setOfferedDailyRate(e.target.value)}
          />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => create.mutate()} disabled={!partnerId || create.isPending}>
            {create.isPending ? <SpinnerGap size={14} className="animate-spin" /> : null}
            Associar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddProposalModal({
  open,
  onClose,
  requestId,
  partners,
  defaultGuests,
  defaultDays,
  commissionRate,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  requestId: string;
  partners: Partner[];
  defaultGuests: number;
  defaultDays: number;
  commissionRate: number;
  onDone: () => void;
}) {
  const [partnerId, setPartnerId] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(String(defaultGuests));
  const [dailyRate, setDailyRate] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(String(defaultDays));
  const [services, setServices] = useState("");

  const guests = Number(numberOfGuests) || 0;
  const days = Number(numberOfDays) || 0;
  const rate = Number(dailyRate) || 0;
  const amount = guests * days * rate;
  const commission = amount * (commissionRate / 100);
  const total = amount + commission;

  const create = useMutation({
    mutationFn: () =>
      api.post(`/api/admin/requests/${requestId}/proposals`, {
        partnerId,
        numberOfGuests: guests,
        dailyRate: rate,
        numberOfDays: days,
        servicesDescription: services,
      }),
    onSuccess: () => {
      onClose();
      onDone();
      setPartnerId("");
      setDailyRate("");
      setServices("");
    },
  });

  const active = partners.filter((p) => p.status === "ACTIVE");

  return (
    <Modal open={open} onClose={onClose} title="Nova proposta">
      <div className="space-y-4">
        <Field label="Parceiro" required>
          <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">Selecione um parceiro</option>
            {active.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tradeName}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Hóspedes">
            <Input type="number" min={1} value={numberOfGuests} onChange={(e) => setNumberOfGuests(e.target.value)} />
          </Field>
          <Field label="Diária (R$)">
            <Input type="number" min={0} step="0.01" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
          </Field>
          <Field label="Dias">
            <Input type="number" min={1} value={numberOfDays} onChange={(e) => setNumberOfDays(e.target.value)} />
          </Field>
        </div>
        <Field label="Serviços inclusos">
          <Input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Ex.: café da manhã, lavanderia" />
        </Field>

        <div className="rounded-xl bg-surface p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted">Hospedagem</span>
            <span className="font-medium text-ink">{formatBRL(amount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Taxa de captação ({commissionRate}%)</span>
            <span className="font-medium text-ink">{formatBRL(commission)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <span className="font-medium text-ink">Total negociado</span>
            <span className="font-semibold text-accent">{formatBRL(total)}</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!partnerId || !rate || create.isPending}
          >
            {create.isPending ? <SpinnerGap size={14} className="animate-spin" /> : null}
            Salvar proposta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
