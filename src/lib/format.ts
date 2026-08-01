export const formatCurrency = (value: number, currency = "BRL", locale = "pt-BR") => new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number.isFinite(value) ? value : 0);
export const formatDate = (value: string, locale = "pt-BR") => { const [year, month, day] = value.slice(0, 10).split("-").map(Number); if (!year || !month || !day) return value; return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(year, month - 1, day)); };
export const monthLabel = (month: string, locale = "pt-BR") => { const [year, rawMonth] = month.split("-").map(Number); if (!year || !rawMonth || rawMonth < 1 || rawMonth > 12) return month; const label = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(year, rawMonth - 1, 1)); return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1); };
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
export const monthStart = (month: string) => `${month}-01`;
export const monthEnd = (month: string) => { const [year, rawMonth] = month.split("-").map(Number); const date = new Date(year ?? 1970, rawMonth ?? 1, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
export const todayIso = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
export const errorMessage = (error: unknown, fallback = "Não foi possível concluir a operação.") => error instanceof Error && error.message ? error.message : fallback;
