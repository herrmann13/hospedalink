import type { PublicPartner } from "@/lib/types";
import { PRICE_TYPES } from "@/lib/constants";
import { formatBRL } from "@/lib/masks";

/** Menor preço entre os tipos de quarto, para o "a partir de" do catálogo. */
export function startingPrice(partner: Pick<PublicPartner, "roomTypes">) {
  const cheapest = [...partner.roomTypes].filter((r) => r.price > 0).sort((a, b) => a.price - b.price)[0];
  if (!cheapest) return null;
  const label = PRICE_TYPES.find((p) => p.value === cheapest.priceType)?.label ?? "";
  return { value: formatBRL(cheapest.price), label: label.toLowerCase() };
}
