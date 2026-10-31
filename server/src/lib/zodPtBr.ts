import { z } from "zod";

/**
 * Mapa global de mensagens de validação em pt-BR.
 *
 * Os schemas continuam podendo definir mensagens específicas (ex.: "CNPJ inválido");
 * este mapa cobre apenas os códigos padrão do Zod, que de outra forma apareceriam
 * em inglês na resposta da API ("Required", "Invalid email"...).
 */
export const ptBrErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") {
        return { message: "Campo obrigatório." };
      }
      return { message: "Valor inválido." };

    case z.ZodIssueCode.invalid_literal:
      return { message: "Valor inválido." };

    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campo não reconhecido: ${issue.keys.join(", ")}.` };

    case z.ZodIssueCode.invalid_union:
    case z.ZodIssueCode.invalid_union_discriminator:
      return { message: "Valor inválido." };

    case z.ZodIssueCode.invalid_enum_value:
      return { message: "Valor inválido." };

    case z.ZodIssueCode.invalid_arguments:
    case z.ZodIssueCode.invalid_return_type:
      return { message: "Valor inválido." };

    case z.ZodIssueCode.invalid_date:
      return { message: "Data inválida." };

    case z.ZodIssueCode.invalid_string:
      switch (issue.validation) {
        case "email":
          return { message: "E-mail inválido." };
        case "url":
          return { message: "Endereço (URL) inválido." };
        case "uuid":
          return { message: "Identificador inválido." };
        case "regex":
          return { message: "Formato inválido." };
        case "datetime":
        case "date":
        case "time":
          return { message: "Data inválida." };
        default:
          return { message: "Texto inválido." };
      }

    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        return {
          message:
            issue.minimum <= 1
              ? "Campo obrigatório."
              : `Informe pelo menos ${issue.minimum} caracteres.`,
        };
      }
      if (issue.type === "array" || issue.type === "set") {
        return { message: `Selecione pelo menos ${issue.minimum} item(ns).` };
      }
      return { message: `O valor mínimo é ${issue.minimum}.` };

    case z.ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: `Informe no máximo ${issue.maximum} caracteres.` };
      }
      if (issue.type === "array" || issue.type === "set") {
        return { message: `Selecione no máximo ${issue.maximum} item(ns).` };
      }
      return { message: `O valor máximo é ${issue.maximum}.` };

    case z.ZodIssueCode.not_multiple_of:
      return { message: `O valor deve ser múltiplo de ${issue.multipleOf}.` };

    case z.ZodIssueCode.not_finite:
      return { message: "Valor inválido." };

    case z.ZodIssueCode.invalid_intersection_types:
      return { message: "Valor inválido." };

    case z.ZodIssueCode.custom:
      return { message: ctx.defaultError };

    default:
      return { message: ctx.defaultError };
  }
};

/** Aplica o mapa global. Importar uma vez, antes de qualquer validação de entrada. */
export function applyPtBrErrorMap() {
  z.setErrorMap(ptBrErrorMap);
}
