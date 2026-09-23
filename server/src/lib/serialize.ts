import type { AccommodationRequest, Partner, Negotiation, Proposal, Contract } from "@prisma/client";

type RequestWithRelations = AccommodationRequest & {
  company?: { id: string; legalName: string; tradeName: string; cnpj: string; contactName: string; contactRole: string | null; contactEmail: string; contactPhone: string };
  requirements?: { type: string }[];
  negotiations?: any[];
};

export function serializeRequest(r: RequestWithRelations) {
  return {
    ...r,
    accommodationPreference: parseArray(r.accommodationPreference),
    requirements: r.requirements?.map((req) => req.type) ?? [],
  };
}

export function serializePartner(p: Partner & { roomTypes?: any[]; services?: { serviceType: string }[]; images?: any[] }) {
  return {
    ...p,
    services: p.services?.map((s) => s.serviceType) ?? [],
  };
}

export function parseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
