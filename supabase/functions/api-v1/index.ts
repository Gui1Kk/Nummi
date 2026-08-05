import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.110.8";
import { z } from "npm:zod@4.4.3";
import {
  ApiError, assertQueryKeys, baseHeaders, corsHeaders, csvCell, fail,
  isAllowedOrigin, json, noContent, pagination, pathSegments, readJson
} from "./http.ts";
import {
  automationInput, budgetInput, categoryInput, importInput, isoDate, notificationPatch,
  profilePatch, recurringInput, settingsPatch, subscriptionInput, transactionInput,
  transactionPatch, uuid
} from "./schemas.ts";

const API_VERSION = "1.3.0";
const URL = Deno.env.get("SUPABASE_URL") ?? "";
const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_ANON_KEY")
  ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
type Resource = "categories" | "recurrences" | "subscriptions" | "budgets";

const resources = {
  categories: { table: "categories", create: categoryInput, patch: categoryInput.partial().strict(), order: "name" },
  recurrences: { table: "recurring_rules", create: recurringInput, patch: recurringInput.partial().strict(), order: "next_date" },
  subscriptions: { table: "subscriptions", create: subscriptionInput, patch: subscriptionInput.partial().strict(), order: "next_charge" },
  budgets: { table: "budgets", create: budgetInput, patch: budgetInput.partial().strict(), order: "month" }
} as const;

async function authenticate(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new ApiError(401, "UNAUTHORIZED", "Bearer token is required");
  const client = createClient(URL, PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "UNAUTHORIZED", "Token is invalid or expired");
  return { userId: data.user.id, client };
}

async function enforceRateLimit(admin: SupabaseClient, userId: string, route: string, limit = 120) {
  const { data, error } = await admin.rpc("consume_api_rate_limit_admin", {
    p_user_id: userId, p_route: route, p_limit: limit, p_window_seconds: 60
  });
  if (error) throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "Rate limiter is unavailable");
  if (!data) throw new ApiError(429, "RATE_LIMITED", "Too many requests");
}

function databaseError(error: { code?: string } | null, fallback: string): never {
  if (error?.code === "23505") throw new ApiError(409, "CONFLICT", "A record with the same unique fields already exists");
  if (error?.code === "23503") throw new ApiError(409, "INVALID_REFERENCE", "A referenced resource does not exist, is in use, or is not owned by this user");
  if (error?.code === "23514" || error?.code === "22023") throw new ApiError(400, "CONSTRAINT_VIOLATION", "The data violates a business rule");
  throw new ApiError(400, "DATABASE_OPERATION_FAILED", fallback);
}

function dateRange(url: URL) {
  const today = new Date().toISOString().slice(0, 10);
  const from = isoDate.parse(url.searchParams.get("from") ?? `${today.slice(0, 7)}-01`);
  const to = isoDate.parse(url.searchParams.get("to") ?? today);
  if (from > to) throw new ApiError(400, "INVALID_RANGE", "from must not be after to");
  return { from, to };
}

async function loadSnapshot(req: Request, client: SupabaseClient, userId: string, url: URL, requestId: string) {
  assertQueryKeys(url, ["from", "to"]);
  const { from, to } = dateRange(url);
  const results = await Promise.all([
    client.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    client.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    client.from("categories").select("*").eq("user_id", userId).order("archived").order("name").limit(1001),
    client.from("transactions").select("*").eq("user_id", userId).gte("transaction_date", from).lte("transaction_date", to)
      .order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(5001),
    client.from("recurring_rules").select("*").eq("user_id", userId).order("next_date").limit(1001),
    client.from("subscriptions").select("*").eq("user_id", userId).order("next_charge").limit(1001),
    client.from("budgets").select("*").eq("user_id", userId).lte("month", `${to.slice(0, 7)}-01`).order("month", { ascending: false }).limit(2401),
    client.from("notifications").select("*").eq("user_id", userId).is("read_at", null).order("created_at", { ascending: false }).limit(101)
  ]);
  const error = results.find((result) => result.error)?.error;
  if (error) databaseError(error, "Could not load finance snapshot");
  const [profile, settings, categories, transactions, recurrences, subscriptions, budgets, notifications] = results;
  const truncated = (categories.data?.length ?? 0) > 1000 || (transactions.data?.length ?? 0) > 5000
    || (recurrences.data?.length ?? 0) > 1000 || (subscriptions.data?.length ?? 0) > 1000
    || (budgets.data?.length ?? 0) > 2400 || (notifications.data?.length ?? 0) > 100;
  return json(req, 200, { data: {
    profile: profile.data, settings: settings.data,
    categories: (categories.data ?? []).slice(0, 1000),
    transactions: (transactions.data ?? []).slice(0, 5000),
    recurringRules: (recurrences.data ?? []).slice(0, 1000),
    subscriptions: (subscriptions.data ?? []).slice(0, 1000),
    budgets: (budgets.data ?? []).slice(0, 2400),
    notifications: (notifications.data ?? []).slice(0, 100), from, to, truncated
  } }, requestId);
}

