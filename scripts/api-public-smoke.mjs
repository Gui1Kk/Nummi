const projectBase = "https://uqisolhdsvzjmdvohbki.supabase.co/functions/v1";
const endpoint = process.env.NUMMI_API_URL ?? `${projectBase}/api-v1/v1`;

async function request(path, init) {
  const response = await fetch(path, { redirect: "manual", ...init });
  const body = await response.text();
  return { response, body };
}

const unauthorized = await request(`${endpoint}/health`);
if (unauthorized.response.status !== 401) {
  throw new Error(
    `Health sem JWT retornou ${unauthorized.response.status}, esperado 401. Corpo: ${unauthorized.body.slice(0, 300)}`
  );
}

const evilOrigin = await request(`${endpoint}/health`, {
  method: "OPTIONS",
  headers: {
    Origin: "https://evil.example",
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization"
  }
});
if (evilOrigin.response.status !== 403) {
  throw new Error(
    `Preflight hostil retornou ${evilOrigin.response.status}, esperado 403. Corpo: ${evilOrigin.body.slice(0, 300)}`
  );
}
if (evilOrigin.response.headers.has("access-control-allow-origin")) {
  throw new Error("Origem hostil recebeu Access-Control-Allow-Origin.");
}

const allowedOrigin = "https://nummi.vercel.app";
const allowedPreflight = await request(`${endpoint}/health`, {
  method: "OPTIONS",
  headers: {
    Origin: allowedOrigin,
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization"
  }
});
if (allowedPreflight.response.status !== 204) {
  throw new Error(
    `Preflight permitido retornou ${allowedPreflight.response.status}, esperado 204. Corpo: ${allowedPreflight.body.slice(0, 300)}`
  );
}
if (allowedPreflight.response.headers.get("access-control-allow-origin") !== allowedOrigin) {
  throw new Error("Preflight permitido não devolveu a origem exata.");
}

for (const retired of ["build-diagnostics", "api-load-test"]) {
  const result = await request(`${projectBase}/${retired}`);
  if (result.response.status !== 401) {
    throw new Error(
      `Função aposentada ${retired} retornou ${result.response.status} sem JWT, esperado 401.`
    );
  }
}

console.log(
  "API pública: JWT ausente rejeitado, origem hostil bloqueada, origem oficial permitida e funções temporárias protegidas."
);
