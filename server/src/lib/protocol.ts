import { prisma } from "./prisma";

export async function generateProtocol(): Promise<string> {
  const count = await prisma.accommodationRequest.count();
  const next = count + 1;
  return `SOL-${String(next).padStart(6, "0")}`;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function getCommissionRate(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: "commissionRate" },
  });
  const value = Number(setting?.value ?? "10");
  return Number.isFinite(value) && value > 0 ? value : 10;
}
