const endpoint = process.env.NUMMI_API_URL ?? "https://uqisolhdsvzjmdvohbki.supabase.co/functions/v1/api-v1/v1";
const unauthorized = await fetch(`${endpoint}/health`, { redirect:"manual" });
if (![401,403].includes(unauthorized.status)) throw new Error(`Health sem JWT retornou ${unauthorized.status}, esperado 401/403.`);
const evilOrigin = await fetch(`${endpoint}/health`, { method:"OPTIONS", headers:{ Origin:"https://evil.example", "Access-Control-Request-Method":"GET" }, redirect:"manual" });
if (![401,403].includes(evilOrigin.status)) throw new Error(`Preflight hostil retornou ${evilOrigin.status}, esperado 401/403.`);
console.log("API pública rejeitou acesso sem JWT e origem hostil.");
