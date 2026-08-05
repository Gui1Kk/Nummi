const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_TIMEZONE = "America/Porto_Velho";

export const formatCurrency = (value:number, currency="BRL", locale=DEFAULT_LOCALE) =>
  new Intl.NumberFormat(locale, { style:"currency", currency }).format(Number.isFinite(value) ? value : 0);

export const formatDate = (value:string, locale=DEFAULT_LOCALE) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(locale, { day:"2-digit", month:"short", year:"numeric", timeZone:"UTC" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
};

export const monthLabel = (month:string, locale=DEFAULT_LOCALE) => {
  const [year, rawMonth] = month.split("-").map(Number);
  if (!year || !rawMonth || rawMonth < 1 || rawMonth > 12) return month;
  const label = new Intl.DateTimeFormat(locale, { month:"long", year:"numeric", timeZone:"UTC" })
    .format(new Date(Date.UTC(year, rawMonth - 1, 1, 12)));
  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
};

function parts(date:Date, timezone:string) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year:"numeric", month:"2-digit", day:"2-digit"
  }).formatToParts(date);
  const get = (type:string) => values.find((part) => part.type === type)?.value ?? "00";
  return { year:get("year"), month:get("month"), day:get("day") };
}

export const todayIso = (timezone=DEFAULT_TIMEZONE, date=new Date()) => {
  const value = parts(date, timezone);
  return `${value.year}-${value.month}-${value.day}`;
};

export const monthKey = (date=new Date(), timezone=DEFAULT_TIMEZONE) => {
  const value = parts(date, timezone);
  return `${value.year}-${value.month}`;
};

export const monthStart = (month:string) => `${month}-01`;
export const monthEnd = (month:string) => {
  const [year, rawMonth] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, rawMonth ?? 1, 0, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2,"0")}-${String(date.getUTCDate()).padStart(2,"0")}`;
};
export const clamp = (value:number, min=0, max=100) => Math.min(max, Math.max(min, value));
export const errorMessage = (error:unknown, fallback="Não foi possível concluir a operação.") =>
  error instanceof Error && error.message ? error.message : fallback;
