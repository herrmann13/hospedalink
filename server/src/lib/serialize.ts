import type { Prisma } from "@prisma/client";
import { isExternalUrl } from "./storage";

type CompanyRecord = Prisma.CompanyGetPayload<{}>;
type PartnerFull = Prisma.PartnerGetPayload<{
  include: { roomTypes: true; services: true; images: true };
}>;
type RequestListRecord = Prisma.AccommodationRequestGetPayload<{
  include: { company: true };
}>;
type RequestDetailRecord = Prisma.AccommodationRequestGetPayload<{
  include: {
    company: true;
    requirements: true;
    negotiations: { include: { partner: true } };
    proposals: { include: { partner: true } };
    contracts: { include: { partner: true } };
  };
}>;
type NegotiationRecord = Prisma.NegotiationGetPayload<{
  include: { partner: true; request: { include: { company: true } } };
}>;
type ContractRecord = Prisma.ContractGetPayload<{
  include: { partner: true; company: true; request: true };
}>;

function serializeCompany(company: CompanyRecord) {
  return {
    id: company.id,
    legalName: company.legalName,
    tradeName: company.tradeName,
    cnpj: company.cnpj,
    contactName: company.contactName,
    contactRole: company.contactRole,
    contactEmail: company.contactEmail,
    contactPhone: company.contactPhone,
    createdAt: company.createdAt.toISOString(),
  };
}