async function singleton(req: Request, client: SupabaseClient, userId: string, resource: "profile" | "settings", requestId: string) {
  const table = resource === "profile" ? "profiles" : "user_settings";
  const schema = resource === "profile" ? profilePatch : settingsPatch;
  if (req.method === "GET") {
    const { data, error } = await client.from(table).select("*").eq("user_id", userId).maybeSingle();
    if (error) databaseError(error, `Could not read ${resource}`);
    if (!data) throw new ApiError(404, "NOT_FOUND", "Resource not found");
    return json(req, 200, { data }, requestId);
  }
  if (req.method === "PATCH") {
    const patch = schema.parse(await readJson(req));
    if (!Object.keys(patch).length) throw new ApiError(400, "EMPTY_PATCH", "At least one field is required");
    const { data, error } = await client.from(table).update(patch).eq("user_id", userId).select().maybeSingle();
    if (error) databaseError(error, `Could not update ${resource}`);
    if (!data) throw new ApiError(404, "NOT_FOUND", "Resource not found");
    return json(req, 200, { data }, requestId);
  }
  throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
}

async function transactionCollection(req: Request, client: SupabaseClient, userId: string, url: URL, requestId: string) {
  if (req.method === "GET") {
    assertQueryKeys(url, ["limit", "offset", "kind", "status", "category_id", "from", "to"]);
    const page = pagination(url);
    let query = client.from("transactions").select("*", { count: "exact" }).eq("user_id", userId)
      .order("transaction_date", { ascending: false }).order("created_at", { ascending: false })
      .range(page.offset, page.offset + page.limit - 1);
    const kind = url.searchParams.get("kind"); const status = url.searchParams.get("status");
    const category = url.searchParams.get("category_id"); const from = url.searchParams.get("from"); const to = url.searchParams.get("to");
    if (kind) query = query.eq("kind", z.enum(["income", "expense"]).parse(kind));
    if (status) query = query.eq("status", z.enum(["planned", "posted"]).parse(status));
    if (category) query = query.eq("category_id", uuid.parse(category));
    if (from) query = query.gte("transaction_date", isoDate.parse(from));
    if (to) query = query.lte("transaction_date", isoDate.parse(to));
    if (from && to && from > to) throw new ApiError(400, "INVALID_RANGE", "from must not be after to");
    const { data, error, count } = await query;
    if (error) databaseError(error, "Could not list transactions");
    return json(req, 200, { data, pagination: { ...page, total: count ?? 0 } }, requestId);
  }
  if (req.method === "POST") {
    const parsed = transactionInput.parse(await readJson(req));
    const headerKey = req.headers.get("idempotency-key")?.trim();
    if (headerKey && !z.string().min(8).max(128).safeParse(headerKey).success) throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must contain 8 to 128 characters");
    const key = headerKey || parsed.idempotency_key || null;
    const { data, error } = await client.from("transactions").insert({ ...parsed, idempotency_key: key, user_id: userId, source: "api" }).select().single();
    if (error?.code === "23505" && key) {
      const replay = await client.from("transactions").select("*").eq("user_id", userId).eq("idempotency_key", key).maybeSingle();
      if (replay.data) return json(req, 200, { data: replay.data, idempotent_replay: true }, requestId);
    }
    if (error) databaseError(error, "Could not create transaction");
    return json(req, 201, { data }, requestId);
  }
  throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
}

