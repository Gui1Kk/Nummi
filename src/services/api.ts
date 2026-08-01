import { appConfig } from "../lib/config";
import { supabase } from "../lib/supabase";

interface ApiErrorShape { error?: { code?: string; message?: string; details?: unknown }; request_id?: string; }
export class ApiError extends Error { constructor(message: string, public readonly status: number, public readonly code: string, public readonly requestId?: string, public readonly details?: unknown) { super(message); this.name = "ApiError"; } }
function mergeSignals(signal?: AbortSignal) { const timeout = AbortSignal.timeout(20_000); return signal ? AbortSignal.any([signal, timeout]) : timeout; }

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new ApiError("Sua sessão expirou. Entre novamente.", 401, "UNAUTHORIZED");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try { response = await fetch(`${appConfig.apiUrl}${path}`, { ...init, headers, signal: mergeSignals(init.signal ?? undefined) }); }
  catch (caught) { if (caught instanceof DOMException && caught.name === "TimeoutError") throw new ApiError("A API demorou demais para responder.", 408, "TIMEOUT"); throw new ApiError("Não foi possível conectar à API do Nummi.", 503, "NETWORK_ERROR"); }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() as ApiErrorShape & { data?: T } : null;
  if (!response.ok) throw new ApiError(payload?.error?.message || "A API rejeitou a operação.", response.status, payload?.error?.code || "API_ERROR", payload?.request_id, payload?.error?.details);
  return (payload?.data ?? payload) as T;
}
