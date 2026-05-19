import * as SecureStore from "expo-secure-store";
import { getApiBaseUrl } from "./config";

const TOKEN_KEY = "saffron_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(message: string, status: number, body: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get entryId(): string | undefined {
    const id = this.body.id;
    return typeof id === "string" ? id : undefined;
  }
}

function parseError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && !Array.isArray(err)) {
    const o = err as Record<string, unknown>;
    if (typeof o.error === "string" && o.error) return o.error;
    if (typeof o.message === "string" && o.message) return o.message;
  }
  return fallback;
}

async function readBody(res: Response): Promise<{ text: string; json: unknown | null }> {
  const text = await res.text();
  if (!text.trim()) return { text: "", json: null };
  try {
    return { text, json: JSON.parse(text) as unknown };
  } catch {
    return { text, json: null };
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach server. Check EXPO_PUBLIC_API_URL and that the backend is running.");
  }

  const { text, json } = await readBody(res);

  if (!res.ok) {
    const errBody =
      json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};
    throw new ApiError(
      parseError(json, res.statusText || "Request failed"),
      res.status,
      errBody
    );
  }

  if (res.status === 204 || !text.trim()) {
    return null as T;
  }

  if (json !== null && json !== undefined) {
    return json as T;
  }

  throw new Error("Invalid response from server");
}
