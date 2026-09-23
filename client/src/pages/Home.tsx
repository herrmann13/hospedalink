import { Hero } from "@/components/landing/Hero";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { Beneficios } from "@/components/landing/Beneficios";
import { ParaEmpresas } from "@/components/landing/ParaEmpresas";
import { ParaParceiros } from "@/components/landing/ParaParceiros";
import { Diferenciacao } from "@/components/landing/Diferenciacao";
import { CtaFinal } from "@/components/landing/CtaFinal";

export function Home() {
  return (
    <>
      <Hero />
      <ComoFunciona />
      <Beneficios />
      <ParaEmpresas />
      <ParaParceiros />
      <Diferenciacao />
      <CtaFinal />
    </>
  );
}
