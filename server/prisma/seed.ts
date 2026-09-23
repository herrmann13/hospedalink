import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/600`;

async function main() {
  console.log("Limpando banco...");
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.accommodationRequirement.deleteMany();
  await prisma.accommodationRequest.deleteMany();
  await prisma.company.deleteMany();
  await prisma.partnerImage.deleteMany();
  await prisma.partnerService.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.setting.deleteMany();

  console.log("Criando usuário admin...");
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.create({
    data: { name: "Administrador", email: "admin@hospedalink.com.br", passwordHash },
  });

  console.log("Criando configuração...");
  await prisma.setting.create({ data: { key: "commissionRate", value: "10" } });

  console.log("Criando parceiros...");
  const hotelExecutivo = await prisma.partner.create({
    data: {
      legalName: "Executivo Hotelaria de Jataí Ltda.",
      tradeName: "Hotel Executivo Jataí",
      cnpj: "12345678000190",
      contactName: "Marina Duarte",
      phone: "6436321000",
      whatsapp: "64999990001",
      email: "contato@hotelexecutivojatai.com.br",
      address: "Rua Rio Claro, 120, Centro, Jataí - GO",
      latitude: -17.881,
      longitude: -51.714,
      availableCapacity: 15,
      status: "ACTIVE",
      notes: "Forte para grupos corporativos. Café da manhã incluso na diária.",
      roomTypes: {
        create: [
          { name: "Quarto individual", quantity: 8, bedsPerRoom: 1, priceType: "DIARIA", price: 120 },
          { name: "Quarto duplo", quantity: 12, bedsPerRoom: 2, priceType: "PESSOA", price: 80 },
        ],
      },
      services: {
        create: ["BREAKFAST", "PARKING", "LAUNDRY", "WIFI", "RECEPTION_24H", "AIR_CONDITIONING"].map(
          (serviceType) => ({ serviceType }),
        ),
      },
      images: {
        create: [
          { imageUrl: img("hotel-executivo-1"), sortOrder: 0 },
          { imageUrl: img("hotel-executivo-2"), sortOrder: 1 },
        ],
      },
    },
  });

  const alojamentoCentral = await prisma.partner.create({
    data: {
      legalName: "Alojamento Central Jataí Ltda.",
      tradeName: "Alojamento Central",
      cnpj: "23456789000123",
      contactName: "José Pereira",
      phone: "6436322000",
      whatsapp: "64999990002",
      email: "contato@alojamentocentral.com.br",
      address: "Avenida Goiás, 450, Setor Central, Jataí - GO",
      latitude: -17.879,
      longitude: -51.72,
      availableCapacity: 30,
      status: "ACTIVE",
      notes: "Estrutura de alojamento com cozinha compartilhada.",
      roomTypes: {
        create: [
          { name: "Quarto compartilhado", quantity: 10, bedsPerRoom: 4, priceType: "DIARIA", price: 45 },
        ],
      },
      services: {
        create: ["KITCHEN", "LAUNDRY", "PARKING", "WIFI"].map((serviceType) => ({ serviceType })),
      },
      images: {
        create: [{ imageUrl: img("alojamento-central-1"), sortOrder: 0 }],
      },
    },
  });

  await prisma.partner.create({
    data: {
      legalName: "Business Hotel Jataí Ltda.",
      tradeName: "Hotel Business",
      cnpj: "34567890000145",
      contactName: "Carla Menezes",
      phone: "6436323000",
      whatsapp: "64999990003",
      email: "contato@hotelbusinessjatai.com.br",
      address: "Rua 15 de Novembro, 88, Centro, Jataí - GO",
      latitude: -17.884,
      longitude: -51.716,
      availableCapacity: 10,
      status: "PENDING",
      notes: "Aguardando validação interna.",
      roomTypes: {
        create: [
          { name: "Quarto individual", quantity: 10, bedsPerRoom: 1, priceType: "DIARIA", price: 110 },
        ],
      },
      services: {
        create: ["BREAKFAST", "WIFI", "PARKING"].map((serviceType) => ({ serviceType })),
      },
      images: {
        create: [{ imageUrl: img("hotel-business-1"), sortOrder: 0 }],
      },
    },
  });

  console.log("Criando cenário principal (Construtora Horizonte)...");
  const horizonte = await prisma.company.create({
    data: {
      legalName: "Construtora Horizonte Ltda.",
      tradeName: "Construtora Horizonte Ltda.",
      cnpj: "45678900000167",
      contactName: "Rodrigo Almeida",
      contactRole: "Gerente de operações",
      contactEmail: "rodrigo@horizonte.eng.br",
      contactPhone: "6436324000",
    },
  });

  const request = await prisma.accommodationRequest.create({
    data: {
      protocol: "SOL-000001",
      companyId: horizonte.id,
      numberOfGuests: 12,
      checkIn: new Date("2026-10-01"),
      checkOut: new Date("2026-10-21"),
      workLocation: "Obra na BR-364, km 12",
      accommodationPreference: JSON.stringify(["Quarto duplo"]),
      budgetRange: "R$ 60 a R$ 80",
      notes:
        "Equipe de manutenção industrial. Precisa sair às 06:00, por isso café da manhã cedo é importante.",
      status: "CONTRATO_FECHADO",
      internalNotes: "Fechado com o Hotel Executivo. Cliente recorrente, boa relação.",
      requirements: {
        create: ["BREAKFAST", "LAUNDRY", "PARKING"].map((type) => ({ type })),
      },
    },
  });

  const negotiation = await prisma.negotiation.create({
    data: {
      requestId: request.id,
      partnerId: hotelExecutivo.id,
      status: "SELECIONADO",
      offeredDailyRate: 80,
      numberOfGuests: 12,
      numberOfDays: 20,
      accommodationValue: 19200,
      commissionPercentage: 10,
      commissionValue: 1920,
      notes: "Café da manhã incluso. Lavanderia e estacionamento sem custo adicional.",
    },
  });

  const proposal = await prisma.proposal.create({
    data: {
      negotiationId: negotiation.id,
      requestId: request.id,
      partnerId: hotelExecutivo.id,
      numberOfGuests: 12,
      numberOfDays: 20,
      dailyRate: 80,
      amount: 19200,
      commission: 1920,
      totalAmount: 21120,
      commissionPercentage: 10,
      servicesDescription: "Café da manhã, lavanderia e estacionamento inclusos.",
      status: "CONVERTIDA",
    },
  });

  await prisma.contract.create({
    data: {
      requestId: request.id,
      proposalId: proposal.id,
      companyId: horizonte.id,
      partnerId: hotelExecutivo.id,
      checkIn: new Date("2026-10-01"),
      checkOut: new Date("2026-10-21"),
      numberOfGuests: 12,
      accommodationAmount: 19200,
      commissionPercentage: 10,
      commissionAmount: 1920,
      totalAmount: 21120,
      status: "ATIVO",
    },
  });

  console.log("Criando solicitações adicionais...");

  const agro = await prisma.company.create({
    data: {
      legalName: "Agro Oeste Logística Ltda.",
      tradeName: "Agro Oeste Logística",
      cnpj: "56789000000189",
      contactName: "Paula Ribeiro",
      contactRole: "Analista de RH",
      contactEmail: "paula@agrooeste.com.br",
      contactPhone: "6436325000",
    },
  });
  await prisma.accommodationRequest.create({
    data: {
      protocol: "SOL-000002",
      companyId: agro.id,
      numberOfGuests: 8,
      checkIn: new Date("2026-10-05"),
      checkOut: new Date("2026-10-15"),
      workLocation: "Armazém no distrito industrial",
      accommodationPreference: JSON.stringify(["Quarto duplo"]),
      budgetRange: "R$ 80 a R$ 100",
      status: "EM_NEGOCIACAO",
      requirements: { create: ["PARKING", "WIFI"].map((type) => ({ type })) },
    },
  });

  const engetec = await prisma.company.create({
    data: {
      legalName: "Engetec Manutenção Industrial Ltda.",
      tradeName: "Engetec Manutenção",
      cnpj: "67890000000101",
      contactName: "Marcos Silva",
      contactRole: "Coordenador",
      contactEmail: "marcos@engetec.com.br",
      contactPhone: "6436326000",
    },
  });
  await prisma.accommodationRequest.create({
    data: {
      protocol: "SOL-000003",
      companyId: engetec.id,
      numberOfGuests: 15,
      checkIn: new Date("2026-10-20"),
      checkOut: new Date("2026-11-10"),
      workLocation: "Planta industrial Jataí II",
      accommodationPreference: JSON.stringify(["Alojamento"]),
      budgetRange: "Até R$ 60",
      status: "NOVA",
      requirements: { create: ["KITCHEN", "LAUNDRY"].map((type) => ({ type })) },
    },
  });

  const valeSol = await prisma.company.create({
    data: {
      legalName: "Transportadora Vale do Sol Ltda.",
      tradeName: "Transportadora Vale do Sol",
      cnpj: "78900000000123",
      contactName: "Fernanda Costa",
      contactRole: "Supervisora",
      contactEmail: "fernanda@valedosol.com.br",
      contactPhone: "6436327000",
    },
  });
  await prisma.accommodationRequest.create({
    data: {
      protocol: "SOL-000004",
      companyId: valeSol.id,
      numberOfGuests: 6,
      checkIn: new Date("2026-10-12"),
      checkOut: new Date("2026-10-18"),
      workLocation: "Terminal de cargas",
      accommodationPreference: JSON.stringify(["Quarto individual"]),
      status: "BUSCANDO_HOSPEDAGEM",
      requirements: { create: ["PARKING", "BREAKFAST"].map((type) => ({ type })) },
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
