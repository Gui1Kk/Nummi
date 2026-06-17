import type { ApiResult, FinanceData, User } from "../types";
import { emptyFinanceData } from "../utils";

const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL?.trim() || "";

const localDataKey = (username: string) => `finai:data:${username}`;
const localUsersKey = "finai:users";

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const requestRemote = async <T>(payload: Record<string, unknown>): Promise<ApiResult<T>> => {
  if (!scriptUrl) {
    return { status: "error", message: "Google Apps Script nao configurado.", source: "local" };
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  });

  const text = await response.text();
  try {
    return JSON.parse(text) as ApiResult<T>;
  } catch {
    return {
      status: "error",
      message: "O Apps Script respondeu algo que nao e JSON. Verifique o deploy /exec.",
      source: "remote"
    };
  }
};

const normalizeFinanceData = (data?: Partial<FinanceData>): FinanceData => ({
  transactions: Array.isArray(data?.transactions) ? data.transactions : [],
  investments: Array.isArray(data?.investments) ? data.investments : [],
  vouchers: Array.isArray(data?.vouchers) ? data.vouchers : [],
  goals: Array.isArray(data?.goals) ? data.goals : []
});

const loadLocalData = (username: string) => readJson(localDataKey(username), emptyFinanceData());

const saveLocalData = (username: string, data: FinanceData) => {
  writeJson(localDataKey(username), data);
};

export const hasRemoteBackend = Boolean(scriptUrl);

export const apiService = {
  async login(identifier: string, password: string): Promise<ApiResult<unknown>> {
    if (!identifier || !password) {
      return { status: "error", message: "Informe usuario/e-mail e senha." };
    }

    if (scriptUrl) {
      try {
        const remote = await requestRemote({ action: "login", username: identifier, password });
        if (remote.status === "success") return remote;
      } catch {
        // Fallback below keeps the app usable while the Apps Script is being redeployed.
      }
    }

    const users = readJson<Record<string, User>>(localUsersKey, {});
    const user = users[identifier] || { username: identifier };
    users[identifier] = user;
    writeJson(localUsersKey, users);
    return { status: "success", user, source: "local" };
  },

  async register(username: string, email: string, password: string): Promise<ApiResult<unknown>> {
    if (!username || !email || !password) {
      return { status: "error", message: "Informe usuario, e-mail e senha." };
    }

    if (scriptUrl) {
      try {
        const remote = await requestRemote({ action: "register", username, email, password });
        if (remote.status === "success") return remote;
      } catch {
        // Fallback below.
      }
    }

    const users = readJson<Record<string, User>>(localUsersKey, {});
    const user = { username, email };
    users[username] = user;
    writeJson(localUsersKey, users);
    return { status: "success", user, source: "local" };
  },

  async loadData(username: string): Promise<ApiResult<FinanceData>> {
    if (scriptUrl) {
      try {
        const remote = await requestRemote<FinanceData>({
          action: "load",
          username,
          page: 1,
          pageSize: 5000
        });
        if (remote.status === "success") {
          const data = normalizeFinanceData(remote.data);
          saveLocalData(username, data);
          return { status: "success", data, source: "remote" };
        }
      } catch {
        // Fallback below.
      }
    }

    return { status: "success", data: loadLocalData(username), source: "local" };
  },

  async saveData(username: string, data: FinanceData): Promise<ApiResult<FinanceData>> {
    saveLocalData(username, data);

    if (!scriptUrl) {
      return { status: "success", data, source: "local" };
    }

    try {
      const saves = await Promise.all([
        requestRemote({ action: "save", username, type: "transactions", data: data.transactions }),
        requestRemote({ action: "save", username, type: "investments", data: data.investments }),
        requestRemote({ action: "save", username, type: "vouchers", data: data.vouchers }),
        requestRemote({ action: "save", username, type: "goals", data: data.goals })
      ]);
      const failed = saves.find((item) => item.status !== "success");
      if (failed) return { status: "error", message: failed.message, data, source: "remote" };
      return { status: "success", data, source: "remote" };
    } catch {
      return {
        status: "error",
        message: "Dados salvos localmente, mas a sincronizacao com a nuvem falhou.",
        data,
        source: "local"
      };
    }
  },

  async requestAiInsight(username: string, prompt: string): Promise<ApiResult<{ text: string }>> {
    if (!scriptUrl) {
      return { status: "error", message: "IA remota nao configurada.", source: "local" };
    }

    try {
      const remote = await requestRemote<unknown>({ action: "ai", username, prompt });
      if (remote.status !== "success") return { status: "error", message: remote.message, source: "remote" };
      const data = remote.data as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = data?.text || data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return { status: "success", data: { text }, source: "remote" };
    } catch {
      return { status: "error", message: "Falha ao consultar IA remota.", source: "local" };
    }
  }
};
