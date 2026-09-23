import { SignJWT, jwtVerify } from "jose";

const configuredSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && !configuredSecret) {
  throw new Error("JWT_SECRET é obrigatório em produção.");
}

const secret = new TextEncoder().encode(
  configuredSecret ?? "hospeda-link-dev-secret-change-me",
);

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "hl_admin";