async function transactionItem(req: Request, client: SupabaseClient, userId: string, rawId: string, requestId: string) {
  const id = uuid.parse(rawId);
  if (req.method === "GET") {
    const { data, error } = await client.from("transactions").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) databaseError(error, "Could not read transaction"); if (!data) throw new ApiError(404, "NOT_FOUND", "Transaction not found");
    return json(req, 200, { data }, requestId);
  }
  if (req.method === "PATCH") {
    const patch = transactionPatch.parse(await readJson(req));
    if (!Object.keys(patch).length) throw new ApiError(400, "EMPTY_PATCH", "At least one field is required");
    const { data, error } = await client.from("transactions").update(patch).eq("id", id).eq("user_id", userId).select().maybeSingle();
    if (error) databaseError(error, "Could not update transaction"); if (!data) throw new ApiError(404, "NOT_FOUND", "Transaction not found");
    return json(req, 200, { data }, requestId);
  }
  if (req.method === "DELETE") {
    const { data, error } = await client.from("transactions").delete().eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (error) databaseError(error, "Could not delete transaction"); if (!data) throw new ApiError(404, "NOT_FOUND", "Transaction not found");
    return noContent(req, requestId);
  }
  throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
}

async function genericResource(req: Request, client: SupabaseClient, userId: string, resource: Resource, rawId: string | undefined, url: URL, requestId: string) {
  const config = resources[resource];
  if (!rawId && req.method === "GET") {
    assertQueryKeys(url, ["limit", "offset"]); const page = pagination(url);
    const { data, error, count } = await client.from(config.table).select("*", { count: "exact" }).eq("user_id", userId)
      .order(config.order, { ascending: true }).range(page.offset, page.offset + page.limit - 1);
    if (error) databaseError(error, `Could not list ${resource}`);
    return json(req, 200, { data, pagination: { ...page, total: count ?? 0 } }, requestId);
  }
  if (!rawId && req.method === "POST") {
    const payload = config.create.parse(await readJson(req));
    const query = resource === "budgets"
      ? client.from(config.table).upsert({ ...payload, user_id: userId }, { onConflict: "user_id,category_id,month" })
      : client.from(config.table).insert({ ...payload, user_id: userId });
    const { data, error } = await query.select().single(); if (error) databaseError(error, `Could not create ${resource}`);
    return json(req, 201, { data }, requestId);
  }
  if (!rawId) throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
  const id = uuid.parse(rawId);
  if (req.method === "GET") {
    const { data, error } = await client.from(config.table).select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) databaseError(error, `Could not read ${resource}`); if (!data) throw new ApiError(404, "NOT_FOUND", "Resource not found");
    return json(req, 200, { data }, requestId);
  }
  if (req.method === "PATCH") {
    const patch = config.patch.parse(await readJson(req));
    if (!Object.keys(patch).length) throw new ApiError(400, "EMPTY_PATCH", "At least one field is required");
    const { data, error } = await client.from(config.table).update(patch).eq("id", id).eq("user_id", userId).select().maybeSingle();
    if (error) databaseError(error, `Could not update ${resource}`); if (!data) throw new ApiError(404, "NOT_FOUND", "Resource not found");
    return json(req, 200, { data }, requestId);
  }
  if (req.method === "DELETE") {
    const { data, error } = await client.from(config.table).delete().eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (error) databaseError(error, `Could not delete ${resource}`); if (!data) throw new ApiError(404, "NOT_FOUND", "Resource not found");
    return noContent(req, requestId);
  }
  throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
}

