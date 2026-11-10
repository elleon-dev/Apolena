import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "apolena_session";

export const SUPER_ADMIN_EMAIL = "nmoriano26@gmail.com";

export type UserRole = "user" | "admin" | "super_admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
}

interface TokenPayload extends SessionUser {
  exp: number;
}

/**
 * Regla de Negocio Inalterable:
 * El correo nmoriano26@gmail.com SIEMPRE tiene el rol "super_admin".
 */
export function resolveUserRole(
  email?: string | null,
  role?: string | null,
): UserRole {
  if (email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
    return "super_admin";
  }
  if (role === "super_admin") return "super_admin";
  if (role === "admin") return "admin";
  return "user";
}

export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "super_admin";
}

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "apolena-super-secret-studio-key-2026-scalable"
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Hashes a password deterministically using SHA-256 + salt via Web Crypto API
 */
export async function hashPassword(
  password: string,
  salt?: string,
): Promise<string> {
  const activeSalt =
    salt || toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const encoder = new TextEncoder();
  const data = encoder.encode(`${activeSalt}:${password}:${getAuthSecret()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashB64 = toBase64Url(new Uint8Array(digest));
  return `${activeSalt}.${hashB64}`;
}

export async function verifyPassword(
  password: string,
  storedHash?: string | null,
): Promise<boolean> {
  if (!storedHash || !storedHash.includes(".")) return false;
  const [salt] = storedHash.split(".");
  const computed = await hashPassword(password, salt);
  return computed === storedHash;
}

/**
 * Signs a session token compatible with both Node Route Handlers and Edge Middleware
 */
export async function signSessionToken(
  user: SessionUser,
  ttlSeconds = 60 * 60 * 24 * 7, // 7 days
): Promise<string> {
  const payload: TokenPayload = {
    ...user,
    role: resolveUserRole(user.email, user.role),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoder = new TextEncoder();
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getHmacKey(getAuthSecret());
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64),
  );
  const signatureB64 = toBase64Url(new Uint8Array(signatureBuffer));
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies a session token and returns the authenticated SessionUser or null
 */
export async function verifySessionToken(
  token?: string | null,
): Promise<SessionUser | null> {
  if (!token || !token.includes(".")) return null;
  try {
    const [payloadB64, signatureB64] = token.split(".");
    if (!payloadB64 || !signatureB64) return null;

    const encoder = new TextEncoder();
    const key = await getHmacKey(getAuthSecret());
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signatureB64) as unknown as BufferSource,
      encoder.encode(payloadB64),
    );
    if (!isValid) return null;

    const jsonStr = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(jsonStr) as TokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      avatar_url: payload.avatar_url || null,
      role: resolveUserRole(payload.email, payload.role),
    };
  } catch {
    return null;
  }
}

/**
 * Server helper to retrieve current authenticated user from cookies
 */
export async function getSessionUser(
  request?: Request,
): Promise<SessionUser | null> {
  try {
    let token: string | undefined;

    if (request) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(
          new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`),
        );
        if (match) token = match[1];
      }
    }

    if (!token) {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