function serializeRequestBase(request: Prisma.AccommodationRequestGetPayload<{}>) {
  return {
    id: request.id,
    protocol: request.protocol,
    companyId: request.companyId,
    numberOfGuests: request.numberOfGuests,
    checkIn: request.checkIn.toISOString(),
    checkOut: request.checkOut.toISOString(),
    workLocation: request.workLocation,
    accommodationPreference: request.accommodationPreference,
    budgetRange: request.budgetRange,
    notes: request.notes,
    internalNotes: request.internalNotes,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}

export function serializeRequestList(request: RequestListRecord) {
  return {
    ...serializeRequestBase(request),
    company: serializeCompany(request.company),
  };
}

export function serializeRequestDetail(request: RequestDetailRecord) {
  return {
    ...serializeRequestBase(request),
    company: serializeCompany(request.company),
    requirements: request.requirements.map((requirement) => requirement.type),
    negotiations: request.negotiations.map((negotiation) => ({
      id: negotiation.id,
      requestId: negotiation.requestId,
      partnerId: negotiation.partnerId,
      status: negotiation.status,
      offeredDailyRate: negotiation.offeredDailyRate,
      numberOfGuests: negotiation.numberOfGuests,
      numberOfDays: negotiation.numberOfDays,
      accommodationValue: negotiation.accommodationValue,
      commissionPercentage: negotiation.commissionPercentage,
      commissionValue: negotiation.commissionValue,
      notes: negotiation.notes,
      createdAt: negotiation.createdAt.toISOString(),
      updatedAt: negotiation.updatedAt.toISOString(),
      partner: serializePartnerSummary(negotiation.partner),
    })),
    proposals: request.proposals.map((proposal) => ({
      id: proposal.id,
      negotiationId: proposal.negotiationId,
      requestId: proposal.requestId,
      partnerId: proposal.partnerId,
      amount: proposal.amount,
      commission: proposal.commission,
      totalAmount: proposal.totalAmount,
      commissionPercentage: proposal.commissionPercentage,
      numberOfGuests: proposal.numberOfGuests,
      numberOfDays: proposal.numberOfDays,
      dailyRate: proposal.dailyRate,
      servicesDescription: proposal.servicesDescription,
      notes: proposal.notes,
      status: proposal.status,
      createdAt: proposal.createdAt.toISOString(),
      partner: serializePartnerSummary(proposal.partner),
    })),
    contracts: request.contracts.map((contract) => serializeContractSummary(contract)),
  };
}

function serializePartnerSummary(partner: PartnerFull | Prisma.PartnerGetPayload<{}>) {
  return {
    id: partner.id,
    tradeName: partner.tradeName,
    legalName: partner.legalName,
    availableCapacity: partner.availableCapacity,
    status: partner.status,
  };
}

function serializeContractSummary(
  contract: Prisma.ContractGetPayload<{ include: { partner: true } }>,
) {
  return {
    id: contract.id,
    requestId: contract.requestId,
    proposalId: contract.proposalId,
    companyId: contract.companyId,
    partnerId: contract.partnerId,
    checkIn: contract.checkIn.toISOString(),
    checkOut: contract.checkOut.toISOString(),
    numberOfGuests: contract.numberOfGuests,
    accommodationAmount: contract.accommodationAmount,
    commissionPercentage: contract.commissionPercentage,
    commissionAmount: contract.commissionAmount,
    totalAmount: contract.totalAmount,
    status: contract.status,
    createdAt: contract.createdAt.toISOString(),
    partner: serializePartnerSummary(contract.partner),
  };
}

export function serializePartner(partner: PartnerFull) {
  return {
    id: partner.id,
    legalName: partner.legalName,
    tradeName: partner.tradeName,
    cnpj: partner.cnpj,
    contactName: partner.contactName,
    phone: partner.phone,
    whatsapp: partner.whatsapp,
    email: partner.email,
    address: partner.address,
    category: partner.category,
    latitude: partner.latitude,
    longitude: partner.longitude,
    availableCapacity: partner.availableCapacity,
    status: partner.status,
    notes: partner.notes,
    createdAt: partner.createdAt.toISOString(),
    updatedAt: partner.updatedAt.toISOString(),
    roomTypes: partner.roomTypes.map((room) => ({
      id: room.id,
      partnerId: room.partnerId,
      name: room.name,
      quantity: room.quantity,
      bedsPerRoom: room.bedsPerRoom,
      priceType: room.priceType,
      price: room.price,
      notes: room.notes,
    })),
    services: partner.services.map((service) => service.serviceType),
    images: serializeImages(partner.images),
  };
}

/** Versão pública (catálogo): sem CNPJ, contatos, observações internas ou status. */
export function serializePublicPartner(partner: PartnerFull) {
  return {
    id: partner.id,
    tradeName: partner.tradeName,
    category: partner.category,
    address: partner.address,
    availableCapacity: partner.availableCapacity,
    roomTypes: partner.roomTypes.map((room) => ({
      id: room.id,
      name: room.name,
      quantity: room.quantity,
      bedsPerRoom: room.bedsPerRoom,
      priceType: room.priceType,
      price: room.price,
    })),
    services: partner.services.map((service) => service.serviceType),
    images: serializeImages(partner.images),
  };
}

function serializeImages(images: PartnerFull["images"]) {
  return [...images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => ({
      id: image.id,
      // Imagens do bucket são servidas por /api/partner-images/:id (redireciona para URL assinada).
      imageUrl: isExternalUrl(image.imageUrl) ? image.imageUrl : `/api/partner-images/${image.id}`,
      sortOrder: image.sortOrder,
    }));
}

export function serializeNegotiation(negotiation: NegotiationRecord) {
  return {
    id: negotiation.id,
    requestId: negotiation.requestId,
    partnerId: negotiation.partnerId,
    status: negotiation.status,
    offeredDailyRate: negotiation.offeredDailyRate,
    numberOfGuests: negotiation.numberOfGuests,
    numberOfDays: negotiation.numberOfDays,
    accommodationValue: negotiation.accommodationValue,
    commissionPercentage: negotiation.commissionPercentage,
    commissionValue: negotiation.commissionValue,
    notes: negotiation.notes,
    createdAt: negotiation.createdAt.toISOString(),
    updatedAt: negotiation.updatedAt.toISOString(),
    partner: serializePartnerSummary(negotiation.partner),
    request: {
      protocol: negotiation.request.protocol,
      company: {
        id: negotiation.request.company.id,
        tradeName: negotiation.request.company.tradeName,
      },
    },
  };
}

export function serializeContract(contract: ContractRecord) {
  return {
    id: contract.id,
    requestId: contract.requestId,
    proposalId: contract.proposalId,
    companyId: contract.companyId,
    partnerId: contract.partnerId,
    checkIn: contract.checkIn.toISOString(),
    checkOut: contract.checkOut.toISOString(),
    numberOfGuests: contract.numberOfGuests,
    accommodationAmount: contract.accommodationAmount,
    commissionPercentage: contract.commissionPercentage,
    commissionAmount: contract.commissionAmount,
    totalAmount: contract.totalAmount,
    status: contract.status,
    createdAt: contract.createdAt.toISOString(),
    updatedAt: contract.updatedAt.toISOString(),
    partner: serializePartnerSummary(contract.partner),
    company: {
      id: contract.company.id,
      tradeName: contract.company.tradeName,
    },
    request: {
      protocol: contract.request.protocol,
    },
  };
}
