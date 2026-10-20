export type RequestStatus =
  | "NOVA"
  | "EM_ANALISE"
  | "BUSCANDO_HOSPEDAGEM"
  | "PROPOSTA_ENVIADA"
  | "EM_NEGOCIACAO"
  | "APROVADA"
  | "CONTRATO_FECHADO"
  | "CANCELADA";

export type PartnerStatus = "PENDING" | "ACTIVE" | "INACTIVE";

export type PartnerCategory = "HOTEL" | "POUSADA" | "ALOJAMENTO" | "APART_HOTEL" | "HOSTEL" | "CASA";

export type NegotiationStatus =
  | "AGUARDANDO_RETORNO"
  | "DISPONIVEL"
  | "INDISPONIVEL"
  | "NEGOCIANDO"
  | "SELECIONADO"
  | "RECUSADO";

export type ProposalStatus = "ABERTA" | "ENVIADA" | "ACEITA" | "RECUSADA" | "CONVERTIDA";

export type ContractStatus = "AGUARDANDO_ASSINATURA" | "ATIVO" | "FINALIZADO" | "CANCELADO";

export type RequirementType =
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "LAUNDRY"
  | "PARKING"
  | "WIFI"
  | "AIR_CONDITIONING"
  | "KITCHEN"
  | "RECEPTION_24H"
  | "PRIVATE_BATHROOM"
  | "TV"
  | "MINIBAR"
  | "DAILY_CLEANING"
  | "BED_LINEN"
  | "EARLY_BREAKFAST"
  | "PACKED_MEAL"
  | "LARGE_VEHICLE_PARKING"
  | "MEETING_ROOM"
  | "ACCESSIBILITY"
  | "INVOICE"
  | "OTHER";

export interface Company {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  contactName: string;
  contactRole?: string | null;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
}

export interface CompanySummary {
  id: string;
  tradeName: string;
}

export interface AccommodationRequest {
  id: string;
  protocol: string;
  companyId: string;
  company?: Company;
  numberOfGuests: number;
  checkIn: string;
  checkOut: string;
  workLocation?: string | null;
  accommodationPreference: string[];
  budgetRange?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  status: RequestStatus;
  createdAt: string;
  requirements?: RequirementType[];
  negotiations?: Negotiation[];
  proposals?: Proposal[];
  contracts?: Contract[];
}

export interface Partner {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  contactName: string;
  phone: string;
  whatsapp?: string | null;
  email: string;
  address: string;
  category: PartnerCategory;
  latitude?: number | null;
  longitude?: number | null;
  availableCapacity: number;
  status: PartnerStatus;
  notes?: string | null;
  createdAt: string;
  roomTypes?: RoomType[];
  services?: RequirementType[];
  images?: PartnerImage[];
}

export interface PartnerSummary {
  id: string;
  legalName: string;
  tradeName: string;
  availableCapacity: number;
  status: PartnerStatus;
}

export interface RoomType {
  id: string;
  partnerId: string;
  name: string;
  quantity: number;
  bedsPerRoom: number;
  priceType: "PESSOA" | "QUARTO" | "DIARIA" | "SEMANAL" | "MENSAL";
  price: number;
}

export interface PartnerImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

export interface Negotiation {
  id: string;
  requestId: string;
  partnerId: string;
  partner?: PartnerSummary;
  status: NegotiationStatus;
  offeredDailyRate?: number | null;
  numberOfGuests?: number | null;
  numberOfDays?: number | null;
  accommodationValue?: number | null;
  commissionPercentage?: number | null;
  commissionValue?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface Proposal {
  id: string;
  negotiationId?: string | null;
  requestId: string;
  partnerId: string;
  partner?: PartnerSummary;
  amount: number;
  commission: number;
  totalAmount: number;
  commissionPercentage?: number | null;
  numberOfGuests?: number | null;
  numberOfDays?: number | null;
  dailyRate?: number | null;
  servicesDescription?: string | null;
  notes?: string | null;
  status: ProposalStatus;
  createdAt: string;
}

export interface Contract {
  id: string;
  requestId: string;
  proposalId: string;
  companyId: string;
  partnerId: string;
  partner?: PartnerSummary;
  company?: CompanySummary;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  accommodationAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  totalAmount: number;
  status: ContractStatus;
  createdAt: string;
  updatedAt?: string;
  request?: {
    protocol: string;
  };
}

export interface DashboardStats {
  openRequests: number;
  negotiatingRequests: number;
  activeContracts: number;
  partners: number;
  activeGuests: number;
  totalNegotiated: number;
  estimatedRevenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}