async function summary(req: Request, client: SupabaseClient, url: URL, requestId: string) {
  assertQueryKeys(url, ["from", "to"]); const { from, to } = dateRange(url);
  const { data, error } = await client.rpc("get_financial_summary", { p_from: from, p_to: to });
  if (error) databaseError(error, "Could not calculate summary"); const row = data?.[0];
  return json(req, 200, { data: { from, to, income: Number(row?.income ?? 0), expense: Number(row?.expense ?? 0),
    balance: Number(row?.balance ?? 0), planned_income: Number(row?.planned_income ?? 0),
    planned_expense: Number(row?.planned_expense ?? 0), transaction_count: Number(row?.transaction_count ?? 0) } }, requestId);
}

async function budgetStatus(req: Request, client: SupabaseClient, url: URL, requestId: string) {
  assertQueryKeys(url, ["month"]); const month = isoDate.parse(url.searchParams.get("month"));
  if (!month.endsWith("-01")) throw new ApiError(400, "INVALID_MONTH", "month must be the first day of a month");
  const { data, error } = await client.rpc("get_budget_status", { p_month: month });
  if (error) databaseError(error, "Could not calculate budget status");
  return json(req, 200, { data: (data ?? []).map((row: Record<string, unknown>) => ({ ...row,
    base_amount: Number(row.base_amount), rollover_amount: Number(row.rollover_amount),
    effective_amount: Number(row.effective_amount), spent: Number(row.spent), remaining: Number(row.remaining)
  })) }, requestId);
}

async function notifications(req: Request, client: SupabaseClient, userId: string, rawId: string | undefined, url: URL, requestId: string) {
  if (!rawId && req.method === "GET") {
    assertQueryKeys(url, ["limit", "offset", "unread"]); const page = pagination(url);
    let query = client.from("notifications").select("*", { count: "exact" }).eq("user_id", userId)
      .order("created_at", { ascending: false }).range(page.offset, page.offset + page.limit - 1);
    if (url.searchParams.get("unread") === "true") query = query.is("read_at", null);
    const { data, error, count } = await query; if (error) databaseError(error, "Could not list notifications");
    return json(req, 200, { data, pagination: { ...page, total: count ?? 0 } }, requestId);
  }
  if (!rawId) throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
  const id = uuid.parse(rawId);
  if (req.method === "PATCH") {
    const patch = notificationPatch.parse(await readJson(req));
    const { data, error } = await client.from("notifications").update({ read_at: patch.read ? new Date().toISOString() : null })
      .eq("id", id).eq("user_id", userId).select().maybeSingle();
    if (error) databaseError(error, "Could not update notification"); if (!data) throw new ApiError(404, "NOT_FOUND", "Notification not found");
    return json(req, 200, { data }, requestId);
  }
  if (req.method === "DELETE") {
    const { data, error } = await client.from("notifications").delete().eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    if (error) databaseError(error, "Could not delete notification"); if (!data) throw new ApiError(404, "NOT_FOUND", "Notification not found");
    return noContent(req, requestId);
  }
  throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
}

async function exportTransactions(req: Request, client: SupabaseClient, userId: string, url: URL, requestId: string) {
  assertQueryKeys(url, ["from", "to", "format"]); const from = url.searchParams.get("from"); const to = url.searchParams.get("to");
  if (from && to && from > to) throw new ApiError(400, "INVALID_RANGE", "from must not be after to");
  let query = client.from("transactions").select("id,description,amount,kind,status,source,category_id,transaction_date,note,created_at")
    .eq("user_id", userId).order("transaction_date", { ascending: false }).limit(10000);
  if (from) query = query.gte("transaction_date", isoDate.parse(from)); if (to) query = query.lte("transaction_date", isoDate.parse(to));
  const { data, error } = await query; if (error) databaseError(error, "Could not export transactions");
  const format = url.searchParams.get("format") ?? "json"; if (format === "json") return json(req, 200, { data }, requestId);
  if (format !== "csv") throw new ApiError(400, "INVALID_FORMAT", "format must be json or csv");
  const columns = ["id", "description", "amount", "kind", "status", "source", "category_id", "transaction_date", "note", "created_at"];
  const csv = [columns.join(","), ...(data ?? []).map((row) => columns.map((column) => csvCell((row as Record<string, unknown>)[column])).join(","))].join("\r\n");
  const headers = new Headers(baseHeaders(req, requestId)); headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", "attachment; filename=nummi-transactions.csv");
  return new Response(`\uFEFF${csv}`, { status: 200, headers });
}

