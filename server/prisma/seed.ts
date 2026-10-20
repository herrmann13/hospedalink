import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@hospedalink.com.br";
  const password = process.env.ADMIN_PASSWORD;

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  if (existingAdmin) {
    console.log("Seed já aplicado. Mantendo os dados existentes.");
    return;
  }

  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD é obrigatório (mínimo de 12 caracteres) para criar o admin inicial.");
  }

  console.log("Criando usuário admin...");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.create({
    data: { name: "Administrador", email, passwordHash },
  });

  console.log("Criando configuração...");
  await prisma.setting.upsert({
    where: { key: "commissionRate" },
    update: {},
    create: { key: "commissionRate", value: "10" },
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
