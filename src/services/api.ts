import { appConfig } from "../lib/config";
import { supabase } from "../lib/supabase";

interface ApiErrorShape { error?: { code?: string; message?: string; details?: unknown }; request_id?: string; }
export class ApiError extends Error {
  constructor(message:string, public readonly status:number, public readonly code:string, public readonly requestId?:string, public readonly details?:unknown) { super(message); this.name = "ApiError"; }
}
function mergeSignals(signal?:AbortSignal) { const timeout=AbortSignal.timeout(20_000); return signal?AbortSignal.any([signal,timeout]):timeout; }
async function authenticatedFetch(path:string,init:RequestInit={}) {
  const{data,error}=await supabase.auth.getSession();
  if(error||!data.session?.access_token)throw new ApiError("Sua sessão expirou. Entre novamente.",401,"UNAUTHORIZED");
  const headers=new Headers(init.headers);headers.set("Authorization",`Bearer ${data.session.access_token}`);if(!headers.has("Accept"))headers.set("Accept","application/json");if(init.body&&!headers.has("Content-Type"))headers.set("Content-Type","application/json");
  try{return await fetch(`${appConfig.apiUrl}${path}`,{...init,headers,signal:mergeSignals(init.signal??undefined)})}catch(caught){if(caught instanceof DOMException&&["TimeoutError","AbortError"].includes(caught.name))throw new ApiError("A API demorou demais para responder.",408,"TIMEOUT");throw new ApiError("Não foi possível conectar à API do Nummi.",503,"NETWORK_ERROR")}
}
async function parseApiFailure(response:Response):Promise<never>{const contentType=response.headers.get("content-type")??"";const payload=contentType.includes("application/json")?await response.json() as ApiErrorShape:null;throw new ApiError(payload?.error?.message||"A API rejeitou a operação.",response.status,payload?.error?.code||"API_ERROR",payload?.request_id,payload?.error?.details)}
export async function apiRequest<T>(path:string,init:RequestInit={}):Promise<T>{const response=await authenticatedFetch(path,init);if(response.status===204)return undefined as T;if(!response.ok)return parseApiFailure(response);const contentType=response.headers.get("content-type")??"";const payload=contentType.includes("application/json")?await response.json() as ApiErrorShape&{data?:T}:null;return(payload?.data??payload)as T}
export async function apiDownload(path:string,filename:string){const response=await authenticatedFetch(path,{headers:{Accept:"text/csv"}});if(!response.ok)return parseApiFailure(response);const blob=await response.blob(),url=URL.createObjectURL(blob);try{const link=document.createElement("a");link.href=url;link.download=filename;link.rel="noopener";document.body.appendChild(link);link.click();link.remove()}finally{URL.revokeObjectURL(url)}}