async function importTransactions(req: Request, client: SupabaseClient, userId: string, requestId: string) {
  const payload = importInput.parse(await readJson(req)); const rows = payload.transactions.map((item) => ({ ...item, user_id: userId, source: "import" }));
  const { data, error } = await client.from("transactions").upsert(rows, { onConflict: "user_id,idempotency_key", ignoreDuplicates: true }).select("id,idempotency_key");
  if (error) databaseError(error, "Could not import transactions");
  return json(req, 200, { data: { accepted: rows.length, inserted: data?.length ?? 0, duplicates: rows.length - (data?.length ?? 0) } }, requestId);
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID(); const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (!origin || !isAllowedOrigin(origin)) return new Response(JSON.stringify({ error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is not allowed" }, request_id: requestId }), { status: 403, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (origin && !isAllowedOrigin(origin)) return new Response(JSON.stringify({ error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is not allowed" }, request_id: requestId }), { status: 403, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  try {
    if (!URL || !PUBLISHABLE_KEY || !SERVICE_KEY) throw new ApiError(503, "MISCONFIGURED", "API is not configured");
    const url = new URL(req.url); const path = pathSegments(url); const { userId, client } = await authenticate(req);
    const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    await enforceRateLimit(admin, userId, `${req.method}:${path.slice(0, 2).join("/") || "health"}`, path[0] === "import" ? 10 : 120);
    if (!path.length || path[0] === "health") return json(req, 200, { data: { status: "ok", version: API_VERSION } }, requestId);
    if (path[0] === "snapshot" && req.method === "GET") return loadSnapshot(req, client, userId, url, requestId);
    if (path[0] === "profile") return singleton(req, client, userId, "profile", requestId);
    if (path[0] === "settings") return singleton(req, client, userId, "settings", requestId);
    if (path[0] === "transactions") return path[1] ? transactionItem(req, client, userId, path[1], requestId) : transactionCollection(req, client, userId, url, requestId);
    if (path[0] === "summary" && req.method === "GET") return summary(req, client, url, requestId);
    if (path[0] === "budgets" && path[1] === "status" && req.method === "GET") return budgetStatus(req, client, url, requestId);
    if (path[0] === "notifications") return notifications(req, client, userId, path[1], url, requestId);
    if (path[0] === "export" && path[1] === "transactions" && req.method === "GET") return exportTransactions(req, client, userId, url, requestId);
    if (path[0] === "import" && path[1] === "transactions" && req.method === "POST") return importTransactions(req, client, userId, requestId);
    if (path[0] === "automations" && path[1] === "post-due" && req.method === "POST") {
      const body = automationInput.parse(await readJson(req)); const { data, error } = await client.rpc("post_due_items", { p_through: body.through, p_max_occurrences: body.max_occurrences });
      if (error) databaseError(error, "Could not post due items");
      return json(req, 200, { data: data?.[0] ?? { transactions_created: 0, recurrences_advanced: 0, subscriptions_advanced: 0 } }, requestId);
    }
    if (["categories", "recurrences", "subscriptions", "budgets"].includes(path[0] ?? "")) return genericResource(req, client, userId, path[0] as Resource, path[1], url, requestId);
    throw new ApiError(404, "NOT_FOUND", "Route not found");
  } catch (error) {
    if (error instanceof z.ZodError) return fail(req, 400, "VALIDATION_ERROR", "Request validation failed", requestId, error.issues.map(({ path, message, code }) => ({ path, message, code })));
    if (error instanceof ApiError) return fail(req, error.status, error.code, error.message, requestId, error.details);
    console.error(JSON.stringify({ request_id: requestId, error: error instanceof Error ? error.message : "unknown" }));
    return fail(req, 500, "INTERNAL_ERROR", "Unexpected server error", requestId);
  }
});
